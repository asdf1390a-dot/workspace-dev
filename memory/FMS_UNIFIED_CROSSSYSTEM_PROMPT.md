# FMS 통합 분석 프롬프트 — 3시스템 교차 KPI 산출 · 연동 검증

> **목적**: Productivity(생산성) + Expense(경비) + BOM(자재) 3시스템을 PPC PLAN 허브로 조인하여 원단위·계획정확도·발주충실도·단위원가 KPI 산출
> **기준일**: {YYYY-MM} (월간)
> **대상 시스템**: DSC Mannur FMS 포털 (기존 3개 specification 통합)
> **출력**: JSON (교차-KPI 노드) + 분석 내러티브 (≤10문장)

---

## 0. 3시스템 통합 개요

```
           PPC PLAN (공통 허브)
         key: (plant, period, part_no)
              │
    ┌─────────┼──────────┬─────────────┐
    │         │          │             │
 생산성    경비 시스템    자재 BOM      
(Productivity)(Expense)  (Location)
    │         │          │
 생산량       구매비      소요량
 원가율      실제원가     보관위치
    │         │          │
    └─────────┼──────────┴─────────────┘
              │
          ★ 교차 조인
      (plant, period, part_no)
              │
         ┌────┴─────┐
    일관성   KPI 산출
   검증    (4개 지표)
```

### 데이터 소스 & 스키마 확인

**Productivity (생산성) 입력:**
- `ppc_plan` node: PART NO, PLAN QTY, DAY, CYCLE TIME (CO2/SUB/PROJ/PRESS hrs/sec)
- `production_rollup`: car/model별 실제 생산량 (검수수불 PART NO별)
- JSON schema section 4: products[].partNo, planQty, actualQty, cycleTime_hrs, unitCostSales

**Expense (경비) 입력:**
- `ledgers[]` (R&M 1.1~1.7, 소모품 2.1, 부자재 3.x, 전력 4.1): actual_cost, supplier, asset_code (DCMI)
- `purchase_link` node: plan_cost vs actual_cost by supplier & PART NO
- JSON schema section 4: ledger_entries[]{supplier, partNo, actualCost, quantity}

**BOM (자재) 입력:**
- `products[].childParts[]`: PART NO, REQ QTY (= PLAN QTY × U/S × OPT), SUPPLIER, CODE (location)
- `ppc_plan` hub: PART NO, PLAN QTY, VARIANT, OPT(%)
- JSON schema section 4: childParts[]{partNo, reqQty, supplier, unitSupply, optionRate}

---

## 1. 교차 조인 규칙 (CANONICAL KEYS)

### 1-1. 정규화 (NORMALIZATION)

세 시스템 모두 동일 키 체계 적용. 다음 필드는 조인 전 정규화:

```
period:      "YYYY-MM" (모두 동일)
             extract from sheet title or filename

plant:       "Mannur" (고정)

part_no:     UPPERCASE + single hyphen + no spaces + keep suffix
             "88310 K3050"    → "88310-K3050"
             "88310-k3050"    → "88310-K3050"
             "88310 K3050 LH" → "88310-K3050-LH"

supplier:    UPPERCASE + trim + collapse spaces
             "SRI  BALAJI"    → "SRI BALAJI"
             "sri balaji"     → "SRI BALAJI"
             Maintain alias map (DSC/D.S.C/DSC INDIA → DSC)

asset_code:  DCMI format verbatim (expense only)
             "DCMI-FRM-CRT-19" (no trim/upper)

car/model:   Per BOM CODE sheet (QXI, AI3, BI3, SU2I, PS7I, BN7I, AI3 SUV)
             consistency check: all part_no instances must match same CAR/MODEL

unit:        qty unit for consumption (이상 1=kg, 0=piece 기본)
             infer from BOM P/NAME or ledger_entries unit
```

### 1-2. 조인 키

Primary join key: `(plant, period, part_no)`

Secondary (validation):
- Productivity ↔ BOM: PART NO identity
- Expense ↔ BOM: SUPPLIER & PART NO (multi-row join if supplier splits)
- Productivity ↔ Expense: (part_no, supplier) for cost per-unit reconciliation

---

## 2. ★ 교차 KPI 산출 (4개 지표)

### 2-1. 원단위 (Unit Consumption / 生産量当たりの材料所要量)

**정의**: 한 달 생산량 1단위당 소요되는 자재 비율

