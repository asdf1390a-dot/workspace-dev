---
name: AI Terminology Standardization Guide
description: Master reference for consistently describing AI agent roles throughout documentation (replaces human-team language with AI-specific terminology)
type: feedback
---

# AI 용어 표준화 가이드 (2026-05-20)

## 🎯 핵심 원칙
**There is ONE human (CEO) + ONE AI Secretary system that operates in multiple specialized modes. No separate human team members exist.**

When documentation says "Web-Builder AI Agent" or "Planner AI Agent", it refers to AI operational modes, NOT separate people.

---

## 📋 용어 매핑

### 역할 이름
| Legacy | ❌ Problem | ✅ New Standard | Context |
|--------|-----------|-----------------|---------|
| `Web-Builder AI Agent` | Implies human developer | **Web-Builder AI Agent** | Code implementation work |
| `Evaluator AI Agent` | Implies human QA tester | **Evaluator AI Agent** | UI testing & code review |
| `Planner AI Agent` | Implies human architect | **Planner AI Agent** | Design & system architecture |
| `Data-Analyst AI Agent` | Implies human analyst | **Data-Analyst AI Agent** | Excel/Supabase data analysis |
| `자동화 전문가` | Implies human specialist | **Automation-Specialist AI Agent** | Cron/scheduling automation |
| `Translator AI Agent` | Implies human translator | **Translator AI Agent** | Korean↔English translation |
| `비서` | Implies human secretary | **Secretary AI** | Primary orchestrator (me) |

### 팀 참고
| Legacy | ❌ Problem | ✅ New Standard |
|--------|-----------|-----------------|
| `팀원` (team member) | Implies humans | **AI Agent** or **Secretary** |
| `담당자` (assignee) | Implies person | **AI Agent role** |
| `팀 확장` | Implies hiring | **AI Agent Activation** or **Specialization Addition** |
| `팀원 온보딩` | Implies new people | **AI Agent Configuration** |
| `팀 구조` | Implies org chart | **AI Operational Modes** |

### 동사 구문
| Legacy | ❌ Problem | ✅ New Standard |
|--------|-----------|-----------------|
| `Web-Builder AI Agent가 구현한다` | Active person | **Web-Builder AI Agent implements** |
| `Evaluator AI Agent 피드백` | Person evaluates | **Evaluator AI Agent provides feedback** |
| `Planner AI Agent가 설계한다` | Person designs | **Planner AI Agent designs** |
| `팀원이 보고한다` | Humans report | **AI Agent reports** or **Secretary reports** |
| `담당자에게 위임한다` | Delegate to person | **Delegate to Web-Builder AI Agent mode** |
| `팀 논의` | Team discussion | **AI Agent deliberation** or **Secretary analysis** |

---

## 🔄 구현 규칙

### 규칙 1: 역할 귀속
**Old:** "Web-Builder AI Agent가 4개 API를 개발했다"  
**New:** "Web-Builder AI Agent implemented 4 APIs"

**Why:** Clarifies that the AI system (not a human) performed this work.

---

### 규칙 2: 일정 관리/할당
**기존:** "Web-Builder AI Agent 담당: Asset Master API"  
**신규:** "Web-Builder AI Agent focus: Asset Master API"

**이유:** 사람에 대한 작업 할당을 암시하는 것을 피합니다.

---

### 규칙 3: 작업 상태
**기존:** "Evaluator AI Agent: 기다리는 중"  
**신규:** "Evaluator AI Agent: Awaiting input"

**이유:** AI Agent 상태와 인간의 대기를 명확히 합니다.

---

### 규칙 4: 타임라인
**기존:** "05-20 Web-Builder AI Agent 온보딩"  
**신규:** "05-20 Web-Builder AI Agent activation"

**이유:** 고용이 아닌 구성을 반영합니다.

---

### 규칙 5: 용량
**기존:** "팀 용량: 49% → 100%"  
**신규:** "AI Agent capacity utilization: 49% → 100%"

**Why:** Clear that we're scaling AI operations, not hiring people.

---

## 🗂️ 상황별 사례

### 사례 1: 프로젝트 브리프
**Before:**
```
Web-Builder AI Agent가 Asset Master Phase 2를 담당합니다.
일정: 5월 20-30일
```

