-- migrations_v11.sql

-- Create apuntes table (iOS Notes-style block editor for mobile)
CREATE TABLE IF NOT EXISTS apuntes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ramo_id     uuid REFERENCES ramos(id) ON DELETE SET NULL,
  titulo      text NOT NULL DEFAULT 'Nueva nota',
  blocks      jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE apuntes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own apuntes"
  ON apuntes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS apuntes_user_id_idx ON apuntes(user_id);

CREATE OR REPLACE FUNCTION update_apuntes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apuntes_updated_at
  BEFORE UPDATE ON apuntes
  FOR EACH ROW EXECUTE FUNCTION update_apuntes_updated_at();

-- Add block_memory and project_memory columns to aprender_block_memory
-- Mobile code uses these column names; original table only had 'content'
ALTER TABLE aprender_block_memory
  ADD COLUMN IF NOT EXISTS block_memory   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_memory text NOT NULL DEFAULT '';

-- Backfill existing content into block_memory
UPDATE aprender_block_memory SET block_memory = content WHERE block_memory = '' AND content != '';
