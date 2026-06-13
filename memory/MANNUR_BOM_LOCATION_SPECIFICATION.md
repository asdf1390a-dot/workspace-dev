# Mannur 자재 BOM·보관위치 마스터 — 구조 명세 · 트리 · 적용 프롬프트

> 대상: HTL_Seat_Child_Part_Location + MOBIS_CCB_Child_Part_Location (기준일 2026-05-30, 계획월 2026-06)
> 성격: 자재 소요량(BOM) + 공급사 + 보관위치(Location) 마스터
> 목적: 매월 동일 양식 업데이트 + 위치코드/소요량 검증 + 전월대비 + FMS 트리 적재
> 생산성·경비 시스템과 동일 체계 + PPC PLAN 허브로 3시스템 연결. 용도: 보고/마스터용

---

## 0. 파일 인벤토리 (2파일, 24시트) ✅

두 파일은 부위(BACK type)만 다르고 양식은 동일**하다. 고객사 2곳(HTL=시트류, MOBIS=CCB).

| 파일 | 고객사 | 부위 | 시트 |
|------|--------|------|------|
| HTL Seat | HTL | FSB/RSB/ISO/RDE 등 시트류 | 15시트 |
| MOBIS CCB | MOBIS | CCB(Cowl Cross Bar) | 9시트 |

### 시트 역할 분류 (양 파일 공통 3계층)

| 계층 | 시트 | 역할 |
|------|------|------|
| **① 마스터키 | CODE | ★위치코드 체계 정의 (CAR·부위·랙타입). HTL에만 존재, 공용 |
| ② 계획(허브) | PPC PLAN | 생산계획. 생산성·경비 파일과 동일 허브 (BL/MAN/PRO/PS/ST/SUB 참조) |
| | HTL,MOBIS,ECT PLAN | 고객사별 월 소요계획 (MODEL·VARIANT·PART NO·QTY) |
| ③ BOM·위치 | 완성품별 child-part 시트 | ★핵심: 완성품 1대당 자재 소요량 + 공급사 + 보관위치 |

### child-part 시트 목록 (완성품 = 차종×부위)
- HTL(시트류): QXI/AI3 FSB, SU2I FSB, SU2I PE FSB, BI3 FSB, BN7I FSB, BI3 RSB, AI3 RSB, AI3 ISO, SU2I RSB1, SU2I RDE, BN7I1, PS7I PE (12개)
- MOBIS(CCB): AI3 CCB, BI3 CCB, SU2I CCB, AI3 SUV CCB, BN7I CCB, SU2I 3rd CCB, QXI CCB (7개)

---

## 1. 양식 명세

### 1-1. CODE 시트 — 위치코드 마스터키 (가장 중요)
위치코드 CAR:부위:순번 의 계층 체계를 정의한다.
| CAR | CODE NO | FRT BACK | R/BACK | CCB |
|-----|---------|----------|--------|-----|
| QXI | 1 | 1:1 | 1:2 | 1:3 |
| AI3 | 2 | 2:1 | 2:2 | 2:3 |
| BI3 | 3 | … | … | … |
| SU2I | 4 | … | … | … |
| PS7I | 5 | … | … | … |
| BN7I | 6 | … | … | … |
| AI3 SUV | 7 | … | … | … |

- 2차 분류(랙타입): RACK / AIR BACK·BELT / RECLINER / PIPE / H/BACK / F/G / BOX PLT / WIRE PLT / WIP PLT
- 위치코드 패턴: CAR:MODEL:RACK… (예: child 시트의 CODE NO 1:1:5 = QXI·FRT·5번 랙)
- ★ 이 코드가 모든 child-part 행의 CODE NO와 조인**되는 키

