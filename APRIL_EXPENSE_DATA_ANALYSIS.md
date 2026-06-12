# 4월 경비 기초 자료 분석 리포트 (2026-06-12)

## 헤드라인
**4월 집계 가능 총액: Rs 1,420,951 (5개 파일)**
- **지출 합계 (SCRAP 제외): Rs 1,344,351**
- 분석 대상: 7개 파일, 221개 거래행
- 정규화 필요: 5개 파일 (needs_normalization)
- 입수 준비됨: 1개 파일 (ready)
- 설계 필요: 1개 파일 (needs_redesign)

---

## 파일별 구조 요약

| # | 파일명 | expense_code | 4월 시트 | 헤더 | 핵심 컬럼 |
|---|--------|-------------|---------|-----|---------|
| 1 | MAINTENANCE_SCRAP_REPORT | — | MAR-2025 | Row 1 | DATE, CATEGORY, QTY(Kg), PRICE, TOTAL_AMOUNT, SUPPLIER |
| 2 | TIP_COIL_GREASE_CONSUMPTION | — | APR-2025 | Row 1 | CATEGORY, SCANNED_DOCS, APPROVAL_DOC (금액 없음) |
| 3 | 1.4 R&M FABRICATION | 1.4 | APR-2025 | Row 2 | DATE, CATEGORY, SPEC, QTY, PRICE, TOTAL_AMOUNT, SUPPLIER |
| 4 | 1.5 R&M OTHER_TEAM | 1.5 | APR-2025 | Row 1 | DATE, CATEGORY, SUB_CAT, SPEC, QTY, PRICE, TOTAL_AMOUNT, SUPPLIER |
| 5 | 1.6 R&M FACTORY_MAINT | 1.6 | APR-2025 | Row 1 | DATE, AREA, CATEGORY, SUB_CAT, SPEC, QTY, PRICE, TOTAL_AMOUNT, SUPPLIER |
| 6 | 1.7 R&M STP | 1.7 | APR-2025 | Row 1 | DATE, AREA, CATEGORY, SPEC, QTY, PRICE, TOTAL_AMOUNT, SUPPLIER |
| 7 | 2.1 CONSUMABLE_ITEMS_STORES | 2.1 | APR-2025 | Row 1 | DATE, CATEGORY, AREA, SPEC, QTY, PRICE, TOTAL_AMOUNT, SUPPLIER |

---

## 4월 데이터 통계

| 파일 | expense_code | 총행 | 실거래행 | 4월금액(Rs) | 날짜범위 | 비고 |
|------|-------------|------|---------|-----------|---------|------|
| SCRAP | — | 10 | 2 | 76,600 | 22~30.04 | 스크랩 수익 (지출 아님) |
| TIP/COIL/GREASE | — | 6 | 0 | **N/A** | N/A | 금액 컬럼 없음 |
| 1.4 FABRICATION | 1.4 | 66 | 25 | 230,917 | 01~17.04 | JAN 시트에 2026년 날짜 혼재 |
| 1.5 OTHER_TEAM | 1.5 | 51 | 22 | 331,252 | 07~30.04 | WALL FAN Rs 224,400 날짜 누락 |
| 1.6 FACTORY_MAINT | 1.6 | 33 | 7 | 317,749 | 10~30.04 | BIN 126,900 날짜 31.03 오기입 의심 |
| 1.7 STP | 1.7 | 4 | 3 | 27,100 | 28.04 만 | 3건 날짜 누락 |
| 2.1 CONSUMABLE | 2.1 | 51 | 38 | 437,333 | 01~04.04 | 데이터 정합성 양호 |
| **합계** | | **221** | **97** | **1,420,951** | | SCRAP은 수익분리 필요 |

---

## Expense Master 코드 매핑

| expense_code | 파일 | amount | date | vendor |
|-------------|------|--------|------|--------|
| 1.4 | FABRICATION | col 9 (TOTAL_AMOUNT) | col 1 (DATE) | col 10 (SUPPLIER) |
| 1.5 | OTHER_TEAM | col 9 (TOTAL_AMOUNT) | col 1 (DATE) | col 10 (SUPPLIER) |
| 1.6 | FACTORY_MAINT | col 10 (TOTAL_AMOUNT) | col 1 (DATE) | col 11 (SUPPLIER) |
| 1.7 | STP | col 8 (TOTAL_AMOUNT) | col 1 (DATE) | col 9 (SUPPLIER) |
| 2.1 | CONSUMABLE | col 10 (TOTAL_AMOUNT) | col 1 (DATE) | col 11 (SUPPLIER) |

---

## 데이터 품질 이슈

