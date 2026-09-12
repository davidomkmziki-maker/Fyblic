-- HAPPYAD V888 — Point 2A : mention Story -> Ajouter à votre story
-- Fondation additive uniquement. Aucune colonne existante n'est supprimée.

begin;

alter table public.happyad_stories
  add column if not exists source_story_id uuid,
  add column if not exists source_story_owner_id text,
  add column if not exists source_story_author_name text,
  add column if not exists source_story_author_username text,
  add column if not exists source_story_author_avatar text,
  add column if not exists source_story_author_badge text,
  add column if not exists source_story_caption text,
  add column if not exists story_repost_depth smallint not null default 0;

alter table public.happyad_stories
  drop constraint if exists happyad_stories_story_repost_depth_check;

alter table public.happyad_stories
  add constraint happyad_stories_story_repost_depth_check
  check (story_repost_depth between 0 and 2);

create index if not exists happyad_stories_source_story_id_idx
  on public.happyad_stories (source_story_id)
  where source_story_id is not null;

create unique index if not exists happyad_stories_user_source_story_unique_v888
  on public.happyad_stories (user_id, source_story_id)
  where source_story_id is not null and is_active = true;

comment on column public.happyad_stories.source_story_id is
  'Story HAPPYAD immédiatement précédente affichée dans une Story repartagée.';

create or replace function public.happyad_story_add_mentioned_to_story_v888(p_source_story_id uuid)
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
  v_is_mentioned boolean := false;
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

  select exists (
    select 1
    from jsonb_array_elements_text(coalesce(to_jsonb(v_source.mentioned_user_ids), '[]'::jsonb)) x(value)
    where x.value = v_me::text
  ) into v_is_mentioned;

  if not v_is_mentioned then
    raise exception 'NOT_MENTIONED';
  end if;

  select * into v_existing
  from public.happyad_stories
  where user_id = v_me
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
    source_story_caption, story_repost_depth
  ) values (
    v_me,
    coalesce(v_me_profile.full_name, 'Utilisateur HAPPYAD'),
    coalesce(v_me_profile.full_name, 'Utilisateur HAPPYAD'),
    coalesce(v_me_profile.username, ''),
    coalesce(v_me_profile.username, ''),
    coalesce(v_me_profile.avatar_url, ''),
    'Story repartagée', '', '',
    v_source.media_url, v_source.thumbnail_url, v_source.poster_url,
    v_source.media_type, v_source.kind,
    true, now(), now() + interval '24 hours',
    v_source.id, v_source.user_id::text,
    coalesce(v_source_profile.full_name, v_source.user_name, v_source.display_name, 'Utilisateur HAPPYAD'),
    coalesce(v_source_profile.username, v_source.username, ''),
    coalesce(v_source_profile.avatar_url, v_source.user_avatar, ''),
    coalesce(v_source_profile.badge, ''),
    coalesce(v_source.description, v_source.caption, ''), 1
  )
  returning * into v_created;

  return v_created;
end;
$$;

revoke all on function public.happyad_story_add_mentioned_to_story_v888(uuid) from public;
grant execute on function public.happyad_story_add_mentioned_to_story_v888(uuid) to authenticated;

create or replace function public.happyad_story_mentions_notify_v888()
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
  if new.user_id is null or new.mentioned_user_ids is null then return new; end if;

  select jsonb_build_object(
    'id', p.id, 'full_name', p.full_name, 'username', p.username,
    'avatar_url', p.avatar_url, 'badge', p.badge
  ) into v_actor
  from public.profiles p where p.id::text = new.user_id::text limit 1;

  for v_recipient in
    select distinct x.value::uuid
    from jsonb_array_elements_text(coalesce(to_jsonb(new.mentioned_user_ids), '[]'::jsonb)) x(value)
    where x.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and x.value <> new.user_id::text
  loop
    v_meta := jsonb_build_object(
      'story_id', new.id,
      'owner_id', new.user_id,
      'content_type', 'story',
      'story_mention', true,
      'can_add_to_story', true,
      'notification_preference_key', 'mentions'
    );

    update public.happyad_notifications
       set metadata = coalesce(metadata, '{}'::jsonb) || v_meta,
           preview_url = coalesce(nullif(preview_url, ''), new.thumbnail_url, new.poster_url, new.media_url),
           actor_snapshot = case when actor_snapshot is null or actor_snapshot = '{}'::jsonb then v_actor else actor_snapshot end
     where recipient_id = v_recipient
       and actor_id::text = new.user_id::text
       and notification_type in ('mention','story_mention','mention_story')
       and entity_type = 'story'
       and entity_id::text = new.id::text;

    if not found then
      insert into public.happyad_notifications (
        recipient_id, actor_id, actor_snapshot, notification_type,
        entity_type, entity_id, preview_url, title, body, metadata
      ) values (
        v_recipient, new.user_id, v_actor, 'mention',
        'story', new.id,
        coalesce(new.thumbnail_url, new.poster_url, new.media_url),
        'Mention dans une story', 'Vous avez été mentionné dans une story.', v_meta
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists zz_happyad_story_mentions_notify_v888 on public.happyad_stories;
create trigger zz_happyad_story_mentions_notify_v888
after insert on public.happyad_stories
for each row execute function public.happyad_story_mentions_notify_v888();

commit;