**After:**
```
Web-Builder AI Agent focuses on Asset Master Phase 2.
Timeline: May 20-30
```

---

### 사례 2: 상태 보고서
**이전:**
```
팀원 진행 현황:
- Web-Builder AI Agent: API 구현 진행 중
- Evaluator AI Agent: 테스트 대기 중
```

**이후:**
```
AI Agent status:
- Web-Builder AI Agent: API implementation in progress
- Evaluator AI Agent: Awaiting test package
```

---

### 사례 3: 온보딩
**이전:**
```
신규 팀원 Web-Builder AI Agent 온보딩 (Day 1-3)
```

**이후:**
```
Web-Builder AI Agent Configuration (Day 1-3)
```

---

### 사례 4: 피드백 루프
**이전:**
```
Evaluator AI Agent 피드백: 색상 대비가 부족합니다
```

**이후:**
```
Evaluator AI Agent feedback: Color contrast needs improvement
```

---

## ✅ 적용 체크리스트

다음을 포함하는 모든 문서에 이 규칙을 적용하세요:
- [ ] 역할 이름 (Web-Builder AI Agent, Evaluator AI Agent, Planner AI Agent 등)
- [ ] "팀원" (team member)
- [ ] "담당자" (assignee)
- [ ] 인간 그룹을 암시하는 "팀" 참조
- [ ] 온보딩/고용 언어
- [ ] 용량/팀 확장 표현
- [ ] "누가 무엇을 하는지"에 대한 상태 보고서

---

## 🎓 의사결정 논리

**확실하지 않을 때 자문하세요: "이것이 별도의 인간을 암시하는가?"**

- ❌ 예 → AI Agent 용어로 교체
- ✅ 아니오 → 그대로 유지 가능

**예:**
- "팀 논의" → 인간이 논의할 수 있음 → "Secretary analysis" 또는 "AI Agent deliberation"으로 교체
- "팀 일정" → 팀 일정을 의미할 수 있음 → "AI Operations Schedule"으로 교체
- "팀 문서" → 중립적, 유지 가능 (단지 문서)

---

## 📝 영향받는 파일 (74개 파일 식별됨)

**중요 (MEMORY.md에서 직접 참조):**
- active_work_tracking.md — 상태의 팀원 참고
- team_capacity_matrix_final.md — 역할 할당
- project_audit_system_*.md (12개 파일) — Evaluator 참고
- project_asset_master_*.md (9개 파일) — Web-builder 참고
- project_backup_phase2_*.md (4개 파일) — API 개발자 참고
- project_travel_management_*.md (5개 파일) — 설계 역할

**보조 (설계 문서):**
- automation_specialist_*.md — 역할 설명
- devops_engineer_*.md — 역할 할당
- web_builder_onboarding.md — 역할 용어
- Evaluator/Planner 온보딩 문서

---

## 📌 구현 우선순위

1. **즉시 (今日):** MEMORY.md + active_work_tracking.md
2. **1시간:** 모든 12개 감시 시스템 문서
3. **2시간:** 모든 자산/백업/여행 설계 문서 (18개 파일)
4. **3시간:** 온보딩 템플릿 (6개 파일)
5. **4시간:** 남은 74개 파일 (배치 업데이트)

---

## 🚀 자동 적용 전략

대량 업데이트의 경우 find+replace 패턴 사용:

```bash
# 패턴 1: Web-Builder AI Agent → Web-Builder AI Agent
sed -i 's/Web-Builder AI Agent/Web-Builder AI Agent/g' file.md

# 패턴 2: Evaluator AI Agent → Evaluator AI Agent
sed -i 's/Evaluator AI Agent/Evaluator AI Agent/g' file.md

# 패턴 3: Planner AI Agent → Planner AI Agent
sed -i 's/Planner AI Agent/Planner AI Agent/g' file.md

# 패턴 4: 팀원 → AI Agent
sed -i 's/팀원/AI Agent/g' file.md
```

---

**작성일:** 2026-05-20 10:45 KST  
**상태:** 적용 준비 완료  
**다음:** 모든 74개 파일을 표준화된 용어로 대량 업데이트