### 1-2. child-part(BOM·위치) 시트 — 공통 양식
헤더(3행 기준):
```
NO | CODE NO | PRO | (PRO) | PART | P/NO | P/NAME | U/S | SUPPLIER | OPT(%) |
PACKING STD | SIZE | SNP | STOCK | REQ QTY | [STOCK QTY | RACK/PLT QTY]
```
- 1행: `CHILD PART LOCATION`, 2행: `{완성품명}` + `CUSTOMER PLAN {수량}` (예: 65386)
- **U/S = Unit/Set (완성품 1대당 사용 수량)
- OPT(%) = 옵션 적용률
- SNP = Standard Number per Pack (포장단위)
- STOCK = 현 재고 (행4에 working days 26 같은 분모)
- REQ QTY = 소요량 = CUSTOMER PLAN × U/S × OPT(%) 계열 계산
- CODE NO = CODE 시트의 위치코드 (2:3:4 = AI3·CCB·4번 위치)
- SUPPLIER = 공급사 (SRI BALAJI, DSC, MIP, YATHRA, UE PRESS 등)
- PACKING STD / SIZE = 포장형태(PLT/BIN/BOX PLT) + 규격(800X500 등) → 물류·보관 설계용

### 1-3. HTL,MOBIS,ECT PLAN 시트 — 고객사 월 소요계획
| MODEL | VARIANT | PART NAME | PART NO(PPC) | PART NO(PED) | QTY | … |
|-------|---------|-----------|--------------|--------------|-----|---|
| QXIFL | FSB | U/DSAB LH | 88310-K3250 | 88310-K3250 | 120 | … |

고객사 발주 PART NO 기준 월 계획수량.

### 1-4. PPC PLAN — 생산계획 허브 (3시스템 공통)
| CAR | MODEL | PART NAME | PART NO | VARIANT | PLAN QTY | DAY | OPT(%) |
|-----|-------|-----------|---------|---------|----------|-----|--------|
| … | … | … | … | … | … | … | … |

- 제목 2026 - JUNE, WORKING DAYS 26
- ★ 생산성 보고서·경비 시스템의 PPC PLAN과 동일 구조 → 세 시스템이 이 허브로 연결됨
- cross-ref: BL, MAN, PRO, PS, ST, SUB (생산성 파일과 동일 참조군)

---

## 2. 데이터 흐름

```
[CODE 위치마스터]──위치코드(CAR:부위:순번)──┐
 ▼
[PPC PLAN]──CUSTOMER PLAN(생산계획)──→ [child-part BOM 시트]
 │ (3시스템 공통 허브) REQ QTY = PLAN × U/S × OPT
 │ │ + SUPPLIER + 보관위치(CODE)
 ├──→ 생산성 보고서
 ├──→ 경비 시스템
 └──→ 자재 BOM (본 시스템)
 ▼
[HTL,MOBIS,ECT PLAN]──고객 PART NO 발주──→ 공급사별 발주/입고 연계
```

---

## 3. 검증 룰 (도출 6종)

| # | 룰 | 내용 |
|---|-----|------|
| 1 | code_resolve | 모든 child-part 행의 CODE NO가 CODE 시트 체계로 해석 가능(CAR·부위 일치). 미해석 시 warn |
| 2 | req_qty_recalc | REQ QTY ≈ CUSTOMER PLAN × U/S × OPT(%) 재계산 일치(±오차) |
| 3 | opt_sum | 동일 P/NO 그룹의 OPT(%) 합 ≈ 1.0 (LH/RH/variant 분배율 합) |
| 4 | supplier_present | SUPPLIER 공란 행 없음(발주 대상 누락 방지) |
| 5 | packing_complete | PACKING STD·SIZE·SNP 공란 시 warn(물류 설계 불가) |
| 6 | plan_link | child 시트 CUSTOMER PLAN == PPC PLAN 해당 완성품 PLAN QTY |

데이터 정규화:
- CODE NO 빈칸(병합 상속) → 위 행 코드 forward-fill
- P/NO 표기 통일(하이픈), LH/RH 구분 유지
- 날짜·기준월: 파일명 날짜(30052026) + PPC PLAN 제목월(JUNE) 우선

---

## 4. FMS 트리 구조 (자재 BOM·위치 모듈)

