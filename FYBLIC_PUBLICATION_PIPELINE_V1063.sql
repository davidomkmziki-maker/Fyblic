-- FYBLIC V1063 — pipeline durable de publication et compression.
-- À exécuter une seule fois dans Supabase SQL Editor avant d'activer le worker V1063.

begin;

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fyblic-media-originals',
  'fyblic-media-originals',
  false,
  1100000000,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/avif','video/mp4','video/quicktime','video/webm','video/x-m4v','video/3gpp','video/x-matroska']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fyblic_originals_owner_read_v1063 on storage.objects;
drop policy if exists fyblic_originals_owner_insert_v1063 on storage.objects;
drop policy if exists fyblic_originals_owner_delete_v1063 on storage.objects;

create policy fyblic_originals_owner_read_v1063
on storage.objects for select to authenticated
using (
  bucket_id = 'fyblic-media-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fyblic_originals_owner_insert_v1063
on storage.objects for insert to authenticated
with check (
  bucket_id = 'fyblic-media-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fyblic_originals_owner_delete_v1063
on storage.objects for delete to authenticated
using (
  bucket_id = 'fyblic-media-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.fyblic_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  publication_type text not null default 'normal'
    check (publication_type in ('normal','story','boutique','album')),
  media_kind text not null check (media_kind in ('photo','video')),
  status text not null default 'uploading'
    check (status in ('uploading','queued','processing','finalizing','published','failed','canceled')),
  stage text not null default 'Préparation',
  progress smallint not null default 0 check (progress between 0 and 100),
  post_id text not null,
  idempotency_key text not null,
  original_bucket text not null default 'fyblic-media-originals',
  original_path text not null,
  original_name text not null,
  original_mime text not null,
  original_bytes bigint not null check (original_bytes > 0 and original_bytes <= 1100000000),
  uploaded_bytes bigint not null default 0 check (uploaded_bytes >= 0),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  attempts integer not null default 0 check (attempts between 0 and 20),
  worker_id text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, idempotency_key),
  unique (post_id)
);

create index if not exists fyblic_publication_jobs_queue_v1063
on public.fyblic_publication_jobs (status, lease_expires_at, created_at);

create index if not exists fyblic_publication_jobs_user_v1063
on public.fyblic_publication_jobs (user_id, created_at desc);

create table if not exists public.fyblic_publication_media (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.fyblic_publication_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('primary','variant','poster','thumbnail')),
  quality text not null default '',
  bucket text not null,
  path text not null,
  public_url text not null default '',
  mime_type text not null,
  bytes bigint not null check (bytes >= 0),
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz not null default now(),
  unique (job_id, role, quality)
);

