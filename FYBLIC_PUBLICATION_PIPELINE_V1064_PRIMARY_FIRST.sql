-- FYBLIC V1064 — correctif 23502 + qualité principale affichée avant variantes.
-- Compatible avec V1063 déjà installée. Exécuter dans Supabase SQL Editor.

begin;

alter table public.fyblic_publication_jobs
  add column if not exists primary_ready boolean not null default false,
  add column if not exists visible_at timestamptz;

alter table public.fyblic_publication_jobs
  drop constraint if exists fyblic_publication_jobs_status_check;

alter table public.fyblic_publication_jobs
  add constraint fyblic_publication_jobs_status_check
  check (status in ('uploading','queued','processing','optimizing','finalizing','published','failed','canceled'));

-- Insertion sélective : seules les colonnes réellement fournies sont insérées.
-- Les autres colonnes obligatoires gardent leurs DEFAULT au lieu de recevoir NULL.
create or replace function public.fyblic_insert_post_json_v1064(p_post jsonb)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_columns text;
  v_id text;
begin
  if coalesce(p_post->>'id','') = '' then raise exception 'POST_ID_REQUIRED'; end if;

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
    'on conflict (id) do nothing',
    v_columns
  ) using p_post;

  v_id := p_post->>'id';
  return v_id;
end;
$$;

