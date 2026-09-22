-- FYBLIC V1069 — garde de schéma vérifiable pour Normal + Story + Boutique.
-- Migration idempotente : elle peut être réexécutée sans dupliquer les données.
-- Pré-requis minimal : la base V1063 (tables du pipeline) existe déjà.
-- Exécuter dans Supabase SQL Editor AVANT le worker et le site V1069.

begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then
    raise exception 'FYBLIC_V1063_REQUIRED: table fyblic_publication_jobs absente';
  end if;
  if to_regclass('public.happyad_posts') is null then
    raise exception 'HAPPYAD_POSTS_REQUIRED';
  end if;
  if to_regclass('public.happyad_stories') is null then
    raise exception 'HAPPYAD_STORIES_REQUIRED';
  end if;
end;
$$;

alter table public.fyblic_publication_jobs
  add column if not exists primary_ready boolean not null default false,
  add column if not exists visible_at timestamptz;

alter table public.fyblic_publication_jobs
  drop constraint if exists fyblic_publication_jobs_status_check;
alter table public.fyblic_publication_jobs
  add constraint fyblic_publication_jobs_status_check
  check (status in ('uploading','queued','processing','optimizing','finalizing','published','failed','canceled'));

alter table public.fyblic_publication_jobs
  drop constraint if exists fyblic_publication_jobs_publication_type_check;
alter table public.fyblic_publication_jobs
  add constraint fyblic_publication_jobs_publication_type_check
  check (publication_type in ('normal','story','boutique','album'));

