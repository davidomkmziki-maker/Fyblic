-- Correction V220.1 : happyad_posts.id est de type text ; viewer_id reste uuid.
-- V220 : nouvelle source vérifiable. Aucun ancien compteur ni historique effacé.
BEGIN;
CREATE TABLE IF NOT EXISTS public.fyblic_unique_views_v220 (
  post_id text NOT NULL REFERENCES public.happyad_posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('central_video','listing')),
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, viewer_id, kind)
);
ALTER TABLE public.fyblic_unique_views_v220 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fyblic_unique_views_v220 FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS fyblic_views_v220_date ON public.fyblic_unique_views_v220(first_viewed_at);

CREATE OR REPLACE FUNCTION public.fyblic_is_video_v220(p jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
 SELECT lower(coalesce(p->>'media_type','') || ' ' || coalesce(p->>'type','') || ' ' || coalesce(p->>'marketplace_cover_type','')) LIKE '%video%'
   OR nullif(p->>'video_url','') IS NOT NULL
   OR coalesce(p->>'media_url','') ~* '\.(mp4|webm|mov|m3u8)([?].*)?$'
$$;

CREATE OR REPLACE FUNCTION public.fyblic_record_view_v220(p_post_id text, p_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u uuid := auth.uid(); p jsonb; n bigint;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING ERRCODE='42501'; END IF;
 IF p_kind NOT IN ('central_video','listing') THEN RAISE EXCEPTION 'Source invalide'; END IF;
 SELECT to_jsonb(t) INTO p FROM public.happyad_posts t WHERE t.id=p_post_id;
 IF p IS NULL OR nullif(p->>'deleted_at','') IS NOT NULL THEN RAISE EXCEPTION 'Publication indisponible'; END IF;
 IF p->>'user_id' IS DISTINCT FROM u::text AND
   (coalesce(p->>'is_private','false')='true' OR lower(coalesce(nullif(p->>'visibility',''),'public')) NOT IN ('public','everyone'))
 THEN RAISE EXCEPTION 'Publication privée' USING ERRCODE='42501'; END IF;
 IF p_kind='central_video' AND NOT public.fyblic_is_video_v220(p) THEN RAISE EXCEPTION 'Vidéo requise'; END IF;
 IF p_kind='listing' AND coalesce(p->>'happyad_marketplace','false')<>'true' THEN RAISE EXCEPTION 'Annonce requise'; END IF;
 INSERT INTO public.fyblic_unique_views_v220(post_id,viewer_id,kind)
 VALUES(p_post_id,u,p_kind) ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM public.fyblic_unique_views_v220 WHERE post_id=p_post_id AND kind=p_kind;
 RETURN jsonb_build_object('count',n);
END $$;
REVOKE ALL ON FUNCTION public.fyblic_record_view_v220(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_record_view_v220(text,text) TO authenticated;

-- p_ids absent : statistiques du compte connecté. Présent : compteurs publics
-- des cartes autorisées. Pas de liste de spectateurs exposée.
CREATE OR REPLACE FUNCTION public.fyblic_counts_v220(
 p_ids text[] DEFAULT NULL, p_start timestamptz DEFAULT NULL, p_end timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 WITH posts AS (
  SELECT t.id,to_jsonb(t) AS p,public.fyblic_is_video_v220(to_jsonb(t)) AS video
  FROM public.happyad_posts t
  WHERE (p_ids IS NOT NULL AND t.id=ANY(p_ids) OR p_ids IS NULL AND to_jsonb(t)->>'user_id'=auth.uid()::text)
    AND nullif(to_jsonb(t)->>'deleted_at','') IS NULL
    AND (to_jsonb(t)->>'user_id'=auth.uid()::text OR
      (coalesce(to_jsonb(t)->>'is_private','false')<>'true'
       AND lower(coalesce(nullif(to_jsonb(t)->>'visibility',''),'public')) IN ('public','everyone')))
 ), views AS (
  SELECT v.post_id,count(*) FILTER(WHERE kind='central_video') AS video_views,
    count(*) FILTER(WHERE kind='listing') AS listing_views
  FROM public.fyblic_unique_views_v220 v JOIN posts p ON p.id=v.post_id
  WHERE (p_start IS NULL OR v.first_viewed_at>=p_start) AND (p_end IS NULL OR v.first_viewed_at<p_end)
  GROUP BY v.post_id
 ), likes AS (
  SELECT a.post_id,count(DISTINCT a.user_id) AS n
  FROM public.happyad_content_actions a JOIN posts p ON p.id::text=a.post_id::text
  WHERE a.action_type='like' AND a.liked=true
    AND (p_start IS NULL OR a.created_at>=p_start) AND (p_end IS NULL OR a.created_at<p_end)
  GROUP BY a.post_id
 ), items AS (
  SELECT p.id, p.p->>'created_at' AS created,
   jsonb_build_object('id',p.id,'title',replace(coalesce(nullif(p.p->>'title',''),'Publication Fyblic'),'HAPPYAD','Fyblic'),
    'type',CASE WHEN p.video THEN 'video' ELSE 'photo' END,'isVideo',p.video,
    'createdAt',p.p->>'created_at',
    'thumbnail',coalesce(nullif(p.p->>'thumbnail_url',''),nullif(p.p->>'poster_url',''),nullif(p.p->>'marketplace_cover_url',''),nullif(p.p->>'image_url',''),CASE WHEN NOT p.video THEN p.p->>'media_url' END,''),
    'mediaSources',coalesce(nullif(p.p->>'video_url',''),nullif(p.p->>'media_url',''),p.p->>'image_url',''),
    'views',CASE WHEN p.video THEN coalesce(v.video_views,0) ELSE 0 END,
    'listingViews',coalesce(v.listing_views,0),'likes',coalesce(l.n,0)) AS item
  FROM posts p LEFT JOIN views v ON v.post_id=p.id LEFT JOIN likes l ON l.post_id::text=p.id::text
 )
 SELECT jsonb_build_object('items',coalesce(jsonb_agg(item ORDER BY created DESC),'[]'::jsonb),
   'views',coalesce(sum((item->>'views')::bigint),0),'likes',coalesce(sum((item->>'likes')::bigint),0),
   'listingViews',coalesce(sum((item->>'listingViews')::bigint),0)) FROM items
$$;
REVOKE ALL ON FUNCTION public.fyblic_counts_v220(text[],timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_counts_v220(text[],timestamptz,timestamptz) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
