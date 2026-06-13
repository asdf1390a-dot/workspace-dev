# DSC Mannur 월간 생산성 통합 문서 (Productivity Workbook) — 명세 · 프롬프트 · 운영 사이클

> 대상: Mannur(Chennai) 월간 생산성 통합 문서
> 성격: 월간 보고/마스터 양식 (32시트 고정 레이아웃)
> 목적: 생산효율·투입시간·가동률·검수수불 집계 + 라인 CAPA 추적 + 월간 사이클 자동화
> 3시스템 연결: 생산성(본건) + 경비 + 자재BOM — PPC PLAN 허브로 통합
> 용도: 월간 보고/마스터 양식, 실사용 데이터는 별도 갱신 주기 권장

---

## 0. 32시트 고정 레이아웃 (필수, 누락 금지)

### 출력/집계 시트 (7개)
1. **생산성 집계** — 월별 생산효율(직접인원/표준시간/종합생산성) + 인정비가동(14) + 개선비가동(17) + Loss → 생산효율%
2. **투입시간** — 라인별 투입시간 정리
3. **02-IDLE** — 가동률 상세(공급부족, 품질, 설비 등 세부 사유)
4. **MANPOWER** — 라인별 인원 현황
5. **PRODUCTIVITY** — PRO% = production / MAN-HR
6. **MAN** — 인력 집계
7. **검수수불** — 부품별 기초/출하/검수/기말장부 + 실사차이 + 제품수불

### 마스터 시트 (2개)
8. **CT기준정보** — 공정별 표준 사이클 타임
9. **PPC PLAN** — 생산 계획 (3시스템 공통 허브)

### 라인 CAPA 시트 (23개 — 고정 템플릿)
각 시트 명: `{CAR} {PART} - CAPA` 형식

| 차종(CAR) | 부위(PART) | 시트명 | 설명 |
|-----------|-----------|-------|------|
| BN7I | 다중 | BN-R, BN-F, BN-CCB | 7개 조합 (R=rear, F=front, CCB=cowl) |
| PS7I | 표준 | PS | 1개 |
| SU2I | 다중 | SP-F, S-R, SP-CCB | 3개 |
| AI3 | 다중 | A-F, A-R, A-CCB, AS-CCB | 4개 (AS=SUV) |
| QXI | 다중 | Q-R, Q-CCB | 2개 |
| BI3 | 다중 | B-F, B-R, B-CCB | 3개 |
| HCI/AH2 | 다중 | H-F, H-R | 2개 |
| 조립 | assembly | SUB | 1개 |
| 사출 | projection | PRO | 1개 |
| 파이프프레스 | pipe-press | P-P | 1개 |
| 블랭킹 | blanking | BL | 1개 |
| 스탬핑 | stamping | ST | 1개 |

**CAR↔Sheet 매핑:**
- `BN-*` = BN7I
- `SP-*`, `S-*` = SU2I
- `A-*`, `AS-*` = AI3
- `Q-*` = QXI
- `B-*` = BI3
- `H-*` = HCI/AH2
- `PS` = PS7I
- `SUB`, `PRO`, `P-P`, `BL`, `ST` = 특수(조립/사출/파이프/블랭/스탬)

---

## 1. 시트별 고정 양식

### 1-1. 생산성 집계
**헤더:** 13개월 롤링 컬럼 (11월…익12월)
- 월별 컬럼 = {YYYY-MM} 형식
- 당월({YYYY-MM})만 READ/WRITE 가능 — 과거 월은 Historical Lock 적용

**데이터 블록 (행별):**
1. **생산효율 (4항):** 직접인원(hrs), 표준시간(hrs), 종합생산성(%), 투입시간(hrs)
2. **인정비가동 (14항):** 일정, 재계획, 설비유지, 공구, 운영, 계획, 원료, 공급, 부품, 사훈, 교육, 회의, 기타, 휴가
3. **개선비가동 (17항):** 설비고장, 재설정, 서비스, 공정, 부품부, 수율, 기술, 구성, 재작업, 공급자결품, 부분가동, 기술개선, 신제품, 품질교육, 현장개선, 기타, 통제 제거
4. **Loss:** 손실 비율
5. **생산효율%:** = (직접인원 + 표준시간 + 종합생산성) / 투입시간 (근사)

**특징:**
- 읽기 : 당월 + 과거 12개월 (합계 13개월)
- 쓰기 : 당월({YYYY-MM}) 컬럼만
- 과거 월 값 ≠ DB → history_drift 경고 + Historical Lock 절차

