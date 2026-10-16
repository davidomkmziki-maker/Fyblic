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
 ), canonical AS (
  SELECT v.post_id,v.viewer_id,
   CASE WHEN p.video AND p.p->>'happyad_marketplace'='true' THEN 'unified_video' ELSE v.kind END AS kind,
   min(v.first_viewed_at) AS first_viewed_at
  FROM public.fyblic_unique_views_v220 v JOIN posts p ON p.id=v.post_id
  GROUP BY v.post_id,v.viewer_id,CASE WHEN p.video AND p.p->>'happyad_marketplace'='true' THEN 'unified_video' ELSE v.kind END
 ), views AS (
  SELECT v.post_id,count(*) FILTER(WHERE kind IN ('central_video','unified_video')) AS video_views,
    count(*) FILTER(WHERE kind IN ('listing','unified_video')) AS listing_views
  FROM canonical v
  WHERE (p_start IS NULL OR v.first_viewed_at>=p_start) AND (p_end IS NULL OR v.first_viewed_at<p_end)
  GROUP BY v.post_id
 ), likes AS (
  SELECT a.post_id,count(DISTINCT a.user_id) FILTER(WHERE a.action_type='like') AS n,
   count(DISTINCT a.user_id) FILTER(WHERE a.action_type='favorite') AS saves,
   count(DISTINCT a.user_id) FILTER(WHERE a.action_type='repost') AS reposts
  FROM public.happyad_content_actions a JOIN posts p ON p.id::text=a.post_id::text
  WHERE a.action_type IN ('like','favorite','repost') AND a.liked=true
    AND (p_start IS NULL OR a.created_at>=p_start) AND (p_end IS NULL OR a.created_at<p_end)
  GROUP BY a.post_id
 ), comments AS (
  SELECT p.id,count(*) AS n FROM public.happyad_content_comments c JOIN posts p
   ON p.id=coalesce(nullif(to_jsonb(c)->>'post_id',''),to_jsonb(c)->>'content_id')
  WHERE nullif(to_jsonb(c)->>'deleted_at','') IS NULL
   AND coalesce(to_jsonb(c)->>'is_deleted','false')<>'true'
   AND (p_start IS NULL OR c.created_at>=p_start) AND (p_end IS NULL OR c.created_at<p_end)
  GROUP BY p.id
 ), items AS (
  SELECT p.id, p.p->>'created_at' AS created,
   jsonb_build_object('id',p.id,'title',replace(coalesce(nullif(p.p->>'title',''),'Publication Fyblic'),'HAPPYAD','Fyblic'),
    'type',CASE WHEN p.video THEN 'video' ELSE 'photo' END,'isVideo',p.video,
    'createdAt',p.p->>'created_at',
    'thumbnail',coalesce(nullif(p.p->>'thumbnail_url',''),nullif(p.p->>'poster_url',''),nullif(p.p->>'marketplace_cover_url',''),nullif(p.p->>'image_url',''),CASE WHEN NOT p.video THEN p.p->>'media_url' END,''),
    'mediaSources',coalesce(nullif(p.p->>'video_url',''),nullif(p.p->>'media_url',''),p.p->>'image_url',''),
    'views',CASE WHEN p.video THEN coalesce(v.video_views,0) ELSE 0 END,
    'listingViews',coalesce(v.listing_views,0),'likes',coalesce(l.n,0),
    'comments',coalesce(c.n,0),'saves',coalesce(l.saves,0),'reposts',coalesce(l.reposts,0),
    'shares',CASE WHEN p_start IS NULL AND p_end IS NULL THEN coalesce(nullif(p.p->>'shares_count','')::bigint,0) ELSE NULL END,
    'reach',CASE WHEN p.video THEN coalesce(v.video_views,0) WHEN p.p->>'happyad_marketplace'='true' THEN coalesce(v.listing_views,0) ELSE NULL END,
    'interactions',CASE WHEN p_start IS NULL AND p_end IS NULL THEN coalesce(l.n,0)+coalesce(c.n,0)+coalesce(l.saves,0)+coalesce(l.reposts,0)+coalesce(nullif(p.p->>'shares_count','')::bigint,0) ELSE NULL END,
    'breakdownResolved',true) AS item
  FROM posts p LEFT JOIN views v ON v.post_id=p.id LEFT JOIN likes l ON l.post_id::text=p.id::text LEFT JOIN comments c ON c.id=p.id
 )
 SELECT jsonb_build_object('items',coalesce(jsonb_agg(item ORDER BY created DESC),'[]'::jsonb),
   'views',coalesce(sum((item->>'views')::bigint),0),'likes',coalesce(sum((item->>'likes')::bigint),0),
   'listingViews',coalesce(sum((item->>'listingViews')::bigint),0),
   'comments',coalesce(sum((item->>'comments')::bigint),0),'saves',coalesce(sum((item->>'saves')::bigint),0),
   'reposts',coalesce(sum((item->>'reposts')::bigint),0),
   'shares',sum((item->>'shares')::bigint),'interactions',sum((item->>'interactions')::bigint),
   'reach',(SELECT count(DISTINCT viewer_id) FROM canonical WHERE (p_start IS NULL OR first_viewed_at>=p_start) AND (p_end IS NULL OR first_viewed_at<p_end))) FROM items
