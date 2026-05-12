-- Instagram publishing queue
-- Run this in Supabase SQL Editor

create table if not exists instagram_queue (
  id                uuid primary key default gen_random_uuid(),
  image_urls        text[]      not null,
  caption           text        not null,
  scheduled_at      timestamptz not null,
  status            text        not null default 'pending'
                    check (status in ('pending', 'processing', 'published', 'error')),
  instagram_post_id text,
  published_at      timestamptz,
  error_message     text,
  created_at        timestamptz not null default now()
);

-- Index for cron query performance
create index if not exists instagram_queue_status_scheduled
  on instagram_queue (status, scheduled_at);

-- No RLS needed — only accessed server-side via service role key
