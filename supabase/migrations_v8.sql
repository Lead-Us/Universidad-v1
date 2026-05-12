-- migrations_v8.sql — Analytics RPC functions
-- Run these in the Supabase SQL editor (Project → SQL Editor)

-- 1. Active users in a time window
-- A user is "active" if they performed any action in the period
CREATE OR REPLACE FUNCTION get_active_users_count(since timestamptz)
RETURNS bigint
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT user_id) FROM (
    SELECT user_id FROM tasks WHERE created_at >= since
    UNION
    SELECT user_id FROM ramos WHERE created_at >= since
    UNION
    SELECT user_id FROM learning_models WHERE created_at >= since
    UNION
    SELECT user_id FROM aprender_blocks WHERE created_at >= since
    UNION
    SELECT user_id FROM aprender_block_chats WHERE created_at >= since AND role = 'user'
  ) AS combined;
$$;

-- 2. Daily new signups (for bar chart)
CREATE OR REPLACE FUNCTION get_daily_signups(since timestamptz)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    DATE(created_at AT TIME ZONE 'America/Santiago') AS day,
    COUNT(*)
  FROM profiles
  WHERE created_at >= since
  GROUP BY 1
  ORDER BY 1;
$$;

-- 3. Daily feature activity breakdown (for stacked chart)
CREATE OR REPLACE FUNCTION get_daily_activity(since timestamptz)
RETURNS TABLE(
  day date,
  tasks_created bigint,
  ramos_created bigint,
  notebooks_created bigint,
  blocks_created bigint,
  ai_messages bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    d.day,
    COALESCE(t.cnt,  0) AS tasks_created,
    COALESCE(r.cnt,  0) AS ramos_created,
    COALESCE(lm.cnt, 0) AS notebooks_created,
    COALESCE(ab.cnt, 0) AS blocks_created,
    COALESCE(ai.cnt, 0) AS ai_messages
  FROM (
    SELECT DISTINCT DATE(created_at AT TIME ZONE 'America/Santiago') AS day
    FROM (
      SELECT created_at FROM tasks             WHERE created_at >= since UNION ALL
      SELECT created_at FROM ramos             WHERE created_at >= since UNION ALL
      SELECT created_at FROM learning_models   WHERE created_at >= since UNION ALL
      SELECT created_at FROM aprender_blocks   WHERE created_at >= since UNION ALL
      SELECT created_at FROM aprender_block_chats WHERE created_at >= since
    ) a
  ) d
  LEFT JOIN (SELECT DATE(created_at AT TIME ZONE 'America/Santiago') day, COUNT(*) cnt FROM tasks WHERE created_at >= since GROUP BY 1) t ON t.day = d.day
  LEFT JOIN (SELECT DATE(created_at AT TIME ZONE 'America/Santiago') day, COUNT(*) cnt FROM ramos WHERE created_at >= since GROUP BY 1) r ON r.day = d.day
  LEFT JOIN (SELECT DATE(created_at AT TIME ZONE 'America/Santiago') day, COUNT(*) cnt FROM learning_models WHERE created_at >= since GROUP BY 1) lm ON lm.day = d.day
  LEFT JOIN (SELECT DATE(created_at AT TIME ZONE 'America/Santiago') day, COUNT(*) cnt FROM aprender_blocks WHERE created_at >= since GROUP BY 1) ab ON ab.day = d.day
  LEFT JOIN (SELECT DATE(created_at AT TIME ZONE 'America/Santiago') day, COUNT(*) cnt FROM aprender_block_chats WHERE created_at >= since AND role = 'user' GROUP BY 1) ai ON ai.day = d.day
  ORDER BY d.day;
$$;

-- 4. Top universities by user count
CREATE OR REPLACE FUNCTION get_top_universities(limit_n int DEFAULT 10)
RETURNS TABLE(university text, count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT university, COUNT(*) AS count
  FROM profiles
  WHERE university IS NOT NULL AND university != ''
  GROUP BY university
  ORDER BY count DESC
  LIMIT limit_n;
$$;
