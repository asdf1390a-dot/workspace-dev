---
name: 자동화전문가 프로젝트 종합 로드맵
description: 3개 프로젝트 병렬 진행 + 일정 + 의존성 + 마일스톤 (2026-05-22 ~ 05-30)
type: project
status: confirmed
---

# 자동화전문가 프로젝트 종합 로드맵 (2026-05-19)

## 🎯 전체 목표

신규 팀원(자동화전문가) 배정으로 3개 자동화 프로젝트를 **병렬 진행**하여 2026-05-30 1차 완료.  
**산출물:** 3개 완성 크론잡 (검증됨, 배포 가능), 운영 가이드

---

## 📅 타임라인 (8일)

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Day 1-2     │ Day 3        │ Day 4        │ Day 5        │ Day 6-8      │
│ 환경설정    │ Project 1    │ Project 1    │ Project 2    │ Project 2-3  │
│ 기초학습    │ 설계+구현    │ 완료+배포    │ 진행중       │ 진행중+완료  │
│ 2026-05-22~ │ 2026-05-24   │ 2026-05-25   │ 2026-05-26   │ 2026-05-27~  │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
  온보딩        P0 완료        P0 배포        P1 시작        P1-P2 병렬
```

---

## 🛠️ 각 프로젝트별 일정

### Project 1: 일일 경영실적 리포팅 (P0 🔴)
**기한:** 2026-05-23 | **할당:** 10시간

| 날짜 | 일정 | 상태 | 비고 |
|------|------|------|------|
| **2026-05-22** (Day 1) | 설계 시작 | 대기 | 스키마 검토, 쿼리 설계 |
| **2026-05-23** (Day 2) | 구현 + 테스트 | 진행중 | Supabase 쿼리, Telegram 포맷팅 |
| **2026-05-24** (Day 3) | 배포 + Cron 설정 | 완료 | Vercel Cron 등록, 실행 모니터링 |
| **2026-05-25~26** (Day 4-5) | 운영 모니터링 | 진행중 | 24시간 자동 실행 확인 |

**산출물:**
- ✅ `app/api/cron/daily-reporting/executive-summary/route.ts` (50줄)
- ✅ `lib/reporting/daily-executive-summary.ts` (200줄)
- ✅ `lib/reporting/anomaly-detection.ts` (100줄)
- ✅ 데이터 정제/검증 로직
- ✅ README (운영 가이드)

**의존성:**
- Supabase 환경변수 (이미 설정됨)
- Telegram Bot Token (이미 설정됨)
- 경영실적 테이블 스키마 (확인 필요)

---

### Project 2: GitHub/ProductHunt 정보 수집 (P1 🟡)
**기한:** 2026-05-27 | **할당:** 12시간

| 날짜 | 일정 | 상태 | 비고 |
|------|------|------|------|
| **2026-05-24** (Day 3) | 설계 시작 | 대기 | API 스펙 검토, Claude API 프롬프트 |
| **2026-05-25** (Day 4) | GitHub 통합 | 진행중 | REST API + 중복 제거 로직 |
| **2026-05-26** (Day 5) | AI 필터 + PH API | 진행중 | Claude 필터, ProductHunt GraphQL |
| **2026-05-27** (Day 6) | 배포 + Cron | 완료 | Vercel Cron 설정, 실행 로그 |

**산출물:**
- ✅ `app/api/cron/info-collection/github-trending/route.ts` (60줄)
- ✅ `app/api/cron/info-collection/product-hunt/route.ts` (60줄)
- ✅ `lib/info-collection/github-scraper.ts` (120줄)
- ✅ `lib/info-collection/ai-filter.ts` (150줄)
- ✅ `lib/info-collection/deduplication.ts` (80줄)
- ✅ DB 마이그레이션 (info_collected 테이블)
- ✅ README

**의존성:**
- GitHub API Token (생성 필요)
- Claude API Key (이미 설정됨)
- ProductHunt API (공개, 인증 불필요)

---

### Project 3: KPI 자동 통계 & 이상치 감시 (P1 🟡)
**기한:** 2026-05-30 | **할당:** 9시간

| 날짜 | 일정 | 상태 | 비고 |
|------|------|------|------|
| **2026-05-27** (Day 6) | 설계 시작 | 대기 | 통계 공식, 이상치 규칙 |
| **2026-05-28** (Day 7) | 쿼리 + 통계 | 진행중 | Supabase 쿼리, Z-score 계산 |
| **2026-05-29** (Day 8) | API + 배포 | 완료 | 대시보드 API, Cron 설정 |
| **2026-05-30** (Day 8+) | 통합 테스트 | 진행중 | 4주 데이터 시뮬레이션 |

**산출물:**
- ✅ `app/api/cron/kpi-analytics/weekly-report/route.ts` (80줄)
- ✅ `app/api/kpi-analytics/history/route.ts` (60줄)
- ✅ `lib/kpi/statistics.ts` (180줄)
- ✅ `lib/kpi/anomaly-detection.ts` (120줄)
- ✅ DB 마이그레이션 (kpi_history, anomaly_alerts 테이블)
- ✅ README

**의존성:**
- Asset Master, Backup, BM 테이블 (이미 존재)
- 이전 4주 데이터 (테스트용)

---

## 🔗 의존성 관계

```
┌──────────────────────────────────────┐
│ 온보딩 완료 (Day 1-2)                 │
│ - 환경변수 설정                       │
│ - GitHub 접속                        │
│ - Telegram Bot 테스트                │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼────────┐
        │ Project 1 시작   │
        │ (2026-05-23)    │
        └────────┬────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
