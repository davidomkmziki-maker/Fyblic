-- FYBLIC V1060R1 — REPARATION DE LA SUPPRESSION PROPRIETAIRE
-- A executer une seule fois dans Supabase SQL Editor AVANT de deployer le site V1060R1.
-- Idempotent. Ne transfere aucune publication et ne supprime aucune ligne physiquement.

begin;

alter table public.happyad_posts
  add column if not exists deleted_at timestamptz;

create or replace function public.fyblic_delete_my_posts_v1060(
  p_post_ids text[]
)
returns table(deleted_id text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_ids text[];
begin
  if v_owner_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select coalesce(array_agg(distinct btrim(value)), array[]::text[])
    into v_ids
  from unnest(coalesce(p_post_ids, array[]::text[])) as requested(value)
  where nullif(btrim(value), '') is not null;

  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception using errcode = '22023', message = 'post_id_required';
  end if;

  if to_regclass('public.fyblic_media_jobs') is not null then
    execute $jobs$
      update public.fyblic_media_jobs
         set status = 'cancelled',
             stage = 'Suppression demandee',
             cancel_requested_at = coalesce(cancel_requested_at, now()),
             updated_at = now(),
             retryable = false,
             error_code = null,
             error_message = null,
             lease_expires_at = now()
       where user_id = $1
         and post_id = any($2)
         and status <> 'cancelled'
    $jobs$ using v_owner_id, v_ids;
  end if;

  return query
  update public.happyad_posts as p
     set deleted_at = coalesce(p.deleted_at, now())
   where p.user_id = v_owner_id
     and p.id::text = any(v_ids)
  returning p.id::text;

  if not found then
    raise exception using errcode = 'P0001', message = 'post_not_owned_or_missing';
  end if;
end;
$$;

revoke all on function public.fyblic_delete_my_posts_v1060(text[]) from public, anon;
grant execute on function public.fyblic_delete_my_posts_v1060(text[]) to authenticated;

comment on function public.fyblic_delete_my_posts_v1060(text[]) is
  'V1060R1: suppression logique atomique des seules publications appartenant a auth.uid(), avec annulation des jobs media associes.';

notify pgrst, 'reload schema';
commit;

-- VERIFICATION D'INSTALLATION : les deux valeurs doivent etre true.
select
  exists(
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'happyad_posts'
       and column_name = 'deleted_at'
  ) as deleted_at_ok,
  to_regprocedure('public.fyblic_delete_my_posts_v1060(text[])') is not null as delete_rpc_ok;

-- DIAGNOSTIC NON DESTRUCTIF POUR LA VIDEO TEST :
-- Remplacez la valeur ci-dessous par l'id visible dans la console si
-- l'application retourne encore post_not_owned_or_missing.
-- select id, user_id, title, media_type, created_at, deleted_at
-- from public.happyad_posts
-- where id::text in ('ID_PUBLICATION_ICI');
