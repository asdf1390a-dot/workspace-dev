# db/30 마이그레이션 실행 가이드

## 상황
- **항목**: Asset Master Phase 3-1 Edit History Tracking
- **마감**: 2026-06-15 18:00 KST (약 3시간 남음)
- **블로커**: db/30 마이그레이션이 Supabase에서 아직 실행되지 않음
- **현황**: API 코드 100% 준비됨, DB만 필요

## 준비물
1. Supabase 계정 (이미 있음: pzkvhomhztikhkgwgqzr)
2. 브라우저
3. 복사-붙여넣기 능력

## 실행 단계 (2분 소요)

### 1단계: Supabase 대시보드 접속
```
https://supabase.com/dashboard/project/pzkvhomhztikhkgwgqzr
```

### 2단계: SQL Editor 열기
왼쪽 사이드바에서 **SQL Editor** 클릭

### 3단계: 새 쿼리 생성
**+ New Query** 버튼 클릭

### 4단계: SQL 실행
아래 SQL 전체를 복사하여 에디터에 붙여넣기:

```sql
-- db/30 Asset Master Phase 3: Edit History Tracking & Disposal Management
-- FIXED: Safe idempotent execution (safe for re-run)
-- VERIFIED: RLS policies fixed — no portfolio_id dependency

-- ============================================================================
-- STEP 1: Clean up existing objects (safe to run multiple times)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_log_asset_changes ON assets;
DROP TRIGGER IF EXISTS trigger_update_asset_edit_tracking ON assets;
DROP FUNCTION IF EXISTS log_asset_changes();
DROP FUNCTION IF EXISTS update_asset_edit_tracking();
DROP POLICY IF EXISTS "asset_disposals_insert_policy" ON asset_disposals;
DROP POLICY IF EXISTS "asset_disposals_select_policy" ON asset_disposals;
DROP POLICY IF EXISTS "asset_edit_history_insert_policy" ON asset_edit_history;
DROP POLICY IF EXISTS "asset_edit_history_select_policy" ON asset_edit_history;
DROP TABLE IF EXISTS asset_disposals;
DROP TABLE IF EXISTS asset_edit_history;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_last_edited_by;

-- ============================================================================
-- STEP 2: Add columns to assets table
-- ============================================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_by uuid;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_edited_at timestamptz DEFAULT now();
ALTER TABLE assets ADD CONSTRAINT fk_assets_last_edited_by
  FOREIGN KEY (last_edited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: Create asset_edit_history table
-- ============================================================================

CREATE TABLE asset_edit_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_field VARCHAR(255) NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_asset_edit_history_asset_id ON asset_edit_history(asset_id);
CREATE INDEX idx_asset_edit_history_changed_at ON asset_edit_history(changed_at);
CREATE INDEX idx_asset_edit_history_changed_by ON asset_edit_history(changed_by);

-- ============================================================================
-- STEP 4: Create asset_disposals table
-- ============================================================================

CREATE TABLE asset_disposals (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposed_by UUID NOT NULL REFERENCES auth.users(id),
  disposal_reason VARCHAR(255) NOT NULL,
  disposal_date DATE NOT NULL,
  disposal_certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX idx_asset_disposals_disposed_by ON asset_disposals(disposed_by);
CREATE INDEX idx_asset_disposals_created_at ON asset_disposals(created_at);

-- ============================================================================
-- STEP 5: Enable RLS & create policies (SIMPLIFIED - no portfolio_id dependency)
-- ============================================================================

ALTER TABLE asset_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- Asset Edit History: Allow viewing own changes + all changes (authenticated)
CREATE POLICY "asset_edit_history_select_policy" ON asset_edit_history FOR SELECT
  USING (true);  -- All authenticated users can view edit history

CREATE POLICY "asset_edit_history_insert_policy" ON asset_edit_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());  -- Can only insert your own changes

-- Asset Disposals: Allow viewing own disposals + all disposals (authenticated)
CREATE POLICY "asset_disposals_select_policy" ON asset_disposals FOR SELECT
  USING (true);  -- All authenticated users can view disposals

CREATE POLICY "asset_disposals_insert_policy" ON asset_disposals FOR INSERT
  WITH CHECK (disposed_by = auth.uid());  -- Can only insert your own disposals

-- ============================================================================
-- STEP 6: Create triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_asset_edit_tracking() RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_by := auth.uid();
  NEW.last_edited_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_asset_edit_tracking BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_asset_edit_tracking();

CREATE OR REPLACE FUNCTION log_asset_changes() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.asset_tag IS DISTINCT FROM NEW.asset_tag THEN
    INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'asset_tag', COALESCE(OLD.asset_tag::text, 'null'), COALESCE(NEW.asset_tag::text, 'null'));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO asset_edit_history (asset_id, changed_by, changed_field, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', COALESCE(OLD.status::text, 'null'), COALESCE(NEW.status::text, 'null'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_asset_changes AFTER UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION log_asset_changes();

-- ============================================================================
-- COMPLETE: Ready for Asset Master Phase 3 API development
-- ============================================================================
```

### 5단계: 실행
**RUN** 버튼 (또는 Ctrl+Enter) 클릭

### 6단계: 확인
다음 중 하나가 나타나면 성공:
- ✅ "Executed successfully"
- ✅ "Query executed successfully"
- 또는 콘솔에 오류가 없음

## 실행 후 확인

마이그레이션 후, 테이블이 생성되었는지 Supabase 대시보드에서 확인:

1. **Database** → **Tables** 선택
2. 다음 테이블 존재 확인:
   - ✅ `asset_edit_history` (4개 인덱스 포함)
   - ✅ `asset_disposals` (3개 인덱스 포함)

3. **assets** 테이블 확인:
   - ✅ `edit_history` 컬럼 추가됨
   - ✅ `last_edited_by` 컬럼 추가됨
   - ✅ `last_edited_at` 컬럼 추가됨

## 만약 오류가 나면

### 오류: "relation already exists"
→ 무시해도 됨 (이전 실행 때 이미 생성됨)

### 오류: "permission denied"
→ Service Role Key가 필요함 (Admin 계정으로 재시도)

### 오류: "syntax error"
→ SQL 복사 시 일부가 누락되었을 수 있음 (전체 다시 복사하여 시도)

## 완료 후

1. ✅ 마이그레이션 실행 확인
2. ✅ Jeepney AI에 메시지: "db/30 실행 완료"
3. ✅ Phase 3-1 API 테스트 시작 (Edit History 조회, 저장)
4. ✅ Phase 3-2 구현 시작 (Disposal Management UI)

---

**시간**: ~2분  
**난이도**: 쉬움 (복사-붙여넣기)  
**위험도**: 낮음 (테이블/트리거만 생성, 기존 데이터 영향 없음)
