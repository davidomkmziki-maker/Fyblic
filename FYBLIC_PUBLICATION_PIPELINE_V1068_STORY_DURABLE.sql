-- FYBLIC V1068 — Story durable + finalisation tolérante des qualités secondaires.
-- Prérequis : V1063 puis V1064 déjà exécutés. Exécuter dans Supabase SQL Editor.

begin;

create or replace function public.fyblic_insert_story_json_v1068(p_story jsonb)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_columns text; v_id text;
begin
  if coalesce(p_story->>'id','')='' then raise exception 'STORY_ID_REQUIRED'; end if;
  select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position)
    into v_columns
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='happyad_stories' and p_story ? c.column_name;
  if coalesce(v_columns,'')='' then raise exception 'STORY_COLUMNS_UNAVAILABLE'; end if;
  execute format(
    'insert into public.happyad_stories (%1$s) '
    'select %1$s from jsonb_populate_record(null::public.happyad_stories,$1) '
    'on conflict (id) do nothing',v_columns
  ) using p_story;
  v_id:=p_story->>'id'; return v_id;
end;
$$;

-- Les tâches longues peuvent être reprises par un nouveau conteneur Railway.
-- Huit tentatives serveur remplacent l'ancienne limite de trois.
create or replace function public.fyblic_worker_claim_job_v1063(
  p_worker_id text,p_lease_seconds integer default 1800
)
returns setof public.fyblic_publication_jobs
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select j.id into v_id from public.fyblic_publication_jobs j
  where (j.status='queued' or (j.status in ('processing','optimizing','finalizing') and (j.lease_expires_at is null or j.lease_expires_at<now())))
    and j.attempts<8 order by j.created_at for update skip locked limit 1;
  if v_id is null then return; end if;
  return query update public.fyblic_publication_jobs j set
    status=case when j.primary_ready then 'optimizing' else 'processing' end,
    stage=case when j.primary_ready then 'Optimisation des autres qualités' when j.attempts=0 then 'Analyse du média' else 'Reprise automatique' end,
    progress=greatest(j.progress,46),attempts=j.attempts+1,worker_id=left(coalesce(p_worker_id,'worker'),120),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),
    started_at=coalesce(j.started_at,now()),error_code=null,error_message=null
  where j.id=v_id returning j.*;
end;
$$;

