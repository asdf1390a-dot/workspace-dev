# DSC Mannur — 주간업무보고 템플릿 v1.0
# Weekly KPI Report Template — 4개 부서

**적용 기준:** 2026-05-27 확정  
**보고 주기:** 매주 월요일 09:00 KST 자동 생성  
**데이터 소스:** Supabase DSC FMS (`https://pzkvhomhztikhkgwgqzr.supabase.co`)  
**작성 방식:** 자동(Auto) + 수동(Manual) 혼합

---

## 헤더

| 항목 | 값 |
|------|----|
| 공장 | DSC Mannur, Chennai |
| 작성자 | [자동: 시스템 / CEO 검토] |
| 보고 기간 | {{WEEK_LABEL}} ({{START_DATE}} ~ {{END_DATE}}) |
| 생성 일시 | {{GENERATED_AT}} KST |
| 데이터 기준 | {{SNAPSHOT_TIMESTAMP}} |

---

## 1. 보전부 (Maintenance Department)

**자동 추출 가능 (Auto): 5개 / 수동 입력 필요 (Manual): 2개**

| # | KPI | 단위 | 계획 | 결과 | 달성률 | 전주 대비 | 입력 방식 | 데이터 소스 |
|---|-----|------|------|------|--------|-----------|-----------|-------------|
| 1 | MTTR (평균수리시간) | 분 | ≤ 30 | {{BM_MTTR_WEEK}} | {{BM_MTTR_ACH}}% | {{BM_MTTR_WOW}} | Auto | `bm_kpi` |
| 2 | MTBF (평균고장간격) | 시간 | ≥ 720 | {{BM_MTBF_WEEK}} | {{BM_MTBF_ACH}}% | {{BM_MTBF_WOW}} | Auto | `bm_kpi` |
| 3 | 주간 고장건수 (BM Count) | 건 | ≤ 15 | {{BM_COUNT_WEEK}} | {{BM_COUNT_ACH}}% | {{BM_COUNT_WOW}} | Auto | `bm_events` |
| 4 | 총 다운타임 | 분 | ≤ 500 | {{BM_DOWNTIME_WEEK}} | {{BM_DT_ACH}}% | {{BM_DT_WOW}} | Auto | `bm_events` |
| 5 | PM 달성률 | % | 100 | {{PM_ACH_WEEK}} | {{PM_ACH_WEEK}}% | {{PM_ACH_WOW}} | Auto | `pm_plan_summary` |
| 6 | PM 미완료/지연건수 | 건 | 0 | {{PM_OVERDUE_WEEK}} | — | {{PM_OVD_WOW}} | Auto | `pm_plan_summary` |
| 7 | 예비부품 소진율 | % | — | {{SPARE_USAGE_WEEK}} | — | — | **Manual** | 별도 입력 |

**비고:** {{BM_NOTES}}

---

## 2. 생산부 (Production Department)

**자동 추출 가능 (Auto): 1개 / 수동 입력 필요 (Manual): 6개**

> 현재 Supabase에 생산량/OEE 실적 테이블 없음.  
> `kpi_actuals` 테이블이 존재하나 데이터 미입력 상태.  
> Phase 2에서 `kpi_actuals` 테이블 활용 자동화 예정.