┌───▼───────────────┐    ┌──────▼─────────────┐
│ Project 2 시작     │    │ Project 3 시작     │
│ (2026-05-27)      │    │ (2026-05-30)      │
└─────────┬─────────┘    └─────────┬──────────┘
          │                        │
    ┌─────▼──────────────┐    ┌────▼───────────────┐
    │ GitHub 스크래퍼    │    │ KPI 통계 계산      │
    │ + AI 필터         │    │ + 이상치 감지      │
    └─────┬──────────────┘    └────┬───────────────┘
          │                        │
    ┌─────▼──────────────────────▼────────┐
    │ 통합 테스트 & Vercel Cron 검증      │
    │ (2026-05-30, 최소 24시간)          │
    └──────────────────────────────────────┘
```

---

## 📊 시간 배분

| 프로젝트 | 설계 | 구현 | 테스트 | 문서 | 합계 |
|---------|------|------|--------|------|------|
| **Project 1** | 1h | 5h | 2h | 2h | **10h** |
| **Project 2** | 1.5h | 7h | 2.5h | 1h | **12h** |
| **Project 3** | 1h | 5h | 2h | 1h | **9h** |
| **온보딩 + 조율** | — | — | — | — | **~8h** |
| **총합** | **3.5h** | **17h** | **6.5h** | **4h** | **~39h** |

**할당량:** 31h/주 × 1.5주 = 46.5h 가용  
**사용율:** 39h / 46.5h = **84%** ✅

---

## 🎓 선행학습 (Day 1-2, 권장 8시간)

**Must-know (4시간):**
- [ ] Next.js API Routes (1h) — 기존 코드 리뷰
- [ ] Vercel Cron 구조 (1h) — ctb/realtime-update 분석
- [ ] Supabase 클라이언트 초기화 (1h) — service_role_key 사용
- [ ] Telegram Bot API (1h) — 메시지 포맷팅

**Optional (4시간):**
- [ ] TypeScript 고급 (1h)
- [ ] 에러 처리 패턴 (1h)
- [ ] 로깅 전략 (1h)
- [ ] 성능 최적화 (1h)

---

## 📋 성공 기준 (2026-05-30)

### Project 1 체크리스트
- [ ] 매일 14:00 정각 ± 2분 자동 실행
- [ ] Telegram 메시지 자동 배포 (편집 없음)
- [ ] 실행 로그 100% 저장 (cron_logs 테이블)
- [ ] 오류 시 대체 알림 (이메일)
- [ ] 24시간 테스트 통과 (4회 연속 성공)

### Project 2 체크리스트
- [ ] GitHub API 통합 (별 4k+ 항목 수집)
- [ ] ProductHunt API 통합 (상위 20개)
- [ ] AI 필터링 정확도 > 80% (수동 평가)
- [ ] 중복 제거 100% (Supabase 제약)
- [ ] Telegram 배포 (필터링 결과만)

### Project 3 체크리스트
- [ ] Asset, Backup, BM 데이터 집계
- [ ] 통계 정확도 > 99% (기존 대시보드와 비교)
- [ ] 이상치 감지 (Z-score >= 2.0σ)
- [ ] 대시보드 API 운영 (조회 가능)
- [ ] 매주 월요일 08:00 정각 자동 실행

### 코드 품질
- [ ] TypeScript strict mode 통과
- [ ] ESLint 통과 (에러 0, 경고 < 5)
- [ ] 테스트 커버리지 >= 70%
- [ ] 주석 + JSDoc (모든 public 함수)

### 문서
- [ ] 각 프로젝트별 README (구현, 운영, 트러블슈팅)
- [ ] 환경변수 설정 가이드
- [ ] 크론 스케줄 정보 (시간, 빈도, 역할)
- [ ] 모니터링 체크리스트

---

## 🚀 배포 순서

### Phase 1: Project 1 배포 (2026-05-24)
```bash
# 1. 로컬 테스트 (3회)
npm run test:cron:daily-reporting

