# MANNUR 경비(Expense) 모듈 규격서

**작성일:** 2026-06-13 | **버전:** 1.0 | **상태:** 설계 완료

---

## 0. 시스템 개요

경비 시스템은 **고정 20개 파일 세트**로 월간 R&M(유지보수), 소모품, 부자재, 전력 등을 추적한다.
기존 FMS Asset Master(DCMI 350+ 설비)와 **직접 조인**되며, 거래의 DCMI 코드로 자산별 수리이력·비용을 Asset Master 하위 탭으로 관리한다.

**3계통 통합 허브:** PPC PLAN (생산성 ↔ 경비 ↔ BOM)

---

## 1. 파일 세트 & 코드 계층 (고정 20파일)

### R&M 대장 (10개)
| 코드 | 분류 | 설명 |
|------|------|------|
| 1.1 | MAINT | 유지보수 - 설비정지 |
| 1.2 | JIG | 지그/클램프 |
| 1.3 | MOULD | 금형 |
| 1.4 | FABRICATION | 제작/개조 |
| 1.5 | OTHER-TEAM | 타팀 협력 |
| 1.6 | FACTORY-MAINT | 공장 건물 보수 |
| 1.7 | STP | 환경·안전·품질 설비 |

**각 파일 구성:** 요약 시트(summary) + 12개 월별 시트(JAN~DEC)

### 소모품 (1개)
| 코드 | 설명 |
|------|------|
| 2.1 | STORES (각종 소모용품) |

### 부자재 (5개)
| 코드 | 항목 |
|------|------|
| 3.1 | CO2 |
| 3.2 | ARGON |
| 3.3 | NITROGEN |
| 3.4 | WELDING-COIL (1.2mm) |
| 3.5 | AP3-GREASE |

### 전력 및 기타 (1개)
| 코드 | 설명 |
|------|------|
| 4.1 | POWER (EB/DG/렌탈 비용 포함) |

### 집계/검증 (6개)
- YEARLY-EXPENSE (EXPENSE ANALYSIS)
- ACTUAL-VS-TALLY (월별×코드 검산)
- PLAN-VS-ACTUAL (1)~(4) (판매매출 연계)
- SUB-MATERIAL PURCHASE-VS-CONSUMPTION
- DAILY SUB-MATERIAL CONSUMPTION (쉬프트별 미터링)
- MAINTENANCE SCRAP REPORT

---

## 2. 고정 레이아웃

### R&M 대장 (1.x, 2.1) — 거래 명세
```
NO | DATE(DD.MM.YYYY) | MAIN CATEGORY | MACHINE CODE | ASSET DETAILS(DCMI-*)
| LINE | SPEC(maker) | SPEC(model) | MAIN-SPECIFIC | SUMMARY CAT
| PART-SPECIFIC | PROBLEM DETAILS | QTY | PRICE | TOTAL | SUPPLIER
```

**예:**
```
1 | 04.04.2025 | WELD SHOP BREAKDOWN | 04.001.019 | DCMI-FRM-CRT-19
| PS7I FLFSB LH | HYUNDAI | HI5a-S30 | ARC WELDING ROBOT | 1.1
| OP TOUCH PANEL | DISPLAY NOT COMING | 1 | 10000 | 10000 | DM MULTISYSTEMS
```

**ASSET DETAILS (DCMI-\*) 반드시 유지:** FMS Asset Master 조인 키

### 단순 대장 (3.x, 4.1) — 항목 기록
```
NO | DATE | MAIN CAT | WORK AREA | ITEM | QTY | PRICE | TOTAL | SUPPLIER | REMARKS
```

### 시트명 규칙 (월별)
- 패턴: **{MMM}-{YYYY}** (예: JAN-2025, MAR-2025)
- 한국어 괄호 무시 (오류 수정 권장)
  - 예: "JUNE-2025(2024년 5월)" → 영문월 기준으로 JUNE = 6월
  - 불일치 시 경고: `sheet_name_anomaly`

### 집계 시트 레이아웃

