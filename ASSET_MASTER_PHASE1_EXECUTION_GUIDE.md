# Asset Master Phase 1 — DB 마이그레이션 실행 가이드

**담당:** web-builder  
**우선순위:** 🔴 CRITICAL  
**목표:** db/28_asset_master_v2.sql을 Supabase에 실행하여 asset_qr_scans 테이블 생성  
**예상 소요:** 5분  
**완료 기준:** asset_qr_scans 테이블 생성 + 인덱스 + RLS 정책 설정

---

## 실행 단계

### 1️⃣ Supabase SQL Editor 열기
```
1. https://supabase.com → Project: dsc-fms
2. SQL Editor 탭 클릭
3. New Query 버튼 클릭
```

### 2️⃣ 마이그레이션 SQL 복사
**파일:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/28_asset_master_v2.sql`

파일 전체 내용:
```sql
-- Asset Master v2 — QR Scanning and Incremental Features
-- Applied after: 01_schema.sql (assets table)
-- Goal: Add QR scan logging without changing existing asset structure
-- Preserves all 506 existing assets + FK chains (BM/PM/Disposal)

-- ============================================================
-- 1. New Table: asset_qr_scans — QR scan audit trail
-- ============================================================

create table if not exists public.asset_qr_scans (
  id uuid primary key default gen_random_uuid(),

  -- Link to asset
  asset_id uuid not null references assets(id) on delete cascade,

  -- QR code data
  qr_payload text not null,

  -- Scan metadata
  scanned_at timestamptz not null default now(),
  scanned_by uuid references auth.users(id),
  device_info text,        -- Mobile/Tablet device identifier
  location_gps text        -- Optional GPS coordinates (lat,lon)
);

-- Indexes for common queries
create index if not exists asset_qr_scans_asset_idx on asset_qr_scans(asset_id);
create index if not exists asset_qr_scans_payload_idx on asset_qr_scans(qr_payload);
create index if not exists asset_qr_scans_scanned_at_idx on asset_qr_scans(scanned_at desc);

-- ============================================================
-- 2. RLS Policy for asset_qr_scans
-- ============================================================

alter table public.asset_qr_scans enable row level security;

drop policy if exists "auth_all_qr_scans" on asset_qr_scans;
create policy "auth_all_qr_scans" on asset_qr_scans
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 3. Verification: existing asset structure unchanged
-- ============================================================
-- The following should all remain as-is:
-- - assets table: all existing columns (id, asset_class_code, etc.)
-- - asset_classes, categories tables: unchanged
-- - asset_audit triggers: continue to work
-- - FK chains: BM_history, PM_schedule, asset_disposal all still reference assets(id)

-- To verify after apply:
-- SELECT COUNT(*) FROM assets;  -- should be 506 (or existing count)
-- SELECT COUNT(*) FROM asset_qr_scans;  -- should be 0 (newly created)
-- SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_name='assets' AND constraint_type='FOREIGN KEY';
```

### 3️⃣ SQL 실행
1. 위 SQL을 Supabase SQL Editor에 붙여넣기
2. **Run** 버튼 클릭 (또는 Cmd+Enter / Ctrl+Enter)
3. 실행 완료 대기 (보통 1~2초)

### 4️⃣ 검증
실행 완료 후 다음 쿼리로 검증:

```sql
-- Check 1: asset_qr_scans 테이블 존재 확인
SELECT COUNT(*) FROM asset_qr_scans;  -- 결과: 0 (새로 생성됨)

-- Check 2: 기존 assets 테이블 행 수 (변경 없음)
SELECT COUNT(*) FROM assets;  -- 결과: 506 이상

-- Check 3: 인덱스 생성 확인
SELECT indexname FROM pg_indexes WHERE tablename = 'asset_qr_scans';
-- 결과 예상: asset_qr_scans_asset_idx, asset_qr_scans_payload_idx, asset_qr_scans_scanned_at_idx

-- Check 4: RLS 정책 확인
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'asset_qr_scans';
-- 결과 예상: auth_all_qr_scans
```

### 5️⃣ 다음 단계
✅ DB 마이그레이션 완료 후:
1. 이 파일 완료 상태 기록: `ASSET_MASTER_PHASE1_EXECUTION_GUIDE.md` 체크 완료
2. **40+ API 엔드포인트 구현 시작** (ASSET_MASTER_API_GUIDE.md 참고)
3. 매일 15:00 진도 리포트 (구현된 API 개수)

---

## 주의사항

- ⚠️ **이미 실행됨:** 이전에 이 마이그레이션을 실행했다면 `create table if not exists`로 인해 안전하게 skip됨
- ⚠️ **기존 자산 보존:** 506개 기존 자산 데이터는 변경 없음
- ⚠️ **FK 체인 무결성:** BM_history, PM_schedule, asset_disposal 관계는 유지됨

---

## 완료 보고

완료 후 Discord #일반채널 또는 Telegram에서:
```
✅ Asset Master Phase 1 DB 마이그레이션 완료
- asset_qr_scans 테이블 생성
- 3개 인덱스 + RLS 정책 설정
- 다음 단계: 40+ API 구현 시작
```

**담당자:** web-builder  
**생성:** 2026-05-15 23:00 KST  
**비서:** C-3PO
