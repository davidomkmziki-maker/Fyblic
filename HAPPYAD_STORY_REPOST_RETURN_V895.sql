-- HAPPYAD V895 — Point 2B : A -> B -> A puis STOP
-- À exécuter après la fondation V888. Additif : aucune colonne existante n'est supprimée.

begin;

alter table public.happyad_stories
  add column if not exists origin_story_id uuid,
  add column if not exists origin_story_owner_id text,
  add column if not exists origin_story_author_name text,
  add column if not exists origin_story_author_username text,
  add column if not exists origin_story_author_avatar text,
  add column if not exists origin_story_author_badge text;

create index if not exists happyad_stories_origin_story_id_idx
  on public.happyad_stories (origin_story_id)
  where origin_story_id is not null;

comment on column public.happyad_stories.origin_story_id is
  'Story d origine de la chaine A -> B -> A. Utilisée uniquement pour afficher la filiation du second repost.';

create or replace function public.happyad_story_add_repost_return_v895(p_source_story_id uuid)
returns public.happyad_stories
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_source public.happyad_stories%rowtype;
  v_existing public.happyad_stories%rowtype;
  v_created public.happyad_stories%rowtype;
  v_me_profile record;
  v_source_profile record;
begin
  if v_me is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_source
  from public.happyad_stories
  where id = p_source_story_id
  limit 1;

  if not found or v_source.is_active is false
     or (v_source.expires_at is not null and v_source.expires_at <= now()) then
    raise exception 'STORY_UNAVAILABLE';
  end if;

  -- Seul un repost de niveau 1 peut revenir vers l'auteur de la Story originale.
  if coalesce(v_source.story_repost_depth, 0) <> 1
     or v_source.source_story_id is null then
    raise exception 'REPOST_LIMIT_REACHED';
  end if;

  -- V888 mémorise dans source_story_owner_id le propriétaire de la Story originale A.
  if coalesce(v_source.source_story_owner_id, '') <> v_me::text then
    raise exception 'NOT_ORIGINAL_OWNER';
  end if;

  select * into v_existing
  from public.happyad_stories
  where user_id::text = v_me::text
    and source_story_id = p_source_story_id
    and is_active = true
  order by created_at desc
  limit 1;

  if found then
    return v_existing;
  end if;

  select id, full_name, username, avatar_url, badge
    into v_me_profile
  from public.profiles where id = v_me limit 1;

  select id, full_name, username, avatar_url, badge
    into v_source_profile
  from public.profiles where id::text = v_source.user_id::text limit 1;

  insert into public.happyad_stories (
    user_id, user_name, display_name, username, handle, user_avatar,
    title, description, caption,
    media_url, thumbnail_url, poster_url, media_type, kind,
    is_active, created_at, expires_at,
    source_story_id, source_story_owner_id,
    source_story_author_name, source_story_author_username,
    source_story_author_avatar, source_story_author_badge,
    source_story_caption, story_repost_depth,
    origin_story_id, origin_story_owner_id,
    origin_story_author_name, origin_story_author_username,
    origin_story_author_avatar, origin_story_author_badge
  ) values (
    v_me,
    coalesce(v_me_profile.full_name, 'Utilisateur HAPPYAD'),
    coalesce(v_me_profile.full_name, 'Utilisateur HAPPYAD'),
    coalesce(v_me_profile.username, ''),
    coalesce(v_me_profile.username, ''),
    coalesce(v_me_profile.avatar_url, ''),
    'Story republiée', '', '',
    v_source.media_url, v_source.thumbnail_url, v_source.poster_url,
    v_source.media_type, v_source.kind,
    true, now(), now() + interval '24 hours',
    v_source.id, v_source.user_id::text,
    coalesce(v_source_profile.full_name, v_source.user_name, v_source.display_name, 'Utilisateur HAPPYAD'),
    coalesce(v_source_profile.username, v_source.username, ''),
    coalesce(v_source_profile.avatar_url, v_source.user_avatar, ''),
    coalesce(v_source_profile.badge, ''),
    coalesce(v_source.description, v_source.caption, ''), 2,
    v_source.source_story_id,
    v_source.source_story_owner_id,
    coalesce(v_source.source_story_author_name, 'Utilisateur HAPPYAD'),
    coalesce(v_source.source_story_author_username, ''),
    coalesce(v_source.source_story_author_avatar, ''),
    coalesce(v_source.source_story_author_badge, '')
  )
  returning * into v_created;

  return v_created;
end;
$$;

revoke all on function public.happyad_story_add_repost_return_v895(uuid) from public;
grant execute on function public.happyad_story_add_repost_return_v895(uuid) to authenticated;

-- Quand B crée le niveau 1, A reçoit une notification lui permettant le retour final.
create or replace function public.happyad_story_repost_return_notify_v895()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient uuid;
  v_actor jsonb;
  v_meta jsonb;
begin
  if coalesce(new.story_repost_depth, 0) <> 1
     or new.source_story_id is null
     or new.source_story_owner_id is null then
    return new;
  end if;

  if new.source_story_owner_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return new;
  end if;

  v_recipient := new.source_story_owner_id::uuid;
  if v_recipient::text = new.user_id::text then return new; end if;

  select jsonb_build_object(
    'id', p.id, 'full_name', p.full_name, 'username', p.username,
    'avatar_url', p.avatar_url, 'badge', p.badge
  ) into v_actor
  from public.profiles p where p.id::text = new.user_id::text limit 1;

  v_meta := jsonb_build_object(
    'story_id', new.id,
    'owner_id', new.user_id,
    'original_story_id', new.source_story_id,
    'original_owner_id', new.source_story_owner_id,
    'content_type', 'story',
    'story_repost_return', true,
    'story_repost_depth', 1,
    'can_add_repost_to_story', true,
    'notification_preference_key', 'mentions'
  );

  insert into public.happyad_notifications (
    recipient_id, actor_id, actor_snapshot, notification_type,
    entity_type, entity_id, preview_url, title, body, metadata
  ) values (
    v_recipient, new.user_id, v_actor, 'repost',
    'story', new.id,
    coalesce(new.thumbnail_url, new.poster_url, new.media_url),
    'Story ajoutée', 'Votre story a été ajoutée à une story.', v_meta
  );

  return new;
end;
$$;

drop trigger if exists zz_happyad_story_repost_return_notify_v895 on public.happyad_stories;
create trigger zz_happyad_story_repost_return_notify_v895
after insert on public.happyad_stories
for each row
when (new.story_repost_depth = 1 and new.source_story_id is not null)
execute function public.happyad_story_repost_return_notify_v895();

commit;