### 높음 (Critical)
1. **FABRICATION 연도 오류** — JAN 시트에 "2026년 날짜" 혼재 (2025로 정정 필요)
2. **OTHER_TEAM 날짜 누락** — WALL FAN Rs 224,400 (전체의 68%) 날짜 null
3. **FACTORY_MAINT 날짜 경계** — BIN Rs 126,900 날짜 "31.03" (3월 데이터인데 4월 시트에 위치)
4. **STP 날짜 대부분 누락** — 4건 중 1건만 날짜 있음

### 중간 (Medium)
1. **SCRAP 시트명 오류** — "MAR-2025"로 표기 (3월 탭명 그대로 복사)
2. **FABRICATION 헤더 위치** — Row 2 (다른 파일은 Row 1)
3. **TIP/COIL/GREASE 금액 부재** — 전체 파일에 금액 없음

### 낮음 (Low)
1. **빈 템플릿 행** — 금액 0 플레이스홀더 (전체의 55~80%)
2. **2.1 MAIN_CATEGORY 중복** — col 2, col 4 모두 동일명

---

## db/52 입수 시 필요 정규화 단계

| # | 단계 | 대상 | 방법 | 난이도 |
|---|-----|------|------|--------|
| 1 | 빈 행 제거 | 전체 | TOTAL_AMOUNT=0 행 삭제 | 자동 |
| 2 | 날짜 형식 통일 | 전체 | DD.MM.YYYY → YYYY-MM-DD | 자동 |
| 3 | 연도 오류 수정 | 1.4 (FABRICATION) | 2026 → 2025 | 수동 (검증 후) |
| 4 | 날짜 누락 처리 | 1.5, 1.6, 1.7 | 시트 월말로 대체 또는 flag | 룰 합의 필요 |
| 5 | SCRAP 분리 | SCRAP | 지출 테이블 분리 vs revenue_code 추가 | 설계 결정 |
| 6 | TIP/COIL 용도 | TIP/COIL | consumption_log vs expense 분류 | 사용자 확인 |
| 7 | expense_code 추가 | 1.4~2.1 | expense_code 컬럼 값 할당 | 자동 |
| 8 | FACTORY_MAINT 31.03 이월 | 1.6 | 3월 데이터로 이월 또는 4월로 확정 | 수동 (확인) |

---

## 입수 준비도 (Readiness Status)

| 파일 | 상태 | 사유 | 다음액션 |
|------|------|------|---------|
| **1.4 FABRICATION** | 🔴 needs_normalization | 연도 오류 + 헤더 오프셋 | 2026→2025 정정 후 입수 |
| **1.5 OTHER_TEAM** | 🔴 needs_normalization | 주요 거래(Rs 224,400) 날짜 누락 | 영수증 확인 후 날짜 입력 |
| **1.6 FACTORY_MAINT** | 🔴 needs_normalization | 날짜 경계 오류 (31.03) | 3월 이월 또는 4월 확정 |
| **1.7 STP** | 🔴 needs_normalization | 날짜 대부분 누락 (3/4 건) | 시트 월말(30.04) 대체 또는 flag |
| **2.1 CONSUMABLE** | 🟢 ready | 정합성 양호 | 즉시 입수 가능 |
| **SCRAP REPORT** | 🟡 needs_normalization | 수익/지출 분류 결정 필요 | 설계 검토 (revenue vs expense) |
| **TIP/COIL/GREASE** | 🔴 needs_redesign | 금액 없음 (문서 추적용) | 테이블 구조 재설계 필요 |

---

## 요약 통계

| 항목 | 수치 |
|------|------|
| **분석 기간** | 2026년 4월 |
| **파일 수** | 7개 |
| **총 거래행** | 221행 |
| **실거래행** | 97행 |
| **총 금액** | Rs 1,420,951 |
| **지출 (SCRAP 제외)** | Rs 1,344,351 |
| **Ready 상태** | 1개 파일 (2.1) |
| **Needs Normalization** | 5개 파일 (1.4, 1.5, 1.6, 1.7, SCRAP) |
| **Needs Redesign** | 1개 파일 (TIP/COIL) |

---

## 권고사항

1. **즉시 입수 가능** (Week 1)
   - 2.1 CONSUMABLE (Rs 437,333) — 자동화 파이프라인 테스트용

2. **수동 정정 후 입수** (Week 1-2)
   - 1.4, 1.5, 1.6, 1.7 — 각 파일별 담당자 정정 (기술팀 지원)
   - SCRAP — 수익/지출 구분 후 (설계 승인)

3. **재설계 필요** (Week 2)
   - TIP/COIL/GREASE — 금액 없으므로 consumption_log 테이블 신규 생성 여부 검토

---

**분석 날짜:** 2026-06-12 18:30 KST  
**분석가:** Data Analyst Agent  
**원본 파일:** `/home/jeepney/.openclaw-dev/media/inbound/` (7개 파일)  
**다음 단계:** Phase 2 API 배포 후 자동화 입수 파이프라인 시작
