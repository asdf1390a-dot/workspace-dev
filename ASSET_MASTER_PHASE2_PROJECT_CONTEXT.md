# Asset Master Phase 2 — 프로젝트 컨텍스트 & 구현 가이드

**담당:** 웹개발 지원가 (신입)  
**메멘토:** 웹개발자  
**기간:** 2026-05-17 ~ 2026-05-23 (7일)  
**목표:** 16개 API + 4개 UI 컴포넌트 구현 완료  
**기대효과:** Asset Master 모듈 완성, 웹개발자 부하 30% 감소

---

## 📌 프로젝트 개요

### 목적
DSC 공장(인도 타이어 제조)의 **506개 물리 자산**을 중앙화된 디지털 시스템으로 관리.
- JIG, MOULD, 기계, 설비, 판넬, 로봇 등 추적
- QR 코드 스캔으로 즉시 조회
- 변경 이력 자동 기록
- 후속 모듈(BM, PM, Parts) 연계

### 핵심 가치
| 항목 | 효과 |
|------|------|
| 조회 효율 | 수동(5분) → 자동(5초) |
| 재고 정확도 | 80% → 100% |
| 이력 추적 | 없음 → 완전 기록 |
| 다국어 지원 | 영어 + 한국어 + 타밀어 |

---

## 🏗️ 아키텍처 개요

### 스택
```
Frontend: Next.js 14 + React 18 + TypeScript + Tailwind CSS
Backend: Next.js API Routes (serverless)
Database: PostgreSQL (Supabase)
Deployment: Vercel (자동 CI/CD)
```

### API 패턴
```
메서드: GET (조회), POST (생성), PUT (수정), DELETE (삭제)
경로: /api/assets, /api/assets/:id, /api/assets/import, etc.
응답: JSON { data, error?, message? }
오류: HTTP 400/404/500 + error message
```

### 데이터베이스 테이블 (4개)

#### 1. categories (15개 대분류)
```sql
CREATE TABLE categories (
  code TEXT PRIMARY KEY, -- '01' ~ '15'
  name_en VARCHAR(100),
  name_ko VARCHAR(100),
  name_ta VARCHAR(100),
  display_order INT
);

-- 15개 카테고리:
-- 01=UTILITY, 02=PROCESS, 03=JIG, 04=MOULD, 05=ROBOT
-- 06=HYDRAULIC, 07=PNEUMATIC, 08=CONVEYOR, 09=STORAGE, 10=QUALITY
-- 11=SAFETY, 12=ENVIRONMENTAL, 13=IT_INFRASTRUCTURE, 14=FACILITY, 15=SUPPORT
```

#### 2. asset_classes (~120개 세부분류)
```sql
CREATE TABLE asset_classes (
  code TEXT PRIMARY KEY, -- '01.001' ~ '15.NNN'
  category_code TEXT REFERENCES categories(code),
  name_en VARCHAR(100),
  name_ko VARCHAR(100),
  name_ta VARCHAR(100),
  expected_qty INT
);

-- 예: '01.001' = UTILITY > AIR COMPRESSOR
```

#### 3. assets (506개 메인 테이블)
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_class_code TEXT REFERENCES asset_classes(code),
  machine_asset_code VARCHAR(20) UNIQUE, -- '01.001.001'
  machine_asset_number VARCHAR(50) UNIQUE, -- 'DCMI-UTL-PSF-01' (물리 태그)
  name_en VARCHAR(200),
  name_ko VARCHAR(200),
  name_ta VARCHAR(200),
  model VARCHAR(100),
  make VARCHAR(100),
  year_of_manufacture INT,
  location VARCHAR(200),
  status VARCHAR(20), -- 'active', 'idle', 'maintenance', 'sold', 'scrapped'
  qr_payload TEXT, -- QR 코드 데이터 (machine_asset_number)
  photos TEXT[] DEFAULT ARRAY[]::text[], -- 사진 URL 배열
  remark TEXT,
  extra JSONB DEFAULT '{}'::jsonb, -- 확장 필드
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- 인덱스:
CREATE INDEX idx_assets_asset_class_code ON assets(asset_class_code);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);