$$;
REVOKE ALL ON FUNCTION public.fyblic_counts_v220(text[],timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_counts_v220(text[],timestamptz,timestamptz) TO anon, authenticated;


-- V221: compatible avec V220; aucune remise à zéro ni suppression d'historique.
-- Verrou pendant la fusion pour éviter une écriture V220 entre les deux compteurs.
LOCK TABLE public.fyblic_unique_views_v220 IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.fyblic_unique_views_v220
 ADD COLUMN IF NOT EXISTS first_source text NOT NULL DEFAULT 'legacy_unknown',
 ADD COLUMN IF NOT EXISTS first_platform text NOT NULL DEFAULT 'unknown';

-- Observations par surface, indépendantes du compteur unique.
-- Une ouverture d'annonce n'est PAS une preuve de visionnage monétisable.
CREATE TABLE IF NOT EXISTS public.fyblic_view_sources_v221 (
 post_id text NOT NULL REFERENCES public.happyad_posts(id) ON DELETE CASCADE,
 viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('central_video','listing_detail','legacy_unknown')),
 platform text NOT NULL CHECK(platform IN ('android','web','unknown')),
 event_type text NOT NULL CHECK(event_type IN ('playback_started','listing_opened','legacy_unknown')),
 first_observed_at timestamptz NOT NULL DEFAULT now(),
 evidence text NOT NULL DEFAULT 'client_reported' CHECK(evidence IN ('client_reported','legacy_unknown')),
 PRIMARY KEY(post_id,viewer_id,source,platform)
);
ALTER TABLE public.fyblic_view_sources_v221 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fyblic_view_sources_v221 FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS fyblic_view_sources_v221_date ON public.fyblic_view_sources_v221(first_observed_at);
COMMENT ON TABLE public.fyblic_view_sources_v221 IS
 'Provenances déclarées par les clients; ne prouve ni durée regardée ni éligibilité monétaire. Jamais sommer ces lignes pour le compteur public.';

INSERT INTO public.fyblic_view_sources_v221(post_id,viewer_id,source,platform,event_type,first_observed_at,evidence)
 SELECT post_id,viewer_id,'legacy_unknown','unknown','legacy_unknown',min(first_viewed_at),'legacy_unknown'
 FROM public.fyblic_unique_views_v220 WHERE first_source='legacy_unknown'
 GROUP BY post_id,viewer_id
ON CONFLICT DO NOTHING;

-- Union des comptes, jamais somme des deux anciens compteurs. Dates anciennes conservées.
WITH firsts AS (
 SELECT DISTINCT ON(v.post_id,v.viewer_id) v.*
 FROM public.fyblic_unique_views_v220 v JOIN public.happyad_posts p ON p.id=v.post_id
 WHERE public.fyblic_is_video_v220(to_jsonb(p)) AND to_jsonb(p)->>'happyad_marketplace'='true'
 ORDER BY v.post_id,v.viewer_id,v.first_viewed_at,v.kind
)
INSERT INTO public.fyblic_unique_views_v220 AS current(post_id,viewer_id,kind,first_viewed_at,first_source,first_platform)
 SELECT f.post_id,f.viewer_id,k.kind,f.first_viewed_at,f.first_source,f.first_platform
 FROM firsts f CROSS JOIN (VALUES('central_video'),('listing')) k(kind)
ON CONFLICT(post_id,viewer_id,kind) DO UPDATE SET
 first_source=CASE WHEN EXCLUDED.first_viewed_at<current.first_viewed_at THEN EXCLUDED.first_source ELSE current.first_source END,
 first_platform=CASE WHEN EXCLUDED.first_viewed_at<current.first_viewed_at THEN EXCLUDED.first_platform ELSE current.first_platform END,
 first_viewed_at=LEAST(current.first_viewed_at,EXCLUDED.first_viewed_at);

