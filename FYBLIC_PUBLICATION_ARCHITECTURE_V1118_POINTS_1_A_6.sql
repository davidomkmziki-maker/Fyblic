-- FYBLIC V1118 — REBASE STABLE DES POINTS 1 À 6
-- À exécuter APRÈS les migrations déjà appliquées V1082 + V1112..V1116.
-- Cette migration est volontairement cumulative/idempotente : elle ne supprime aucune publication.
-- Elle réconcilie les limites 4 Go/15 min, les renditions, le scheduler équitable,
-- le contrat 1080p principal, le Fast Path arrière-plan et les publications multiples.

begin;

DO $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then
    raise exception 'FYBLIC_PUBLICATION_JOBS_REQUIRED';
  end if;
  if to_regprocedure('public.fyblic_publication_schema_status_v1082()') is null then
    raise exception 'FYBLIC_V1082_REQUIRED';
  end if;
  if to_regclass('public.fyblic_publication_renditions') is null then
    raise exception 'FYBLIC_V1113_RENDITIONS_REQUIRED';
  end if;
  if to_regprocedure('public.fyblic_worker_seed_renditions_v1113(uuid,text,jsonb)') is null
     or to_regprocedure('public.fyblic_worker_rendition_state_v1113(uuid,text,text,text,integer,jsonb,text,text)') is null
     or to_regprocedure('public.fyblic_worker_close_pending_renditions_v1113(uuid,text,text)') is null then
    raise exception 'FYBLIC_V1113_FUNCTIONS_REQUIRED';
  end if;
  if to_regclass('public.fyblic_publication_user_schedule') is null
     or to_regprocedure('public.fyblic_worker_claim_job_v1114(text,integer,integer)') is null then
    raise exception 'FYBLIC_V1114_FAIR_SCHEDULER_REQUIRED';
  end if;
  if to_regprocedure('public.fyblic_publication_schema_status_v1116()') is null then
    raise exception 'FYBLIC_V1116_REQUIRED';
  end if;
  if not exists (select 1 from storage.buckets where id='fyblic-media-originals') then
    raise exception 'FYBLIC_MEDIA_ORIGINALS_BUCKET_REQUIRED';
  end if;
end;
$$;

-- POINT 1 — 4 Go réels côté Storage + table. La durée 15 min reste validée par FFprobe worker.
update storage.buckets
set file_size_limit=4000000000
where id='fyblic-media-originals';

DO $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid='public.fyblic_publication_jobs'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) ilike '%original_bytes%'
  loop
    execute format('alter table public.fyblic_publication_jobs drop constraint %I',r.conname);
  end loop;
end;
$$;

alter table public.fyblic_publication_jobs
  add constraint fyblic_publication_jobs_original_bytes_v1118_check
  check (original_bytes > 0 and original_bytes <= 4000000000);

-- Index de lecture des sous-jobs : sans modifier les données existantes.
create index if not exists fyblic_publication_renditions_queue_v1118
on public.fyblic_publication_renditions (status, priority, created_at);

create index if not exists fyblic_publication_renditions_user_v1118
on public.fyblic_publication_renditions (user_id, status, created_at);

create index if not exists fyblic_publication_renditions_job_v1118
on public.fyblic_publication_renditions (job_id, height desc);

create index if not exists fyblic_publication_jobs_user_claim_v1118
on public.fyblic_publication_jobs (user_id, status, primary_ready, created_at);

-- POINTS 2/3 — noms canoniques V1118 autour des fonctions déjà validées V1113/V1114.
-- Les wrappers permettent au nouveau worker de dépendre d'un seul contrat SQL V1118,
-- tout en conservant intégralement la logique et les données des migrations déjà exécutées.
create or replace function public.fyblic_worker_seed_renditions_v1118(
  p_job_id uuid,
  p_worker_id text,
  p_plan jsonb
)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.fyblic_worker_seed_renditions_v1113(p_job_id,p_worker_id,p_plan);
$$;

create or replace function public.fyblic_worker_rendition_state_v1118(
  p_job_id uuid,
  p_worker_id text,
  p_quality text,
  p_status text,
  p_progress integer default 0,
  p_output jsonb default '{}'::jsonb,
  p_error_code text default null,
  p_error_message text default null
)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.fyblic_worker_rendition_state_v1113(
    p_job_id,p_worker_id,p_quality,p_status,p_progress,p_output,p_error_code,p_error_message
  );
