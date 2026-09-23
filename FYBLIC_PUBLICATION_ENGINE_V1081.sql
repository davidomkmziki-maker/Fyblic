-- FYBLIC V1081 — moteur unifié Normal + Story + Boutique.
-- Cette migration NE SUPPRIME aucune publication ni ancienne table.
-- Pré-requis : V1069/V1071 déjà installées.

begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then raise exception 'FYBLIC_V1063_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_insert_post_json_v1069(jsonb)') is null then raise exception 'FYBLIC_V1069_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_insert_story_json_v1069(jsonb)') is null then raise exception 'FYBLIC_V1069_REQUIRED'; end if;
  if to_regclass('public.happyad_posts') is null then raise exception 'HAPPYAD_POSTS_REQUIRED'; end if;
  if to_regclass('public.happyad_stories') is null then raise exception 'HAPPYAD_STORIES_REQUIRED'; end if;
end;
$$;

alter table public.fyblic_publication_jobs
  add column if not exists publication_group_id text,
  add column if not exists asset_index integer not null default 0,
  add column if not exists asset_count integer not null default 1;

create index if not exists fyblic_publication_jobs_group_v1081
on public.fyblic_publication_jobs(user_id, publication_group_id, asset_index);

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

-- V1081 : insertion Normal tolérante aux différences de schéma historiques.
-- Seules les colonnes réellement présentes dans happyad_posts sont utilisées.
create or replace function public.fyblic_insert_post_json_v1081(p_post jsonb)
returns text language plpgsql security definer set search_path=public as $$
declare
  v_columns text;
  v_updates text;
  v_id text;
begin
  if not (coalesce(p_post,'{}'::jsonb) ? 'id') then raise exception 'POST_ID_REQUIRED'; end if;
  select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position)
    into v_columns
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='happyad_posts' and p_post ? c.column_name;
  if coalesce(v_columns,'')='' then raise exception 'POST_COLUMNS_UNAVAILABLE'; end if;

  select string_agg(format('%1$I=excluded.%1$I',c.column_name),', ' order by c.ordinal_position)
    into v_updates
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='happyad_posts'
    and c.column_name in ('media_url','media_path','thumbnail_url','poster_url','image_crop','mime_type','file_name')
    and p_post ? c.column_name;
  if coalesce(v_updates,'')='' then v_updates:='id=excluded.id'; end if;

  execute format(
    'insert into public.happyad_posts (%1$s) '
    'select %1$s from jsonb_populate_record(null::public.happyad_posts,$1) '
    'on conflict (id) do update set %2$s returning id::text',
    v_columns,v_updates
  ) using p_post into v_id;
  if coalesce(v_id,'')='' then raise exception 'POST_ID_MISSING'; end if;
  return v_id;
end;
$$;

-- Mise à jour finale dynamique : aucune colonne optionnelle absente ne peut casser la publication.
create or replace function public.fyblic_update_post_media_v1081(p_post_id text,p_user_id uuid,p_patch jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare
  v_columns text;
  v_count integer:=0;
begin
  select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position)
    into v_columns
  from information_schema.columns c
  where c.table_schema='public' and c.table_name='happyad_posts'
    and c.column_name not in ('id','user_id') and coalesce(p_patch,'{}'::jsonb) ? c.column_name;
  if coalesce(v_columns,'')='' then return false; end if;
  execute format(
    'update public.happyad_posts p set (%1$s)=(select %1$s from jsonb_populate_record(null::public.happyad_posts,$1)) '
    'where p.id::text=$2 and p.user_id::text=$3',v_columns
  ) using p_patch,p_post_id,p_user_id::text;
  get diagnostics v_count=row_count;
  return v_count>0;
end;
$$;

create or replace function public.fyblic_worker_claim_job_v1081(p_worker_id text,p_lease_seconds integer default 1800)
returns setof public.fyblic_publication_jobs language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  update public.fyblic_publication_jobs
  set status='failed',stage='Échec après reprises automatiques',error_code='LEASE_EXPIRED',
      error_message='Le traitement a été interrompu après trois reprises automatiques.',
      lease_expires_at=null,completed_at=now()
  where status in ('processing','optimizing','finalizing')
    and attempts>=3
    and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();

  select j.id into v_id
  from public.fyblic_publication_jobs j
  where (
      j.status='queued'
      or (j.status in ('processing','optimizing','finalizing') and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
    )
    and j.attempts<3
  order by
    case j.publication_type when 'story' then 0 when 'normal' then 1 when 'album' then 1 else 2 end,
    j.created_at,
    j.asset_index
  for update skip locked
  limit 1;

  if v_id is null then return; end if;

  return query
  update public.fyblic_publication_jobs j set
    status='processing',
    stage=case when j.attempts=0 then 'Analyse du média' else 'Reprise automatique sécurisée' end,
    progress=greatest(j.progress,46),
    attempts=j.attempts+1,
    worker_id=left(coalesce(p_worker_id,'worker'),120),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))),
    started_at=coalesce(j.started_at,now()),
    error_code=null,error_message=null
  where j.id=v_id
  returning j.*;
