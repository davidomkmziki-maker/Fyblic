-- FYBLIC V1031R1
-- A executer dans Supabase SQL Editor apres le deploiement du ZIP V1031.
-- Corrige les politiques Storage permissives sans modifier les fichiers existants.

begin;

-- Le RLS de storage.objects est deja ACTIVE et gere par Supabase.
-- Ne pas executer ALTER TABLE ici : le role SQL Editor n'est pas proprietaire
-- de cette table systeme sur certains projets Supabase.

-- 1. HAPPYAD-MEDIA : suppression de toutes les anciennes politiques qui
-- autorisaient l'ecriture globale, l'ecriture a tout utilisateur connecte,
-- ou dupliquaient les regles proprietaires.
drop policy if exists "Public delete happyad media" on storage.objects;
drop policy if exists "Public read happyad media" on storage.objects;
drop policy if exists "Public update happyad media" on storage.objects;
drop policy if exists "Public upload happyad media" on storage.objects;

drop policy if exists happyad_media_auth_delete_v27 on storage.objects;
drop policy if exists happyad_media_auth_insert_v27 on storage.objects;
drop policy if exists happyad_media_auth_update_v27 on storage.objects;
drop policy if exists happyad_media_delete_auth on storage.objects;
drop policy if exists happyad_media_delete_own on storage.objects;
drop policy if exists happyad_media_delete_own_folder on storage.objects;
drop policy if exists happyad_media_insert_own_folder on storage.objects;
drop policy if exists happyad_media_owner_delete_v471 on storage.objects;
drop policy if exists happyad_media_owner_insert_v471 on storage.objects;
drop policy if exists happyad_media_owner_update_v471 on storage.objects;
drop policy if exists happyad_media_public_read on storage.objects;
drop policy if exists happyad_media_public_read_v471 on storage.objects;
drop policy if exists happyad_media_public_select_v27 on storage.objects;
drop policy if exists happyad_media_update_auth on storage.objects;
drop policy if exists happyad_media_update_own on storage.objects;
drop policy if exists happyad_media_update_own_folder on storage.objects;
drop policy if exists happyad_media_upload_auth on storage.objects;
drop policy if exists happyad_media_upload_own on storage.objects;

drop policy if exists happyad_marketplace_public_owner_delete_v811 on storage.objects;
drop policy if exists happyad_marketplace_public_upload_v811 on storage.objects;

-- Ancien emplacement d'avatars dans happyad-media.
drop policy if exists happyad_profile_avatar_delete_v855r30 on storage.objects;
drop policy if exists happyad_profile_avatar_insert_v855r30 on storage.objects;
drop policy if exists happyad_profile_avatar_update_v855r30 on storage.objects;

-- 2. AVATARS : les politiques "guard" avec bucket_id <> ... etaient
-- permissives sur tous les autres buckets. Elles doivent disparaitre.
drop policy if exists happyad_avatar_delete_guard_v855r31 on storage.objects;
drop policy if exists happyad_avatar_insert_guard_v855r31 on storage.objects;
drop policy if exists happyad_avatar_update_guard_v855r31 on storage.objects;
drop policy if exists happyad_avatar_delete_v855r31 on storage.objects;
drop policy if exists happyad_avatar_insert_v855r31 on storage.objects;
drop policy if exists happyad_avatar_update_v855r31 on storage.objects;

-- 3. Anciens buckets non utilises par le ZIP actuel : retrait des ecritures
-- publiques. La lecture publique existante reste intacte pour compatibilite.
drop policy if exists boutique_media_public_delete on storage.objects;
drop policy if exists boutique_media_public_insert on storage.objects;
drop policy if exists boutique_media_public_update on storage.objects;
drop policy if exists happyad_chat_media_insert_v2g on storage.objects;
drop policy if exists happyad_chat_media_update_v2g on storage.objects;
drop policy if exists happyad_stories_public_delete on storage.objects;
drop policy if exists happyad_stories_public_insert on storage.objects;
drop policy if exists happyad_stories_public_update on storage.objects;

