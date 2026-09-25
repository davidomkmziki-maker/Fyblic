-- FYBLIC V1113 STEP 2 — JOB PARENT + SOUS-JOBS DE QUALITE VIDEO
-- Base requise : V1082 + V1112 Step 1.
-- Objectif : conserver fyblic_publication_jobs comme parent et matérialiser chaque rendition vidéo.
-- Cette étape ne change PAS encore l'ordonnancement global : le scheduler équitable arrive à l'étape 3.

begin;

DO $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then
    raise exception 'FYBLIC_PUBLICATION_JOBS_REQUIRED';
  end if;
  if to_regprocedure('public.fyblic_publication_schema_status_v1082()') is null then
    raise exception 'FYBLIC_V1082_REQUIRED';
  end if;
end;
$$;

create table if not exists public.fyblic_publication_renditions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.fyblic_publication_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quality text not null check (quality ~ '^[0-9]{2,4}p$'),
  height integer not null check (height between 2 and 4320),
  status text not null default 'planned'
    check (status in ('planned','processing','ready','failed','skipped','canceled')),
  is_primary boolean not null default false,
  priority integer not null default 100 check (priority between 0 and 10000),
  progress smallint not null default 0 check (progress between 0 and 100),
  attempts integer not null default 0 check (attempts between 0 and 20),
  worker_id text,
  lease_expires_at timestamptz,
  output_bucket text,
  output_path text,
  output_url text,
  output_mime text,
  output_bytes bigint check (output_bytes is null or output_bytes >= 0),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique(job_id, quality)
);

create index if not exists fyblic_publication_renditions_queue_v1113
on public.fyblic_publication_renditions (status, priority, created_at);

create index if not exists fyblic_publication_renditions_user_v1113
on public.fyblic_publication_renditions (user_id, status, created_at);

create index if not exists fyblic_publication_renditions_job_v1113
on public.fyblic_publication_renditions (job_id, height desc);

alter table public.fyblic_publication_renditions enable row level security;

drop policy if exists fyblic_renditions_owner_select_v1113 on public.fyblic_publication_renditions;
create policy fyblic_renditions_owner_select_v1113
on public.fyblic_publication_renditions for select to authenticated
using (user_id = auth.uid());

revoke all on public.fyblic_publication_renditions from anon, authenticated;
grant select on public.fyblic_publication_renditions to authenticated;

create or replace function public.fyblic_renditions_touch_v1113()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fyblic_renditions_touch_v1113 on public.fyblic_publication_renditions;
create trigger fyblic_renditions_touch_v1113
before update on public.fyblic_publication_renditions
for each row execute function public.fyblic_renditions_touch_v1113();

-- p_plan = [{"quality":"1080p","height":1080,"isPrimary":false,"status":"planned","priority":100}, ...]
-- Le plan vient du même code média que FFmpeg : aucune divergence entre le parent et ses sous-jobs.
create or replace function public.fyblic_worker_seed_renditions_v1113(
  p_job_id uuid,
  p_worker_id text,
  p_plan jsonb
)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_item jsonb;
  v_quality text;
  v_height integer;
  v_status text;
  v_primary boolean;
  v_priority integer;
  v_count integer := 0;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if not found then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.media_kind <> 'video' then return jsonb_build_object('ok',true,'count',0,'photo',true); end if;
  if coalesce(v_job.worker_id,'') <> coalesce(p_worker_id,'') then raise exception 'WORKER_MISMATCH'; end if;
  if jsonb_typeof(coalesce(p_plan,'[]'::jsonb)) <> 'array' then raise exception 'INVALID_RENDITION_PLAN'; end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_plan,'[]'::jsonb)) loop
    v_quality := nullif(v_item->>'quality','');
    v_height := greatest(2, least(4320, coalesce((v_item->>'height')::integer,0)));
    v_status := coalesce(nullif(v_item->>'status',''),'planned');
    v_primary := coalesce((v_item->>'isPrimary')::boolean,false);
    v_priority := greatest(0, least(10000, coalesce((v_item->>'priority')::integer, case when v_primary then 10 else 100 end)));
    if v_quality is null or v_quality !~ '^[0-9]{2,4}p$' then raise exception 'INVALID_RENDITION_QUALITY'; end if;
    if v_status not in ('planned','processing','ready','failed','skipped','canceled') then raise exception 'INVALID_RENDITION_STATUS'; end if;

    insert into public.fyblic_publication_renditions(
      job_id,user_id,quality,height,status,is_primary,priority,progress,error_code,error_message,completed_at
    ) values (
      v_job.id,v_job.user_id,v_quality,v_height,v_status,v_primary,v_priority,
      case when v_status in ('ready','skipped') then 100 else 0 end,
      case when v_status='skipped' then coalesce(nullif(v_item->>'reason',''),'NOT_REQUIRED') else null end,
      case when v_status='skipped' then nullif(v_item->>'message','') else null end,
      case when v_status in ('ready','skipped','canceled') then now() else null end
    )
    on conflict(job_id,quality) do update set
      height=excluded.height,
      is_primary=excluded.is_primary,
      priority=excluded.priority,
      status=case
        when public.fyblic_publication_renditions.status in ('processing','ready','failed','canceled') then public.fyblic_publication_renditions.status
        else excluded.status
      end,
      progress=case
        when public.fyblic_publication_renditions.status in ('processing','ready','failed','canceled') then public.fyblic_publication_renditions.progress
        else excluded.progress
      end,
      error_code=case
        when public.fyblic_publication_renditions.status in ('processing','ready','failed','canceled') then public.fyblic_publication_renditions.error_code
        else excluded.error_code
      end,
      error_message=case
        when public.fyblic_publication_renditions.status in ('processing','ready','failed','canceled') then public.fyblic_publication_renditions.error_message
        else excluded.error_message
      end,
      completed_at=case
        when public.fyblic_publication_renditions.status in ('processing','ready','failed','canceled') then public.fyblic_publication_renditions.completed_at
        else excluded.completed_at
      end;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok',true,'count',v_count);
