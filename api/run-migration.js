// GET /api/run-migration?secret=MIGRATION_SECRET
// One-time endpoint to run schema_v2.sql via pg direct connection.
// Called automatically after deploy. Delete or disable after successful run.
// Env vars: MIGRATION_SECRET, SUPABASE_DB_URL (postgres connection string)

const { Client } = require('pg');

const SQL = `
-- Profiles new columns
alter table profiles
  add column if not exists username            text,
  add column if not exists apellido1           text default '',
  add column if not exists apellido2           text default '',
  add column if not exists university          text default '',
  add column if not exists study_year          text default '',
  add column if not exists subscription_status text default 'pending',
  add column if not exists flow_customer_id    text,
  add column if not exists flow_subscription_id text;

-- Add check constraint if it doesn't exist
do $$ begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'profiles' and constraint_name = 'profiles_subscription_status_check'
  ) then
    alter table profiles
      add constraint profiles_subscription_status_check
      check (subscription_status in ('pending','active','cancelled','free'));
  end if;
end $$;

-- Update handle_new_user trigger
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
    username   = excluded.username,
    apellido1  = excluded.apellido1,
    apellido2  = excluded.apellido2,
    university = excluded.university,
    study_year = excluded.study_year;
  return new;
end;
$$ language plpgsql security definer;

-- Aprender blocks
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

-- Aprender block sources
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

-- Aprender block chats
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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.MIGRATION_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    return res.status(500).json({
      error: 'SUPABASE_DB_URL not set',
      hint: 'Add your Supabase postgres connection string as SUPABASE_DB_URL in Vercel env vars. Find it at: Supabase Dashboard → Settings → Database → Connection string → URI',
    });
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(SQL);
    await client.end();
    return res.status(200).json({ ok: true, message: 'Migración completada exitosamente.' });
  } catch (err) {
    console.error('Migration error:', err);
    try { await client.end(); } catch {}
    return res.status(500).json({ error: err.message });
  }
};
