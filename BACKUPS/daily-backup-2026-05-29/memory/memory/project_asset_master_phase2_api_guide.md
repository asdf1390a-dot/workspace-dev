---
name: Asset Master Phase 2 API 구현 가이드
description: MVP 16개 API 상세 명세 (조회 5, CRUD 4, Import 5, Export/Stats 2) with request/response formats
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_PHASE2_API_GUIDE.md
---

# Asset Master Phase 2 API 구현 가이드

**작성:** 2026-05-16 09:00 KST  
**대상:** Web-Builder AI Agent  
**범위:** MVP 16개 API + 에러 처리 + 검증 규칙

## API 목록 (MVP 16개)

### Group 1: 조회 (GET) — 5개

- GET /api/assets — 목록 (필터+검색+페이지네이션)
  - 쿼리: page, per_page, q (FTS 검색), category, status, location, make, sort_by, sort_order
  - 응답: data[], total, page, per_page, total_pages
  - 에러: 400 (잘못된 파라미터), 500 (DB 오류)

- GET /api/assets/:id — 상세 조회
  - 응답: 전체 자산 정보 (id, machine_asset_number, name_en, name_ta, asset_class_code, location, status, model, make, serial_no, year_of_manufacture, qr_payload, photos[], created_at, updated_at)

- GET /api/asset-categories — 카테고리 목록

- GET /api/assets/:id/audit-log — 자산 이력 (asset_audit 기반)
  - 변경 경로: /history → /audit-log (기존 /history 엔드포인트와 충돌 회피)

- GET /api/assets/locations — 위치 자동완성

### Group 2: CRUD — 4개

- POST /api/assets — 단건 생성 (기존 코드 재사용)
- PUT /api/assets/:id — 단건 수정
- DELETE /api/assets/:id — 단건 삭제
- POST /api/assets/bulk-update — 일괄 수정

### Group 3: Import (대량 임포트) — 5개

- GET /api/assets/import/template.xlsx — 템플릿 다운로드
- POST /api/assets/import/preview — Excel 미리보기 + 검증
- POST /api/assets/import/execute — 일괄 입력 실행
- GET /api/assets/import/batches — 배치 목록
- GET /api/assets/import/batches/:batch_id — 배치 상세
- GET /api/assets/import/batches/:batch_id/items — 배치 아이템 목록

### Group 4: Export & Stats — 2개

- GET /api/assets/export/excel — Excel 다운로드
- GET /api/assets/statistics — 통계 API

## 상세 엔드포인트 명세

### GET /api/assets/:id (상세 조회)

**응답 (200 OK) 예제:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "machine_asset_number": "DCMI-UTL-PSF-01",
  "name_en": "SUB STATION",
  "name_ta": "சப் ஸ்டேஷன்",
  "asset_class_code": "01.001",
  "category_code": "01",
  "location": "EB YARD",
  "status": "active",
  "model": "EB - SUB STATION",
  "make": "TRINITY",
  "serial_no": "SN-2015-001",
  "year_of_manufacture": 2015,
  "qr_payload": "DCMI-UTL-PSF-01",
  "photos": [],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-05-15T10:30:00Z"
}
```

## 핵심 결정사항

1. **App Router 통일:** Pages Router → App Router 마이그레이션
   - 라우트: `app/api/assets/route.ts` (root), `app/api/assets/[assetId]/route.ts` (nested)

2. **경로 변경:** `/history` → `/audit-log`
   - 기존 history 엔드포인트와 충돌 회피 (PM/BM 이벤트 이력용)

3. **코드 재사용:** POST /api/assets
   - 기존 app/api/assets/route.ts 재사용 (새로 구현하지 않음)

4. **Excel 헤더:** asset_class_code (카테고리 대신)

5. **RLS 정책:** org_id 기반 액세스 제어

## 상태
🟡 설계 완료 → Web-Builder AI Agent 구현 중