create or replace function public.fyblic_worker_claim_job_v1063(
  p_worker_id text,
  p_lease_seconds integer default 1800
)
returns setof public.fyblic_publication_jobs
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select j.id into v_id
  from public.fyblic_publication_jobs j
  where (
    j.status='queued'
    or (
      j.status in ('processing','optimizing','finalizing')
      and (j.lease_expires_at is null or j.lease_expires_at < now())
    )
  )
  and j.attempts < 3
  order by j.created_at
  for update skip locked
  limit 1;

  if v_id is null then return; end if;

  return query
  update public.fyblic_publication_jobs j set
    status=case when j.primary_ready then 'optimizing' else 'processing' end,
    stage=case when j.primary_ready then 'Optimisation des autres qualités' when j.attempts=0 then 'Analyse du média' else 'Reprise automatique' end,
    progress=greatest(j.progress,46),
    attempts=j.attempts+1,
    worker_id=left(coalesce(p_worker_id,'worker'),120),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),
    started_at=coalesce(j.started_at,now()),
    error_code=null,
    error_message=null
  where j.id=v_id
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
    progress=greatest(progress,least(98,greatest(46,coalesce(p_progress,46)))),
    stage=left(coalesce(p_stage,'Compression'),180),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200)))
  where id=p_job_id
    and worker_id=p_worker_id
    and status in ('processing','optimizing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_worker_publish_primary_v1064(
  p_job_id uuid,
  p_worker_id text,
  p_result jsonb
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
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if v_job.status not in ('processing','optimizing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;
  if v_job.publication_type <> 'normal' then raise exception 'TYPE_NOT_ENABLED_V1064'; end if;

  v_payload:=coalesce(v_job.payload,'{}'::jsonb);
  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_variants:=coalesce(p_result->'variants','{}'::jsonb);
  if coalesce(v_primary->>'url','')='' then raise exception 'PRIMARY_MEDIA_REQUIRED'; end if;

  v_post:=jsonb_build_object(
    'id',v_job.post_id,
    'user_id',v_job.user_id,
    'mode','publish',
    'title',coalesce(v_payload->>'title','Publication Fyblic'),
    'description',coalesce(v_payload->>'desc',v_payload->>'description',''),
    'hashtags',coalesce(v_payload->>'hashtags',''),
    'mentions',coalesce(v_payload->>'mentions',''),
    'mentioned_user_ids',coalesce(v_payload->'mentionedUserIds','[]'::jsonb),
    'mention_handles',coalesce(v_payload->'mentionHandles','[]'::jsonb),
    'category',coalesce(v_payload->>'category',''),
    'location',coalesce(v_payload->>'location',''),
    'kind',v_job.media_kind,
    'media_type',v_job.media_kind,
    'media_url',v_primary->>'url',
    'media_path',coalesce(v_primary->>'path',''),
    'thumbnail_url',coalesce(v_poster->>'url',''),
    'poster_url',coalesce(v_poster->>'url',''),
    'mime_type',coalesce(v_primary->>'mime',''),
    'file_name',coalesce(v_primary->>'filename',v_job.original_name),
    'image_crop',coalesce(v_payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',v_variants)),
    'cover_frame_time',case when coalesce(v_payload->>'videoFrameTime','')~'^[0-9]+(\.[0-9]+)?$' then (v_payload->>'videoFrameTime')::numeric else 0 end,
    'creator_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
    'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
    'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
    'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
    'avatar_url',coalesce(v_payload->>'avatar',''),
    'badge',coalesce(v_payload->>'badge','aucun'),
    'created_at',coalesce(v_payload->>'created_at',now()::text)
  );

  perform public.fyblic_insert_post_json_v1064(v_post);

  update public.fyblic_publication_jobs set
    status='optimizing',stage='Publication affichée · optimisation en arrière-plan',
    progress=greatest(progress,86),primary_ready=true,visible_at=coalesce(visible_at,now()),
    result=coalesce(p_result,'{}'::jsonb)
  where id=v_job.id;

  return jsonb_build_object('ok',true,'primary_ready',true,'job_id',v_job.id,'post_id',v_job.post_id);
end;
$$;

create or replace function public.fyblic_worker_complete_variants_v1064(
  p_job_id uuid,
  p_worker_id text,
  p_result jsonb
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
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if not v_job.primary_ready then raise exception 'PRIMARY_NOT_READY'; end if;

  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_crop:=coalesce(v_job.payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',2,'mode','connection','variants',coalesce(p_result->'variants','{}'::jsonb)));

  update public.happyad_posts set
    media_url=coalesce(nullif(v_primary->>'url',''),media_url),
    media_path=coalesce(nullif(v_primary->>'path',''),media_path),
    thumbnail_url=coalesce(nullif(v_poster->>'url',''),thumbnail_url),
    poster_url=coalesce(nullif(v_poster->>'url',''),poster_url),
    image_crop=v_crop
  where id=v_job.post_id and user_id=v_job.user_id;

  update public.fyblic_publication_jobs set
    status='published',stage='Publication publiée',progress=100,primary_ready=true,
    result=coalesce(p_result,'{}'::jsonb),completed_at=now(),lease_expires_at=null
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
    status=case
      when primary_ready and attempts<3 then 'optimizing'
      when primary_ready then 'published'
      when attempts<3 then 'queued'
      else 'failed'
    end,
    stage=case
      when primary_ready and attempts<3 then 'Publication affichée · reprise de l’optimisation'
      when primary_ready then 'Publication affichée'
      when attempts<3 then 'Nouvelle tentative automatique'
      else 'Échec de la publication'
    end,
    error_code=left(coalesce(p_error_code,'PROCESSING_FAILED'),80),
    error_message=left(coalesce(p_error_message,'Échec du traitement'),600),
    lease_expires_at=case when attempts<3 then now()-interval '1 second' else null end,
    completed_at=case when attempts<3 then null else now() end
  where id=p_job_id and worker_id=p_worker_id
  returning status into v_status;
  return coalesce(v_status,'lease-lost');
end;
$$;

revoke all on function public.fyblic_insert_post_json_v1064(jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_publish_primary_v1064(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_variants_v1064(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.fyblic_insert_post_json_v1064(jsonb) to service_role;
grant execute on function public.fyblic_worker_publish_primary_v1064(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_complete_variants_v1064(uuid,text,jsonb) to service_role;

commit;

select column_name
from information_schema.columns
where table_schema='public' and table_name='fyblic_publication_jobs'
  and column_name in ('primary_ready','visible_at')
order by column_name;
