-- FYBLIC V1071 — reprise définitive des tâches Story et Boutique pendant l'optimisation.
-- Pré-requis : FYBLIC_PUBLICATION_PIPELINE_V1069_SCHEMA_GUARD.sql exécuté avec succès.
-- Utiliser la copie identique incluse dans l'archive Worker V1071 ou Site V1071.

begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then raise exception 'FYBLIC_V1069_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_publish_primary_v1069(uuid,text,jsonb)') is null then raise exception 'FYBLIC_V1069_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_complete_variants_v1069(uuid,text,jsonb)') is null then raise exception 'FYBLIC_V1069_REQUIRED'; end if;
end;
$$;

create or replace function public.fyblic_worker_claim_job_v1071(p_worker_id text,p_lease_seconds integer default 1800)
returns setof public.fyblic_publication_jobs language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  update public.fyblic_publication_jobs set status='failed',stage='Échec après reprises automatiques',error_code='LEASE_EXPIRED',error_message='Le traitement a été interrompu après trois reprises automatiques.',lease_expires_at=null,completed_at=now()
  where status in ('processing','optimizing','finalizing') and attempts>=3 and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();
  select j.id into v_id from public.fyblic_publication_jobs j
  where (j.status='queued' or (j.status in ('processing','optimizing','finalizing') and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())) and j.attempts<3
  order by j.created_at for update skip locked limit 1;
  if v_id is null then return; end if;
  return query update public.fyblic_publication_jobs j set status='processing',stage=case when j.attempts=0 then 'Analyse du média' else 'Reprise automatique sécurisée' end,progress=greatest(j.progress,46),attempts=j.attempts+1,worker_id=left(coalesce(p_worker_id,'worker'),120),lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),started_at=coalesce(j.started_at,now()),error_code=null,error_message=null where j.id=v_id returning j.*;
end;
$$;

create or replace function public.fyblic_worker_progress_v1071(p_job_id uuid,p_worker_id text,p_progress integer,p_stage text,p_lease_seconds integer default 1800)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.fyblic_publication_jobs set progress=greatest(progress,least(98,greatest(46,coalesce(p_progress,46)))),stage=left(coalesce(nullif(p_stage,''),stage,'Compression'),180),lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))) where id=p_job_id and worker_id=p_worker_id and status in ('processing','optimizing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_worker_heartbeat_v1071(p_job_id uuid,p_worker_id text,p_lease_seconds integer default 1800)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.fyblic_publication_jobs set lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))) where id=p_job_id and worker_id=p_worker_id and status in ('processing','optimizing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1071()
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object('component','publication_pipeline','version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),'normal',to_regprocedure('public.fyblic_worker_publish_primary_v1069(uuid,text,jsonb)') is not null,'story',to_regprocedure('public.fyblic_insert_story_json_v1069(jsonb)') is not null,'boutique',to_regprocedure('public.fyblic_worker_complete_variants_v1069(uuid,text,jsonb)') is not null,'claim_optimizing',to_regprocedure('public.fyblic_worker_claim_job_v1071(text,integer)') is not null,'heartbeat',to_regprocedure('public.fyblic_worker_heartbeat_v1071(uuid,text,integer)') is not null,'jobs_table',to_regclass('public.fyblic_publication_jobs') is not null,'posts_table',to_regclass('public.happyad_posts') is not null,'stories_table',to_regclass('public.happyad_stories') is not null);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at) values ('publication_pipeline',1071,'{"normal":true,"story":true,"boutique":true,"schema_guard":true,"claim_optimizing":true,"heartbeat":true}'::jsonb,now(),now()) on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();
revoke all on function public.fyblic_worker_claim_job_v1071(text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_progress_v1071(uuid,text,integer,text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_heartbeat_v1071(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1071() from public,anon,authenticated;
grant execute on function public.fyblic_worker_claim_job_v1071(text,integer) to service_role;
grant execute on function public.fyblic_worker_progress_v1071(uuid,text,integer,text,integer) to service_role;
grant execute on function public.fyblic_worker_heartbeat_v1071(uuid,text,integer) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1071() to service_role;

commit;
select public.fyblic_publication_schema_status_v1071() as fyblic_v1071_status;
