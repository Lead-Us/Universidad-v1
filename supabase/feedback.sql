-- feedback table: stores in-app user feedback during beta
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  message     text not null,
  page_url    text,
  created_at  timestamptz default now()
);

alter table feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can submit feedback"
  on feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only admins can read feedback (via service role in dashboard)
create policy "Service role reads feedback"
  on feedback for select
  using (false); -- block direct reads from client; use service role in Supabase dashboard