-- 4. Lecture publique : necessaire pour les cartes, publications, annonces
-- et avatars dont les buckets sont volontairement publics.
create policy fyblic_storage_public_read_v1031
on storage.objects
for select
to public
using (bucket_id in ('happyad-media', 'happyad-profile-avatars'));

-- 5. Medias publics : le premier dossier doit etre l'UID du proprietaire.
-- Compatibilite conservee pour les anciens avatars profiles/{uid}/...
create policy fyblic_media_owner_insert_v1031
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'happyad-media'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = (auth.uid())::text
    or name like ('profiles/' || (auth.uid())::text || '/%')
  )
);

create policy fyblic_media_owner_update_v1031
on storage.objects
for update
to authenticated
using (
  bucket_id = 'happyad-media'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = (auth.uid())::text
    or name like ('profiles/' || (auth.uid())::text || '/%')
  )
)
with check (
  bucket_id = 'happyad-media'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = (auth.uid())::text
    or name like ('profiles/' || (auth.uid())::text || '/%')
  )
);

create policy fyblic_media_owner_delete_v1031
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'happyad-media'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = (auth.uid())::text
    or name like ('profiles/' || (auth.uid())::text || '/%')
  )
);

-- 6. Avatars actuels : profiles/{uid}/avatar-....jpg uniquement.
create policy fyblic_avatar_owner_insert_v1031
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'happyad-profile-avatars'
  and auth.uid() is not null
  and name like ('profiles/' || (auth.uid())::text || '/%')
);

create policy fyblic_avatar_owner_update_v1031
on storage.objects
for update
to authenticated
using (
  bucket_id = 'happyad-profile-avatars'
  and auth.uid() is not null
  and name like ('profiles/' || (auth.uid())::text || '/%')
)
with check (
  bucket_id = 'happyad-profile-avatars'
  and auth.uid() is not null
  and name like ('profiles/' || (auth.uid())::text || '/%')
);

create policy fyblic_avatar_owner_delete_v1031
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'happyad-profile-avatars'
  and auth.uid() is not null
  and name like ('profiles/' || (auth.uid())::text || '/%')
);

commit;

notify pgrst, 'reload schema';

-- VERIFICATION :
-- storage_rls_active doit etre true.
-- dangerous_policies_remaining doit etre 0.
-- canonical_policies doit etre 7.
select
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects'
  ) as storage_rls_active,
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'Public delete happyad media',
        'Public update happyad media',
        'Public upload happyad media',
        'happyad_media_auth_delete_v27',
        'happyad_media_auth_insert_v27',
        'happyad_media_auth_update_v27',
        'happyad_media_delete_auth',
        'happyad_media_update_auth',
        'happyad_media_upload_auth',
        'happyad_avatar_delete_guard_v855r31',
        'happyad_avatar_insert_guard_v855r31',
        'happyad_avatar_update_guard_v855r31',
        'boutique_media_public_delete',
        'boutique_media_public_insert',
        'boutique_media_public_update',
        'happyad_chat_media_insert_v2g',
        'happyad_chat_media_update_v2g',
        'happyad_stories_public_delete',
        'happyad_stories_public_insert',
        'happyad_stories_public_update'
      )
  ) as dangerous_policies_remaining,
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'fyblic_storage_public_read_v1031',
        'fyblic_media_owner_insert_v1031',
        'fyblic_media_owner_update_v1031',
        'fyblic_media_owner_delete_v1031',
        'fyblic_avatar_owner_insert_v1031',
        'fyblic_avatar_owner_update_v1031',
        'fyblic_avatar_owner_delete_v1031'
      )
  ) as canonical_policies,
  coalesce((select not public from storage.buckets where id = 'happyad-marketplace-private'), false)
    as marketplace_private_is_private;