end;
$$;

create or replace function public.fyblic_worker_rendition_state_v1113(
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
language plpgsql security definer set search_path=public as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_row public.fyblic_publication_renditions%rowtype;
  v_progress integer;
begin
  if p_status not in ('planned','processing','ready','failed','skipped','canceled') then raise exception 'INVALID_RENDITION_STATUS'; end if;
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id;
  if not found then raise exception 'JOB_NOT_FOUND'; end if;
  if coalesce(v_job.worker_id,'') <> coalesce(p_worker_id,'') then raise exception 'WORKER_MISMATCH'; end if;
  v_progress := greatest(0,least(100,coalesce(p_progress,0)));

  update public.fyblic_publication_renditions set
    status=p_status,
    progress=case when p_status in ('ready','skipped','canceled') then 100 else greatest(progress,v_progress) end,
    attempts=case when p_status='processing' and status<>'processing' then least(20,attempts+1) else attempts end,
    worker_id=case when p_status='processing' then p_worker_id else null end,
    lease_expires_at=case when p_status='processing' then v_job.lease_expires_at else null end,
    output_bucket=case when p_status='ready' then coalesce(nullif(p_output->>'bucket',''),output_bucket) else output_bucket end,
    output_path=case when p_status='ready' then coalesce(nullif(p_output->>'path',''),output_path) else output_path end,
    output_url=case when p_status='ready' then coalesce(nullif(p_output->>'url',''),output_url) else output_url end,
    output_mime=case when p_status='ready' then coalesce(nullif(p_output->>'mime',''),output_mime) else output_mime end,
    output_bytes=case when p_status='ready' then coalesce((p_output->>'bytes')::bigint,output_bytes) else output_bytes end,
    error_code=case when p_status in ('failed','skipped','canceled') then p_error_code else null end,
    error_message=case when p_status in ('failed','skipped','canceled') then left(coalesce(p_error_message,''),500) else null end,
    started_at=case when p_status='processing' then coalesce(started_at,now()) else started_at end,
    completed_at=case when p_status in ('ready','failed','skipped','canceled') then now() else null end
  where job_id=p_job_id and quality=p_quality
  returning * into v_row;

  if not found then raise exception 'RENDITION_NOT_FOUND'; end if;
  return jsonb_build_object('ok',true,'quality',v_row.quality,'status',v_row.status,'progress',v_row.progress);
end;
$$;

-- Utilisé seulement pour garder les sous-jobs cohérents lorsqu'un parent V1082 termine
-- après un fast-path ou après un échec secondaire. Le point 3 remplacera ensuite ce
-- comportement séquentiel par des claims indépendants de rendition.
create or replace function public.fyblic_worker_close_pending_renditions_v1113(
  p_job_id uuid,
  p_worker_id text,
  p_reason text default 'PARENT_FLOW_COMPLETE'
)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_skipped integer := 0;
  v_failed integer := 0;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id;
  if not found then raise exception 'JOB_NOT_FOUND'; end if;
  if coalesce(v_job.worker_id,'') <> coalesce(p_worker_id,'') then raise exception 'WORKER_MISMATCH'; end if;

  update public.fyblic_publication_renditions set
    status='failed', progress=greatest(progress,1), worker_id=null, lease_expires_at=null,
    error_code='RENDITION_INTERRUPTED', error_message=left(coalesce(p_reason,'RENDITION_INTERRUPTED'),500), completed_at=now()
  where job_id=p_job_id and status='processing';
  get diagnostics v_failed = row_count;

  update public.fyblic_publication_renditions set
    status='skipped', progress=100, worker_id=null, lease_expires_at=null,
    error_code='PARENT_FLOW_COMPLETE', error_message=left(coalesce(p_reason,'PARENT_FLOW_COMPLETE'),500), completed_at=now()
  where job_id=p_job_id and status='planned';
  get diagnostics v_skipped = row_count;

  return jsonb_build_object('ok',true,'failed',v_failed,'skipped',v_skipped);
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1113()
returns jsonb language sql stable security definer set search_path=public as $$
select coalesce(public.fyblic_publication_schema_status_v1082(),'{}'::jsonb) || jsonb_build_object(
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'renditions_table',to_regclass('public.fyblic_publication_renditions') is not null,
  'parent_renditions',to_regprocedure('public.fyblic_worker_seed_renditions_v1113(uuid,text,jsonb)') is not null,
  'rendition_state',to_regprocedure('public.fyblic_worker_rendition_state_v1113(uuid,text,text,text,integer,jsonb,text,text)') is not null,
  'rendition_close',to_regprocedure('public.fyblic_worker_close_pending_renditions_v1113(uuid,text,text)') is not null,
  'rendition_scheduler',false
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1113,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"renditions_table":true,"parent_renditions":true,"rendition_state":true,"rendition_close":true,"rendition_scheduler":false}'::jsonb,
  now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_worker_seed_renditions_v1113(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_rendition_state_v1113(uuid,text,text,text,integer,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.fyblic_worker_close_pending_renditions_v1113(uuid,text,text) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1113() from public,anon,authenticated;

grant execute on function public.fyblic_worker_seed_renditions_v1113(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_rendition_state_v1113(uuid,text,text,text,integer,jsonb,text,text) to service_role;
grant execute on function public.fyblic_worker_close_pending_renditions_v1113(uuid,text,text) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1113() to service_role;

commit;

select public.fyblic_publication_schema_status_v1113() as fyblic_v1113_status;
