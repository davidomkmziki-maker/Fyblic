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

commit;

select jsonb_build_object(
  'fyblic_v1087',true,
  'publication_pipeline_version',(select version from public.fyblic_system_schema_versions where component='publication_pipeline'),
  'boutique_sync',to_regprocedure('public.fyblic_sync_boutique_media_v1087(uuid,jsonb)') is not null,
  'boutique_refresh',to_regprocedure('public.fyblic_boutique_refresh_media_v1087(text)') is not null,
  'checkpoint_preserved',to_regprocedure('public.fyblic_worker_checkpoint_optimization_v1082(uuid,text,jsonb,integer)') is not null,
  'completion_preserved',to_regprocedure('public.fyblic_worker_complete_variants_v1082(uuid,text,jsonb)') is not null
) as fyblic_v1087_status;
