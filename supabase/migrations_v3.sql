-- ============================================================
-- Migration v3 — Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Extend profiles table ──────────────────────────────────
alter table profiles add column if not exists apellido1          text default '';
alter table profiles add column if not exists apellido2          text default '';
alter table profiles add column if not exists university         text default '';
alter table profiles add column if not exists study_year         text default '';
alter table profiles add column if not exists subscription_status text default 'inactive';

-- ── 2. Update new-user trigger to populate extra fields ───────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, apellido1, apellido2, university, study_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido1', ''),
    coalesce(new.raw_user_meta_data->>'apellido2', ''),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'study_year', '')
  )
  on conflict (id) do update set
    name        = excluded.name,
    apellido1   = excluded.apellido1,
    apellido2   = excluded.apellido2,
    university  = excluded.university,
    study_year  = excluded.study_year;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── 3. Tasks: multi-unit / multi-materia columns ──────────────
alter table tasks add column if not exists unit_ids      uuid[]  default '{}';
alter table tasks add column if not exists materia_names text[]  default '{}';

-- ── 4. Ramo files table ───────────────────────────────────────
create table if not exists ramo_files (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  ramo_id      uuid not null references ramos(id) on delete cascade,
  folder       text not null default 'todos',
  name         text not null,
  size         bigint default 0,
  storage_path text,
  public_url   text,
  created_at   timestamptz default now()
);
alter table ramo_files enable row level security;
create policy "Users see own ramo files"
  on ramo_files for all using (auth.uid() = user_id);

-- ── 5. Ramo file folders table ────────────────────────────────
create table if not exists ramo_file_folders (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ramo_id    uuid not null references ramos(id) on delete cascade,
  key        text not null,
  label      text not null,
  locked     boolean default false,
  created_at timestamptz default now(),
  unique(ramo_id, key)
);
alter table ramo_file_folders enable row level security;
create policy "Users see own ramo folders"
  on ramo_file_folders for all using (auth.uid() = user_id);


-- ============================================================
-- Storage Buckets — run these SEPARATELY in SQL Editor
-- (Supabase storage functions may need different permissions)
-- ============================================================

-- Create aprender-files bucket (if not already created via dashboard)
insert into storage.buckets (id, name, public, file_size_limit)
values ('aprender-files', 'aprender-files', false, 52428800)
on conflict (id) do nothing;

-- Create ramo-files bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('ramo-files', 'ramo-files', false, 52428800)
on conflict (id) do nothing;

-- ── Storage RLS for aprender-files ───────────────────────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'aprender-files insert'
  ) then
    create policy "aprender-files insert"
    on storage.objects for insert with check (
      bucket_id = 'aprender-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'aprender-files select'
  ) then
    create policy "aprender-files select"
    on storage.objects for select using (
      bucket_id = 'aprender-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'aprender-files delete'
  ) then
    create policy "aprender-files delete"
    on storage.objects for delete using (
      bucket_id = 'aprender-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

-- ── Storage RLS for ramo-files ────────────────────────────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'ramo-files insert'
  ) then
    create policy "ramo-files insert"
    on storage.objects for insert with check (
      bucket_id = 'ramo-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'ramo-files select'
  ) then
    create policy "ramo-files select"
    on storage.objects for select using (
      bucket_id = 'ramo-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and policyname = 'ramo-files delete'
  ) then
    create policy "ramo-files delete"
    on storage.objects for delete using (
      bucket_id = 'ramo-files' and
      auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;
