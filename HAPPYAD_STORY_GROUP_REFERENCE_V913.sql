-- HAPPYAD V913 — Fondation additive: publication groupée -> Story
-- Point 2 uniquement. V912 doit déjà être appliqué.
-- Aucun média n'est copié; seuls les identifiants originaux du groupe sont mémorisés.

begin;

alter table public.happyad_stories
  add column if not exists source_post_grouped boolean not null default false,
  add column if not exists source_post_group_count integer,
  add column if not exists source_post_group_ids jsonb;

alter table public.happyad_stories
  drop constraint if exists happyad_stories_source_post_group_count_check;

alter table public.happyad_stories
  add constraint happyad_stories_source_post_group_count_check
  check (source_post_group_count is null or (source_post_group_count >= 1 and source_post_group_count <= 40));

create index if not exists happyad_stories_source_post_grouped_idx
  on public.happyad_stories (source_post_grouped)
  where source_post_grouped = true;

comment on column public.happyad_stories.source_post_group_ids is
  'IDs ordonnés des médias/posts originaux d’une publication groupée partagée dans une Story; aucun média dupliqué.';

commit;
