-- FYBLIC V221 : migration additive. Exécuter APRES V220.1 (id des publications = text).
-- Ne supprime aucune ligne de V220, de happyad_video_views ou des compteurs historiques.
-- Une vidéo Boutique partage le compteur unique de la Centrale ; une annonce photo
-- est comptée uniquement à l'ouverture de « Voir l'annonce ».
BEGIN;

DO $$ BEGIN
  IF to_regclass('public.fyblic_unique_views_v220') IS NULL THEN
    RAISE EXCEPTION 'Exécutez d''abord FYBLIC_V220_VUES_UNIQUES.sql (version post_id text)';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.fyblic_is_video_v221(p jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT public.fyblic_is_video_v220(p)
   OR EXISTS (
     SELECT 1 FROM jsonb_array_elements(
       CASE WHEN jsonb_typeof(p->'marketplace_media')='array' THEN p->'marketplace_media'
            WHEN jsonb_typeof(p->'media')='array' THEN p->'media'
            ELSE '[]'::jsonb END) AS x(m)
     WHERE lower(coalesce(x.m->>'type','')||' '||coalesce(x.m->>'media_type','')||' '||coalesce(x.m->>'mime_type','')) LIKE '%video%'
       OR coalesce(x.m->>'src',x.m->>'url',x.m->>'media_url','') ~* '\.(mp4|webm|mov|m3u8)([?].*)?$'
   )
$$;

-- Première provenance réelle de la vue : une seule ligne par publication/compte.
CREATE TABLE IF NOT EXISTS public.fyblic_view_attribution_v221 (
 post_id text NOT NULL REFERENCES public.happyad_posts(id) ON DELETE CASCADE,
 viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 first_source text NOT NULL CHECK(first_source IN ('central_video','home_video','boutique_detail')),
 first_viewed_at timestamptz NOT NULL,
 PRIMARY KEY(post_id,viewer_id)
);
-- Passages par canal : utiles pour analyser les chemins de découverte mais NE S'AJOUTENT PAS aux vues uniques.
CREATE TABLE IF NOT EXISTS public.fyblic_view_routes_v221 (
 post_id text NOT NULL REFERENCES public.happyad_posts(id) ON DELETE CASCADE,
 viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('central_video','home_video','boutique_detail')),
 first_opened_at timestamptz NOT NULL DEFAULT now(),
 last_opened_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(post_id,viewer_id,source)
);
CREATE INDEX IF NOT EXISTS fyblic_views_v220_post_date_v221 ON public.fyblic_unique_views_v220(post_id,first_viewed_at);
CREATE INDEX IF NOT EXISTS fyblic_attribution_v221_date ON public.fyblic_view_attribution_v221(first_viewed_at);
CREATE INDEX IF NOT EXISTS fyblic_routes_v221_source ON public.fyblic_view_routes_v221(post_id,source);
ALTER TABLE public.fyblic_view_attribution_v221 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fyblic_view_routes_v221 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fyblic_view_attribution_v221,public.fyblic_view_routes_v221 FROM PUBLIC,anon,authenticated;

-- Pont historique : reprend les nouvelles lignes de l'ancien journal écrites
-- depuis la dernière migration V220.1, sans dupliquer les comptes existants.
INSERT INTO public.fyblic_unique_views_v220 AS current_views(post_id,viewer_id,kind,first_viewed_at)
SELECT v.post_id::text,v.viewer_id,'central_video',min(v.viewed_at)
FROM public.happyad_video_views v
JOIN public.happyad_posts p ON p.id=v.post_id::text
JOIN auth.users u ON u.id=v.viewer_id
WHERE v.viewed_at IS NOT NULL AND public.fyblic_is_video_v221(to_jsonb(p))
GROUP BY v.post_id,v.viewer_id
ON CONFLICT(post_id,viewer_id,kind) DO UPDATE SET
 first_viewed_at=LEAST(current_views.first_viewed_at,EXCLUDED.first_viewed_at);