**EXPENSE ANALYSIS (월×코드 매트릭스)**
```
코드 | 1월_PLAN | 1월_ACTUAL | 1월_VERDICT | 1월_Δ% | 1월_ΔRs | 초과항목 | …
1.1  | xxx      | xxx        | EXCEEDED    | +15%   | +15000  | [ITEM1, ITEM2, ...]
```
- VERDICT: EXCEEDED | WITHIN PLAN
- 초과항목: 예정보다 많은 거래 항목명 리스트

**ACTUAL-VS-TALLY**
```
코드 | 1월_ACTUAL | 1월_TALLY | 1월_DIFF | 2월_ACTUAL | ...
1.1  | 100000     | 100000    | 0        | 105000
```
- DIFF = ACTUAL - TALLY (검산 차이, ≤1 Rs 허용)

**PLAN-VS-ACTUAL**
- SALES TURNOVER 행 포함
- 각 코드: PLAN | ACTUAL | plan-ratio | sales-ratio

**PURCHASE-VS-CONSUMPTION (부자재별)**
```
항목    | 기초재고 | 구입수량 | 단가 | 구입액 | 소비량 | 기말재고 | 매출대비율
CO2     | 17190    | 30420    | 10   | 304200 | 43453  | 4157     | 0.000593
```
- 검증: OPENING + PURCHASE - CONSUMPTION = CLOSING (±1)

**DAILY SUB-MATERIAL CONSUMPTION (일일 미터링)**
```
날짜        | 쉬프트# | START | UNLOADED | END | USED | 일일합계
2025-04-01  | 1       | 17190 | 0        | 16406 | 784  | 1524
```
- 연속성: day-N END = day-N+1 START

---

## 3. JSON 스키마

```json
{
  "expense": {
    "plant": "Mannur",
    "period": "2025-04",
    "ledgers": [
      {
        "code": "1.1",
        "category_ko": "수리및유지보수-유지",
        "category_en": "MAINT",
        "summary_amount": 1921051.57,
        "transactions": [
          {
            "date": "2025-04-04",
            "mainCategory": "WELD SHOP BREAKDOWN",
            "machineCode": "04.001.019",
            "assetCode": "DCMI-FRM-CRT-19",
            "line": "PS7I FLFSB LH",
            "maker": "HYUNDAI",
            "model": "HI5a-S30",
            "system": "ARC WELDING ROBOT",
            "part": "OP TOUCH PANEL",
            "problem": "DISPLAY NOT COMING",
            "qty": 1,
            "price": 10000,
            "amount": 10000,
            "supplier": "DM MULTISYSTEMS"
          }
        ],
        "plan": 1149033.42,
        "actual": 1921051.57,
        "tally": 1921050.72,
        "verdict": "EXCEEDED",
        "exceededItems": ["OP TOUCH PANEL", "..."]
      }
    ],
    "subMaterial": [
      {
        "item": "CO2",
        "purchaseQty": 30420,
        "unitCost": 10,
        "purchaseAmt": 304200,
        "openingStock": 17190,
        "closingStock": 4157,
        "consumption": 43453,
        "salesRatio": 0.000593,
        "daily": [
          {
            "date": "2025-04-01",
            "shifts": [
              {
                "no": 1,
                "start": 17190,
                "unloaded": 0,
                "end": 16406,
                "used": 784
              }
            ],
            "total": 1524
          }
        ]
      }
    ],
    "power": {
      "ebUnits": 99756,
      "windUnits": 183780,
      "solarUnits": 119754,
      "dgDiesel": {},
      "totalBill": 0
    },
    "scrap": [
      {
        "date": "2025-04-22",
        "detail": "COPPER WASTE",
        "qtyKg": 105,
        "price": 700,
        "amount": 73500,
        "approvalDoc": null
      }
    ],
    "planVsActual": [
      {
        "code": "1.1",
        "plan": 1149033.42,
        "actual": 1921051.57,
        "tally": 1921050.72,
        "verdict": "EXCEEDED",
        "exceededItems": ["..."],
        "salesRatio": 0.003744
      }
    ],
    "variance": {
      "vsPrevMonth": {}
    },
    "validation": {
      "passed": false,
      "checks": [
        {
          "rule": "tally_diff",
          "status": "warn",
          "detail": "1.1 Jan diff 20Rs",
          "affected": ["1.1"]
        }
      ]
    }
  }
}
```

---

