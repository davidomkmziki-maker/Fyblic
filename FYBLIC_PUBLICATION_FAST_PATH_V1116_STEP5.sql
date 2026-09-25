-- FYBLIC V1116 STEP 5 — FAST PATH PRINCIPAL + VARIANTES ARRIERE-PLAN
-- Base requise : V1115 Step 4.
-- Le Fast Path ne clôt plus la vidéo après le remux principal : les renditions
-- secondaires restent planifiées et sont produites ensuite par le pipeline.

begin;

DO $$
begin
  if to_regprocedure('public.fyblic_publication_schema_status_v1115()') is null then
    raise exception 'FYBLIC_V1115_REQUIRED';
  end if;
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1116()
returns jsonb language sql stable security definer set search_path=public as $$
select coalesce(public.fyblic_publication_schema_status_v1115(),'{}'::jsonb) || jsonb_build_object(
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'fast_path_background_variants',true,
  'fast_path_safe_remux',true,
  'fast_path_primary_first',true
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1116,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"renditions_table":true,"parent_renditions":true,"rendition_state":true,"rendition_close":true,"rendition_scheduler":false,"fair_user_scheduler":true,"user_schedule_table":true,"per_user_active_cap":true,"highest_native_primary":true,"primary_1080_when_available":true,"no_video_upscaling":true,"fast_path_background_variants":true,"fast_path_safe_remux":true,"fast_path_primary_first":true}'::jsonb,
  now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_publication_schema_status_v1116() from public,anon,authenticated;
grant execute on function public.fyblic_publication_schema_status_v1116() to service_role;

commit;

select public.fyblic_publication_schema_status_v1116() as fyblic_v1116_status;
