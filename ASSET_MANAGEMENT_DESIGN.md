# 자산 관리 기능 설계서

**작성일:** 2026-05-14  
**상태:** 설계 완료 → Web-Builder 개발 대기  
**목표:** 기존 자산 편집 + 파일 업로드 + 폐기/매각 관리 + 히스토리 추적

---

## 1. 기능 개요

### 1.1 핵심 요구사항
- ✅ **기존 자산 편집**: 상세화면에서 자산 정보 수정 가능
- ✅ **자료 업로드**: 명세서, 사진, 구매증명 등 파일 첨부
- ✅ **폐기/매각 관리**: 상태 변경 시 자산리스트에서 제거, 히스토리 별도 보관
- ✅ **상태 변경 기록**: 폐기/매각 사유, 날짜, 담당자 기록

### 1.2 범위 (Scope)
1. **자산 상세화면**: 기존 자산 조회 + 편집
2. **파일 관리**: 업로드, 다운로드, 삭제
3. **폐기/매각 관리**: 상태 변경 폼, 히스토리 조회
4. **현황 관리**: 활성 자산 vs 폐기/매각 분리 표시

---

## 2. 데이터 모델

### 2.1 Asset 테이블 확장

**기존 필드** (변경 없음):
- id, asset_class_code, machine_asset_number, serial_no, name_en, name_ta
- model, make, year_of_manufacture, location
- status ('active' | 'idle' | 'maintenance' | 'sold' | 'scrapped')
- photos, remark, qr_payload, extra, created_at, updated_at, created_by, updated_by

**신규 필드**:
- `disposal_reason` (string, null) — 폐기/매각 사유
- `disposal_date` (timestamp, null) — 폐기/매각 날짜
- `disposal_notes` (text, null) — 추가 메모
- `disposal_by` (uuid, null) — 폐기/매각 승인자 ID

### 2.2 신규 테이블: asset_files

```
id (uuid, pk)
asset_id (uuid, fk → assets.id)
file_name (string) — 원본 파일명
file_type (enum: 'specification', 'photo', 'proof_of_purchase', 'maintenance', 'other')
file_size (integer) — 바이트 단위
storage_path (string) — Supabase Storage 경로
uploaded_at (timestamp)
uploaded_by (uuid, fk → auth.users)
description (text) — 선택사항, 파일 설명
```

### 2.3 신규 테이블: asset_disposal_history

```
id (uuid, pk)
asset_id (uuid, fk → assets.id)
previous_status (enum: 'active' | 'idle' | 'maintenance')
new_status (enum: 'sold' | 'scrapped')
reason (string) — 폐기/매각 사유
notes (text) — 추가 사항
created_at (timestamp)
created_by (uuid, fk → auth.users)
```

---

## 3. UI 설계

### 3.1 자산 목록 페이지 (기존)
- 경로: `/assets`
- **변경사항**:
  - 상태 필터 추가: "활성 자산" | "폐기/매각" 탭
  - 기본값: "활성 자산" (sold, scrapped 제외)
  - 폐기/매각 탭: sold + scrapped만 표시
  - 각 행에 "상세보기" 링크 추가

### 3.2 자산 상세 페이지 (신규)
- 경로: `/assets/:id`
- **콘텐츠**:
  
  **상단 섹션 (읽기 모드)**:
  - 물리 태그, 명칭, 카테고리, 위치, 상태 (상태 배지)
  - 액션 버튼: [편집] [폐기/매각] [다운로드]

  **기본 정보**:
  - 자산ID, 생성일, 생성자
  - 클래스, 일련번호, 모델, 제조사, 제조년도
  - 비고

  **파일 섹션**:
  - 업로드된 파일 목록 (파일 타입 아이콘 + 파일명 + 크기 + 업로드일)
  - [파일 업로드] 버튼
  - 각 파일에 다운로드, 삭제 버튼

  **폐기/매각 히스토리** (폐기/매각 상태인 경우만):
  - 상태 변경일, 사유, 추가 메모, 담당자
  - [복원] 버튼 (선택사항, 권한에 따라)

### 3.3 자산 편집 페이지 (신규)
- 경로: `/assets/:id/edit`
- **폼 레이아웃**: 신규 자산 생성 폼과 동일 (app/assets/new/page.tsx 재사용)
- **편집 불가 필드**: asset_class_code, machine_asset_number (변경하면 데이터 무결성 위험)
- **추가 버튼**: [저장] [취소] [삭제] (삭제는 권한 확인 필수)

