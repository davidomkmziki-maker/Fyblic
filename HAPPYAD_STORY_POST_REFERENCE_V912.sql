-- HAPPYAD V912 — Fondation additive: publication normale -> Story
-- Point 1 uniquement. Aucune colonne existante n'est modifiee ni supprimee.

begin;

alter table public.happyad_stories
  add column if not exists source_post_id text,
  add column if not exists source_post_media_type text,
  add column if not exists source_post_owner_id text,
  add column if not exists source_post_title text,
  add column if not exists source_post_author_name text,
  add column if not exists source_post_author_avatar text,
  add column if not exists source_post_caption text;

create index if not exists happyad_stories_source_post_id_idx
  on public.happyad_stories (source_post_id)
  where source_post_id is not null;

comment on column public.happyad_stories.source_post_id is
  'Publication HAPPYAD originale referencee par une Story partagee; media non duplique.';

commit;
