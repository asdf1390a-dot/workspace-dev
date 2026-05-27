# DSC Mannur — 주간 KPI 리포트 자동화 Cron 설계서
# Weekly Report Cron Specification v1.0

**작성일:** 2026-05-27  
**적용 시스템:** Vercel (dsc-fms-portal) + Supabase  
**Deadline:** 2026-06-02 18:00 KST

---

## 1. 실행 일정

| 작업 | 스케줄 (Cron) | 시각 (KST) | 비고 |
|------|--------------|-----------|------|
| 주간 KPI 수집 & 리포트 생성 | `0 0 * * 1` | 월요일 09:00 | UTC 기준 `0 0 * * 1` = KST 09:00 |
| 이상치 감지 알림 (일간) | `30 0 * * *` | 매일 09:30 | 긴급 경보용 |
| 월간 추이 보고 | `0 1 1 * *` | 매월 1일 10:00 | 경영진 보고용 |

> Cron 표현식은 UTC 기준 (Vercel 표준). IST = UTC+5:30, KST = UTC+9.
> 주간 리포트 실행: 월요일 UTC 00:00 = KST 09:00 = IST 05:30

---

## 2. 시스템 아키텍처

```
[Vercel Cron]
    │
    ▼ (월요일 00:00 UTC)
[/api/cron/weekly-report]         ← Next.js API Route
    │
    ├─ 1. Supabase 쿼리 실행 (Q01~Q12)
    │      │
    │      └─ bm_events, bm_kpi, pm_plan_summary, assets, asset_qr_scans
    │
    ├─ 2. KPI 계산 & 이상치 감지
    │      │
    │      └─ MTTR, MTBF, BM건수, PM달성률, 자산현황, 해결률
    │
    ├─ 3. 리포트 생성 (Markdown → JSON)
    │      │
    │      └─ weekly_report_entries 테이블에 INSERT
    │
    ├─ 4. Telegram 알림 발송
    │      │
    │      └─ 요약 + 이상치 경보 → CEO 개인 채팅
    │
    └─ 5. 로그 기록
           │
           └─ weekly_auto_logs 테이블에 INSERT
```

---

## 3. API 엔드포인트 설계

### 3.1 주간 리포트 생성

```
POST /api/cron/weekly-report
Authorization: Bearer {CRON_SECRET}
```

**동작:**
1. 현재 날짜 기준 직전 주 (월~일) 계산
2. Q01~Q12 쿼리 Supabase REST API로 실행
3. KPI 집계 + 이상치 판정
4. `weekly_reports` 테이블 INSERT
5. `weekly_report_entries` 에 부서별 지표 INSERT
6. 이상치 발생 시 Telegram 즉시 알림
7. `weekly_auto_logs` 에 실행 결과 기록

**응답:**
```json
{
  "status": "success",
  "report_id": "uuid",
  "week": "2026-W22",
  "kpi_count": 11,
  "anomalies": 0,
  "telegram_sent": true,
  "generated_at": "2026-05-27T00:00:00Z"
}
```

### 3.2 이상치 감지 (일간)

```
POST /api/cron/kpi-anomaly-check
Authorization: Bearer {CRON_SECRET}
```

**동작:**
1. Q11 (이상치 감지 쿼리) 실행
2. HIGH/CRITICAL 경보 발생 시 즉시 Telegram 발송
3. `weekly_auto_logs` 에 결과 기록

### 3.3 수동 트리거 (개발/테스트용)

```
GET /api/reports/weekly?week=2026-W22&preview=true
Authorization: Bearer {SUPABASE_ANON_KEY}
```

---

## 4. Vercel 설정

### vercel.json 추가 항목

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/kpi-anomaly-check",
      "schedule": "30 0 * * *"
    },
    {
      "path": "/api/cron/monthly-report",
      "schedule": "0 1 1 * *"
    }
  ]
}
```

### 필요 환경변수 (Vercel Dashboard)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `CRON_SECRET` | (생성 필요) | Cron API 인증 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pzkvhomhztikhkgwgqzr.supabase.co` | DB 연결 |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase 대시보드) | 쓰기 권한 필요 |
| `TELEGRAM_BOT_TOKEN` | (기존 설정) | 알림 발송 |
| `TELEGRAM_CHAT_ID` | (CEO 채팅 ID) | 알림 수신 |

---

## 5. 데이터 흐름 상세

### 5.1 주간 날짜 범위 계산

```typescript
// KST 기준 직전 주 계산 (Asia/Kolkata ≈ IST, UTC+5:30)
// 실제 공장 위치: Chennai (IST)
const now = new Date();
const weekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // 이전 월요일
const weekEnd   = endOfWeek(subWeeks(now, 1),   { weekStartsOn: 1 }); // 이전 일요일
const weekLabel = `${format(weekStart, 'yyyy')}-W${getISOWeek(weekStart)}`;
```

### 5.2 자동 계산 KPI 목록

| 쿼리 | KPI | 소스 테이블 | 현재 데이터 유무 |
|------|-----|------------|----------------|
| Q01 | MTTR (주간 평균) | `bm_events` | ✅ 353건 실데이터 |
| Q02 | MTBF (월별) | `bm_kpi` | ✅ 집계뷰 존재 |
| Q03 | BM 건수, 다운타임 | `bm_events` | ✅ |
| Q04 | PM 달성률, 지연 | `pm_plan_summary` | ✅ 631건 |
| Q05 | BM 해결률 | `bm_events` | ✅ |
| Q06 | 신규 자산 | `assets` | ✅ 1,000건+ |
| Q07 | QR 등록률 | `asset_qr_scans` | ⚠️ 스캔 기록 확인 필요 |
| Q08 | 카테고리별 자산 | `assets` + `categories` | ✅ |
| Q09 | 금형/지그 PM | `pm_plan_summary` + `assets` | ✅ |
| Q10 | 라인정지 (Proxy) | `bm_events` | ✅ (60분 초과 기준) |
| Q11 | 이상치 감지 | `bm_events` + `pm_plan_summary` | ✅ |
| Q12 | 월간 추이 | `bm_events` | ✅ |

