-- ══════════════════════════════════════════════════════
-- Manan Tracker — Supabase Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════

-- 1. Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT        NOT NULL DEFAULT 'manan',
  date        DATE        NOT NULL,
  tasks       JSONB       NOT NULL DEFAULT '{}',
  notes       TEXT        DEFAULT '',
  ai_summary  TEXT        DEFAULT '',
  ai_suggestion TEXT      DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date, user_id)
);

-- 2. Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT        NOT NULL UNIQUE,
  subscription TEXT        NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON daily_logs (user_id, date DESC);

-- 4. Row Level Security — disable for single-user personal app
--    (If you ever add auth, enable RLS and add policies)
ALTER TABLE daily_logs        DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 5. Verify tables were created
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