create or replace function public.fyblic_worker_fail_job_v1063(
  p_job_id uuid,p_worker_id text,p_error_code text,p_error_message text
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_status text;
begin
  update public.fyblic_publication_jobs set
    status=case when primary_ready then 'published' when attempts<8 then 'queued' else 'failed' end,
    stage=case when primary_ready and publication_type='story' then 'Story publiée' when primary_ready then 'Publication publiée' when attempts<8 then 'Nouvelle tentative automatique' else 'Échec de la publication' end,
    error_code=case when primary_ready then null else left(coalesce(p_error_code,'PROCESSING_FAILED'),80) end,
    error_message=case when primary_ready then null else left(coalesce(p_error_message,'Échec du traitement'),600) end,
    lease_expires_at=case when (not primary_ready) and attempts<8 then now()-interval '1 second' else null end,
    completed_at=case when (not primary_ready) and attempts<8 then null else now() end
  where id=p_job_id and worker_id=p_worker_id returning status into v_status;
  return coalesce(v_status,'lease-lost');
end;
$$;

create or replace function public.fyblic_worker_publish_primary_v1068(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_payload jsonb; v_primary jsonb; v_poster jsonb; v_variants jsonb;
  v_row jsonb;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if v_job.status not in ('processing','optimizing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;
  if v_job.publication_type not in ('normal','story') then raise exception 'TYPE_NOT_ENABLED_V1068'; end if;

  v_payload:=coalesce(v_job.payload,'{}'::jsonb);
  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_variants:=coalesce(p_result->'variants','{}'::jsonb);
  if coalesce(v_primary->>'url','')='' then raise exception 'PRIMARY_MEDIA_REQUIRED'; end if;

  if v_job.publication_type='normal' then
    v_row:=jsonb_build_object(
      'id',v_job.post_id,'user_id',v_job.user_id,'mode','publish',
      'title',coalesce(v_payload->>'title','Publication Fyblic'),
      'description',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'hashtags',coalesce(v_payload->>'hashtags',''),'mentions',coalesce(v_payload->>'mentions',''),
      'mentioned_user_ids',coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
      'mention_handles',coalesce(v_payload->'mentionHandles','[]'::jsonb),
      'category',coalesce(v_payload->>'category',''),'location',coalesce(v_payload->>'location',''),
      'kind',v_job.media_kind,'media_type',v_job.media_kind,'media_url',v_primary->>'url',
      'media_path',coalesce(v_primary->>'path',''),'thumbnail_url',coalesce(v_poster->>'url',''),
      'poster_url',coalesce(v_poster->>'url',''),'mime_type',coalesce(v_primary->>'mime',''),
      'file_name',coalesce(v_primary->>'filename',v_job.original_name),
      'image_crop',coalesce(v_payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',v_variants)),
      'cover_frame_time',case when coalesce(v_payload->>'videoFrameTime','')~'^[0-9]+(\.[0-9]+)?$' then (v_payload->>'videoFrameTime')::numeric else 0 end,
      'creator_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'avatar_url',coalesce(v_payload->>'avatar',''),'badge',coalesce(v_payload->>'badge','aucun'),
      'created_at',coalesce(v_payload->>'created_at',now()::text)
    );
    perform public.fyblic_insert_post_json_v1064(v_row);
  else
    v_row:=jsonb_build_object(
      'id',v_job.post_id,'user_id',v_job.user_id,
      'user_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'user_avatar',coalesce(v_payload->>'avatar',''),
      'title',coalesce(v_payload->>'title','Story Fyblic'),
      'description',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'caption',coalesce(v_payload->>'desc',v_payload->>'description',''),
      'mentioned_user_ids',coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
      'mention_handles',coalesce(v_payload->'mentionHandles','[]'::jsonb),
      'media_url',v_primary->>'url','thumbnail_url',coalesce(v_poster->>'url',''),
      'poster_url',coalesce(v_poster->>'url',''),'media_type',v_job.media_kind,'kind',v_job.media_kind,
      'location_name',coalesce(v_payload->>'location',''),'is_active',true,
      'created_at',now()::text,'expires_at',(now()+interval '24 hours')::text
    );
    perform public.fyblic_insert_story_json_v1068(v_row);
  end if;

  update public.fyblic_publication_jobs set
    status='optimizing',stage=case when publication_type='story' then 'Story affichée · optimisation en arrière-plan' else 'Publication affichée · optimisation en arrière-plan' end,
    progress=greatest(progress,86),primary_ready=true,visible_at=coalesce(visible_at,now()),result=coalesce(p_result,'{}'::jsonb)
  where id=v_job.id;
  return jsonb_build_object('ok',true,'primary_ready',true,'job_id',v_job.id,'post_id',v_job.post_id,'publication_type',v_job.publication_type);
end;
$$;

create or replace function public.fyblic_worker_complete_variants_v1068(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_job public.fyblic_publication_jobs%rowtype; v_crop jsonb; v_primary jsonb; v_poster jsonb;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if not v_job.primary_ready then raise exception 'PRIMARY_NOT_READY'; end if;
  if v_job.publication_type='normal' then
    v_primary:=coalesce(p_result->'primary','{}'::jsonb); v_poster:=coalesce(p_result->'poster','{}'::jsonb);
    v_crop:=coalesce(v_job.payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',coalesce(p_result->'variants','{}'::jsonb)));
    update public.happyad_posts set
      media_url=coalesce(nullif(v_primary->>'url',''),media_url),media_path=coalesce(nullif(v_primary->>'path',''),media_path),
      thumbnail_url=coalesce(nullif(v_poster->>'url',''),thumbnail_url),poster_url=coalesce(nullif(v_poster->>'url',''),poster_url),image_crop=v_crop
    where id=v_job.post_id and user_id=v_job.user_id;
  end if;
  update public.fyblic_publication_jobs set status='published',stage=case when publication_type='story' then 'Story publiée' else 'Publication publiée' end,
    progress=100,primary_ready=true,result=coalesce(p_result,'{}'::jsonb),error_code=null,error_message=null,completed_at=now(),lease_expires_at=null
  where id=v_job.id;
  return jsonb_build_object('ok',true,'job_id',v_job.id,'post_id',v_job.post_id);
end;
$$;

create or replace function public.fyblic_worker_complete_partial_v1068(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_job public.fyblic_publication_jobs%rowtype;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if not v_job.primary_ready then raise exception 'PRIMARY_NOT_READY'; end if;
  update public.fyblic_publication_jobs set status='published',stage=case when publication_type='story' then 'Story publiée' else 'Publication publiée' end,
    progress=100,result=coalesce(p_result,result,'{}'::jsonb),error_code=null,error_message=null,completed_at=now(),lease_expires_at=null
  where id=v_job.id;
  return jsonb_build_object('ok',true,'partial',true,'job_id',v_job.id,'post_id',v_job.post_id);
end;
$$;

revoke all on function public.fyblic_insert_story_json_v1068(jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_publish_primary_v1068(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_variants_v1068(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_partial_v1068(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.fyblic_insert_story_json_v1068(jsonb) to service_role;
grant execute on function public.fyblic_worker_publish_primary_v1068(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_complete_variants_v1068(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_complete_partial_v1068(uuid,text,jsonb) to service_role;

commit;
