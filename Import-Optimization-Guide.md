# Import Optimization Guide
**DSC FMS Asset Master — 임포트 최적화 가이드**
Source: Asset-Data-Analysis-Report.xlsx + Supabase DB 분석 (2026-05-27)

---

## 1. 임포트 사전 준비

### 1-1. 파일 포맷 요구사항

| 항목 | 사양 |
|------|------|
| 포맷 | XLSX (Excel 2007+) |
| 최대 파일 크기 | 5 MB |
| 인코딩 | UTF-8 (BOM 없음) |
| 시트명 | 첫 번째 시트 사용 (이름 무관) |
| 헤더 행 | 1행 (컬럼명 필수) |
| 데이터 시작 행 | 2행 |

### 1-2. 필수 컬럼

| 컬럼명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `machine_asset_number` | TEXT | 자산 고유 식별번호 (DB PK 기준) | DCMI-FRM-CRT-01 |
| `name_en` | TEXT | 자산명 (영문) | ARC WELD ROBOT - FIXED |
| `asset_class_code` | TEXT | 자산 분류 코드 | 04.001 |
| `status` | TEXT | 자산 상태 (허용값 목록 참조) | active |
| `location` | TEXT | 위치 | PS7I FL |

### 1-3. 선택 컬럼

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `name_ta` | TEXT | 자산명 (Tamil) | 현재 DB 0.2% 입력됨 |
| `model` | TEXT | 모델명 | DB 72.1% 완성 |
| `make` | TEXT | 제조사 | DB 18.8% 완성 — 보완 필요 |
| `serial_no` | TEXT | 시리얼번호 | DB 87.9% 완성 |
| `remark` | TEXT | 비고 | |

### 1-4. 허용값 체크

**status 허용값:**
- `active` — 정상 가동
- `idle` — 유휴 (비가동)
- `maintenance` — 정비 중

**asset_class_code 허용값 (84개):**
- 01.001 ~ 01.xxx: UTILITY (유틸리티)
- 02.xxx: PROCESS (프로세스)
- 03.xxx: PRESS (프레스)
- 04.xxx: ROBOT (로봇)
- 05.xxx: WELDING (용접기)
- 06.xxx: ASSEMBLY (조립기계)
- 07.xxx: ETC
- 08.xxx: LASER (레이저)
- 09.xxx: JIG (지그)
- 10.xxx: MOULD (금형)
- 11/11A: IDLE MACHINE (유휴기계)
- 12: FIXED ASSET SALES (매각자산)
- 13: FIXED ASSET DISPOSAL (폐기자산)
- 14: CNC
- 15: PALLET (팔레트)

**범주 외 값 입력 시 임포트 거부 (validation error 반환)**

---

## 2. 배치 처리 워크플로우

임포트는 **5단계 프로세스**로 진행한다. 한 번에 전체를 직접 INSERT하지 않는다.

### 단계 1: 파일 업로드 + 검증 미리보기

```http
POST /api/assets/import/preview
Content-Type: multipart/form-data

파라미터:
  file: <XLSX 파일>
  dry_run: true (검증만, DB 저장 안 함)
```

응답 예시:
```json
{
  "total_rows": 506,
  "valid_rows": 498,
  "error_rows": 8,
  "errors": [
    {"row": 12, "field": "status", "value": "Active", "message": "허용값 아님. 'active' 사용"},
    {"row": 34, "field": "asset_class_code", "value": "04.999", "message": "존재하지 않는 클래스 코드"}
  ],
  "preview": [
    {"machine_asset_number": "DCMI-NEW-001", "name_en": "...", "status": "active"}
  ]
}
```

### 단계 2: 미리보기 검토 및 파일 수정

- error_rows > 0이면 Excel 파일 수정 후 단계 1 재실행
- valid_rows 확인 후 진행 여부 결정
- 중복 machine_asset_number 경고 주의 (UPDATE vs INSERT 선택)

### 단계 3: 배치 실행

```http
POST /api/assets/import/execute
Content-Type: multipart/form-data

파라미터:
  file: <XLSX 파일>
  batch_size: 100         (청크 단위, 기본값 100 권장)
  on_duplicate: skip      (skip | update | error)
  dry_run: false
```

**batch_size 100 권장 이유:**
- 네트워크 타임아웃 리스크 최소화
- 실패 시 해당 청크만 재실행 가능
- Supabase RLS + 트리거 처리 부하 분산

응답 예시:
```json
{
  "batch_id": "batch_20260527_001",
  "status": "processing",
  "total_batches": 6,
  "message": "백그라운드 처리 시작. /api/assets/import/batches/batch_20260527_001 로 상태 확인"
}
```

