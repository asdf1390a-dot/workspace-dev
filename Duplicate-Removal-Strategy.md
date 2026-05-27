# Duplicate Removal Strategy
**DSC FMS Asset Master — 중복 제거 전략**
Source: Supabase `assets` table (2,176 records, 2026-05-27)

---

## 1. 중복 정의

DB 분석 결과 `assets` 테이블의 `machine_asset_number`는 전 2,176건이 고유값이다.
즉, "중복"은 PK 중복이 아니라 **실질적 동일 자산이 다른 식별번호로 중복 등록된 경우**다.

### 1-1. Pattern-Exact (고신뢰도: 80-100점)

- 조건: `name_en` (대소문자 무시) + `asset_class_code` 동일
- 발견: 241개 그룹, 806개 중복 레코드
- 해석: 같은 종류 장비가 여러 호기(호기별 serial 구분 없이) 동일 명칭으로 등록된 경우
- 예시: "ARC WELD ROBOT - FIXED" [04.001] — 129건 등록, 각 호기별 `machine_asset_number` 상이

### 1-2. Serial-Exact (중신뢰도: 50-79점)

- 조건: `serial_no` + `asset_class_code` 동일 (단, serial_no가 실제 의미 있는 값인 경우)
- 발견: 27개 그룹, 200개 중복 레코드
- 해석: 동일 시리얼번호가 다수 레코드에 복사되어 입력된 경우 (데이터 입력 오류)
- 주의: DCMI-PWS-01 (MANUAL WELDING, 38건), DCMI-FRM-CNR-13 (EXHAUST DUCT, 29건) — 시리얼이 실제로는 그룹 식별자로 잘못 사용됨

### 1-3. Fuzzy-Match (저신뢰도: 30-49점)

- 조건: `name_en` 유사도 Levenshtein distance ≤ 3 + 같은 카테고리
- 발견: 현 DB에서는 별도 스크립트로 추출 필요 (자동 분류 미완)
- 해석: 오타, 약어 차이로 분리 등록된 자산 (예: "PRESS MACHINE" vs "PRESS MACHNE")

---

## 2. 3단계 제거 알고리즘

> 실행 전 반드시 `pg_dump` 또는 Supabase 대시보드에서 전체 백업 수행.

### Stage 1: Pattern-Exact 중복 — 즉시 검토 대상

이 그룹은 **같은 이름의 여러 호기**가 정당하게 별도 등록된 경우가 많다.
(예: 동일 라인 로봇 129대 = 모두 실물이 다른 개별 자산)

실제 삭제 전 확인 기준:
- `serial_no`가 서로 다르면 → 개별 자산 (삭제 금지)
- `location`이 서로 다르면 → 개별 자산 (삭제 금지)
- `serial_no`가 동일하거나 NULL이고 `location`도 동일이면 → 중복 의심 (삭제 후보)

```sql
-- Stage 1: 진짜 Pattern-Exact 중복 후보 조회 (serial NULL + 같은 location)
SELECT
  machine_asset_number,
  name_en,
  asset_class_code,
  serial_no,
  location,
  status,
  created_at,
  ROW_NUMBER() OVER (
    PARTITION BY UPPER(TRIM(name_en)), asset_class_code, location
    ORDER BY created_at ASC
  ) AS rn
FROM assets
WHERE serial_no IS NULL OR TRIM(serial_no) = ''
ORDER BY name_en, asset_class_code, location, created_at;

-- Stage 1: 삭제 실행 (rn > 1, serial NULL + 동일 location)
DELETE FROM assets
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY UPPER(TRIM(name_en)), asset_class_code, location
        ORDER BY created_at ASC
      ) AS rn
    FROM assets
    WHERE (serial_no IS NULL OR TRIM(serial_no) = '')
  ) t
  WHERE rn > 1
);
```

### Stage 2: Serial-Exact 중복 — 수동 검증 후 병합/삭제

시리얼이 같은 레코드는 **실물 확인 필수**. 단순 DB 삭제로 처리 금지.

