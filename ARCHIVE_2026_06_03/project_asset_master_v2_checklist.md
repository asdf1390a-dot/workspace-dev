---
name: Asset Master v2 구현 체크리스트
description: Web-Builder 단계별 가이드 (DB마이그레이션→TypeScript타입→기본API→Import→UI)
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_V2_IMPLEMENTATION_CHECKLIST.md
---

# Asset Master v2 구현 체크리스트

**대상:** Web-Builder (Web-Builder AI Agent)  
**설계 문서:** ASSET_MASTER_V2_DESIGN.md + ASSET_MASTER_V2_API_GUIDE.md  
**예상 기간:** 7일 (2026-05-16 ~ 2026-05-23)  
**DB 마이그레이션 파일:** db/24_asset_master_v2.sql

## Phase 1: 기초 준비 (1일)

### Step 1.1: DB 마이그레이션

**파일:** /home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/db/24_asset_master_v2.sql

**포함 항목:**
```sql
-- 1. 기존 assets 테이블 검증 (변경 없음)
-- 2. 신규 테이블: asset_qr_scans
-- 3. 신규 인덱스: qr_payload, asset_id
-- 4. RLS 정책 (기존 정책 유지)
```

**체크리스트:**
- [ ] asset_qr_scans 테이블 생성 (id, asset_id FK, qr_payload, scanned_at, scanned_by, device_info, location_gps)
- [ ] 인덱스 추가 (asset_id, qr_payload)
- [ ] RLS 정책 활성화 (authenticated 사용자 SELECT/INSERT)
- [ ] 마이그레이션 검증: Supabase Dashboard에서 테이블 확인

### Step 1.2: TypeScript 타입 업데이트

**파일:** lib/assets/types.ts

**추가 인터페이스:**
```typescript
export interface AssetQRScan {
  id: string;
  asset_id: string;
  qr_payload: string;
  scanned_at: string;
  scanned_by?: string;
  device_info?: string;
  location_gps?: string;
}

export interface ImportBatch {
  batch_id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  inserted: number;
  updated: number;
  failed: number;
  created_at: string;
}

export interface ImportValidationResult {
  file_name: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: string[];
}
```

## Phase 2: API 개발 (4일)

### 기본 조회 (5개)
- [ ] GET /api/assets (목록 + 필터 + 검색)
- [ ] GET /api/assets/:id (상세)
- [ ] GET /api/asset-categories (카테고리)
- [ ] GET /api/assets/:id/audit-log (이력)
- [ ] GET /api/assets/locations (위치 자동완성)

### CRUD (4개)
- [ ] POST /api/assets (재사용, 기존 코드)
- [ ] PUT /api/assets/:id (수정)
- [ ] DELETE /api/assets/:id (삭제)
- [ ] POST /api/assets/bulk-update (일괄 수정)

### Import (5개)
- [ ] GET /api/assets/import/template.xlsx (템플릿 다운로드)
- [ ] POST /api/assets/import/preview (미리보기)
- [ ] POST /api/assets/import/execute (실행)
- [ ] GET /api/assets/import/batches (배치 목록)
- [ ] GET /api/assets/import/batches/:id (배치 상세)

### Export & Stats (2개)
- [ ] GET /api/assets/export/excel (Excel 다운로드)
- [ ] GET /api/assets/statistics (통계)

## Phase 3: UI 컴포넌트 (2일)

- [ ] 자산 목록 페이지 (필터, 검색, 페이지네이션)
- [ ] 자산 상세 페이지
- [ ] Import 마법사 (preview → confirm → execute)

## Phase 4: 테스트 & 배포 (1일)

- [ ] API 엔드포인트 테스트 (16개 모두)
- [ ] Import 프로세스 테스트 (검증 로직, 부분실패)
- [ ] UI 반응형 테스트
- [ ] 배포 (Vercel)

## 구현 패턴 (기존 코드 재사용)

**기존 POST /api/assets:** app/api/assets/route.ts
- 검증 로직: machine_asset_number UNIQUE, name_en NOT NULL
- 에러 처리: 409 Conflict (중복), 400 Bad Request (검증)

**기존 GET /api/assets/:id:** app/api/assets/[assetId]/route.ts
- GET 로직 유지, PUT/DELETE 추가

## 주의사항

1. **RLS 정책:** org_id 기반 액세스 제어 추가 권장
2. **Audit 트리거:** asset_audit_log() 함수 재사용 (새 trigger 추가 불필요)
3. **Index 충돌:** 기존 `assets_status_idx`, `assets_search_idx` 확인 후 IF NOT EXISTS 사용
4. **Excel 라이브러리:** 읽기(xlsx) vs 쓰기(exceljs) 역할 분리
