-- FYBLIC V1061 — suppression ciblee de l'unique publication de test Codex.
-- A executer dans Supabase SQL Editor avec le compte administrateur du projet.
-- Ce script ne modifie aucune regle RLS et ne touche aucune autre publication.

begin;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.happyad_posts
   where id::text = 'p_1789911311411'
     and coalesce(title, '') = 'Publication Fyblic';

  if v_count = 0 then
    raise exception 'Publication test p_1789911311411 introuvable ou titre inattendu. Aucune suppression effectuee.';
  end if;
  if v_count > 1 then
    raise exception 'Identifiant test duplique. Aucune suppression effectuee.';
  end if;
end $$;

do $$
begin
  if to_regclass('public.fyblic_media_jobs') is not null then
    update public.fyblic_media_jobs
       set status = 'cancelled',
           stage = 'Publication test supprimee',
           cancel_requested_at = coalesce(cancel_requested_at, now()),
           updated_at = now(),
           retryable = false,
           lease_expires_at = now()
     where post_id::text = 'p_1789911311411'
        or id::text in (
          '1ce5adf9-5fe8-44d0-a0ea-f6f79d065a0c',
          '472a6fc8-be8a-4927-a60c-11a56d4548f7'
        );
  end if;
exception
  when undefined_column then
    raise exception 'Schema fyblic_media_jobs inattendu : annulation requise avant suppression.';
end $$;

delete from public.happyad_posts
 where id::text = 'p_1789911311411'
   and coalesce(title, '') = 'Publication Fyblic';

commit;

-- Verification : doit retourner 0.
select count(*) as publication_test_restante
  from public.happyad_posts
 where id::text = 'p_1789911311411';
