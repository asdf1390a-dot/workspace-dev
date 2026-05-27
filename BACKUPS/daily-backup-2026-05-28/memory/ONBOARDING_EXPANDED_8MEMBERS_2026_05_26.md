---
name: 신규 8명 온보딩 확장 패키지
description: Phase A/B/C 신규 8명 (3 Web-Builders, 3 Evaluators, 1 Data-Analyst, 1 Automation) 온보딩 완전 매뉴얼
type: system
date: 2026-05-26
owner: Secretary AI (C-3PO)
originSessionId: 742e11d6-7970-4484-afe1-d969f32e4ac1
---

# 신규 8명 온보딩 확장 패키지 (2026-05-26)

**목표:** Phase A (5/26~5/30) → Phase B (5/29~6/02) → Phase C (6/03~6/10) 순차 온보딩  
**성과:** 15명 팀 완전 가동 + 4프로젝트 병렬 실행 + 신뢰도 95% 유지

---

## 🎯 온보딩 일정 타임라인

### Phase A (2026-05-26 ~ 5/30): Data-Analyst #5만 시작
```
2026-05-26 09:00 ~ 10:00  | Welcome Briefing #5 (Data-Analyst)
2026-05-26 14:00          | Asset Master Design Review (Web-Builder 주도)
2026-05-27 09:00 ~ 10:00  | SQL/분석 도구 환경 설정 (Automation 주도)
2026-05-28 14:00          | Phase A 평가: Go/No-Go (CEO 최종 승인)
```

### Phase B (2026-05-29 ~ 6/02): Web-Builder #1,#2,#3 + Evaluator #6,#7 시작
```
2026-05-29 09:00 | Welcome Briefing #1, #2 (Web-Builder)
2026-05-30 09:00 | Welcome Briefing #3 (Web-Builder 예비)
2026-05-31 09:00 | Welcome Briefing #6, #7 (Evaluator)
2026-06-01 14:00 | Phase B 중간 평가 (CEO 확인)
2026-06-02 18:00 | Phase B 완료: 모두 독립 운영
```

### Phase C (2026-06-03 ~ 6/10): Evaluator #8 + Automation #4 시작
```
2026-06-03 09:00 | Welcome Briefing #8 (Evaluator), #4 (Automation)
2026-06-05 14:00 | Phase C 중간 평가
2026-06-10 18:00 | Phase C 완료: 15명 팀 완전 가동
```

---

## 📚 필수 공통 학습 자료 (모두)

### 1단계: 팀 구조 & 기본 이해 (1시간)

**필독 문서:**
- `FINAL_TEAM_STRUCTURE_2026_05_26.md` (20분)
  - 15명 팀 구성, 각자의 역할 이해
  - 4프로젝트 병렬 Lane 구조
  
- `PARALLEL_PROCESSING_SYSTEM_ARCHITECTURE.md` (20분)
  - Lane 기반 의존도 관리
  - 각 프로젝트 일정 개요
  
- `PROJECT_EXECUTION_ROADMAP_2026_05_26.md` (20분)
  - 5/26~6/10 일일 마일스톤
  - 본인이 담당할 Lane 확인

### 2단계: 팀 운영 규칙 (30분)

**필독:**
- `feedback_core_autonomous_operation.md` (5분) — 컨펌 없이 즉시 진행 + 자율성
- `feedback_absolute_task_completion_rule.md` (5분) — Task 끝까지 소유 + 결과물 중심 완료
- `feedback_status_reporting_format.md` (5분) — 🟢🟡🔴 고정 형식
- `protocol_execution_system.md` (5분) — 5개 Cron + 자동화 규칙

### 3단계: 역할별 심화 학습 (2~3시간)

---

## 👤 Phase A: Data-Analyst #5 (5/26~5/30)

### Day 1 (5/26): Welcome & Setup
**09:00 ~ 10:00 Welcome Briefing**
- [ ] Team Structure 읽기 완료
- [ ] GitHub 계정 설정 + 저장소 접근
- [ ] Discord #일반채널 참여
- [ ] Telegram 봇 등록
- [ ] 첫 과제 할당 받기

**14:00 ~ 16:00 Asset Master Design Review**
- [ ] 설계 문서 읽기 시작
- [ ] 16개 MVP API 명세 스캔
- [ ] DB 스키마 이해 (assets, categories, history)

### Day 2 (5/27): Learning & Tools Setup
**09:00 ~ 10:00 SQL/분석 도구 환경**
- [ ] Supabase 접근 권한 설정
- [ ] SQL 쿼리 작성 환경 확인
- [ ] 506개 자산 데이터 구조 파악