## 4. 검증 규칙 (7가지)

| # | 규칙 | 조건 | 상태 | 사유 |
|---|------|------|------|------|
| 1 | **tally_diff** | \|ACTUAL−TALLY\| ≤ 1 Rs per code×month | fail | 검산 차이 초과 |
| 2 | **plan_exceeded** | ACTUAL>PLAN ⇒ verdict EXCEEDED 필수 + 초과항목 기재 | fail | 초과 항목 미기재 |
| 3 | **stock_identity** | OPENING+PURCHASE−CONSUMPTION = CLOSING (±1) per item | warn | 재고 불일치 |
| 4 | **meter_continuity** | day-N END = day-N+1 START per shift chain | warn | 미터 비연속 |
| 5 | **ledger_sum_match** | Σ monthly-ledger TOTAL = YEARLY ACTUAL (code, month) | fail | 월별 합계 불일치 |
| 6 | **purchase_link** | Σ 3.x ledger month = PURCHASE AMOUNT in analysis | fail | 부자재 합계 불일치 |
| 7 | **doc_presence** | scrap/tip rows 반드시 approval\|invoice doc 첨부 | warn | 증빙서류 미첨부 |

---

## 5. 적용 프롬프트

### 5-1. 메인 프롬프트 (월간 경비 처리)

```
You process the DSC Mannur technical/production-team EXPENSE workbooks for {YYYY-MM}.
The system is a FIXED 20-file set with a coded category hierarchy. Process ALL files
present for the month; emit "file_missing" warn for any absent category.

## FILE SET & CODES (fixed)
R&M ledgers: 1.1 MAINT, 1.2 JIG, 1.3 MOULD, 1.4 FABRICATION, 1.5 OTHER-TEAM,
 1.6 FACTORY-MAINT, 1.7 STP — each = summary sheet(s) + 12 monthly sheets.
Consumable: 2.1 STORES. Sub-material: 3.1 CO2, 3.2 ARGON, 3.3 NITROGEN,
 3.4 WELDING-COIL(1.2mm), 3.5 AP3-GREASE. Power: 4.1 POWER.
Aggregation/validation: YEARLY-EXPENSE (EXPENSE ANALYSIS / ACTUAL-VS-TALLY /
 PLAN-VS-ACTUAL (1)~(4) / TALLY DOWNLOAD), SUB-MATERIAL PURCHASE-VS-CONSUMPTION
 (SUM + per-item + BILL REFERENCE).
Operational: DAILY SUB-MATERIAL CONSUMPTION (shift meter readings),
 TIP-COIL-GREASE CONSUMPTION, MAINTENANCE SCRAP REPORT, EB-DG-RENTAL COST.

## FIXED LAYOUTS
- Monthly ledger (1.x & 2.1): NO|DATE(DD.MM.YYYY)|MAIN CATEGORY|MACHINE CODE|
 ASSET DETAILS(DCMI-*)|LINE|SPEC(maker)|SPEC(model)|MAIN-SPECIFIC|SUMMARY CAT|
 PART-SPECIFIC|PROBLEM DETAILS|QTY|PRICE|TOTAL|SUPPLIER. ASSET DETAILS joins to
 the FMS DCMI Asset Master — preserve the code verbatim.
- Simple ledger (3.x & 4.1): NO|DATE|MAIN CAT|WORK AREA|ITEM|QTY|PRICE|TOTAL|SUPPLIER|REMARKS.
- Month sheet naming: identify month by ENGLISH month abbrev in the sheet name
 (JAN..DEC); IGNORE the Korean text in parentheses (known typos: "20254",
 "JUNE-2025(2024년 5월)", "MAR-2025(2025년 4월)"). Mismatch → warn "sheet_name_anomaly".
- YEARLY: EXPENSE ANALYSIS = month×code matrix with rows PLAN/ACTUAL/verdict
 (EXCEEDED|WITHIN PLAN)/Δ%/ΔRs + exceeded-item list. ACTUAL-VS-TALLY = per code×month
 triplets ACTUAL/TALLY/DIFF. PLAN-VS-ACTUAL = SALES TURNOVER row + per code
 PLAN/ACTUAL/plan-ratio/sales-ratio.
- PURCHASE-VS-CONSUMPTION per item: PURCHASE(Qty/UnitCost/Amount/OpeningStock/
 ClosingStock) + CONSUMPTION(MonthlyUsage/MonthlyConsumption) + sales RATIO.
- DAILY meters: per date, 3 shifts of START/UNLOADED/END/used + daily TOTAL.

## TASKS
1) EXTRACT all files into the JSON schema (section 3). Read ONLY the {YYYY-MM}
 monthly sheets from ledgers; read the {YYYY-MM} column from yearly matrices.
2) NORMALIZE: dates to ISO (fix typos like "12.014.2025" → best-guess + warn);
 drop empty numbered rows (amount 0 & no detail); treat #DIV/0! as future-month null;
 trim supplier names (build canonical supplier list).
3) VALIDATE (ok/warn/fail):
 a tally_diff: |ACTUAL−TALLY| ≤ 1 Rs per code×month, else fail with amount
 b plan_exceeded: ACTUAL>PLAN ⇒ verdict EXCEEDED must exist + exceeded items listed
 c stock_identity: OPENING+PURCHASE−CONSUMPTION == CLOSING per item (±1)
 d meter_continuity: day-N END == day-N+1 START per shift chain
 e ledger_sum_match: Σ monthly-ledger TOTAL == YEARLY ACTUAL (code, month)
 f purchase_link: Σ 3.x ledger month == PURCHASE AMOUNT in analysis
 g doc_presence: scrap/tip rows missing approval|invoice doc → warn
4) COMPARE vs previous_month_json: per-code amount deltas; top 5 increases;
 attribute reasons ONLY from in-file evidence (PROBLEM DETAILS, exceeded-item list,
 purchase qty/price change split: ΔAmount = ΔQty×P0 + Q1×ΔP). No fabrication;
 else "사유 미기재 — 확인 필요".
5) OUTPUT only JSON + narrative_ko (≤5 sentences: 총경비, 매출대비율, Tally差,
 초과 코드, 주요 증감 사유).

## RULES
- Codes 1.1~4.1 must ALL appear in output (absent file → file_missing warn, keep node).
- Keep DCMI asset codes verbatim (join key to FMS Asset Master).
- Amounts in Rs, 2 decimals; ratios 6 decimals. Scrap = negative expense (revenue offset).
- REPORTING dataset; do not alter Tally download or bill softcopy values.
```