**공식**:
```
unit_consumption[part_no] = Σ REQ_QTY(BOM) / Σ ACTUAL_QTY(Productivity)
                          (same part_no, same period)

단위: kg/1생산, pcs/1생산, 등 (from BOM unit + ledger_entries unit)

예시:
  BOM REQ_QTY(PART X) = 1200 pcs (월간)
  Prod ACTUAL_QTY(PART X) = 100 생산 (월간)
  → unit_consumption = 12 pcs/1생산
```

**해석**:
- ↑ 증가 (전월 대비): 생산 효율성 저하 (waste, scrap 증가)
- ↓ 감소: 효율성 개선 (표준화, 수율 개선)
- 계획 기준값 대비 ±5% 내 정상; >10% = 품질 이슈 조사 필요

**편차 분석** (variance):
```
Δunit = unit_consumption(당월) - unit_consumption(전월)
원인 분해:
  = (REQ_QTY_cur / PROD_cur) - (REQ_QTY_prev / PROD_prev)

속성:
  ① REQ_QTY 증가 (BOM 계획 변경)
  ② REQ_QTY 감소 (U/S 감소 또는 OPT% 하락)
  ③ ACTUAL 증가 (생산 효율)
  ④ ACTUAL 감소 (production halt / delay)
```

### 2-2. 계획정확도 (Planning Accuracy)

**정의**: 계획 구매액(BOM×단위원가) vs 실제 구매액(Expense) 일치율

**공식**:
```
planning_accuracy[part_no, supplier] 
  = ABS( (Planned_Cost - Actual_Cost) / Planned_Cost ) × 100
  
Planned_Cost = Σ (REQ_QTY × unit_cost_planned) [from BOM × Expense plan_cost]
Actual_Cost  = Σ actual_cost [from Expense ledger]

정확도 등급:
  ≤5%     = GREEN (정상)
  5~10%   = YELLOW (주의, 공급사 협상 추천)
  >10%    = RED (편차 원인 조사)
```

**편차 원인 분석**:
```
Δcost = Actual_Cost - Planned_Cost

속성 (in-file evidence만 사용):
  ① PART NO 단위원가 변동 (같은 공급사, 같은 파트)
     → Expense ledger price_per_unit 변화
  ② REQ_QTY 증감 (BOM 계획 수량 변경)
     → PLAN_QTY ↑↓ 또는 OPT% ↑↓
  ③ 공급사 변경 (SUPPLIER → 다른 공급사, 다른 단가)
  ④ 구매 시점 차이 (당월 발주 vs 전월 수령)
     → keep separate tracking if invoice date != delivery date
  ⑤ scrap/반납 (REQ_QTY에 미반영된 손실)
     → Expense ledger "scrap" or "return" line entries
```

### 2-3. 발주 충실도 (Procurement Fulfillment Rate)

**정의**: 계획 발주량(BOM) 대비 실제 입고량(Expense) 달성율

**공식**:
```
fulfillment_rate[part_no, supplier]
  = Σ actual_receipt_qty / Σ REQ_QTY (BOM) × 100

정상: 95~105% (일부 재발주/반납 포함)
미달: <95% (partial delivery, supply shortage)
과잉: >105% (over-purchase, stock buildup)
```

**편차 분석** (supply chain):
```
부족 원인:
  ① 공급사 딜리버리 지연 (아직 미수령)
     → Track by invoice date vs expected delivery date
  ② 부분 수령 (QC 탈락, 반품)
     → Expense ledger "rejection" or "return" entries
  ③ BOM 계획 변경 후 취소 안 함
     → REQ_QTY ↓ but actual still pending

과잉 원인:
  ① 안전재고 반영 안 됨 (BOM에 포함 안 됨)
     → Expense "buffer stock" label
  ② 공급사 MOQ(최소 발주량) 초과
  ③ 하자 반품 후 재발주
     → Ledger "replacement" label
```

### 2-4. 단위원가 (Unit Cost / 原価)

**정의**: 제품 1단위(예: 1생산) 당 자재 소요 원가

**공식**:
```
unit_cost[part_no] = Σ actual_cost(Expense) / Σ ACTUAL_QTY(Productivity)

단위: Rs/1생산, Rs/1시간, 등 (from Expense currency + Prod volume)

예시:
  Expense PART X actual = Rs 120,000 (월간)
  Prod ACTUAL_QTY = 100 (생산)
  → unit_cost = Rs 1,200 / 1생산

target vs actual:
  target_unit_cost = Σ (REQ_QTY × supplier_std_price) / ACTUAL_QTY
  = planned cost per produced unit

variance = actual_unit_cost - target_unit_cost
  (+) 초과원가: 표준가 > 실제 (공급사 가격 인상, waste)
  (-) 절감: 표준가 < 실제 (공급사 할인, 효율 개선)
```