create table if not exists public.fyblic_system_schema_versions (
  component text primary key,
  version integer not null check (version > 0),
  capabilities jsonb not null default '{}'::jsonb,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fyblic_system_schema_versions enable row level security;
revoke all on public.fyblic_system_schema_versions from public,anon,authenticated;
grant select,insert,update on public.fyblic_system_schema_versions to service_role;

create or replace function public.fyblic_insert_post_json_v1069(p_post jsonb)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_columns text;
  v_id text;
begin
  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
  into v_columns
  from information_schema.columns c
  where c.table_schema='public'
    and c.table_name='happyad_posts'
    and p_post ? c.column_name;
  if coalesce(v_columns,'')='' then raise exception 'POST_COLUMNS_UNAVAILABLE'; end if;
  execute format(
    'insert into public.happyad_posts (%1$s) '
    'select %1$s from jsonb_populate_record(null::public.happyad_posts, $1) '
    'on conflict (id) do update set media_url=excluded.media_url, media_path=excluded.media_path, '
    'thumbnail_url=excluded.thumbnail_url, poster_url=excluded.poster_url, image_crop=excluded.image_crop '
    'returning id::text', v_columns
  ) using p_post into v_id;
  if coalesce(v_id,'')='' then raise exception 'POST_ID_MISSING'; end if;
  return v_id;
end;
$$;

create or replace function public.fyblic_insert_story_json_v1069(p_story jsonb)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_columns text;
  v_id text;
begin
  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
  into v_columns
  from information_schema.columns c
  where c.table_schema='public'
    and c.table_name='happyad_stories'
    and c.column_name <> 'id'
    and p_story ? c.column_name;
  if coalesce(v_columns,'')='' then raise exception 'STORY_COLUMNS_UNAVAILABLE'; end if;
  execute format(
    'insert into public.happyad_stories (%1$s) '
    'select %1$s from jsonb_populate_record(null::public.happyad_stories, $1) '
    'returning id::text', v_columns
  ) using p_story into v_id;
  if coalesce(v_id,'')='' then raise exception 'STORY_ID_MISSING'; end if;
  return v_id;
end;
$$;

create or replace function public.fyblic_worker_publish_primary_v1069(
  p_job_id uuid, p_worker_id text, p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_payload jsonb;
  v_primary jsonb;
  v_poster jsonb;
  v_variants jsonb;
  v_post jsonb;
  v_story jsonb;
  v_story_id text;
  v_result jsonb;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if v_job.status not in ('processing','optimizing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;
  if v_job.publication_type not in ('normal','story','boutique') then raise exception 'TYPE_NOT_ENABLED_V1069'; end if;

  v_payload:=coalesce(v_job.payload,'{}'::jsonb);
  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_variants:=coalesce(p_result->'variants','{}'::jsonb);
  if coalesce(v_primary->>'url','')='' then raise exception 'PRIMARY_MEDIA_REQUIRED'; end if;
  v_result:=coalesce(p_result,'{}'::jsonb);

  if v_job.publication_type='normal' then
    v_post:=jsonb_build_object(
      'id',v_job.post_id,'user_id',v_job.user_id,'mode','publish',
      'title',coalesce(v_payload->>'title','Publication Fyblic'),
      'description',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'hashtags',coalesce(v_payload->>'hashtags',''),'mentions',coalesce(v_payload->>'mentions',''),
      'mentioned_user_ids',coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
      'mention_handles',coalesce(v_payload->'mentionHandles','[]'::jsonb),
      'category',coalesce(v_payload->>'category',''),'location',coalesce(v_payload->>'location',''),
      'kind',v_job.media_kind,'media_type',v_job.media_kind,
      'media_url',v_primary->>'url','media_path',coalesce(v_primary->>'path',''),
      'thumbnail_url',coalesce(v_poster->>'url',''),'poster_url',coalesce(v_poster->>'url',''),
      'mime_type',coalesce(v_primary->>'mime',''),'file_name',coalesce(v_primary->>'filename',v_job.original_name),
      'image_crop',coalesce(v_payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',v_variants)),
      'cover_frame_time',case when coalesce(v_payload->>'videoFrameTime','')~'^[0-9]+(\.[0-9]+)?$' then (v_payload->>'videoFrameTime')::numeric else 0 end,
      'creator_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'avatar_url',coalesce(v_payload->>'avatar',''),'badge',coalesce(v_payload->>'badge','aucun'),
      'created_at',coalesce(v_payload->>'created_at',now()::text)
    );
    perform public.fyblic_insert_post_json_v1069(v_post);
  elsif v_job.publication_type='story' then
    v_story:=jsonb_build_object(
      'user_id',v_job.user_id,
      'user_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'user_avatar',coalesce(v_payload->>'avatar',''),'title','Story',
      'description',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'caption',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'mentioned_user_ids',coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
      'mention_handles',coalesce(v_payload->'mentionHandles','[]'::jsonb),
      'media_url',v_primary->>'url','thumbnail_url',coalesce(v_poster->>'url',''),
      'poster_url',coalesce(v_poster->>'url',''),
      'media_type',case when v_job.media_kind='video' then 'video' else 'image' end,
      'kind',v_job.media_kind,'location_name',coalesce(v_payload->>'location',''),
      'is_active',true,'created_at',now(),'expires_at',now()+interval '24 hours'
    );
    v_story_id:=public.fyblic_insert_story_json_v1069(v_story);
    v_result:=v_result||jsonb_build_object('story_id',v_story_id);
  else
    v_result:=v_result||jsonb_build_object(
      'listing_id',coalesce(v_payload->>'listingId',''),
      'media_index',coalesce(v_payload->'mediaIndex','0'::jsonb)
    );
  end if;

  update public.fyblic_publication_jobs set
    status='optimizing',
    stage=case when publication_type='story' then 'Story affichée · optimisation en arrière-plan' when publication_type='boutique' then 'Média Boutique prêt · optimisation' else 'Publication affichée · optimisation en arrière-plan' end,
    progress=greatest(progress,86),primary_ready=true,visible_at=coalesce(visible_at,now()),result=v_result
  where id=v_job.id;
  return jsonb_build_object('ok',true,'primary_ready',true,'job_id',v_job.id,'post_id',v_job.post_id,'publication_type',v_job.publication_type,'story_id',v_story_id);
end;
$$;

create or replace function public.fyblic_worker_complete_variants_v1069(
  p_job_id uuid, p_worker_id text, p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_crop jsonb;
  v_primary jsonb;
  v_poster jsonb;
  v_story_id text;
  v_final_result jsonb;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if not v_job.primary_ready then raise exception 'PRIMARY_NOT_READY'; end if;
  if v_job.publication_type not in ('normal','story','boutique') then raise exception 'TYPE_NOT_ENABLED_V1069'; end if;
  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_final_result:=coalesce(v_job.result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb);

  if v_job.publication_type='normal' then
    v_crop:=coalesce(v_job.payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',coalesce(p_result->'variants','{}'::jsonb)));
    update public.happyad_posts set
      media_url=coalesce(nullif(v_primary->>'url',''),media_url),media_path=coalesce(nullif(v_primary->>'path',''),media_path),
      thumbnail_url=coalesce(nullif(v_poster->>'url',''),thumbnail_url),poster_url=coalesce(nullif(v_poster->>'url',''),poster_url),image_crop=v_crop
    where id=v_job.post_id and user_id=v_job.user_id;
  elsif v_job.publication_type='story' then
    v_story_id:=coalesce(v_job.result->>'story_id','');
    if v_story_id='' then raise exception 'STORY_ID_MISSING'; end if;
    update public.happyad_stories set
      media_url=coalesce(nullif(v_primary->>'url',''),media_url),
      thumbnail_url=coalesce(nullif(v_poster->>'url',''),thumbnail_url),
      poster_url=coalesce(nullif(v_poster->>'url',''),poster_url)
    where id::text=v_story_id and user_id::text=v_job.user_id::text;
  end if;

  update public.fyblic_publication_jobs set
    status='published',stage=case when publication_type='story' then 'Story publiée' when publication_type='boutique' then 'Média Boutique prêt' else 'Publication publiée' end,
    progress=100,primary_ready=true,result=v_final_result,completed_at=now(),lease_expires_at=null
  where id=v_job.id;
  return jsonb_build_object('ok',true,'job_id',v_job.id,'post_id',v_job.post_id,'publication_type',v_job.publication_type,'story_id',v_story_id);
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1069()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'component','publication_pipeline',
    'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
    'normal',to_regprocedure('public.fyblic_worker_publish_primary_v1069(uuid,text,jsonb)') is not null,
    'story',to_regprocedure('public.fyblic_insert_story_json_v1069(jsonb)') is not null,
    'boutique',to_regprocedure('public.fyblic_worker_complete_variants_v1069(uuid,text,jsonb)') is not null,
    'jobs_table',to_regclass('public.fyblic_publication_jobs') is not null,
    'posts_table',to_regclass('public.happyad_posts') is not null,
    'stories_table',to_regclass('public.happyad_stories') is not null
  );
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values (
  'publication_pipeline',1069,
  '{"normal":true,"story":true,"boutique":true,"schema_guard":true}'::jsonb,
  now(),now()
)
on conflict (component) do update set
  version=excluded.version,
  capabilities=excluded.capabilities,
  updated_at=now();

revoke all on function public.fyblic_insert_post_json_v1069(jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_insert_story_json_v1069(jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_publish_primary_v1069(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_variants_v1069(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1069() from public,anon,authenticated;
grant execute on function public.fyblic_insert_post_json_v1069(jsonb) to service_role;
grant execute on function public.fyblic_insert_story_json_v1069(jsonb) to service_role;
grant execute on function public.fyblic_worker_publish_primary_v1069(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_complete_variants_v1069(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1069() to service_role;

commit;

select public.fyblic_publication_schema_status_v1069() as fyblic_v1069_status;