-- RLS (Row Level Security):
-- 모든 사용자가 조회 가능 (SELECT)
-- 관리자/기술자만 수정 가능 (INSERT/UPDATE/DELETE)
```

#### 4. asset_audit (변경 이력, Trigger 기반)
```sql
CREATE TABLE asset_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  changed_at TIMESTAMP DEFAULT now(),
  changed_by UUID,
  action VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB, -- 변경 전 데이터
  new_values JSONB, -- 변경 후 데이터
  diff JSONB -- 변경된 필드만
);

-- Trigger: assets 테이블 변경 시 자동 기록
CREATE TRIGGER audit_assets
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH ROW
EXECUTE FUNCTION audit_asset_changes();
```

---

## 🔌 API 16개 상세 명세

### 그룹 1: 조회 API (5개)

#### #1. GET /api/assets — 목록 조회 + 필터 + 검색

**요청:**
```bash
GET /api/assets?q=compressor&category=01&location=Hall%20A&limit=50&offset=0

# 쿼리 파라미터:
# - q: 검색어 (name_en, model, serial_no 포함, FTS)
# - category: 카테고리 코드 필터 (예: '01')
# - location: 위치 필터
# - status: 상태 필터 ('active', 'idle', etc.)
# - limit: 한 페이지 항목 수 (기본 50)
# - offset: 페이지 오프셋 (기본 0)
```

**응답:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "machine_asset_code": "01.001.001",
      "machine_asset_number": "DCMI-UTL-PSF-01",
      "name_en": "Air Compressor",
      "name_ko": "에어컴프레셔",
      "model": "Atlas Copco GA5",
      "location": "Hall A",
      "status": "active",
      "created_at": "2026-03-15T10:00:00Z"
    }
  ],
  "total": 256,
  "page": 0,
  "limit": 50,
  "error": null
}
```

**구현 팁:**
- FTS: `name_en.ilike.%query%` OR `model.ilike.%query%` (Supabase RPC 또는 PostgreSQL full-text search)
- 페이지네이션: `limit`, `offset` 필수
- 응답에 `total` 카운트 포함 (클라이언트가 "50/256" 표시 가능)

---

#### #2. GET /api/assets/:id — 상세 조회

**요청:**
```bash
GET /api/assets/550e8400-e29b-41d4-a716-446655440001
```

**응답:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "machine_asset_code": "01.001.001",
    "machine_asset_number": "DCMI-UTL-PSF-01",
    "name_en": "Air Compressor",
    "name_ko": "에어컴프레셀",
    "name_ta": "இயற்றிய அமுக்கி",
    "model": "Atlas Copco GA5",
    "make": "Atlas Copco",
    "year_of_manufacture": 2020,
    "location": "Hall A",
    "status": "active",
    "qr_payload": "DCMI-UTL-PSF-01",
    "photos": ["https://...photo1.jpg", "https://...photo2.jpg"],
    "remark": "Purchased 2020, last serviced 2026-04",
    "extra": {
      "supplier": "Atlas Copco India",
      "warranty_until": "2027-03-15"
    },
    "created_at": "2026-03-15T10:00:00Z",
    "updated_at": "2026-05-16T14:30:00Z",
    "created_by": "admin@dsc.in",
    "updated_by": "tech@dsc.in"
  },
  "error": null
}
```

**구현 팁:**
- UUID 타입 파라미터 검증 필수
- 404: 자산이 없으면 { error: "Asset not found", status: 404 }

---

#### #3. GET /api/asset-categories — 카테고리 목록

**요청:**
```bash
GET /api/asset-categories?lang=en
# lang: 'en', 'ko', 'ta' (기본: 'en')
```

**응답:**
```json
{
  "data": [
    {
      "code": "01",
      "name": "UTILITY",
      "display_order": 1
    },
    {
      "code": "02",
      "name": "PROCESS",
      "display_order": 2
    }
    // ... 15개 전부
  ],
  "error": null
}
```

**구현 팁:**
- 응답에 언어별 이름 포함 (UI 드롭다운용)
- 정렬: `display_order` 기준 오름차순

---

#### #4. GET /api/assets/:id/audit-log — 변경 이력

**요청:**
```bash
GET /api/assets/550e8400-e29b-41d4-a716-446655440001/audit-log?limit=20&offset=0
```

**응답:**
```json
{
  "data": [
    {
      "id": "audit-001",
      "asset_id": "550e8400-e29b-41d4-a716-446655440001",
      "changed_at": "2026-05-16T14:30:00Z",
      "changed_by": "tech@dsc.in",
      "action": "UPDATE",
      "diff": {
        "location": { "old": "Hall B", "new": "Hall A" },
        "updated_at": { "old": "2026-04-01T...", "new": "2026-05-16T..." }
      }
    },
    {
      "id": "audit-002",
      "asset_id": "550e8400-e29b-41d4-a716-446655440001",
      "changed_at": "2026-03-15T10:00:00Z",
      "changed_by": "admin@dsc.in",
      "action": "INSERT",
      "diff": null // INSERT 액션은 diff 없음
    }
  ],
  "total": 5,
  "error": null
}
```

**구현 팁:**
- Trigger가 자동으로 asset_audit 기록
- 최신순 정렬 (changed_at DESC)
- GDPR 규정: 사용자 이메일은 익명화 가능

---

#### #5. GET /api/assets/locations — 위치 자동완성

**요청:**
```bash
GET /api/assets/locations?prefix=Hall
```

**응답:**
```json
{
  "data": ["Hall A", "Hall B", "Hall C", "Storage 1", "Storage 2"],
  "error": null
}
```

**구현 팁:**
- `DISTINCT location FROM assets WHERE location ILIKE 'prefix%'`
- 클라이언트 입력 필드에서 자동완성 추천

---

### 그룹 2: CRUD API (4개)

#### #6. POST /api/assets — 새 자산 추가

**요청:**
```json
{
  "asset_class_code": "01.001",
  "machine_asset_code": "01.001.002",
  "machine_asset_number": "DCMI-UTL-PSF-02",
  "name_en": "Air Compressor 2",
  "name_ko": "에어컴프레셀 2",
  "model": "Kuvera",
  "make": "Kuvera India",
  "year_of_manufacture": 2021,
  "location": "Hall A",
  "status": "active"
}
```

**응답:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_asset_code": "01.001.002",
    // ... 모든 필드
  },
  "message": "Asset created successfully",
  "error": null
}
```