### 1-2. 검수수불 (검수부 기초)
**구조 (per-part):**

| 블록 | 항목 | 설명 |
|------|------|------|
| **기초** | 기초수량, 기초가 | 월초 재고 |
| **출하** | 당월출하, 출하가 | 월간 판매 |
| **검수** | 당월검수, 검수가, 기말수량, 기말가 | 월간 검수 + 기말장부 |
| **실사차이** | 실사수량, 수량차이, 사유 | 물리 실사 vs 장부 |
| **제품수불** | a기초, Rejection, b기말, 출하 | 제품 수불 블록 |
| **Actual vs BP** | 실제 vs 예산가 | 원가 비교 |

**기본 검증 공식:**
- `기말장부 = 기초 + 당월출하 − 당월검수` ← **stock_balance** 검증

**외부참조 주의:**
- 원재료수불부 (external ref)
- L3939-검수수불 (external ref)
- 미해석 external ref → warn "external_ref_unresolved", 값 고정 처리 권장

**환율:** 약 0.0155 (USD/INR)

### 1-3. PRODUCTIVITY 시트
**공식:**
- `PRODUCTIVITY% = production / MAN-HR`
- `IF(MAN-HR=0, 0, production/MAN-HR)`

**참조:**
- PLAN HR = PPC PLAN line sum
- MAN HR = MANPOWER line sum

### 1-4. PPC PLAN (3시스템 공통 허브)
**헤더:**
| CAR | MODEL | PART NAME | PART NO | VARIANT | PLAN QTY | DAY | OPT(%) | CYCLE TIME (Hrs) | CYCLE TIME (Sec) |
|-----|-------|-----------|---------|---------|----------|-----|--------|------------------|------------------|
| … | … | … | … | … | … | … | … | CO2/SUB/PROJ/PRESS | CO2/SUB/PROJ/PRESS |

**특징:**
- 당월 생산 계획 (PLAN QTY)
- 3시스템 조인 키: (plant, period, PART NO)
- 생산성, 경비, 자재BOM 모두 이 PPC PLAN을 참조

### 1-5. 라인 CAPA 템플릿 (23개 시트 공통)
**행1:** `{CAR} {PART} - CAPA` (제목)

**상수 행 (고정값):**
- Indirect ratio = 0.05
- Efficiency = 0.85

**컬럼 구조:**
```
PRO | MODEL | BASE | PRO | PROCESS | P/NO | P/NAME | FIG | QTY | 공정수 | Indirect
```

**Shift 블록 (1ST/2ND[/3RD] 또는 A01/A02):**
각 Shift마다:
```
타점수 | MC T(Machine Time) | Man T(Man Time) | 공정 T(Process Time)
```

**변형:**
- **PRO sheet** 추가 컬럼: M/C (기계)
- **P-P sheet** 추가 컬럼: U/S (Unit/Set)
- **BL/ST sheets** 1ST-only (1교대 단일) + 상호 cross-ref

---

## 2. 검증 규칙 (8가지)

| # | 규칙 | 내용 | 대상 |
|---|------|------|------|
| 1 | **stock_balance** | 기말장부 = 기초 + 출하 − 검수 (±오차 허용) | 검수수불 각 부품 |
| 2 | **physical_diff_reason** | 실사수량차이 ≠ 0 → 사유 필수 입력 | 검수수불 실사 블록 |
| 3 | **time_allocation_100** | 인정%+개선%+Loss%+생산효율% ≈ 1.0 (±0.001) | 생산성 집계 |
| 4 | **productivity_recalc** | 표준시간/투입시간 ≈ 종합생산성 (±0.001) | PRODUCTIVITY 시트 |
| 5 | **bp_diff(5%)** | \|Actual−BP\| > 5% 항목 리스트 | 검수수불 Actual vs BP |
| 6 | **manpower_consistency** | MANPOWER 라인합 = PRODUCTIVITY MAN-HR 기초 | MANPOWER ↔ PRODUCTIVITY |
| 7 | **plan_link** | PRODUCTIVITY PLAN HR = PPC PLAN line sum | PRODUCTIVITY ↔ PPC PLAN |
| 8 | **idle_source_match** | 생산성집계 idle 항목 = 02-IDLE 상세 합 | 생산성집계 ↔ 02-IDLE |

**데이터 정규화:**
- 시간(hr): 2소수점
- 비율(%): 4소수점
- P/NO 하이픈 표기 통일 (UPPERCASE)
- 차종명 정규화 (CODE 시트 기준)

---

## 3. 데이터 흐름

