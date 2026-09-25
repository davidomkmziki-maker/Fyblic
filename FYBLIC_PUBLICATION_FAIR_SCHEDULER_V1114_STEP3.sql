-- FYBLIC V1114 STEP 3 — SCHEDULER EQUITABLE PAR UTILISATEUR
-- Base requise : V1113 Step 2.
-- Objectif : empêcher un utilisateur de monopoliser la file globale.
-- Principe : round-robin persistant par user_id + plafond de jobs parents actifs par utilisateur.

begin;

DO $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then
    raise exception 'FYBLIC_PUBLICATION_JOBS_REQUIRED';
  end if;
  if to_regprocedure('public.fyblic_publication_schema_status_v1113()') is null then
    raise exception 'FYBLIC_V1113_REQUIRED';
  end if;
end;
$$;

create table if not exists public.fyblic_publication_user_schedule (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_claimed_at timestamptz,
  claims_count bigint not null default 0 check (claims_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists fyblic_publication_user_schedule_last_claim_v1114
on public.fyblic_publication_user_schedule (last_claimed_at nulls first, user_id);

alter table public.fyblic_publication_user_schedule enable row level security;
revoke all on public.fyblic_publication_user_schedule from anon, authenticated;

create or replace function public.fyblic_user_schedule_touch_v1114()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fyblic_user_schedule_touch_v1114 on public.fyblic_publication_user_schedule;
create trigger fyblic_user_schedule_touch_v1114
before update on public.fyblic_publication_user_schedule
for each row execute function public.fyblic_user_schedule_touch_v1114();

create or replace function public.fyblic_worker_claim_job_v1114(
  p_worker_id text,
  p_lease_seconds integer default 1800,
  p_max_active_per_user integer default 1
)
returns setof public.fyblic_publication_jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid;
  v_id uuid;
  v_max_active integer := greatest(1, least(coalesce(p_max_active_per_user,1), 8));
begin
  -- Même récupération sûre que V1082 pour les leases expirés.
  update public.fyblic_publication_jobs
  set status='failed',stage='Échec après reprises automatiques',error_code='LEASE_EXPIRED',
      error_message='Le traitement a été interrompu après trois reprises automatiques.',
      lease_expires_at=null,completed_at=now(),worker_id=null
  where status in ('processing','optimizing','finalizing')
    and attempts>=3
    and worker_id is not null
    and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();

  -- Matérialiser les utilisateurs qui ont au moins un travail réclamable.
  insert into public.fyblic_publication_user_schedule(user_id)
  select distinct j.user_id
  from public.fyblic_publication_jobs j
  where (
      j.status='queued'
      or (j.status='optimizing' and j.worker_id is null)
      or (j.status in ('processing','optimizing','finalizing') and j.worker_id is not null and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
    )
    and j.status not in ('published','failed','canceled')
    and (j.attempts<3 or (j.primary_ready=true and j.worker_id is null))
  on conflict(user_id) do nothing;

  -- Choisir d'abord l'utilisateur le moins récemment servi.
  -- La ligne schedule est verrouillée : deux workers ne peuvent donc pas réclamer
  -- simultanément deux jobs différents du même utilisateur pendant ce claim.
  select s.user_id into v_user_id
  from public.fyblic_publication_user_schedule s
  where (
      select count(*)
      from public.fyblic_publication_jobs a
      where a.user_id=s.user_id
        and a.status in ('processing','optimizing','finalizing')
        and a.worker_id is not null
        and coalesce(a.lease_expires_at,'infinity'::timestamptz)>now()
    ) < v_max_active
    and exists (
      select 1
      from public.fyblic_publication_jobs q
      where q.user_id=s.user_id
        and (
          q.status='queued'
          or (q.status='optimizing' and q.worker_id is null)
          or (q.status in ('processing','optimizing','finalizing') and q.worker_id is not null and coalesce(q.lease_expires_at,'-infinity'::timestamptz)<now())
        )
        and q.status not in ('published','failed','canceled')
        and (q.attempts<3 or (q.primary_ready=true and q.worker_id is null))
    )
  order by
    s.last_claimed_at asc nulls first,
    (
      select min(q.created_at)
      from public.fyblic_publication_jobs q
      where q.user_id=s.user_id
        and (
          q.status='queued'
          or (q.status='optimizing' and q.worker_id is null)
          or (q.status in ('processing','optimizing','finalizing') and q.worker_id is not null and coalesce(q.lease_expires_at,'-infinity'::timestamptz)<now())
        )
        and q.status not in ('published','failed','canceled')
        and (q.attempts<3 or (q.primary_ready=true and q.worker_id is null))
    ) asc,
    s.user_id
  for update skip locked
  limit 1;

  if v_user_id is null then
    return;
  end if;

  -- À l'intérieur d'un compte, une nouvelle qualité principale passe avant
  -- les variantes secondaires d'une publication déjà visible.
  select j.id into v_id
  from public.fyblic_publication_jobs j
  where j.user_id=v_user_id
    and (
      j.status='queued'
      or (j.status='optimizing' and j.worker_id is null)
      or (j.status in ('processing','optimizing','finalizing') and j.worker_id is not null and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
    )
    and j.status not in ('published','failed','canceled')
    and (j.attempts<3 or (j.primary_ready=true and j.worker_id is null))
  order by
    case when coalesce(j.primary_ready,false)=false then 0 else 1 end,
    case j.publication_type when 'story' then 0 when 'normal' then 1 when 'album' then 1 else 2 end,
    j.created_at,
    j.asset_index
  for update skip locked
  limit 1;

  if v_id is null then
    return;
  end if;

  update public.fyblic_publication_user_schedule
  set last_claimed_at=now(), claims_count=claims_count+1
  where user_id=v_user_id;

  return query
  update public.fyblic_publication_jobs j set
    status=case when j.primary_ready then 'optimizing' else 'processing' end,
    stage=case
      when j.primary_ready then 'Optimisation en arrière-plan'
      when j.attempts=0 then 'Analyse du média'
      else 'Reprise automatique sécurisée' end,
    progress=greatest(j.progress,case when j.primary_ready then 87 else 46 end),
    attempts=case
      when j.primary_ready=true and j.worker_id is null then j.attempts
      else j.attempts+1 end,
    worker_id=left(coalesce(p_worker_id,'worker'),120),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),
    started_at=coalesce(j.started_at,now()),
    error_code=null,error_message=null
  where j.id=v_id
  returning j.*;
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1114()
returns jsonb language sql stable security definer set search_path=public as $$
select coalesce(public.fyblic_publication_schema_status_v1113(),'{}'::jsonb) || jsonb_build_object(
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'fair_user_scheduler',to_regprocedure('public.fyblic_worker_claim_job_v1114(text,integer,integer)') is not null,
  'user_schedule_table',to_regclass('public.fyblic_publication_user_schedule') is not null,
  'per_user_active_cap',true
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1114,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"renditions_table":true,"parent_renditions":true,"rendition_state":true,"rendition_close":true,"rendition_scheduler":false,"fair_user_scheduler":true,"user_schedule_table":true,"per_user_active_cap":true}'::jsonb,
  now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_worker_claim_job_v1114(text,integer,integer) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1114() from public,anon,authenticated;
grant execute on function public.fyblic_worker_claim_job_v1114(text,integer,integer) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1114() to service_role;

commit;

select public.fyblic_publication_schema_status_v1114() as fyblic_v1114_status;