-- Compatibilité avec les ANCIENNES installations encore en circulation :
-- chaque nouvelle lecture ajoutée au vieux journal entre dans le registre unique.
CREATE OR REPLACE FUNCTION public.fyblic_legacy_view_bridge_v221()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE pp jsonb;
BEGIN
 IF NEW.viewer_id IS NULL OR NEW.viewed_at IS NULL THEN RETURN NEW; END IF;
 SELECT to_jsonb(p) INTO pp FROM public.happyad_posts p WHERE p.id=NEW.post_id::text;
 IF pp IS NULL OR NOT public.fyblic_is_video_v221(pp) THEN RETURN NEW; END IF;
 INSERT INTO public.fyblic_unique_views_v220 AS existing(post_id,viewer_id,kind,first_viewed_at)
 VALUES(NEW.post_id::text,NEW.viewer_id,'central_video',NEW.viewed_at)
 ON CONFLICT(post_id,viewer_id,kind) DO UPDATE SET
  first_viewed_at=LEAST(existing.first_viewed_at,EXCLUDED.first_viewed_at);
 INSERT INTO public.fyblic_view_attribution_v221(post_id,viewer_id,first_source,first_viewed_at)
 VALUES(NEW.post_id::text,NEW.viewer_id,'central_video',NEW.viewed_at)
 ON CONFLICT(post_id,viewer_id) DO NOTHING;
 INSERT INTO public.fyblic_view_routes_v221(post_id,viewer_id,source,first_opened_at,last_opened_at)
 VALUES(NEW.post_id::text,NEW.viewer_id,'central_video',NEW.viewed_at,NEW.viewed_at)
 ON CONFLICT(post_id,viewer_id,source) DO UPDATE SET
  last_opened_at=GREATEST(fyblic_view_routes_v221.last_opened_at,EXCLUDED.last_opened_at);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fyblic_legacy_view_bridge_v221 ON public.happyad_video_views;
CREATE TRIGGER fyblic_legacy_view_bridge_v221
 AFTER INSERT ON public.happyad_video_views
 FOR EACH ROW EXECUTE FUNCTION public.fyblic_legacy_view_bridge_v221();

-- Reprise des deux origines V220, en masse et sans effacer le passé.
INSERT INTO public.fyblic_view_attribution_v221(post_id,viewer_id,first_source,first_viewed_at)
SELECT DISTINCT ON (v.post_id,v.viewer_id) v.post_id,v.viewer_id,
 CASE WHEN v.kind='listing' THEN 'boutique_detail' ELSE 'central_video' END,v.first_viewed_at
FROM public.fyblic_unique_views_v220 v
ORDER BY v.post_id,v.viewer_id,v.first_viewed_at,v.kind
ON CONFLICT(post_id,viewer_id) DO UPDATE SET
 first_source=CASE WHEN EXCLUDED.first_viewed_at < fyblic_view_attribution_v221.first_viewed_at THEN EXCLUDED.first_source ELSE fyblic_view_attribution_v221.first_source END,
 first_viewed_at=LEAST(EXCLUDED.first_viewed_at,fyblic_view_attribution_v221.first_viewed_at);

INSERT INTO public.fyblic_view_routes_v221(post_id,viewer_id,source,first_opened_at,last_opened_at)
SELECT v.post_id,v.viewer_id,CASE WHEN v.kind='listing' THEN 'boutique_detail' ELSE 'central_video' END,
 min(v.first_viewed_at),min(v.first_viewed_at)
FROM public.fyblic_unique_views_v220 v
GROUP BY v.post_id,v.viewer_id,v.kind
ON CONFLICT(post_id,viewer_id,source) DO UPDATE SET
 first_opened_at=LEAST(fyblic_view_routes_v221.first_opened_at,EXCLUDED.first_opened_at),
 last_opened_at=GREATEST(fyblic_view_routes_v221.last_opened_at,EXCLUDED.last_opened_at);