```sql
-- Stage 2: 동일 serial_no 그룹 조회 (비어있지 않은 serial 기준)
SELECT
  serial_no,
  asset_class_code,
  COUNT(*) AS cnt,
  ARRAY_AGG(machine_asset_number ORDER BY created_at) AS asset_numbers,
  ARRAY_AGG(location) AS locations
FROM assets
WHERE serial_no IS NOT NULL
  AND TRIM(serial_no) != ''
  AND TRIM(serial_no) NOT LIKE 'DCMI%'  -- 내부 코드로 serial 오용 제외
GROUP BY serial_no, asset_class_code
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- Stage 2: 검증 후 확인된 중복 병합 (references 업데이트 후 삭제)
-- bm_events 외래키 확인
SELECT COUNT(*) FROM bm_events WHERE asset_id = '<삭제_대상_id>';

-- 참조 없으면 삭제
DELETE FROM assets WHERE id = '<삭제_대상_id>';

-- 참조 있으면 업데이트 후 삭제
UPDATE bm_events SET asset_id = '<유지할_id>' WHERE asset_id = '<삭제_대상_id>';
DELETE FROM assets WHERE id = '<삭제_대상_id>';
```

### Stage 3: Fuzzy-Match 중복 — 시리얼 기반 확정

```sql
-- Stage 3: 유사 이름 그룹 탐색 (PostgreSQL pg_trgm 활용)
-- 사전 조건: CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT
  a1.machine_asset_number AS asset1,
  a1.name_en AS name1,
  a2.machine_asset_number AS asset2,
  a2.name_en AS name2,
  similarity(a1.name_en, a2.name_en) AS sim_score,
  a1.asset_class_code
FROM assets a1
JOIN assets a2
  ON a1.id < a2.id
  AND a1.asset_class_code = a2.asset_class_code
  AND similarity(a1.name_en, a2.name_en) > 0.85
ORDER BY sim_score DESC
LIMIT 50;
```

---

## 3. 실행 순서 및 SQL 체크리스트

```
[사전 작업]
□ Supabase 대시보드 → Project Settings → Database → Backup 생성
□ 운영 시간 외 (예: 자정 이후) 실행
□ BM 담당자와 실행 일정 공유

[Stage 1 실행]
□ 조회 SQL 실행 → 결과 Excel 저장
□ 팀 검토: serial NULL + 동일 location → 실물 확인
□ 삭제 승인 → DELETE 실행
□ 삭제 후 총 레코드 수 재확인

[Stage 2 실행]  
□ 조회 SQL 실행 → 시리얼 중복 그룹 목록 생성
□ 각 그룹 실물 확인 (현장 담당자)
□ bm_events 참조 확인 → UPDATE 선행
□ DELETE 실행

[Stage 3 실행]
□ pg_trgm 확장 활성화 확인
□ 유사 이름 결과 → 현장 확인 (오타 교정 or 삭제)
□ 최종 결과 확인
```

---

## 4. 우선순위 권장사항

| 우선순위 | 대상 | 건수 | 작업 | 기한 |
|---------|------|------|------|------|
| 긴급 | Pattern-exact 중복 (serial NULL + 동일 위치) | 806건 | Stage 1 쿼리로 추려 검토 후 삭제 | 즉시 |
| 1주 | Serial-exact 중복 (DCMI 코드 오용) | 200건 | 수동 검증 + 병합/삭제 | 1주 이내 |
| 2주 | Fuzzy-match 유사명 자산 | 미정량 | pg_trgm 탐색 + 현장 확인 | 2주 이내 |
| 분기 | 전체 serial_no 표준화 (자체 코드 오용 근절) | 전체 | 입력 가이드라인 수정 | 분기별 |

---

**Source:** Supabase `assets` table — 2,176 records (2026-05-27 기준)
**Prepared by:** DSC FMS Data Analysis Agent
**Contact:** asdf1390a@gmail.com
