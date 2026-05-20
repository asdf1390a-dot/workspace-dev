---
name: Asset Management — 자산 편집/파일/폐기 관리 설계
description: 기존 자산 편집 + 파일 업로드 + 폐기/매각 관리 + 히스토리 추적 UI/DB 설계
type: project
relatedFiles: ASSET_MANAGEMENT_DESIGN.md
---

# Asset Management — 자산 편집/파일/폐기 관리 설계

**작성일:** 2026-05-14  
**상태:** 설계 완료 → Web-Builder 개발 대기

## 핵심 기능

### 1. 자산 편집 (Asset Detail Edit)
- 자산 상세화면 (`/assets/:id`)에서 기본정보 수정
- 불편집 필드: asset_class_code, machine_asset_number (데이터 무결성)
- 편집 페이지: `/assets/:id/edit` (기존 신규등록 폼 재사용)

### 2. 파일 관리 (File Management)
**신규 테이블:** asset_files
- file_name, file_type (specification|photo|proof_of_purchase|maintenance|other)
- storage_path (Supabase Storage), uploaded_at, uploaded_by, description
- 최대 파일 크기: 10MB
- 지원 포맷: .jpg, .png, .gif, .webp, .pdf, .docx, .xlsx, .txt, .zip

**폴더 구조:**
```
assets/{asset_id}/
├── specifications/
├── photos/
├── proofs/
└── maintenance/
```

**기능:**
- Drag-and-drop + 클릭 선택 업로드
- 진행률 바 표시
- 다운로드 (개별/배치), 삭제

### 3. 폐기/매각 관리 (Disposal Management)
**신규 테이블:** asset_disposal_history
- asset_id, previous_status (active|idle|maintenance)
- new_status (sold|scrapped)
- reason, notes, created_at, created_by

**Assets 테이블 신규 필드:**
- disposal_reason (string, null)
- disposal_date (timestamp, null)
- disposal_notes (text, null)
- disposal_by (uuid, null)

**폐기/매각 모달:** `/assets/:id/dispose`
- 상태 선택: Scrapped 또는 Sold
- 사유 드롭다운: 노후화, 고장, 용도 변경, 기타
- 날짜 선택 (기본값: 오늘)
- 확인 후 자동 리스트에서 제거

## UI 변경사항

### 자산 목록 페이지 (`/assets`)
- 상태 필터 추가: "활성 자산" 탭 (기본) | "폐기/매각" 탭
- 활성 자산: sold, scrapped 제외
- 폐기/매각 탭: sold + scrapped만 표시
- 각 행에 "상세보기" 링크

### 자산 상세 페이지 (`/assets/:id`)
- 상단: 물리 태그, 명칭, 카테고리, 위치, 상태 배지
- 액션 버튼: [편집] [폐기/매각] [다운로드]
- 기본 정보: ID, 생성일, 클래스, 시리얼번호, 모델, 제조사, 제조년도, 비고
- 파일 섹션: 업로드된 파일 목록 + [파일 업로드] 버튼 + 개별 다운로드/삭제
- 폐기/매각 히스토리 (해당 자산만): 변경일, 사유, 메모, 담당자, [복원] 버튼

## 개발 순서

1. asset_files, asset_disposal_history 테이블 생성
2. Assets 테이블 필드 추가 마이그레이션
3. 자산 상세 페이지 UI (읽기 모드)
4. 자산 편집 페이지 + API
5. 파일 업로드/다운로드/삭제 기능 + Supabase Storage
6. 폐기/매각 모달 + API
7. 자산 목록 필터 (활성/폐기)
8. 테스트 & 배포

## 기대 효과

- 자산 정보 유지보수 자동화
- 폐기/매각 이력 추적
- 파일 기반 증빙 자료 관리
- 활성 자산 vs 폐기 자산 분리 표시

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 구현 대기
