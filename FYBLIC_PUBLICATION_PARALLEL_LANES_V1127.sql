-- FYBLIC V1127 — ordonnanceur durable multi-utilisateurs + lanes séparées.
-- Prérequis : FYBLIC_PUBLICATION_ENGINE_V1082.sql déjà appliqué.
-- Aucun post, story, média ou job existant n'est supprimé.
begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then raise exception 'FYBLIC_V1082_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_publish_primary_v1082(uuid,text,jsonb,boolean)') is null then raise exception 'FYBLIC_V1082_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer)') is null then raise exception 'FYBLIC_V1082_REQUIRED'; end if;
end;
$$;

-- Une ligne par compte permet de verrouiller atomiquement l'ordonnancement d'un utilisateur.
-- Deux replicas ne peuvent donc pas prendre deux grosses compressions du même compte au même instant.
create table if not exists public.fyblic_publication_user_scheduler_v1127 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_claimed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.fyblic_publication_user_scheduler_v1127 enable row level security;
revoke all on public.fyblic_publication_user_scheduler_v1127 from public,anon,authenticated;
grant select,insert,update on public.fyblic_publication_user_scheduler_v1127 to service_role;

insert into public.fyblic_publication_user_scheduler_v1127(user_id)
select distinct user_id from public.fyblic_publication_jobs
on conflict(user_id) do nothing;

