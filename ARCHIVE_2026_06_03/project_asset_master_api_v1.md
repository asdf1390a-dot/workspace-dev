---
name: Asset Master API 구현 가이드 v1
description: PostgREST + 커스텀 Next.js API, 자산조회(5), CRUD명세, 검색, 필터, 정렬
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_API_GUIDE.md
---

# Asset Master API 구현 가이드 v1

**대상:** DSC FMS Portal Web Developer  
**기준:** ASSET_MASTER_DESIGN.md v1.0  
**상태:** 구현 대기

## API 엔드포인트 구조

### 1. 자산 조회 (GET)

#### 1.1 전체 목록 (GET /api/assets)
**쿼리 파라미터:**
- `select` (기본값: `*`) — 반환할 컬럼 (PostgREST)
- `asset_class_code` — 필터: 자산 클래스 (eq.값)
- `status` — 필터: 상태 (eq.active 등)
- `location` — 필터: 위치 (ilike.%검색어%)
- `make` — 필터: 제조사 (eq.값)
- `order` — 정렬 (기본값: machine_asset_code.asc)
- `limit` (기본값: 50) — 페이지당 행 수
- `offset` (기본값: 0) — 스킵할 행 수

**예시:**
```
GET /api/assets?asset_class_code=eq.01.001&status=eq.active&limit=20&offset=0
GET /api/assets?location=ilike.%COMPRESSOR%&order=updated_at.desc&limit=50
```

#### 1.2 상세 조회 (GET /api/assets/[id])
**응답:**
```json
{
  "id": "uuid",
  "asset_class_code": "01.001",
  "machine_asset_code": "01.001.001",
  "machine_asset_number": "DCMI-UTL-PSF-01",
  "name_en": "SUB STATION",
  "name_ta": "சப் ஸ்டேஷன்",
  "model": "EB - SUB STATION",
  "make": "TRINITY",
  "year_of_manufacture": 2015,
  "location": "EB YARD",
  "status": "active",
  "qr_payload": "DCMI-UTL-PSF-01",
  "photos": [],
  "created_at": "2025-01-09T10:15:00Z",
  "updated_at": "2026-05-13T14:30:00Z"
}
```

#### 1.3 자산 검색 (POST /api/assets/search)
**요청:**
```json
{
  "q": "sub station compressor",
  "limit": 20,
  "offset": 0
}
```

**로직:** to_tsvector('simple', coalesce(name_en,'') || ' ' || coalesce(name_ta,'') || ' ' || ...)

### 2. CRUD 작업

**POST /api/assets** — 신규 생성  
**PUT /api/assets/[id]** — 수정  
**DELETE /api/assets/[id]** — 삭제

### 3. 상태 코드

- `200 OK` — 성공
- `400 Bad Request` — 쿼리 파라미터 오류
- `401 Unauthorized` — 인증 필요
- `404 Not Found` — 자산이 없음

## 필드 명세

**주요 필드:**
- `id` (uuid) — Primary key
- `asset_class_code` (text) — 자산 세부분류
- `machine_asset_code` (text) — 내부 코드 (CC.CCC.NNN)
- `machine_asset_number` (text) — 물리 태그 (DCMI-XXX-XXX-NN, unique)
- `name_en` (text) — 영문 명칭 (필수)
- `name_ta` (text) — 타밀어 명칭
- `model` (text) — 모델명
- `make` (text) — 제조사
- `year_of_manufacture` (int) — 제조년도
- `location` (text) — 위치
- `status` (text) — active/idle/maintenance/sold/scrapped
- `qr_payload` (text) — QR 코드 값 (기본값: machine_asset_number)
- `photos` (text[]) — 사진 URL 배열
- `created_at`, `updated_at` (timestamptz)