### 단계 4: 진행 상황 모니터링

```http
GET /api/assets/import/batches
```

응답:
```json
{
  "batches": [
    {
      "batch_id": "batch_20260527_001",
      "status": "completed",
      "total": 100,
      "success": 98,
      "failed": 2,
      "started_at": "2026-05-27T10:00:00Z",
      "completed_at": "2026-05-27T10:00:45Z"
    }
  ]
}
```

### 단계 5: 오류 확인 및 재실행

```http
GET /api/assets/import/batches/:batchId
```

오류 상세 응답:
```json
{
  "batch_id": "batch_20260527_001",
  "errors": [
    {
      "row": 45,
      "machine_asset_number": "DCMI-FRM-001",
      "error": "duplicate key value violates unique constraint",
      "suggestion": "on_duplicate=update 로 재실행하거나 해당 행 제거 후 재임포트"
    }
  ]
}
```

재실행: 실패 레코드만 별도 Excel로 추출 → 단계 1부터 재실행

---

## 3. 최적화 체크리스트

### 임포트 전 (사전 준비)

- [ ] **Duplicate-Removal-Strategy.md Stage 1~2 실행 완료** — 중복 제거 후 임포트해야 신규 데이터 오염 방지
- [ ] **카테고리/asset_class 마스터 확정** — Asset-Data-Analysis-Report.xlsx Sheet2 [2] 카테고리 분석 참조
- [ ] **위치(location) 표준화** — Sheet2 [4] 위치별 분석 참조, 동일 장소 다른 표기 통일 (예: "COMPRESSOR ROOM - 01" vs "COMPRESSOR ROOM-01")
- [ ] **기존 데이터 백업** — Supabase 대시보드 → Database → Backup
- [ ] **임포트 담당자 확정** — 1명 전담 (동시 임포트 충돌 방지)

### 임포트 중 (실행 시)

- [ ] **배치 크기 100으로 설정** — batch_size=100 (기본값 유지)
- [ ] **행별 폴백 로직 활성화** — on_duplicate=skip 으로 시작, 개별 실패 시 skip 후 계속 진행
- [ ] **비업무 시간 실행** — 생산 라인 가동 중 대량 임포트 금지 (DB 부하)
- [ ] **진행 모니터링** — GET /api/assets/import/batches 30초 간격 확인

### 임포트 후 (검증)

- [ ] **총 레코드 수 검증** — 임포트 전후 COUNT(*) 비교
- [ ] **status 분포 재확인** — active/idle/maintenance 비율 이상 없는지 확인
- [ ] **랜덤 샘플 10건 현장 대조** — 임포트 데이터와 실물 일치 확인
- [ ] **성공/실패 로그 보관** — batch_id별 결과 저장 (audit trail)

---

## 4. 현 DB 데이터 품질 참조 (임포트 기준선)

Asset-Data-Analysis-Report.xlsx Sheet2 [6] 기준:

| 필드 | 현재 완성도 | 임포트 시 목표 |
|------|------------|----------------|
| machine_asset_number | 100.0% | 100% 필수 |
| name_en | 100.0% | 100% 필수 |
| status | 100.0% | 100% 필수 |
| serial_no | 87.9% | 90% 이상 목표 |
| model | 72.1% | 80% 이상 목표 |
| location | 69.4% | 85% 이상 목표 |
| make | 18.8% | 50% 이상 목표 (현 취약 필드) |
| name_ta | 0.2% | 선택 (분기 목표) |

**make 필드 특이사항:** 현 2,176건 중 1,768건(81.2%) 미입력 — 임포트 시 우선 보완 대상

---

## 5. 대량 임포트 성능 참고

| 레코드 수 | 예상 소요 시간 | 배치 수 (100/배치) |
|-----------|--------------|-------------------|
| 100건 | ~5초 | 1 |
| 506건 | ~25초 | 6 |
| 1,000건 | ~50초 | 10 |
| 2,000건 | ~100초 | 20 |

*Supabase Free/Pro Tier 기준. 네트워크 지연 포함 추정값.*

---

**Source:** Supabase `assets` table — 2,176 records (2026-05-27 기준)  
**Related files:**
- `/home/jeepney/.openclaw/workspace-dev/Asset-Data-Analysis-Report.xlsx`
- `/home/jeepney/.openclaw/workspace-dev/Duplicate-Removal-Strategy.md`

**Prepared by:** DSC FMS Data Analysis Agent  
**Contact:** asdf1390a@gmail.com
