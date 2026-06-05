-- Memory Archive System
-- Created: 2026-06-05
-- Purpose: Long-term storage for agent memory items older than 14 days.
--          Replaces flat MEMORY.md growth with versioned, searchable DB rows.
-- Tables:  memory_archive (main)
-- Migration number: 44

-- ============================================================================
-- Table: memory_archive
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory_archive (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Logical identity (name + type = one "item"; version tracks history)
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('user', 'feedback', 'project', 'reference')
  ),

  -- Versioning
  -- version 1 = original; increments on each upsert of same (name, type)
  version INT NOT NULL DEFAULT 1,
  -- Only one row per (name, type) has is_latest = true at any time.
  -- Managed by trigger fn: memory_archive_version_bump()
  is_latest BOOL NOT NULL DEFAULT true,

  -- Payload — flexible JSONB; shape differs per type (see schema docs)
  content JSONB NOT NULL,

  -- Discovery & filtering
  tags TEXT[] NOT NULL DEFAULT '{}',

  -- Provenance
  -- Absolute path of the source markdown file this row was extracted from
  source_path TEXT,

  -- Lifecycle timestamps
  -- archived_at: when the item was moved from MEMORY.md into this table
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- expires_at: optional TTL; NULL = keep indefinitely
  expires_at TIMESTAMPTZ,
  -- created_at: original item creation date (carried over from source)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Unique constraint: one version number per logical item
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_archive_name_type_version
  ON memory_archive (name, type, version);

-- Partial unique: enforce only one is_latest row per (name, type)
CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_archive_latest
  ON memory_archive (name, type)
  WHERE is_latest = true;

-- ============================================================================
-- Indexes
-- ============================================================================

-- Fast lookup by type (most common filter)
CREATE INDEX IF NOT EXISTS idx_memory_archive_type
  ON memory_archive (type);

-- Fast lookup by name
CREATE INDEX IF NOT EXISTS idx_memory_archive_name
  ON memory_archive (name);

-- Time-range queries ("what was archived last week?")
CREATE INDEX IF NOT EXISTS idx_memory_archive_archived_at
  ON memory_archive (archived_at DESC);

-- JSONB full-text search via GIN (supports @>, ?, ?| operators)
CREATE INDEX IF NOT EXISTS idx_memory_archive_content_gin
  ON memory_archive USING gin (content);

-- Array containment for tags (e.g. tags @> '{feedback,active}')
CREATE INDEX IF NOT EXISTS idx_memory_archive_tags_gin
  ON memory_archive USING gin (tags);

-- ============================================================================
-- Trigger: auto-increment version on upsert of same (name, type)
-- ============================================================================

CREATE OR REPLACE FUNCTION memory_archive_version_bump()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_max_version INT;
BEGIN
  -- On INSERT of a new row with is_latest = true,
  -- find max existing version and retire the previous latest row.
  SELECT COALESCE(MAX(version), 0)
    INTO v_max_version
    FROM memory_archive
   WHERE name = NEW.name
     AND type = NEW.type
     AND id   <> NEW.id;     -- exclude the row being inserted

  IF v_max_version > 0 THEN
    -- Retire previous latest
    UPDATE memory_archive
       SET is_latest  = false,
           expires_at = COALESCE(expires_at, now())
     WHERE name      = NEW.name
       AND type      = NEW.type
       AND is_latest = true
       AND id        <> NEW.id;

    -- Assign next version to the incoming row
    NEW.version := v_max_version + 1;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_memory_archive_version_bump
  BEFORE INSERT ON memory_archive
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION memory_archive_version_bump();

-- updated_at auto-refresh on UPDATE
CREATE OR REPLACE FUNCTION memory_archive_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_memory_archive_updated_at
  BEFORE UPDATE ON memory_archive
  FOR EACH ROW
  EXECUTE FUNCTION memory_archive_set_updated_at();

-- ============================================================================
-- RLS (Row-Level Security)
-- ============================================================================

ALTER TABLE memory_archive ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read (조회 공개 — 팀 내 공유)
CREATE POLICY "memory_archive_select_authenticated"
  ON memory_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT / UPDATE / DELETE: 비서 역할(agent service role)만 허용
-- Implementation: use Supabase service_role key for writes;
-- authenticated users are read-only.
-- If a dedicated 'secretary' role is added later, replace with:
--   TO secretary_role
-- For now, only service_role bypasses RLS (Supabase default behavior).

-- Deny direct writes from authenticated (non-service) callers
CREATE POLICY "memory_archive_insert_service_only"
  ON memory_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "memory_archive_update_service_only"
  ON memory_archive
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "memory_archive_delete_service_only"
  ON memory_archive
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- Sample data — 4 rows covering all 4 types
-- ============================================================================

INSERT INTO memory_archive (name, type, version, is_latest, content, tags, source_path, archived_at, created_at)
VALUES
  -- user type
  (
    'gm_kyeongtae_na',
    'user',
    1,
    true,
    '{
      "summary": "GM at DSC Mannur, Chennai. Numbers-first, Korean-primary conclusions.",
      "facts": ["KST timezone (UTC+9)", "Telegram preferred for reports", "30-min analysis SLA"],
      "preferences": {
        "language": "Korean for conclusions, English for column names",
        "table_rows": 10,
        "rounding": "3-4 sig figs"
      }
    }'::jsonb,
    ARRAY['gm', 'persona', 'active'],
    'memory/MEMORY.md',
    now() - INTERVAL '15 days',
    now() - INTERVAL '30 days'
  ),

  -- feedback type
  (
    'feedback_ceo_autonomous_mode',
    'feedback',
    1,
    true,
    '{
      "rule": "CEO Autonomous Mode",
      "trigger": "technical decision required",
      "action": "auto-execute without asking for permission",
      "rationale": "Reduces back-and-forth on routine technical choices",
      "source_file": "feedback_work_initiation_protocol.md"
    }'::jsonb,
    ARRAY['feedback', 'autonomy', 'active'],
    'memory/feedback_work_initiation_protocol.md',
    now() - INTERVAL '14 days',
    now() - INTERVAL '20 days'
  ),

  -- project type
  (
    'project_discord_bot_p1',
    'project',
    1,
    true,
    '{
      "name": "Discord Bot P1",
      "status": "in_progress",
      "completion_pct": 40,
      "deadline": "2026-06-05T18:00:00+09:00",
      "milestones": [
        {"title": "route file created", "done": true},
        {"title": "4 processors", "done": false}
      ],
      "blocker": "95% of processor logic not yet implemented"
    }'::jsonb,
    ARRAY['project', 'discord', 'p1', 'in_progress'],
    'memory/MEMORY.md',
    now() - INTERVAL '1 day',
    now() - INTERVAL '5 days'
  ),

  -- reference type
  (
    'ref_breakdown_schema_bm_events',
    'reference',
    1,
    true,
    '{
      "title": "BM Events Table Schema",
      "body": "bm_events: id, reported_at, asset_id, status. Linked to assets via asset_id UUID FK.",
      "links": ["db/43_breakdown_management_phase1_schema.sql"],
      "keywords": ["breakdown", "MTTR", "bm_events", "asset_id", "FMS"]
    }'::jsonb,
    ARRAY['reference', 'schema', 'fms', 'breakdown'],
    'db/43_breakdown_management_phase1_schema.sql',
    now() - INTERVAL '7 days',
    now() - INTERVAL '7 days'
  );

-- ============================================================================
-- Verify
-- ============================================================================

-- Run after applying:
-- SELECT name, type, version, is_latest, tags, archived_at
--   FROM memory_archive
--  ORDER BY type, name, version;
