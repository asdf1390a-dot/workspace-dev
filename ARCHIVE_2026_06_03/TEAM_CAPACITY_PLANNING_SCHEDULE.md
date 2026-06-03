---
name: Team Capacity Planning Schedule — 6/1~6/10
description: 15명 팀 일일/시간별 용량 계획, 병렬 프로젝트 로드맵, 리소스 할당 최적화
type: project
date: 2026-05-30
status: 설계 완료 (Design Complete)
---

# 📅 팀 용량 계획 일정 (6/1~6/10)

**기간:** 2026-06-01 (토) ~ 2026-06-10 (월)  
**팀 규모:** 15명 (14 AI + 1 CEO)  
**목표:** 팀 활용도 80% → 93.3% 확장, 8개 병렬 프로젝트 조율  
**성공 기준:** 13/13 프로젝트 완료 + 팀 신뢰도 95%+

---

## 📊 1. 팀 용량 현황 분석 (6/1 기준)

### 1.1 팀원별 현재 할당 상태

| # | 역할 | Agent | 프로젝트 | 용량 | 상태 |
|----|------|-------|---------|------|------|
| 1 | CEO | Kim Kyung-tae | 감독 | 5% | ✅ |
| 2 | 비서 | Secretary | CTB/자동화 | 40% | ✅ |
| 3 | 웹개발자#1 | Web-Builder#1 | Backup-P2 UI (진행) | 100% | ✅ |
| 4 | 웹개발자#2 | Web-Builder#2 | 대기 (Dashboard 준비) | 20% | 🟡 |
| 5 | 데이터분석가 | Data-Analyst | Memory Auto 분석 | 35% | 🟡 |
| 6 | 평가자#1 | Evaluator#1 | Backup 검증 | 50% | ✅ |
| 7 | 평가자#2 | Evaluator#2 | BM Pre-Deploy | 20% | 🟡 |
| 8 | 번역가 | Translator | 문서화 | 10% | 🟡 |
| 9 | 자동화전문가 | Auto-Specialist | Memory Auto-P2 | 75% | ✅ |
| 10 | 플레너 | Planner | Dashboard P2 설계 | 100% | ✅ |
| 11 | 설계전문가 | Design-Specialist | Dashboard P2 설계 | 100% | ✅ |
| 12 | DevOps 엔지니어 | DevOps-Engineer | 준비 중 | 0% | 🔴 |
| 13 | 메모리전문가 | Memory-Specialist | Memory Auto-P2 | 75% | ✅ |
| 14 | QA 전문가 | QA-Specialist | 통합테스트 | 50% | ✅ |
| 15 | 웹개발자#3 | (예약) | TBD | 0% | 🔴 |

**현재 집계:**
- **총 할당:** 830% (15명 × 100% = 1500% 대비)
- **유휴 용량:** 670% (44.7%)
- **팀 활용도:** 55.3% (목표: 93.3%)

---

## 📅 2. 일일 일정 & 마일스톤

### 2.1 2026-06-01 (토) — 설계 완성 + UI 시작

**목표:** Team Dashboard-P2 설계 100% 완성, Backup-P2 검증 완료, Memory Auto P2D 시작

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 업데이트 | 15분 |
| **09:00-17:00** | Planner + Design-Specialist | Dashboard P2 설계 마무리 | 설계 문서 100% | 8시간 |
| **09:00-17:00** | Web-Builder#1 | Backup-P2 UI 완성 | UI 코드 100% | 8시간 |
| **10:00-14:00** | Evaluator#1 | Backup-P2 통합테스트 | 테스트 20/20 ✓ | 4시간 |
| **14:00-18:00** | Web-Builder#2 | Dashboard P2 설계 리뷰 | 구현 준비 완료 | 4시간 |
| **14:00-18:00** | Auto-Specialist + Memory-Specialist | Memory Auto P2D 시작 | P2D 구현 50% | 4시간 |
| **15:00** | Secretary | 중간 체크 | 진도 확인 | 10분 |
| **18:00** | Secretary | Evening Sync | Telegram 보고 | 15분 |