CREATE OR REPLACE FUNCTION public.fyblic_record_view_v221(p_post_id text,p_source text,p_platform text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=auth.uid(); p jsonb; video boolean; listing boolean; nv bigint; nl bigint;
 stamp timestamptz:=clock_timestamp(); origin text; device text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING ERRCODE='42501'; END IF;
 IF p_source IS NULL OR p_source NOT IN ('central_video','listing_detail') THEN RAISE EXCEPTION 'Source invalide'; END IF;
 IF p_platform IS NULL OR p_platform NOT IN ('android','web','unknown') THEN RAISE EXCEPTION 'Plateforme invalide'; END IF;
 SELECT to_jsonb(t) INTO p FROM public.happyad_posts t WHERE t.id=p_post_id;
 IF p IS NULL OR nullif(p->>'deleted_at','') IS NOT NULL THEN RAISE EXCEPTION 'Publication indisponible'; END IF;
 IF p->>'user_id' IS DISTINCT FROM u::text AND
  (coalesce(p->>'is_private','false')='true' OR lower(coalesce(nullif(p->>'visibility',''),'public')) NOT IN ('public','everyone'))
 THEN RAISE EXCEPTION 'Publication privée' USING ERRCODE='42501'; END IF;
 video:=public.fyblic_is_video_v220(p); listing:=coalesce(p->>'happyad_marketplace','false')='true';
 IF p_source='central_video' AND NOT video THEN RAISE EXCEPTION 'Vidéo requise'; END IF;
 IF p_source='listing_detail' AND NOT listing THEN RAISE EXCEPTION 'Annonce requise'; END IF;
 -- Sérialisation par publication/compte : appels simultanés web + Android sans doublon/deadlock.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_post_id||':'||u::text,221));
 INSERT INTO public.fyblic_view_sources_v221(post_id,viewer_id,source,platform,event_type,first_observed_at)
 VALUES(p_post_id,u,p_source,p_platform,CASE WHEN p_source='central_video' THEN 'playback_started' ELSE 'listing_opened' END,stamp)
 ON CONFLICT DO NOTHING;
 origin:=p_source; device:=p_platform;
 IF video AND listing THEN
  SELECT v.first_viewed_at,v.first_source,v.first_platform INTO stamp,origin,device
  FROM public.fyblic_unique_views_v220 v WHERE v.post_id=p_post_id AND v.viewer_id=u
  ORDER BY v.first_viewed_at,v.kind LIMIT 1;
  IF NOT FOUND THEN stamp:=clock_timestamp();origin:=p_source;device:=p_platform; END IF;
  INSERT INTO public.fyblic_unique_views_v220 AS current(post_id,viewer_id,kind,first_viewed_at,first_source,first_platform)
  VALUES(p_post_id,u,'central_video',stamp,origin,device),(p_post_id,u,'listing',stamp,origin,device)
  ON CONFLICT(post_id,viewer_id,kind) DO UPDATE SET
   first_source=CASE WHEN EXCLUDED.first_viewed_at<current.first_viewed_at THEN EXCLUDED.first_source ELSE current.first_source END,
   first_platform=CASE WHEN EXCLUDED.first_viewed_at<current.first_viewed_at THEN EXCLUDED.first_platform ELSE current.first_platform END,
   first_viewed_at=LEAST(current.first_viewed_at,EXCLUDED.first_viewed_at);
 ELSE
  INSERT INTO public.fyblic_unique_views_v220(post_id,viewer_id,kind,first_viewed_at,first_source,first_platform)
  VALUES(p_post_id,u,CASE WHEN video THEN 'central_video' ELSE 'listing' END,stamp,origin,device)
  ON CONFLICT DO NOTHING;
 END IF;
 SELECT count(DISTINCT viewer_id) FILTER(WHERE kind='central_video' OR (video AND listing)),count(DISTINCT viewer_id) FILTER(WHERE kind='listing' OR (video AND listing)) INTO nv,nl
 FROM public.fyblic_unique_views_v220 WHERE post_id=p_post_id;
 RETURN jsonb_build_object('id',p_post_id,'count',CASE WHEN p_source='central_video' THEN nv ELSE nl END,
  'views',CASE WHEN video THEN nv ELSE 0 END,'listingViews',nl,'isVideo',video,'isListing',listing);
END $$;
REVOKE ALL ON FUNCTION public.fyblic_record_view_v221(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_record_view_v221(text,text,text) TO authenticated;

-- Les clients V220 suivent également la nouvelle règle, sans changer leur signature RPC.
CREATE OR REPLACE FUNCTION public.fyblic_record_view_v220(p_post_id text,p_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('central_video','listing') THEN RAISE EXCEPTION 'Source invalide'; END IF;
 RETURN public.fyblic_record_view_v221(p_post_id,CASE WHEN p_kind='listing' THEN 'listing_detail' ELSE 'central_video' END,'unknown');
END $$;
REVOKE ALL ON FUNCTION public.fyblic_record_view_v220(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_record_view_v220(text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

-- Résultat de contrôle à partager si un ancien script semble encore interférer.
SELECT 'V221' AS version_compteurs,
 (SELECT count(DISTINCT (post_id,viewer_id)) FROM public.fyblic_unique_views_v220 WHERE kind='central_video') AS vues_video_uniques,
 (SELECT count(*) FROM public.fyblic_view_sources_v221 WHERE source<>'legacy_unknown') AS provenances_connues,
 (SELECT coalesce(jsonb_agg(p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'),'[]'::jsonb)
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND (p.proname LIKE 'fyblic_%view%' OR p.proname LIKE 'fyblic_counts_%' OR p.proname LIKE 'happyad_%view%')) AS fonctions_de_vues_presentes,
 (SELECT coalesce(jsonb_agg(t.tgname),'[]'::jsonb) FROM pg_trigger t
  WHERE NOT t.tgisinternal AND t.tgrelid IN ('public.happyad_posts'::regclass,'public.fyblic_unique_views_v220'::regclass)) AS declencheurs_presents;