**10:00 ~ 12:00 Asset Master API 리뷰**
- [ ] GET /api/assets 명세
- [ ] POST /api/assets/search (FTS) 이해
- [ ] API 응답 형식 확인

**14:00 Daily Standup**
- 첫 분석 과제 받기

### Day 3 (5/28): First Task & Evaluation
**09:00 ~ 13:00 첫 과제: 자산 분석 계획 수립**
- [ ] 506개 자산 분포도 분석
- [ ] 카테고리별 자산 수량 집계
- [ ] 자산 활용도 분석 (활성/비활성)
- [ ] 월별 추가 자산 추이 예측
- 산출물: 분석 계획서 (문서 + 차트)

**14:00 Phase A 평가 (CEO)**
- Go/No-Go 결정
- 예: "독립적으로 분석 과제 처리 가능" → Go → Phase B 진행

### 필독 자료
```
1. ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md (1시간)
   - 16개 MVP API 명세
   - DB 스키마: assets, categories, history, subcategories
   - API 우선순위 + 성능 목표

2. Asset Master API v1 (30분)
   - CRUD 엔드포인트
   - 쿼리 파라미터 (필터, 정렬, 페이지)
   - 응답 형식

3. Asset Master Phase A Rules (15분)
   - 506개 자산 관리 방식
   - 일일 15:00 진도 리포트 규칙
```

---

## 👥 Phase B: Web-Builder #1,#2,#3 + Evaluator #6,#7 (5/29~6/02)

### Web-Builder #1 (Travel Management P2 리더)

**Day 1 (5/29): Welcome & Design Review**
- [ ] Team Structure 읽기
- [ ] Travel Phase 2 설계 문서 (1.5시간)
  - 13일 개발 계획
  - 9개 컴포넌트 구조 (List, Form, Status, Voucher Parser, etc.)
  - 상태 관리 패턴 (React Context vs Zustand)
- [ ] GitHub 저장소 접근 + 기존 코드 스캔

**Day 2 (5/30): Code Setup & First Feature**
- [ ] 개발 환경 설정 (Next.js 14 + Supabase + Vercel)
- [ ] 첫 컴포넌트 구현: Travel 항목 리스트
  - 타입 정의 (TypeScript)
  - 스타일 (Tailwind CSS)
  - 상태 필터 (신청/승인/거절/완료)

**Day 3-4 (5/31~6/01): 독립 개발 시작**
- Travel Form, Status Badge, Voucher Parser 등
- Daily Standup 100% 참여
- Code Review 1회 통과

**Day 5 (6/02): 평가 & 완료**
- 주간 3~4개 기능 완료 확인
- 독립 운영 가능 판정

**필독:**
```
1. Travel Management Phase 2 UI Plan (1.5시간)
2. Travel Management Phase 1 API (1시간)
3. Work History Package (1시간)
```

### Web-Builder #2 (Team Dashboard P2)

**Day 1 (5/29): Welcome & Design**
- [ ] Team Structure
- [ ] Team Dashboard Phase 2 설계 (1시간)
  - 조직도 컴포넌트 (CEO → 팀원 계층)
  - 프로젝트 포트폴리오 그리드
  - 완료 이력 추적 타임라인
  - 메트릭 대시보드

**Day 2-4 (5/30~6/01): 개발**
- 조직도 컴포넌트 → 포트폴리오 그리드 → 타임라인
- Code Review 중심

**Day 5 (6/02): 평가**

**필독:**
```
1. project_team_dashboard.md (1시간)
2. CEO_UNIFIED_DASHBOARD_SPEC.md (1시간)
3. Work History Package (1시간)
```

### Web-Builder #3 (Backup Phase 2 예비)

**비활성 상태 (예비 리소스)**
- 할당 가능할 경우 Backup Phase 2 추가 컴포넌트 담당
- Onboarding: #1, #2와 동일

**필독:**
```
1. project_backup_app_ui_design_system.md
2. Backup Phase 2 Scope
```

### Evaluator #6 (Asset Master P2 QA 리더)

**Day 1 (5/31): Welcome & QA Framework**
- [ ] Team Structure
- [ ] Asset Master Phase 2 설계 (1시간)
  - API 응답 시간 기준 (<150ms)
  - 테스트 커버리지 기준 (>80%)
  - 성능 테스트 시나리오
  - 버그 분류 기준 (P0/P1/P2/P3)

**Day 2-4 (6/01~6/02): QA 체크리스트 작성 & 검수**
- Asset Master API 성능 테스트
- 에러 처리 시나리오
- 데이터 검증 규칙

**필독:**
```
1. ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md
2. 설계 문서 체크리스트 (기존 Evaluator 참고)
3. CTB (Central Task Board) 추적 방식
```