**구현 팁:**
- RLS: auth.uid() 확인 (인증 필수)
- Unique 제약: `machine_asset_code`, `machine_asset_number` 중복 체크
- QR 생성: `qr_payload = machine_asset_number`
- audit trigger 자동 발동

---

#### #7. PUT /api/assets/:id — 자산 수정

**요청:**
```json
{
  "location": "Hall B",
  "status": "maintenance",
  "remark": "Scheduled maintenance 2026-05-20"
}
```

**응답:**
```json
{
  "data": { /* 수정된 전체 자산 */ },
  "message": "Asset updated successfully",
  "error": null
}
```

**구현 팁:**
- Partial update (필요한 필드만 전송 가능)
- `updated_at` 자동 갱신
- `updated_by` = 현재 사용자
- 다른 필드는 변경되지 않음

---

#### #8. DELETE /api/assets/:id — 자산 삭제

**요청:**
```bash
DELETE /api/assets/550e8400-e29b-41d4-a716-446655440001
```

**응답:**
```json
{
  "message": "Asset deleted successfully",
  "error": null
}
```

**구현 팁:**
- Soft delete vs hard delete 논의 필요 (현재는 hard delete 가정)
- audit trigger는 여전히 DELETE 액션 기록
- 관리자만 가능 (RLS)

---

#### #9. POST /api/assets/bulk-update — 일괄 수정

**요청:**
```json
{
  "asset_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "updates": {
    "location": "Hall C"
  }
}
```

**응답:**
```json
{
  "data": {
    "updated_count": 2,
    "asset_ids": [/* */]
  },
  "message": "2 assets updated",
  "error": null
}
```

**구현 팁:**
- 트랜잭션 처리 (모두 성공 또는 모두 실패)
- 각 자산마다 audit trigger 발동

---

### 그룹 3: Import API (5개)

#### #10. POST /api/assets/import/preview — Excel 미리보기

**요청:**
```
FormData:
- file: <Excel 파일 (.xlsx)>
```

**응답:**
```json
{
  "data": {
    "batch_id": "batch-001",
    "preview_rows": [
      {
        "row_number": 2,
        "data": {
          "asset_class_code": "01.001",
          "machine_asset_code": "01.001.010"
        },
        "errors": []
      },
      {
        "row_number": 3,
        "data": { /* */ },
        "errors": ["machine_asset_code missing", "invalid year_of_manufacture"]
      }
    ],
    "total_rows": 256,
    "valid_rows": 254,
    "invalid_rows": 2
  },
  "error": null
}
```