**예상 결과:**
- ✅ Dashboard P2 설계 완료 (100%)
- ✅ Backup-P2 UI 완료 (100%)
- ✅ Backup-P2 테스트 완료 (20/20)
- 🟡 Memory Auto P2D 50% (계획대로)
- 📈 팀 활용도: 55% → 65%

---

### 2.2 2026-06-02 (일) — 배포 스프린트 [⚠️ 최고 우선순위]

**목표:** Backup-P2 배포, Dashboard-P2 UI 80% 이상, Memory Auto P2E 시작

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 최종 점검 | 15분 |
| **09:00-12:00** | Evaluator#1 + QA-Specialist | Backup-P2 E2E 테스트 | 배포 준비 완료 | 3시간 |
| **09:00-15:00** | Web-Builder#1 + Web-Builder#2 | Backup 배포 + Dashboard UI | Backup ✅ 배포, Dashboard 80% | 6시간 |
| **12:00-18:00** | Auto-Specialist + Memory-Specialist | Memory Auto P2E 시작 | P2E 구현 진행 | 6시간 |
| **14:00** | Secretary | 최종 체크포인트 | 배포 상태 확인 | 20분 |
| **16:00** | Data-Analyst | KPI 분석 | 월간 리포트 초안 | 2시간 |
| **18:00** | Secretary | 최종 보고 | 일일 결과 보고 | 30분 |

**예상 결과:**
- ✅ Backup-P2 배포 완료 (100%)
- 🟡 Dashboard-P2 UI 80% (마무리 남음)
- 🟡 Memory Auto P2E 진행중
- 🔴 BM Pre-Deploy 검증 필요 (대기 중)
- 📈 팀 활용도: 65% → 75%

---

### 2.3 2026-06-03 (월) — 프로젝트 스폰 + UI 마무리

**목표:** Dashboard-P2 완료, Harness-ENG P2 UI 시작, Phase C 팀원 4명 활성화

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Standup | CTB 업데이트 | 15분 |
| **09:00-14:00** | Web-Builder#2 | Dashboard-P2 UI 마무리 | UI 코드 100% | 5시간 |
| **09:00-17:00** | DevOps-Engineer | Infrastructure Monitoring 설계 시작 | 설계 60% | 8시간 |
| **10:00-14:00** | Evaluator#1 + QA-Specialist | Dashboard-P2 검증 | 테스트 30/30 ✓ | 4시간 |
| **13:00-17:00** | Web-Builder#1 | Harness-ENG P2 UI 시작 | UI 구현 40% | 4시간 |
| **14:00-18:00** | Auto-Specialist + Memory-Specialist | Memory Auto P2F 시작 | 최종 통합 30% | 4시간 |
| **15:00** | Secretary | Phase C 팀원 온보딩 | 4명 배치 시작 | 30분 |

**예상 결과:**
- ✅ Dashboard-P2 배포 완료 (100%)
- 🟡 Harness-ENG P2 UI 40%
- 🟡 DevOps Monitoring 설계 60%
- 🟡 Memory Auto P2F 30%
- 📈 팀 활용도: 75% → 80%
- 👥 Active Team Members: 12명 → 15명

---

### 2.4 2026-06-04 (화) — Phase C 온보딩 + 병렬화

**목표:** Harness-ENG 구현 진행, Infrastructure 설계 완성, BM Pre-Deploy 배포

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 업데이트 | 15분 |
| **09:00-17:00** | Web-Builder#1 | Harness-ENG P2 UI 구현 | UI 80% | 8시간 |
| **09:00-14:00** | DevOps-Engineer | Infrastructure Monitoring 설계 완성 | 설계 100% | 5시간 |
| **10:00-14:00** | Evaluator#1 + Evaluator#2 | BM Pre-Deploy 최종 검증 | 배포 준비 완료 | 4시간 |
| **10:00-16:00** | Phase C 신규팀원 (4명) | 온보딩 + 첫 과제 배정 | 온보딩 완료 | 6시간 |
| **14:00-18:00** | Auto-Specialist + Memory-Specialist + QA | Memory Auto 통합테스트 | 테스트 시작 | 4시간 |
| **18:00** | BM-P1 배포 | BM-P1 Pre-Deploy 완료 | ✅ 배포 | 1시간 |

