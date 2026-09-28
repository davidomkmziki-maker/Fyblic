-- FYBLIC V1087 — mise à niveau automatique 720p -> 1080p.
-- Correctif ciblé : synchronise les variantes Boutique avec happyad_posts
-- et conserve les chemins Normal/Story V1082 déjà validés.
-- Aucune table/publication/média existant n'est supprimé.

begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then raise exception 'FYBLIC_V1082_REQUIRED'; end if;
  if to_regclass('public.happyad_posts') is null then raise exception 'HAPPYAD_POSTS_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer)') is null then raise exception 'FYBLIC_V1082_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_worker_complete_variants_v1081(uuid,text,jsonb)') is null then raise exception 'FYBLIC_V1081_REQUIRED'; end if;
  if to_regprocedure('public.fyblic_update_post_media_v1081(text,uuid,jsonb)') is null then raise exception 'FYBLIC_V1081_REQUIRED'; end if;
end;
$$;

-- Synchronise UN média Boutique à partir du résultat durable du worker.
-- La fonction est volontairement tolérante si l'annonce n'existe pas encore :
-- le site appelle ensuite fyblic_boutique_refresh_media_v1087 juste après la création RPC.
create or replace function public.fyblic_sync_boutique_media_v1087(
  p_job_id uuid,
  p_result jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_listing_id text;
  v_index integer;
  v_post jsonb;
  v_media jsonb;
  v_item jsonb;
  v_result jsonb;
  v_primary jsonb;
  v_poster jsonb;
  v_variants jsonb;
  v_cover_text text;
  v_cover_index integer:=0;
  v_crop jsonb;
  v_patch jsonb;
  v_poster_url text;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id;
  if v_job.id is null or v_job.publication_type<>'boutique' then return false; end if;

  v_listing_id:=coalesce(
    nullif(v_job.payload->>'listingId',''),
    nullif(v_job.publication_group_id,''),
    nullif(v_job.post_id,'')
  );
  if coalesce(v_listing_id,'')='' then return false; end if;
  v_index:=greatest(0,coalesce(v_job.asset_index,0));

  select to_jsonb(p) into v_post
  from public.happyad_posts p
  where p.id::text=v_listing_id and p.user_id::text=v_job.user_id::text
  limit 1;
  if v_post is null then return false; end if;

  v_media:=coalesce(v_post->'marketplace_media','[]'::jsonb);
  if jsonb_typeof(v_media)<>'array' or jsonb_array_length(v_media)<=v_index then return false; end if;

  v_result:=coalesce(v_job.result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb);
  v_primary:=coalesce(v_result->'primary','{}'::jsonb);
  v_poster:=coalesce(v_result->'poster','{}'::jsonb);
  v_variants:=coalesce(v_result->'variants','{}'::jsonb);
  if coalesce(v_primary->>'url','')='' then return false; end if;

  v_item:=coalesce(v_media->v_index,'{}'::jsonb);
  v_poster_url:=coalesce(nullif(v_poster->>'url',''),nullif(v_item->>'poster',''));
  v_item:=v_item||jsonb_strip_nulls(jsonb_build_object(
    'src',nullif(v_primary->>'url',''),
    'url',nullif(v_primary->>'url',''),
    'path',nullif(v_primary->>'path',''),
    'mime',nullif(v_primary->>'mime',''),
    'poster',nullif(v_poster_url,''),
    'variants',case when jsonb_typeof(v_variants)='object' then v_variants else '{}'::jsonb end,
    'quality',nullif(v_primary->>'name',''),
    'primary_quality',nullif(v_primary->>'name','')
  ));
  v_media:=jsonb_set(v_media,array[v_index::text],v_item,true);

  v_patch:=jsonb_build_object('marketplace_media',v_media);

  v_cover_text:=coalesce(
    v_post->>'marketplace_cover_index',
    v_post->>'coverIndex',
    v_post#>>'{marketplace_details,cover_index}',
    '0'
  );
  if coalesce(v_cover_text,'') ~ '^[0-9]+$' then v_cover_index:=v_cover_text::integer; else v_cover_index:=0; end if;

  -- Si ce média est la couverture, la ligne principale reçoit aussi la qualité finale
  -- et les variantes. Les lecteurs Normal/Boutique utilisent alors le même sélecteur adaptatif.
  if v_index=v_cover_index then
    v_crop:=coalesce(v_post->'image_crop','{}'::jsonb)||jsonb_build_object(
      'adaptive',jsonb_build_object(
        'v',5,
        'mode','connection',
        'variants',case when jsonb_typeof(v_variants)='object' then v_variants else '{}'::jsonb end
      )
    );
    v_patch:=v_patch||jsonb_strip_nulls(jsonb_build_object(
      'media_url',nullif(v_primary->>'url',''),
      'media_path',nullif(v_primary->>'path',''),
      'marketplace_cover_url',nullif(v_primary->>'url',''),
      'marketplace_cover_path',nullif(v_primary->>'path',''),
      'thumbnail_url',nullif(v_poster_url,''),
      'poster_url',nullif(v_poster_url,''),
      'image_crop',v_crop
    ));
  end if;

  return public.fyblic_update_post_media_v1081(v_listing_id,v_job.user_id,v_patch);
exception when others then
  -- Une optimisation Boutique ne doit jamais transformer une publication déjà visible en échec.
  return false;
end;
$$;

-- Même checkpoint V1082 pour Normal/Story ; seule la branche Boutique est ajoutée.
create or replace function public.fyblic_worker_checkpoint_optimization_v1082(
  p_job_id uuid,p_worker_id text,p_result jsonb,p_progress integer default 94
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_job public.fyblic_publication_jobs%rowtype;
  v_primary jsonb;
  v_poster jsonb;
  v_crop jsonb;
  v_story_id text;
  v_result jsonb;
begin
  select * into v_job from public.fyblic_publication_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_job.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
  if not v_job.primary_ready then raise exception 'PRIMARY_NOT_READY'; end if;
  if v_job.status not in ('processing','optimizing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;

  v_result:=coalesce(v_job.result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb)||jsonb_build_object('variantsComplete',false);
  v_primary:=coalesce(v_result->'primary','{}'::jsonb);
  v_poster:=coalesce(v_result->'poster','{}'::jsonb);

  if v_job.publication_type in ('normal','album') then
    v_crop:=coalesce(v_job.payload->'imageCrop','{}'::jsonb)||jsonb_build_object(
      'adaptive',jsonb_build_object('v',5,'mode','connection','variants',coalesce(v_result->'variants','{}'::jsonb))
    );
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
    v_story_id:=coalesce(v_result->>'story_id','');
    if v_story_id<>'' then
      update public.happyad_stories set
        media_url=coalesce(nullif(v_primary->>'url',''),media_url),
        thumbnail_url=coalesce(nullif(v_poster->>'url',''),thumbnail_url),
        poster_url=coalesce(nullif(v_poster->>'url',''),poster_url)
      where id::text=v_story_id and user_id::text=v_job.user_id::text;
    end if;
  elsif v_job.publication_type='boutique' then
    perform public.fyblic_sync_boutique_media_v1087(v_job.id,v_result);
  end if;

  update public.fyblic_publication_jobs set
    status='optimizing',
    stage='Optimisation en arrière-plan',
    progress=greatest(progress,least(97,greatest(87,coalesce(p_progress,94)))),
    result=v_result,
    worker_id=null,
    lease_expires_at=null
  where id=v_job.id;

  return jsonb_build_object('ok',true,'job_id',v_job.id,'worker_released',true,'done',false);
end;
$$;

-- Finalisation V1082 conservée + synchronisation finale Boutique.
create or replace function public.fyblic_worker_complete_variants_v1082(
  p_job_id uuid,p_worker_id text,p_result jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_response jsonb;
  v_type text;
begin
  select publication_type into v_type from public.fyblic_publication_jobs where id=p_job_id;
  v_response:=public.fyblic_worker_complete_variants_v1081(
    p_job_id,p_worker_id,coalesce(p_result,'{}'::jsonb)||jsonb_build_object('variantsComplete',true)
  );
  if v_type='boutique' then
    perform public.fyblic_sync_boutique_media_v1087(
      p_job_id,coalesce(p_result,'{}'::jsonb)||jsonb_build_object('variantsComplete',true)
    );
  end if;
  update public.fyblic_publication_jobs set worker_id=null,lease_expires_at=null where id=p_job_id;
  return coalesce(v_response,'{}'::jsonb)||jsonb_build_object('worker_released',true,'done',true);
end;
$$;

-- Fermeture de la course possible : si le worker avait déjà produit le 1080p avant
-- que happyad_publish_listing_v1 crée l'annonce Boutique, le site appelle ce RPC juste après.
create or replace function public.fyblic_boutique_refresh_media_v1087(p_listing_id text)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_job record;
  v_listing jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if trim(coalesce(p_listing_id,''))='' then raise exception 'LISTING_ID_REQUIRED'; end if;
  if not exists(
    select 1 from public.happyad_posts p
    where p.id::text=trim(p_listing_id) and p.user_id::text=v_uid::text
  ) then raise exception 'LISTING_NOT_FOUND'; end if;

  for v_job in
    select j.id,j.result
    from public.fyblic_publication_jobs j
    where j.user_id=v_uid
      and j.publication_type='boutique'
      and (j.publication_group_id=trim(p_listing_id) or j.payload->>'listingId'=trim(p_listing_id))
    order by j.asset_index,j.created_at
  loop
    perform public.fyblic_sync_boutique_media_v1087(v_job.id,v_job.result);
  end loop;

  select to_jsonb(p) into v_listing
  from public.happyad_posts p
  where p.id::text=trim(p_listing_id) and p.user_id::text=v_uid::text
  limit 1;

  return jsonb_build_object('ok',true,'listing',coalesce(v_listing,'{}'::jsonb));
end;
$$;

-- Rattrapage best-effort des annonces Boutique récentes déjà publiées avec V1084/V1086.
-- Cela permet de tester V1087 avec une annonce existante sans la republier.
do $$
declare v_old record;
begin
  for v_old in
    select id,result from public.fyblic_publication_jobs
    where publication_type='boutique'
      and primary_ready=true
      and created_at>=now()-interval '14 days'
    order by created_at
  loop
    perform public.fyblic_sync_boutique_media_v1087(v_old.id,v_old.result);
  end loop;
end;
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values (
  'publication_pipeline',1087,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"boutique_adaptive_sync":true,"auto_1080":true}'::jsonb,
  now(),now()
)
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_sync_boutique_media_v1087(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fyblic_boutique_refresh_media_v1087(text) from public,anon;
revoke all on function public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer) from public,anon,authenticated;
revoke all on function public.fyblic_worker_complete_variants_v1082(uuid,text,jsonb) from public,anon,authenticated;

grant execute on function public.fyblic_sync_boutique_media_v1087(uuid,jsonb) to service_role;
grant execute on function public.fyblic_boutique_refresh_media_v1087(text) to authenticated;
grant execute on function public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer) to service_role;
grant execute on function public.fyblic_worker_complete_variants_v1082(uuid,text,jsonb) to service_role;

create index if not exists fyblic_publication_jobs_user_started_v1124_idx
  on public.fyblic_publication_jobs (user_id, started_at desc) where started_at is not null;
create or replace function public.fyblic_worker_claim_job_v1125(p_worker_id text,p_lane text,p_lease_seconds integer default 1800)
returns setof public.fyblic_publication_jobs language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_lane is null or p_lane not in ('primary','optimization') then raise exception 'INVALID_LANE'; end if;
  update public.fyblic_publication_jobs
  set status='failed',stage='Échec après reprises automatiques',error_code='LEASE_EXPIRED',
      error_message='Le traitement a été interrompu après trois reprises automatiques.',
      lease_expires_at=null,completed_at=now(),worker_id=null
  where status in ('processing','optimizing','finalizing')
    and attempts>=3
    and primary_ready=false
    and worker_id is not null
    and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();

  update public.fyblic_publication_jobs
  set status='published',stage='Publié · optimisation interrompue',worker_id=null,lease_expires_at=null,
      result=coalesce(result,'{}'::jsonb)||jsonb_build_object('variantsComplete',false),
      error_code='OPTIMIZATION_LEASE_EXPIRED',error_message='Optimisation interrompue après trois reprises.',completed_at=now()
  where primary_ready=true and attempts>=3 and worker_id is not null
    and status in ('processing','optimizing','finalizing')
    and coalesce(lease_expires_at,'-infinity'::timestamptz)<now();

  select j.id into v_id
  from public.fyblic_publication_jobs j
  where (
      j.status='queued'
      or (j.status='optimizing' and j.worker_id is null)
      or (j.status in ('processing','optimizing','finalizing') and j.worker_id is not null and coalesce(j.lease_expires_at,'-infinity'::timestamptz)<now())
    )
    and ((p_lane='primary' and j.primary_ready=false) or (p_lane='optimization' and j.primary_ready=true))
    and j.status not in ('published','failed','canceled')
    and (j.attempts<3 or j.primary_ready=true)
  order by
    case when j.primary_ready=false then 0
         when j.started_at < now()-interval '10 minutes' then 0 else 1 end,
    coalesce((select max(served.started_at) from public.fyblic_publication_jobs served
              where served.user_id=j.user_id and served.id<>j.id), '-infinity'::timestamptz),
    j.created_at,
    j.asset_index
  for update skip locked
  limit 1;

  if v_id is null then return; end if;

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

revoke all on function public.fyblic_worker_claim_job_v1125(text,text,integer) from public,anon,authenticated;
grant execute on function public.fyblic_worker_claim_job_v1125(text,text,integer) to service_role;

-- Store the available renditions on the story itself (existing story RLS applies).
alter table public.happyad_stories add column if not exists video_variants jsonb not null default '{}'::jsonb;
create or replace function public.fyblic_story_variants_v1125()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.publication_type='story' and new.primary_ready=true and new.status not in ('failed','canceled') then
    update public.happyad_stories set video_variants=coalesce(new.result->'variants','{}'::jsonb)
    where id::text=new.result->>'story_id' and user_id::text=new.user_id::text;
  end if;
  return new;
end;
$$;
revoke all on function public.fyblic_story_variants_v1125() from public,anon,authenticated;
drop trigger if exists fyblic_story_variants_v1125 on public.fyblic_publication_jobs;
create trigger fyblic_story_variants_v1125 after update of result on public.fyblic_publication_jobs
for each row execute function public.fyblic_story_variants_v1125();
update public.happyad_stories s set video_variants=coalesce(j.result->'variants','{}'::jsonb)
from public.fyblic_publication_jobs j
where j.publication_type='story' and j.primary_ready=true and j.status not in ('failed','canceled')
and s.id::text=j.result->>'story_id' and s.user_id::text=j.user_id::text;

-- Failed optimisation must not delete the source or pretend every variant is done.
create or replace function public.fyblic_worker_retry_optimization_v1125(p_job_id uuid,p_worker_id text,p_message text)
returns void language plpgsql security definer set search_path=public as $$
declare j public.fyblic_publication_jobs%rowtype; retries integer;
begin
 select * into j from public.fyblic_publication_jobs where id=p_job_id for update;
 if j.id is null or j.worker_id is distinct from p_worker_id then raise exception 'WORKER_LEASE_LOST'; end if;
 if not j.primary_ready or j.status not in ('processing','optimizing','finalizing') then raise exception 'JOB_NOT_PROCESSING'; end if;
 retries:=coalesce((j.result->>'optimizationRetries')::integer,0)+1;
 update public.fyblic_publication_jobs set
 result=coalesce(result,'{}'::jsonb)||jsonb_build_object('optimizationRetries',retries,'variantsComplete',false),
 status=case when retries<3 then 'optimizing' else 'published' end,
 stage=case when retries<3 then 'Reprise de l’optimisation' else 'Publié · optimisation interrompue' end,
 worker_id=null,lease_expires_at=null,
 error_code='OPTIMIZATION_FAILED',error_message=left(p_message,500),
 completed_at=case when retries>=3 then now() else completed_at end
 where id=j.id;
end;
$$;
revoke all on function public.fyblic_worker_retry_optimization_v1125(uuid,text,text) from public,anon,authenticated;
grant execute on function public.fyblic_worker_retry_optimization_v1125(uuid,text,text) to service_role;

update public.fyblic_system_schema_versions set version=1125,
 capabilities=capabilities||'{"dedicated_lanes":true}'::jsonb,updated_at=now()
 where component='publication_pipeline';
commit;
select public.fyblic_publication_schema_status_v1082() as status;