### 5-2. 트리 렌더링 프롬프트
```
Render the expense JSON as the FMS tree. Depth1 = {YYYY-MM}; Depth2 = [R&M(1.x),
Consumable(2.x), Sub-material(3.x), Power(4.x+EB/DG), Scrap, Validation&Analysis];
Depth3 = code nodes with transaction lists. Link every transaction's DCMI asset code
to the existing Asset Master module (render as hyperlink chip). Master branch holds
asset/category/supplier/unit-price masters. Badges: ok/warn/fail. Variance arrows per code.
```

### 5-3. 검증 단독 프롬프트
```
Run ONLY the 7-rule validation on this month's expense JSON:
[{rule,status,detail,affected}] for tally_diff, plan_exceeded, stock_identity,
meter_continuity, ledger_sum_match, purchase_link, doc_presence. fail/warn first.
```

---

## 6. 적용 순서 & 권장사항

1. **시트명 정규화 선행:** 월별 시트명을 {MMM}-{YYYY} 단일 패턴으로 통일 (기존 오타 잔존 시 프롬프트가 영문월 기준으로 흡수하지만, 원천 정리 권장).
2. **Asset Master 조인:** 경비 모듈을 신규 트리로 만들되, 거래의 DCMI 코드로 기존 FMS Asset Master·BM/PM 이력과 연결 → 설비별 TCO(총소유비용) 뷰 자동 생성.
3. **Tally 게이트:** 매월 마감 시 5-3 검증 먼저 → tally_diff fail이면 확정 차단.
4. **생산성 보고서와 교차:** 3.x 부자재 소비량 ↔️ 생산성 보고서의 생산량으로 원단위(생산량당 가스/코일 소비) KPI를 변량 노드에 추가.
5. **발견된 품질 이슈(수정 권장):**
   - 1.4 파일명 연도 오류 (2024→2025)
   - JUNE-2025 시트명 오기 (2024년 5월로 표기)
   - MAR- 오기 스크랩 4월 시트
   - GERASE 오타 (GREASE)