**예상 결과:**
- 🟡 Harness-ENG P2 80%
- ✅ Infrastructure 설계 완료 (100%)
- ✅ BM-P1 배포 완료
- 📈 팀 활용도: 80% → 85%
- ✅ Phase C 온보딩 완료

---

### 2.5 2026-06-05 (수) — 병렬 프로젝트 진행 + 테스트

**목표:** Harness-ENG 완료, Infrastructure P1 구현 50%, Memory Auto 테스트 70%

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 업데이트 | 15분 |
| **09:00-17:00** | Web-Builder#1 | Harness-ENG P2 UI 완성 | UI 코드 100% | 8시간 |
| **09:00-14:00** | Evaluator#1 + QA-Specialist | Harness-ENG 검증 시작 | 테스트 20/40 | 5시간 |
| **09:00-17:00** | DevOps-Engineer | Infrastructure P1 구현 시작 | 구현 50% | 8시간 |
| **10:00-15:00** | Auto-Specialist + Memory-Specialist + QA | Memory Auto 통합테스트 | 테스트 70% | 5시간 |
| **14:00-17:00** | Web-Builder#2 + Web-Builder#3 | 새 프로젝트 시작 (예약) | 프로젝트 A 스폰 | 3시간 |

**예상 결과:**
- ✅ Harness-ENG P2 UI 완료 (100%)
- 🟡 Infrastructure 구현 50%
- 🟡 Memory Auto 테스트 70%
- 📈 팀 활용도: 85% → 88%
- 🟡 신규 프로젝트 시작

---

### 2.6 2026-06-06 (목) — 검증 스프린트

**목표:** Harness-ENG 배포, Infrastructure P1 80%, Memory Auto 테스트 95%

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 업데이트 | 15분 |
| **09:00-14:00** | Evaluator#1 + QA-Specialist + Evaluator#2 | Harness-ENG 최종 E2E | 테스트 40/40 ✓ | 5시간 |
| **09:00-17:00** | DevOps-Engineer | Infrastructure P1 구현 완료 | 구현 80% | 8시간 |
| **14:00-18:00** | Auto-Specialist + Memory-Specialist + QA | Memory Auto 최종 테스트 | 테스트 95% | 4시간 |
| **15:00** | Web-Builder#1 | Harness-ENG 배포 준비 | 배포 준비 100% | 1시간 |
| **16:00** | Secretary | 주간 리포트 | 진도 보고 | 1시간 |
| **18:00** | Harness-ENG 배포 | Harness-ENG P2 배포 완료 | ✅ 배포 | 1시간 |

**예상 결과:**
- ✅ Harness-ENG P2 배포 (100%)
- 🟡 Infrastructure P1 80%
- 🟡 Memory Auto 테스트 95%
- 📈 팀 활용도: 88% → 90%

---

### 2.7 2026-06-07 (금) — 마무리 스프린트

**목표:** Infrastructure P1 완료, Memory Auto 배포 준비, 신규 프로젝트 A 40%

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | Morning Checkpoint | CTB 최종 점검 | 15분 |
| **09:00-14:00** | DevOps-Engineer | Infrastructure P1 완성 | 구현 100% | 5시간 |
| **09:00-15:00** | Evaluator#1 + QA-Specialist | Infrastructure 검증 | 테스트 20/20 ✓ | 6시간 |
| **10:00-16:00** | Auto-Specialist + Memory-Specialist + QA | Memory Auto 배포 준비 | 배포 준비 100% | 6시간 |
| **10:00-17:00** | Web-Builder#1 + Web-Builder#2 + Web-Builder#3 | 신규 프로젝트 A 진행 | 구현 40% | 7시간 |
| **16:00-18:00** | Secretary | 주간 최종 보고 | 주간 리포트 완성 | 2시간 |
| **18:00** | Memory Auto 배포 | Memory Auto-P2 배포 완료 | ✅ 배포 | 1시간 |

**예상 결과:**
- ✅ Infrastructure P1 배포 (100%)
- ✅ Memory Auto-P2 배포 (100%)
- 🟡 신규 프로젝트 A 40%
- 📈 팀 활용도: 90% → 92%

---