```
[PPC PLAN (공통 허브)]
 ├─→ [PRODUCTIVITY] — PLAN HR, MAN HR, production% 산출
 ├─→ [생산성 집계] — 효율, 가동률, 손실 집계
 │ ├─→ [02-IDLE] — 세부 가동 방해 사유 분류
 │ └─→ [MANPOWER] — 인원 배치 추적
 └─→ [검수수불] — 월간 재고/검수 추적
      ├─→ [경비 시스템] — supplier별 구매비 (별도 시스템)
      └─→ [자재 BOM] — 자재 소요량 (별도 시스템)

[라인 CAPA 23개] — 월 무관 마스터. 월간 파일은 계획 데이터만 참조.
```

---

## 4. JSON 스키마 (OUTPUT)

```json
{
 "productivity": {
 "plant": "Mannur", "period": "2026-06", "asOf": "2026-05-30",
 "summary": {
 "directHours": 0, "standardHours": 0, "overallProductivity": 0,
 "inputHours": 0, "productionEfficiency": 0
 },
 "idleBreakdown": {
 "recognizedIdle": [ {item: "일정", hours: 0, reason: ""} ],
 "improvementIdle": [ {item: "설비고장", hours: 0, reason: ""} ],
 "loss": 0
 },
 "manpower": [
 {line: "line-1", shift: "1ST", count: 0, hoursWorked: 0}
 ],
 "lineCapacity": [
 { car: "AI3", part: "FSB", sheetCode: "A-F",
 processes: [ {processNo: 1, mcTime: 0, manTime: 0} ],
 shifts: ["1ST", "2ND", "3RD"] }
 ],
 "ppcPlan": [ /* per-product plan rows */ ],
 "inventory": [
 { partNo: "88310-K3050", partName: "U/DSAB LH",
 opening: 0, sale: 0, inspection: 0, closing: 0,
 physicalDiff: 0, reason: "",
 actualPrice: 0, bpPrice: 0, priceDiff: 0 }
 ],
 "variance": { /* vs previous month */ },
 "validation": [
 { rule: "stock_balance", status: "ok", detail: "all parts ok" }
 ]
 }
}
```

---

## 5. ★ 적용 프롬프트

### 5-1. 메인 프롬프트 (월간 생산성 처리)

