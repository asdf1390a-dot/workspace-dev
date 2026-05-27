---
name: 신규 4명 온보딩 종합 패키지
description: Phase A/B 신규팀원 (4명) 온보딩 자료 + 학습 일정 + 체크리스트
type: system
date: 2026-05-26
owner: Secretary AI (C-3PO) + Team
originSessionId: 742e11d6-7970-4484-afe1-d969f32e4ac1
---
# 신규 4명 온보딩 종합 패키지 (2026-05-26)

**목표:** Phase A (5/26~30) 신규 2명 + Phase B (5/31~6/10) 신규 2명 온보딩 완료  
**성과:** 11명 팀 완전 가동 + 신뢰도 95% 달성

---

## 📋 신규 팀원별 온보딩 일정

### Phase A: 신규 #3 (Data-Analyst) — 5/26~5/28

| 날짜 | 시간 | 항목 | 담당 | 산출물 |
|------|------|------|------|--------|
| **5/26** | 09:00 | Welcome Briefing | 비서 | Onboarding Checklist |
| | 10:00 | Team Structure Overview | CEO/비서 | 팀 구조 문서 |
| | 14:00 | Asset Master Design Review | Web-Builder | 설계 요약 문서 |
| | 16:00 | Daily Standup #1 | 팀 전체 | 첫 과제 할당 |
| **5/27** | 09:00 | Code Repository Setup | Web-Builder | GitHub 접근 권한 |
| | 10:00 | SQL/Data Analysis Tools | Automation | 환경 설정 완료 |
| | 14:00 | Asset Master API 리뷰 | Web-Builder | API 명세 확인 |
| | 18:00 | Daily Standup #2 | 팀 전체 | 첫 분석 과제 |
| **5/28** | 09:00 | Asset Data Analysis Plan | 신규 #3 | 분석 계획안 |
| | 14:00 | Phase A 중간 평가 | CEO/비서 | Go/No-Go 결정 |

**예상 완료:** 5/28 14:00 (기본 온보딩 완료, 독립 업무 시작)

### Phase B: 신규 #1 (Web-Builder), #2 (Evaluator), #4 (Automation) — 5/29~6/02

| 날짜 | 시간 | 항목 | 담당 | 대상 |
|------|------|------|------|------|
| **5/29** | 09:00 | 신규 #1 Welcome | 비서 | Web-Builder |
| | 14:00 | Travel App Design | Planner | #1 설계 리뷰 |
| **5/30** | 09:00 | 신규 #1 Code Setup | Web-Builder | #1 GitHub |
| | 14:00 | Travel Phase 2 개발 시작 | #1 | 첫 컴포넌트 |
| **5/31** | 09:00 | 신규 #2, #4 Welcome | 비서 | Evaluator, Automation |
| | 10:00 | Team Standup | 팀 전체 | #2, #4 소개 |
| | 14:00 | Backup QA & Dashboard 검수 | #2 | 첫 검수 과제 |
| | 16:00 | Memory Automation Plan | #4 | 자동화 설계 리뷰 |
| **6/01** | 09:00 | Phase B 중간 평가 | CEO | #1, #2, #4 진행상황 |
| **6/02** | 18:00 | Phase B 온보딩 완료 | 비서 | 전체 팀 독립 운영 |

---

## 📚 제공 문서 & 학습 자료

### 1단계: 팀 구조 & 기본 이해 (Day 1-2)

**필수 읽기:**
```
1. TEAM_STRUCTURE_UNIFIED_2026_05_26.md (30분)
   - 팀 규모, 역할, 책임 이해
   - 4프로젝트 병렬 구조 파악

2. PARALLEL_PROCESSING_SYSTEM_ARCHITECTURE.md (20분)
   - Lane 기반 프로젝트 분해
   - 의존도 관리 방식

3. PROJECT_EXECUTION_ROADMAP_2026_05_26.md (15분)
   - 5/26~6/10 일일 마일스톤
   - 본인이 담당할 구간 확인

4. 팀 규칙 문서들 (1시간)
   - 우선순위 자율 결정 (feedback_priority_autonomy.md)
   - Task Completion & Ownership 절대 규칙 (feedback_absolute_task_completion_rule.md)
   - Status Report 형식 (feedback_status_reporting_format.md)
```

**학습 시간:** 총 2시간

### 2단계: 역할별 설계 문서 (Day 2-3)

