// GET /api/run-migration?secret=universidad-migrate-2026
// One-time endpoint to create aprender tables and profile columns.
// Env vars: SUPABASE_DB_URL, MIGRATION_SECRET

import postgres from 'postgres';

const SQL = `
alter table profiles
  add column if not exists username             text,
  add column if not exists apellido1            text default '',
  add column if not exists apellido2            text default '',
  add column if not exists university           text default '',
  add column if not exists study_year           text default '',
  add column if not exists subscription_status  text default 'pending',
  add column if not exists flow_customer_id     text,
  add column if not exists flow_subscription_id text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_subscription_status_check'
  ) then
    alter table profiles add constraint profiles_subscription_status_check
      check (subscription_status in ('pending','active','cancelled','free'));
  end if;
end $$;

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
  )
  on conflict (id) do update set
    name       = excluded.name,
    username   = coalesce(excluded.username, profiles.username),
    apellido1  = coalesce(excluded.apellido1, profiles.apellido1),
    apellido2  = coalesce(excluded.apellido2, profiles.apellido2),
    university = coalesce(excluded.university, profiles.university),
    study_year = coalesce(excluded.study_year, profiles.study_year);
  return new;
end;
$$ language plpgsql security definer;

create table if not exists aprender_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references learning_models(id) on delete cascade,
  title      text not null default 'Bloque sin título',
  "order"    int  default 1,
  created_at timestamptz default now()
);
alter table aprender_blocks enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='aprender_blocks' and policyname='Users see own aprender blocks') then
    create policy "Users see own aprender blocks" on aprender_blocks for all using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists aprender_block_sources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  block_id   uuid not null references aprender_blocks(id) on delete cascade,
  type       text not null check (type in ('text','file','url','platform')),
  title      text not null default '',
  content    text default '',
  file_url   text,
  file_name  text,
  created_at timestamptz default now()
);
alter table aprender_block_sources enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='aprender_block_sources' and policyname='Users see own aprender sources') then
    create policy "Users see own aprender sources" on aprender_block_sources for all using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists aprender_block_chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  block_id   uuid not null references aprender_blocks(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz default now()
);
alter table aprender_block_chats enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='aprender_block_chats' and policyname='Users see own aprender chats') then
    create policy "Users see own aprender chats" on aprender_block_chats for all using (auth.uid() = user_id);
  end if;
end $$;
`;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.MIGRATION_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: 'SUPABASE_DB_URL not configured' });
  }

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 20, connect_timeout: 15 });
  try {
    await sql.unsafe(SQL);
    await sql.end();
    return res.status(200).json({ ok: true, message: 'Migración completada.' });
  } catch (err) {
    console.error('Migration error:', err);
    try { await sql.end({ timeout: 3 }); } catch {}
    return res.status(500).json({ error: err.message });
  }
}
