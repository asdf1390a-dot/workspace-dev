---
name: Asset Management 기능 개발 체크리스트
description: DB 마이그레이션 + API 구현 + Supabase Storage 설정 체크리스트 (Phase 1-3)
type: project
relatedFiles: ASSET_MANAGEMENT_SUMMARY.md
---

# Asset Management 기능 개발 체크리스트

**작성일:** 2026-05-14  
**상태:** 설계 완료 → 개발 대기  
**담당:** Web-Builder  
**예상 완료:** 2026-05-21 (7일)

## Phase 1: DB 설정 (1일, 2026-05-15)

### DB 마이그레이션
- [ ] assets 테이블에 4개 칼럼 추가 (disposal_reason, disposal_date, disposal_notes, disposal_by)
- [ ] asset_files 테이블 생성 (id, asset_id, file_name, file_type, file_size, storage_path, description, uploaded_at, uploaded_by, created_at)
- [ ] asset_disposal_history 테이블 생성 (id, asset_id, previous_status, new_status, reason, notes, created_at, created_by)
- [ ] 인덱스 생성 (assets.status, assets.disposal_date, asset_files.asset_id, asset_disposal_history.asset_id, created_at)

### RLS 정책
- [ ] asset_files SELECT (모두 가능)
- [ ] asset_files INSERT (업로드자만)
- [ ] asset_files DELETE (업로드자 또는 자산 생성자)
- [ ] asset_disposal_history SELECT/INSERT

### Supabase Storage
- [ ] assets 버킷 생성 (private)
- [ ] 폴더 구조 확인: `assets/{asset_id}/{file_type}/{filename}`
- [ ] Storage RLS 정책 설정

### 마이그레이션 테스트
- [ ] Supabase 콘솔 테이블 생성 확인
- [ ] RLS 동작 확인
- [ ] 샘플 데이터 삽입 테스트

## Phase 2: 타입 & 유틸리티 (1일, 2026-05-15)

### TypeScript 타입
- [ ] Asset 인터페이스에 4개 필드 추가
- [ ] AssetFile 인터페이스
- [ ] AssetDisposalHistory 인터페이스
- [ ] AssetDetail 인터페이스
- [ ] UpdateAssetRequest, DisposeAssetRequest

### 검증 유틸리티
- [ ] validateFile() — 파일 크기(10MB), 포맷
- [ ] validateAssetUpdate() — 자산 편집 입력
- [ ] validateDisposal() — 폐기 요청

### 상수 정의
- [ ] 파일 타입: specification, photo, proof_of_purchase, maintenance, other
- [ ] 상태 옵션: active, idle, maintenance, sold, scrapped (라벨, 색상 포함)
- [ ] 최대 파일 크기: 10MB
- [ ] 지원 파일 포맷

## Phase 3: API 엔드포인트 (2일, 2026-05-17)

### GET /api/assets/:id (자산 상세)
- [ ] token 검증
- [ ] assets + asset_files + asset_disposal_history 조회
- [ ] 응답 포맷: { asset, files, disposal_history }
- [ ] 오류 처리: 404, 500

### PUT /api/assets/:id (자산 편집)
- [ ] token 검증
- [ ] 권한 확인 (생성자 또는 관리자)
- [ ] 입력 검증 (name_en, location, status)
- [ ] asset_class_code, machine_asset_number는 읽기 전용
- [ ] updated_at, updated_by 자동 설정

### POST /api/assets/:id/files (파일 업로드)
- [ ] token 검증
- [ ] FormData 파싱
- [ ] 파일 검증 (크기, 포맷)
- [ ] Supabase Storage 업로드: assets/{asset_id}/{file_type}/{uuid}
- [ ] asset_files 레코드 생성
- [ ] 응답: { file_id, file_name, file_size, storage_path }

### GET /api/assets/:id/files/:file_id (파일 다운로드)
- [ ] token 검증
- [ ] 임시 URL 생성 (1시간 유효)
- [ ] 응답: { download_url }

### DELETE /api/assets/:id/files/:file_id (파일 삭제)
- [ ] token 검증
- [ ] 권한 확인 (업로드자 또는 자산 생성자)
- [ ] Supabase Storage에서 파일 삭제
- [ ] asset_files 레코드 삭제

### POST /api/assets/:id/dispose (자산 폐기/매각)
- [ ] token 검증
- [ ] 권한 확인 (생성자 또는 관리자)
- [ ] assets 상태 업데이트 (active → sold/scrapped)
- [ ] asset_disposal_history 레코드 생성
- [ ] 응답: { success, message }

### GET /api/assets/disposal-history (폐기 이력)
- [ ] token 검증
- [ ] 페이지네이션 (limit, offset)
- [ ] 필터: asset_id, status, date_range
- [ ] 정렬: created_at DESC

## 테스트 & 배포

- [ ] Unit 테스트 (각 엔드포인트)
- [ ] 통합 테스트 (파일 업로드/다운로드)
- [ ] 권한 테스트 (RLS 정책)
- [ ] 성능 테스트 (파일 크기별)
- [ ] Vercel 배포 및 검증

## 상태
🟡 **설계 완료** → 웹개발자 개발 대기
