-- migrations_v10.sql — Fix tasks.type CHECK constraint to match frontend values

-- Drop the old constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

-- Add updated constraint with all frontend values (no accents, plus new types)
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check
  CHECK (type IN ('tarea','evaluacion','evaluación','entrega','control','quiz','otro'));

-- Normalize any existing rows that used the accented version
UPDATE tasks SET type = 'evaluacion' WHERE type = 'evaluación';