**구현 팁:**
- Excel 파일 파싱: `xlsx` npm 패키지
- 검증 규칙: 필수 필드, 데이터 타입, 고유성
- 미리보기: 첫 50행 + 오류 요약
- batch_id 생성 (다음 API에서 사용)

---

#### #11. POST /api/assets/import/execute — 실행

**요청:**
```json
{
  "batch_id": "batch-001",
  "mode": "insert" // 또는 "upsert"
}
```

**응답:**
```json
{
  "data": {
    "batch_id": "batch-001",
    "inserted_count": 254,
    "skipped_count": 2,
    "failed_count": 0,
    "status": "completed"
  },
  "message": "Import completed: 254 inserted, 2 skipped",
  "error": null
}
```

**구현 팁:**
- Bulk insert를 위해 Supabase RPC 사용 권장 (타임아웃 방지)
- Vercel 제한: hobby = 10s, pro = 60s
- 1000+ 행은 청크 분할 (예: 100행씩)
- 각 행은 audit trigger 기록

---

#### #12. GET /api/assets/import/batches — Import 배치 이력

**요청:**
```bash
GET /api/assets/import/batches?limit=20&offset=0
```

**응답:**
```json
{
  "data": [
    {
      "batch_id": "batch-001",
      "uploaded_at": "2026-05-20T10:30:00Z",
      "uploaded_by": "admin@dsc.in",
      "total_rows": 256,
      "inserted_count": 254,
      "skipped_count": 2,
      "status": "completed"
    }
  ],
  "total": 3,
  "error": null
}
```

**구현 팁:**
- 최신순 정렬 (uploaded_at DESC)

---

#### #13. GET /api/assets/import/batches/:id — 특정 배치 상세

**요청:**
```bash
GET /api/assets/import/batches/batch-001
```

**응답:**
```json
{
  "data": {
    "batch_id": "batch-001",
    "uploaded_at": "2026-05-20T10:30:00Z",
    "uploaded_by": "admin@dsc.in",
    "total_rows": 256,
    "inserted_count": 254,
    "items": [ /* 각 행의 삽입 결과 */ ]
  },
  "error": null
}
```

---

#### #14. GET /api/assets/import/batches/:id/items — 배치 항목 조회

**요청:**
```bash
GET /api/assets/import/batches/batch-001/items?limit=50&offset=0
```

**응답:**
```json
{
  "data": [
    {
      "row_number": 2,
      "status": "inserted",
      "asset_id": "550e8400-...",
      "data": { /* 삽입된 데이터 */ },
      "error": null
    },
    {
      "row_number": 3,
      "status": "failed",
      "asset_id": null,
      "data": { /* 원본 데이터 */ },
      "error": "Duplicate machine_asset_code"
    }
  ],
  "total": 256,
  "error": null
}
```

---

### 그룹 4: Export & Stats (2개)

#### #15. GET /api/assets/export/excel — Excel 다운로드

**요청:**
```bash
GET /api/assets/export/excel?category=01&status=active
```

**응답:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="assets_2026-05-17.xlsx"