```
You process the DSC Mannur monthly productivity workbook. The file ALWAYS
has EXACTLY 32 sheets (7 output + 2 master + 23 line-CAPA). You MUST process
ALL — emit "layout_mismatch" fail if any is missing.

## MANDATORY SHEET SET (all 32, no skips)
- OUTPUT/AGGREGATE: 생산성 집계, 투입시간, 02-IDLE, MANPOWER, PRODUCTIVITY, MAN, 검수수불
- MASTER: CT기준정보, PPC PLAN
- LINE-CAPA (23): BN-R, PS, SP-F, S-R, SP-CCB, A-F, Q-R, Q-CCB, B-F, B-R,
  B-CCB, A-R, A-CCB, AS-CCB, H-F, H-R, BN-F, BN-CCB, SUB, PRO, P-P, BL, ST

## FIXED LAYOUT RULES
- 생산성 집계: 13-month rolling columns. READ/WRITE only {YYYY-MM} column.
  Blocks: 생산효율(4) → 인정비가동(14) → 개선비가동(17) → Loss → 생산효율%.
- 검수수불: per-part 5 blocks (기초→출하→검수→기말장부) + 실사(실사수량/차이/사유)
  + 제품수불(a기초/Rejection/b기말/출하) + Actual vs BP.
  Note: external refs (원재료수불부, L3939-검수수불) may exist.
  If unresolved, emit warn "external_ref_unresolved"; do NOT fabricate values.
- PRODUCTIVITY: PRO% = production / MAN-HR (IF(Q=0,0,Q/N)).
  PLAN HR = Σ PPC PLAN. MAN HR = Σ MANPOWER.
- PPC PLAN is the hub: references BL, CT기준정보, MAN, MANPOWER, PRO, PRODUCTIVITY, PS, ST, SUB.
- LINE-CAPA template (all 23): row1 title + consts(0.05 indirect, 0.85 efficiency);
  cols PRO|MODEL|BASE|PRO|PROCESS|P/NO|P/NAME|FIG|QTY|공정수|Indirect,
  then per-shift (1ST/2ND[/3RD] or A01/A02) blocks of 타점수|MC T|Man T|공정 T.
  Variants: PRO adds M/C; P-P adds U/S; BL/ST are 1ST-only, cross-ref each other.
  Map sheet→car: BN-*=BN7I, SP-/S-=SU2I, A-*/AS-=AI3, Q-*=QXI, B-*=BI3, H-*=HCI/AH2,
  PS=PS7I, SUB/PRO/P-P/BL/ST=special.

## TASKS
1) EXTRACT all 32 sheets into the JSON schema (section 4). For 23 line-CAPA, store
   under master.lineCapa[] with sheetCode + parsed processes[].
2) VALIDATE (status ok/warn/fail):
   a stock_balance: 기말장부 = 기초 + 출하 − 검수 (±tolerance) for all parts
   b physical_diff_reason: 수량차이≠0 → 사유 required
   c time_allocation_100: 인정%+개선%+Loss%+생산효율% ≈ 1.0 (±0.001)
   d productivity_recalc: 표준시간/투입시간 ≈ 종합생산성 (±0.001)
   e bp_diff(5%): list |Actual−BP| > 5%
   f manpower_consistency: MANPOWER sum = PRODUCTIVITY MAN-HR basis
   g plan_link: PRODUCTIVITY PLAN HR = PPC PLAN line sum
   h idle_source_match: 생산성집계 idle items = 02-IDLE detail sums
3) COMPARE to previous_month_json (skip if null): deltas for overallProductivity,
   productionEfficiency; per-item idle deltas (top 5 worsening); attribute each delta
   to evidence in THIS file (idle item / 사유 column / bp diff). NEVER invent a cause;
   if none, mark "사유 미기재 — 확인 필요".
4) OUTPUT only the JSON. Korean names preserved. Add narrative_ko (≤5 sentences).

## RULES
- All 32 sheets must appear in output (line-CAPA may be summarized but must be present/counted).
- If a sheet/column/ref is missing → validation fail "layout_mismatch".
- Ratios 4 decimals, hours 2 decimals. Reasons must trace to a file field. No fabrication.
- REPORTING dataset only; never modify master (CT/PPC/CAPA) values.
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
Render the productivity JSON as the FMS tree. Depth1 = period {YYYY-MM};
Depth2 = [Summary, Lines(CAPA), Resources(MANPOWER), Inventory+Validation, Plan(PPC),
Variance]; Depth3 = items. Keep a separate period-independent "Master" branch
(CT + 23 line-CAPA, grouped by car→part F/R/CCB). Validation children show
badges ok=green/warn=amber/fail=red. Variance shows MoM arrows (▲worse/▼better
for idle; reversed for productivity). Ensure all 23 line-CAPA sheets are listed
under Master (none omitted).
```

### 5-3. 검증 단독 프롬프트
```
Run ONLY the 8-rule validation block on this month's JSON and return
[{rule,status,detail,affected_rows}]: stock_balance, physical_diff_reason,
time_allocation_100, productivity_recalc, bp_diff(5%), manpower_consistency,
plan_link, idle_source_match. fail/warn first.
```

---

## 6. 적용 순서

1. **양식 고정:** 입력셀(노란배경)과 수식셀 분리 표시 → 매월 입력셀만 갱신
2. **마스터 분리:** CT기준정보 + 라인CAPA 23시트를 별도 마스터 파일/버전으로
3. **월간 파일:** ① 생산성집계~검수수불 + ② PPC PLAN + ③ 월간 입력값
4. **프롬프트 5-1 실행:** 당월 파일 + 전월 JSON → 구조화 JSON
5. **검증 게이트(5-3):** 업로드 직후 자동 실행, fail이면 보고 확정 차단
6. **트리 적재(5-2):** JSON을 period 파티션으로 DB 적재 후 렌더

⚠️ **보고용 양식.** 실사용(현장 실시간) 데이터는 갱신주기·정합성 기준이 다르므로 본 트리의 Master/월간보고를 실사용 DB와 직접 연결하지 말고 별도 스키마로 두고 일배치 동기화 권장. 외부참조(원재료수불부, L3939-검수수불)는 원본에 숨은 시트/외부링크로 존재할 수 있으니 월간 파일 확정 전 링크 해제 또는 값 고정(paste-value) 처리 권장.

---

## 7. 월간 운영 사이클 (Ingestion Contract) — 매월 반복 절차

