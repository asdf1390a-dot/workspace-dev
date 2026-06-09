-- Discord Bot Phase 1 Schema
-- Purpose: Track message sync, store Discord messages, task queue, and notifications
-- Tables: discord_sync_log, discord_messages, discord_task_queue, discord_notifications

-- ─────────────────────────────────────────────────────────
-- 1. discord_sync_log — All message sync history
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discord_sync_log (
  id              SERIAL PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('telegram', 'discord', 'ctb')),
  source_msg_id   BIGINT,
  target_platform TEXT NOT NULL CHECK (target_platform IN ('telegram', 'discord')),
  target_msg_id   BIGINT,
  content_hash    TEXT,                          -- SHA-256, dedup용
  sync_status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (sync_status IN ('success', 'fallback', 'error', 'duplicate')),
  error_msg       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  synced_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_log_source   ON discord_sync_log (source_msg_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_hash     ON discord_sync_log (content_hash);
CREATE INDEX IF NOT EXISTS idx_sync_log_created  ON discord_sync_log (created_at DESC);

-- ─────────────────────────────────────────────────────────
-- 2. discord_messages — Discord message original content
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discord_messages (
  id                  SERIAL PRIMARY KEY,
  discord_msg_id      BIGINT UNIQUE NOT NULL,
  user_id             BIGINT NOT NULL,
  user_name           TEXT NOT NULL,
  channel_id          BIGINT NOT NULL,
  channel_name        TEXT,
  content             TEXT,
  is_command          BOOLEAN DEFAULT FALSE,
  synced_to_telegram  BOOLEAN DEFAULT FALSE,
  telegram_msg_id     BIGINT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_msg_user     ON discord_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_discord_msg_channel  ON discord_messages (channel_id);

-- ─────────────────────────────────────────────────────────
-- 3. discord_task_queue — /task command queue
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discord_task_queue (
  id               SERIAL PRIMARY KEY,
  task_id          UUID REFERENCES tasks(id) ON DELETE SET NULL,
  assigned_to      TEXT NOT NULL,
  task_description TEXT NOT NULL CHECK (LENGTH(task_description) BETWEEN 5 AND 500),
  priority         TEXT DEFAULT 'P1' CHECK (priority IN ('P0', 'P1', 'P2')),
  deadline         TIMESTAMPTZ,
  platform_origin  TEXT NOT NULL CHECK (platform_origin IN ('discord', 'telegram')),
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_queue_assigned ON discord_task_queue (assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_queue_status   ON discord_task_queue (status);

-- ─────────────────────────────────────────────────────────
-- 4. discord_notifications — Platform notification history
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discord_notifications (
  id           SERIAL PRIMARY KEY,
  user_id      BIGINT,
  notify_type  TEXT NOT NULL
               CHECK (notify_type IN ('task_assigned', 'ctb_update', 'blocker_alert', 'sync_error')),
  content      TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('discord', 'telegram', 'both')),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  read_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user     ON discord_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created  ON discord_notifications (created_at DESC);

-- ─────────────────────────────────────────────────────────
-- 5. Enable RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────

ALTER TABLE discord_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_notifications ENABLE ROW LEVEL SECURITY;

-- Public read for system services (service role bypasses RLS)
CREATE POLICY "public_read" ON discord_sync_log FOR SELECT USING (true);
CREATE POLICY "public_read" ON discord_messages FOR SELECT USING (true);
CREATE POLICY "public_read" ON discord_task_queue FOR SELECT USING (true);
CREATE POLICY "public_read" ON discord_notifications FOR SELECT USING (true);

CREATE POLICY "service_insert" ON discord_sync_log FOR INSERT WITH CHECK (true);
CREATE POLICY "service_insert" ON discord_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "service_insert" ON discord_task_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "service_insert" ON discord_notifications FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 6. Migration record (optional, if schema_migrations table exists)
-- ─────────────────────────────────────────────────────────
-- INSERT INTO schema_migrations (name) VALUES ('38_discord_bot_phase1') ON CONFLICT DO NOTHING;
