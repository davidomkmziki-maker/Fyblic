-- FYBLIC V1112 Étape 1 — limite média 4 Go / vidéo 15 minutes.
-- À exécuter sur une base Fyblic existante AVANT de déployer le site/worker V1112 Étape 1.
-- La durée de 15 minutes est contrôlée côté navigateur puis confirmée par FFprobe dans le worker.

begin;

do $$
begin
  if to_regclass('public.fyblic_publication_jobs') is null then
    raise exception 'FYBLIC_PUBLICATION_JOBS_REQUIRED';
  end if;
  if not exists (select 1 from storage.buckets where id='fyblic-media-originals') then
    raise exception 'FYBLIC_MEDIA_ORIGINALS_BUCKET_REQUIRED';
  end if;
end;
$$;

update storage.buckets
set file_size_limit=4000000000
where id='fyblic-media-originals';

-- Remplace proprement tout ancien CHECK portant sur original_bytes, quel que soit son nom historique.
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid='public.fyblic_publication_jobs'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) ilike '%original_bytes%'
  loop
    execute format('alter table public.fyblic_publication_jobs drop constraint %I',r.conname);
  end loop;
end;
$$;

alter table public.fyblic_publication_jobs
  add constraint fyblic_publication_jobs_original_bytes_v1112_check
  check (original_bytes > 0 and original_bytes <= 4000000000);

commit;