end;
$$;

create or replace function public.fyblic_worker_progress_v1081(
  p_job_id uuid,p_worker_id text,p_progress integer,p_stage text,p_lease_seconds integer default 1800
)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.fyblic_publication_jobs set
    progress=greatest(progress,least(98,greatest(46,coalesce(p_progress,46)))),
    stage=left(coalesce(nullif(p_stage,''),stage,'Publication en cours'),180),
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200)))
  where id=p_job_id and worker_id=p_worker_id and status in ('processing','optimizing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_worker_heartbeat_v1081(
  p_job_id uuid,p_worker_id text,p_lease_seconds integer default 1800
)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.fyblic_publication_jobs set
    lease_expires_at=now()+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200)))
  where id=p_job_id and worker_id=p_worker_id and status in ('processing','optimizing','finalizing');
  return found;
end;
$$;

create or replace function public.fyblic_worker_finalize_album_group_v1081(
  p_group_id text,p_user_id uuid
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_expected integer;
  v_total integer;
  v_ready integer;
  v_job public.fyblic_publication_jobs%rowtype;
  v_payload jsonb;
  v_primary jsonb;
  v_poster jsonb;
  v_variants jsonb;
  v_post jsonb;
begin
  if coalesce(trim(p_group_id),'')='' or p_user_id is null then raise exception 'ALBUM_GROUP_REQUIRED'; end if;

  -- Une seule transaction peut rendre ce groupe visible. L'insert v1069 est
  -- idempotent, donc un nouvel appel après reprise reste sans doublon.
  perform pg_advisory_xact_lock(hashtextextended('fyblic-v1081-album:'||p_user_id::text||':'||p_group_id,0));

  select max(asset_count),count(*),count(*) filter(where primary_ready=true)
    into v_expected,v_total,v_ready
  from public.fyblic_publication_jobs
  where user_id=p_user_id and publication_group_id=p_group_id and publication_type='album'
    and status not in ('failed','canceled');

  if coalesce(v_expected,0)<=0 or v_total<>v_expected or v_ready<>v_expected then
    return jsonb_build_object('ok',true,'ready',false,'group_id',p_group_id,
      'expected',coalesce(v_expected,0),'total',coalesce(v_total,0),'primary_ready',coalesce(v_ready,0));
  end if;

  for v_job in
    select * from public.fyblic_publication_jobs
    where user_id=p_user_id and publication_group_id=p_group_id and publication_type='album'
      and status not in ('failed','canceled') and primary_ready=true
    order by asset_index,id
  loop
    v_payload:=coalesce(v_job.payload,'{}'::jsonb);
    v_primary:=coalesce(v_job.result->'primary','{}'::jsonb);
    v_poster:=coalesce(v_job.result->'poster','{}'::jsonb);
    v_variants:=coalesce(v_job.result->'variants','{}'::jsonb);
    if coalesce(v_primary->>'url','')='' then raise exception 'ALBUM_PRIMARY_MEDIA_REQUIRED'; end if;

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
      'image_crop',coalesce(v_payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',4,'mode','connection','variants',v_variants)),
      'cover_frame_time',case when coalesce(v_payload->>'videoFrameTime','')~'^[0-9]+(\.[0-9]+)?$' then (v_payload->>'videoFrameTime')::numeric else 0 end,
      'creator_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'avatar_url',coalesce(v_payload->>'avatar',''),'badge',coalesce(v_payload->>'badge','aucun'),
      'batch_id',coalesce(v_payload->>'batchId',v_payload->>'batch_id',p_group_id),
      'group_index',case
        when coalesce(v_payload->>'groupIndex',v_payload->>'group_index','') ~ '^[0-9]+$'
          then coalesce(v_payload->>'groupIndex',v_payload->>'group_index')::integer else v_job.asset_index end,
      'photo_index',case
        when coalesce(v_payload->>'photoIndex',v_payload->>'photo_index','') ~ '^[0-9]+$'
          then coalesce(v_payload->>'photoIndex',v_payload->>'photo_index')::integer else v_job.asset_index end,
      'created_at',coalesce(v_payload->>'created_at',now()::text)
    );
    perform public.fyblic_insert_post_json_v1081(v_post);
  end loop;

  update public.fyblic_publication_jobs
  set result=coalesce(result,'{}'::jsonb)||jsonb_build_object('group_visible',true),
      visible_at=coalesce(visible_at,now()),
      stage=case when status='published' then 'Publication publiée' else 'Album affiché · optimisation en arrière-plan' end
  where user_id=p_user_id and publication_group_id=p_group_id and publication_type='album'
    and status not in ('failed','canceled');

  return jsonb_build_object('ok',true,'ready',true,'group_id',p_group_id,'asset_count',v_expected);
end;
$$;

create or replace function public.fyblic_worker_publish_primary_v1081(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
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
  if v_job.publication_type not in ('normal','story','boutique','album') then raise exception 'TYPE_NOT_ENABLED_V1081'; end if;

  v_payload:=coalesce(v_job.payload,'{}'::jsonb);
  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_variants:=coalesce(p_result->'variants','{}'::jsonb);
  if coalesce(v_primary->>'url','')='' then raise exception 'PRIMARY_MEDIA_REQUIRED'; end if;
  v_result:=coalesce(v_job.result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb);

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
      'image_crop',coalesce(v_payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',4,'mode','connection','variants',v_variants)),
      'cover_frame_time',case when coalesce(v_payload->>'videoFrameTime','')~'^[0-9]+(\.[0-9]+)?$' then (v_payload->>'videoFrameTime')::numeric else 0 end,
      'creator_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'display_name',coalesce(v_payload->>'creatorName','Utilisateur Fyblic'),
      'handle',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'username',trim(leading '@' from coalesce(v_payload->>'handle','')),
      'avatar_url',coalesce(v_payload->>'avatar',''),'badge',coalesce(v_payload->>'badge','aucun'),
      'batch_id',coalesce(v_payload->>'batchId',v_payload->>'batch_id',''),
      'group_index',case
        when coalesce(v_payload->>'groupIndex',v_payload->>'group_index','') ~ '^[0-9]+$'
          then coalesce(v_payload->>'groupIndex',v_payload->>'group_index')::integer
        else v_job.asset_index
      end,
      'photo_index',case
        when coalesce(v_payload->>'photoIndex',v_payload->>'photo_index','') ~ '^[0-9]+$'
          then coalesce(v_payload->>'photoIndex',v_payload->>'photo_index')::integer
        else v_job.asset_index
      end,
      'created_at',coalesce(v_payload->>'created_at',now()::text)
    );
    perform public.fyblic_insert_post_json_v1081(v_post);
  elsif v_job.publication_type='album' then
    -- Un album ne devient jamais visible média par média. Chaque enfant garde
    -- sa qualité principale ici; la fonction de groupe ci-dessous publie tout
    -- l'album atomiquement quand TOUS les enfants sont prêts.
    v_result:=v_result||jsonb_build_object('group_visible',false);
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
    -- Boutique : le worker prépare tous les médias. L'annonce est enregistrée UNE fois
    -- par le maître Marketplace avec le tableau complet de médias préparés.
    v_result:=v_result||jsonb_build_object(
      'listing_id',coalesce(v_payload->>'listingId',''),
      'media_index',coalesce(v_payload->'mediaIndex',to_jsonb(v_job.asset_index))
    );
  end if;

  update public.fyblic_publication_jobs set
    status='optimizing',
    stage=case
      when publication_type='story' then 'Story affichée · optimisation en arrière-plan'
      when publication_type='boutique' then 'Média Boutique prêt · optimisation en arrière-plan'
      when publication_type='album' then 'Média album prêt · attente du groupe'
      else 'Publication affichée · optimisation en arrière-plan' end,
    progress=greatest(progress,86),primary_ready=true,
    visible_at=case when publication_type='album' then visible_at else coalesce(visible_at,now()) end,
    result=v_result
  where id=v_job.id;

  if v_job.publication_type='album' then
    perform public.fyblic_worker_finalize_album_group_v1081(v_job.publication_group_id,v_job.user_id);
  end if;

  return jsonb_build_object('ok',true,'primary_ready',true,'job_id',v_job.id,'post_id',v_job.post_id,
    'publication_type',v_job.publication_type,'story_id',v_story_id,'group_id',v_job.publication_group_id,
    'asset_index',v_job.asset_index,'asset_count',v_job.asset_count);
end;
$$;

create or replace function public.fyblic_worker_complete_variants_v1081(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
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
  if v_job.publication_type not in ('normal','story','boutique','album') then raise exception 'TYPE_NOT_ENABLED_V1081'; end if;

  v_primary:=coalesce(p_result->'primary','{}'::jsonb);
  v_poster:=coalesce(p_result->'poster','{}'::jsonb);
  v_final_result:=coalesce(v_job.result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb);

  if v_job.publication_type in ('normal','album') then
    v_crop:=coalesce(v_job.payload->'imageCrop','{}'::jsonb)||jsonb_build_object('adaptive',jsonb_build_object('v',4,'mode','connection','variants',coalesce(p_result->'variants','{}'::jsonb)));
    perform public.fyblic_update_post_media_v1081(
      v_job.post_id,v_job.user_id,
      jsonb_strip_nulls(jsonb_build_object(
        'media_url',nullif(v_primary->>'url',''),
        'media_path',nullif(v_primary->>'path',''),
        'thumbnail_url',nullif(v_poster->>'url',''),
        'poster_url',nullif(v_poster->>'url',''),
        'image_crop',v_crop
      ))
    );
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
    status='published',
    stage=case when publication_type='story' then 'Story publiée' when publication_type='boutique' then 'Média Boutique prêt' else 'Publication publiée' end,
    progress=100,primary_ready=true,result=v_final_result,completed_at=now(),lease_expires_at=null
  where id=v_job.id;

  return jsonb_build_object('ok',true,'job_id',v_job.id,'post_id',v_job.post_id,'publication_type',v_job.publication_type,
    'story_id',v_story_id,'group_id',v_job.publication_group_id,'asset_index',v_job.asset_index,'asset_count',v_job.asset_count);
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1081()
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object(
  'component','publication_pipeline',
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'normal',to_regprocedure('public.fyblic_worker_publish_primary_v1081(uuid,text,jsonb)') is not null,
  'story',to_regprocedure('public.fyblic_insert_story_json_v1069(jsonb)') is not null,
  'boutique',to_regprocedure('public.fyblic_worker_complete_variants_v1081(uuid,text,jsonb)') is not null,
  'album',to_regprocedure('public.fyblic_worker_publish_primary_v1081(uuid,text,jsonb)') is not null,
  'claim_optimizing',to_regprocedure('public.fyblic_worker_claim_job_v1081(text,integer)') is not null,
  'heartbeat',to_regprocedure('public.fyblic_worker_heartbeat_v1081(uuid,text,integer)') is not null,
  'group_assets',exists(select 1 from information_schema.columns where table_schema='public' and table_name='fyblic_publication_jobs' and column_name='publication_group_id'),
  'group_finalize',to_regprocedure('public.fyblic_worker_finalize_album_group_v1081(text,uuid)') is not null,
  'jobs_table',to_regclass('public.fyblic_publication_jobs') is not null,
  'posts_table',to_regclass('public.happyad_posts') is not null,
  'post_media_safe',to_regprocedure('public.fyblic_insert_post_json_v1081(jsonb)') is not null
    and to_regprocedure('public.fyblic_update_post_media_v1081(text,uuid,jsonb)') is not null
    and exists(select 1 from information_schema.columns where table_schema='public' and table_name='happyad_posts' and column_name='id')
    and exists(select 1 from information_schema.columns where table_schema='public' and table_name='happyad_posts' and column_name='user_id')
    and exists(select 1 from information_schema.columns where table_schema='public' and table_name='happyad_posts' and column_name='media_url'),
  'stories_table',to_regclass('public.happyad_stories') is not null
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1081,'{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true}'::jsonb,now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_insert_post_json_v1081(jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_update_post_media_v1081(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_claim_job_v1081(text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_progress_v1081(uuid,text,integer,text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_heartbeat_v1081(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_publish_primary_v1081(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_worker_finalize_album_group_v1081(text,uuid) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_variants_v1081(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_publication_schema_status_v1081() from public,anon,authenticated;

grant execute on function public.fyblic_insert_post_json_v1081(jsonb) to service_role;
grant execute on function public.fyblic_update_post_media_v1081(text,uuid,jsonb) to service_role;
grant execute on function public.fyblic_worker_claim_job_v1081(text,integer) to service_role;
grant execute on function public.fyblic_worker_progress_v1081(uuid,text,integer,text,integer) to service_role;
grant execute on function public.fyblic_worker_heartbeat_v1081(uuid,text,integer) to service_role;
grant execute on function public.fyblic_worker_publish_primary_v1081(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_worker_finalize_album_group_v1081(text,uuid) to service_role;
grant execute on function public.fyblic_worker_complete_variants_v1081(uuid,text,jsonb) to service_role;
grant execute on function public.fyblic_publication_schema_status_v1081() to service_role;

commit;

select public.fyblic_publication_schema_status_v1081() as fyblic_v1081_status;