### Evaluator #7 (Travel P2 QA 리더)

**Day 1 (5/31): Welcome & Travel QA**
- [ ] Travel Phase 2 설계
- [ ] QA 기준서 작성
  - 사용성 평가 (4.5/5 목표)
  - 성능 테스트 (<200ms)
  - 버그 분류 기준

**Day 2-4 (6/01~6/02): 검수 시작**
- Travel 컴포넌트별 QA
- Web-Builder #1과 협력

**필독:**
```
1. project_travel_management_phase2_ui_plan.md
2. 평가 프레임워크 (기존 Evaluator 참고)
```

---

## 👥 Phase C: Evaluator #8 + Automation #4 (6/03~6/10)

### Evaluator #8 (Team Dashboard P2 QA)

**Day 1 (6/03): Welcome & Dashboard QA**
- [ ] Team Structure
- [ ] Team Dashboard 설계 + QA 기준
  - 접근성 기준 (WCAG AA)
  - 성능 목표 (FCP <2s, LCP <3s)
  - 반응형 디자인 테스트

**Day 2-5 (6/04~6/07): Dashboard 검수**
- 조직도 정확성 검증
- 포트폴리오 데이터 무결성
- 타임라인 렌더링 성능

**Day 6-7 (6/08~6/10): 완료 & 최종 평가**

**필독:**
```
1. project_team_dashboard.md
2. CEO_UNIFIED_DASHBOARD_SPEC.md
3. 성능 테스트 가이드 (기존 Evaluator 참고)
```

### Automation #4 (Memory Phase 2 자동화)

**Day 1 (6/03): Welcome & Memory Automation**
- [ ] Team Structure
- [ ] MEMORY_IMPROVEMENT_PLAN_COMPREHENSIVE.md (1.5시간)
  - 3단계 자동화 구조
  - Cron job 일정 (5분, 매일 08:00/14:00/16:00)
  - 신뢰도 감시 방식

- [ ] Protocol v2 Execution System (1시간)
  - Telegram 메시지 자동 수집 (5분 cron)
  - Memory 검증 프로토콜
  - Discord 알림 메커니즘

**Day 2-3 (6/04~6/05): Python Skeleton 구현**
- [ ] Telegram API 연동 (결정 자동 수집)
- [ ] GitHub Webhook 설정 (커밋 추적)
- [ ] Discord API 연동 (알림)

**Day 4-5 (6/06~6/07): Cron Job 등록 & 테스트**
- [ ] 5분 cron (Telegram 수집) 배포
- [ ] 매일 08:00 cron (메모리 검증) 배포
- [ ] 매일 14:00 cron (CTB 동기화) 배포

**Day 6-7 (6/08~6/10): 감시 & 완료**
- 자동화 안정성 모니터링
- Secretary AI와 협력체계 확립

**필독:**
```
1. MEMORY_IMPROVEMENT_PLAN_COMPREHENSIVE.md (1.5시간)
2. protocol_execution_system.md (1시간)
3. Python + Discord API 기본 (1시간)
4. Telegram Bot API (30분)
```

---

## ✅ 공통 온보딩 체크리스트

### Day 1: Welcome & Setup
- [ ] Team Structure 문서 읽기 완료
- [ ] GitHub 계정 + 저장소 접근 권한
- [ ] Slack/Discord 가입 + #일반채널 참여
- [ ] Telegram 봇 등록
- [ ] 역할별 설계 문서 1장 읽기 시작
- [ ] Daily Standup 첫 참여 (16:00)

### Day 2: Learning & First Task
- [ ] 역할별 설계 문서 완독 (2~3시간)
- [ ] Work History Package 읽기 (1시간)
- [ ] 첫 번째 과제 할당 받기 (4시간 예상)
- [ ] CTB (Central Task Board) 작업 상태 업데이트
- [ ] Daily Standup 2회 (14:00, 18:00) 참여

### Day 3: Independence Check
- [ ] 첫 과제 검수 완료 (Evaluator 또는 Leader 담당)
- [ ] 두 번째 과제 독립 진행 시작
- [ ] Code Review (또는 설계 검수) 1회 통과
- [ ] 중간 평가 (담당 Leader 평가)

### Day 4-5: Full Independence
- [ ] 독립적으로 업무 진행 (Daily Standup 100%)
- [ ] 주간 목표 달성 (3~5개 기능 또는 스토리)
- [ ] 온보딩 완료 선언 (Secretary AI → CEO 보고)

---

## 📊 온보딩 성과 지표