### 3.4 폐기/매각 모달/페이지 (신규)
- 경로: `/assets/:id/dispose` (또는 모달)
- **폼 필드**:
  - 상태 선택: "폐기 (Scrapped)" | "매각 (Sold)"
  - 사유 (드롭다운): "노후화" | "고장" | "용도 변경" | "기타"
  - 사유 상세 (텍스트, 선택사항)
  - 폐기/매각일 (달력 선택 또는 오늘 기본값)
  - [확인] [취소]

- **확인 후**:
  - asset_disposal_history 테이블에 기록 생성
  - assets 테이블의 status, disposal_reason, disposal_date, disposal_by 업데이트
  - 자산리스트 페이지의 "활성 자산" 탭에서 자동으로 제거됨

---

## 4. 파일 관리 (Supabase Storage)

### 4.1 폴더 구조
```
assets/
  ├── {asset_id}/
  │   ├── specifications/
  │   ├── photos/
  │   ├── proofs/
  │   └── maintenance/
```

### 4.2 파일 업로드
- **최대 파일 크기**: 10MB
- **지원 포맷**:
  - 이미지: .jpg, .png, .gif, .webp
  - 문서: .pdf, .docx, .xlsx, .txt
  - 기타: .zip (압축 파일)
- **업로드 방식**: Drag-and-drop + 클릭 선택
- **진행 표시**: 업로드 진행률 바

### 4.3 파일 다운로드 & 삭제
- **다운로드**: 직접 링크 또는 batch 다운로드 (zip)
- **삭제**: 확인 후 storage + asset_files 테이블 레코드 동시 삭제

---

## 5. 화면 와이어프레임

### 5.1 자산 목록 페이지
```
┌─────────────────────────────────────┐
│  자산 목록                           │
│  [활성 자산] [폐기/매각]            │
├─────────────────────────────────────┤
│ 필터: [카테고리 ▼] [상태 ▼]        │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 물리태그 │ 명칭   │ 위치 │ 상태  │ │
│ ├─────────────────────────────────┤ │
│ │ TAG-01  │ Sub.. │ EB   │ 🟢 Act │ │
│ │ TAG-02  │ Pump  │ Shop │ 🟡 Idle│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 5.2 자산 상세 페이지
```
┌────────────────────────────────────────┐
│  ← 목록으로                            │
│  TAG-01 | Sub Station                   │
│  [편집] [폐기/매각] [다운로드]         │
├────────────────────────────────────────┤
│                                         │
│ 기본 정보                               │
│ ─────────────────────────────────────  │
│ 명칭: Sub Station                       │
│ 위치: EB YARD                           │
│ 상태: 🟢 Active (운영 중)               │
│                                         │
│ 파일 관리                               │
│ ─────────────────────────────────────  │
│ [파일 업로드]                           │
│                                         │
│ ┌────────────────────────────────┐   │
│ │ 📄 spec.pdf        500KB 2026... │   │
│ │ 📷 photo01.jpg     2.3MB 2026... │   │
│ └────────────────────────────────┘   │
│ [↓다운로드] [🗑️삭제]                   │
│                                         │
└────────────────────────────────────────┘
```

### 5.3 폐기/매각 모달
```
┌──────────────────────────────┐
│ 자산 폐기/매각 처리            │
├──────────────────────────────┤
│ 현재 상태: 🟢 Active          │
│                               │
│ 새 상태 선택 *                │
│ ○ 폐기 (Scrapped)            │
│ ○ 매각 (Sold)                │
│                               │
│ 사유 *                        │
│ [▼ 노후화]                    │
│                               │
│ 추가 메모                      │
│ [텍스트 입력]                  │
│                               │
│ 처리 일자                      │
│ [2026-05-14]                 │
│                               │
│ [확인] [취소]                  │
└──────────────────────────────┘
```

---

## 6. 기능 흐름

### 6.1 자산 편집 흐름
```
자산 상세보기 [편집 버튼]
  ↓
편집 폼 로드 (기본값: 현재 정보)
  ↓
사용자 수정 입력
  ↓
[저장] 클릭 → PUT /api/assets/:id
  ↓
검증 (machine_asset_number 중복 확인 제외)
  ↓
업데이트 완료 → 상세 페이지로 리다이렉트
```

### 6.2 파일 업로드 흐름
```
자산 상세 페이지 [파일 업로드 섹션]
  ↓
드래그 & 드롭 또는 선택 클릭
  ↓
파일 선택 (최대 10MB)
  ↓
파일 타입 선택 (specification, photo, proof_of_purchase, maintenance, other)
  ↓
