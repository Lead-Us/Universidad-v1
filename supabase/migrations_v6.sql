-- ============================================================
-- Universidad v1 — Schema Migration v6
-- Run in the Supabase SQL editor
-- ============================================================

-- ── Add carrera to profiles ───────────────────────────────────
alter table profiles
  add column if not exists carrera text default '';
