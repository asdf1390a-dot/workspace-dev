---
name: Asset Master 신규등록 Phase 1 설계
description: 신규등록/매각 양식 2개 + 파일 첨부 기능 (asset_documents 테이블)
type: project
relatedFiles: ASSET_REGISTRATION_PHASE1_DESIGN.md
---

# Asset Master 신규등록 페이지 Phase 1 설계

**작성일:** 2026-05-15  
**상태:** 설계 완료 (구현 준비)  
**예상 완료:** 2026-05-15 16:00 KST

## 목표

Asset Master의 신규등록 페이지를 **두 양식(등록/매각) 기반 필드 구성**과 **파일 첨부 기능**으로 고도화.

## Phase 1 범위

### ✅ 포함 항목

1. **신규등록 양식 (Registration Form)**
   - 기본 정보, 사양, 위치, 상태
   - 파일 첨부 (최대 5개)

2. **매각 양식 (Disposal Form)**
   - 매각 사유, 매각 가격, 구매자 정보
   - 파일 첨부 (증빙 서류)

3. **파일 관리**
   - Supabase Storage 저장
   - 파일 다운로드 기능
   - 파일 유형별 분류 (Proof, Photo, Invoice)

### ❌ 미포함 (Phase 2/3)
- Excel 다운로드 (Phase 2)
- 다국어 UI (Phase 3)
- QR 스캔 (Phase 3)

## DB 변경사항

### 신규 테이블: asset_documents
```sql
create table asset_documents (
  id uuid primary key,
  asset_id uuid not null (FK: assets),
  document_type text (photo|proof|invoice|other),
  filename text not null,
  file_url text not null,
  file_size int,
  mime_type text,
  uploaded_at timestamptz default now(),
  uploaded_by uuid (FK: auth.users)
)
```

### 필드 추가 (assets 테이블)
- registration_form_status (draft|submitted|approved)
- disposal_form_status (draft|submitted|approved)

## UI 컴포넌트

### 신규 컴포넌트
- `AssetRegistrationForm` — 신규 등록 양식
- `AssetDisposalForm` — 매각 양식
- `FileUploadWidget` — 파일 첨부 드래그&드롭
- `DocumentList` — 첨부파일 목록 및 다운로드

### API 엔드포인트
- POST /api/assets/register (신규등록)
- POST /api/assets/{id}/disposal (매각)
- POST /api/assets/{id}/documents (파일 업로드)
- GET /api/assets/{id}/documents (파일 목록)
- DELETE /api/documents/{id} (파일 삭제)

## 구현 체크리스트

- [ ] asset_documents 테이블 생성
- [ ] 새 필드(form_status) 마이그레이션
- [ ] AssetRegistrationForm 컴포넌트
- [ ] AssetDisposalForm 컴포넌트
- [ ] FileUploadWidget 구현
- [ ] API 5개 엔드포인트
- [ ] Supabase Storage 버킷 설정
- [ ] RLS 정책 (파일 접근 제어)
- [ ] 테스트 (등록/매각/파일 CRUD)
- [ ] QA 검증

## 상태
🟡 **설계 완료** — 구현 준비 완료, Web-Builder AI Agent 할당 대기