### 2.8 2026-06-08 (토) — 주말 스프린트

**목표:** 신규 프로젝트 A 80%, 최종 검증, 다음 주 준비

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **09:00-17:00** | Web-Builder#1 + Web-Builder#2 + Web-Builder#3 | 신규 프로젝트 A 진행 | 구현 80% | 8시간 |
| **10:00-14:00** | Evaluator#1 + Evaluator#2 + QA-Specialist | 통합 검증 (전체 프로젝트) | 최종 QA | 4시간 |
| **14:00-17:00** | Data-Analyst | KPI 분석 + 리포트 | 월간 분석 완성 | 3시간 |
| **15:00** | Secretary | 주간 마무리 | CTB 최종 정리 | 30분 |

**예상 결과:**
- 🟡 신규 프로젝트 A 80%
- 🟡 통합 QA 진행중
- 📈 팀 활용도: 92% → 92% (안정적 유지)

---

### 2.9 2026-06-09 (일) — 최종 완성

**목표:** 신규 프로젝트 A 100%, 최종 배포, 6/10 준비

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **09:00-14:00** | Web-Builder#1 + Web-Builder#2 + Web-Builder#3 | 신규 프로젝트 A 완성 | 구현 100% | 5시간 |
| **10:00-14:00** | Evaluator#1 + Evaluator#2 + QA-Specialist | 최종 E2E 테스트 | 테스트 100/100 ✓ | 4시간 |
| **14:00-16:00** | Web-Builder#1 | 신규 프로젝트 A 배포 | ✅ 배포 | 2시간 |
| **16:00-18:00** | Secretary + Translator | 문서화 완성 | 모든 문서 완성 | 2시간 |

**예상 결과:**
- ✅ 신규 프로젝트 A 배포 (100%)
- ✅ 문서화 완성 (100%)
- 📈 팀 활용도: 92% → 93%

---

### 2.10 2026-06-10 (월) — 최종 검증 & 마무리

**목표:** 모든 프로젝트 배포 완료, 팀 활용도 93.3% 달성, 월간 평가

| 시간 | 담당 | 작업 | 결과 | 예상 시간 |
|------|------|------|------|----------|
| **08:00** | Secretary | 최종 Morning Checkpoint | CTB 완성 | 15분 |
| **09:00-12:00** | CEO + Secretary | 전체 프로젝트 최종 검증 | 모든 프로젝트 상태 확인 | 3시간 |
| **13:00-17:00** | Secretary + Evaluator#1 | 월간 평가 리포트 | 신뢰도/완료율 계산 | 4시간 |
| **17:00-18:00** | CEO | 최종 의사결정 | 다음 단계 승인 | 1시간 |
| **18:00** | Secretary | 최종 보고 | 월간 결과 보고 | 30분 |

**최종 결과:**
- ✅ 13/13 프로젝트 완료 (100%)
- ✅ 팀 활용도 93.3% 달성
- ✅ 팀 신뢰도 95% 달성
- ✅ 블로킹 이슈 0건

---

## 🎯 3. 프로젝트별 마일스톤

### 3.1 기한별 완료 프로젝트

**6/2 (일) — 최우선 프로젝트**
- ✅ Backup-P2 UI — 배포 완료
- ✅ Team Dashboard-P2 UI — 배포 완료
- ✅ Memory Auto-P2 Phase 2A-E — 배포 준비

**6/4 (화)**
- ✅ BM-P1 Pre-Deploy — 배포 완료

**6/6 (목)**
- ✅ Harness-ENG P2 UI — 배포 완료

**6/7 (금)**
- ✅ Infrastructure Monitoring P1 — 배포 완료
- ✅ Memory Auto-P2 Phase 2F — 배포 완료

**6/9 (일)**
- ✅ 신규 프로젝트 A (예약) — 배포 완료

---

## 📊 4. 용량 최적화 전략

### 4.1 리소스 할당 원칙

1. **Web-Builder 병렬화 불가:**
   - Backup (6/2) → Harness-ENG (6/3-6/5) → 신규 프로젝트 A (6/5-6/9)
   - 순차 처리만 가능 (병렬화 불가)