CREATE OR REPLACE FUNCTION public.fyblic_record_view_v221(p_post_id text,p_source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 u uuid:=auth.uid(); p jsonb; is_video boolean; is_market boolean; n bigint;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING ERRCODE='42501'; END IF;
 IF p_post_id IS NULL OR btrim(p_post_id)='' THEN RAISE EXCEPTION 'Publication manquante'; END IF;
 IF p_source NOT IN ('central_video','home_video','boutique_detail') OR p_source IS NULL THEN RAISE EXCEPTION 'Origine invalide'; END IF;
 SELECT to_jsonb(t) INTO p FROM public.happyad_posts t WHERE t.id=p_post_id;
 IF p IS NULL OR nullif(p->>'deleted_at','') IS NOT NULL THEN RAISE EXCEPTION 'Publication indisponible'; END IF;
 IF p->>'user_id' IS DISTINCT FROM u::text AND
    (coalesce(p->>'is_private','false')='true' OR lower(coalesce(nullif(p->>'visibility',''),'public')) NOT IN ('public','everyone'))
 THEN RAISE EXCEPTION 'Publication privée' USING ERRCODE='42501'; END IF;
 is_video:=public.fyblic_is_video_v221(p);
 is_market:=coalesce(p->>'happyad_marketplace','false')='true' OR coalesce(p->>'is_marketplace','false')='true';
 IF p_source='boutique_detail' AND NOT is_market THEN RAISE EXCEPTION 'Annonce requise'; END IF;
 IF p_source<>'boutique_detail' AND NOT is_video THEN RAISE EXCEPTION 'Vidéo requise'; END IF;
 -- Le registre V220 reste la source des comptes distincts. Les anciens « listing »
 -- vidéos sont conservés ; COUNT(DISTINCT viewer_id) réconcilie les deux types.
 INSERT INTO public.fyblic_unique_views_v220(post_id,viewer_id,kind)
 VALUES(p_post_id,u,CASE WHEN is_video THEN 'central_video' ELSE 'listing' END)
 ON CONFLICT DO NOTHING;
 INSERT INTO public.fyblic_view_attribution_v221(post_id,viewer_id,first_source,first_viewed_at)
 VALUES(p_post_id,u,p_source,now()) ON CONFLICT DO NOTHING;
 INSERT INTO public.fyblic_view_routes_v221(post_id,viewer_id,source)
 VALUES(p_post_id,u,p_source)
 ON CONFLICT(post_id,viewer_id,source) DO UPDATE SET last_opened_at=now();
 SELECT count(DISTINCT v.viewer_id) INTO n FROM public.fyblic_unique_views_v220 v
 WHERE v.post_id=p_post_id AND (is_video OR v.kind='listing');
 RETURN jsonb_build_object('count',n,'views',n,'listingViews',CASE WHEN is_market THEN n ELSE 0 END,
   'isVideo',is_video,'source',p_source,'unique',true);
END $$;
REVOKE ALL ON FUNCTION public.fyblic_record_view_v221(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_record_view_v221(text,text) TO authenticated;

-- Statistiques EN MASSE : groupe tous les spectateurs par publication/compte,
-- puis agrège les publications. Un même compte présent sur 2 canaux = 1 vue.
CREATE OR REPLACE FUNCTION public.fyblic_counts_v221(
 p_ids text[] DEFAULT NULL,p_start timestamptz DEFAULT NULL,p_end timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
WITH posts AS MATERIALIZED (
 SELECT t.id,to_jsonb(t) p,public.fyblic_is_video_v221(to_jsonb(t)) video,
   (coalesce(to_jsonb(t)->>'happyad_marketplace','false')='true' OR coalesce(to_jsonb(t)->>'is_marketplace','false')='true') market
 FROM public.happyad_posts t
 WHERE ((p_ids IS NOT NULL AND t.id=ANY(p_ids)) OR (p_ids IS NULL AND to_jsonb(t)->>'user_id'=auth.uid()::text))
   AND nullif(to_jsonb(t)->>'deleted_at','') IS NULL
   AND (to_jsonb(t)->>'user_id'=auth.uid()::text OR
       (coalesce(to_jsonb(t)->>'is_private','false')<>'true' AND
        lower(coalesce(nullif(to_jsonb(t)->>'visibility',''),'public')) IN ('public','everyone')))
), earliest AS (
 SELECT v.post_id,v.viewer_id,min(v.first_viewed_at) first_viewed_at
 FROM public.fyblic_unique_views_v220 v JOIN posts p ON p.id=v.post_id
 WHERE p.video OR (p.market AND v.kind='listing')
 GROUP BY v.post_id,v.viewer_id
), views AS (
 SELECT e.post_id,count(*) n FROM earliest e
 WHERE (p_start IS NULL OR e.first_viewed_at >=p_start) AND (p_end IS NULL OR e.first_viewed_at <p_end)
 GROUP BY e.post_id
), origins AS (
 SELECT a.post_id,
 count(*) FILTER(WHERE a.first_source='central_video') central,
 count(*) FILTER(WHERE a.first_source='home_video') home,
 count(*) FILTER(WHERE a.first_source='boutique_detail') boutique
 FROM public.fyblic_view_attribution_v221 a JOIN posts p ON p.id=a.post_id
 WHERE (p_start IS NULL OR a.first_viewed_at>=p_start) AND (p_end IS NULL OR a.first_viewed_at<p_end)
 GROUP BY a.post_id
), actions AS (
 SELECT a.post_id::text post_id,
 count(DISTINCT a.user_id) FILTER(WHERE a.action_type='like' AND a.liked=true) likes,
 count(DISTINCT a.user_id) FILTER(WHERE a.action_type IN ('favorite','fav','save') AND a.liked=true) saves,
 count(*) FILTER(WHERE a.action_type='share' AND a.liked=true) shares,
 count(*) FILTER(WHERE a.action_type='repost' AND a.liked=true) reposts
 FROM public.happyad_content_actions a JOIN posts p ON p.id=a.post_id::text
 WHERE (p_start IS NULL OR a.created_at>=p_start) AND (p_end IS NULL OR a.created_at<p_end)
 GROUP BY a.post_id
), comments AS (
 SELECT COALESCE(NULLIF(to_jsonb(c)->>'post_id',''),to_jsonb(c)->>'content_id') post_id,count(*) n
 FROM public.happyad_content_comments c
 JOIN posts p ON p.id=COALESCE(NULLIF(to_jsonb(c)->>'post_id',''),to_jsonb(c)->>'content_id')
 WHERE nullif(to_jsonb(c)->>'deleted_at','') IS NULL
   AND (p_start IS NULL OR nullif(to_jsonb(c)->>'created_at','')::timestamptz>=p_start)
   AND (p_end IS NULL OR nullif(to_jsonb(c)->>'created_at','')::timestamptz<p_end)
 GROUP BY 1
), items AS (
 SELECT p.id,p.p->>'created_at' created,
  jsonb_build_object(
   'id',p.id,'title',replace(coalesce(nullif(p.p->>'title',''),'Publication Fyblic'),'HAPPYAD','Fyblic'),
   'type',CASE WHEN p.video THEN 'video' ELSE 'photo' END,'isVideo',p.video,'isMarketplace',p.market,
   'createdAt',p.p->>'created_at',
   'thumbnail',coalesce(nullif(p.p->>'thumbnail_url',''),nullif(p.p->>'poster_url',''),nullif(p.p->>'marketplace_cover_url',''),nullif(p.p->>'image_url',''),CASE WHEN NOT p.video THEN p.p->>'media_url' END,''),
   'mediaSources',coalesce(nullif(p.p->>'video_url',''),nullif(p.p->>'media_url',''),p.p->>'image_url',''),
   'views',coalesce(v.n,0),'videoViews',CASE WHEN p.video THEN coalesce(v.n,0) ELSE 0 END,
   'listingViews',CASE WHEN p.market THEN coalesce(v.n,0) ELSE 0 END,
   'photoViews',CASE WHEN p.market AND NOT p.video THEN coalesce(v.n,0) ELSE 0 END,
   'originCentral',coalesce(o.central,0),'originHome',coalesce(o.home,0),'originBoutique',coalesce(o.boutique,0),
   'likes',coalesce(a.likes,0),'comments',coalesce(c.n,0),'shares',coalesce(a.shares,0),
   'saves',coalesce(a.saves,0),'reposts',coalesce(a.reposts,0)) item
 FROM posts p LEFT JOIN views v ON v.post_id=p.id
 LEFT JOIN origins o ON o.post_id=p.id
 LEFT JOIN actions a ON a.post_id=p.id
 LEFT JOIN comments c ON c.post_id=p.id
)
SELECT jsonb_build_object('items',coalesce(jsonb_agg(item ORDER BY created DESC),'[]'::jsonb),
 'views',coalesce(sum((item->>'views')::bigint),0),
 'videoViews',coalesce(sum((item->>'videoViews')::bigint),0),
 'listingViews',coalesce(sum((item->>'listingViews')::bigint),0),
 'photoViews',coalesce(sum((item->>'photoViews')::bigint),0),
 'originCentral',coalesce(sum((item->>'originCentral')::bigint),0),
 'originHome',coalesce(sum((item->>'originHome')::bigint),0),
 'originBoutique',coalesce(sum((item->>'originBoutique')::bigint),0),
 'likes',coalesce(sum((item->>'likes')::bigint),0),
 'comments',coalesce(sum((item->>'comments')::bigint),0),
 'shares',coalesce(sum((item->>'shares')::bigint),0),
 'saves',coalesce(sum((item->>'saves')::bigint),0),
 'reposts',coalesce(sum((item->>'reposts')::bigint),0)) FROM items
$$;
REVOKE ALL ON FUNCTION public.fyblic_counts_v221(text[],timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fyblic_counts_v221(text[],timestamptz,timestamptz) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

-- DIAGNOSTIC : lecture seule, utilisable dans SQL Editor (sans auth.uid()).
-- Sur une annonce vidéo, le compteur commun attendu est « vues_uniques ».
-- Les deux colonnes anciennes sont des sources historiques, PAS des totaux à additionner.
SELECT v.post_id,
 count(DISTINCT v.viewer_id) AS vues_uniques,
 count(DISTINCT v.viewer_id) FILTER(WHERE v.kind='central_video') AS historique_centrale,
 count(DISTINCT v.viewer_id) FILTER(WHERE v.kind='listing') AS historique_boutique
FROM public.fyblic_unique_views_v220 v
JOIN public.happyad_posts p ON p.id=v.post_id
WHERE public.fyblic_is_video_v221(to_jsonb(p))
GROUP BY v.post_id
ORDER BY vues_uniques DESC LIMIT 30;
