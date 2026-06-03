---
name: Asset Management API & DB 스키마 가이드
description: 자산 편집/파일 업로드/폐기 관리 API + DB 마이그레이션 명세
type: project
relatedFiles: ASSET_MANAGEMENT_API_GUIDE.md
---

# Asset Management API & DB 스키마 가이드

**작성일:** 2026-05-14  
**상태:** 설계 완료 → Web-Builder AI Agent 개발 대기  
**대상:** Web-Builder (API 구현)

## DB 스키마 확장

### assets 테이블 추가 칼럼 (ALTER)
- disposal_reason, disposal_date, disposal_notes, disposal_by (4개 칼럼)
- 인덱스: idx_assets_status, idx_assets_disposal_date

### 신규 테이블: asset_files
```
- id (UUID, PK)
- asset_id (FK: assets)
- file_type: specification|photo|proof_of_purchase|maintenance|other
- file_size, storage_path (Supabase Storage)
- uploaded_by (UUID, FK: auth.users)
- uploaded_at (timestamptz)
- 인덱스: asset_id, file_type, uploaded_at DESC
- RLS: SELECT 모두 가능, INSERT/DELETE 는 업로드자만
```

### 신규 테이블: asset_disposal_history
```
- id (UUID, PK)
- asset_id, previous_status, new_status
- reason, notes, created_by
- 인덱스: asset_id, created_at DESC
- RLS: SELECT 모두, INSERT/UPDATE 생성자만
```

## API 엔드포인트 (7개)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/assets/:id | 자산 상세 조회 (asset + files + history) |
| PUT | /api/assets/:id | 자산 편집 (name, location, status 등) |
| POST | /api/assets/:id/files | 파일 업로드 |
| GET | /api/assets/:id/files/:file_id | 파일 다운로드 (임시 URL 1시간 유효) |
| DELETE | /api/assets/:id/files/:file_id | 파일 삭제 |
| POST | /api/assets/:id/dispose | 자산 폐기/매각 처리 |
| GET | /api/assets/disposal-history | 폐기 이력 조회 |

## TypeScript 타입 & 검증

### 타입 인터페이스
- Asset (4개 필드 추가)
- AssetFile (파일 메타)
- AssetDisposalHistory
- AssetDetail (asset + files + history 통합)
- UpdateAssetRequest, DisposeAssetRequest

### 검증 유틸리티
- validateFile() — 크기(10MB), 포맷 검증
- validateAssetUpdate() — 자산 편집 입력 검증
- validateDisposal() — 폐기 요청 검증

## 개발 단계

### Phase 1: DB 설정 (1일, 2026-05-15)
- 마이그레이션 스크립트 작성
- RLS 정책 설정
- Supabase Storage 설정

### Phase 2: 타입 & 유틸리티 (1일, 2026-05-15)
- TypeScript 타입 확장
- 검증 유틸 작성
- 상수 정의

### Phase 3: API 엔드포인트 (2일, 2026-05-17)
- 7개 API 라우트 구현
- 권한 검증 (생성자 또는 관리자)
- FormData 파싱 및 파일 업로드

## 특수 사항

- 파일 저장 구조: `assets/{asset_id}/{file_type}/{uuid}-{filename}`
- asset_class_code, machine_asset_number: 읽기 전용
- updated_at, updated_by 자동 설정
- 오류 처리: 400, 401, 403, 404, 500

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 개발 대기
