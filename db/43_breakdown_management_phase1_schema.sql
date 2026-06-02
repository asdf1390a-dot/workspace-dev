-- BM-P1: Breakdown Management Phase 1 Schema
-- Created: 2026-05-28
-- Purpose: Equipment breakdown/failure reporting, tracking, and analytics system
-- Tables: breakdown_reports (main), breakdown_analysis (view)

-- ============================================================================
-- Table: breakdown_reports (핵심 고장 보고 테이블)
-- ============================================================================

CREATE TABLE IF NOT EXISTS breakdown_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Asset Reference (필수, Asset Master와 연계)
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,

  -- 고장 정보
  description TEXT NOT NULL,                    -- 고장 설명 (영문)
  description_ta TEXT,                         -- 고장 설명 (타밀어)

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'reported' CHECK (
    status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'won_fix')
  ),

  -- 심각도
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (
    severity IN ('minor', 'normal', 'major', 'line_down')
  ),

  -- 시간 추적
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,                       -- 고장 시작 시간 (실제)
  resolved_at TIMESTAMPTZ,                      -- 고장 해결 시간

  -- 계산 필드 (자동 계산)
  duration_minutes INT GENERATED ALWAYS AS (
    CASE
      WHEN resolved_at IS NOT NULL AND started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (resolved_at - started_at))::integer / 60
      ELSE NULL
    END
  ) STORED,

  -- 담당자
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 분류
  category TEXT CHECK (
    category IN ('mechanical', 'electrical', 'hydraulic', 'software', 'operator_error', 'unknown')
  ),
  root_cause TEXT,                              -- 근본 원인 분석
  action_taken TEXT,                            -- 조치 사항

  -- 사진/문서
  photos TEXT[] DEFAULT '{}',                   -- 저장소 URL 배열
  documents TEXT[] DEFAULT '{}',                -- 첨부 문서 URL

  -- 감사 필드
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 소프트 삭제
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes for breakdown_reports
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_asset_id
  ON breakdown_reports(asset_id);

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_status
  ON breakdown_reports(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_severity
  ON breakdown_reports(severity)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_reported_at
  ON breakdown_reports(reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_resolved_at
  ON breakdown_reports(resolved_at DESC)
  WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_asset_month
  ON breakdown_reports(asset_id, DATE_TRUNC('month', reported_at))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_reported_by
  ON breakdown_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_breakdown_reports_assigned_to
  ON breakdown_reports(assigned_to);

-- ============================================================================
-- Trigger: set_updated_at (자동 updated_at 업데이트)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_breakdown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS breakdown_reports_updated_at_trigger ON breakdown_reports;

CREATE TRIGGER breakdown_reports_updated_at_trigger
BEFORE UPDATE ON breakdown_reports
FOR EACH ROW
EXECUTE FUNCTION set_breakdown_updated_at();

-- ============================================================================
-- Row Level Security (RLS) for breakdown_reports
-- ============================================================================

ALTER TABLE breakdown_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: 모든 사용자가 active 고장 보고서 조회 가능
DROP POLICY IF EXISTS "users_view_all_breakdowns" ON breakdown_reports;
CREATE POLICY "users_view_all_breakdowns" ON breakdown_reports
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy 2: 인증된 사용자는 새 고장 보고 작성 가능
DROP POLICY IF EXISTS "users_create_breakdowns" ON breakdown_reports;
CREATE POLICY "users_create_breakdowns" ON breakdown_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: 보고자, 담당자, 또는 관리자만 업데이트 가능
DROP POLICY IF EXISTS "users_update_own_breakdowns" ON breakdown_reports;
CREATE POLICY "users_update_own_breakdowns" ON breakdown_reports
  FOR UPDATE
  USING (
    auth.uid() = reported_by
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.user_id = auth.uid()
      AND org_members.role = 'admin'
    )
  );

-- ============================================================================
-- View: breakdown_analysis (분석/집계)
-- ============================================================================

CREATE OR REPLACE VIEW breakdown_analysis AS
SELECT
  -- Asset 정보
  br.asset_id,
  a.machine_asset_number,
  a.name_en AS asset_name,

  -- 월별 집계
  DATE_TRUNC('month', br.reported_at)::DATE AS month,

  -- KPI
  COUNT(*) FILTER (WHERE br.status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE br.status != 'resolved') AS open_count,
  COUNT(*) AS total_count,

  -- 심각도 분포
  COUNT(*) FILTER (WHERE br.severity = 'line_down') AS line_down_count,
  COUNT(*) FILTER (WHERE br.severity = 'major') AS major_count,
  COUNT(*) FILTER (WHERE br.severity = 'normal') AS normal_count,
  COUNT(*) FILTER (WHERE br.severity = 'minor') AS minor_count,

  -- MTTR (Mean Time To Repair)
  ROUND(
    AVG(br.duration_minutes) FILTER (WHERE br.status = 'resolved' AND br.duration_minutes IS NOT NULL)
  )::INTEGER AS avg_mttr_minutes,

  -- MTBF (Mean Time Between Failures) — 월 내 평균 간격 (분 단위)
  CASE
    WHEN COUNT(*) > 1 THEN ROUND(
      (EXTRACT(EPOCH FROM (DATE_TRUNC('month', br.reported_at) + INTERVAL '1 month' - DATE_TRUNC('month', br.reported_at)))
      / NULLIF((COUNT(*) - 1), 0))::integer / 60
    )::INTEGER
    ELSE NULL
  END AS avg_mtbf_hours,

  -- 총 다운타임
  COALESCE(
    SUM(br.duration_minutes) FILTER (WHERE br.status = 'resolved' AND br.duration_minutes IS NOT NULL),
    0
  )::BIGINT AS total_downtime_minutes

FROM breakdown_reports br
LEFT JOIN assets a ON br.asset_id = a.id
WHERE br.deleted_at IS NULL
GROUP BY br.asset_id, a.machine_asset_number, a.name_en, DATE_TRUNC('month', br.reported_at)
ORDER BY month DESC, br.asset_id ASC;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE breakdown_reports IS 'Equipment breakdown/failure reporting and tracking table';
COMMENT ON COLUMN breakdown_reports.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN breakdown_reports.asset_id IS 'Reference to assets.id (Asset Master)';
COMMENT ON COLUMN breakdown_reports.status IS 'Status state machine: reported → acknowledged → in_progress → resolved | won_fix';
COMMENT ON COLUMN breakdown_reports.severity IS 'Severity level: minor, normal, major, line_down';
COMMENT ON COLUMN breakdown_reports.duration_minutes IS 'Auto-calculated: (resolved_at - started_at) in minutes';
COMMENT ON COLUMN breakdown_reports.category IS 'Root cause category: mechanical, electrical, hydraulic, software, operator_error, unknown';
COMMENT ON COLUMN breakdown_reports.deleted_at IS 'Soft delete marker (NULL = active)';

COMMENT ON VIEW breakdown_analysis IS 'Aggregate view for breakdown analytics: KPIs, MTTR, MTBF, severity distribution by asset and month';

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Check table creation
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'breakdown_reports';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'breakdown_reports';

-- Check RLS enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'breakdown_reports';

-- Check view
-- SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'breakdown_analysis';
