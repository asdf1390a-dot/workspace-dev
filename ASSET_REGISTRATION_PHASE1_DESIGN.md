# Asset Master 신규등록 페이지 Phase 1 설계

> **작성일:** 2026-05-15  
> **작성자:** C-3PO (Design & Dev)  
> **상태:** 설계 완료 (구현 준비)  
> **예상 완료:** 2026-05-15 16:00 KST  

---

## 📋 목차

1. [개요](#개요)
2. [Phase 1 범위](#phase-1-범위)
3. [데이터 모델 & DB 변경](#데이터-모델--db-변경)
4. [UI/UX 설계](#uiux-설계)
5. [파일 관리 시스템](#파일-관리-시스템)
6. [API 인터페이스](#api-인터페이스)
7. [구현 체크리스트](#구현-체크리스트)

---

## 개요

### 목표
Asset Master의 신규등록 페이지를 **두 양식(등록/매각) 기반 필드 구성**과 **파일 첨부 기능**으로 고도화.

### 핵심 요구사항
- **두 양식:** 신규 자산 등록 vs. 매각용 양식 (필드 구성이 다름)
- **파일 첨부:** 증빙서류, 사진, 인보이스 등 다양한 유형 지원
- **파일 다운로드:** 첨부파일 개별 다운로드 가능

### 대상 사용자
- 관리자: 자산 등록, 매각 기록
- 기술자: 파일 확인, 증빙 자료 검색

---

## Phase 1 범위

### ✅ 포함
1. 신규등록 양식 (Registration Form)
   - 기본 정보, 사양, 위치, 상태
   - 파일 첨부 (최대 5개)
2. 매각 양식 (Disposal Form)
   - 매각 사유, 매각 가격, 구매자 정보
   - 파일 첨부 (증빙 서류)
3. 파일 관리
   - Supabase Storage에 저장
   - 파일 다운로드
   - 파일 유형별 분류 (Proof, Photo, Invoice)

### ❌ 미포함 (Phase 2/3)
- Excel 다운로드 (Phase 2)
- 다국어 UI (Phase 3)
- QR 스캔 (Phase 3)

---

## 데이터 모델 & DB 변경

### 1. 신규 테이블: `asset_documents`

```sql
create table asset_documents (
  id uuid primary key default gen_random_uuid(),
  
  -- Reference
  asset_id uuid not null references assets(id) on delete cascade,
  
  -- File info
  document_type text not null check (document_type in ('photo', 'proof', 'invoice', 'other')),
  filename text not null,
  file_url text not null,  -- Supabase Storage URL
  file_size int,           -- bytes
  mime_type text,
  
  -- Metadata
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id),
  
  -- Index
  created_at timestamptz not null default now()
);

create index asset_documents_asset_idx on asset_documents(asset_id);
create index asset_documents_type_idx on asset_documents(document_type);
```

### 2. 자산 테이블 확장

현재 `assets` 테이블에 매각용 필드 추가:

```sql
alter table assets add column if not exists disposal_reason text;      -- '매각', '폐기', '선물'
alter table assets add column if not exists disposal_price numeric;    -- 매각 가격
alter table assets add column if not exists buyer_name text;           -- 구매자명
alter table assets add column if not exists buyer_contact text;        -- 구매자 연락처
alter table assets add column if not exists disposed_at timestamptz;   -- 매각 일시
```

---

## UI/UX 설계

### 1. 신규등록 페이지 구조

#### 페이지: `/assets/new`

**URL 파라미터:**
- `?form=registration` (기본값) — 신규 등록 양식
- `?form=disposal` — 매각 양식

**레이아웃:**

```
┌────────────────────────────────────┐
│ 신규 자산 등록                      │
├────────────────────────────────────┤
│ [등록] [매각] ← 탭으로 선택        │
├────────────────────────────────────┤
│
│ ### 등록 양식 (form=registration)
│
│ 1️⃣ 자산 정보
│   - 카테고리 [선택]
│   - 자산 클래스 [선택]
│   - 명칭 (영어) [필수]
│   - 명칭 (타밀어) [선택]
│   - 물리 태그 [필수]
│   - 일련번호 [선택]
│
│ 2️⃣ 사양
│   - 모델 [선택]
│   - 제조사 [선택]
│   - 제조년도 [선택]
│
│ 3️⃣ 위치 & 상태
│   - 위치 [필수]
│   - 상태 [필수, 기본값: active]
│   - 비고 [선택]
│
│ 4️⃣ 파일 첨부
│   - 사진 [선택, 최대 5개]
│   - 증빙서류 [선택, 최대 3개]
│   - 인보이스 [선택, 최대 2개]
│   - [📁 파일 선택] → 미리보기 → [제거]
│
│ [저장] [취소]
│
│ ### 매각 양식 (form=disposal)
│
│ 1️⃣ 자산 선택
│   - 자산 선택 [필수] ← 검색+드롭다운
│   - 현재 상태: Active
│
│ 2️⃣ 매각 정보
│   - 매각 사유 [필수]
│     ○ 노후화
│     ○ 용도 변경
│     ○ 중복
│     ○ 기타 [텍스트]
│   - 매각 가격 [선택, 숫자]
│   - 구매자명 [선택]
│   - 구매자 연락처 [선택]
│   - 매각 일시 [필수, 기본값: today]
│
│ 3️⃣ 비고
│   - 추가 정보 [선택]
│
│ 4️⃣ 파일 첨부
│   - 증빙서류 [선택, 최대 5개]
│   - 인보이스 [선택, 최대 2개]
│
│ [저장] [취소]
│
└────────────────────────────────────┘
```

### 2. 파일 첨부 UI 컴포넌트

```
┌──────────────────────────────────┐
│ 📁 파일 첨부 - 사진 (최대 5개)   │
├──────────────────────────────────┤
│ [📷 파일 선택]                  │
├──────────────────────────────────┤
│ ✓ photo_001.jpg    (2.3 MB)     │
│   [미리보기] [제거]             │
│                                 │
│ ✓ photo_002.jpg    (1.8 MB)     │
│   [미리보기] [제거]             │
└──────────────────────────────────┘
```

### 3. 등록 후 조회 페이지

#### 페이지: `/assets/[id]`

**신규 탭 추가: "문서"**

```
[기본정보] [이력] [QR] [BM/PM] [문서]
                             ↑
                          신규 추가
                          
┌────────────────────────────────────┐
│ 문서 & 파일                        │
├────────────────────────────────────┤
│ 📸 사진 (1개)                     │
│  └─ photo_001.jpg [다운로드]      │
│                                 │
│ 📄 증빙서류 (2개)                │
│  ├─ proof_001.pdf [다운로드]     │
│  └─ proof_002.pdf [다운로드]     │
│                                 │
│ 📋 인보이스 (1개)                │
│  └─ invoice_2026_001.pdf        │
│     [다운로드]                  │
└────────────────────────────────────┘
```

---

## 파일 관리 시스템

### 1. 저장소 (Supabase Storage)

**Bucket 구조:**
```
dsc-fms-portal/
├── assets/
│   ├── {asset_id}/
│   │   ├── photos/
│   │   │   ├── photo_1.jpg
│   │   │   └── photo_2.jpg
│   │   ├── proofs/
│   │   │   └── proof_1.pdf
│   │   └── invoices/
│   │       └── invoice_1.pdf
```

### 2. 제약사항

| 항목 | 값 |
|------|-----|
| 최대 파일 크기 | 10 MB |
| 허용 파일 형식 | JPG, PNG, PDF, DOC, DOCX |
| 사진 최대 개수 | 5개 |
| 증빙서류 최대 개수 | 3개 |
| 인보이스 최대 개수 | 2개 |

### 3. 파일 업로드 흐름

```
사용자가 파일 선택
  ↓
클라이언트 검증 (크기, 형식)
  ↓
Supabase Storage에 업로드
  ↓
asset_documents 테이블에 메타데이터 저장
  ↓
UI에 파일 목록 반영
```

### 4. 파일 다운로드 흐름

```
사용자가 [다운로드] 클릭
  ↓
Supabase Storage에서 서명된 URL 요청 (유효기간: 1시간)
  ↓
파일 다운로드 시작
```

---

## API 인터페이스

### 1. 자산 생성 (기존)

**POST `/api/assets`**

현재 구현 유지. 파일은 별도 엔드포인트로 처리.

### 2. 파일 업로드 (신규)

**POST `/api/assets/[id]/documents`**

```json
Request:
{
  "document_type": "photo",
  "file": File  // FormData
}

Response:
{
  "id": "uuid",
  "asset_id": "uuid",
  "document_type": "photo",
  "filename": "photo_001.jpg",
  "file_url": "https://...",
  "uploaded_at": "2026-05-15T09:00:00Z"
}
```

### 3. 파일 목록 조회 (신규)

**GET `/api/assets/[id]/documents`**

```json
Response:
[
  {
    "id": "uuid",
    "document_type": "photo",
    "filename": "photo_001.jpg",
    "file_url": "https://...",
    "file_size": 2400000,
    "uploaded_at": "2026-05-15T09:00:00Z"
  },
  ...
]
```

### 4. 파일 삭제 (신규)

**DELETE `/api/assets/[id]/documents/[doc_id]`**

```json
Response:
{ "success": true }
```

### 5. 자산 매각 등록 (신규)

**POST `/api/assets/[id]/dispose`**

```json
Request:
{
  "disposal_reason": "노후화",
  "disposal_price": 50000,
  "buyer_name": "John Doe",
  "buyer_contact": "+91-98765-43210",
  "disposed_at": "2026-05-15T00:00:00Z"
}

Response:
{
  "id": "uuid",
  "status": "sold",  // 상태 자동 변경
  "disposal_reason": "노후화",
  ...
}
```

---

## 구현 체크리스트

### ✅ DB 마이그레이션 (30분)
- [ ] `asset_documents` 테이블 생성
- [ ] `assets` 테이블에 disposal 필드 추가
- [ ] RLS 정책 설정
- [ ] 인덱스 생성

### ✅ 백엔드 API (2시간)
- [ ] `POST /api/assets/[id]/documents` (파일 업로드)
- [ ] `GET /api/assets/[id]/documents` (파일 목록)
- [ ] `DELETE /api/assets/[id]/documents/[doc_id]` (파일 삭제)
- [ ] `POST /api/assets/[id]/dispose` (매각 등록)
- [ ] Supabase Storage 초기화 & 접근 권한 설정

### ✅ 프론트엔드 - 신규등록 페이지 (2시간)
- [ ] `/assets/new` 페이지 리팩토링 (탭 UI 추가)
- [ ] 등록 양식 완성 (파일 첨부 섹션 추가)
- [ ] 매각 양식 완성 (자산 선택, 매각 정보)
- [ ] 파일 업로드 컴포넌트 구현
- [ ] 파일 미리보기 기능
- [ ] 클라이언트 검증 (파일 크기, 형식)

### ✅ 프론트엔드 - 자산 상세 페이지 (1시간)
- [ ] "문서" 탭 추가 (`/assets/[id]`)
- [ ] 파일 목록 표시
- [ ] 파일 다운로드 기능
- [ ] 파일 삭제 기능 (관리자만)

### ✅ 테스트 (1시간)
- [ ] 신규 자산 + 파일 등록 테스트
- [ ] 매각 양식으로 매각 기록 테스트
- [ ] 파일 다운로드 테스트
- [ ] 파일 삭제 테스트
- [ ] 폰 및 태블릿 반응형 테스트

### ✅ 최종 배포 (30분)
- [ ] DB 마이그레이션 실행
- [ ] Vercel 배포
- [ ] 현장 QA

---

## 구현 순서 (우선순위)

1. **DB 마이그레이션** (01_schema_phase1_update.sql)
2. **파일 업로드 API** (/api/assets/[id]/documents)
3. **신규등록 페이지 UI** (등록 + 매각 양식)
4. **자산 상세 페이지** (문서 탭)
5. **통합 테스트**

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| **DB** | Supabase Postgres |
| **파일 저장** | Supabase Storage |
| **API** | Next.js API Routes + Supabase SDK |
| **프론트엔드** | React 18 + TypeScript |
| **폼 관리** | 순수 React useState |

---

## 향후 개선 (Phase 2/3)

- [ ] 일괄 파일 업로드 (Drag & Drop)
- [ ] 파일 압축 다운로드 (ZIP)
- [ ] 자산 목록에서 문서 개수 표시
- [ ] 파일 검색 기능
- [ ] 파일 공유 기능 (링크 생성)

---

**문서 버전:** v1.0  
**마지막 수정:** 2026-05-15 09:25 KST