```
📁 Mannur 자재 BOM·보관위치 (Material / BOM / Location)
│
├── 📅 {YYYY-MM} ← 계획월 노드 (예: 2026-06)
│ ├── 🪑 1. HTL (시트류)
│ │ ├── FSB (QXI/AI3, SU2I, SU2I PE, BI3, BN7I)
│ │ ├── RSB (BI3, AI3, SU2I RSB1)
│ │ ├── ISO / RDE / PS7I PE
│ │ └─ (각 완성품) child-part 리스트
│ │ └─ P/NO · U/S · REQ QTY · SUPPLIER · 위치(CODE) · 포장규격
│ ├── 🔩 2. MOBIS (CCB)
│ │ └── AI3/BI3/SU2I/AI3-SUV/BN7I/SU2I-3rd/QXI CCB
│ ├── 📦 3. 공급사별 발주 집계 (SUPPLIER rollup)
│ │ └─ 공급사 × 품번 × REQ QTY 합 (발주서 기초)
│ ├── 🗺 4. 보관위치 맵 (Location)
│ │ └─ CODE(CAR:부위:랙) × 품번 × 포장규격 → 창고 레이아웃
│ ├── 📋 5. 생산계획 (PPC PLAN)
│ └── ✅ 6. 검증 & 전월대비
│ ├─ 위치코드 해석 / 소요량 재계산 / OPT 합
│ └─ 전월대비 신규·삭제 품번, 소요량 증감 + 사유
│
└── 📚 마스터
 ├── CODE 위치코드 체계 (CAR·부위·랙타입)
 ├── 공급사 마스터 (SUPPLIER 정규화)
 ├── 품번 마스터 (P/NO ↔️ P/NAME ↔️ 완성품)
 └── 포장 마스터 (PACKING STD/SIZE/SNP)
```

💡 **3시스템 연결 고리:**
- PPC PLAN**이 생산성·경비·자재BOM 세 파일에 공통 → (plant, period) + PART NO 키로 조인하면
"이번 달 생산계획 → 필요 자재량 → 발주 → 비용"이 한 흐름으로 연결됨.
- child-part의 **SUPPLIER**가 경비 시스템의 공급사 마스터와, **P/NO**가 검수수불(생산성)과 조인됨.

### JSON 스키마
```json
{
 "bom": {
 "plant": "Mannur", "period": "2026-06", "asOf": "2026-05-30",
 "locationCodes": [
 { "car": "QXI", "codeNo": 1, "frt": "1:1", "rr": "1:2", "ccb": "1:3" }
 /* + rack types */
 ],
 "products": [
 { "customer": "HTL", "product": "QXI/AI3 FSB", "backType": "FSB",
 "customerPlan": 65386, "workingDays": 26,
 "childParts": [
 { "no": 1, "codeNo": "1:1:5", "partNo": "88413-K6050", "partName": "H/REST STAY",
 "us": 1, "supplier": "SRI BALAJI", "optPct": 0.3681,
 "packingStd": "PLT", "size": "800X500", "snp": 750,
 "stock": 925.73, "reqQty": 1.2343,
 "validation": { "codeResolved": true, "reqQtyOk": true } } ] }
 ],
 "supplierRollup": [ { "supplier": "SRI BALAJI", "parts": 12, "totalReqQty": 0 } ],
 "plan": [ /* PPC PLAN rows */ ],
 "variance": { "vsPrevMonth": {
 "newParts": [], "removedParts": [],
 "reqQtyChanges": [ { "partNo": "...", "prev": 0, "curr": 0, "delta": 0, "reason": "PLAN 증가" } ] } },
 "validation": { "passed": true, "checks": [
 { "rule": "code_resolve", "status": "ok" } ] }
 }
}
```

---

## 5. ★ 적용 프롬프트

### 5-1. 메인 프롬프트 (월간 BOM·위치 처리)

