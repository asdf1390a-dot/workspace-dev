---
name: Asset Master Phase 2 Web-Builder AI Agent 리뷰 피드백
description: DB스키마충돌해결, category_code정정, name_ta추가, Excel라이브러리역할분리, MVP16개축소, 부분실패처리
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_PHASE2_WEB_FEEDBACK.md
---

# Asset Master v2 Phase 2 — Web-Builder AI Agent 리뷰 피드백

**대상:** ASSET_MASTER_PHASE2_DESIGN_SKELETON.md 1차 스켈톤  
**결론:** 방향성 OK. 범위 축소 + 일정 재조정 필요. 25개 → 16개 우선, 나머지는 Phase 2.5로 이월.

## 핵심 5가지 수정 사항

### 1. DB 스키마 충돌
**문제:** `assets_status_idx`, `assets_search_idx`, `assets_location_idx` 이미 01_schema.sql에 존재
**해결:** 
- `IF NOT EXISTS` 사용하면 혼선 방지
- FTS 인덱스는 기존 정의(`name_ko` 포함, `make` 누락)와 다르므로 **둘 중 하나로 통일**

### 2. category_code 필드 부재
**문제:** 설계의 Excel 헤더에 `category_code` 있으나, assets 테이블에는 `asset_class_code`만 존재
**해결:** **Excel 헤더를 `asset_class_code`로 정정** (카테고리는 class_code prefix로 도출: 01.001 → category 01)

### 3. name_ta 누락
**문제:** 설계가 Tamil 명칭 컬럼 간과
**해결:** Excel 템플릿/검색/내보내기에 모두 추가

### 4. Excel 라이브러리 역할 분리
**설치 상태:** xlsx, exceljs, formidable 모두 deps에 있음 (신규 추가 불필요)
**권장:** 읽기는 xlsx (SheetJS), 쓰기(스타일링)는 exceljs로 역할 분리

### 5. 일정 및 범위 축소
**기존:** 05-19까지 25개 API (1인 기준 비현실적)
**변경:** **MVP 16개로 축소** → 05-19 달성 가능

## MVP 16개 API (Phase 2 / 나머지 9개는 Phase 2.5)

**우선순위 분류:**
| Group | 우선순위 | API 개수 | 상태 |
|-------|---------|---------|------|
| 1. 조회 (GET) | MVP | 5개 | 1,2,3,4,5 |
| 2. CRUD | MVP | 4개 | 6,7,8,9 (bulk-update) |
| 3. Import | MVP | 5개 | preview, validate(11과통합), execute, batches list/detail/items |
| 4. Export & Stats | MVP | 2개 | excel, statistics |
| **Defer (Phase 2.5)** | - | 9개 | deduplicate, merge, validation-report, timeline, 등 |

## 의존성 및 라이브러리

**필수 라이브러리 (모두 설치됨):**
- xlsx ^0.18.5 (Excel 읽기)
- exceljs ^4.4.0 (Excel 쓰기 + 스타일)
- formidable ^3.5.4 (파일 업로드)
- zod ^4.4.3 (스키마 검증)
- Node crypto (해시)

## 성능 우려사항 및 완화책

**1000+ 행 import 타임아웃:**
- 권장: Supabase `rpc` 로 bulk insert 위임 (트랜잭션 + 빠름)
- 클라이언트 JS: 검증된 행 배열 한 번에 → 함수 내 `INSERT ... SELECT FROM jsonb_to_recordset(...)` 처리

**audit trigger × bulk insert:**
- INSERT 트리거 비활성 옵션 또는 batch 단위 1 audit row

**`import_result jsonb` 비대화:**
- 에러는 `asset_import_items.validation_errors`에만 → summary만 jsonb

## 대량 처리 전략 (하이브리드 배치 + 비동기)

```
[Client multipart upload]
  ↓
[POST /import/preview] → 파일 파싱 + items 저장 (status=pending) → batch_id + 첫 20행 preview + 오류 요약
  ↓ [Client 확인]
[POST /import/execute {batch_id, confirm:true}] → 100행씩 chunk → supabase rpc bulk_insert_assets
  ↓
[Client polling GET /import/batches/:id (1초 간격)] → status=completed
```

**핵심:** preview 단계에서 **모든 행을 DB에 임시 저장**(items 테이블) → execute는 검증된 결과만 처리. 클라이언트 재연결 안정.
