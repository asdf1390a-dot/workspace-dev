---
name: Asset Master Phase 2 최종 설계 (MVP)
description: Excel 대량 import + search/filter + batch edit + export 기능, 2026-05-19 마감, 16 API + 3 UI screen
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_PHASE2_DESIGN.md
---

# Asset Master Phase 2 최종 설계 (MVP)

**완료일:** 2026-05-16 09:00 KST  
**마감:** 2026-05-19 18:00 KST  
**상태:** ✅ 설계 완료 → Web-Builder AI Agent 개발 착수

## Phase 2 MVP 스코프

### 포함사항 (MVP)
- 16개 API 엔드포인트 (Excel import, search, batch ops, export, audit, stats)
- 3개 통합 UI 화면
- 2개 신규 DB 테이블 (asset_import_batches, asset_import_items)
- RLS 정책 및 종합 인덱싱

### 제외사항 (Phase 2.5 Defer)
- Asset 자동 중복 제거
- 자산 병합 기능
- import 실패 재시도
- Validation 상세 정보
- 누락 필드 쿼리
- Timeline 기능
- Batch 운영 최적화

## 핵심 기술 결정

**최소 변경 원칙:** 기존 테이블 (categories, asset_classes, assets, asset_audit, asset_documents) 재사용, 신규 테이블 2개만 추가

### DB 스키마 추가

**asset_import_batches**
```
id (uuid, PK)
batch_name (string)
batch_date (date)
file_name (string)
file_size_bytes (integer)
file_hash (string, MD5)
status (enum: pending|processing|success|failed|partial)
total_rows (integer)
successful_rows (integer)
failed_rows (integer)
import_results (jsonb)
created_at (timestamp)
updated_at (timestamp)
created_by (uuid, FK to auth.users)
```

**asset_import_items**
```
id (uuid, PK)
batch_id (uuid, FK to asset_import_batches)
row_number (integer)
status (enum: pending|success|failed)
validation_errors (jsonb, nullable)
asset_id (uuid, FK to assets, nullable, after successful match)
created_at (timestamp)
```

## API 엔드포인트 (16개)

### Import 관련 (4개)
- POST /api/assets/import/upload — Excel 파일 업로드
- POST /api/assets/import/preview — import 미리보기
- POST /api/assets/import/execute — import 실행
- GET /api/assets/import/batches — import 배치 목록

### Search/Filter (2개)
- GET /api/assets/search — 통합 검색 (asset_id, name, category, class)
- GET /api/assets/filter — 필터링 (status, department, purchase_date range)

### Batch Operations (2개)
- PUT /api/assets/batch/update — 배치 편집 (상태, 부서, 위치 등)
- DELETE /api/assets/batch/delete — 배치 삭제

### Export (1개)
- GET /api/assets/export/excel — Excel export (검색 결과 기반)

### Audit & Stats (3개)
- GET /api/assets/audit-history/:asset_id — 감시 이력
- GET /api/assets/statistics — 통계 (count, by category/class/status)
- GET /api/assets/import/batch/:batch_id/report — import 배치 리포트

### 기존 API 개선 (4개)
- GET /api/assets — 페이징 + sorting 개선
- GET /api/assets/:id — 감시 이력 포함
- PUT /api/assets/:id — audit trail 자동 기록
- DELETE /api/assets/:id — soft delete → hard delete 전환

## UI 화면 (3개 통합)

### 화면 1: Asset List (Searchable)
- 통합 검색 바 + 필터 UI
- 테이블: asset_id, name, category, class, status, department, location
- 페이징 (50/100/200 row per page)
- 소팅: asset_id, name, created_at
- 배치 선택 → batch edit/delete 버튼

### 화면 2: Import Manager
- Excel 파일 선택 및 업로드
- Preview 테이블 (파일 내용 확인)
- 검증 오류 표시
- Execute 버튼 → import 실행
- 진행 상태바 + 완료/실패 요약

### 화면 3: Import Batch Report
- 배치 정보 (batch_name, batch_date, file_name, status)
- 행별 결과 (성공/실패 rows, 검증 오류)
- 요약 통계 (총 행, 성공, 실패)
- Excel export 버튼

## Phase 1 완료 사항
- 기본 CRUD (create, read, update, delete)
- 파일 첨부 기능
- 기본 UI

## 개발 순서 (Phase 2)

1. DB 마이그레이션 (2개 테이블 + RLS + 인덱싱)
2. API 구현 (import, search, batch, export, stats)
3. UI 화면 구축 (List, Import Manager, Batch Report)
4. 테스트 및 배포

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 구현 개시 대기 (2026-05-19 18:00 마감)