[Excel 파일 바이너리]
```

**구현 팁:**
- 라이브러리: `xlsx` npm 패키지
- 헤더: 카테고리, 자산코드, 자산번호, 이름, 모델, 위치, 상태 등
- 필터 적용 가능 (category, status)
- 대량 자산(500+)은 시간이 걸림 (5~10초)

---

#### #16. GET /api/assets/statistics — 통계 대시보드

**요청:**
```bash
GET /api/assets/statistics?period=month
```

**응답:**
```json
{
  "data": {
    "total_assets": 506,
    "by_status": {
      "active": 450,
      "idle": 40,
      "maintenance": 10,
      "sold": 5,
      "scrapped": 1
    },
    "by_category": {
      "01": 45,
      "02": 120,
      "03": 80,
      // ... 15개 전부
    },
    "by_location": {
      "Hall A": 150,
      "Hall B": 200,
      "Storage 1": 156
    },
    "recent_changes": {
      "created_last_30_days": 10,
      "updated_last_30_days": 25,
      "deleted_last_30_days": 2
    },
    "charts": {
      "status_distribution": { /* pie chart data */ },
      "category_distribution": { /* bar chart data */ }
    }
  },
  "error": null
}
```

**구현 팁:**
- 데이터베이스 쿼리 최적화 (GROUP BY, COUNT 집계)
- 차트 라이브러리: recharts 또는 chart.js (프론트에서 사용)

---

## 🎨 UI 컴포넌트 4개

### #1. AssetList (자산 목록 페이지)
```typescript
// pages/assets/index.tsx
- 필터 섹션 (카테고리, 위치, 상태, 검색어)
- 자산 테이블 (ID, 코드, 이름, 모델, 위치, 상태, 수정일)
- 페이지네이션 (1/10 페이지)
- 액션 버튼 (상세 보기, 수정, 삭제, QR 스캔)
```

### #2. AssetDetail (자산 상세 페이지)
```typescript
// pages/assets/[id].tsx
- 기본 정보 (코드, 이름, 모델, 제조사, 연도)
- 위치/상태 정보
- QR 코드 표시 + 다운로드
- 사진 갤러리 (업로드 기능)
- 변경 이력 탭 (audit log)
- 편집 모드 전환 버튼
```

### #3. ImportWizard (Import 마법사)
```typescript
// pages/assets/import.tsx
Step 1: 파일 선택 (Excel 드래그 앤 드롭)
Step 2: 미리보기 (256 행 중 254 유효, 2 오류)
Step 3: 실행 (진행률 표시 + 결과 요약)
```

### #4. Statistics (통계 대시보드)
```typescript
// pages/assets/statistics.tsx
- KPI 카드: 총 자산 수, 활성 자산, 유휴 자산
- 차트: 상태별 분포 (pie), 카테고리별 분포 (bar)
- 테이블: 최근 변경사항 (10개)
- 필터: 기간(월/분기/연도)
```

---

## ⚙️ 환경 변수 & 설정

### .env.local (로컬 개발)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (비공개)

# Optional
DATABASE_URL=postgresql://user:password@host/db
NODE_ENV=development
```

### Vercel 환경 변수 (배포)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## 📊 개발 로드맵 & 의존도

```
Day 1 (2026-05-17): 온보딩, 환경 설정, 기존 코드 리뷰
Day 2 (2026-05-18): API #1-5 (조회, 5개)
Day 3 (2026-05-19): API #6-9 (CRUD, 4개)
Day 4 (2026-05-20): API #10-12 (Import, 3개)
Day 5 (2026-05-21): API #13-14 (Import 상세, 2개)
Day 6 (2026-05-22): API #15-16 (Export/Stats, 2개)
Day 7 (2026-05-23): UI 컴포넌트 + 통합 테스트 + 배포

병렬 진행 가능:
- API #1-5: 완전 독립 (조회만)
- API #6-9: API #1-5 완료 후 시작
- API #10-16: 순차적 (의존도 높음)
```

---

## 🚨 위험 요소 & 완화책

| 위험 | 영향 | 완화책 |
|------|------|--------|
| Import 1000+ 행 타임아웃 | Vercel 10s 제한 | RPC 사용 + 청크 분할 (100행씩) |
| audit trigger 성능 | bulk insert 시 느려짐 | batch 단위 1 audit row |
| 신입 온보딩 시간 부족 | Day 2 시작 지연 | Day 1에 모든 환경 완성 |
| RLS 정책 미숙 | 보안 결함 | 메멘토 최종 검증 + 코드 리뷰 |
| Excel 파일 인코딩 | 데이터 손상 | UTF-8 검증 + 테스트 케이스 |

---

## 🎯 성공 기준

### Day 1
- ✅ npm install, npm run dev 완성
- ✅ GitHub 첫 커밋 성공
- ✅ Task #1 스펙 이해

### Day 2-3
- ✅ API #1-5 모두 완성
- ✅ 메멘토 코드 리뷰 통과
- ✅ Postman 테스트 성공

### Day 4-7
- ✅ API #6-16 모두 완성
- ✅ UI 컴포넌트 4개 완성
- ✅ Vercel 배포 성공
- ✅ 통합 테스트 통과

---

## 📚 참고 자료

- **Next.js 문서:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Supabase API:** https://supabase.com/docs/guides/api
- **PostgreSQL 타입:** https://www.postgresql.org/docs/current/datatype.html
- **TypeScript 핸드북:** https://www.typescriptlang.org/docs/

---

**기억:** 명확한 스펙 + 작은 커밋 + 정기적 코드 리뷰 = 성공적인 구현 🎯