# 2. Vercel 배포
git add app/api/cron/daily-reporting/
git commit -m "feat: daily reporting automation (P0)"
git push origin feature/daily-reporting
# PR merge 후

# 3. Vercel 환경변수 확인
vercel env list
# TELEGRAM_REPORTING_CHANNEL_ID, CRON_SECRET 확인

# 4. Cron 일정 설정 (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/daily-reporting/executive-summary",
      "schedule": "0 14 * * *"  // 매일 14:00 KST
    }
  ]
}

# 5. 배포 후 24시간 모니터링
tail -f logs/vercel-cron.log
```

### Phase 2: Project 2 배포 (2026-05-27)
```bash
git add app/api/cron/info-collection/
git commit -m "feat: github/producthunt info collection (P1)"
git push origin feature/info-collection
# PR merge 후

# Cron 일정 추가
{
  "path": "/api/cron/info-collection/github-trending",
  "schedule": "0 9 * * *"  // 매일 09:00 KST
}
```

### Phase 3: Project 3 배포 (2026-05-30)
```bash
git add app/api/cron/kpi-analytics/
git commit -m "feat: kpi analytics automation (P1)"
git push origin feature/kpi-analytics

# Cron 일정 추가
{
  "path": "/api/cron/kpi-analytics/weekly-report",
  "schedule": "0 8 * * 1"  // 매주 월요일 08:00 KST
}
```

---

## 📞 커뮤니케이션 계획

**정기 체크인:**
- 매일 14:00: 비서와 진행상황 공유 (Telegram)
- 매일 18:00: 일일 요약 (성공/실패/다음 목표)

**블로킹 아이템:**
- Supabase 스키마 불명확 → 즉시 비서에게 문의
- Telegram API 오류 → 평가자에게 협력 요청
- 배포 거절 → 웹개발자에게 협력 요청

**최종 핸드오프 (2026-05-31):**
- 3개 크론 운영 가이드 전달
- 모니터링 방법 설명
- 차기 프로젝트 (Phase 2, Backup/Travel 자동화) 논의

---

## 🎁 온보딩 패키지 문서

### 필수 읽을 자료
1. **automation_specialist_onboarding.md** — 온보딩 가이드 + 팀 구조
2. **project_daily_reporting_automation.md** — Project 1 상세 설계
3. **project_info_collection_automation.md** — Project 2 상세 설계
4. **project_kpi_analytics_automation.md** — Project 3 상세 설계
5. 기존 크론 코드 (ctb, weekly-reports, backups)

### 학습 자료
- Next.js 공식 문서: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Supabase 클라이언트: https://supabase.com/docs/reference/javascript/overview

### 팀 연락처
- **비서 (Secretary):** Project 관리, 온보딩 지원
- **웹개발자 (Web-Builder):** 배포, 인프라 지원
- **평가자 (Evaluator):** QA, 테스트 지원

---

## 📈 성과 목표 (KPI)

| 메트릭 | 목표 | 기준 |
|--------|------|------|
| **온보딩 완료율** | 100% | Day 2 오후 |
| **Project 1 완료율** | 100% | 2026-05-23 |
| **Project 2 완료율** | 100% | 2026-05-27 |
| **Project 3 완료율** | 100% | 2026-05-30 |
| **통합 테스트 통과율** | 100% | 자동화전문가 검증 |
| **코드 품질** | ESLint 통과, TypeScript strict | 배포 전 |
| **문서 완성도** | README + 운영 가이드 | 각 프로젝트별 |
| **팀 만족도** | > 4/5 | 최종 피드백 |

---

**최종 마일스톤:** 2026-05-30 18:00 KST
- 3개 프로젝트 완료
- 모든 크론 배포
- 운영 인수 (비서에게)
- 팀 핸드오프 회의

**다음 단계:** 2026-06-01 ~ 06-15
- Backup App Phase 2 자동화 (알림, 메트릭)
- Travel App 자동화 (영수증 파싱, 결재 추적)
- 기존 크론 최적화 (성능, 안정성)