2. **Evaluator 병렬 검증:**
   - Evaluator#1: Backup + Dashboard 동시 검증 (6/1-6/3)
   - Evaluator#2: BM Pre-Deploy 검증
   - QA-Specialist: Memory Auto 통합테스트

3. **Data-Analyst 활용:**
   - Memory Auto 데이터 분석 (6/1-6/7)
   - KPI 리포팅 (6/8-6/10)

4. **Phase C 신규 팀원 활용:**
   - DevOps-Engineer: Infrastructure 설계 + 구현 (6/3-6/7)
   - Design-Specialist: 기존 프로젝트 설계 리뷰 (6/1-6/3)
   - Memory-Specialist: Memory Auto Phase 2D-F (6/1-6/7)

### 4.2 용량 활용도 목표

| 기간 | 할당 | 유휴 | 활용도 |
|------|------|------|--------|
| 6/1 | 830% | 670% | 55% |
| 6/2 | 1050% | 450% | 70% |
| 6/3 | 1200% | 300% | 80% |
| 6/4 | 1275% | 225% | 85% |
| 6/5-6/7 | 1350% | 150% | 90% |
| 6/8-6/10 | 1400% | 100% | 93.3% |

---

## ⚠️ 5. 리스크 모니터링

### 5.1 주요 리스크 & 모니터링

| 리스크 | 신호 | 모니터링 주기 | 에스컬레이션 |
|--------|------|-------------|-----------|
| Backup-P2 지연 | UI 80% 미만 (6/1 17:00) | 4시간마다 | 즉시 CEO 보고 |
| Dashboard 설계 지연 | 설계 90% 미만 (6/1 18:00) | 매일 18:00 | 6/1 09:00 보고 |
| Web-Builder#1 과로 | PR 지연/버그 증가 | PR 리뷰 | 생산성 30%↓시 |
| Memory Auto 테스트 실패 | 테스트 80% 미만 (6/6) | 매일 16:00 | 6/6 10:00 보고 |

### 5.2 에스컬레이션 경로

```
【긴급 상황 (즉시)】
문제 발견 → 담당자 → Secretary → CEO (응답: <30분)

【높은 우선순위 (4시간 내)】
블로킹 발견 → Secretary 판단 → CEO 보고 (응답: <4시간)

【일반 진행상황】
Daily Checkpoint 통해 보고 (정기: 08:00/14:00/18:00)
```

---

## ✅ 6. 성공 기준

### 6.1 프로젝트별 완료 기준

**모든 프로젝트는 다음을 충족할 때 "완료":**
1. 설계 문서 완성 + Evaluator 승인
2. 모든 기능 구현 + 소스코드 커밋
3. E2E 테스트 3회 반복 통과 (3/3)
4. 프로덕션 배포 + 모니터링 활성화

### 6.2 6/10 최종 목표

| 지표 | 목표 | 현황 (6/1) | 예상 (6/10) |
|------|------|-----------|-----------|
| **프로젝트 완료율** | 100% | 85% | 100% ✅ |
| **팀 활용도** | 93.3% | 55% | 93.3% ✅ |
| **팀 신뢰도** | 95% | 97% | 95%+ ✅ |
| **배포 성공률** | 100% | 100% | 100% ✅ |
| **블로킹 이슈** | 0건 | 0건 | 0건 ✅ |

---

## 📋 부록: 일일 체크리스트

### 매일 아침 (08:00)
- [ ] CTB 업데이트 (모든 팀원 상태)
- [ ] 전날 완료 프로젝트 확인
- [ ] 오늘의 우선순위 확인
- [ ] 블로킹 이슈 확인

### 매일 낮 (14:00)
- [ ] 중간 진도 체크
- [ ] 예상 일정 대비 실제 진도 비교
- [ ] 새로운 블로킹 발견 여부 확인

### 매일 저녁 (18:00)
- [ ] 일일 완료 사항 정리
- [ ] CTB 최종 업데이트
- [ ] 다음날 준비 사항 확인
- [ ] CEO 보고 (필요시)

---

**작성일:** 2026-05-30  
**최종 업데이트:** 2026-05-30 21:00 KST  
**담당:** Project Planner AI  
**상태:** ✅ 설계 완료, 운영 준비 완료
