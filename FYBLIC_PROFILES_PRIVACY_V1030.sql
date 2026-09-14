-- FYBLIC V1030
-- A executer APRES le deploiement du ZIP V1030.
-- Protege les donnees privees de public.profiles sans casser les profils publics.

begin;

alter table public.profiles enable row level security;

-- Retrait des politiques publiques redondantes et trop larges.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_public on public.profiles;
drop policy if exists profiles_select_public_for_admin on public.profiles;
drop policy if exists profiles_select_public_for_search_v427 on public.profiles;

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_insert_own_registration_v427 on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_own_registration_v427 on public.profiles;

create policy profiles_public_read_v1030
on public.profiles
for select
to anon, authenticated
using (true);

create policy profiles_insert_own_v1030
on public.profiles
for insert
to authenticated
with check ((auth.uid())::text = (id)::text);

create policy profiles_update_own_v1030
on public.profiles
for update
to authenticated
using ((auth.uid())::text = (id)::text)
with check ((auth.uid())::text = (id)::text);

-- Retire SELECT global ainsi que DELETE, TRUNCATE, TRIGGER et REFERENCES.
revoke all privileges on table public.profiles from public, anon, authenticated;

-- Colonnes publiques necessaires a l'affichage social et aux anciens identifiants.
grant select (
  id, user_id, uid, auth_id,
  username, full_name, avatar_url, bio, country, created_at,
  badge, type, updated_at, followers, following,
  verification_status, avatar_updated_at, avatar_revision
) on table public.profiles to anon, authenticated;

-- Creation de profil : role, badge et donnees privees utilisent leurs valeurs serveur.
grant insert (
  id, username, full_name, avatar_url, bio, country, type
) on table public.profiles to authenticated;

-- Les modifications directes restent limitees aux champs ordinaires et a sa propre ligne.
grant update (
  username, full_name, avatar_url, bio, country, type, updated_at
) on table public.profiles to authenticated;

drop view if exists public.happyad_profiles_public_v1;
create view public.happyad_profiles_public_v1
with (security_invoker = true, security_barrier = true)
as
select
  id,
  user_id,
  uid,
  auth_id,
  id as auth_user_id,
  id as account_uid,
  username,
  full_name,
  full_name as display_name,
  full_name as name,
  avatar_url,
  avatar_url as avatar,
  bio,
  country,
  created_at,
  badge,
  badge as user_badge,
  type,
  updated_at,
  followers,
  following,
  verification_status,
  avatar_updated_at,
  avatar_revision
from public.profiles;

revoke all privileges on table public.happyad_profiles_public_v1 from public, anon, authenticated;
grant select on table public.happyad_profiles_public_v1 to anon, authenticated;

comment on view public.happyad_profiles_public_v1 is
'Profil public Fyblic sans email, date de naissance, identifiant appareil, dates de connexion ni donnees de verification internes.';

commit;

notify pgrst, 'reload schema';

-- Verification attendue apres execution :
-- 1. Les colonnes privees ci-dessous doivent toutes retourner false.
select
  has_column_privilege('anon', 'public.profiles', 'account_email', 'select') as anon_account_email,
  has_column_privilege('anon', 'public.profiles', 'registration_email', 'select') as anon_registration_email,
  has_column_privilege('anon', 'public.profiles', 'signup_email', 'select') as anon_signup_email,
  has_column_privilege('anon', 'public.profiles', 'birth_date', 'select') as anon_birth_date,
  has_column_privilege('anon', 'public.profiles', 'device_signup_id', 'select') as anon_device_signup_id,
  has_column_privilege('anon', 'public.profiles', 'last_login_at', 'select') as anon_last_login_at,
  has_column_privilege('anon', 'public.profiles', 'auth_user_id', 'select') as anon_auth_user_id,
  has_column_privilege('anon', 'public.profiles', 'account_uid', 'select') as anon_account_uid,
  has_column_privilege('authenticated', 'public.profiles', 'account_email', 'select') as authenticated_account_email,
  has_column_privilege('authenticated', 'public.profiles', 'birth_date', 'select') as authenticated_birth_date,
  has_column_privilege('authenticated', 'public.profiles', 'auth_user_id', 'select') as authenticated_auth_user_id,
  has_column_privilege('authenticated', 'public.profiles', 'account_uid', 'select') as authenticated_account_uid;

-- 2. Aucun privilege global de table ne doit rester : cette requete doit retourner 0 ligne.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