**원가 추적**:
```
unit_cost 구성:
  ① Material cost (자재 부자재): BOM REQ_QTY × supplier unit price
  ② Labor (R&M 인건비): Expense 1.1~1.7 ledger / ACTUAL_QTY
  ③ Utilities (전력): Expense 4.1 ledger / ACTUAL_QTY (메터 기준)
  ④ Overhead (배분): Scrap, rejected qty recovery

롤업:
  car/model별 통합: Σ unit_cost(part_no) for same model
  → total BOM cost per car produced
```

---

## 3. 일관성 검증 (Cross-System Consistency)

### 3-1. 선행 조건 (Pre-join Validation)

각 시스템의 데이터 품질 점검 (KPI 산출 전):

**Productivity (생산성)**:
- ✓ ppc_plan의 모든 PART NO가 canonical_key 준수
- ✓ actualQty > 0 (생산량 0 = 계획만 있고 미생산)
- ✓ cycleTime_hrs 양수 (음수/공백 = 데이터 오류)
- ✓ unitCostSales 정의 (필요시 ledger join으로 역산)

**Expense (경비)**:
- ✓ ledger_entries의 모든 PART NO가 canonical_key 준수
- ✓ actual_cost > 0 (구매 0 = 공급사 대기)
- ✓ supplier 동일 시스템 내 정규화 (ALIAS MAP 사용)
- ✓ asset_code (DCMI) 존재 (cost allocation용)

**BOM (자재)**:
- ✓ childParts[]의 모든 PART NO가 canonical_key 준수
- ✓ reqQty > 0 (소요량 0 = 이상)
- ✓ supplier ≠ blank (공급사 미지정 = validation warn)
- ✓ CODE 해석 가능 (location code 유효성)

### 3-2. 교차 검증 (Cross-System Checks)

**조인 후 검증**:

1. **PART NO 일관성**:
   - BOM childPart.partNo ∈ Productivity.partNo?
   - Productivity.partNo ∈ Expense.ledger.partNo?
   - 미매칭 → warn: "orphan part — exists in BOM but no production"
   - 역: "orphan cost — production/expense exists but no BOM"

2. **SUPPLIER 일관성**:
   - BOM childPart.supplier == Expense.ledger.supplier (same part)?
   - 불일치 → warn: "supplier mismatch — BOM supplier ≠ Expense supplier"
   - 가능 원인: alias map 누락, 다중 공급사

3. **수량 체계 (QTY types)**:
   - REQ_QTY (BOM 계획) vs ACTUAL_QTY (생산 실적) 수량단위 일치?
     e.g., if BOM REQ_QTY = "pcs", Prod ACTUAL_QTY = "kg" → unit conversion table 필요
   - Inconsistent unit → warn: "unit mismatch — BOM unit ≠ Productivity unit"

4. **기간 일관성**:
   - 모든 record의 period = {YYYY-MM} (같은 월)?
   - 혼합 월 → error: "period mismatch — records span multiple periods"

### 3-3. 편차 플래깅 (Anomaly Detection)

**KPI 임계값 (Thresholds)**:

```json
{
  "unit_consumption_delta": {
    "warn_pct": 10,
    "critical_pct": 20,
    "reason": "변동률 ±10% 이상 시 주의"
  },
  "planning_accuracy": {
    "green_pct": 5,
    "yellow_pct": 10,
    "red_pct": null,
    "reason": "계획 vs 실제 편차 ≤5% 정상"
  },
  "fulfillment_rate": {
    "min_pct": 95,
    "max_pct": 105,
    "reason": "발주충실도 95~105% 정상"
  },
  "unit_cost_variance": {
    "tolerance_pct": 5,
    "reason": "단위원가 변동 ±5% 이상 시 분석"
  }
}
```

**플래그 규칙**:

```
anomaly[] 배열:
  {
    "type": "unit_consumption" | "planning_accuracy" | "fulfillment" | "unit_cost",
    "part_no": "88310-K3050",
    "severity": "warn" | "critical",
    "threshold": 10,
    "actual_value": 22.5,
    "message": "변동률 22.5% (임계값 10%) — 공급사 협상 또는 BOM 검토 필요"
  }
```

