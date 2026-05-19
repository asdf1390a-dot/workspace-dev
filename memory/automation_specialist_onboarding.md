---
name: 자동화전문가 온보딩 패키지
description: 신규 팀원(자동화전문가) 온보딩 가이드 + 프로젝트 3개 로드맵 + 기술스택
type: onboarding
date: 2026-05-19
target_start: 2026-05-22
target_completion: 2026-05-30
---

# 자동화전문가 온보딩 패키지 (2026-05-19)

## 📋 역할 정의

**직급:** Automation Specialist (자동화전문가)  
**보고:** 비서 (Secretary Agent)  
**할당량:** 31시간/주  
**시작일:** 2026-05-22 (목)  
**1차 완료:** 2026-05-30 (금)

### 핵심 책임
- Vercel Cron 기반 자동화 크론잡 설계 & 구현
- 데이터 파이프라인 구축 (수집 → 검증 → 변환 → 배포)
- API 스케줄링 및 워크플로우 자동화
- 모니터링 & 알림 시스템 운영
- 기존 크론잡 (CTB, Weekly Reports, Backup) 최적화

---

## 🎯 프로젝트 3개 (병렬 진행)

### Project 1: 일일 경영실적 리포팅 자동화 ⭐ P0
**우선순위:** 🔴 CRITICAL  
**완료 목표:** 2026-05-23 (목)  
**시간 배분:** 10시간

#### 요구사항
- **대상 데이터:** 생산, 기술, 보전, 생산관리 4개 부서 경영지표
- **집계 시간:** 매일 14:00 KST (정오 스냅샷 기준)
- **배포:** Telegram #경영실적채널 자동 메시지
- **형식:** 
  - 부서별 요약 (KPI 3-5개/부서)
  - 전일 대비 변화율
  - 주간 누적 현황
  - 이상치 경고 (임계값 초과)

#### 구현 체크리스트
- [ ] Supabase 쿼리 설계 (경영실적 테이블 JOIN)
- [ ] 데이터 정제 로직 (NULL, 이상치 처리)
- [ ] 집계 공식 (분포도 최빈값, 이상치 판정)
- [ ] Telegram 메시지 포매팅 (마크다운 + 이모지)
- [ ] Vercel Cron 설정 (매일 14:00 KST)
- [ ] 로깅 & 실패 알림 (Telegram + 로그 DB)
- [ ] 테스트 (수동 3회 + 자동 검증)

#### API 경로
```
POST /api/cron/daily-reporting/executive-summary
Authorization: Bearer <CRON_SECRET>
```

#### 산출물
- `lib/reporting/daily-executive-summary.ts` (보고서 생성 로직)
- `app/api/cron/daily-reporting/executive-summary/route.ts` (크론 엔드포인트)
- `lib/reporting/kpi-formatter.ts` (KPI 포매팅)
- `lib/reporting/anomaly-detection.ts` (이상치 감지)

---

### Project 2: GitHub/ProductHunt 정보 수집 자동화 (P1)
**우선순위:** 🟡 HIGH  
**완료 목표:** 2026-05-27 (월)  
**시간 배분:** 12시간

#### 요구사항
- **데이터 소스:**
  - GitHub Trending (매일 자동 수집)
  - ProductHunt Daily (선택적)
  - Dev.to trending (선택적)
- **수집 시간:** 매일 09:00 KST
- **필터링:** DSC/제조/ERP/자동화 관련도 AI 판정
- **배포:** Telegram #정보채널 (관련도 > 0.6 항목만)
- **형식:**
  - 제목 + 간단 설명
  - GitHub 스타 수 / 포크 수
  - ProductHunt upvotes
  - 관련도 점수 (0.0 ~ 1.0)
  - 링크 (클릭 가능 형식)

#### 구현 체크리스트
- [ ] GitHub REST API 통합 (gh-trending wrapper)
- [ ] ProductHunt API 통합 (공개 피드)
- [ ] Dev.to API 통합 (선택사항)
- [ ] 데이터 검증 (중복 제거, 24h 캐싱)
- [ ] AI 필터 (Claude API로 관련도 점수 계산)
- [ ] Supabase 저장 (info_collected 테이블)
- [ ] Telegram 메시지 포매팅
- [ ] Vercel Cron 설정 (매일 09:00 KST)
- [ ] 오류 처리 (API 제한, 네트워크 실패)

#### API 경로
```
POST /api/cron/info-collection/github-trending
POST /api/cron/info-collection/product-hunt
Authorization: Bearer <CRON_SECRET>
```

