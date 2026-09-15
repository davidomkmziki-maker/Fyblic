-- HAPPYAD V899 — Réponses Story : source canonique des Paramètres
-- Lit uniquement privacy.storyReplies du propriétaire sans exposer les autres réglages.
begin;

create or replace function public.happyad_story_replies_allowed_v899(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select case
        when s.privacy ? 'storyReplies'
          then coalesce((s.privacy ->> 'storyReplies')::boolean, true)
        else true
      end
      from public.happyad_user_settings as s
      where s.user_id = p_owner
      limit 1
    ),
    true
  );
$$;

revoke all on function public.happyad_story_replies_allowed_v899(uuid) from public;
grant execute on function public.happyad_story_replies_allowed_v899(uuid) to authenticated;

comment on function public.happyad_story_replies_allowed_v899(uuid)
is 'HAPPYAD V899: retourne uniquement le réglage privacy.storyReplies du propriétaire.';

commit;
