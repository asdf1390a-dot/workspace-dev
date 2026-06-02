---
name: 프로젝트 관리 보고 규칙 (완전 자동화)
description: 매일/주/월 정기 보고 + 프로젝트 시작/완료 보고 + 앱 대시보드 관리
type: feedback
status: active
---

# 프로젝트 관리 보고 규칙 (2026-05-20 확정)

## 1️⃣ 정기 보고 (자동화)

### 매일 (Daily Report)
- **시간:** 18:00 KST (일일 최종 체크)
- **형식:** 프로젝트별 진행률 + 블로킹 + 완료 항목
- **보고처:** Telegram (한국어)
- **범위:** 모든 활성 프로젝트 (🟡진행중 상태만)

### 매주 (Weekly Report)
- **시간:** 매주 금요일 17:00 KST
- **형식:** 주간 목표 달성도 + 완료 프로젝트 + 위험 요소
- **보고처:** Telegram (한국어) + DSC FMS 앱 (대시보드)
- **범위:** 주간 계획된 모든 프로젝트

### 매월 (Monthly Report)
- **시간:** 매월 말일 16:00 KST
- **형식:** 월간 완료 프로젝트 + KPI + 다음달 예정
- **보고처:** Telegram (한국어) + DSC FMS 앱 (통계)
- **범위:** 전체 프로젝트 (완료/진행/예정)

---

## 2️⃣ 프로젝트 라이프사이클 보고

### A. 프로젝트 시작 보고서
**언제:** 프로젝트 정식 시작 시점

**포함 항목:**
- 📌 프로젝트명 + 코드
- 🎯 시작 이유 (사업 목적)
- 📅 예정 기간
- 👥 담당자
- 💰 예산/리소스
- 📊 성공 기준

**형식:** Markdown + 메모리 저장 + 앱에 자동 등록

### B. 프로젝트 완료 보고서
**언제:** 프로젝트 완료 시점 (설계/개발/배포)

**포함 항목:**
- 📌 프로젝트명 + 코드
- 🎯 목표 vs 최종 결과 비교
- 📅 실제 소요 기간 (계획 대비)
- 📦 산출물 목록
- ✅ 검증 결과
- 🔄 다음 단계 (있으면)

**형식:** Markdown + 메모리 저장 + 앱에 자동 등록

---

## 3️⃣ DSC FMS 앱 대시보드 (신규 개발)

### 메뉴 구조
```
개인이력 (Personal Dashboard)
 └─ 프로젝트 관리 (Project Management) [NEW]
    ├─ 📊 현황판 (Overview)
    │  ├─ 활성 프로젝트 (5개)
    │  ├─ 이번주 목표 (6개)
    │  └─ 월간 KPI
    │
    ├─ 📅 일일 보고 (Daily Reports)
    │  └─ 날짜별 진행 기록 (과거 90일)
    │
    ├─ 📅 주간 보고 (Weekly Reports)
    │  └─ 주차별 요약 (과거 12주)
    │
    ├─ 📊 월간 보고 (Monthly Reports)
    │  └─ 월별 분석 (과거 12개월)
    │
    ├─ 🚀 프로젝트 목록 (Projects)
    │  ├─ 시작 보고서 (프로젝트별)
    │  ├─ 진행 현황 (Timeline)
    │  └─ 완료 보고서 (Archive)
    │
    └─ 📈 통계 (Analytics)
       ├─ 완료율 추이
       ├─ 평균 소요시간
       └─ 카테고리별 분포
```

### 카테고리 구분
- **활성 (Active):** 진행중 🟡
- **완료 (Completed):** 완료됨 🟢
- **예정 (Planned):** 계획 중 🔴
- **아카이브 (Archive):** 과거 프로젝트

---

## 4️⃣ 자동화 프로세스

### Cron Jobs (자동 생성)
1. **매일 18:00:** 일일 현황 보고서 생성 + Telegram 전송
2. **매주 금 17:00:** 주간 보고서 생성 + 앱 대시보드 업데이트
3. **매월 말 16:00:** 월간 보고서 생성 + 통계 집계

### 자동 등록
- 프로젝트 시작 → 앱에 자동 등록 (시작 보고서)
- 프로젝트 완료 → 앱에 자동 등록 (완료 보고서)
- 정기 보고서 → 앱 대시보드에 즉시 반영

---

## 5️⃣ 보고서 저장 구조

### 메모리 (GitHub)
```
memory/
 ├─ project_daily_reports/
 │  ├─ 2026-05-20.md
 │  └─ 2026-05-21.md
 ├─ project_weekly_reports/
 │  ├─ 2026-W20.md
 │  └─ 2026-W21.md
 ├─ project_monthly_reports/
 │  ├─ 2026-05.md
 │  └─ 2026-06.md
 └─ project_lifecycle/
    ├─ [PROJECT_CODE]_START_REPORT.md
    └─ [PROJECT_CODE]_COMPLETION_REPORT.md
```

### 앱 DB (Supabase)
```
projects_lifecycle (신규 테이블)
 ├─ project_id
 ├─ project_name
 ├─ start_date
 ├─ planned_end_date
 ├─ actual_end_date
 ├─ status (active/completed/planned)
 ├─ start_report (JSON)
 ├─ completion_report (JSON)
 └─ category (asset/backup/travel/discord/bm)

project_daily_reports (신규 테이블)
 ├─ report_date
 ├─ project_id
 ├─ progress_pct
 ├─ blockers
 └─ completed_items

project_monthly_analytics (신규 테이블)
 ├─ report_month
 ├─ total_projects
 ├─ completed_count
 ├─ completion_rate
 └─ avg_duration_days
```

---

## ✅ 규칙 적용 체크리스트

### 즉시 (Week 1)
- [ ] 일일/주간/월간 보고서 양식 최종화
- [ ] 프로젝트 시작/완료 보고서 템플릿 확정
- [ ] Cron jobs 설정 (매일 18:00, 매주 금 17:00, 매월 말 16:00)

### 단기 (Week 2-3)
- [ ] DSC FMS 앱 DB 3개 테이블 추가 (migrations)
- [ ] 앱 대시보드 UI 개발 (6개 탭)
- [ ] API 3개 추가 (daily/weekly/monthly reports)

### 완료
- [ ] 프로젝트 관리 대시보드 배포 (2026-06-10 예정)
- [ ] 과거 5개 프로젝트 데이터 마이그레이션

---

**Why:** 프로젝트 진행 상황을 체계적으로 추적하고, 완료 기준을 명확히 하며, 이해관계자에게 정기적으로 투명하게 보고하기 위함

**How to apply:** 모든 프로젝트는 이 규칙에 따라 시작/완료보고서를 작성하고, 정기 보고서는 자동화된 Cron으로 생성하며, DSC FMS 앱 대시보드에 통합 관리