create or replace function public.fyblic_publication_scheduler_seed_v1127()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.fyblic_publication_user_scheduler_v1127(user_id)
  values(new.user_id)
  on conflict(user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists fyblic_publication_scheduler_seed_v1127 on public.fyblic_publication_jobs;
create trigger fyblic_publication_scheduler_seed_v1127
after insert on public.fyblic_publication_jobs
for each row execute function public.fyblic_publication_scheduler_seed_v1127();

create index if not exists fyblic_publication_jobs_lane_v1127_idx
  on public.fyblic_publication_jobs (primary_ready,status,created_at,asset_index);
create index if not exists fyblic_publication_jobs_user_active_v1127_idx
  on public.fyblic_publication_jobs (user_id,lease_expires_at)
  where worker_id is not null and status in ('processing','optimizing','finalizing');
create index if not exists fyblic_publication_jobs_user_started_v1127_idx
  on public.fyblic_publication_jobs (user_id,started_at desc) where started_at is not null;

create or replace function public.fyblic_worker_claim_job_v1127(
  p_worker_id text,
  p_lease_seconds integer default 1800,
  p_lane text default 'primary'
)
returns setof public.fyblic_publication_jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_user_id uuid;
  v_lane text:=lower(coalesce(nullif(trim(p_lane),''),'primary'));
begin
  if v_lane not in ('primary','optimization') then
    raise exception 'FYBLIC_INVALID_LANE: %',v_lane;
  end if;

  -- Seuls les primaires réellement épuisés deviennent failed. Une optimisation 1080p
  -- peut être reprise plus tard sans transformer une publication déjà visible en échec.
  update public.fyblic_publication_jobs
  set status='failed',stage='Échec après reprises automatiques',error_code='LEASE_EXPIRED',
      error_message='Le traitement a été interrompu après trois reprises automatiques.',
      lease_expires_at=null,completed_at=now(),worker_id=null,updated_at=now()
  where status in ('processing','optimizing','finalizing')
    and attempts>=3
    and coalesce(primary_ready,false)=false
    and worker_id is not null
    and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();

  -- Le trigger couvre les nouveaux jobs; ce backfill protège les lignes historiques.
  insert into public.fyblic_publication_user_scheduler_v1127(user_id)
  select distinct j.user_id
  from public.fyblic_publication_jobs j
  where j.status not in ('published','failed','canceled')
  on conflict(user_id) do nothing;

  select j.id,j.user_id into v_id,v_user_id
  from public.fyblic_publication_jobs j
  join public.fyblic_publication_user_scheduler_v1127 sched on sched.user_id=j.user_id
  where j.status not in ('published','failed','canceled')
    and (
      (v_lane='primary'
       and coalesce(j.primary_ready,false)=false
       and j.attempts<3
       and (
         j.status='queued'
         or (j.status in ('processing','optimizing','finalizing') and j.worker_id is not null
             and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
       ))
      or
      (v_lane='optimization'
       and j.primary_ready=true
       and (
         (j.status='optimizing' and j.worker_id is null)
         or (j.status in ('processing','optimizing','finalizing') and j.worker_id is not null
             and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
       ))
    )
    -- Un compte ne peut occuper qu'une compression lourde sur l'ensemble des replicas.
    and not exists (
      select 1 from public.fyblic_publication_jobs active
      where active.user_id=j.user_id
        and active.id<>j.id
        and active.worker_id is not null
        and active.status in ('processing','optimizing','finalizing')
        and coalesce(active.lease_expires_at,'-infinity'::timestamptz)>now()
    )
  order by
    sched.last_claimed_at nulls first,
    case when v_lane='optimization'
           and (case when coalesce(j.result->>'sourceHeight','') ~ '^[0-9]+$'
                     then (j.result->>'sourceHeight')::integer else 0 end)>=1080
           and not (coalesce(j.result->'variants','{}'::jsonb) ? '1080p')
         then 0 else 1 end,
    j.created_at,
    j.asset_index
  for update of sched,j skip locked
  limit 1;

  if v_id is null then return; end if;

  update public.fyblic_publication_user_scheduler_v1127
  set last_claimed_at=now(),updated_at=now()
  where user_id=v_user_id;

  return query
  update public.fyblic_publication_jobs j set
    status=case when v_lane='optimization' then 'optimizing' else 'processing' end,
    stage=case
      when v_lane='optimization' then 'Optimisation en arrière-plan'
      when j.attempts=0 then 'Analyse du média'
      else 'Reprise automatique sécurisée' end,
    progress=greatest(j.progress,case when v_lane='optimization' then 87 else 46 end),
    attempts=case when v_lane='optimization' then j.attempts else j.attempts+1 end,
    worker_id=left(coalesce(p_worker_id,'worker'),120),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),
    started_at=coalesce(j.started_at,now()),
    updated_at=now(),
    error_code=null,error_message=null
  where j.id=v_id
  returning j.*;
end;
$$;

-- Realtime permet au lecteur actif de recevoir l'arrivée du 1080p sans actualiser la page.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='happyad_posts'
     ) then
    execute 'alter publication supabase_realtime add table public.happyad_posts';
  end if;
exception when duplicate_object then null;
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1127()
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object(
  'component','publication_pipeline',
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'normal',to_regprocedure('public.fyblic_worker_publish_primary_v1082(uuid,text,jsonb,boolean)') is not null,
  'story',to_regprocedure('public.fyblic_insert_story_json_v1069(jsonb)') is not null,
  'boutique',to_regprocedure('public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer)') is not null,
  'album',to_regprocedure('public.fyblic_worker_publish_primary_v1082(uuid,text,jsonb,boolean)') is not null,
  'claim_optimizing',to_regprocedure('public.fyblic_worker_claim_job_v1127(text,integer,text)') is not null,
  'heartbeat',to_regprocedure('public.fyblic_worker_heartbeat_v1082(uuid,text,integer)') is not null,
  'group_assets',exists(select 1 from information_schema.columns where table_schema='public' and table_name='fyblic_publication_jobs' and column_name='publication_group_id'),
  'group_finalize',to_regprocedure('public.fyblic_worker_finalize_album_group_v1081(text,uuid)') is not null,
  'jobs_table',to_regclass('public.fyblic_publication_jobs') is not null,
  'posts_table',to_regclass('public.happyad_posts') is not null,
  'post_media_safe',to_regprocedure('public.fyblic_insert_post_json_v1081(jsonb)') is not null
    and to_regprocedure('public.fyblic_update_post_media_v1081(text,uuid,jsonb)') is not null,
  'stories_table',to_regclass('public.happyad_stories') is not null,
  'yielding_optimization',true,
  'poster_before_primary',true,
  'lane_isolation',to_regclass('public.fyblic_publication_user_scheduler_v1127') is not null,
  'user_fairness',to_regprocedure('public.fyblic_worker_claim_job_v1127(text,integer,text)') is not null,
  'realtime_posts',exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='happyad_posts')
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1127,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"lane_isolation":true,"user_fairness":true,"realtime_posts":true}'::jsonb,
  now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_publication_scheduler_seed_v1127() from public,anon,authenticated;
revoke all on function public.fyblic_worker_claim_job_v1127(text,integer,text) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1127() from public,anon,authenticated;
grant execute on function public.fyblic_worker_claim_job_v1127(text,integer,text) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1127() to service_role;

commit;

select public.fyblic_publication_schema_status_v1127() as fyblic_v1127_status;
