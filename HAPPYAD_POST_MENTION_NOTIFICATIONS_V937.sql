-- HAPPYAD V937 — Mentions dans une publication normale -> notification
-- Point 1 uniquement : persistance des identités mentionnées + notification serveur.
-- Idempotent : peut être relancé sans créer un second trigger.

begin;

alter table public.happyad_posts
  add column if not exists mentioned_user_ids uuid[] default '{}'::uuid[];

alter table public.happyad_posts
  add column if not exists mention_handles text[] default '{}'::text[];

comment on column public.happyad_posts.mentioned_user_ids is
  'UID Supabase des profils réellement sélectionnés via le sélecteur @mention.';

comment on column public.happyad_posts.mention_handles is
  'Usernames associés à mentioned_user_ids, même ordre, pour le rendu fiable des mentions.';

create or replace function public.happyad_post_mentions_notify_v937()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient uuid;
  v_actor jsonb;
  v_row jsonb;
  v_meta jsonb;
  v_post_id text;
  v_batch_id text;
  v_group_key text;
  v_preview text;
  v_existing_id public.happyad_notifications.id%type;
begin
  if new.user_id is null or new.mentioned_user_ids is null then
    return new;
  end if;

  v_row := to_jsonb(new);
  v_post_id := new.id::text;
  v_batch_id := nullif(coalesce(v_row ->> 'batch_id', ''), '');
  v_group_key := coalesce(v_batch_id, v_post_id);
  v_preview := coalesce(
    nullif(v_row ->> 'thumbnail_url', ''),
    nullif(v_row ->> 'poster_url', ''),
    nullif(v_row ->> 'media_url', '')
  );

  select jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'avatar_url', p.avatar_url,
    'badge', p.badge
  )
  into v_actor
  from public.profiles p
  where p.id::text = new.user_id::text
  limit 1;

  for v_recipient in
    select distinct x.value::uuid
    from jsonb_array_elements_text(coalesce(to_jsonb(new.mentioned_user_ids), '[]'::jsonb)) x(value)
    where x.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and x.value <> new.user_id::text
  loop
    v_meta := jsonb_build_object(
      'post_id', v_post_id,
      'owner_id', new.user_id,
      'content_type', 'post',
      'post_mention', true,
      'notification_preference_key', 'mentions',
      'mention_group_key', v_group_key,
      'batch_id', v_batch_id
    );

    -- Une publication groupée peut créer plusieurs lignes happyad_posts.
    -- On garde UNE notification par destinataire + auteur + batch, et on conserve
    -- le premier post_id comme cible d'ouverture de la publication groupée.
    select n.id
      into v_existing_id
      from public.happyad_notifications n
     where n.recipient_id = v_recipient
       and n.actor_id::text = new.user_id::text
       and n.notification_type in ('mention','post_mention','mention_post')
       and coalesce(n.metadata ->> 'mention_group_key', '') = v_group_key
     order by n.created_at asc
     limit 1;

    if v_existing_id is not null then
      update public.happyad_notifications
         set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
               'post_mention', true,
               'content_type', 'post',
               'notification_preference_key', 'mentions',
               'mention_group_key', v_group_key,
               'batch_id', v_batch_id
             ),
             preview_url = coalesce(nullif(preview_url, ''), v_preview),
             actor_snapshot = case
               when actor_snapshot is null or actor_snapshot = '{}'::jsonb then v_actor
               else actor_snapshot
             end
       where id = v_existing_id;
    else
      insert into public.happyad_notifications (
        recipient_id,
        actor_id,
        actor_snapshot,
        notification_type,
        entity_type,
        preview_url,
        title,
        body,
        metadata
      ) values (
        v_recipient,
        new.user_id,
        v_actor,
        'mention',
        'post',
        v_preview,
        'Mention dans une publication',
        'Vous avez été mentionné dans une publication.',
        v_meta
      );
    end if;

    v_existing_id := null;
  end loop;

  return new;
end;
$$;

drop trigger if exists zz_happyad_post_mentions_notify_v937 on public.happyad_posts;
create trigger zz_happyad_post_mentions_notify_v937
after insert on public.happyad_posts
for each row execute function public.happyad_post_mentions_notify_v937();

commit;
