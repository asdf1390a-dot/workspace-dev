---
name: Asset Master Excel Import 로직 명세
description: 496개기존자산마이그레이션, 3단계검증→미리보기→실행, 오류격리처리
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_IMPORT_GUIDE.md
---

# Asset Master — Excel Import 로직 명세

**버전:** 1.0  
**상태:** 설계 완료 (Web-Builder 구현 대기)  
**범위:** 496개 기존 자산을 Excel → Supabase로 일괄 가져오기

## 개요

기존 Excel Master (REV 01, 2025-01-09)에서 496개 자산 데이터를 Supabase Postgres로 일괄 가져오는 프로세스. 3단계 방식: **검증 → 미리보기 → 실행**.

### 핵심 원칙
- **단방향:** Excel → DB (되돌리기 불가, 실행 전 반드시 검증)
- **원본 보존:** 원본 Excel은 수정하지 않음
- **감사 추적:** 모든 import 이벤트를 asset_audit 테이블에 기록
- **오류 격리:** 한 행의 오류가 전체 import을 멈추지 않음

## Phase 1: 파일 준비 및 검증

### 입력 파일 형식

**CSV (권장):**
```
asset_class_code,machine_asset_code,machine_asset_number,serial_no,name_en,name_ta,model,make,year_of_manufacture,location,status,remark
01.001,01.001.001,DCMI-UTL-PSF-01,,SUB STATION,மின் நிலையம்,SL-630,ABB,2015,Line-1,active,Main power
```

**Excel (xls/xlsx):**
- 시트명: "Asset Master" 또는 "Assets"
- 첫 줄: 헤더
- 데이터 시작: 2번줄부터
- 최대 행: 600개

### 필수 필드

| 필드 | 형식 | 규칙 | 예시 |
|------|------|------|------|
| `asset_class_code` | text | CC.CCC 형식 | 01.001 |
| `machine_asset_code` | text | CC.CCC.NNN 형식, 고유 | 01.001.001 |
| `machine_asset_number` | text | DCMI-prefix 고유 | DCMI-UTL-PSF-01 |
| `name_en` | text | 3~200자 | SUB STATION |
| `status` | enum | active/idle/maintenance/sold/scrapped | active |

### 선택 필드

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `serial_no` | NULL | 선택사항 |
| `name_ta` | NULL | 타밀어 명칭 |
| `model` | NULL | 모델명 |
| `make` | NULL | 제조사 |
| `year_of_manufacture` | NULL | 1980~2030 범위 |
| `location` | NULL | 위치 |
| `remark` | NULL | 비고 |

## Phase 2: 검증 로직

### 행 수준 검증

**필수 필드 검사:**
- asset_class_code: 정규식 `^\d{2}\.\d{3}$`
- machine_asset_code: `^\d{2}\.\d{3}\.\d{3}[A-Z]?$`
- machine_asset_number: `^DCMI-[A-Z]{3}-[A-Z]{3}-\d{2}$`
- name_en: 3~200자
- status: [active, idle, maintenance, sold, scrapped]

**DB 검증:**
- asset_class_code 존재 여부 (asset_classes 테이블)
- machine_asset_code 고유성 확인
- machine_asset_number 고유성 확인

**선택 필드 검증:**
- year_of_manufacture: 1980~2030 정수
- name_ta, model, location, remark: 최대 길이 확인

**오류 수집:**
- 각 행마다 오류 배열 수집
- 한 행의 오류가 다른 행에 영향 없음

## Phase 3: 미리보기 (POST /api/assets/import/preview)

**요청:**
```json
{
  "file": "<multipart file>",
  "preview_rows": 20
}
```

**응답:**
```json
{
  "batch_id": "uuid",
  "file_name": "assets-master.xlsx",
  "total_rows": 496,
  "valid_rows": 490,
  "invalid_rows": 6,
  "preview": [
    {"row": 1, "machine_asset_number": "DCMI-UTL-PSF-01", "status": "valid"},
    {"row": 2, "machine_asset_number": "DCMI-UTL-PSF-02", "status": "valid"},
    ...
  ],
  "errors": [
    {"row": 10, "field": "asset_class_code", "error": "Format CC.CCC required"},
    ...
  ]
}
```

**주요 로직:**
1. 파일 파싱 (xlsx 라이브러리)
2. 각 행 검증 (위의 검증 규칙)
3. asset_import_batches 테이블에 batch 저장 (status=pending)
4. asset_import_items 테이블에 각 행 저장 (validation_errors 컬럼)
5. 첫 20행 미리보기 + 오류 요약 반환

## Phase 4: 실행 (POST /api/assets/import/execute)

**요청:**
```json
{
  "batch_id": "uuid",
  "confirm": true
}
```

**응답:**
```json
{
  "batch_id": "uuid",
  "status": "processing",
  "total_rows": 496,
  "inserted": 490,
  "updated": 0,
  "failed": 6,
  "import_result": {
    "summary": "496 rows processed: 490 inserted, 6 failed",
    "failed_items": [...]
  }
}
```

**주요 로직:**
1. preview 단계에서 저장된 items 조회 (status=pending)
2. 100행씩 chunk 분할
3. Supabase RPC `bulk_insert_assets` 호출 (트랜잭션)
4. 각 chunk 후 items.status 업데이트 (inserted/failed)
5. asset_audit 테이블에 audit 기록
6. 최종 summary 반환

**부분실패 처리:**
- 한 행 오류는 다른 행에 영향 없음
- asset_import_items.validation_errors에 상세 오류 저장
- 사용자가 선택적 재시도 가능

## 성능 최적화

**대량 처리:**
- Supabase RPC로 bulk insert 위임 (단일 트랜잭션)
- JavaScript 검증은 items 저장 후 실행 (클라이언트 재연결 안정)

**메모리:**
- 에러는 asset_import_items.validation_errors에만 저장
- import_result는 summary만 저장

**폴링:**
- 클라이언트는 GET /api/assets/import/batches/:id로 주기적 조회
- status = completed 시 완료