#### 산출물
- `lib/info-collection/github-scraper.ts` (GitHub 수집)
- `lib/info-collection/product-hunt-scraper.ts` (PH 수집)
- `lib/info-collection/ai-filter.ts` (관련도 판정)
- `app/api/cron/info-collection/github-trending/route.ts`
- `app/api/cron/info-collection/product-hunt/route.ts`
- `db/migrations/info_collection_schema.sql` (테이블 추가)

---

### Project 3: KPI 자동 통계 & 이상치 감시 (P1)
**우선순위:** 🟡 HIGH  
**완료 목표:** 2026-05-30 (금)  
**시간 배분:** 9시간

#### 요구사항
- **모니터 대상:**
  1. Asset Master: 총 자산 수, 카테고리별 분포
  2. Backup App: 성공률, 평균 복구시간, 저장소 사용률
  3. BM (설비고장): 발생 건수, MTBF, MTTR, 부서별 분포
- **집계 주기:** 매주 월요일 08:00 KST (주간 통계)
- **분석 내용:**
  - 전주 대비 추세 (↑ ↓ →)
  - 이상치 패턴 (±2σ 벗어남)
  - 부서별 비교 (상위/하위 3개)
- **배포:** Telegram #KPI채널 + 대시보드 (UI에서 조회 가능)
- **경고 기준:**
  - Backup 성공률 < 95% → 🔴 긴급
  - BM 발생률 > 주간평균 + 2σ → 🟡 주의
  - Asset 변화율 > 5% → ℹ️ 정보

#### 구현 체크리스트
- [ ] 통계 공식 (평균, 표준편차, 추세선)
- [ ] Supabase 쿼리 (7일 데이터 윈도우)
- [ ] 이상치 감지 알고리즘 (Z-score 기반)
- [ ] 과거 데이터 저장 (kpi_history 테이블)
- [ ] 대시보드 API (주간 통계 조회)
- [ ] Telegram 메시지 생성 (차트 이모지 + 수치)
- [ ] Vercel Cron 설정 (매주 월요일 08:00 KST)

#### API 경로
```
POST /api/cron/kpi-analytics/weekly-report
GET /api/kpi-analytics/history?type=asset|backup|bm&weeks=4
Authorization: Bearer <CRON_SECRET>
```

#### 산출물
- `lib/kpi/statistics.ts` (통계 계산)
- `lib/kpi/anomaly-detection.ts` (이상치 판정)
- `app/api/cron/kpi-analytics/weekly-report/route.ts`
- `app/api/kpi-analytics/history/route.ts`
- `db/migrations/kpi_history_schema.sql`

---

## 📚 학습 자료 & 기초 기술

### 1. 기존 크론잡 구조 (참고)
- `app/api/cron/ctb/realtime-update/route.ts` — CTB 실시간 갱신 (Git 커밋 파싱)
- `app/api/cron/weekly-reports/generate/route.ts` — 주간 리포트 자동 생성
- `app/api/cron/backups/*/route.ts` — 3개 백업 크론 (스케줄, 정리, 메트릭)

**학습 포인트:**
- Vercel Cron 인증 (Authorization: Bearer <CRON_SECRET>)
- Supabase 클라이언트 초기화 (service_role_key 사용)
- 에러 처리 & 재시도 로직
- 로깅 DB 연동 (cron_logs 테이블)

### 2. 기술 스택

| 항목 | 선택 |
|------|------|
| **런타임** | Node.js 18+ (Vercel 기본) |
| **언어** | TypeScript |
| **프레임워크** | Next.js 14 (API Routes) |
| **데이터베이스** | Supabase PostgreSQL |
| **메시징** | Telegram Bot API |
| **외부 API** | GitHub REST, ProductHunt GraphQL |
| **환경변수** | `.env.local` (Vercel Secrets) |

### 3. 환경변수 (필수 설정)

```bash
# Cron 인증
CRON_SECRET=<32-char-alphanumeric>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg
TELEGRAM_REPORTING_CHANNEL_ID=-1001234567890
TELEGRAM_INFO_CHANNEL_ID=-1001234567890
TELEGRAM_KPI_CHANNEL_ID=-1001234567890

# GitHub (선택)
GITHUB_TOKEN=ghp_...

# ProductHunt (선택)
PRODUCT_HUNT_TOKEN=...
```

### 4. 데이터베이스 스키마 (사전 구성)

