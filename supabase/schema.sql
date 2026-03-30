-- ============================================================
-- Universidad v1 — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── RAMOS ────────────────────────────────────────────────────
create table if not exists ramos (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  code               text,
  professor          text,
  section            text,
  credits            int default 0,
  color              text default '#4f8ef7',
  classroom          text,
  has_attendance     boolean default false,
  evaluation_modules jsonb default '[]'::jsonb,
  attendance_sessions jsonb default '[]'::jsonb,
  created_at         timestamptz default now()
);

alter table ramos enable row level security;
create policy "Users see own ramos"   on ramos for all using (auth.uid() = user_id);

-- ── UNITS (Temario) ──────────────────────────────────────────
create table if not exists units (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ramo_id    uuid not null references ramos(id) on delete cascade,
  name       text not null,
  "order"    int  default 0,
  materias   jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table units enable row level security;
create policy "Users see own units" on units for all using (auth.uid() = user_id);

-- ── SCHEDULE BLOCKS ─────────────────────────────────────────
create table if not exists schedule (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  ramo_id        uuid not null references ramos(id) on delete cascade,
  day_of_week    int  not null check (day_of_week between 0 and 6),
  start_time     text not null,
  end_time       text not null,
  sala           text,
  has_attendance boolean default false,
  created_at     timestamptz default now()
);

alter table schedule enable row level security;
create policy "Users see own schedule" on schedule for all using (auth.uid() = user_id);

-- ── TASKS ────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text default '',
  type        text default 'tarea' check (type in ('tarea','evaluación','control','quiz')),
  ramo_id     uuid references ramos(id) on delete set null,
  unit_id     uuid references units(id) on delete set null,
  materia     text default '',
  due_date    date,
  completed   boolean default false,
  created_at  timestamptz default now()
);

alter table tasks enable row level security;
create policy "Users see own tasks" on tasks for all using (auth.uid() = user_id);

-- ── LEARNING MODELS ─────────────────────────────────────────
create table if not exists learning_models (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text default '',
  color       text default '#3B82F6',
  created_at  timestamptz default now()
);

alter table learning_models enable row level security;
create policy "Users see own models" on learning_models for all using (auth.uid() = user_id);

-- ── LEARNING SUBMODULES ──────────────────────────────────────
create table if not exists learning_submodules (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  model_id       uuid not null references learning_models(id) on delete cascade,
  name           text not null,
  "order"        int  default 0,
  prompt_content text default '',
  created_at     timestamptz default now()
);

alter table learning_submodules enable row level security;
create policy "Users see own submodules" on learning_submodules for all using (auth.uid() = user_id);

-- ── USER PROFILES ────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users see own profile" on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