---

## 4. 출력 스키마

### 4-1. JSON (Cross-System Metrics Node)

```json
{
  "metadata": {
    "period": "2026-06",
    "plant": "Mannur",
    "generated_at": "2026-06-13T22:30:00Z",
    "source_systems": ["Productivity", "Expense", "BOM"],
    "canonical_key_version": "2026-06-13"
  },
  "summary": {
    "total_part_nos": 145,
    "matched_part_nos": 142,
    "orphan_part_nos": {
      "in_bom_only": 3,
      "in_expense_only": 0,
      "in_productivity_only": 2
    },
    "warning_count": 8,
    "critical_count": 1
  },
  "kpi": {
    "unit_consumption": {
      "by_part_no": [
        {
          "part_no": "88310-K3050",
          "car": "QXI",
          "model": "QXIFL",
          "supplier": "SRI BALAJI",
          "unit": "pcs/1生産",
          "current": 12.5,
          "previous": 12.0,
          "variance_pct": 4.2,
          "status": "ok",
          "variance_reason": "REQ_QTY +5%, ACTUAL +1% (효율성 안정)"
        }
      ],
      "summary": {
        "avg_variance_pct": 3.8,
        "max_variance_pct": 22.5,
        "min_variance_pct": -8.3,
        "warning_items": 3
      }
    },
    "planning_accuracy": {
      "by_supplier": [
        {
          "supplier": "SRI BALAJI",
          "part_count": 45,
          "planned_cost": 2500000,
          "actual_cost": 2480000,
          "variance_rs": -20000,
          "variance_pct": 0.8,
          "accuracy_pct": 99.2,
          "status": "ok"
        },
        {
          "supplier": "MIP",
          "part_count": 28,
          "planned_cost": 890000,
          "actual_cost": 975000,
          "variance_rs": 85000,
          "variance_pct": 9.6,
          "accuracy_pct": 90.4,
          "status": "yellow",
          "note": "공급사 인상 + 추가 발주 (QC 재작업)"
        }
      ],
      "total_planned": 3500000,
      "total_actual": 3515000,
      "portfolio_accuracy_pct": 99.6,
      "portfolio_status": "ok"
    },
    "fulfillment_rate": {
      "by_part_no": [
        {
          "part_no": "88310-K3050",
          "supplier": "SRI BALAJI",
          "req_qty": 1200,
          "actual_receipt_qty": 1195,
          "fulfillment_rate_pct": 99.6,
          "status": "ok",
          "pending_qty": 0
        },
        {
          "part_no": "44120-A1234",
          "supplier": "YATHRA",
          "req_qty": 500,
          "actual_receipt_qty": 450,
          "fulfillment_rate_pct": 90.0,
          "status": "critical",
          "pending_qty": 50,
          "expected_delivery": "2026-06-15"
        }
      ],
      "avg_fulfillment_pct": 98.2,
      "critical_shortage_items": 1
    },
    "unit_cost": {
      "by_part_no": [
        {
          "part_no": "88310-K3050",
          "car": "QXI",
          "supplier": "SRI BALAJI",
          "unit": "Rs/1生産",
          "target_cost": 1200,
          "actual_cost": 1210,
          "variance_rs": 10,
          "variance_pct": 0.8,
          "status": "ok",
          "cost_breakdown": {
            "material": 850,
            "labor": 250,
            "utilities": 110,
            "overhead": 0
          }
        }
      ],
      "by_car_model": [
        {
          "car": "QXI",
          "model": "QXIFL",
          "total_part_count": 24,
          "total_unit_cost_rs": 28500,
          "cost_per_unit_production": 28500,
          "variance_pct": 2.1,
          "status": "ok"
        }
      ]
    }
  },
  "anomalies": [
    {
      "type": "unit_consumption",
      "part_no": "88310-A5000",
      "severity": "critical",
      "threshold": 10,
      "actual_value": 22.5,
      "message": "변동률 22.5% (임계값 10%) — 공급사 협상 또는 BOM 검토 필요",
      "recommendation": "QC 탈락 재검사, 공급사 품질 회의"
    },
    {
      "type": "planning_accuracy",
      "supplier": "MIP",
      "severity": "warn",
      "threshold": 10,
      "actual_value": 9.6,
      "message": "계획 편차 9.6% (임계값 10% 이상) — 공급사 협상 추천",
      "recommendation": "MIP 가격 인상 협상, 추가 발주 QC 재검토"
    }
  ],
  "cross_system_narrative_ko": "6월 생산성·경비·BOM 3시스템 통합 분석 완료. 총 145개 품번 중 142개 매칭 (미매칭 3개 BOM전용). 원단위 평균 변동률 3.8% (정상), 계획정확도 99.6% (우수), 발주충실도 98.2% (정상). 이상 3건: (1) 88310-A5000 원단위 22.5% 초과 (공급사 재작업 반영), (2) MIP 공급사 9.6% 편차 (인상 반영), (3) 44120-A1234 발주충실도 90% (미수령 50pcs, 예정 2026-06-15). 교차 KPI 기준 권장사항: MIP 협상, 44120-A1234 공급사 follow-up, 88310-A5000 QC 재검사."
}
```

