-- ── AI Memory tables ────────────────────────────────────────────────────────
-- Block-level memory: what the AI has learned about this student in this block
CREATE TABLE IF NOT EXISTS aprender_block_memory (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id    uuid NOT NULL REFERENCES aprender_blocks(id) ON DELETE CASCADE,
  content     text NOT NULL DEFAULT '',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, block_id)
);

ALTER TABLE aprender_block_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own block memory"
  ON aprender_block_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project-level memory: cross-block summary for a notebook
CREATE TABLE IF NOT EXISTS aprender_project_memory (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES learning_models(id) ON DELETE CASCADE,
  content     text NOT NULL DEFAULT '',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, project_id)
);

ALTER TABLE aprender_project_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own project memory"
  ON aprender_project_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
