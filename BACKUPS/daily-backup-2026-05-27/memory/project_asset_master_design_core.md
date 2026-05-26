---
name: Asset Master 모듈 설계 (코어)
description: 506개자산관리, 3단계코드스킴, QR연동, 다국어지원, 이력추적, Supabase기반
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_DESIGN.md
---

# Asset Master 모듈 설계 — DSC FMS Portal

**상태:** 설계 완료 (현장 배포 대비)  
**자산 기준:** 506개 (Excel Master 기준일 2026-03-15)

## 목적

DSC 공장의 506개 물리적 자산(기계, JIG, MOULD, 설비, 판넬 등)을 중앙화된 디지털 자산 마스터로 관리하고, QR 코드, 이력 추적, 후속 BM/PM/Parts 모듈과 연계.

## 범위

- **자산:** 기계, 설비, 판넬, 에어컴프레셔, JIG, MOULD, 로봇, 유압시스템 등
- **사용자:** 관리자(조회/수정/삭제), 기술자(QR 스캔/조회), 현장 작업자(조회)
- **언어:** 한국어(입력), 영어(시스템), 타밀어(현장)
- **배포:** 모바일 우선 (태블릿/스마트폰)

## 핵심 특징

1. **3단계 코드 스킴:** 01.001.001 (계층 숫자) + DCMI-UTL-PSF-01 (물리 태그)
2. **QR 연동:** 각 자산 고유 QR → 즉시 상세 조회
3. **다국어 지원:** 4개 언어 UI, 현장입력은 영어/타밀어
4. **이력 추적:** 모든 변경사항 자동 기록 (누가, 언제, 뭐가)
5. **Supabase 기반:** Postgres + PostgREST + RLS

## 데이터 모델 (4개 테이블)

### 1. categories (15개 대분류)
```
code: '01'~'15' (PK)
name_en, name_ko, name_ta
display_order: int
```

**15개 카테고리:**
- 01=UTILITY, 02=PROCESS, 03=JIG, 04=MOULD, 05=ROBOT
- 06=HYDRAULIC, 07=PNEUMATIC, 08=CONVEYOR, 09=STORAGE, 10=QUALITY
- 11=SAFETY, 12=ENVIRONMENTAL, 13=IT_INFRASTRUCTURE, 14=FACILITY, 15=SUPPORT

### 2. asset_classes (~120개 세부분류)
```
code: '01.001'~'15.NNN' (PK)
category_code: FK → categories.code
name_en, name_ko, name_ta
expected_qty: int
```

### 3. assets (506개 메인 테이블)
```
id: uuid (PK)
asset_class_code: FK
machine_asset_code: '01.001.001' (unique)
machine_asset_number: 'DCMI-UTL-PSF-01' (unique, 물리 태그)
name_en, name_ko, name_ta
model, make, year_of_manufacture
location, status (active|idle|maintenance|sold|scrapped)
qr_payload, photos[], remark, extra (jsonb)
created_at, updated_at, created_by, updated_by
```

### 4. asset_audit (변경 이력)
```
Trigger-based logging:
- asset_id, changed_at, changed_by, action
- diff (변경 내용)
```

## UI/UX 설계

### 페이지 구조
1. **자산 목록 페이지** (필터, 검색, 페이지네이션)
2. **자산 상세 페이지** (정보 + QR 코드 + 이력)
3. **Excel Import 마법사** (3단계: preview → validate → execute)
4. **통계 대시보드** (자산 현황 요약)

### 현장 입력 폼 (간편 모드)
- QR 스캔 후 위치/상태만 수정 (빠른 입력)
- 영어/타밀어 선택지 제공

## Excel Import 전략

**3단계 프로세스:**
1. **검증:** 모든 행 검사 (필수 필드, 형식, 고유성)
2. **미리보기:** 첫 20행 + 오류 요약
3. **실행:** 100행씩 chunk → Supabase RPC bulk insert → audit 기록

**필수 필드:** asset_class_code, machine_asset_code, machine_asset_number, name_en, status  
**선택 필드:** serial_no, name_ta, model, make, year_of_manufacture, location, remark

## API 엔드포인트 (25개)

**조회 (5개):** GET /api/assets, /[id], /categories, /[id]/audit-log, /locations  
**CRUD (4개):** POST /api/assets, PUT /[id], DELETE /[id], POST /bulk-update  
**Import (5개):** POST /import/preview, /execute, GET /import/batches, [batch_id], [batch_id]/items  
**Export & Stats (2개):** GET /export/excel, /statistics  
**QR (2개):** GET /[id]/qr, POST /[id]/qr/regenerate  
**나머지 (5개):** Phase 2.5로 이월

## 후속 모듈 연계

- **BM (Breakdown Maintenance):** assets.id FK
- **PM (Preventive Maintenance):** assets.id FK
- **Disposal Management:** assets.id FK
- **Parts Inventory:** asset_class_code FK

## 배포 체크리스트

- [ ] DB 마이그레이션 완료
- [ ] 506개 기존 자산 import 완료
- [ ] API 16개 (MVP) 완료 및 테스트
- [ ] UI 3개 페이지 완료 및 반응형 테스트
- [ ] 모바일 최적화
- [ ] RLS 정책 검증
- [ ] 현장 테스트 (QR 스캔)
- [ ] Staging 배포
- [ ] 프로덕션 배포
