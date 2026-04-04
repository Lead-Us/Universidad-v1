-- ============================================================
-- Universidad v1 — Schema Migration v2
-- Run this AFTER schema.sql in the Supabase SQL editor
-- ============================================================

-- ── PROFILES — New columns ───────────────────────────────────
alter table profiles
  add column if not exists username            text unique,
  add column if not exists apellido1           text default '',
  add column if not exists apellido2           text default '',
  add column if not exists university          text default '',
  add column if not exists study_year          text default '',
  add column if not exists subscription_status text default 'pending'
    check (subscription_status in ('pending','active','cancelled')),
  add column if not exists stripe_customer_id  text,
  add column if not exists stripe_subscription_id text;

-- Update trigger to store extra fields from raw_user_meta_data
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, username, apellido1, apellido2, university, study_year, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido1', ''),
    coalesce(new.raw_user_meta_data->>'apellido2', ''),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'study_year', ''),
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ── APRENDER BLOCKS ──────────────────────────────────────────
create table if not exists aprender_blocks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references learning_models(id) on delete cascade,
  title       text not null default 'Bloque sin título',
  "order"     int  default 1,
  created_at  timestamptz default now()
);

alter table aprender_blocks enable row level security;
create policy "Users see own aprender blocks"
  on aprender_blocks for all using (auth.uid() = user_id);

-- ── APRENDER BLOCK SOURCES ───────────────────────────────────
create table if not exists aprender_block_sources (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  block_id    uuid not null references aprender_blocks(id) on delete cascade,
  type        text not null check (type in ('text','file','url','platform')),
  title       text not null default '',
  content     text default '',
  file_url    text,
  file_name   text,
  created_at  timestamptz default now()
);

alter table aprender_block_sources enable row level security;
create policy "Users see own aprender sources"
  on aprender_block_sources for all using (auth.uid() = user_id);

-- ── APRENDER BLOCK CHATS ─────────────────────────────────────
create table if not exists aprender_block_chats (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  block_id    uuid not null references aprender_blocks(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

alter table aprender_block_chats enable row level security;
create policy "Users see own aprender chats"
  on aprender_block_chats for all using (auth.uid() = user_id);

-- ── SUPABASE STORAGE BUCKET ──────────────────────────────────
-- Run this separately in the Supabase dashboard → Storage → New bucket
-- Name: aprender-files
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,
--   text/plain, image/png, image/jpeg, image/webp

-- Storage RLS (run after creating the bucket):
-- insert into storage.policies (name, bucket_id, definition)
-- values (
--   'Users upload own files', 'aprender-files',
--   'auth.uid()::text = (storage.foldername(name))[1]'
-- );