⚠️ **보고용만:** Tally ERP·청구서 소프트카피는 원천 증빙이므로 FMS에서 read-only 첨부로만 보관.

---

## 7. 월간 운영 사이클 (Ingestion Contract)

경비 파일은 연간 파일에 당월 시트가 채워지는 방식이므로, 매월 같은 파일(갱신본)을 다시 업로드한다.

```
① 당월 마감된 연간 파일 업로드 (1.1~4.1 + 집계 6파일)
② 프롬프트 5-1 실행 — 입력: 파일들 + previous_month_json(FMS DB 전월)
   → 각 파일에서 {YYYY-MM} 월별 시트/컬럼만 읽음
③ 검증 게이트(5-3): tally_diff 등 fail 시 확정 차단
④ FMS DB UPSERT — 키: (plant, period, code)
   ★ 같은 월 재업로드 = 해당 period 파티션 덮어쓰기 (거래 중복 생성 금지)
   ★ 거래 행 단위 dedup 키: (code, date, machineCode, amount, supplier) 해시
⑤ 트리 {YYYY-MM} 노드 추가, variance 자동 산출
```

**규칙:**
- **과거 월 소급 수정 감지:** 연간 파일 특성상 과거 월 시트가 수정될 수 있다. 업로드 시 과거 period의 합계가 DB값과 다르면 warn "history_drift" + 차액 표시 → 8장 Historical Lock 절차 적용 (자동수정 금지).
- **previous_month_json 없으면:** variance만 생략, 나머지 정상 처리.
- **YTD·연간 추세:** FMS DB 쿼리로 (프롬프트에 다개월 JSON 투입 금지).
- **생산성 모듈과 같은 (plant, period) 키 체계:** 원단위 KPI는 DB 조인으로 산출.

---

## 8. 과거 월 데이터 보호 원칙 (Historical Data Lock) — 절대 규칙

당월({YYYY-MM}) 파일에는 과거 월 데이터도 함께 들어있다(롤링 컬럼/연간 시트).
과거 월 값이 DB와 다르더라도 시스템은 절대 자동 수정하지 않는다.

**절차:**
```
① 상태 감지: history_drift warn 발생
② 관리자 승인: 수정 사유 + 증빙(회계 리포팅 변경, 청구서 재수령, 적립금 조정 등)
③ 승인 완료 시만 해당 period 파티션 UPSERT
④ 수정 감사 로그: (plant, period, code, old_amount, new_amount, approver, reason, timestamp)
```

**금지 사항:**
- 자동 수정 절대 금지
- 월말 이후 지난달 시트 수정 시 자동 동기화 금지
- 미승인 drift 그냥 넘기기 금지 (warn 반드시 노출)

---

## 9. Canonical Keys & 3계통 통합

**경비 모듈과 생산성·BOM의 공통 조인 키:**
```
plant = "Mannur"
period = "2025-04" (YYYY-MM 고정)
part_no (BOM 부품 번호, optional for expense)
supplier (공급처)
asset_code (DCMI-*, FMS Asset Master)
car/model (BOM 차종, optional)
```

**활용:**
- Asset Master: expense.assetCode → FMS asset_id (DCMI-FRM-CRT-19)
- Productivity: expense.period + asset_code → 설비별 생산성 데이터
- BOM: expense.supplier + part_no → 부품 가격 이력

---

## 10. 품질 검사 체크리스트

경비 파일 업로드 전 확인사항:

- [ ] 모든 거래의 DCMI 코드 정확성 (FMS Asset Master와 일치)
- [ ] ACTUAL ≤ TALLY 차이 1 Rs 이내
- [ ] 초과 항목 명확히 기재 (초과항목 필드 채움)
- [ ] 부자재 개폐재고 일치 (±1)
- [ ] 미터 연속성 (day-N+1 START = day-N END)
- [ ] 월별 시트명이 영문월 기준 (JAN~DEC)
- [ ] 스크랩/팁 행은 승인 문서 첨부
- [ ] 과거 월 데이터 수정 있으면 관리자 승인 대기

