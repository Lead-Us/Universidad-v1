-- migrations_v9.sql — Ejercicios & Trabajos tables
-- Run in Supabase SQL Editor (Project → SQL Editor)

-- ── EJERCICIOS BLOCKS ────────────────────────────────────────────────────────
-- Each "block" is an exercise session tied to a ramo and evaluation type.
create table if not exists ejercicios_blocks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ramo_id    uuid references ramos(id) on delete set null,
  titulo     text not null,
  tipo       text not null default 'Práctica',
  con_pauta  boolean default false,
  created_at timestamptz default now()
);

alter table ejercicios_blocks enable row level security;
create policy "Users see own ejercicios_blocks"
  on ejercicios_blocks for all using (auth.uid() = user_id);

-- ── EJERCICIOS CHATS ─────────────────────────────────────────────────────────
-- Chat messages for each exercise block (user ↔ AI).
create table if not exists ejercicios_chats (
  id         uuid primary key default uuid_generate_v4(),
  block_id   uuid not null references ejercicios_blocks(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  sources    jsonb default '[]',
  created_at timestamptz default now()
);

alter table ejercicios_chats enable row level security;
create policy "Users see own ejercicios_chats"
  on ejercicios_chats for all
  using (block_id in (
    select id from ejercicios_blocks where user_id = auth.uid()
  ));

-- ── TRABAJOS ────────────────────────────────────────────────────────────────
-- AI-generated documents (pdf, docx, pptx) editable by the student.
create table if not exists trabajos (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  ramo_id      uuid references ramos(id) on delete set null,
  titulo       text not null,
  tipo         text not null check (tipo in ('pdf','docx','pptx')),
  estado       text default 'generando' check (estado in ('generando','editor','listo')),
  content_html text default '',
  slides_json  jsonb,
  instrucciones text,
  plantilla    text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table trabajos enable row level security;
create policy "Users see own trabajos"
  on trabajos for all using (auth.uid() = user_id);