### 4-2. 운영 리포트 (Narrative, ≤10문장, 한글)

```
{YYYY-MM} 월 3시스템 교차 KPI 분석 완료.

① 원단위: 총 X개 품번 평균 변동률 {Δ}% ({status}).
   [이상] Y건 — {list: part_no (Δ%), reason}

② 계획정확도: 포트폴리오 {accuracy}% ({status}).
   [주의] Z개 공급사 > 5% 편차 — {list: supplier (Δ%), driver}

③ 발주충실도: 평균 {rate}% ({status}).
   [미달] W건 — {list: part_no (Δ qty), due_date}

④ 단위원가: {cost_status}.
   [집계] car/model별 총 원가 분석 첨부.

⑤ 권장사항: {action_items} (우선순위: CRITICAL → WARN).
   다음 월 관심사항: {next_focus_areas}.
```

---

## 5. 구현 프로토콜 (Operational Protocol)

### 5-1. 입력 데이터셋 (3파일)

```
1. Productivity (생산성) JSON
   - file: FMS_PRODUCTIVITY_MONTHLY_{YYYY-MM}.json
   - 필수 노드: ppc_plan{}, production_rollup{}, products[]{actualQty, unitCostSales}
   - 출처: Productivity specification 섹션 4 JSON 스키마

2. Expense (경비) JSON
   - file: FMS_EXPENSE_MONTHLY_{YYYY-MM}.json
   - 필수 노드: ledgers[], purchase_link{}, validation_rules{}
   - 출처: Expense specification 섹션 4 JSON 스키마

3. BOM (자재) JSON
   - file: FMS_BOM_MONTHLY_{YYYY-MM}.json
   - 필수 노드: products[]{childParts[], ppc_plan}
   - 출처: BOM specification 섹션 4 JSON 스키마
```

### 5-2. 처리 순서

```
① 입력 3파일 로드 + 메타데이터 확인 (period 일관성, plant="Mannur")
② NORMALIZATION: part_no, supplier, period, plant 정규화
③ 선행 조건 점검 (Pre-join validation) — 각 시스템 데이터 품질
④ 3-way JOIN on (plant, period, part_no)
   - 조인 결과 행: Productivity LEFT JOIN Expense LEFT JOIN BOM
   - 미매칭 행: orphan_part_nos[] 기록
⑤ 교차 검증 (Cross-system consistency) — PART NO, SUPPLIER, 수량단위, 기간
⑥ KPI 산출 (4개 지표):
   a) unit_consumption = REQ_QTY / ACTUAL_QTY
   b) planning_accuracy = ABS(Planned_Cost - Actual_Cost) / Planned_Cost
   c) fulfillment_rate = Actual_Receipt_Qty / REQ_QTY
   d) unit_cost = Actual_Cost / ACTUAL_QTY
⑦ 편차 분석 (Variance attribution) — in-file evidence만 사용
⑧ 이상 플래깅 (Anomaly detection) — 임계값 기준
⑨ 출력 JSON 생성 + narrative 작성
```

### 5-3. 품질 게이트 (Quality Gates)

KPI 산출 전 필수 통과 조건:

```
MUST-PASS:
  ✓ Period 일관성 (3파일 모두 동일 {YYYY-MM})
  ✓ Plant = "Mannur" (고정)
  ✓ Canonical keys 정규화 완료 (part_no, supplier 일치)
  ✓ 수량 > 0 (REQ_QTY, ACTUAL_QTY, actual_cost 모두 양수)

WARN (KPI 산출 진행, but flagged):
  ⚠ 미매칭 part_no (BOM only, Expense only 등) — orphan_part_nos[]
  ⚠ SUPPLIER 불일치 (BOM vs Expense)
  ⚠ 수량단위 불일치 (pcs vs kg)

FAIL (KPI 산출 중단):
  ✗ Period 혼합 (월 범위 > 1)
  ✗ Plant ≠ "Mannur"
  ✗ Canonical key 정규화 실패 (key violation)
  ✗ 필수 노드 누락 (ppc_plan, production_rollup 등)
```

