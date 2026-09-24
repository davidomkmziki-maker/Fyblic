-- FYBLIC V1105 — réparation des actions propriétaire de la Boutique.
-- À exécuter dans Supabase SQL Editor si Supprimer / Rendre indisponible
-- est refusé par la base. Le client V1105 possède aussi un fallback RLS sécurisé.

create or replace function public.happyad_manage_my_listing_v933(
  p_listing_id text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_action text := lower(trim(coalesce(p_action,'')));
  v_row public.happyad_posts%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if trim(coalesce(p_listing_id,'')) = '' then
    raise exception 'LISTING_ID_REQUIRED';
  end if;

  if v_action not in ('pause','activate','delete') then
    raise exception 'ACTION_NOT_ALLOWED';
  end if;

  if v_action = 'pause' then
    update public.happyad_posts
       set listing_status = 'paused',
           is_active = false
     where id::text = trim(p_listing_id)
       and user_id::text = v_uid::text
       and happyad_marketplace is true
       and deleted_at is null
     returning * into v_row;

  elsif v_action = 'activate' then
    update public.happyad_posts
       set listing_status = 'active',
           is_active = true
     where id::text = trim(p_listing_id)
       and user_id::text = v_uid::text
       and happyad_marketplace is true
       and deleted_at is null
     returning * into v_row;

  else
    update public.happyad_posts
       set listing_status = 'deleted',
           is_active = false,
           deleted_at = coalesce(deleted_at, now())
     where id::text = trim(p_listing_id)
       and user_id::text = v_uid::text
       and happyad_marketplace is true
       and deleted_at is null
     returning * into v_row;
  end if;

  if not found then
    raise exception 'LISTING_NOT_FOUND_OR_NOT_OWNER';
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'listing_status', v_row.listing_status,
    'is_active', v_row.is_active,
    'deleted_at', v_row.deleted_at
  );
end;
$$;

revoke all on function public.happyad_manage_my_listing_v933(text,text) from public;
grant execute on function public.happyad_manage_my_listing_v933(text,text) to authenticated;

-- Force PostgREST à relire immédiatement la fonction après son installation.
notify pgrst, 'reload schema';
