-- FYBLIC V1115 STEP 4 — QUALITE PRINCIPALE NATIVE LA PLUS HAUTE
-- Base requise : V1114 Step 3.
-- Objectif : déclarer le contrat worker où la qualité principale vidéo est
-- la meilleure qualité standard disponible sans upscaling : 1080p si la source
-- permet 1080p, sinon 720p, 540p, 360p (ou profil natif inférieur si nécessaire).

begin;

DO $$
begin
  if to_regprocedure('public.fyblic_publication_schema_status_v1114()') is null then
    raise exception 'FYBLIC_V1114_REQUIRED';
  end if;
end;
$$;

create or replace function public.fyblic_publication_schema_status_v1115()
returns jsonb language sql stable security definer set search_path=public as $$
select coalesce(public.fyblic_publication_schema_status_v1114(),'{}'::jsonb) || jsonb_build_object(
  'version',coalesce((select version from public.fyblic_system_schema_versions where component='publication_pipeline'),0),
  'highest_native_primary',true,
  'primary_1080_when_available',true,
  'no_video_upscaling',true
);
$$;

insert into public.fyblic_system_schema_versions(component,version,capabilities,installed_at,updated_at)
values ('publication_pipeline',1115,
  '{"normal":true,"story":true,"boutique":true,"album":true,"unified_engine":true,"group_assets":true,"group_finalize":true,"claim_optimizing":true,"heartbeat":true,"post_media_safe":true,"fast_primary":true,"terminal_lock":true,"yielding_optimization":true,"poster_before_primary":true,"renditions_table":true,"parent_renditions":true,"rendition_state":true,"rendition_close":true,"rendition_scheduler":false,"fair_user_scheduler":true,"user_schedule_table":true,"per_user_active_cap":true,"highest_native_primary":true,"primary_1080_when_available":true,"no_video_upscaling":true}'::jsonb,
  now(),now())
on conflict(component) do update set version=excluded.version,capabilities=excluded.capabilities,updated_at=now();

revoke all on function public.fyblic_publication_schema_status_v1115() from public,anon,authenticated;
grant execute on function public.fyblic_publication_schema_status_v1115() to service_role;

commit;

select public.fyblic_publication_schema_status_v1115() as fyblic_v1115_status;