$$;

create or replace function public.fyblic_worker_close_pending_renditions_v1118(
  p_job_id uuid,
  p_worker_id text,
  p_reason text default 'PARENT_FLOW_COMPLETE'
)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.fyblic_worker_close_pending_renditions_v1113(p_job_id,p_worker_id,p_reason);
$$;

create or replace function public.fyblic_worker_claim_job_v1118(
  p_worker_id text,
  p_lease_seconds integer default 1800,
  p_max_active_per_user integer default 1
)
returns setof public.fyblic_publication_jobs
language sql
security definer
set search_path=public
as $$
  select * from public.fyblic_worker_claim_job_v1114(
    p_worker_id,
    p_lease_seconds,
    greatest(1,least(coalesce(p_max_active_per_user,1),8))
  );
$$;

-- Statut canonique : un seul point de contrôle pour Site + Worker.
create or replace function public.fyblic_publication_schema_status_v1118()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
select coalesce(public.fyblic_publication_schema_status_v1116(),'{}'::jsonb) || jsonb_build_object(
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'limits_4gb',(
    select coalesce(file_size_limit,0)>=4000000000
    from storage.buckets where id='fyblic-media-originals'
  ),
  'duration_15m',true,
  'renditions_table',to_regclass('public.fyblic_publication_renditions') is not null,
  'parent_renditions',to_regprocedure('public.fyblic_worker_seed_renditions_v1118(uuid,text,jsonb)') is not null,
  'rendition_state',to_regprocedure('public.fyblic_worker_rendition_state_v1118(uuid,text,text,text,integer,jsonb,text,text)') is not null,
  'rendition_close',to_regprocedure('public.fyblic_worker_close_pending_renditions_v1118(uuid,text,text)') is not null,
  'fair_user_scheduler',to_regprocedure('public.fyblic_worker_claim_job_v1118(text,integer,integer)') is not null,
  'user_schedule_table',to_regclass('public.fyblic_publication_user_schedule') is not null,
  'per_user_active_cap',true,
  'highest_native_primary',true,
  'primary_1080_when_available',true,
  'no_video_upscaling',true,
  'fast_path_background_variants',true,
  'fast_path_safe_remux',true,
  'fast_path_primary_first',true,
  'multi_queued_per_user',true,
  'submission_idempotency',true,
  'preview_blob_path_untouched',true
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values (
  'publication_pipeline',1118,
  '{
    "normal":true,"story":true,"boutique":true,"album":true,
    "unified_engine":true,"group_assets":true,"group_finalize":true,
    "claim_optimizing":true,"heartbeat":true,"post_media_safe":true,
    "fast_primary":true,"terminal_lock":true,"yielding_optimization":true,
    "poster_before_primary":true,"limits_4gb":true,"duration_15m":true,
    "renditions_table":true,"parent_renditions":true,"rendition_state":true,
    "rendition_close":true,"rendition_scheduler":false,
    "fair_user_scheduler":true,"user_schedule_table":true,"per_user_active_cap":true,
    "highest_native_primary":true,"primary_1080_when_available":true,"no_video_upscaling":true,
    "fast_path_background_variants":true,"fast_path_safe_remux":true,"fast_path_primary_first":true,
    "multi_queued_per_user":true,"submission_idempotency":true,"preview_blob_path_untouched":true
  }'::jsonb,
  now(),now()
)
on conflict(component) do update set
  version=excluded.version,
  capabilities=excluded.capabilities,
  updated_at=now();

revoke all on function public.fyblic_worker_seed_renditions_v1118(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_rendition_state_v1118(uuid,text,text,text,integer,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.fyblic_worker_close_pending_renditions_v1118(uuid,text,text) from public,anon,authenticated;
revoke all on function public.fyblic_worker_claim_job_v1118(text,integer,integer) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1118() from public,anon,authenticated;

grant execute on function public.fyblic_worker_seed_renditions_v1118(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_rendition_state_v1118(uuid,text,text,text,integer,jsonb,text,text) to service_role;
grant execute on function public.fyblic_worker_close_pending_renditions_v1118(uuid,text,text) to service_role;
grant execute on function public.fyblic_worker_claim_job_v1118(text,integer,integer) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1118() to service_role;

commit;

select public.fyblic_publication_schema_status_v1118() as fyblic_v1118_status;