#### 신규 #3 (Data-Analyst)
```
1. ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md (1시간)
   - 16개 MVP API 명세
   - DB 스키마 (assets, categories, history)
   - API 우선순위

2. Asset Master API v1 (30분)
   - GET /api/assets
   - POST /api/assets/search
   - FTS(전문 검색) 구조

3. Asset Master Phase A (45분)
   - 506개 자산 관리
   - 일일 15:00 진도 리포트 규칙

학습 시간: 2.5시간
```

#### 신규 #1 (Web-Builder)
```
1. Travel Management Phase 2 UI Plan (1.5시간)
   - 13일 개발 계획
   - 9개 컴포넌트 구조
   - 상태 관리 패턴

2. Travel Management Phase 1 API (1시간)
   - 8개 테이블 스키마
   - 13개 API 명세
   - 바우처 파싱 로직

3. Backup App Phase 2 설계 (1시간)
   - 신규 4개 테이블
   - 16개 API 완성 사례
   - UI 컴포넌트 패턴

학습 시간: 3.5시간
```

#### 신규 #2 (Evaluator)
```
1. Asset Master Phase 2 설계 (45분)
   - 검수 체크리스트
   - 성능 기준 (API <150ms)
   - 테스트 커버리지 기준 (>80%)

2. Backup App Phase 2 UI (30분)
   - 자동화 설정 화면
   - 저장소 관리 화면
   - 메트릭 대시보드

3. Travel App QA 기준 (45분)
   - 사용성 평가 (4.5/5)
   - 성능 테스트 (응답 <200ms)
   - 버그 분류 기준

학습 시간: 2시간
```

#### 신규 #4 (Automation-Specialist)
```
1. MEMORY_IMPROVEMENT_PLAN_COMPREHENSIVE.md (1.5시간)
   - 3단계 자동화 구조
   - Cron job 일정
   - 신뢰도 감시 방식

2. Protocol v2 Execution System (1시간)
   - 5개 자동화 cron
   - Discord 모니터링
   - 메모리 동기화 로직

3. 자동화 스크립트 기본 (1시간)
   - Python skeleton
   - Cron job 등록 방법
   - Discord API 연동

학습 시간: 3.5시간
```

### 3단계: 코어 패턴 & Best Practice (Day 3-4)

**전체 공통:**
```
1. Work History Package (1시간)
   - 5가지 코어 패턴
   - 문서 구조 & 네이밍 규칙
   - 코드 리뷰 프로세스

2. CTB (Central Task Board) 사용법 (30분)
   - 작업 할당 및 추적
   - 진행상황 업데이트
   - 일일 보고 형식

3. Communication Protocol (30분)
   - Daily Standup (08:00, 14:00, 18:00)
   - Discord #일반채널 보고
   - Telegram 긴급 연락

학습 시간: 2시간
```

---

## ✅ 온보딩 체크리스트 (신규 각 1명당)

### Day 1: Welcome & Setup
- [ ] Team Structure 문서 읽기
- [ ] GitHub 계정 설정 + 저장소 접근
- [ ] Slack/Discord 가입 + #일반채널 참여
- [ ] Telegram 봇 등록
- [ ] 역할별 설계 문서 1장 읽기 시작
- [ ] Daily Standup 참여 (16:00)

### Day 2: Learning & First Task
- [ ] 역할별 설계 문서 완독
- [ ] Work History Package 읽기
- [ ] 첫 번째 과제 할당 (4시간 작업)
- [ ] CTB 작업 상태 업데이트
- [ ] Daily Standup (14:00, 18:00) 참여

### Day 3: Independence Check
- [ ] 첫 과제 검수 완료
- [ ] 두 번째 과제 독립 진행 시작
- [ ] Code Review 1회 완료
- [ ] 중간 평가 (Go/No-Go)

### Day 4-5: Full Independence
- [ ] 독립적으로 업무 진행
- [ ] Daily Standup 100% 참여
- [ ] 주간 목표 달성 (3~5개 기능)
- [ ] 온보딩 완료 선언

---

## 🎓 역할별 첫 과제 (Day 1)

### 신규 #3 (Data-Analyst)

**과제:** Asset Master 데이터 분석 계획 수립

**요구사항:**
- 현재 506개 자산의 분포도 분석
- 카테고리별 자산 수량 집계
- 자산 활용도 분석 (활성/비활성)
- 월별 추가 자산 추이 예측

**예상 시간:** 4시간  
**산출물:** 분석 계획서 (문서 + 차트)  
**검수자:** 비서 AI (평가: 현실성, 정확도, 활용가능성)

### 신규 #1 (Web-Builder)

**과제:** Travel App 메인 화면 컴포넌트 설계

