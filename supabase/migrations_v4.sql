-- ============================================================
-- Universidad v1 — Schema Migration v4
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── #16 LOGIN CON USERNAME ────────────────────────────────────
-- RPC to resolve username → email (callable by unauthenticated users)
create or replace function resolve_login_identifier(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if p_identifier like '%@%' then
    return p_identifier;
  end if;
  select u.email into v_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_identifier))
  limit 1;
  return v_email;
end;
$$;

grant execute on function resolve_login_identifier(text) to anon;

-- ── #7 CÁTEDRA / AYUDANTÍA ────────────────────────────────────
alter table schedule
  add column if not exists block_type text default 'catedra'
    check (block_type in ('catedra', 'ayudantia', 'laboratorio', 'otro'));

-- ── #9 LIGAR CUADERNO CON RAMO ───────────────────────────────
alter table learning_models
  add column if not exists ramo_id uuid references ramos(id) on delete set null;

-- ── #11 PROGRAMA DEL RAMO ────────────────────────────────────
alter table ramo_files
  add column if not exists is_programa boolean default false;

-- ── #13 REGLAS POR FUENTE ─────────────────────────────────────
alter table aprender_block_sources
  add column if not exists instructions text default '';

-- ── #14 ENCUESTA OBLIGATORIA ──────────────────────────────────
alter table profiles
  add column if not exists last_survey_at timestamptz;

create table if not exists user_surveys (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  score      int  not null check (score between 1 and 5),
  comment    text default '',
  created_at timestamptz default now()
);

alter table user_surveys enable row level security;
create policy "Users manage own surveys" on user_surveys
  for all using (auth.uid() = user_id);

-- ── #15 ANALYTICS ─────────────────────────────────────────────
create table if not exists user_analytics (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  page       text default '',
  metadata   jsonb default '{}',
  created_at timestamptz default now()
);

alter table user_analytics enable row level security;
create policy "Users manage own analytics" on user_analytics
  for all using (auth.uid() = user_id);