-- État technique inaccessible au navigateur : URL TUS et reprise exacte.
create table if not exists public.fyblic_publication_worker_state (
  job_id uuid primary key references public.fyblic_publication_jobs(id) on delete cascade,
  tus_upload_url text not null,
  tus_offset bigint not null default 0,
  tus_expires_at timestamptz not null default (now() + interval '23 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fyblic_publication_jobs enable row level security;
alter table public.fyblic_publication_media enable row level security;
alter table public.fyblic_publication_worker_state enable row level security;

drop policy if exists fyblic_jobs_owner_select_v1063 on public.fyblic_publication_jobs;
create policy fyblic_jobs_owner_select_v1063
on public.fyblic_publication_jobs for select to authenticated
using (user_id = auth.uid());

drop policy if exists fyblic_media_owner_select_v1063 on public.fyblic_publication_media;
create policy fyblic_media_owner_select_v1063
on public.fyblic_publication_media for select to authenticated
using (user_id = auth.uid());

revoke all on public.fyblic_publication_jobs from anon, authenticated;
revoke all on public.fyblic_publication_media from anon, authenticated;
revoke all on public.fyblic_publication_worker_state from anon, authenticated;
grant select on public.fyblic_publication_jobs to authenticated;
grant select on public.fyblic_publication_media to authenticated;

create or replace function public.fyblic_jobs_touch_v1063()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fyblic_jobs_touch_v1063 on public.fyblic_publication_jobs;
create trigger fyblic_jobs_touch_v1063
before update on public.fyblic_publication_jobs
for each row execute function public.fyblic_jobs_touch_v1063();

create or replace function public.fyblic_worker_claim_job_v1063(
  p_worker_id text,
  p_lease_seconds integer default 1800
)
returns setof public.fyblic_publication_jobs
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select j.id into v_id
  from public.fyblic_publication_jobs j
  where (
    j.status = 'queued'
    or (j.status in ('processing','finalizing') and j.lease_expires_at < now())
  )
  and j.attempts < 3
  order by j.created_at
  for update skip locked
  limit 1;

  if v_id is null then return; end if;

  return query
  update public.fyblic_publication_jobs j set
    status = 'processing',
    stage = case when j.attempts = 0 then 'Analyse du média' else 'Reprise automatique' end,
    progress = greatest(j.progress, 46),
    attempts = j.attempts + 1,
    worker_id = left(coalesce(p_worker_id,'worker'), 120),
    lease_expires_at = now() + make_interval(secs => greatest(60, least(coalesce(p_lease_seconds,1800),7200))),
    started_at = coalesce(j.started_at, now()),
    error_code = null,
    error_message = null
  where j.id = v_id
  returning j.*;
end;
$$;

create or replace function public.fyblic_worker_progress_v1063(
  p_job_id uuid,
  p_worker_id text,
  p_progress integer,
  p_stage text,
  p_lease_seconds integer default 1800
)
returns boolean
language plpgsql security definer
set search_path = public
as $$
begin
  update public.fyblic_publication_jobs set
    progress = greatest(progress, least(98, greatest(46, coalesce(p_progress,46)))),
    stage = left(coalesce(p_stage,'Compression'), 180),
    lease_expires_at = now() + make_interval(secs => greatest(60, least(coalesce(p_lease_seconds,1800),7200)))
  where id = p_job_id
    and worker_id = p_worker_id
    and status in ('processing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_worker_finalize_job_v1063(
  p_job_id uuid,
  p_worker_id text,
  p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public, storage
as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_payload jsonb;
  v_primary jsonb;
  v_poster jsonb;
  v_variants jsonb;
  v_post jsonb;
begin
  select * into v_job
  from public.fyblic_publication_jobs
  where id = p_job_id
  for update;

  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if v_job.status not in ('processing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;

  v_payload := coalesce(v_job.payload,'{}'::jsonb);
  v_primary := coalesce(p_result->'primary','{}'::jsonb);
  v_poster := coalesce(p_result->'poster','{}'::jsonb);
  v_variants := coalesce(p_result->'variants','{}'::jsonb);

  update public.fyblic_publication_jobs set status='finalizing', stage='Enregistrement de la publication', progress=98
  where id=v_job.id;

  if v_job.publication_type = 'normal' then
    v_post := jsonb_build_object(
      'id', v_job.post_id,
      'user_id', v_job.user_id,
      'mode', 'publish',
      'title', coalesce(v_payload->>'title','Publication Fyblic'),
      'description', coalesce(v_payload->>'desc',v_payload->>'description',''),
      'hashtags', coalesce(v_payload->>'hashtags',''),
      'mentions', coalesce(v_payload->>'mentions',''),
      'mentioned_user_ids', coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
      'mention_handles', coalesce(v_payload->'mentionHandles','[]'::jsonb),
      'category', coalesce(v_payload->>'category',''),
      'location', coalesce(v_payload->>'location',''),
      'kind', v_job.media_kind,
      'media_type', v_job.media_kind,
      'media_url', coalesce(v_primary->>'url',''),
      'media_path', coalesce(v_primary->>'path',''),
      'thumbnail_url', coalesce(v_poster->>'url',''),
      'poster_url', coalesce(v_poster->>'url',''),
      'mime_type', coalesce(v_primary->>'mime',''),
      'file_name', coalesce(v_primary->>'filename',v_job.original_name),
      'image_crop', coalesce(v_payload->'imageCrop','{}'::jsonb) || jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',v_variants)),
      'cover_frame_time', coalesce((v_payload->>'videoFrameTime')::numeric,0),
      'creator_name', coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name', coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'handle', trim(leading '@' from coalesce(v_payload->>'handle','')),
      'username', trim(leading '@' from coalesce(v_payload->>'handle','')),
      'avatar_url', coalesce(v_payload->>'avatar',''),
      'badge', coalesce(v_payload->>'badge','aucun'),
      'created_at', coalesce(v_payload->>'created_at',to_jsonb(now())#>>'{}')
    );

    insert into public.happyad_posts
    select (jsonb_populate_record(null::public.happyad_posts, v_post)).*
    on conflict (id) do nothing;
  else
    raise exception 'TYPE_NOT_ENABLED_V1063';
  end if;

  update public.fyblic_publication_jobs set
    status='published', stage='Publication publiée', progress=100,
    result=coalesce(p_result,'{}'::jsonb), completed_at=now(), lease_expires_at=null
  where id=v_job.id;

  return jsonb_build_object('ok',true,'job_id',v_job.id,'post_id',v_job.post_id);
end;
$$;

create or replace function public.fyblic_worker_fail_job_v1063(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_status text;
begin
  update public.fyblic_publication_jobs set
    status = case when attempts < 3 then 'queued' else 'failed' end,
    stage = case when attempts < 3 then 'Nouvelle tentative automatique' else 'Échec' end,
    error_code = left(coalesce(p_error_code,'PROCESSING_FAILED'),80),
    error_message = left(coalesce(p_error_message,'Échec du traitement'),600),
    lease_expires_at = null,
    completed_at = case when attempts < 3 then null else now() end
  where id=p_job_id and worker_id=p_worker_id
  returning status into v_status;
  return coalesce(v_status,'lease-lost');
end;
$$;

revoke all on function public.fyblic_worker_claim_job_v1063(text,integer) from public, anon, authenticated;
revoke all on function public.fyblic_worker_progress_v1063(uuid,text,integer,text,integer) from public, anon, authenticated;
revoke all on function public.fyblic_worker_finalize_job_v1063(uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.fyblic_worker_fail_job_v1063(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.fyblic_worker_claim_job_v1063(text,integer) to service_role;
grant execute on function public.fyblic_worker_progress_v1063(uuid,text,integer,text,integer) to service_role;
grant execute on function public.fyblic_worker_finalize_job_v1063(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_fail_job_v1063(uuid,text,text,text) to service_role;

commit;

-- Vérification : doit retourner 3 lignes.
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('fyblic_publication_jobs','fyblic_publication_media','fyblic_publication_worker_state')
order by table_name;