### 단계별 처리
```
① 당월 엑셀 업로드 (32시트 동일 양식)
② 프롬프트 5-1 실행
   입력: current_month_file + previous_month_json (FMS DB 조회)
   → {YYYY-MM} 월 컬럼만 읽음. 과거 월 데이터는 건드리지 않음.
③ 검증 게이트(5-3)
   fail 시 확정 차단 → 수정 후 재업로드
④ FMS DB UPSERT
   키: (plant, period)
   ★ 같은 월 재업로드 시 해당 period 파티션을 덮어쓴다 (중복 행 생성 금지)
⑤ 트리에 {YYYY-MM} 노드 자동 추가
   variance는 ②에서 이미 산출됨
```

### 규칙
- **Idempotent upsert:** 동일 (plant, period) 재처리 = 덮어쓰기
- **previous_month_json 누락:** variance 노드는 "전월 데이터 없음"으로 생성하되 나머지는 정상 처리
- **연간/추세 분석:** 프롬프트는 MoM 1개월만 비교. YTD·12개월 추세는 FMS DB 쿼리로 처리 (프롬프트에 N개월 JSON을 넣지 말 것)
- **History drift:** 생산성 집계의 13개월 롤링 컬럼 중 당월 외 컬럼 값이 전월 DB값과 다르면 warn "history_drift" — 자동수정 금지

---

## 8. ★ 과거 월 데이터 보호 원칙 (Historical Data Lock) — 절대 규칙

당월({YYYY-MM}) 파일에는 과거 월 데이터도 함께 들어있다(롤링 컬럼/연간 시트). 과거 월 값이 DB와 다르더라도 시스템은 절대 자동 수정하지 않는다.

### 동작 규칙

**READ-ONLY PAST:** 처리 대상은 오직 당월({YYYY-MM})뿐. 과거 월은 비교만 하고 쓰기 금지.

**DIFF 표기:** 과거 월 값 ≠ DB 값이면 차이 리포트만 생성:
```
[history_drift 감지]
 period: 2026-04 (전월)
 항목: 개선비가동-공급자결품
 DB 보관값: 426.20 Hr
 ↔️ 이번 파일값: 391.50 Hr
 차이: -34.70
 → DB값 유지 중. 수정이 필요하면 해당 월을 명시 승인 후 재처리하세요.
 [승인] [무시]
```

**기본값 = DB 유지:** 사용자가 아무 응답 안 하면 DB값이 정본(source of truth)으로 유지된다.

**승인 절차:**
- 사용자가 [승인]을 명시적으로 선택한 항목/월만 별도 재처리 잡으로 갱신
- 변경 전 값은 revision 이력으로 보존 (누가·언제·무엇을 승인했는지 기록)

**일괄 승인 금지:** 월 단위 전체 덮어쓰기 버튼을 두지 말 것. 항목 단위 확인이 원칙 (여러 항목이 동시에 다르면 조작 가능성 신호이므로 오히려 더 세밀히 확인).

### 프롬프트 추가 룰 (5-1 메인 프롬프트 RULES에 병합)
```
- HISTORICAL LOCK: Only {YYYY-MM} is writable. For any past period where the file
 value differs from previous DB values provided, DO NOT update or include the new
 value as data. Instead emit history_drift entries:
 {period, field, db_value, file_value, delta} and the question
 "과거 월 데이터가 파일과 다릅니다. 수정이 필요합니까?" Default = keep DB value.
 Never apply past-period changes without an explicit per-item approval flag
 (approved_corrections[] passed in a separate, subsequent run).
```

---

## 9. 3시스템 통합 구조 (PPC PLAN 중심)

```
 ┌─────────── PPC PLAN (공통 허브) ───────────┐
 │ key: (plant, period, PART NO) │
 생산성(본건) ───┤ 생산계획·CYCLE TIME → 생산량·생산성 │
 경비 시스템 ───┤ SUPPLIER → 부자재/구매 비용 │
 자재 BOM ───┤ PLAN QTY × U/S × OPT → REQ QTY·발주·위치 │
 └────────────────────────────────────────────┘
```

**원단위 KPI:**
- (자재 REQ QTY) ÷ (생산성 생산량) = 생산량당 자재 소요 → 변동 추적

**비용 연결:**
- BOM SUPPLIER ↔️ 경비 3.x 공급사 → 계획 발주액 vs 실제 비용 대조

**품번 정합:**
- BOM P/NO ↔️ 생산성 검수수불 P/NO → 계획 소요 vs 실제 수불 대조

**교차 KPI (별도 프롬프트):**
- 원단위, 계획정확도, 발주충실도, 단위원가 → FMS_통합_CrossSystem_프롬프트.md에서 산출

---

## 변경 이력

- **2026-06-13 21:55 KST** — 명세 작성. Canonical Keys 패치 + Historical Data Lock 규칙 명시.
