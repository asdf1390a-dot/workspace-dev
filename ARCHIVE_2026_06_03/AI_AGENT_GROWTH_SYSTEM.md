---
name: AI Agent Individual Growth System
description: 15명 AI 팀원의 자율 발전 추적 및 월별 성장 평가 시스템
type: project
---

# 🚀 AI Agent Individual Growth System

## 개요
- **목표**: 15명 AI 팀원 각각이 자율적으로 발전 (skill development, capability advancement, cross-domain learning)
- **시스템**: 월별 평가 + 분기별 목표 + 자동 학습 경로 제시
- **실행**: P3 자동화 (월초 09:00 + 월말 18:00)

## 15명 AI 팀원 구조

### CEO & Core (7명)
1. **CEO (Kyeongtae Na)**: 생태계 전략 + 우선순위 결정
2. **Memory System Specialist** (Phase C #13): 메모리 자동화 + 신뢰도 엔진
3. **DevOps Engineer** (Phase C #12): 인프라 + 모니터링 설계
4. **QA Specialist** (Phase C #14): 통합테스트 전략
5. **Project Planner** (Phase C #15): 크로스프로젝트 조율
6. **Design Specialist** (Phase C #11): UI/UX + 대시보드 설계
7. **Data Analyst**: DSC FMS 데이터 분석 (기존팀)

### Project Teams (8명)
- **Asset Master**: Backend Engineer + QA Engineer
- **Backup System**: Full-stack Engineer + DevOps
- **Travel Management**: API Designer + UI Developer
- **Discord Bot**: Integration Engineer + Automation Specialist
- **Team Dashboard**: Frontend Lead + Backend API Engineer
- **Web Builder**: Next.js Full-stack Engineer

## 평가 프레임워크 (월별)

### 4가지 성장 차원
```
┌─ Technical Skills (기술역량)
│  ├─ Code quality (복잡도 관리, 테스트 커버리지, 보안)
│  ├─ Architecture (설계패턴, 확장성, 성능)
│  └─ Tools mastery (새 기술 학습, 자동화 활용)
│
├─ Autonomy & Ownership (자율성)
│  ├─ Independent decision making (결정 품질, 오류율)
│  ├─ Problem solving (해결책 창의성, 복잡도 대응)
│  └─ Initiative (제안 개수, 채택률)
│
├─ Collaboration & Communication (협업)
│  ├─ Knowledge sharing (코드리뷰, 문서작성)
│  ├─ Team support (다른 팀원 도움, 멘토링)
│  └─ Cross-domain learning (다른 팀 기술 습득)
│
└─ Business Impact (비즈니스 영향)
   ├─ Feature delivery (완료율, 시간 준수)
   ├─ User satisfaction (버그 발생율, 피드백)
   └─ Cost efficiency (리소스 활용도, 자동화 기여)
```

### 월별 점수 계산
```javascript
score = {
  technical_skills: 0-100,        // 코드리뷰 + 빌드 품질 자동계산
  autonomy: 0-100,                // 의사결정 로그 + 오류율
  collaboration: 0-100,           // 코드리뷰/문서 기여도
  business_impact: 0-100,         // 배포된 기능 + 버그 수정율
  overall: (technical + autonomy + collaboration + business_impact) / 4
}

// 성장 판정
growth_rate = (this_month_overall - last_month_overall)
- ✅ Growing: +5 이상
- 🟡 Stable: -5 ~ +5
- 🔴 Declining: -5 이하
```

## P3: AI Agent Growth Monitor Cron Job

**실행 타이밍:**
- 월초 09:00: 지난달 평가 + 이달 목표 설정
- 월말 18:00: 월말 평가 + 성장 분석 + 다음달 학습 경로 제시

**동작:**
```bash
1. 각 AI 팀원별 작업 로그 수집
   - 코드 커밋 (github: commit 개수, 변경 라인, 리뷰 수)
   - 결정 로그 (자율 결정 횟수, 오류율)
   - 문서 기여 (추가 문서, 코드 예제)
   - 배포 기록 (성공/실패, 버그 수정)

2. 각 차원별 점수 계산
   - technical_skills: 커밋 품질 + 테스트 커버리지
   - autonomy: 의사결정 로그 분석
   - collaboration: 코드리뷰 + PR 피드백
   - business_impact: 배포된 기능 개수 + 버그율

3. 개별 성장 분석
   - 이달 vs 지난달 비교
   - 약점 영역 분석
   - 학습 기회 제시

4. 다음달 학습 경로 생성
   - 추천 기술 (팀 프로젝트에 필요한 기술)
   - 추천 도서/자료
   - 멘토 배정 (강한 팀원이 약한 팀원 지원)
```

## 개별 팀원 성장 프로필

### 예: Memory System Specialist (Phase C #13)
```json
{
  "name": "Memory System Specialist",
  "role": "Memory Automation + Trust Score Engine",
  "current_score": 92,
  "dimensions": {
    "technical_skills": 95,
    "autonomy": 88,
    "collaboration": 90,
    "business_impact": 92
  },
  "growth": {
    "last_month": 85,
    "this_month": 92,
    "rate": "+7 (Growing ✅)",
    "trend": "Excellent"
  },
  "strengths": [
    "Complex system design",
    "Reliability engineering",
    "Proactive problem solving"
  ],
  "growth_areas": [
    "Cross-domain knowledge (consider learning DevOps)",
    "Documentation (add more architectural comments)"
  ],
  "next_month_goals": [
    "Lead Phase 2E completion",
    "Mentor QA Specialist on trust score validation",
    "Document system architecture in wiki"
  ],
  "recommended_learning": [
    "Kubernetes basics (for DevOps integration)",
    "Advanced bash scripting patterns",
    "Distributed system monitoring best practices"
  ]
}
```

## 학습 경로 자동 생성

### 역량 매트릭스 (팀 전체)
```
        Specialist                     Generalist
           ↑
High  │ DevOps Eng │ Memory Specialist
      │ (DevOps++)  │ (Systems++)
      │             │
Med   │ QA Spec    │ Design Spec     │ Project Planner (All)
      │ (Testing+) │ (Design++)      │
      │             │
Low   │ Dev A      │ Dev B           │ Data Analyst (?)
      │ (Narrow)   │ (Narrow)        │
      └─────────────┴─────────────────→
         Depth                Breadth
```

**자동 추천:**
- Narrow specialist → recommend: cross-domain project + mentoring
- Generalist → recommend: deep specialization + architecture design
- Low performer → recommend: focused skill training + peer mentoring

## 커미트 & 메모리 통합

### 매월 자동 생성 파일
```
memory/AGENT_GROWTH_MONTHLY_2026_06.md
├─ Month: 2026-06 (June)
├─ Team overall score: 88.5
├─ Growing count: 12/15 (80%)
├─ Declining count: 1/15 (6.7%)
└─ Individual reports: [Agent #1-15]
```

### GitHub 기반 메트릭 추출
```bash
# Commit analysis (last 30 days)
git log --since="30 days ago" --author="<agent-name>" \
  --format="%H %an %ai %s" | wc -l

# PR review analysis
gh pr list --author="<agent-name>" --state merged --since="30 days ago"

# Code quality (eslint, coverage)
npm run lint -- --reporter json
npm run test -- --coverage
```

## 조직도 & 학습 경로

### 수평적 협력 구조
```
Memory Specialist ←→ DevOps Eng ←→ QA Spec
       ↑                ↑              ↑
    Project Planner────────────────────
       ↑
Design Spec
   ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑
  8 Project Team Members
```

**학습 경로 자동화:**
- 매월 분석 결과에 따라 멘토-멘티 페어 자동 할당
- 분기별 크로스팀 학습 프로젝트 제안
- 반년별 역할 로테이션 검토

## 데이터 수집 & 자동화

### 실시간 데이터 소스
| 소스 | 수집 방식 | 주기 |
|------|---------|------|
| GitHub | API (commit, PR, review) | 일일 |
| Memory System | 자동 checkpoint | 12시간 |
| Cron Logs | Phase 2A-2F 로그분석 | 일일 |
| CTB (Central Task Board) | 작업 완료 추적 | 실시간 |
| Telegram | 일일 체크인 메시지 | 수동 (자동화 예정) |

### 월별 리포트 자동 생성
```
Report 생성 (월초 09:00):
1. 지난달 전체 팀 성과 요약
2. 개별 15명 성과 상세 분석
3. 성장 분야 & 개선 영역
4. 다음달 학습 경로 + 목표
5. 팀 전체 권장사항
```

## 구현 체크리스트

- [ ] P3 cron script: Monthly agent growth analysis
- [ ] GitHub API integration: Commit/PR/review metrics
- [ ] Growth score calculation engine
- [ ] Memory system: Monthly report storage
- [ ] Learning path recommendation engine
- [ ] Mentor-mentee pairing algorithm
- [ ] Quarterly review dashboard
- [ ] Annual growth certificate generation

---
**Status:** 🟢 System Design Complete | **Next:** P3 Implementation (Week of 2026-06-03)