### Learning Progress (학습 진도)
```
Day 1: 팀 구조 + 설계 문서 읽기 (50% 진도)
Day 2: 설계 문서 완독 (100% 진도)
Day 3: 첫 과제 완료 (80% 이상 품질)
Day 4: 독립 운영 시작 (100% 책임)
```

### Quality Metrics (품질 지표)
```
첫 과제 검수:
- 정확도: 85% 이상
- 완성도: 90% 이상
- 시간 준수: 예상 시간 ±10%

주간 성과:
- 개발자: 3~5개 기능 완료 + <5 버그/100 LOC
- 평가자: 3~4개 설계 검수 완료 + 90% 통과율
- 자동화: 2~3개 Cron 배포 + 99% 안정성
```

### Team Integration (팀 통합)
```
- Daily Standup 참여율: 100%
- 팀 협업 만족도: 4/5 이상
- 메모리 신뢰도: 85% 이상
- 의사소통 명확도: 4.5/5 이상
```

---

## 📋 각 Phase별 Go/No-Go 평가 기준

### Phase A Go/No-Go (2026-05-28 14:00)
**Data-Analyst #5 평가 (CEO 최종 승인)**

✅ Go 조건:
- 첫 과제 (분석 계획서) 완성도 90% 이상
- SQL 쿼리 작성 능력 확인
- 독립적으로 다음 과제 처리 가능

❌ No-Go 조건:
- 과제 완성도 70% 이하
- 기본 분석 능력 부족
- 추가 학습 필요

### Phase B Go/No-Go (2026-06-01 14:00)
**Web-Builder 3명 + Evaluator 2명 평가 (CEO)**

✅ Go 조건:
- 각 개발자: 3~4개 기능 완료 + Code Review 통과
- 각 평가자: 2개 설계 검수 완료 + 체크리스트 작성
- 팀 통합도: 4/5 이상

❌ No-Go 조건:
- 개발자: 2개 이하 기능 또는 버그 >10/100 LOC
- 평가자: 검수 기준 부족 또는 산출물 미완성
- 팀 커뮤니케이션 문제

### Phase C Go/No-Go (2026-06-10 18:00)
**Evaluator #8 + Automation #4 평가 (CEO)**

✅ Go 조건:
- Evaluator #8: Dashboard 검수 완료 + 성능 기준 확인
- Automation #4: 3개 Cron 배포 + 99% 안정성
- 15명 팀 완전 가동 준비 완료

❌ No-Go 조건:
- Automation 자동화 안정성 <95%
- Evaluator 검수 누락 항목 존재
- 팀 신뢰도 <90%

---

## 📞 온보딩 담당자 & 멘토링

| 역할 | 온보딩 리더 | 멘토 | 연락처 |
|------|-----------|------|--------|
| Data-Analyst #5 | Secretary AI | Web-Builder | GitHub |
| Web-Builder #1 | Web-Builder | Web-Builder (기존) | GitHub |
| Web-Builder #2 | Web-Builder | Web-Builder (기존) | GitHub |
| Web-Builder #3 | Web-Builder | Web-Builder (기존) | GitHub |
| Evaluator #6 | Evaluator | Evaluator (기존) | Discord |
| Evaluator #7 | Evaluator | Evaluator (기존) | Discord |
| Evaluator #8 | Evaluator | Evaluator (기존) | Discord |
| Automation #4 | Automation | Automation (기존) | Cron logs |
| 최종 승인 | CEO (사용자) | N/A | Telegram |

---

## 🎯 최종 타임라인

```
2026-05-26: Phase A 시작 (#5 Data-Analyst 온보딩)
2026-05-28: Phase A 평가 (Go/No-Go) + Phase B 준비
2026-05-29: Phase B 시작 (#1,#2 Web-Builder + #6,#7 Evaluator 온보딩)
2026-06-01: Phase B 중간 평가
2026-06-02: Phase B 완료 → 9명 독립 운영
2026-06-03: Phase C 시작 (#8 Evaluator + #4 Automation)
2026-06-10: Phase C 완료 → 15명 팀 완전 가동 ✅
2026-06-11: Phase D (전체 팀 100% 활용률 + 4프로젝트 병렬 고속 실행)

최종 성과:
✅ 15명 팀 완전 가동
✅ 4프로젝트 병렬 실행 (Discord P1 + Travel P2 + Asset P2 + Team Dashboard P2)
✅ 팀 활용률 96~100%
✅ 메모리 신뢰도 95% 이상 유지
✅ 자동화 시스템 99% 가동률
```

---

**작성자:** Secretary AI (C-3PO)  
**상태:** 준비 완료 (2026-05-26 04:25 KST)  
**다음 단계:** Phase A 온보딩 시작 (2026-05-26 09:00 KST)