**필수 테이블:**
- `cron_logs` — 크론 실행 로그 (status, started_at, ended_at, error_msg)
- `info_collected` — 수집 정보 저장소 (source, title, url, relevance_score, collected_at)
- `kpi_history` — KPI 이력 (metric_type, value, asset_count, backup_success_rate, bm_count, week_start)

---

## 📅 온보딩 일정 (8일)

### Day 1-2: 환경 설정 & 기초 학습 (2026-05-22~23)
- [ ] GitHub 저장소 클론 및 로컬 셋업
- [ ] 환경변수 설정 및 Supabase 접속 확인
- [ ] 기존 크론 코드 (ctb, weekly-reports) 리뷰
- [ ] Telegram Bot 토큰 설정 및 테스트
- [ ] 슬랙/디스코드 팀 채널 입장

### Day 3: Project 1 설계 & 구현 (2026-05-24)
- [ ] 경영실적 쿼리 설계 (SQL + TypeScript)
- [ ] 데이터 정제 로직 작성
- [ ] Telegram 메시지 포매팅 구현
- [ ] 로컬 테스트 (수동 3회)
- [ ] Code review (비서)

### Day 4: Project 1 완료 & Project 2 시작 (2026-05-25)
- [ ] Project 1 배포 및 Vercel Cron 설정
- [ ] 실행 로그 모니터링 (첫 2회)
- [ ] Project 2: GitHub API 통합 설계
- [ ] AI 필터 (Claude API) 프로토타입

### Day 5: Project 2 진행중 (2026-05-26)
- [ ] GitHub 스크래퍼 완성
- [ ] ProductHunt API 통합
- [ ] AI 필터 미세조정 (테스트 데이터 10개)
- [ ] Telegram 메시지 포매팅

### Day 6: Project 2 완료 & Project 3 시작 (2026-05-27)
- [ ] Project 2 배포 및 Cron 설정
- [ ] 실행 로그 모니터링
- [ ] Project 3: 통계 공식 설계
- [ ] 이상치 감지 알고리즘 검증

### Day 7: Project 3 진행중 (2026-05-28)
- [ ] KPI 수집 쿼리 작성
- [ ] 대시보드 API 구현
- [ ] 이상치 경고 로직 완성
- [ ] 테스트 데이터 4주치 시뮬레이션

### Day 8: Project 3 완료 & 최종 검증 (2026-05-29~30)
- [ ] Project 3 배포 및 Cron 설정
- [ ] 3개 크론 통합 테스트 (모두 24시간 연속 모니터링)
- [ ] 문서 작성 (README + 운영 가이드)
- [ ] 팀 핸드오프 (비서에게 인수)

---

## 🎓 학습 경로 (우선순위)

### 필수 (Day 1-2)
1. Next.js API Routes 기초
2. Vercel Cron 작동 원리
3. Supabase 클라이언트 (service role)
4. Telegram Bot API

### 권장 (Day 3-5)
1. TypeScript 고급 (generic, utility types)
2. 데이터 검증 (zod, joi)
3. 에러 처리 및 재시도 패턴
4. 로깅 전략

### 심화 (Day 6-8)
1. 통계 및 시계열 분석
2. 이상치 감지 알고리즘
3. 캐싱 전략 (Redis 고려)
4. 성능 최적화

---

## 👥 팀 연락처

| 역할 | 이름 | Telegram | 담당 |
|------|------|----------|------|
| **비서** | Claude Bot | @jeepney_secretary | 프로젝트 관리, 온보딩 |
| **평가자** | Evaluator | TBD | 테스트 & QA 검증 |
| **웹개발자** | Web-Builder | TBD | 배포 & 인프라 |

---

## 📊 성공 기준 (2026-05-30)

| 항목 | 기준 | 검증방법 |
|------|------|----------|
| **프로젝트 1** | 14:00 정각 배포, 실행율 100% | Vercel 로그 + Telegram 메시지 확인 |
| **프로젝트 2** | 09:00 정각 배포, 필터링 정확도 > 80% | 수동 평가 (10개 샘플) |
| **프로젝트 3** | 매주 월요일 08:00 배포, 통계 일치 > 99% | 기존 대시보드와 비교 |
| **코드 품질** | TypeScript strict mode, 테스트 80% 커버리지 | ESLint + 테스트 실행 |
| **문서** | README 작성, 운영 가이드 제공 | 문서 검수 (비서) |

---

**온보딩 완료 후:** 팀 미팅에서 경과 및 개선안 공유, 다음 프로젝트 (Phase 2, Backup/Travel 자동화) 논의