[업로드] → POST /api/assets/:id/files
  ↓
Supabase Storage에 저장 (assets/{asset_id}/{type}/)
  ↓
asset_files 테이블에 메타데이터 저장
  ↓
업로드 완료 → 파일 목록 갱신
```

### 6.3 폐기/매각 흐름
```
자산 상세 페이지 [폐기/매각 버튼]
  ↓
폐기/매각 모달 열기
  ↓
상태, 사유, 메모 입력
  ↓
[확인] 클릭 → PUT /api/assets/:id/dispose
  ↓
asset_disposal_history 레코드 생성
  ↓
assets 테이블 업데이트 (status, disposal_reason, disposal_date, disposal_by)
  ↓
성공 → 자산리스트 페이지로 리다이렉트 (자동으로 "활성 자산" 탭만 표시)
```

---

## 7. 권한 및 검증

### 7.1 권한 (Role-Based)
- **조회**: 모든 로그인 사용자
- **편집**: 자산 생성자 또는 관리자
- **삭제**: 관리자만
- **폐기/매각**: 자산 생성자 또는 관리자

### 7.2 입력 검증
- **편집 폼**:
  - 필수 필드: asset_class_code, machine_asset_number (읽기 전용), name_en, location, status
  - 길이 제한: name_en ≤ 100, remark ≤ 500
  - 제조년도: 1950 ~ 2026
  
- **파일 업로드**:
  - 최대 크기: 10MB
  - 지원 포맷만 허용
  - 파일명 sanitization (보안)

- **폐기/매각**:
  - 상태 선택 필수: 'sold' 또는 'scrapped'
  - 사유 필수
  - 처리일 기본값: 오늘 (미래 날짜 제외)

---

## 8. UI 구성 요소 목록

### 신규 컴포넌트
1. **AssetDetailPage** — /assets/:id
2. **AssetEditForm** — /assets/:id/edit (기존 CreateAssetForm 재사용)
3. **FileUploadSection** — 파일 업로드, 목록, 다운로드/삭제
4. **DisposalModal** — 폐기/매각 모달
5. **DisposalHistory** — 폐기/매각 히스토리 표시
6. **AssetFileBrowser** — 파일 목록 테이블
7. **FileTypeIcon** — 파일 타입 아이콘 컴포넌트

### 기존 컴포넌트 확장
- **AssetListPage** — 상태 필터 탭 추가
- **CreateAssetForm** — 조건부 읽기 전용 필드 지원

---

## 9. 상태 관리 흐름

### 자산 상태 라이프사이클
```
┌─────────────┐
│   Active    │ ← 신규 생성 시 기본값
└──────┬──────┘
       │
    ┌──┴──┐
    │     │
    ↓     ↓
  Idle  Maintenance
    │     │
    └──┬──┘
       │
    ┌──┴──────────────┐
    │                 │
    ↓                 ↓
  Sold (매각)    Scrapped (폐기)
    │                 │
    └──────┬──────────┘
           │
      폐기/매각 히스토리에 기록
      자산리스트 "활성 자산" 탭에서 제거
```

---

## 10. 개발 예상 기간

| 항목 | 담당 | 기간 | 예상 완료일 |
|------|------|------|-----------|
| DB 마이그레이션 | Web-Builder | 1일 | 2026-05-15 |
| API 엔드포인트 (CRUD + Files + Disposal) | Web-Builder | 2일 | 2026-05-17 |
| UI 컴포넌트 (상세, 편집, 파일, 모달) | Web-Builder | 3일 | 2026-05-20 |
| 테스트 & 버그 수정 | Web-Builder | 1일 | 2026-05-21 |
| **합계** | | **7일** | **2026-05-21** |

---

## 11. 다음 단계

1. **Web-Builder**: ASSET_MANAGEMENT_API_GUIDE.md 리뷰
2. **Web-Builder**: DB 마이그레이션 (SQL 스크립트) 실행
3. **Web-Builder**: API 구현 (PUT, DELETE, POST /files, POST /dispose)
4. **Web-Builder**: UI 컴포넌트 구현
5. **Evaluator**: 기능 검증 (3회 이상)
6. **Deployment**: Vercel 배포

---

## 부록: 참고 문서

- [API 가이드](ASSET_MANAGEMENT_API_GUIDE.md)
- [개발 체크리스트](ASSET_MANAGEMENT_SUMMARY.md)
- 현재 자산 구조: `lib/assets/types.ts`
- 신규 자산 폼: `app/assets/new/page.tsx`
- 자산 목록: `app/assets/page.tsx`