| # | KPI | 단위 | 계획 | 결과 | 달성률 | 전주 대비 | 입력 방식 | 데이터 소스 |
|---|-----|------|------|------|--------|-----------|-----------|-------------|
| 1 | 생산량 (Production Volume) | EA | {{PROD_PLAN}} | {{PROD_ACTUAL}} | {{PROD_ACH}}% | {{PROD_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 2 | OEE (설비종합효율) | % | 85 | {{OEE_ACTUAL}} | {{OEE_ACH}}% | {{OEE_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 3 | 계획달성률 | % | 100 | {{PLAN_ACH}} | {{PLAN_ACH}}% | {{PLAN_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 4 | 라인별 가동률 (Availability) | % | 90 | {{AVAIL_ACTUAL}} | {{AVAIL_ACH}}% | {{AVAIL_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 5 | 불량률 (Defect Rate) | PPM | ≤ 500 | {{DEFECT_PPM}} | {{DEFECT_ACH}}% | {{DEFECT_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 6 | 고객반품 | 건 | 0 | {{RETURN_COUNT}} | — | {{RETURN_WOW}} | **Manual** | `kpi_actuals` (입력 필요) |
| 7 | 라인정지 건수 | 건 | 0 | {{STOPPAGE_COUNT}} | — | {{STOP_WOW}} | Auto (Proxy) | `bm_events` (downtime > 60분) |

**비고:** {{PROD_NOTES}}

---

## 3. 기술부 (Engineering / Technical Department)

**자동 추출 가능 (Auto): 3개 / 수동 입력 필요 (Manual): 3개**

| # | KPI | 단위 | 계획 | 결과 | 달성률 | 전주 대비 | 입력 방식 | 데이터 소스 |
|---|-----|------|------|------|--------|-----------|-----------|-------------|
| 1 | 신규 자산 등록건수 | 건 | — | {{ASSET_NEW_WEEK}} | — | {{ASSET_NEW_WOW}} | Auto | `assets` (created_at) |
| 2 | 자산 정보 완성도 (QR 등록률) | % | 100 | {{QR_REG_RATE}} | {{QR_REG_ACH}}% | {{QR_WOW}} | Auto | `asset_qr_scans` |
| 3 | 총 자산 현황 (카테고리별) | 건 | — | {{ASSET_TOTAL}} | — | — | Auto | `assets` + `categories` |
| 4 | 금형/지그 예방보전 완료 | 건 | — | {{TOOL_PM_DONE}} | {{TOOL_PM_ACH}}% | {{TOOL_WOW}} | Auto | `pm_plan_summary` (09/10 class) |
| 5 | 개선 프로젝트 진행건수 | 건 | — | {{KAIZEN_COUNT}} | — | — | **Manual** | 별도 입력 |
| 6 | 기술획득 완료 건수 | 건 | — | {{TECH_ACQ_DONE}} | — | — | **Manual** | 별도 입력 |
| 7 | 설비 이력 등록 완료율 | % | 100 | {{ASSET_HIST_RATE}} | {{ASSET_HIST_ACH}}% | — | **Manual** | 별도 입력 |

**비고:** {{ENG_NOTES}}

---

## 4. 생산관리부 (Production Management Department)

**자동 추출 가능 (Auto): 2개 / 수동 입력 필요 (Manual): 4개**

| # | KPI | 단위 | 계획 | 결과 | 달성률 | 전주 대비 | 입력 방식 | 데이터 소스 |
|---|-----|------|------|------|--------|-----------|-----------|-------------|
| 1 | PM 정기점검 스케줄 준수율 | % | 100 | {{PM_SCHED_ACH}} | {{PM_SCHED_ACH}}% | {{PM_SCHED_WOW}} | Auto | `pm_plan_summary` |
| 2 | 주간 BM 이벤트 해결률 | % | 100 | {{BM_RESOLVE_RATE}} | {{BM_RESOLVE_ACH}}% | {{BM_RESOLVE_WOW}} | Auto | `bm_events` (resolved/total) |
| 3 | 재해건수 | 건 | 0 | {{ACCIDENT_COUNT}} | — | — | **Manual** | 별도 입력 |
| 4 | 아차사고 | 건 | — | {{NEAR_MISS_COUNT}} | — | — | **Manual** | 별도 입력 |
| 5 | 주간 비용집행률 | % | ≤ 100 | {{COST_RATE}} | — | — | **Manual** | 별도 입력 |
| 6 | 교육 이수율 | % | 100 | {{TRAINING_RATE}} | {{TRAINING_ACH}}% | — | **Manual** | 별도 입력 (Phase 2 자동화 예정) |

**비고:** {{PM_NOTES}}

---

## 5. 요약 성과지표 (Executive Summary)

| 부서 | 핵심지표 | 이번주 | 전주 | 목표 | 상태 |
|------|----------|--------|------|------|------|
| 보전 | MTTR (분) | {{BM_MTTR_WEEK}} | {{BM_MTTR_PREV}} | ≤ 30 | {{BM_MTTR_STATUS}} |
| 보전 | PM 달성률 | {{PM_ACH_WEEK}}% | {{PM_ACH_PREV}}% | 100% | {{PM_STATUS}} |
| 보전 | 주간 BM건수 | {{BM_COUNT_WEEK}} | {{BM_COUNT_PREV}} | ≤ 15 | {{BM_STATUS}} |
| 생산 | OEE | {{OEE_ACTUAL}}% | {{OEE_PREV}}% | ≥ 85% | {{OEE_STATUS}} |
| 생산 | 불량률 | {{DEFECT_PPM}} PPM | {{DEFECT_PREV}} | ≤ 500 | {{DEFECT_STATUS}} |
| 기술 | 자산 등록률 | {{QR_REG_RATE}}% | — | 100% | {{QR_STATUS}} |
| 생산관리 | BM 해결률 | {{BM_RESOLVE_RATE}}% | {{BM_RESOLVE_PREV}}% | 100% | {{RESOLVE_STATUS}} |
| 안전 | 재해건수 | {{ACCIDENT_COUNT}} | {{ACCIDENT_PREV}} | 0 | {{SAFETY_STATUS}} |

---

## 6. 주요 이슈 / 특이사항

### 이번 주 완료
{{COMPLETED_ITEMS}}

### 다음 주 계획
{{NEXT_WEEK_PLANS}}

### 이상치 경보 (자동 감지)
{{ANOMALY_ALERTS}}

---

## 7. 이상치 감지 기준 (Anomaly Detection Rules)

| 지표 | 경보 조건 | 심각도 |
|------|-----------|--------|
| MTTR | > 전주 대비 +50% 또는 > 60분 | HIGH |
| BM 건수 | > 전주 대비 +30% 또는 주간 > 25건 | HIGH |
| 다운타임 | > 1,500분/주 | CRITICAL |
| PM 달성률 | < 70% | HIGH |
| PM 지연 건수 | > 50건 | MEDIUM |
| OEE | < 75% | HIGH |
| 불량률 | > 1,000 PPM | HIGH |
| 고객반품 | ≥ 1건 | CRITICAL |

---

## 8. 자동/수동 지표 분류 요약

### 현재 자동 추출 가능 (11개)
| 지표 | 소스 테이블 | 쿼리 파일 |
|------|------------|-----------|
| MTTR, MTBF | `bm_kpi` | Q01, Q02 |
| BM 건수, 다운타임 | `bm_events` | Q03 |
| PM 달성률, 지연 | `pm_plan_summary` | Q04 |
| BM 해결률 | `bm_events` | Q05 |
| 신규 자산 등록 | `assets` | Q06 |
| 자산 QR 등록률 | `asset_qr_scans` | Q07 |
| 카테고리별 자산 현황 | `assets` + `categories` | Q08 |
| 금형/지그 PM | `pm_plan_summary` | Q09 |
| 라인정지 (Proxy) | `bm_events` (>60분) | Q10 |

### 수동 입력 필요 (13개) → Phase 2 자동화 대상
| 지표 | 필요 테이블/소스 | 우선순위 |
|------|----------------|---------|
| 생산량, OEE, 달성률 | `kpi_actuals` 데이터 입력 필요 | HIGH |
| 가동률 | `kpi_actuals` | HIGH |
| 불량률, 고객반품 | `kpi_actuals` | HIGH |
| 재해건수, 아차사고 | `kpi_actuals` (안전) | HIGH |
| 비용집행률 | ERP 연동 필요 | MEDIUM |
| 예비부품 소진율 | `spare_parts` 데이터 입력 필요 | MEDIUM |
| 개선 프로젝트 | `projects` 연동 필요 | MEDIUM |
| 기술획득 완료 | 별도 추적 필요 | LOW |
| 설비이력 완성도 | `assets` 커스텀 필드 | LOW |
| 교육 이수율 | LMS 연동 필요 | LOW |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-05-27 | 초안 완성 — 4개 부서, 자동/수동 분류, 이상치 기준 |