### 5.3 수동 입력 필요 KPI (Phase 2 자동화 대상)

| KPI | 현재 상태 | Phase 2 방안 |
|-----|-----------|-------------|
| 생산량, OEE, 계획달성률 | `kpi_actuals` 테이블 비어있음 | MES/생산시스템 연동 또는 API 입력 UI |
| 불량률, 고객반품 | `kpi_actuals` 없음 | 품질 시스템 연동 |
| 재해/아차사고 | 미추적 | 안전 모듈 추가 |
| 예비부품 소진율 | `spare_parts` 비어있음 | 재고 시스템 연동 |
| 교육 이수율 | 미추적 | `capability_scores` 활용 |

---

## 6. Telegram 알림 포맷

### 6.1 주간 요약 알림

```
📊 DSC Mannur 주간 KPI 보고 ({{WEEK_LABEL}})
──────────────────────────
🔧 보전부
  • BM 건수: {{BM_COUNT}}건  {{BM_COUNT_ARROW}}
  • MTTR: {{MTTR_MIN}}분  {{MTTR_ARROW}}
  • PM 달성률: {{PM_ACH}}%  {{PM_ACH_ARROW}}
  • 다운타임: {{DOWNTIME_MIN}}분
  
🏭 생산부
  • 생산량: {{PROD_ACTUAL}} / {{PROD_PLAN}} EA  {{PROD_ARROW}}
  • OEE: {{OEE}}%  {{OEE_ARROW}}
  • 불량률: {{DEFECT}}PPM

⚙️ 기술부
  • 자산 QR 등록률: {{QR_RATE}}%
  • 신규 자산: {{NEW_ASSETS}}건

🗂️ 생산관리
  • BM 해결률: {{RESOLVE_RATE}}%
  • 재해건수: {{ACCIDENT}}건

⚠️ 이상치: {{ANOMALY_COUNT}}건
──────────────────────────
자동 생성: {{GENERATED_AT}} KST
```

### 6.2 이상치 경보 알림

```
🚨 [KPI 이상치 감지] {{SEVERITY}}
──────────────────────────
항목: {{KPI_NAME}}
값: {{CURRENT_VALUE}}
임계값: {{THRESHOLD}}
전주 대비: {{WOW_CHANGE}}%
──────────────────────────
즉시 확인 필요
```

---

## 7. 에러 처리 & 복구

| 시나리오 | 처리 방법 |
|----------|-----------|
| Supabase 연결 실패 | 3회 재시도 (5초 간격) → Telegram 에러 알림 |
| 쿼리 타임아웃 (>30s) | 개별 쿼리 스킵 → 가용 KPI만 보고, 누락 표시 |
| Telegram 전송 실패 | 로그에만 기록, 리포트 생성은 계속 |
| 수동 KPI 미입력 | "수동 입력 대기" 표시 (N/A), 경보 없음 |
| 중복 실행 | `weekly_reports` 테이블에 week 컬럼 UNIQUE 제약으로 방지 |

---

## 8. 구현 일정 (Phase 2)

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2026-05-28 | Supabase `weekly_reports` + `weekly_report_entries` 스키마 확인 | 자동 |
| 2026-05-28 | `/api/cron/weekly-report` API Route 구현 | Web-Builder |
| 2026-05-29 | Q01~Q12 쿼리 연결 + KPI 계산 로직 | Web-Builder |
| 2026-05-30 | 이상치 감지 (Q11) + Telegram 알림 연동 | Web-Builder |
| 2026-05-31 | `vercel.json` Cron 등록 + 테스트 실행 | Web-Builder |
| 2026-06-01 | 수동 KPI 입력 UI (`/reports/weekly/input`) | Web-Builder |
| 2026-06-02 | 최종 검증 + Evaluator 3x 리뷰 | Evaluator |
| **2026-06-02 18:00** | **DEADLINE: 전체 시스템 라이브** | — |

---

## 9. 전제 조건 & 가정

1. **IST 기준 집계:** 공장 소재지 Chennai = IST(UTC+5:30). 쿼리에서 `AT TIME ZONE 'Asia/Kolkata'` 적용.
2. **주(Week) 정의:** ISO 8601 기준 (월요일 시작).
3. **생산 KPI 베이스라인:** `kpi_actuals` 테이블에 데이터 입력이 선행되어야 자동화 가능. 현재 수동 입력 UI 선행 필요.
4. **BM 해결률:** 현재 모든 353건이 `status=resolved` — 실시간 미해결 건이 생기면 자동 반영됨.
5. **PM 달성률:** `pm_plan_summary` 뷰는 이번 달 기준. 주간 PM 달성률은 별도 구현 필요 (현재 Q04는 월 기준).
6. **보안:** Cron 엔드포인트는 `CRON_SECRET` Bearer 토큰 필수. Vercel Cron 호출만 허용.

---

**최종 업데이트:** 2026-05-27  
**다음 단계:** Phase 2 구현 착수 (2026-05-28)