**요구사항:**
- 여행 항목 리스트 컴포넌트 (타입정의 + 스타일)
- 상태 필터 (신청/승인/거절/완료)
- 검색 & 정렬 기능

**예상 시간:** 4시간  
**산출물:** 컴포넌트 코드 + Storybook  
**검수자:** Evaluator AI (평가: 타입 안정성, 성능, 사용성)

### 신규 #2 (Evaluator)

**과제:** Backup Phase 2 QA 기준서 작성

**요구사항:**
- API 응답 시간 기준 (<150ms)
- 에러 처리 테스트 케이스
- 성능 테스트 시나리오
- 사용성 평가 항목

**예상 시간:** 3시간  
**산출물:** QA 체크리스트 (엑셀)  
**검수자:** Automation AI (평가: 실행가능성, 완결성)

### 신규 #4 (Automation-Specialist)

**과제:** Memory 자동화 Cron job 설계

**요구사항:**
- Telegram 메시지 수집 로직
- Memory 검증 프로토콜
- Discord 알림 메커니즘

**예상 시간:** 4시간  
**산출물:** Python skeleton 코드 + Cron 설정 파일  
**검수자:** 비서 AI (평가: 안정성, 정확도, 자동화도)

---

## 📊 온보딩 성과 지표

### Learning Progress (학습 진도)
```
Day 1: 기본 문서 읽기 (50%)
Day 2: 설계 문서 완독 (100%)
Day 3: 첫 과제 완료 (80% 이상)
Day 4: 독립 운영 시작 (100%)
```

### Quality Metrics (품질 지표)
```
첫 과제 검수:
- 정확도: 85% 이상
- 완성도: 90% 이상
- 시간 준수: 예상 시간 ±10%

Week 1 성과:
- 주간 완료 기능: 3~5개
- 버그율: <5/100 LOC
- Code Review 통과: 90% 이상
```

### Team Integration (팀 통합)
```
- Daily Standup 참여율: 100%
- 팀 협업 만족도: 4/5 이상
- 메모리 신뢰도: 85% 이상
- 의사소통 명확도: 4.5/5 이상
```

---

## 🔗 온보딩 자료 링크 (준비 리스트)

### 필수 생성 문서 (2026-05-26)
- [ ] TEAM_STRUCTURE_UNIFIED_2026_05_26.md ✅ (작성 완료)
- [ ] MEMORY_IMPROVEMENT_PLAN_COMPREHENSIVE.md ✅ (작성 완료)
- [ ] ONBOARDING_PACKAGE_NEW_MEMBERS_2026_05_26.md (본 문서)
- [ ] 온보딩 동영상 (선택, 나중에)

### 기존 참고 문서
- Work History Package (memory/work_history_package.md)
- Asset Master Phase 2 Onboarding (ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md)
- Protocol v2 Execution (protocol_execution_system.md)

---

## 📞 온보딩 담당자 & 연락처

| 역할 | 이름 | 연락처 | 담당 |
|------|------|--------|------|
| 온보딩 코디 | 비서 AI (C-3PO) | Claude Code | 전체 조율 |
| 신규 #3 멘토 | Web-Builder AI | GitHub PR | Data-Analyst 지도 |
| 신규 #1 멘토 | Web-Builder AI (기존) | GitHub | Web-Builder (신규) 지도 |
| 신규 #2 멘토 | Evaluator AI (기존) | Discord | Evaluator (신규) 지도 |
| 신규 #4 멘토 | Automation AI (기존) | Cron logs | Automation (신규) 지도 |
| CEO 최종 평가 | 김경태 | Telegram | Phase A/B Go/No-Go |

---

## 🎯 최종 목표 & 타임라인

```
2026-05-26: 신규 #3 온보딩 시작 (Phase A 시작)
2026-05-28: Phase A 평가 (Go/No-Go) + 신규 #1 준비
2026-05-29: 신규 #1 온보딩 시작
2026-05-31: 신규 #2, #4 온보딩 시작 (Phase B 시작)
2026-06-05: Phase B 평가 (Go/No-Go)
2026-06-10: Phase B 완료 → 11명 팀 완전 가동
2026-06-11: Phase C 시작 (전체 팀 100% 활용률)

최종 목표:
✅ 신규 4명 모두 독립적 업무 수행
✅ 팀 활용률 100% 달성
✅ 신뢰도 95% 이상 유지
✅ 4프로젝트 병렬 진행
```

---

**작성자:** Secretary AI (C-3PO)  
**상태:** 준비 완료 (2026-05-26)  
**다음 단계:** Phase A 온보딩 시작 (5/26 09:00)