---

## 6. 3시스템 통합 KPI 사용 시나리오

### 6-1. 원가 관리 (Cost Control)

**원단위 + 단위원가 → 생산 효율성 추적**:

```
시나리오: 6월 QXI 생산량 100대
  BOM REQ_QTY (자재 소요) = 1,200 pcs
  생산성 ACTUAL_QTY = 100대
  → unit_consumption = 12 pcs/1대

  Expense actual_cost = Rs 120,000
  → unit_cost = Rs 1,200 / 1대

  전월 unit_cost = Rs 1,150 / 1대
  → variance = +Rs 50 / 1대 (원가 증가)

  분석: 공급사 가격 인상? 혹은 scrap/waste 증가?
  → planning_accuracy를 보면 공급사 MIP 가격 인상 9.6% 발견
  → recommendation: MIP와 협상, 또는 대체 공급사 검토
```

### 6-2. 공급망 관리 (Supply Chain)

**발주충실도 + 계획정확도 → 공급사 성과 평가**:

```
시나리오: 6월 SRI BALAJI 공급사 평가
  계획정확도: 99.2% (GREEN)
  발주충실도: 99.6% (GREEN)
  → SRI BALAJI 신뢰도 우수

  반면 YATHRA 공급사:
  발주충실도: 90.0% (CRITICAL, 50 pcs 미수령)
  예정 납기: 2026-06-15
  → follow-up 필요
```

### 6-3. 품질 관리 (Quality)

**원단위 편차 → 공정 품질 추적**:

```
시나리오: 88310-A5000 부자재 원단위 22.5% 초과 (임계값 10%)
  전월: 20 pcs/1생산
  당월: 24.5 pcs/1생산 (변동률 22.5%)
  
  원인 분석 (in-file evidence):
  - BOM REQ_QTY 증가? (PLAN_QTY ↑, OPT% ↑ 확인)
  - 아니면 scrap 증가? (Expense ledger scrap line 확인)
  - 또는 반품 재발주? (ledger "replacement" entry 확인)
  
  발견: Expense ledger "scrap" 라인 800 pcs 기록
  → QC 탈락 재작업, 공급사 품질 회의 필요
```

---

## 7. 주의사항 & 제약사항

1. **조인 결손 처리**:
   - BOM에만 있는 품번 (Productivity/Expense 미존재) → 계획만 있고 미생산/미발주
   - Productivity/Expense에만 있는 품번 → 비정상 (BOM 누락)
   - 둘 다 warn 처리, but KPI 산출은 진행 (3-way outer join)

2. **기간 관리**:
   - 모든 record는 단일 {YYYY-MM} 범위만 처리
   - 혼합 월 데이터 → error, 월 분리 후 재처리

3. **통화**:
   - Expense는 INR (Rs), BOM/Productivity는 수량 기준
   - 환율 변동은 별도 tracking (이 프롬프트 범위 외)

4. **소수점 이하**:
   - unit_consumption: 소수 1자리까지 (12.5 pcs/생산)
   - accuracy/fulfillment: 소수 1자리까지 (99.2%)
   - unit_cost: 소수점 이하 정수형 (Rs 1,200)

5. **이전 월 데이터 (Historical)**:
   - 3시스템 모두 {YYYY-MM}만 현재 분석 대상
   - 전월 KPI는 별도 JSON (previous_month_kpi.json) 제공 필요
   - variance 분석은 전월 기준값 제공 필수

---

## 변경 이력

- **2026-06-13 22:45 KST** — Cross-KPI 통합 프롬프트 정리. 4개 KPI 공식 강조 + 입출력 명세 재정리. 원단위(생산량당 자재) · 계획정확도(계획 vs 실제) · 발주충실도(수량 충족율) · 단위원가(생산당 원가) 산출 체계 확정.
- **2026-06-13 22:30 KST** — 최초 작성. 3시스템(Productivity·Expense·BOM) 통합 프롬프트. 4개 KPI (원단위·계획정확도·발주충실도·단위원가) 정의, JSON 스키마 확정, 운영 프로토콜 기술.