```
You process the DSC Mannur child-part BOM/location master workbooks for {YYYY-MM}.
Two files (HTL seat-type, MOBIS CCB) share ONE fixed layout. Process ALL product
sheets in both; emit "sheet_missing" warn for any absent product.

## FILE SET (fixed)
- HTL file: sheets CODE, PPC PLAN, "HTL,MOBIS,ECT PLAN", and 12 child-part product
 sheets (QXI/AI3 FSB, SU2I FSB, SU2I PE FSB, BI3 FSB, BN7I FSB, BI3 RSB, AI3 RSB,
 AI3 ISO, SU2I RSB1, SU2I RDE, BN7I1, PS7I PE).
- MOBIS file: sheets PPC PLAN, "HTL,MOBIS,ECT PLAN", and 7 CCB child-part sheets
 (AI3 CCB, BI3 CCB, SU2I CCB, AI3 SUV CCB, BN7I CCB, SU2I 3rd ccb, QXI CCB).
- CODE sheet (HTL file) is the shared LOCATION-CODE master.

## FIXED LAYOUT
- CODE: CAR | CODE NO | FRT(x:1) | R/BACK(x:2) | CCB(x:3) + rack types
 (RACK/AIRBACK-BELT/RECLINER/PIPE/H-BACK/F-G/BOX-PLT/WIRE-PLT/WIP-PLT).
 Location code pattern = CAR:부위:rack (e.g. 1:1:5 = QXI·FRT·rack5).
- child-part (row3 header): NO|CODE NO|PRO|PRO|PART|P/NO|P/NAME|U/S|SUPPLIER|OPT(%)|
 PACKING STD|SIZE|SNP|STOCK|REQ QTY|[STOCK QTY|RACK/PLT QTY]. Row2 holds product name
 + CUSTOMER PLAN qty. CODE NO is merged (forward-fill from the row above when blank).
- PPC PLAN: CAR|MODEL|PART NAME|PART NO|VARIANT|PLAN QTY|DAY|OPT(%)|CYCLE TIME
 (Hrs & Sec: CO2/SUB/PROJ/PRESS). Title carries the month (e.g. "2026 - JUNE"),
 WORKING DAYS in header. This PPC PLAN is the SAME hub used by the productivity and
 expense systems — key it on (plant, period) + PART NO.
- "HTL,MOBIS,ECT PLAN": MODEL|VARIANT|PART NAME|PART NO(PPC)|PART NO(PED)|QTY.

## TASKS
1) EXTRACT both files into the JSON schema (section 4). Forward-fill merged CODE NO.
 Parse every child-part row under products[].childParts[].
2) NORMALIZE: trim P/NO (keep hyphen, keep LH/RH), canonical SUPPLIER list,
 period from PPC PLAN title month + file-name date.
3) VALIDATE (ok/warn/fail):
 a code_resolve: each childPart.codeNo decodes via CODE sheet (CAR & 부위 consistent)
 b req_qty_recalc: REQ QTY ≈ CUSTOMER PLAN × U/S × OPT(%) family (±tolerance)
 c opt_sum: per P/NO group, Σ OPT(%) ≈ 1.0
 d supplier_present: no blank SUPPLIER on active rows
 e packing_complete: PACKING STD/SIZE/SNP present (else warn)
 f plan_link: product CUSTOMER PLAN == PPC PLAN matching product PLAN QTY
4) COMPARE vs previous_month_json: list new/removed P/NO; REQ QTY deltas (top changes);
 attribute reason ONLY from in-file evidence (PLAN QTY change, OPT change, U/S change;
 split ΔReq = ΔPlan×US0×OPT0 + …). No fabrication; else "사유 미기재 — 확인 필요".
5) OUTPUT only JSON + narrative_ko (≤5 sentences: 총 품번수, 신규/삭제, 소요량 증감 사유,
 공급사 집계, 위치 미해석 건수).

## RULES
- All product sheets in BOTH files must appear (absent → sheet_missing warn, keep node).
- HISTORICAL LOCK: only {YYYY-MM} is writable. If a PAST period value differs from the
 previous DB values provided, DO NOT modify it — emit history_drift
 {period, field, db_value, file_value, delta} with the question
 "과거 월 데이터가 파일과 다릅니다. 수정이 필요합니까?" Default = keep DB value;
 apply only with an explicit per-item approved_corrections[] in a separate run.
- Keep P/NO, CODE NO, SUPPLIER verbatim (join keys to expense & productivity systems).
- REPORTING/MASTER dataset; never alter source quantities.
```

### CANONICAL KEYS (identical across productivity / expense / BOM systems) ⭐ 2026-06-13 추가

이 블록을 메인 프롬프트(5-1) RULES 마지막에 추가할 것:

```
## CANONICAL KEYS (identical across productivity / expense / BOM systems)
- period: always "YYYY-MM" (e.g. "2026-06"); derive from sheet/title month.
- plant: "Mannur".
- part_no: UPPERCASE, single hyphen, no spaces, keep LH/RH/variant suffix.
 e.g. "88310 K3050" / "88310-k3050" → "88310-K3050".
- supplier: trim + collapse spaces + UPPERCASE canonical (maintain alias map).
- asset_code (expense): DCMI code verbatim (e.g. "DCMI-FRM-CRT-19").
- car/model: per CODE sheet names (QXI, AI3, BI3, SU2I, PS7I, BN7I, AI3 SUV).
Emit these canonical fields on every record so cross-system JOINs never break.

교차 KPI(원단위·계획정확도·발주충실도·단위원가)는 별도 통합 프롬프트(FMS_통합_CrossSystem_프롬프트.md)에서 산출한다.
```

### 5-2. 트리 렌더링 프롬프트
```
Render the BOM JSON as the FMS tree. Depth1 = {YYYY-MM}; Depth2 = [HTL(seat),
MOBIS(CCB), Supplier-rollup, Location-map, PPC-PLAN, Validation&Variance];
Depth3 = product → child-part list (P/NO·U/S·REQ QTY·SUPPLIER·location chip).
Master branch holds CODE location-codes, supplier, P/NO, packing masters.
Link each child-part SUPPLIER to the Expense supplier master and each P/NO to the
Productivity 검수수불, all via (plant, period). Badges ok/warn/fail; variance arrows.
```

### 5-3. 검증 단독 프롬프트
```
Run ONLY the 6-rule validation on this month's BOM JSON:
[{rule,status,detail,affected}] for code_resolve, req_qty_recalc, opt_sum,
supplier_present, packing_complete, plan_link. fail/warn first.
```

---

## 6. 운영 사이클 & 3시스템 통합

### 6-1. 월간 사이클 (생산성·경비와 동일)
```
① 당월 2파일 업로드 (HTL + MOBIS, 동일 양식)
② 프롬프트 5-1 — 입력: 2파일 + previous_month_json(FMS DB 전월)
 → {YYYY-MM}만 처리, 과거 월은 Historical Lock(차이 표기·질문, 자동수정 금지)
③ 검증 5-3 게이트: fail 시 확정 차단
④ DB UPSERT — 키: (plant, period, customer, product, partNo) / 같은 월 재업로드 = 덮어쓰기
⑤ 트리 {YYYY-MM} 노드 추가, variance 자동 산출
```

### 6-2. 3시스템 통합 키 (PPC PLAN 중심)
```
 ┌─────────── PPC PLAN (공통 허브) ───────────┐
 │ key: (plant, period, PART NO) │
 생산성 보고서 ───┤ 생산계획·CYCLE TIME → 생산량·생산성 │
 경비 시스템 ───┤ SUPPLIER → 부자재/구매 비용 │
 자재 BOM(본건)───┤ PLAN QTY × U/S × OPT → REQ QTY·발주·위치 │
 └────────────────────────────────────────────┘
```
- **원단위 KPI: (자재 REQ QTY) ÷ (생산성 생산량) = 생산량당 자재 소요 → 변동 추적
- 발주-비용 연결: BOM SUPPLIER ↔️ 경비 3.x 공급사 → 계획 발주액 vs 실제 비용 대조
- 품번 정합: BOM P/NO ↔️ 생산성 검수수불 P/NO → 계획 소요 vs 실제 수불 대조

### 6-3. 권장사항
- CODE 위치코드를 마스터로 분리(월 무관). child-part 시트는 코드 참조만.
- 세 시스템 모두 (plant, period) 동일 키 체계 유지 → FMS DB 단일 조인.
- 품질 이슈: 시트명 공백(AI3 CCB ,BN7I CCB ) trim, CODE NO 병합셀 상속 처리 필수.

> ⚠️ 보고/마스터용. 실제 발주·입고 트랜잭션은 별도 스키마로 두고 본 BOM은 계획 기준으로만 사용.

---

## 변경 이력

- **2026-06-13 21:54 KST** — Canonical Keys 패치 추가. 메인 프롬프트(5-1) RULES에 통합할 블록 명시.
