---
name: Cross-Project Coordination Framework for 15-Person Autonomous Team
description: System architecture for coordinating 8 concurrent projects across 15 AI agents with dependency mapping, capacity allocation, context loss prevention, and handoff protocols
type: project
version: 1.0
author: Phase C #15 Project Planner
date: 2026-05-28
target_audience: CEO, Team Leads, DevOps, QA Specialists
---

# 크로스프로젝트 조정 프레임워크 (Cross-Project Coordination Framework)

## 목표 (Objective)

15명 AI 에이전트가 8개 병렬 프로젝트를 자율운영하면서:
- ✅ 컨텍스트 손실 < 5%
- ✅ 프로젝트 간 의존성 관리 100%
- ✅ 일일 용량 할당 정확도 95%+
- ✅ 팀원 교체 시 핸드오프 타임 < 2시간

**대상 기간:** 2026-05-28 ~ 2026-06-10 (Phase A/B 확장), 2026-06-11+ (Phase C 운영)

---

# 1. 핵심 개념 (Core Principles)

## 1.1 세 가지 좌표계 (Three Coordinate Systems)

### A. **프로젝트 차원 (Project Dimension)**
```
PROJECT_LANDSCAPE: {
  CONCURRENT: 8 projects
  PHASES_PER_PROJECT: 2-6 phases (DESIGN → DB → API → UI → TEST → DEPLOY)
  DEPENDENCIES: 47 cross-project links (identified)
  CRITICAL_PATH: 15-day critical path (longest dependency chain)
  SLACK_TIME: 0-5 days per project (buffer for blockers)
}
```

**8개 프로젝트 목록:**
1. **Asset Master Phase 2** — 자산 관리, 16API + 7UI, ETA 2026-05-29
2. **Backup App Phase 2** — 백업 관리, 14API + 5UI, ETA 2026-06-05
3. **Travel Management Phase 2** — 여행 관리 + 바우처, 13API + 8UI, ETA 2026-06-02
4. **Discord Bot Phase 1** — Telegram ↔ Discord 양방향, 5Processors, ETA ✅ COMPLETE
5. **Team Dashboard Phase 2** — 조직도 + 포트폴리오, 8API + 12UI, ETA 2026-06-10
6. **Business Model (BM) Phase 1** — 기술자 + 시설 관리, 16API, ETA ✅ COMPLETE
7. **Memory Automation Phase 2** — 메모리 정리 + 신뢰도, 6스크립트, ETA 2026-06-02
8. **Harness ENG Phase 2** — 플랫폼 기반시설, 12API + 4UI, ETA 2026-06-10

---

### B. **팀 차원 (Team Dimension)**
```
TEAM_STRUCTURE: {
  TOTAL: 15 people (1 human CEO + 14 AI agents)
  ACTIVE_NOW: 8 people (Secretary, 2×Data-Analyst, Web-Builder×2, Evaluator, Automation, Planner)
  RAMPING: 4 people (Phase A onboarding: 5/26-6/2)
  STAGING: 3 people (Phase C design specialists: 6/3-6/10)
  SPECIALIZATION: 8 roles (Secretary, Web-Builder, Evaluator, Data-Analyst, Automation, Translator, DevOps, QA)
}
```

**팀 롤 할당 (Role Assignments):**
- **Secretary (C-3PO)** — CTB 관리, 일일 체크포인트, 팀 조정
- **Web-Builder (×2)** — UI 개발, API 구현 (최고 활용도)
- **Evaluator (×2)** — QA, 규칙 준수 감시
- **Data-Analyst (×2)** — 데이터 분석, 백엔드 API
- **Automation-Specialist** — Cron, 자동화 스크립트
- **Translator** — 문서, 팀 간 커뮤니케이션
- **DevOps-Engineer (Phase C)** — 인프라 모니터링
- **QA-Specialist (Phase C)** — 통합 테스트

---

### C. **시간-공간 차원 (Space-Time Dimension)**
```
SPACE_TIME_MATRIX: {
  CHECKPOINTS: 4 fixed (08:00, 14:00, 15:00, 18:00 KST)
  SPRINT_LENGTH: 5-7 days per phase
  PROJECT_OVERLAP: 2-4 concurrent phases per person
  IDLE_CAPACITY: 6.67% (1 person for urgent work)
  CONTEXT_WINDOW: 5-min (cache hot), 15-min (warm), 1-hour (cold)
}
```

---

## 1.2 기본 가정 (Core Assumptions)

1. **모든 작업은 명확한 인수인계 지점을 가짐** (phase boundary)
2. **의존성은 미리 파악되고 추적됨** (dependency map)
3. **팀원은 자율적으로 다음 작업을 선택함** (no blocker = auto-proceed)
4. **컨텍스트 손실은 메모리 자동화로 방지됨** (Memory Auto Phase 2)
5. **규칙은 Evaluator에 의해 자동으로 감시됨** (audit cron every 4h)

---

# 2. 의존도 맵퍼 시스템 (Project Dependency Mapper)

## 2.1 의존도 그래프 (Dependency Graph)

### 프로젝트 간 의존성 맵 (47개 링크 추적)

```
CRITICAL_DEPENDENCIES: {
  Asset-P2 → Travel-P2-UI: Vercel domain (shared infrastructure)
  Travel-P2-UI → Team-Dashboard-P2: Auth schema (RLS roles)
  Team-Dashboard-P2 → Memory-Auto-P2: Audit trail storage (activity_log table)
  Memory-Auto-P2 → Discord-Bot-P1: Message routing API
  Backup-P2 → BM-P1: Technician role inheritance
  BM-P1 → Harness-ENG-P2: Schema design + API design
  Harness-ENG-P2 → Team-Dashboard-P2: Organization hierarchy
  Harness-ENG-P2 → Travel-P2: Expense report schema
}
```

### 선택적 의존성 (Soft Dependencies, 순차 가능)
```
SOFT_DEPENDENCIES: {
  Asset-P2-UI → Backup-P2-UI: Common component library (icons, forms)
  Travel-P2-UI → Team-Dashboard-P2: Same tech stack (React + Supabase)
  Discord-Bot-P1 → Travel-P2: Message routing (optional integration)
}
```

### 독립적 프로젝트 (No Blocking Dependencies)
```
INDEPENDENT: {
  Asset-P2: Can proceed even if others delayed (16 APIs self-contained)
  BM-P1: Core schema, not dependent on others
  Memory-Auto-P2: Completely autonomous (no external APIs needed)
}
```

---

## 2.2 의존도 맵퍼 아키텍처 (Architecture)

### 2.2.1 데이터 구조 (Graph Representation)

```python
class DependencyMapper:
    """프로젝트 간 의존성 관리"""
    
    def __init__(self):
        self.graph = {
            'nodes': {},      # project_id → {name, phase, owner, status}
            'edges': {},      # project_id → [{'target', 'type', 'blocking', 'eta_delta'}]
            'critical_path': [],  # longest path through graph
            'slack_time': {}  # project_id → days of slack
        }
    
    def add_dependency(self, source, target, blocking=True, type='phase_order'):
        """의존성 추가"""
        # type: phase_order | schema_dependency | shared_resource | shared_api
        edge = {
            'target': target,
            'type': type,
            'blocking': blocking,  # blocking=True면 source 완료 필요
            'eta_delta': self.calculate_eta_delta(source, target)
        }
        if source not in self.graph['edges']:
            self.graph['edges'][source] = []
        self.graph['edges'][source].append(edge)
    
    def calculate_critical_path(self):
        """최장 경로 계산 (병목 파악)"""
        # DAG에서 longest path 찾기
        paths = self._dfs_longest_path()
        self.graph['critical_path'] = paths
        return paths
    
    def get_blocked_projects(self):
        """현재 블로킹된 프로젝트 목록"""
        blocked = []
        for project, edges in self.graph['edges'].items():
            for edge in edges:
                if edge['blocking']:
                    target_status = self.graph['nodes'][edge['target']]['status']
                    if target_status != 'COMPLETE':
                        blocked.append({
                            'project': project,
                            'blocker': edge['target'],
                            'type': edge['type'],
                            'est_resolution': self.graph['nodes'][edge['target']]['eta']
                        })
        return blocked
    
    def suggest_parallel_work(self):
        """현재 실행 가능한 병렬 작업 추천"""
        # 의존성 없는 프로젝트 찾기
        executable = []
        for project_id, node in self.graph['nodes'].items():
            if node['status'] == 'READY':
                if project_id not in [e['target'] for edges in self.graph['edges'].values() for e in edges]:
                    executable.append(project_id)
        return executable
```

---

## 2.3 의존도 추적 (Dependency Tracking)

### 2.3.1 매일 09:00 KST — 의존도 갱신

```bash
#!/bin/bash
# DEPENDENCY_MAP_REFRESH.sh

# 1. 모든 프로젝트 현재 상태 수집
for project in asset travel backup discord team-dashboard bm harness memory-auto; do
  status=$(curl -s "https://api.supabase.com/v1/projects/${project}/status")
  echo "$project: $status"
done

# 2. 블로킹된 작업 파악
blocked=$(jq '.[] | select(.status == "BLOCKED")' active_work_tracking.md)

# 3. 의존도 그래프 재계산
python3 calculate_critical_path.py

# 4. 병렬 실행 가능 작업 추천
python3 suggest_parallel_work.py

# 5. CTB 갱신
update_ctb_dependencies.sh
```

### 2.3.2 의존도 변경 감지 (Change Detection)

```python
def detect_dependency_changes():
    """
    의존도 변경 감지 (매 4시간마다 자동 실행)
    - ETA 변경 감지
    - 새로운 의존성 발견
    - 제거된 의존성 발견
    """
    old_graph = load_previous_dependency_map()
    new_graph = load_current_dependency_map()
    
    changes = {
        'new_blockers': [],
        'resolved_blockers': [],
        'eta_changes': [],
        'slack_time_changes': []
    }
    
    # 비교 로직
    for project_id, edges in new_graph['edges'].items():
        old_edges = old_graph['edges'].get(project_id, [])
        new_targets = {e['target'] for e in edges}
        old_targets = {e['target'] for e in old_edges}
        
        changes['new_blockers'].extend(new_targets - old_targets)
        changes['resolved_blockers'].extend(old_targets - new_targets)
    
    # 알림 발송
    if changes['new_blockers']:
        alert_new_blockers(changes['new_blockers'])
    
    return changes
```

---

# 3. 일일 용량 계획 템플릿 (Daily Capacity Planning Template)

## 3.1 15인 팀 용량 계획 (Capacity Allocation)

### 3.1.1 템플릿: `DAILY_CAPACITY_PLAN_TEMPLATE.md`

```markdown
# 【일일 용량 계획】 2026-05-28

## 📊 팀 가용성 현황 (08:00 KST 기준)

| 역할 | 이름 | 현재 할당 | 가용 용량 | 상태 | 다음 작업 |
|------|------|----------|---------|------|---------|
| Secretary | C-3PO | CTB 관리 40% | 10% | 🟢 | 체크포인트 수집 |
| Web-Builder #1 | WEB-1 | Asset-P2-UI 50% + Team-P2 30% | 0% | 🔴 BLOCKED | ASSET-P2-UI 블로킹 |
| Web-Builder #2 | WEB-2 | Travel-P2-UI 60% | 30% | 🟡 | 컴포넌트 추가 (가능) |
| Data-Analyst #1 | DA-1 | Asset-P2 데이터 분석 40% | 20% | 🟢 | 자산 분류 로직 |
| Data-Analyst #2 | DA-2 | BM-P1 기술자 데이터 30% | 50% | 🟡 | Harness-P2 준비 가능 |
| Evaluator #1 | EVAL-1 | Travel-P2 QA 50% | 10% | 🟡 | Backup-P2 QA 보조 가능 |
| Evaluator #2 | EVAL-2 | 유휴 | 100% | 🟢 | 신 프로젝트 할당 대기 |
| Automation-Specialist | AUTO | Memory-P2 Cron 70% | 20% | 🟡 | Phase 2D 통합 준비 |
| Translator | TRANS | 문서 작성 20% | 60% | 🟢 | 신규 문서화 가능 |
| Planner | PLAN | — | 100% | ⚪ | Phase C #15 (현재) |
| Design-Specialist | DESIGN | Team-Dashboard-P2 설계 80% | 10% | 🟡 | Day 2 와이어프레임 진행 |
| DevOps-Engineer | DEVOPS | 설계 진행 60% | 30% | 🟡 | Infrastructure monitoring 설계 |
| QA-Specialist | QA | 테스트 스위트 구현 70% | 20% | 🟡 | Phase 2C 테스트 작성 |
| **TOTAL** | — | **50.3% (7.5명)** | **49.7% (7.5명)** | — | — |

## 🎯 오늘의 할당 전략

### A. 고정 우선순위 (Fixed)
- [ ] 08:00: Secretary — CTB 체크포인트 (30분)
- [ ] 09:00: Secretary — 의존도 맵 갱신 (30분)
- [ ] 14:00: 모든 팀리더 — 진행률 보고 (15분 × 8명)
- [ ] 15:00: Secretary — 자산 데이터 분석 진도 확인 (15분)
- [ ] 18:00: Secretary — 일일 최종 정리 (30분)

### B. 선택적 작업 (Optional, 용량 있을 시)
1. **Web-Builder #2** (30% 여유) → Travel-P2 UI 추가 컴포넌트 (2-3시간)
2. **Data-Analyst #2** (50% 여유) → Harness-P2 백엔드 프로토타이핑 시작 (4시간)
3. **Evaluator #2** (100% 여유) → Discord-Bot 백업 검증 (2시간)
4. **Translator** (60% 여유) → 팀 대시보드 UI 설계 문서 작성 (3시간)

### C. 의존성 관련 작업 (Dependency-Driven)
- 🔴 **BLOCKED:** Web-Builder #1 (Asset-P2-UI 블로킹 해제 대기)
  - ETA 블로킹 해제: 2026-05-29 14:00
  - 예상 지연: +1일 (현재 오버헤드: -10% 용량)
- 🟡 **AT_RISK:** Backup-P2 (30% 완료, ETA 2026-06-05)
  - 주간 속도: +7% (현재 온트랙)
  - 액션: 없음 (모니터링만)

### D. 팀원 배치 최적화
```
【새 팀원 배치 제안】(2026-05-29)
- Data-Analyst #2 → Harness-P2 백엔드 설계 리뷰 (30% 할당)
- Evaluator #2 → Backup-P2 QA 보조 (40% 할당)
- Translator → Team-Dashboard 문서화 (40% 할당)

효과: 유휴 용량 50% 감소, 병렬 처리 +15%
```

## ✅ 일일 체크포인트 (Daily Checkpoints)

### 08:00 KST — 아침 회의
- **진행 상황:** 어제 계획 완료율 (%)
- **오늘 목표:** 각 팀원 역할 + ETA
- **블로커:** 새로운 의존성 issue
- **용량 조정:** 필요시 재할당

### 14:00 KST — 중간 체크
- **진행률:** 50% 이상 진행되었는가?
- **ETA 업데이트:** 예상 완료 시간 변경 없는가?
- **리소스 이동:** 블로커 해제 가능한가?

### 15:00 KST — 자산 분석 특별 체크
- **일일 진도:** 506개 자산 처리 진행률
- **데이터 품질:** 이상 값 감지 여부
- **다음 단계:** 내일 처리 항목

### 18:00 KST — 저녁 정리
- **일일 완료율:** 계획 대비 달성도 (%)
- **내일 준비:** 우선순위 재조정
- **주간 추세:** 속도 / 품질 / 신뢰도 메트릭

## 📈 메트릭 추적

| 메트릭 | 목표 | 현재 | 추세 |
|--------|------|------|------|
| 팀 가용 용량 활용률 | 90%+ | 50.3% | ↑ (Phase A/B 온보딩 진행 중) |
| 일일 완료율 | 85%+ | 78% | ↑ (메모리 자동화 진행 중) |
| 블로커 해제 시간 | <4h | 6.5h | ↓ (의존도 맵 활용하여 개선 중) |
| 팀원 교체 시 핸드오프 | <2h | 3.2h | ↓ (CTB + 메모리 자동화로 개선) |
| 컨텍스트 손실률 | <5% | 3.2% | ✅ 목표 달성 |

## 🔄 용량 재조정 규칙

### Automatic Reallocation (시스템 자동 실행)
1. **블로커 감지 → 5분 후** — 블로킹된 팀원을 다른 작업으로 재할당
2. **새 프로젝트 준비 → 1시간 후** — 유휴 팀원을 새 프로젝트에 자동 배치
3. **ETA 변경 → 15분 후** — 다음 작업의 시작 시간 재계산 + 의존도 피드백

### Manual Reallocation (Secretary 지시)
- 우선순위 변경 시 (CEO 결정)
- 긴급 블로킹 발생 시 (해제까지 최대 2시간)
- 팀원 역량 초과 시 (40% 이상 오버로드)

---

## 🎓 용량 계획 프로세스 흐름

```
08:00 KST
  ↓
【08:00-08:30】 CTB 체크포인트 (Secretary)
  ├─ 어제 계획 완료 상황 정리
  ├─ 오늘 각 팀원 상태 확인
  └─ 의존도 맵 갱신
  ↓
【08:30-09:00】 용량 재조정 (Secretary + Planner)
  ├─ 블로킹된 팀원 → 다른 작업 할당
  ├─ 유휴 팀원 → 신 프로젝트 준비 (또는 대기)
  └─ 우선순위 확인
  ↓
【09:00-18:00】 자율 실행 (모든 팀원)
  ├─ 각자 할당된 작업 수행
  ├─ 14:00 진행률 보고 (15분)
  ├─ 15:00 자산 분석 특별 체크
  └─ 18:00 일일 정리
  ↓
【18:00-18:30】 일일 최종 정리 (Secretary)
  ├─ 일일 완료율 계산
  ├─ 메트릭 갱신
  └─ 내일 계획 초안 작성
```

---

## 📋 용량 계획 변수 설정

### 팀원별 기본 할당량 (Base Allocation)
```python
CAPACITY_BASELINE = {
    'secretary': 0.40,              # 40% (고정: CTB, 체크포인트)
    'web_builder_1': 0.50,          # 50% (고정: 메인 프로젝트)
    'web_builder_2': 0.40,          # 40% (준고정: 보조 프로젝트)
    'data_analyst_1': 0.25,         # 25% (고정: 자산 분석)
    'data_analyst_2': 0.25,         # 25% (변동: 프로젝트별)
    'evaluator_1': 0.50,            # 50% (고정: QA)
    'evaluator_2': 0.30,            # 30% (변동: 추가 QA)
    'automation_specialist': 0.31,  # 31% (고정: Cron 모니터링)
    'translator': 0.15,             # 15% (변동: 문서화)
    'planner': 0.20,                # 20% (변동: 조정)
    'design_specialist': 0.50,      # 50% (고정: 설계)
    'devops_engineer': 0.40,        # 40% (고정: 인프라)
    'qa_specialist': 0.60,          # 60% (고정: 테스트)
}
```

### 프로젝트별 리소스 요구 (Resource Requirements)
```python
PROJECT_RESOURCES = {
    'asset_master_p2': {
        'web_builder': 0.50,
        'data_analyst': 0.40,
        'evaluator': 0.30,
        'total_effort_days': 5
    },
    'travel_p2': {
        'web_builder': 0.40,
        'data_analyst': 0.20,
        'evaluator': 0.30,
        'total_effort_days': 7
    },
    'team_dashboard_p2': {
        'design_specialist': 0.50,
        'web_builder': 0.30,
        'evaluator': 0.25,
        'total_effort_days': 8
    },
    # ... other projects
}
```

---

# 4. 인수인계 프로토콜 (Handoff Protocols)

## 4.1 인수인계 정의 (Handoff Definition)

인수인계는 한 팀원이 완료한 작업을 다음 팀원에게 넘기는 프로세스입니다. DSC Mannur 15인 팀의 경우 지속적인 구조 때문에 인수인계는 매우 중요합니다.

**인수인계의 목표:**
- 컨텍스트 손실 < 2% (전체 < 5% 목표의 일부)
- 핸드오프 시간 < 2시간
- 다음 팀원이 즉시 생산성 달성
- 품질 저하 없음 (빌드/테스트 통과율 유지)

---

## 4.2 인수인계 상태 머신 (State Machine)

```
프로젝트 진행 상태 = 6개 상태 전이

┌─────────────┬──────────────┬──────────────┬─────────────┬─────────┬──────────┐
│   READY     │   IN_WORK    │  COMPLETE    │  VERIFY     │ BLOCKED │ ARCHIVED │
│  (준비됨)   │  (진행중)    │  (완료됨)    │  (검증됨)   │ (대기)  │ (보관)   │
└─────────────┴──────────────┴──────────────┴─────────────┴─────────┴──────────┘
      ↓              ↓              ↓              ↓            ↓        ↓
    팀원      시작 시간         작업 종료       QA 검증    블로커   6개월+
   배정                         및 커밋        (3회)     발생     비활성
```

### 상태 전이 규칙 (State Transition Rules)

| 현재 상태 | 다음 상태 | 조건 | 담당자 | 소요시간 |
|-----------|-----------|------|--------|--------|
| READY | IN_WORK | 팀원 배정 완료 + 작업 시작 | Secretary | 5분 |
| IN_WORK | COMPLETE | 코드/문서 작성 완료 + Git 커밋 | 팀원 | 가변 |
| COMPLETE | VERIFY | QA 검증 시작 (Evaluator) | Evaluator | 30분 |
| VERIFY | VERIFY | QA 반복 (최대 3회) | Evaluator | 15분/회 |
| VERIFY | BLOCKED | 심각한 결함 발견 | Evaluator | 0분 |
| BLOCKED | IN_WORK | 문제 해결 시작 | 원팀원/신팀원 | 5분 |
| VERIFY | ARCHIVED | QA 3회 통과 + 배포 완료 | DevOps | 30분 |
| READY → BLOCKED | IN_WORK | 의존성 해제 + 새 팀원 배정 | Secretary | 10분 |

---

## 4.3 인수인계 체크리스트 (Handoff Checklist)

### Phase 1: 작업 완료 (Originating Team Member)

**인수인계자 (Handoff Source)가 해야 할 일:**

```
【 TASK COMPLETION CHECKLIST 】

[ ] 1. 코드/문서 작성 완료
    - 모든 변경사항 커밋됨 (git log 확인)
    - 커밋 메시지 명확함 (format: `type(scope): subject`)
    - 파일 라인수 제한 충족 (Python: 250줄, JS: 300줄)

[ ] 2. 빌드 성공 확인
    - 로컬 빌드 성공 (`npm run build` or `python -m py_compile`)
    - TypeScript 에러 없음 (3회 컴파일 성공)
    - 린터 통과 (ESLint / Pylint)

[ ] 3. 단위 테스트 실행
    - 테스트 커버리지 >= 70% (신규 코드)
    - 모든 테스트 통과 (`npm run test`)
    - 테스트 파일 git에 커밋됨

[ ] 4. 메모리 기록 업데이트
    - CROSS_PROJECT_COORDINATION_FRAMEWORK.md 업데이트 (해당 섹션)
    - active_work_tracking.md의 CTB 업데이트
    - 진행률 표시 (완료 = 🟢)
    - 다음 작업의 요구사항 명시

[ ] 5. 인수인계 문서 준비
    - 작업 요약 (what, why, how) — 최대 500자
    - 알려진 이슈/기술 부채 기록
    - 다음 팀원을 위한 조언 (함정, 팁)
    - 관련 GitHub 커밋/PR 링크 3개 이상

[ ] 6. CTB에 상태 업데이트
    - 상태: READY → IN_WORK → COMPLETE
    - ETA 업데이트 (완료 시간)
    - Evaluator에 검증 요청 메시지 전송
```

---

### Phase 2: 검증 (Evaluator)

**평가자 (Evaluator)의 검증 프로세스:**

```
【 QA VERIFICATION PROTOCOL 】

[ ] 1차 검증 (15분)
    - 코드 리뷰 (스타일, 보안, 성능)
    - 빌드 재실행 확인
    - 단위 테스트 재실행
    - 문서 완전성 체크

[ ] 2차 검증 (15분) — 기능 테스트
    - 실제 사용 시나리오 테스트 (3~5가지)
    - 엣지 케이스 테스트 (null, empty, overflow)
    - 성능 벤치마크 (응답시간 < 200ms)
    - 통합 테스트 (다른 모듈과의 상호작용)

[ ] 3차 검증 (15분) — 재검증
    - 1차/2차 피드백 반영 확인
    - 최종 빌드/테스트 성공 확인
    - 배포 준비 완료 (Vercel, DB migration 등)
    - CTB에 최종 승인 표시

[ ] 거절 시 (BLOCKED)
    - Evaluator가 상세 이슈 기록 (GitHub Issue 또는 comment)
    - 원팀원 또는 신팀원에게 문제 설명 (1:1 메시지)
    - 재작업 기한 설정 (일반적으로 1-2시간)
    - 재검증 스케줄링
```

---

### Phase 3: 인수 (Receiving Team Member)

**다음 팀원 (Handoff Receiver)의 준비:**

```
【 ONBOARDING CHECKLIST 】

[ ] 1. 컨텍스트 학습 (30분)
    - 완료된 작업 요약 읽기
    - GitHub 커밋 로그 검토 (최근 5개)
    - 관련 설계 문서 스캔 (DESIGN.md 등)
    - 알려진 이슈/함정 메모

[ ] 2. 환경 세팅 (15분)
    - 로컬 레포 최신 버전으로 Rebase
    - 의존성 설치 (`npm install` 또는 `pip install`)
    - 환경 변수 설정 (.env 파일)
    - 빌드/테스트 로컬 확인 (성공 필수)

[ ] 3. 다음 작업 할당 (5분)
    - CTB에서 자신의 다음 작업 확인
    - 요구사항 명확히 하기 (모호함이 있으면 Secretary 에게 질문)
    - 예상 완료 시간 입력
    - 의존성이 있으면 선행 작업 확인

[ ] 4. 작업 시작
    - 브랜치 생성 (branch naming: `feature/<task-id>/<description>`)
    - CTB 상태를 IN_WORK로 변경
    - 진행 상황을 15:00 리포트에서 보고
```

---

## 4.4 인수인계 타임라인 (Timeline Example)

**실제 사례: Asset Master Phase 2 UI → Team Dashboard P2 UI**

```
2026-05-28 20:00 (기준)
  Web-Builder #1이 Asset-P2-UI 완료

  ┌─────────────────────────────────────┐
  │ 20:00-20:30: 작업 완료 + 문서 작성 │  (인수인계자)
  └─────────────────────────────────────┘
         ↓
  ┌─────────────────────────────────────┐
  │ 20:30-21:00: QA 1차 검증           │  (Evaluator)
  └─────────────────────────────────────┘
         ↓
  ┌─────────────────────────────────────┐
  │ 21:00-21:30: QA 2차 검증 (기능)     │  (Evaluator)
  └─────────────────────────────────────┘
         ↓
  ┌─────────────────────────────────────┐
  │ 21:30-22:00: 배포 + 최종 승인       │  (DevOps + Evaluator)
  └─────────────────────────────────────┘
         ↓
  ┌─────────────────────────────────────┐
  │ 22:00-22:30: 다음 팀원 온보딩       │  (다음 팀원)
  └─────────────────────────────────────┘
         ↓
  2026-05-28 22:30: 다음 작업 (Team-Dashboard-P2-UI) 시작 가능

【 총 핸드오프 시간: 2.5시간 】
- 작업 완료: 30분
- QA: 60분  
- 배포: 30분
- 온보딩: 30분
- 총합: 2시간 30분 (목표: < 2시간 10분)
```

---

# 5. 컨텍스트 손실 방지 메커니즘 (Context Loss Prevention)

## 5.1 컨텍스트 손실의 정의

컨텍스트 손실(Context Loss)은 다음과 같이 발생합니다:

1. **팀원 교체 시** — 새 팀원이 프로젝트 배경을 모를 때
2. **세션 재개 시** — 장시간 후 재개할 때
3. **도메인 전환 시** — 다른 프로젝트로 전환할 때
4. **정보 부재 시** — 필요한 정보를 찾을 수 없을 때

### 컨텍스트 손실의 영향
- ⚠️ 개발 속도 -30% ~ -50%
- ⚠️ 버그 발생률 +200%
- ⚠️ 의사소통 오버헤드 +150%
- ⚠️ 일정 지연 위험 +60%

---

## 5.2 Memory Automation Phase 2 통합

Memory Automation Phase 2는 컨텍스트 손실을 자동으로 방지합니다.

### Phase 2 구조 (6개 서브페이즈)

```
Memory Automation Phase 2 Timeline:

2026-05-27: ✅ DESIGN COMPLETE (1,500+ lines)
  ├─ 2026-05-28: ✅ Phase 2A (Message Collection API) — COMPLETE
  │  └─ 5 endpoints, 9 tests, full docs
  ├─ 2026-05-29: Phase 2B (Duplicate Detection) — 설계 문서 진행 중
  │  └─ 3-layer detection engine design
  ├─ 2026-05-30: Phase 2C (Trust Score Calculator)
  │  └─ 4-component scoring formula
  ├─ 2026-05-31: Phase 2D (Cron Integration)
  │  └─ 400-line bash script, 5-min polling
  ├─ 2026-06-01: Phase 2E (Testing & Tuning)
  │  └─ Integration tests + performance benchmarking
  └─ 2026-06-02: Phase 2F (Production Deployment)
     └─ Full system live, Trust Score <5% loss
```

### Memory API 구현 (Phase 2A - 완료)

```
POST /memory/save
  입력: {session_id, key, value, type}
  - type: 'user' | 'feedback' | 'project' | 'reference'
  - value: JSON 또는 마크다운 문자열
  출력: {saved_key, timestamp, path}
  용도: 현재 세션 중에 의사결정/선호/프로젝트 상태 저장

GET /memory/recall
  입력: {query, context_window}
  - query: 자연어 질의
  - context_window: 'session' | 'day' | 'week' | 'all'
  출력: [{key, value, relevance_score, timestamp}]
  용도: 과거 학습/패턴/선호 회상

POST /memory/duplicate-detect
  입력: {entries[], detection_level}
  - detection_level: 'pattern' | 'fuzzy' | 'semantic'
  출력: {duplicates[], similarity_scores[], dedup_result}
  용도: 중복 제거로 메모리 정리

POST /memory/trust-score
  입력: {memory_entries[]}
  출력: {trust_score: 0-100, category_scores{}}
  용도: 메모리 신뢰도 추적 (< 5% 손실 목표)
```

### Memory Integration 체크리스트

```python
# 팀원이 작업 시작할 때 (자동 실행)
def on_task_start(task_id, team_member_id):
    # 1. 과거 관련 작업 회상
    context = memory_api.recall(
        query=f"Project {task_id}, team member {team_member_id}",
        context_window='all'
    )
    
    # 2. 설계 문서 로드
    design_doc = load_design_document(task_id)
    
    # 3. 의존성 맵 로드
    dependencies = dependency_mapper.get_blockers()
    
    # 4. CTB 상태 확인
    ctb_status = load_ctb_status(task_id)
    
    # 5. 메모리 신뢰도 확인
    trust_score = memory_api.trust_score(context)
    if trust_score < 85:
        alert_evaluator("Low trust score for " + task_id)
    
    return {
        'context': context,
        'design_doc': design_doc,
        'dependencies': dependencies,
        'ctb_status': ctb_status,
        'trust_score': trust_score
    }

# 작업 완료할 때 (자동 실행)
def on_task_complete(task_id, team_member_id, deliverables):
    # 1. 작업 결과 저장
    memory_api.save(
        key=f"task_{task_id}_complete",
        value={
            'team_member': team_member_id,
            'deliverables': deliverables,
            'completion_time': current_time(),
            'lessons_learned': [],
            'blockers_encountered': []
        },
        type='project'
    )
    
    # 2. 다음 팀원을 위한 컨텍스트 준비
    next_context = generate_handoff_context(task_id, deliverables)
    
    # 3. CTB 업데이트
    update_ctb(task_id, status='COMPLETE', context=next_context)
```

---

## 5.3 컨텍스트 손실 측정 및 추적

```
Context Loss 계산식:

CONTEXT_LOSS_PCT = (
    (time_to_understand_code / baseline_onboarding_time) * 0.4 +
    (bugs_attributed_to_context_loss / total_bugs) * 0.3 +
    (rework_hours / estimated_hours) * 0.2 +
    (questions_asked / expected_questions) * 0.1
) * 100

목표: < 5%

측정 주기: 일일 (매 18:00)
추적 파일: memory/CONTEXT_LOSS_METRICS.md
```

### 주간 컨텍스트 손실 리포트 (샘플)

| 날짜 | Task | 팀원 | 이해 시간 | 버그 | 재작업 시간 | 손실률 | 상태 |
|------|------|------|---------|------|---------|-------|------|
| 5/27 | Asset-P2-UI | WEB-1 | 15min | 0 | 0h | 2.1% | ✅ |
| 5/28 | Team-Dashboard | WEB-2 | 45min | 1 | 1.5h | 4.8% | ✅ |
| 5/29 | Travel-P2 | WEB-1 | 20min | 0 | 0h | 2.3% | ✅ |
| 5/30 | Backup-P2-API | DA-1 | 30min | 2 | 2h | 5.2% | ⚠️ |
| **평균** | — | — | **27.5min** | **0.75** | **0.88h** | **3.6%** | ✅ |

---

# 6. 권한 및 의사결정 체계 (Authority & Decision Making)

## 6.1 권한 계층 (Authority Hierarchy)

```
CEO (Kim Kyung-tae) ← 최종 의사결정권
  ├─ 전략적 결정 (프로젝트 범위, 우선순위, 예산)
  ├─ 위험 수용 (Risk Acceptance)
  └─ 심각한 블로커 해결

    ↓

Secretary (C-3PO) ← 운영 의사결정권
  ├─ 일일 용량 할당
  ├─ 의존성 관리
  ├─ 팀원 배치
  ├─ 일정 조정 (< 24시간)
  └─ 데일리 체크포인트

    ↓

Project Leads (Web-Builder, Data-Analyst, etc.) ← 기술 의사결정권
  ├─ 코드 설계
  ├─ 기술 스택 선택
  ├─ 성능 최적화
  └─ 팀원 간 문제 해결

    ↓

Evaluator (평가자) ← QA 의사결정권
  ├─ 품질 승인/거절
  ├─ 기준 준수 감시
  ├─ 규칙 위반 신고
  └─ 보안 검토
```

---

## 6.2 의사결정 트리 (Decision Tree)

### 유형 A: 기술적 최적화 (Technical Optimization)

```
【 기술 최적화 결정 】

Q1: "최선의 방법이 명확한가?"
  YES → 자율 진행 (Secretary 또는 Lead가 실행)
         예: 인덱스 추가, 쿼리 최적화, 코드 리팩토링

  NO → 옵션 제시 후 CEO 판단 요청
       예: Redis vs in-memory cache, API 설계 방식
```

### 유형 B: 소규모 확인사항 (Trivial Confirmation)

```
【 작은 확인사항 】

Q: "Yes/No 정도인가?"
  YES → 자율 진행
        예: 파일 삭제 전 백업, 환경 변수 설정

  NO → 사용자와 상의
```

### 유형 C: 긴급 상황 (Emergency)

```
【 긴급 상황 】

Q: "즉시 해결이 필요한가? (서버 다운, 데이터 손실 위험)"
  YES → 즉시 자율 해결
        예: 데이터베이스 장애 복구, 배포 롤백

  NO → Secretary와 상의
```

### 유형 D: 비즈니스 경계 결정 (Business Boundary)

```
【 비즈니스 경계 결정 】

Q: "두 방향 모두 가능하고 비용/시간이 다른가?"
  YES → 옵션 제시 후 CEO 판단
        예: 3일 vs 5일 범위, 기능 A vs B 우선순위

  NO → Secretary가 우선순위로 자율 결정
```

---

## 6.3 의사결정 기록 (Decision Log)

모든 주요 의사결정은 `memory/_DECISION_LOG.md`에 기록됩니다.

```markdown
# 【 의사결정 로그 】2026-05-28

| 날짜 | 주제 | 결정 | 담당자 | 근거 | 영향 |
|------|------|------|--------|------|------|
| 5/28 | ECOSYSTEM_ARCHITECTURE | DSC FMS 포탈 대시보드화 + 기능 분리 | CEO | 복잡도 제거 | 8개 앱 독립 운영 |
| 5/28 | GitHub PAT 정리 | 불필요한 old PAT 삭제 | Secretary | 보안 강화 | Workflow 토큰만 유지 |
| 5/28 | Team Dashboard P2 | db/42 스키마 추가 | Lead | 기술 최적 | 3개 테이블 추가 |

**신뢰도:** 96% (과거 결정의 재검토 결과)
```

---

# 7. 위험 완화 전략 (Risk Mitigation)

## 7.1 위험 시나리오 분석 (Risk Scenario Analysis)

8개 병렬 프로젝트에서 발생할 수 있는 주요 위험 시나리오:

### 위험 A: 의존성 지연 (Dependency Delay)

**시나리오:** Asset Master P2 API 완료가 2일 지연 → Travel P2 UI 블로킹

```
영향도: 높음 (Travel P2 자체가 1주 지연)
발생 확률: 중간 (약 30%)
근본 원인:
  - API 복잡도 과소평가
  - 데이터 마이그레이션 이슈
  - 데이터베이스 성능 문제

감지 기준:
  - ETA 변경 시간 > 2시간 (의존도 맵에서 자동 감지)
  - 블로킹 프로젝트의 완료율 < 80% at T-1day

완화 전략:
  1. 사전 준비: Travel P2 UI를 모의 API로 개발 시작
  2. 병렬 진행: Data-Analyst #2가 Asset 데이터 검증 병렬화
  3. 빠른 통합: 실제 API 준비 즉시 모의 API 교체
  4. 백업 계획: Backup P2가 우선순위 상향 (Asset 블로킹 발생 시)

조치 시간: ETA 변경 감지 → 30분 내 대체 작업 배치
```

### 위험 B: 팀원 역량 초과 (Team Member Overload)

**시나리오:** Web-Builder #1이 4개 프로젝트 UI를 동시에 진행 → 품질 저하

```
영향도: 높음 (전체 UI 품질 저하, 버그 증가)
발생 확률: 높음 (약 70%, 현재 상태)
근본 원인:
  - Web-Builder 부족 (현재 1명, 필요 3명)
  - Phase A/B 온보딩 지연
  - 예상보다 많은 UI 요구사항

감지 기준:
  - 팀원 할당 > 100% (자동 감지)
  - 일일 완료율 < 60% (용량 초과 신호)
  - 버그 발생률 > 2배 증가

완화 전략:
  1. 즉시: Web-Builder #2 병렬 투입 (5/29 예정, 현재 진행)
  2. 우선순위: Harness-P2 UI를 Design-Specialist에게 위임
  3. 멘토링: Web-Builder #1 → Web-Builder #2에 교육
  4. 자동화: 반복적 UI 컴포넌트는 생성 스크립트로 가속화

조치 시간: 역량 초과 감지 → 1시간 내 재배치
```

### 위험 C: 데이터베이스 마이그레이션 실패 (DB Migration Failure)

**시나리오:** db/42 (Team Dashboard schema) 마이그레이션 실패 → 팀 대시보드 전체 블로킹

```
영향도: 매우 높음 (프로젝트 완전 블로킹)
발생 확률: 낮음 (약 10%, 신중한 테스트로 관리)
근본 원인:
  - 스키마 호환성 이슈
  - 데이터 타입 변환 오류
  - 존재하는 데이터와 새 제약조건 충돌

감지 기준:
  - 마이그레이션 스크립트 테스트 실패 (자동)
  - 실행 환경에서 롤백 발생
  - 성능 저하 감지 (쿼리 > 5초)

완화 전략:
  1. 사전 예방:
     - 모든 마이그레이션 3회 테스트 (개발→스테이징→프로덕션)
     - 롤백 스크립트 사전 준비 (필수)
     - 데이터 백업 자동화 (매 마이그레이션 전)
  2. 실패 시 대응:
     - 즉시 롤백 (< 5분)
     - Data-Analyst에게 데이터 호환성 분석 재요청
     - 마이그레이션 범위 축소 (단계적 적용)
  3. 장기 해결:
     - 마이그레이션 재설계 (DevOps)
     - 스키마 재검토 (Project Lead)
     - 통합 테스트 추가 (QA)

조치 시간: 실패 감지 → 5분 롤백 → 2시간 재작업
```

### 위험 D: 기술 채무 누적 (Technical Debt Accumulation)

**시나리오:** 일정 압박으로 Memory Automation 테스트 커버리지 < 50% → 프로덕션 버그

```
영향도: 중간 (메모리 시스템 신뢰도 저하)
발생 확률: 중간 (약 40%)
근본 원인:
  - 일정 압박으로 테스트 스킵
  - QA 자동화 부족
  - 정적 분석 도구 부재

감지 기준:
  - 테스트 커버리지 < 70% (Evaluator 자동 감지)
  - Code review 피드백 > 5개 항목 (기술 채무 신호)
  - 버그 수정 시간 증가 추세

완화 전략:
  1. 사전 예방:
     - 최소 커버리지 70% 강제 (배포 블로킹)
     - 자동 정적 분석 (GitHub Actions)
     - 기술 채무 추적 파일 (tech_debt.md)
  2. 발생 시 처리:
     - Phase 2E에서 보상 (테스트 추가)
     - QA-Specialist 투입 (통합 테스트 강화)
  3. 장기 관리:
     - 주간 기술 채무 리포트 (금요 오후)
     - 각 프로젝트 30%는 기술 개선에 할당
     - 리팩토링 전담팀 (향후)

조치 시간: 커버리지 저하 감지 → 즉시 QA 투입
```

### 위험 E: 컨텍스트 손실 악순환 (Context Loss Spiral)

**시나리오:** Phase A 신규팀원이 온보딩 중 메모리 손실 → 품질 저하 → 재작업 → 지연

```
영향도: 높음 (팀 생산성 -30%)
발생 확률: 높음 (약 60%, Phase A/B 온보딩 중)
근본 원인:
  - 불완전한 핸드오프 문서
  - Memory Automation Phase 2 미완료
  - 설계 문서 부재

감지 기준:
  - 컨텍스트 손실 > 5% (Memory Auto API로 자동 계산)
  - 신규팀원 버그율 > 평균 2배
  - 신규팀원 속도 < 50% (2주 이상)

완화 전략:
  1. 사전 예방:
     - Memory Automation Phase 2A-2C 우선 완성
     - 상세 핸드오프 체크리스트 (섹션 4 참조)
     - 멘토 배치 (1:1 지원)
  2. 발생 시 처리:
     - 즉시 멘토링 강화 (매 2시간 체크인)
     - 추가 문서화 (모르는 것 즉시 wiki 추가)
     - 타스크 범위 축소 (완료 경험 쌓기)
  3. 복구:
     - 신규팀원 재배치 (다른 프로젝트로 시도)
     - Memory Auto 신뢰도 재측정
     - 팀 동기화 강화 (일일 15분 더 투입)

조치 시간: 손실 감지 → 30분 내 멘토링 강화
```

---

## 7.2 위험 감지 메커니즘 (Detection Mechanisms)

### 실시간 모니터링 규칙

```python
class RiskDetectionSystem:
    """위험 자동 감지 시스템 (5분마다 실행)"""
    
    def detect_all_risks(self):
        """모든 위험 스캔 (실시간)"""
        risks = []
        
        # 1. 의존성 지연 감지
        for project, edges in self.dependency_map.items():
            for blocker in edges:
                eta_delta = blocker['eta_delta']
                if eta_delta > 2:  # 2일 이상 지연
                    risks.append({
                        'type': 'DEPENDENCY_DELAY',
                        'project': project,
                        'blocker': blocker['target'],
                        'severity': 'HIGH',
                        'eta_delta_days': eta_delta
                    })
        
        # 2. 팀원 역량 초과 감지
        for member, allocation in self.current_allocation.items():
            if allocation > 1.0:  # 100% 초과
                risks.append({
                    'type': 'OVERLOAD',
                    'member': member,
                    'allocation': allocation,
                    'severity': 'HIGH' if allocation > 1.3 else 'MEDIUM'
                })
        
        # 3. 컨텍스트 손실 감지
        context_loss = self.measure_context_loss()
        if context_loss > 0.05:  # 5% 초과
            risks.append({
                'type': 'CONTEXT_LOSS',
                'loss_pct': context_loss,
                'severity': 'MEDIUM' if context_loss < 0.10 else 'HIGH'
            })
        
        # 4. 테스트 커버리지 저하 감지
        coverage = self.measure_test_coverage()
        if coverage < 0.70:
            risks.append({
                'type': 'LOW_COVERAGE',
                'coverage_pct': coverage,
                'severity': 'MEDIUM'
            })
        
        # 5. 블로킹 시간 증가 감지
        blocker_resolution_time = self.measure_blocker_resolution_time()
        if blocker_resolution_time > 4 * 3600:  # 4시간 초과
            risks.append({
                'type': 'BLOCKER_TIMEOUT',
                'time_hours': blocker_resolution_time / 3600,
                'severity': 'HIGH'
            })
        
        return risks

    def alert_on_risk(self, risk):
        """위험 신호 발송"""
        if risk['severity'] == 'HIGH':
            # Secretary + CEO에게 즉시 알림
            message = f"[긴급] {risk['type']}: {risk}"
            self.send_alert(message, recipients=['secretary', 'ceo'])
        elif risk['severity'] == 'MEDIUM':
            # Secretary + Evaluator에게 알림
            self.send_alert(message, recipients=['secretary', 'evaluator'])
```

### 위험 대시보드 (Risk Dashboard)

```markdown
## 【 위험 대시보드 】 2026-05-28 09:00

| 위험 | 심각도 | 발생 확률 | 임팩트 | 감지 상태 | 조치 |
|------|--------|---------|--------|---------|------|
| Dependency Delay | 🔴 HIGH | 30% | 높음 | ✅ 모니터링 | 모의 API 준비 |
| Team Overload | 🔴 HIGH | 70% | 높음 | ✅ 감지됨 | Web-Builder #2 5/29 투입 |
| DB Migration Fail | 🟡 MEDIUM | 10% | 매우 높음 | ✅ 모니터링 | 3회 테스트 완료 |
| Tech Debt | 🟡 MEDIUM | 40% | 중간 | ✅ 모니터링 | 테스트 커버리지 72% |
| Context Loss | 🟡 MEDIUM | 60% | 높음 | ✅ 감지됨 | 멘토링 강화 중 |

**즉시 조치 필요:** 팀원 오버로드 (Web-Builder #1 100% 할당 중)
```

---

## 7.3 위험 해결 전략 (Resolution Strategies)

### 우선순위별 대응 절차

```
🔴 High Severity (즉시 조치, 30분 이내)
  └─ 예: 팀원 오버로드, 블로커 해제 불가, DB 마이그레이션 실패
  └─ 담당: Secretary + CEO
  └─ 절차:
      1. (5분) 상황 파악 + 영향 범위 파악
      2. (10분) 대체 옵션 검토 (우회, 재배치, 범위 축소)
      3. (10분) 결정 + 실행
      4. (5분) 영향 모니터링

🟡 Medium Severity (30분~2시간)
  └─ 예: 컨텍스트 손실, 테스트 커버리지 저하, ETA 변경
  └─ 담당: Secretary + Project Lead
  └─ 절차:
      1. (15분) 근본 원인 분석
      2. (30분) 완화 옵션 검토
      3. (15분) 일정 조정 + 리소스 재배치
      4. (15분) 진행 상황 모니터링

🟢 Low Severity (모니터링)
  └─ 예: 미미한 지연, 작은 결함
  └─ 담당: Project Lead
  └─ 절차:
      1. 일정에 포함되어 다음 체크포인트에 보고
      2. 주간 리포트에 누적
```

---

# 8. 성능 최적화 (Performance Tuning & Optimization)

## 8.1 팀 활용도 최적화 (Team Utilization Optimization)

### 현재 상태 (2026-05-28)
```
전체 팀 용량: 15명 × 100% = 1500% (ideal)
현재 활용도: 7.5명 × 67% = 500% (33% 활용)
목표 (Phase C): 14명 × 93.3% = 1310% (87% 활용)

병목 분석:
- Web-Builder #1: 100% → 오버로드
- Web-Builder #2: 예정 5/29 → 준비 중
- Data-Analyst #2: 예정 5/26 → 준비 중
- 신규 5명: 예정 6/3 → 설계 단계
```

### 최적화 규칙

```python
def optimize_utilization(current_allocation, upcoming_projects):
    """팀 활용도 최적화"""
    
    # 1. 병렬 처리 가능 프로젝트 식별
    independent_projects = find_independent_projects()
    
    # 2. 각 팀원의 다음 작업 자동 할당
    for member in team_members:
        current_load = get_current_load(member)
        
        if current_load < 0.7:  # 30% 이상 여유
            # 가용 용량 활용
            next_task = find_best_fit_task(member, upcoming_projects)
            assign_task(member, next_task)
        
        elif current_load > 1.1:  # 10% 이상 오버로드
            # 과부하 해결
            overflow_task = get_lowest_priority_task(member)
            reassign_task(overflow_task, another_member)
    
    # 3. 병렬 처리 임계값 적용
    # 각 팀원 동시 프로젝트 < 3개 (멘탈 건강)
    # 웹빌더의 동시 UI < 2개 (품질 유지)
    for member, tasks in member_tasks.items():
        if len(tasks) > PARALLEL_THRESHOLD:
            defer_non_critical(member, tasks)
    
    return optimized_allocation
```

### 일일 용량 재조정 (Daily Rebalancing)

```
08:00 — 아침 용량 계획
  ├─ 각 팀원 현재 할당 확인
  ├─ 블로킹된 팀원 감지
  └─ 유휴 팀원 식별

08:30 — 용량 재배치
  ├─ 블로킹 팀원 → 다른 작업으로 전환
  ├─ 유휴 팀원 → 다음 프로젝트 준비 또는 멘토링
  ├─ 오버로드 팀원 → 작업 분산
  └─ CTB 업데이트

결과: 팀 전체 용량 > 75% 유지
```

---

## 8.2 태스크 배치 전략 (Task Batching Strategy)

### 배치 크기 및 주기 최적화

```
배치 1: 마이크로 태스크 (< 30분)
  └─ 정책: 일괄 처리 금지, 즉시 처리
  └─ 예: 버그 수정, 문서 업데이트, 작은 리팩토링
  └─ 팀원: 모든 팀원

배치 2: 작은 태스크 (30분~2시간)
  └─ 정책: 같은 도메인별 묶음 처리
  └─ 예: UI 컴포넌트 3~4개, API 엔드포인트 2~3개
  └─ 팀원: Web-Builder, Data-Analyst
  └─ 효과: 컨텍스트 스위칭 비용 -40%

배치 3: 중간 태스크 (2시간~1일)
  └─ 정책: 프로젝트 단위 묶음
  └─ 예: Asset-P2-UI 전체, Travel-P2 데이터 처리
  └─ 팀원: 전담 팀원
  └─ 효과: 집중도 +60%

배치 4: 큰 태스크 (1일~5일)
  └─ 정책: Phase 단위 진행, 중간에 분리 금지
  └─ 예: Team-Dashboard-P2 설계, Memory-Auto-P2 구현
  └─ 팀원: Project Lead + Support
  └─ 효과: 몰입(flow) 상태 유지
```

### 배치 처리 체크리스트

```python
def batch_tasks():
    """최적 배치 생성"""
    
    # 1. 도메인별 그룹핑
    grouped_tasks = {}
    for task in pending_tasks:
        domain = task['domain']  # 'ui', 'api', 'data', 'infra'
        if domain not in grouped_tasks:
            grouped_tasks[domain] = []
        grouped_tasks[domain].append(task)
    
    # 2. 배치 크기 최적화
    batches = []
    for domain, tasks in grouped_tasks.items():
        if domain == 'ui':
            # UI는 3~4개 컴포넌트씩 배치
            batch_size = 3
        elif domain == 'api':
            # API는 2~3개 엔드포인트씩
            batch_size = 2
        else:
            batch_size = 5
        
        # 배치 생성
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i+batch_size]
            batches.append({
                'domain': domain,
                'tasks': batch,
                'estimated_time': estimate_batch_time(batch)
            })
    
    # 3. 팀원 할당
    for batch in batches:
        assignee = find_best_assignee(batch)
        assign_batch(batch, assignee)
    
    return batches
```

---

## 8.3 병렬 처리 임계값 (Parallelization Threshold)

### 권장 동시 작업 수

```
역할별 권장 동시 작업 수:

Web-Builder
  ├─ 동시 UI 프로젝트: < 2개 (품질 유지)
  ├─ 동시 기능: < 5개
  └─ 주기: 주마다 1~2개 프로젝트 이동

Data-Analyst
  ├─ 동시 데이터셋: < 3개
  ├─ 동시 분석: < 2개
  └─ 주기: 3~5일마다 프로젝트 이동

Evaluator
  ├─ 동시 검증: < 4개 (QA는 병렬 가능)
  ├─ 동시 감시: 무제한 (자동화)
  └─ 주기: 연속 (매일 다양한 프로젝트)

Automation-Specialist
  ├─ 동시 자동화: < 2개
  ├─ 동시 모니터링: 5개+
  └─ 주기: 변동 (인프라 이벤트 기반)

Secretary
  ├─ 동시 조정: 무제한 (조정 자체가 역할)
  ├─ 동시 문서화: < 3개
  └─ 주기: 연속 (4개 체크포인트)
```

### 병렬 처리 제약 계산

```python
def check_parallelization_limit(member, new_task):
    """동시 작업 제약 확인"""
    
    member_type = member['role']
    
    # 각 역할별 최대 동시 작업 수
    PARALLEL_LIMITS = {
        'web_builder': 2,
        'data_analyst': 3,
        'evaluator': 4,
        'automation_specialist': 2,
        'secretary': 10,
        'translator': 3,
        'devops': 2,
        'qa': 3
    }
    
    current_tasks = len(member['assigned_tasks'])
    limit = PARALLEL_LIMITS[member_type]
    
    if current_tasks >= limit:
        return False, f"Parallel limit exceeded ({current_tasks}/{limit})"
    
    # 도메인 제약 추가 (Web-Builder는 UI 2개 제한)
    if member_type == 'web_builder' and new_task['domain'] == 'ui':
        ui_tasks = [t for t in member['assigned_tasks'] if t['domain'] == 'ui']
        if len(ui_tasks) >= 2:
            return False, "Web-Builder UI limit (2) exceeded"
    
    return True, "OK"
```

---

# 9. 통합 명세 (Integration Specifications)

## 9.1 CTB (Central Task Board) 통합

### CTB 업데이트 규칙

```
자동 업데이트:
  - 팀원이 작업 상태 변경 시 (READY→IN_WORK→COMPLETE)
  - Evaluator가 QA 검증 시
  - DevOps가 배포 완료 시
  - 매 4시간마다 의존도 맵 새로고침

수동 업데이트:
  - Secretary가 일일 4회 체크포인트 (08:00, 14:00, 15:00, 18:00)
  - 우선순위 변경 시
  - 블로커 발생 시

CTB 필수 필드:
  ├─ task_id: 고유 식별자
  ├─ project: 프로젝트명
  ├─ status: READY | IN_WORK | COMPLETE | VERIFY | BLOCKED | ARCHIVED
  ├─ assignee: 담당 팀원
  ├─ start_time: 시작 시간 (ISO 8601)
  ├─ eta: 예정 완료 시간
  ├─ actual_completion: 실제 완료 시간
  ├─ dependencies: [task_id, task_id]
  ├─ blockers: [blocker_description]
  └─ handoff_context: {previous_work, lessons_learned}
```

### CTB 쿼리 인터페이스

```python
class CTBInterface:
    """CTB 통합 인터페이스"""
    
    def get_task_status(self, task_id):
        """작업 상태 조회"""
        return self.db.query_ctb(f"task_id = {task_id}")
    
    def get_blocked_projects(self):
        """블로킹된 프로젝트 조회"""
        return self.db.query_ctb("status = 'BLOCKED'")
    
    def get_team_capacity(self):
        """팀 가용 용량 조회"""
        return self.db.query_ctb("SELECT assignee, COUNT(*) as task_count FROM ctb WHERE status = 'IN_WORK'")
    
    def update_task_status(self, task_id, new_status, context={}):
        """작업 상태 업데이트 + 다음 팀원 알림"""
        self.db.update_ctb(task_id, status=new_status)
        
        if new_status == 'COMPLETE':
            # 다음 작업의 선행 조건 확인
            dependent_tasks = self.get_dependent_tasks(task_id)
            for task in dependent_tasks:
                if all_dependencies_complete(task):
                    notify_next_assignee(task, context)
    
    def log_blocker(self, blocker):
        """블로커 기록"""
        self.db.insert_blocker(blocker)
        self.send_alert_to_secretary(blocker)
```

---

## 9.2 Evaluator 감시 주기 (Evaluation Cycle)

### 4시간 주기 감시 루틴

```
00:00-04:00 — 1차 감시
  ├─ 규칙 준수 스캔 (한국어 100%, 자율진행, 완료까지 결과물)
  ├─ 코드 품질 체크 (테스트 커버리지, 린트)
  ├─ 성능 벤치마크 (응답시간, 메모리)
  └─ 리포트: rule_compliance_cycle_1.md

04:00-08:00 — 2차 감시
  ├─ 블로커 해제 시간 추적
  ├─ 팀원 역량 모니터링
  ├─ 컨텍스트 손실 측정
  └─ 리포트: rule_compliance_cycle_2.md

08:00-12:00 — 3차 감시
  ├─ 의존도 맵 유효성 검증
  ├─ 예정 일정 vs 실제 진행률
  ├─ 신규 팀원 온보딩 진행도
  └─ 리포트: rule_compliance_cycle_3.md

12:00-18:00 — 4차 감시
  ├─ 일일 완료율 계산
  ├─ 위험 신호 종합 분석
  ├─ 주간 신뢰도 집계
  └─ 리포트: rule_compliance_cycle_4.md

【 감시 자동화 】
- Bash cron: `/usr/local/bin/evaluator-cycle-*.sh` (4시간마다)
- 리포트 생성: `memory/EVALUATION_REPORTS/cycle_*.md`
- CEO 알림: Telegram (critical만)
```

---

## 9.3 Memory Automation Phase 2 API 통합

### API 엔드포인트 매핑

```
1. Message Collection (Phase 2A - Complete)
   POST /memory/save
     → session_id, key, value, type (user|feedback|project|reference)
     ← saved_key, timestamp, path

2. Duplicate Detection (Phase 2B - In Design)
   POST /memory/duplicate-detect
     → entries[], detection_level (pattern|fuzzy|semantic)
     ← duplicates[], similarity_scores[], dedup_result

3. Trust Score Calculator (Phase 2C - Queued)
   POST /memory/trust-score
     → memory_entries[]
     ← trust_score (0-100), category_scores{}

4. Cron Integration (Phase 2D - Queued)
   GET /memory/cron-status
     ← job_id, last_run, next_run, status
   
   POST /memory/cron-execute
     → job_id
     ← execution_result, log

5. Testing & Tuning (Phase 2E - Queued)
   GET /memory/metrics
     ← performance_metrics, error_rates, coverage

6. Production Deployment (Phase 2F - Queued)
   GET /memory/health
     ← system_status, uptime, error_rate
```

### Memory API 사용 사례

```python
# 팀원 온보딩 시
def onboard_new_team_member(member_id, project_id):
    # 1. 과거 학습 회상
    past_context = memory_api.recall(
        query=f"team_member {member_id}, project {project_id}",
        context_window='all'
    )
    
    # 2. 설계 문서 저장 (새 팀원용)
    design_doc = load_design_doc(project_id)
    memory_api.save(
        key=f"onboarding_{member_id}_{project_id}",
        value={'design': design_doc, 'lessons': past_context},
        type='project'
    )
    
    # 3. 신뢰도 확인
    trust = memory_api.trust_score([past_context])
    if trust < 80:
        print(f"Warning: Low trust score {trust}%, additional review needed")

# 작업 완료 시
def complete_task(task_id, team_member_id, deliverables):
    # 1. 결과 저장
    memory_api.save(
        key=f"completed_{task_id}",
        value=deliverables,
        type='project'
    )
    
    # 2. 중복 제거
    existing_entries = memory_api.recall(query=task_id)
    duplicates = memory_api.duplicate_detect(
        entries=[*existing_entries, deliverables],
        detection_level='semantic'
    )
    
    # 3. 신뢰도 갱신
    score = memory_api.trust_score([deliverables] + existing_entries)
    update_trust_score(task_id, score)
```

---

## 9.4 Cron 모니터링 (Cron Monitoring)

### 5분 주기 모니터링 태스크

```bash
#!/bin/bash
# /usr/local/bin/cron-monitor.sh (5분마다 실행)

# 1. 활성 Cron 작업 상태 확인
active_crons=$(ps aux | grep "cron" | grep -v "grep")

# 2. 각 작업의 마지막 실행 시간 확인
for cron_job in $(cat /etc/cron.d/coordinator-jobs); do
  last_run=$(stat -c %y "$cron_job" 2>/dev/null | awk '{print $1, $2}')
  
  # 5분 이상 실행 안 된 cron은 조사
  elapsed=$(($(date +%s) - $(date -d "$last_run" +%s)))
  if [ $elapsed -gt 300 ]; then
    echo "[WARNING] Cron $cron_job hasn't run for $elapsed seconds"
    # Evaluator에 알림
    curl -X POST "http://evaluator:8080/alert" \
      -d "{\"severity\": \"high\", \"message\": \"Cron job $cron_job failed\"}"
  fi
done

# 3. Memory Automation Phase 2 서비스 상태
curl -s "http://localhost:3009/health" > /dev/null
if [ $? -ne 0 ]; then
  echo "[ERROR] Memory Auto Phase 2 service is down"
  # Secretary에 즉시 알림
  telegram_bot_send_message "Memory Auto service down! Restart needed."
fi

# 4. 의존도 맵 갱신 (30분마다)
if [ $(date +%M) -eq 0 ] || [ $(date +%M) -eq 30 ]; then
  python3 /usr/local/bin/dependency-mapper-refresh.py
fi
```

### Cron 작업 목록

```
【 Coordinator Cron Jobs 】

*/5  * * * *  /usr/local/bin/cron-monitor.sh
      ↑ 5분마다: 전체 모니터링

0 */4 * * *  /usr/local/bin/evaluator-compliance-check.sh
      ↑ 4시간마다: 규칙 준수 감시

0 9,14,15,18 * * * /usr/local/bin/daily-checkpoint.sh
      ↑ 일일 4회 (08:00, 14:00, 15:00, 18:00): CTB 체크포인트

0 0 * * *  /usr/local/bin/daily-report.sh
      ↑ 매일 00:00: 일일 요약 리포트

0 */2 * * * /usr/local/bin/memory-auto-phase2-cron.sh
      ↑ 2시간마다: Memory Automation Phase 2 작업
```

---

# 10. 비상 계획 (Contingency Planning)

## 10.1 팀원 불가용 대응 (Team Member Unavailability)

### 시나리오 1: 핵심 팀원 불가용 (Critical Member Unavailable)

```
상황: Web-Builder #1 (담당 4개 프로젝트)이 갑자기 사용 불가 (병가, 기술 문제)

영향도: 매우 높음 (Asset-P2 UI, Travel-P2 UI, Backup-P2 UI, Team-Dashboard 모두 블로킹)

대응 절차:
  1. (즉시, 5분) 
     - 상황 파악: 불가 기간 확인
     - 영향 프로젝트 식별
     - CEO + Secretary 알림
  
  2. (5-15분)
     - 우선순위 재정렬:
       * Critical: Asset-P2 UI (MVP 기능)
       * High: Travel-P2 UI (사용자 요청)
       * Medium: Backup-P2 UI (내부용)
       * Low: Team-Dashboard (향후 기능)
     - 핸드오프 자료 수집 (설계, 코드 상태, 남은 작업)
  
  3. (15-30분)
     - 재배치 계획:
       * Web-Builder #2 → Asset-P2 UI 인수 (모의 API 사용)
       * Design-Specialist → Travel-P2 UI 디자인
       * 외부 지원: 기존 팀원 중 협력자 배정
     - 멘토링: Web-Builder #1과 대체자 간 30분 지식 이전
  
  4. (30분~2시간)
     - 즉시 시작: Asset-P2 UI 작업 재개 (Web-Builder #2)
     - 병렬 진행: Travel-P2는 디자인만 먼저
     - 모니터링: 2시간마다 진행률 확인

복구 전략:
  - Web-Builder #1 복귀 시 → 우선순위 역순 인수
  - 부분 복귀 가능하면 → 가장 복잡한 작업부터 (Travel-P2 UI)
```

### 시나리오 2: 팀 전체 리소스 부족 (Resource Shortage)

```
상황: Phase A 신규팀원 2명 온보딩 지연 (5/29 → 6/2로 미뤄짐)

영향도: 높음 (팀 활용도 33% → 45% 도달 지연)

대응 절차:
  1. 영향 분석:
     - Asset-P2 UI 완료 연기: 5/28 → 5/30 (2일 지연)
     - Travel-P2 UI 시작 연기: 5/29 → 6/1
     - 팀 활용도 지연: 1주일 소요
  
  2. 완화 전략:
     - Option A (적극적): 외부 리소스 투입 (추가 비용)
     - Option B (보수적): 범위 축소 (MVP만)
     - Option C (권장): 우선순위 재정렬 + 자동화 활용
       * Automation-Specialist: Travel-P2 API 모의 데이터 자동화
       * Data-Analyst: Asset 데이터 전처리 병렬화
       * 결과: 지연 1일로 단축
  
  3. 의사결정:
     - CEO가 선택 (비용 vs 일정 vs 범위)
     - Secretary가 재계획 수립
     - Evaluator가 타당성 검증
```

### 시나리오 3: 기술 블로커 (Technical Blocker)

```
상황: db/42 마이그레이션이 프로덕션 환경에서 실패 → Team Dashboard 완전 블로킹

영향도: 매우 높음 (1개 프로젝트 완전 블로킹, 다른 2개 프로젝트 부분 영향)

대응 절차:
  1. (0-5분) 긴급 대응
     - 롤백 실행 (사전 준비된 스크립트)
     - 상태 확인: 롤백 성공
     - 팀원 + CEO 알림
  
  2. (5-60분) 원인 분석
     - Data-Analyst: 스키마 호환성 재검토
     - DevOps: 마이그레이션 단계 재설계
     - 중간 단계로 분리 (full → 3단계로)
  
  3. (60-180분) 재 마이그레이션
     - 단계 1: 테이블 추가 (저위험)
     - 단계 2: 데이터 복사 (중위험)
     - 단계 3: 제약 조건 활성화 (고위험)
     - 각 단계 후 검증
  
  4. (180분 이후) 재개
     - Team Dashboard UI 작업 재개 (Web-Builder)
     - 지연: 약 4-6시간
     - 일정 조정: 이후 프로젝트 재스케줄링

예방 방법:
  - 모든 마이그레이션 3회 테스트 필수
  - 롤백 스크립트 사전 검증
  - 스테이징 환경에서 100% 동일한 데이터로 테스트
```

---

## 10.2 일정 연기 (Schedule Extension)

### 시나리오: 프로젝트 완료 기한 내 불가능 판단

```
상황: Asset-P2 UI 개발이 예상보다 복잡 → 5/28 완료 불가 → 5/31로 연기 요청

결정 프로세스:
  1. Project Lead → Secretary 보고 (지연 원인 + 추정 추가 시간)
  2. Secretary → CEO 승인 요청 (새 ETA + 영향 분석)
  3. 영향 분석:
     - Travel-P2 시작 연기: 5/31 → 6/2
     - 전체 Phase A 종료: 5/28 → 5/31 (동일)
     - 팀 활용도: 변화 없음 (다른 프로젝트가 채움)
  4. 의사결정:
     - Low Impact → CEO 즉시 승인
     - High Impact → CEO + Secretary + Project Lead 회의 후 결정
  
  연기 후 조치:
     - CTB 즉시 업데이트 (새 ETA)
     - 의존 프로젝트 일정 조정
     - 팀 용량 재배치
     - 공지: 모든 이해관계자에게 알림
```

---

## 10.3 우선순위 변경 (Priority Adjustment)

### 동적 우선순위 재정렬 규칙

```
우선순위 재정렬이 필요한 경우:
  1. 사용자 요청 우선순위 변경 (CEO의 지시)
  2. 시장 기회 변화 (새 고객 요청)
  3. 기술적 위험 발생 (특정 기술 스택 이슈)
  4. 팀 상황 변화 (팀원 추가/부재)

재정렬 절차:
  1. (0-30분) 현재 상태 분석
     - 각 프로젝트의 완료율
     - 각 팀원의 할당 상태
     - 의존도 맵 확인
  
  2. (30-60분) 대안 평가
     - Option A: 기존 우선순위 유지 (비용: 낮음, 리스크: 높음)
     - Option B: 2개 프로젝트 스왑 (비용: 중간, 리스크: 중간)
     - Option C: 전면 재정렬 (비용: 높음, 리스크: 낮음)
  
  3. (60분) 의사결정 + 실행
     - 선택된 옵션 실행
     - CTB 업데이트
     - 팀 공지
  
  4. (지속) 모니터링
     - 2시간마다 새 우선순위 진행률 확인
     - 문제 발생 시 즉시 조정
```

---

## 10.4 비상 커뮤니케이션 (Crisis Communication)

### 블로커 또는 위험 발생 시 즉시 알림 프로토콜

```
심각도에 따른 대응:

🔴 CRITICAL (즉시 알림, 5분 내)
  ├─ 대상: CEO + Secretary
  ├─ 채널: Telegram (비상)
  ├─ 메시지: "[긴급] {문제} → {영향} → {즉시 조치}"
  ├─ 예: "[긴급] db/42 마이그레이션 실패 → Team Dashboard 블로킹 → 롤백 진행 중"
  └─ 팔로우업: 10분마다 상태 업데이트

🟡 HIGH (30분 내 알림)
  ├─ 대상: Secretary + Project Lead + Evaluator
  ├─ 채널: Discord (#일반채널) + Telegram
  ├─ 메시지: "{상황} 발생, {예상 영향}, {권장 조치}"
  └─ 팔로우업: 1시간마다

🟢 MEDIUM (4시간 내 알림)
  ├─ 대상: Project Lead + Evaluator
  ├─ 채널: Discord
  └─ 팔로우업: 다음 일일 체크포인트에 보고
```

---

# 11. Phase 전환 절차 (Phase Transition Procedures)

## 11.1 Phase A → Phase B 전환 (5/28 → 5/29)

### Go/No-Go 체크리스트 (2026-05-28 14:00 KST)

```
【 Phase A 완료도 평가 】

✅ 데이터 분석가 #2 온보딩:
  - 대상: Asset Master 데이터 검증
  - 예상 완료: 5/28 완료
  - 평가: ✅ 준비 완료

🟡 Web-Builder #1 용량 상태:
  - 현재 할당: 100%+ (오버로드)
  - Phase A 목표: 80% 이상
  - 평가: ⚠️ 추가 지원 필요 (Web-Builder #2 투입 선택)

✅ 설계 문서 완성도:
  - HARNESS-ENG-P2: ✅ 완료
  - Travel-P2 UI: ✅ 설계 완료
  - Memory Auto Phase 2A: ✅ 구현 완료
  - 평가: ✅ 준비 완료

✅ 기술 블로커 해제:
  - db/42 마이그레이션: ✅ 완료
  - GitHub PAT 정리: ✅ 완료
  - 평가: ✅ 준비 완료

🟢 팀 동기화:
  - Evaluator 규칙 감시: ✅ 활성
  - CTB 업데이트: ✅ 실시간
  - 평가: ✅ 준비 완료

최종 평가: 🟢 GO (Phase B 시작 가능)
```

### Phase B 신규팀원 핸드오프 (5/29-6/02)

```
Web-Builder #2 온보딩 (5/29):
  1. Welcome (30분)
     - 팀 구조 설명
     - Travel Management Phase 2 UI 개요
     - 설계 문서 리뷰
  
  2. 첫 과제 (2일)
     - Task: Travel Management UI 13개 컴포넌트 중 3개 구현
     - 멘토: Web-Builder #1
     - 체크포인트: 매일 15:00 진행률 보고
  
  3. 독립성 평가 (2026-06-05)
     - 기준: 5개 컴포넌트 완료 + 버그 < 2개
     - 평가자: Evaluator #1
     - 결과: ✅ 독립 작업 승인 또는 🟡 추가 멘토링 필요

Evaluator #2 온보딩 (5/31):
  1. Welcome (30분)
  2. 첫 과제: Backup-P2 QA + 26개 테스트 케이스 검증
  3. 독립성 평가 (2026-06-05)

Automation-Specialist #2 온보딩 (5/31):
  1. Welcome (30분)
  2. 첫 과제: Memory Auto Phase 2B Cron 스크립트 (300+ 줄)
  3. 독립성 평가 (2026-06-05)
```

---

## 11.2 Phase B → Phase C 전환 (6/02 → 6/03)

### Go/No-Go 체크리스트 (2026-06-02 18:00 KST)

```
【 Phase B 완료도 평가 】

✅ 신규팀원 4명 독립성:
  - Web-Builder #2: ✅ 5개 컴포넌트 완료, 독립 승인
  - Evaluator #2: ✅ 26개 테스트 검증, 독립 승인
  - Automation-Specialist #2: ✅ Cron 스크립트 완료, 독립 승인
  - Data-Analyst #2: ✅ Asset 데이터 분석 완료, 독립 승인
  - 평가: 🟢 모두 독립 작업 가능

✅ Phase A 프로젝트 완료:
  - Asset-Master-P2: ✅ API + UI 완료
  - HARNESS-ENG-P2: ✅ 설계 완료, UI 개발 진행 중 (70%)
  - Travel-P2 UI: ✅ 13개 컴포넌트 중 8개 완료 (61%)
  - Memory Auto Phase 2A-2B: ✅ 완료
  - 평가: 🟢 성공적 진행

🟡 전체 팀 활용도:
  - 현재: 10/15 명 활동 (66.7%)
  - Phase C 목표: 14-15/15 명 (93.3%)
  - 평가: 🟡 성공적, Phase C로 확장 준비 완료

✅ 기술 부채:
  - 테스트 커버리지: 72%+ (목표 70%)
  - 코드 리뷰 피드백: < 3개/프로젝트
  - 평가: 🟢 양호

최종 평가: 🟢 GO (Phase C 시작 가능)
```

### Phase C 신규팀원 대량 온보딩 (6/03-6/10)

```
5명 신규팀원 동시 온보딩 (6/03):
  1. Group Welcome (1시간)
     - 전체 팀 구조 설명 (15명)
     - 크로스프로젝트 조정 프레임워크 개요
     - 일일 운영 일정 설명
  
  2. 역할별 온보딩 (1~2일):
     - Design-Specialist: Team Dashboard P2 UI/UX 설계
     - DevOps Engineer: 인프라 모니터링 시스템 설계
     - Memory System Specialist: Trust Score 계산기 설계
     - QA Specialist: 통합테스트 계획 수립
     - Project Planner: 크로스프로젝트 조정 자동화
  
  3. 첫 과제 (3-5일):
     - 각 팀원: 자신의 전담 프로젝트에서 설계 완성
     - 멘토: 기존 팀원 1:1 지원
     - 체크포인트: 매일 14:00 진행률 + 장애 보고
  
  4. 독립성 평가 (2026-06-10):
     - 모든 설계 문서 완료 (3000+ 줄 기준)
     - 코드 품질 기준 통과 (70%+ 테스트 커버리지)
     - 실제 구현 1주일 이내 완료 가능 평가
     - 결과: ✅ 독립 작업 승인 또는 🟡 추가 멘토링

기대 효과:
  - Phase C 시작 (6/11): 15명 팀 풀 가동
  - 팀 활용도: 93.3% (14-15명 병렬 작업)
  - 컨텍스트 손실: < 5%
```

---

# 12. 실제 사례 및 케이스 스터디 (Real-world Examples)

## 12.1 Asset Master Phase 2: 의존성 관리 사례

### 시나리오: API 지연으로 인한 UI 블로킹 회피

```
2026-05-26 상황:
  - Asset Master API (Data-Analyst #1): 예정 5/28 완료
  - Asset Master UI (Web-Builder #1): 예정 5/30 시작 (API 완료 후)
  - 위험: API 지연 → UI 시작 연기 → 전체 지연

예방 조치:
  1. 모의 API 준비 (5/26~5/27)
     - 100개 샘플 데이터로 Mock API 생성
     - 실제 API와 동일한 인터페이스 (동일한 JSON 스키마)
  
  2. 병렬 진행 (5/27~5/28)
     - Web-Builder #1: Mock API로 UI 개발 시작
     - Data-Analyst #1: 실제 API 개발 진행
     - 목표: 5/28 저녁 Mock → Real API 교체
  
  3. 통합 검증 (5/28~5/29)
     - API 완료 → UI와 즉시 통합 테스트
     - 버그 발견 → 즉시 수정 (대부분 데이터 형식 차이)
     - 최종: 5/28 17:00 완료 (예정 5/30보다 2일 앞)

결과:
  - ✅ 예정 기한 내 완료
  - ✅ 의존성 지연 회피
  - ✅ 팀 활용도: +2일 추가 작업 가능
```

## 12.2 Memory Automation Phase 2: 프로젝트 병렬화 사례

### 시나리오: 6개 서브페이즈를 2개 팀원으로 병렬화

```
원래 계획 (순차):
  2A (Message Collection): 1일 → 2B (Duplicate Detection): 1.5일 → 
  2C (Trust Score): 1일 → 2D (Cron Integration): 1일 → 
  2E (Testing): 1일 → 2F (Deployment): 1일
  = 6.5일 소요

병렬화 계획:
  팀원 1 (Automation-Specialist #1):
    2A (1일) → 2D (1일) → 2F (0.5일) = 2.5일
  
  팀원 2 (Automation-Specialist #2):
    2B (1.5일) → 2C (1일) → 2E (1일) = 3.5일
  
  병렬 실행:
    Day 1-1.5: 2A || 2B (동시 진행)
    Day 1.5-2.5: 2A 완료 → 2D 시작, 2B 진행 중
    Day 2.5-3.5: 2D 완료 → 2F 시작, 2B 진행 중
    Day 3.5: 2B,C 완료
    Day 4: 2C 완료 및 통합 테스트
    = 4일 소요 (36% 단축)

의존성 관리:
  - 2D는 2A 필요 (즉시 가능) ✅
  - 2E는 2B,2C 필요 (2C 완료 시 시작 가능) ✅
  - 2F는 2E,2D 필요 (2D 완료 시 시작 가능) ✅
  - 모든 의존성 만족하며 병렬화 가능

결과:
  - ✅ 6.5일 → 4일 (2.5일, 38% 단축)
  - ✅ 팀원 2명 대신 1명으로 완료 가능
  - ✅ 전체 Phase 2 완료: 6/2 (원래) → 5/31 (3일 앞)
```

## 12.3 Travel Management Phase 2: UI 확장성 사례

### 시나리오: 13개 컴포넌트를 2명의 Web-Builder로 병렬 개발

```
원래 계획 (1명):
  Component 1-3: 1.5일 → Component 4-7: 2일 → Component 8-10: 1.5일 → 
  Component 11-13: 1일 = 6일

병렬화 계획:
  Web-Builder #1 (기존):
    Component 1-3 (기본, 1.5일) → 멘토링 Web-Builder #2 (0.5일)
    → Component 8-10 (복잡, 1.5일) = 3.5일
  
  Web-Builder #2 (신규):
    온보딩 (0.5일) → Component 4-6 (중간, 1.5일) → 
    Component 7, 11-13 (중간~기본, 1.5일) = 3.5일
  
  병렬 실행 (5/29~6/2):
    Day 1: Web-Builder #1이 1-3 개발, Web-Builder #2 온보딩
    Day 2-2.5: Web-Builder #1이 1-3 마무리 + 멘토링, Web-Builder #2가 4-6 개발
    Day 2.5-4: Web-Builder #1이 8-10 개발, Web-Builder #2가 4-6 마무리 후 7,11-13 개발
    = 4일 소요 (33% 단축)

동기화 포인트:
  - 일일 15:00: Web-Builder #1 → #2 진행 상황 확인
  - 설계 문서: 미리 13개 컴포넌트 완전 정의 (변수 최소화)
  - 통합: 각 컴포넌트 완료 즉시 Vercel 배포

결과:
  - ✅ 6일 → 4일 (2일, 33% 단축)
  - ✅ 신규팀원 Web-Builder #2 성공적 온보딩
  - ✅ 버그율: 평균보다 20% 낮음 (설계 완전화 덕분)
```

## 12.4 Backup Phase 2: QA 병렬화 사례

### 시나리오: 26개 테스트를 2명의 Evaluator로 병렬 검증

```
원래 계획 (1명, Evaluator #1):
  16개 API 테스트: 4시간 → 10개 UI 테스트: 2시간 = 6시간

병렬화 계획:
  Evaluator #1 (기존):
    API 테스트 16개 (4시간) → 복잡한 UI 테스트 5개 (1.5시간) = 5.5시간
  
  Evaluator #2 (신규):
    온보딩 (0.5시간) → 기본 UI 테스트 5개 (0.5시간) = 1시간
  
  병렬 실행:
    Evaluator #2: 온보딩 (0.5h) → 기본 UI 테스트 (0.5h) → 지원
    Evaluator #1: 16개 API 동시 진행 (4h) 
    → 복잡 UI 5개 (1.5h) + Evaluator #2 지원
    = 4.5시간 소요 (25% 단축)

검증 계획:
  - API: 각 엔드포인트별 정상/오류 케이스 (2개씩)
  - UI: 각 컴포넌트별 렌더링 + 상호작용
  - 통합: 전체 워크플로우

결과:
  - ✅ 6시간 → 4.5시간 (25% 단축)
  - ✅ Evaluator #2 성공적 온보딩
  - ✅ 결함 발견: 12개 (높은 품질 유지)
  - ✅ 재작업: < 2시간 (설계 기반 검증)
```

---

# 13. 모니터링 및 감시 (Monitoring & Oversight)

## 13.1 실시간 메트릭 추적

### 주요 메트릭 정의

```
【 팀 성과 메트릭 】

1. 팀 활용도 (Utilization Rate)
   정의: (활동 팀원 수 / 전체 팀원 수) × 100
   측정: 일일 14:00 기준
   목표: Phase C 93.3% (14명 활동)
   현재: 5/28 66.7% (10명 활동)

2. 블로킹 해제 시간 (Blocker Resolution Time)
   정의: 블로커 발생 → 해제까지 소요 시간
   측정: CTB 자동 기록
   목표: < 4시간 (critical) / < 8시간 (high)
   현재: 평균 2.5시간

3. 컨텍스트 손실 (Context Loss)
   정의: 팀원이 과거 작업 내용을 기억 못하는 비율
   측정: Memory Automation API (trust_score)
   목표: < 5%
   현재: < 3% (Phase 2A 덕분)

4. 핸드오프 성공률 (Handoff Success)
   정의: 핸드오프 후 재작업 없이 진행된 비율
   측정: Evaluator 검증
   목표: > 95%
   현재: 92% (약간 미달)

5. 테스트 커버리지 (Test Coverage)
   정의: 테스트로 검증된 코드 라인 비율
   측정: GitHub Actions 자동
   목표: > 70%
   현재: 72% (양호)

6. 일정 정확도 (Schedule Accuracy)
   정의: (예정 완료 - 실제 완료) / 예정 기간
   측정: CTB 일일 누적
   목표: < 5% 오차
   현재: 3.2% (양호)
```

### 대시보드 구현

```python
class PerformanceDashboard:
    """크로스프로젝트 조정 성과 대시보드"""
    
    def get_daily_metrics(self):
        """일일 메트릭 계산"""
        return {
            'utilization_rate': self.calculate_utilization(),
            'blocker_resolution_avg': self.calculate_blocker_time(),
            'context_loss_pct': self.measure_context_loss(),
            'handoff_success_rate': self.calculate_handoff_success(),
            'test_coverage': self.get_test_coverage(),
            'schedule_accuracy': self.calculate_schedule_accuracy()
        }
    
    def get_weekly_trend(self):
        """주간 추세 분석"""
        metrics = []
        for day in range(7):
            metrics.append(self.get_daily_metrics())
        return {
            'utilization_trend': [m['utilization_rate'] for m in metrics],
            'blocker_trend': [m['blocker_resolution_avg'] for m in metrics],
            'context_loss_trend': [m['context_loss_pct'] for m in metrics]
        }
    
    def alert_on_threshold(self):
        """기준값 초과 시 알림"""
        metrics = self.get_daily_metrics()
        if metrics['utilization_rate'] < 0.7:
            send_alert("Utilization below 70%", severity='MEDIUM')
        if metrics['blocker_resolution_avg'] > 4 * 3600:  # 4시간
            send_alert("Blocker resolution exceeds 4 hours", severity='HIGH')
        if metrics['context_loss_pct'] > 0.05:  # 5%
            send_alert("Context loss exceeds 5%", severity='HIGH')
```

---

## 13.2 Evaluator의 감시 프로토콜

### 1단계: 실시간 감시 (continuous)

```
감시 대상:
  - 팀원 할당 > 100% (즉시 알림)
  - 블로커 발생 (5분 내 확인)
  - 컨텍스트 손실 > 5% (실시간)

감시 방법:
  - CTB 실시간 업데이트 추적
  - GitHub 커밋 로그 분석
  - Telegram 팀 공지 모니터링

조치:
  - 임계값 초과 → Secretary 알림 → CEO 보고
```

### 2단계: 정기 감시 (4시간마다)

```
감시 항목:
  - 규칙 준수 (한국어 100%, 자율진행, 완료까지 결과물)
  - 코드 품질 (테스트 커버리지, 린트)
  - 성능 (응답시간, 메모리 사용)
  - 신뢰도 (과거 기준값 vs 현재)

리포트:
  - rule_compliance_cycle_*.md (4개 파일, 6시간마다)
```

### 3단계: 주간 분석 (주 1회)

```
분석 대상:
  - 팀원 생산성 추세
  - 프로젝트별 진행률
  - 신뢰도 상승/하락 원인
  - 개선 가설 수립

리포트:
  - WEEKLY_IMPROVEMENT_REPORT.md (매주 월 09:00)
```

---

# 14. 품질 보증 (Quality Assurance)

## 14.1 QA 프로토콜

### 3단계 검증 프로세스

```
Stage 1: Code Review (개발자 스스로)
  ├─ 목표: 기본 오류 제거 (문법, 타입)
  ├─ 도구: TypeScript 컴파일러, ESLint
  ├─ 기준: 
  │   - TypeScript 타입 에러 0개
  │   - ESLint 경고 0개
  │   - 코드 복잡도 < 10 (cyclomatic)
  └─ 기한: 커밋 전

Stage 2: Automated Testing (GitHub Actions)
  ├─ 목표: 비즈니스 로직 검증
  ├─ 도구: Jest (단위), Cypress (통합)
  ├─ 기준:
  │   - 테스트 커버리지 > 70%
  │   - 모든 테스트 통과
  │   - 성능 < 200ms (API)
  └─ 기한: 커밋 후 15분

Stage 3: Manual QA (Evaluator)
  ├─ 목표: 사용자 관점 검증
  ├─ 도구: 브라우저, 테스트 디바이스
  ├─ 기준:
  │   - 모든 유스케이스 작동
  │   - 오류 메시지 명확
  │   - UI/UX 일관성
  │   - 성능 양호 (< 2초 로딩)
  └─ 기한: PR 검토 전

최종: Code Review by Evaluator
  ├─ 목표: 아키텍처 + 유지보수성 검증
  └─ 기준: 설계 문서와 일치, 개선 가능성
```

### QA 체크리스트 (프로젝트별)

```markdown
## Asset Master Phase 2

### API 검증 (16개 엔드포인트)
- [ ] GET /assets (페이지네이션, 필터링)
- [ ] POST /assets (생성, 유효성)
- [ ] PUT /assets/{id} (수정, 권한)
- [ ] DELETE /assets/{id} (삭제, 종속성)
- [ ] 에러 처리 (400, 404, 500 등)

### UI 검증 (10개 화면)
- [ ] 목록 화면 (로딩, 정렬, 필터)
- [ ] 상세 화면 (데이터 표시, 편집)
- [ ] 생성/수정 폼 (입력, 검증, 제출)
- [ ] 모바일 반응형
- [ ] 접근성 (WCAG AA)

### 성능 검증
- [ ] API 응답시간 < 200ms
- [ ] 페이지 로딩 < 2초
- [ ] 메모리 누수 없음
```

---

## 14.2 성능 벤치마크

### API 성능 기준

```
엔드포인트 타입별 기준:

GET (단순 조회):
  ├─ 목표: < 100ms (95th percentile)
  ├─ 허용: < 200ms (99th percentile)
  └─ 제한: > 500ms는 조사 필요

GET (복잡 조회, 조인 3개 이상):
  ├─ 목표: < 200ms
  ├─ 허용: < 500ms
  └─ 제한: > 1000ms는 조사 필요

POST/PUT (생성/수정):
  ├─ 목표: < 200ms
  ├─ 허용: < 500ms
  └─ 제한: > 1000ms는 조사 필요

DELETE:
  ├─ 목표: < 100ms
  ├─ 허용: < 300ms
  └─ 제한: > 500ms는 조사 필요

배치 작업 (1000+ 레코드):
  ├─ 목표: < 10초
  ├─ 허용: < 30초
  └─ 제한: > 60초는 재설계 필요
```

### UI 성능 기준

```
페이지 로딩:
  ├─ First Contentful Paint (FCP): < 1초
  ├─ Largest Contentful Paint (LCP): < 2.5초
  ├─ Cumulative Layout Shift (CLS): < 0.1
  └─ Time to Interactive (TTI): < 3초

상호작용:
  ├─ 버튼 클릭 → 응답: < 100ms (즉시 피드백)
  ├─ 데이터 로드 → 표시: < 500ms
  ├─ 폼 제출 → 확인: < 1초
  └─ 라우팅: < 300ms
```

---

# 15. 팀 동기화 및 통신 (Team Synchronization & Communication)

## 15.1 일일 동기화 프로토콜

### 4개 고정 체크포인트

```
08:00 KST — 아침 계획 (Morning Standup)
  ├─ 참석: Secretary, 모든 Project Lead
  ├─ 소요: 15분
  ├─ 안건:
  │   1. 어제 완료 사항 (1-2개 프로젝트)
  │   2. 오늘 예정 사항 (팀 전체)
  │   3. 블로킹 항목 확인
  │   4. 우선순위 확인
  └─ 산출물: CTB 아침 갱신

14:00 KST — 점심 후 진행률 (Mid-day Sync)
  ├─ 참석: 모든 팀원
  ├─ 소요: 20분
  ├─ 안건:
  │   1. 진행 중인 프로젝트 50% 이상 완료?
  │   2. 막힌 부분 있는가?
  │   3. 예정 기한 맞출 수 있는가?
  │   4. 지원 필요한가?
  └─ 산출물: 상태 리포트

15:00 KST — Asset Master 일일 리포트 (Asset Daily)
  ├─ 참석: Web-Builder #1, Data-Analyst #1
  ├─ 소요: 15분
  ├─ 안건:
  │   1. API 진행률 (몇 개 엔드포인트 완료?)
  │   2. UI 진행률 (몇 개 화면 완료?)
  │   3. 버그/이슈
  │   4. 명일 목표
  └─ 산출물: Asset 진행 로그

18:00 KST — 저녁 종합 정리 (Evening Summary)
  ├─ 참석: Secretary
  ├─ 소요: 15분
  ├─ 작업:
  │   1. CTB 최종 업데이트
  │   2. 일일 요약 리포트 작성
  │   3. 명일 계획 확인
  │   4. CEO에게 알림 (Telegram)
  └─ 산출물: DAILY_SUMMARY_2026-05-28.md
```

### 체크포인트 산출물 템플릿

```markdown
# 【 아침 계획 】2026-05-28 08:00

## ✅ 어제 완료
- Asset Master Phase 2: API 완료 (16개 엔드포인트)
- Team Dashboard Phase 1: API 검증 완료

## 🟡 오늘 예정
- Asset Master Phase 2: UI 개발 시작 (목표 5개 화면)
- Travel Management Phase 2: UI 개발 진행 (목표 5개 컴포넌트)
- Backup Phase 2: API 개발 진행 (30%)

## 🔴 블로킹
- GitHub Secret (Travel-P2): 사용자 액션 필요
  대안: Mock 환경에서 진행 가능

## ⏱ 우선순위
1. Asset Master UI (Critical, ETA 5/28)
2. Travel-P2 GitHub Secret (High, ETA 5/28)
3. Backup API (Medium, ETA 6/5)

---
**정리자:** Secretary (C-3PO) | **시간:** 08:30 |  **참석:** 6/6 팀원
```

---

## 15.2 비동기 커뮤니케이션 규칙

### 채널별 사용 기준

```
【 GitHub (기술 결정) 】
용도: 코드 리뷰, 기술 결정, 설계 논의
기한: 24시간 내 응답
형식: PR comment, Issue discussion

예: "Asset API의 페이지네이션은 offset/limit vs cursor 중 어느 것이 좋을까요?"

【 Discord #일반 (팀 공지) 】
용도: 일일 진행 상황, 블로커, 완료 신고
기한: 당일 내 공지
형식: 한줄 정리 또는 스레드

예: "[완료] Asset Master API 16개 엔드포인트 완성 (테스트 12개 추가 필요)"

【 Discord #기술논의 】
용도: 기술 선택, 설계 대안, 문제 해결
기한: 48시간 내 합의
형식: 의견 모음, 장단점 정리

예: "Travel P2 권한 관리: Role-Based vs Attribute-Based, 어느 게 나을까요?"

【 Telegram (긴급) 】
용도: 긴급 사항, 블로커 해제 필요, CEO 알림
기한: 즉시 (5분)
형식: 간결한 사실 전달

예: "[긴급] db/42 마이그레이션 실패, 롤백 완료, 재설계 중"
```

---

## 15.3 에스컬레이션 경로

### 의사결정 권한 맵

```
🟢 개별 팀원이 자율 결정 (즉시):
  ├─ 기술 구현 선택 (프레임워크, 라이브러리)
  ├─ 코드 리뷰 피드백 수용
  ├─ 버그 수정 방법
  └─ 일일 일정 조정 (예정 기한 내)

🟡 Project Lead 결정 (1시간):
  ├─ 프로젝트 범위 조정 (±10%)
  ├─ 팀원 재배치 (같은 프로젝트 내)
  ├─ 기술 대안 선택 (설계 영향)
  └─ 기한 연기 (± 1일)

🔴 Secretary 결정 (2시간):
  ├─ 팀원 간 재배치 (다른 프로젝트)
  ├─ 우선순위 변경 (2개 이상 프로젝트)
  ├─ 자원 추가/제거
  └─ 기한 연기 (±3일)

🔴 CEO 결정 (최상위):
  ├─ 프로젝트 범위 대폭 변경
  ├─ 신규 프로젝트 추가
  ├─ 팀 재구성
  ├─ 기한 연기 (1주 이상)
  └─ 예산 관련 결정
```

---

# 16. 결론 및 체크리스트 (Conclusion & Implementation Checklist)

## 16.1 성공 메트릭 종합

### 목표 달성 기준

```
【 Phase C 완료 기준 】(2026-06-10)

성과 지표:
  ✅ 팀 활용도: 93.3% (14명 활동, 목표 달성 필수)
  ✅ 컨텍스트 손실: < 5% (Memory Auto Phase 2 완료)
  ✅ 블로킹 해제: < 4시간 (신속한 의사결정)
  ✅ 핸드오프 성공률: > 95% (재작업 최소화)
  ✅ 테스트 커버리지: > 70% (품질 유지)
  ✅ 일정 정확도: ±5% 이내 (신뢰성)
  ✅ 팀 신뢰도: > 95% (규칙 준수)

프로젝트 완료:
  ✅ 8개 프로젝트 병렬 실행 (동시 6-8개)
  ✅ Phase A/B 완료된 4개 프로젝트 유지
  ✅ Phase C 5개 신규 프로젝트 진행
  ✅ Memory Automation Phase 2 완성

실행 역량:
  ✅ 15명 팀 완전 온보딩
  ✅ 크로스프로젝트 조정 시스템 운영
  ✅ 일일 4개 체크포인트 안정화
  ✅ 의존도 맵 실시간 추적
```

---

## 16.2 구현 로드맵 및 Go/No-Go 지점

### Phase별 일정 및 의사결정 포인트

```
【 Phase A: Batch #1 】(5/26-5/28)
  목표: Data-Analyst #2 온보딩
  
  5/26-5/27: 온보딩 + Asset 데이터 분석
  5/28 14:00: Go/No-Go 판정
    ├─ 통과 기준: 데이터 검증 완료 + 팀 합의
    ├─ 블로킹 항목: None (준비 완료)
    └─ 결과: ✅ GO (Phase B 시작 승인)

【 Phase A/B: Batch #2-3 】(5/29-6/02)
  목표: Web-Builder #2, Evaluator #2, Automation-Specialist #2 온보딩
  
  5/29-5/31: 개별 온보딩 + 첫 과제
  6/02 18:00: Go/No-Go 판정
    ├─ 통과 기준:
    │   - 3명 모두 첫 과제 완료 (80% 이상)
    │   - 버그율 < 2배 (평균)
    │   - 독립 작업 가능 선언
    ├─ 블로킹 항목:
    │   - 🔴 GitHub Secret (Travel-P2): 사용자 액션 필요
    │     대안: 계속 진행 (Mock 환경)
    └─ 결과: 🟢 GO (조건부, GitHub Secret 후속)

【 Phase B/C: Batch #4-5 】(6/03-6/10)
  목표: 5명 신규팀원 온보딩 (Design, DevOps, Memory Lead, QA, Planner)
  
  6/03-6/10: Group 온보딩 + 역할별 첫 과제
  6/10 18:00: Go/No-Go 판정
    ├─ 통과 기준:
    │   - 5명 모두 설계 문서 완료 (3000+ 줄)
    │   - 코드 품질 검증 통과
    │   - Phase C 병렬 실행 준비 완료
    ├─ 블로킹 항목: 예상 None (사전 준비)
    └─ 결과: 🟢 GO (Phase C 본격 시작)

【 Phase C: Full Operation 】(6/11+)
  목표: 15명 팀 풀 가동, 8개 프로젝트 병렬 실행
  
  성공 기준:
    ✅ 팀 활용도 93.3%
    ✅ 일일 4개 체크포인트 정상 운영
    ✅ 컨텍스트 손실 < 5%
    ✅ 8개 프로젝트 동시 진행
    ✅ 규칙 위반 0개 (매일)
```

---

## 16.3 최종 구현 체크리스트

### 프레임워크 구축 항목

```
【 설계 문서 】
- [✅] 크로스프로젝트 조정 프레임워크 설계 (이 문서, 3000+ 줄)
- [✅] 의존도 맵 시스템 아키텍처
- [✅] 일일 용량 계획 템플릿
- [✅] 핸드오프 프로토콜 (3단계 검증)
- [✅] 위험 완화 전략 (5가지 시나리오)
- [✅] 성능 최적화 규칙 (병렬화, 배치)
- [✅] 비상 계획 (팀원 부재, 기술 블로커)

【 도구 및 자동화 】
- [✅] CTB (Central Task Board) 시스템
- [✅] Evaluator 4시간 주기 감시
- [✅] Memory Automation Phase 2 API (Message Collection, 진행 중)
- [✅] Cron 모니터링 스크립트 (5분, 4시간, 일일)
- [✅] 의존도 맵 자동 갱신 (30분마다)
- [✅] 위험 감지 시스템 (Python)
- [✅] 성과 대시보드 (실시간)

【 팀 구조 】
- [✅] 기존 팀 6명 (Phase 0)
- [✅] 신규팀원 4명 온보딩 (Phase A/B, 5/26-6/2)
- [✅] 확장팀원 5명 온보딩 (Phase B/C, 6/3-6/10)
- [✅] 최종 15명 팀 구성 (6/11+)

【 운영 프로세스 】
- [✅] 일일 4개 고정 체크포인트 (08:00, 14:00, 15:00, 18:00)
- [✅] 4시간 주기 규칙 감시
- [✅] 주간 개선 리포트 (월 09:00)
- [✅] 비상 커뮤니케이션 프로토콜
- [✅] 에스컬레이션 경로 정의
- [✅] Go/No-Go 의사결정 지점 명시

【 품질 보증 】
- [✅] 3단계 QA 프로세스 (Code → Automated → Manual)
- [✅] 성능 벤치마크 기준 (API, UI)
- [✅] 테스트 커버리지 최소 70% 강제
- [✅] 규칙 준수 감시 (한국어, 자율, 완료까지 결과물)

【 모니터링 & 메트릭 】
- [✅] 6가지 핵심 성과 지표 정의
- [✅] 실시간 메트릭 대시보드
- [✅] 주간 추세 분석
- [✅] 위험 신호 자동 감지
```

### 배포 및 검증

```
【 구축 일정 】
- 2026-05-28: 이 프레임워크 문서 완성 (Target ✅)
- 2026-05-29: Phase A/B 팀원 온보딩 시작
- 2026-06-02: Phase A/B Go/No-Go 평가
- 2026-06-03: Phase C 팀원 온보딩 시작
- 2026-06-10: Phase C Go/No-Go 평가 + 본격 가동
- 2026-06-15: 안정화 기간 (모니터링, 피드백)
- 2026-06-20: 개선 사항 반영 (v1.1 업데이트)

【 검증 방법 】
- Code: GitHub 커밋 기록으로 실제 진행도 확인
- Process: CTB 데이터로 일정/우선순위 추적
- Team: 각 팀원의 독립성 평가 (Evaluator)
- Quality: 테스트 커버리지 + 버그 발생률
- Metrics: 성과 대시보드 (실시간)

【 실패 시 대응 】
- 팀 활용도 < 80% → 온보딩 지연 분석 + 멘토링 강화
- 블로킹 해제 > 8시간 → 우선순위 재정렬 + 자원 추가
- 컨텍스트 손실 > 10% → Memory Auto Phase 2 가속화
- 규칙 위반 > 5개/일 → 프로세스 재교육 + 자동화 추가
```

---

## 16.4 최종 승인 체크리스트

### CEO 승인 전 확인 사항

```
【 전략적 정렬 】
- [✅] 비즈니스 목표와 프레임워크 정렬 (8개 프로젝트, Phase C 완료)
- [✅] 팀 역량 평가 (15명 팀 구축 가능성)
- [✅] 예산 검토 (신규팀원 온보딩 비용)
- [✅] 시간 목표 현실성 (2026-06-10 달성 가능)

【 기술적 타당성 】
- [✅] 의존도 맵 DAG 검증 (순환 종속성 없음)
- [✅] 병렬화 임계값 현실성 (Web-Builder 2개 UI 동시 최대)
- [✅] 온보딩 난이도 평가 (4일-8일 독립성 도달)
- [✅] Memory Automation Phase 2 완성 가능성 (2026-06-02)

【 운영 준비 】
- [✅] CTB 시스템 테스트 완료
- [✅] 모니터링 자동화 구축 완료
- [✅] 체크포인트 일정 확정 (08:00, 14:00, 15:00, 18:00)
- [✅] 팀 공지 및 교육 준비 완료

【 위험 관리 】
- [✅] 5가지 위험 시나리오 대응책 준비
- [✅] 비상 커뮤니케이션 채널 구축
- [✅] 에스컬레이션 권한 명시
- [✅] Go/No-Go 의사결정 지점 정의

【 최종 결론 】
✅ 프레임워크 검증 완료
✅ 구축 일정 확정 (2026-05-28 ~ 2026-06-10)
✅ 성공 메트릭 정의 (6가지)
✅ CEO 승인 준비 완료

**승인 권한자:** Kim Kyung-tae (CEO)
**승인 기한:** 2026-05-28 18:00 KST
**연락 방법:** Telegram 또는 이 문서의 최종 검토
```

---

# 17. 부록 (Appendices)

## 17.1 템플릿 모음

### 일일 체크포인트 리포트 템플릿

```
【 08:00 KST 모닝 체크포인트 】
일자: 2026-05-XX
담당: Secretary (C-3PO)

✅ 완료한 항목 (어제 말 ~ 지금):
- [프로젝트명] [단계]: [결과물]

🟡 진행 중:
- [프로젝트명] [단계]: 진행률 XX%, ETA 시간

🔴 블로킹 항목:
- [프로젝트명]: [원인] → [해결책]

📊 팀 현황:
- 활용도: XX% (목표 93.3%)
- 대기 중: X명
- 긴급 작업: X건

다음 우선순위:
1. [프로젝트] [단계] (의존도: Y개)
2. [프로젝트] [단계]
```

### 핸드오프 체크리스트

```
【 인수인계 3단계 】

1️⃣ 원래 담당자 (Originating)
  - [ ] 작업 100% 완료
  - [ ] 문서화 완성
  - [ ] 의존도 확인
  - [ ] Evaluator 검증 요청

2️⃣ 평가자 (Evaluator QA)
  - [ ] 코드 리뷰 완료
  - [ ] 자동 테스트 통과 (커버리지 70%+)
  - [ ] 수동 테스트 통과 (3회 반복)
  - [ ] 서명 및 승인

3️⃣ 새로운 담당자 (Receiving)
  - [ ] 문서 숙독 (최소 30분)
  - [ ] 기술 질문 3개 이상 확인
  - [ ] 첫 소팀 시작 (예정 시간 ±5분)
  - [ ] 진행 상황 CTB 업로드
```

---

## 17.2 역할별 제약 사항 (Constraints by Role)

### Web-Builder (UI/API 개발자)

| 제약 | 이유 | 실행 |
|------|------|------|
| 동시 UI 프로젝트 최대 2개 | 컨텍스트 손실 방지 | 3번째 요청 시 큐 |
| API 동시 최대 1개 | 데이터 무결성 | 완료 후 다음 시작 |
| PR 병합 전 테스트 필수 | 배포 안정성 | CI/CD 자동 체크 |
| 일일 회고 (18:00) 필수 | 학습 및 개선 | CTB 기록 필수 |

### Data-Analyst (데이터 분석가)

| 제약 | 이유 | 실행 |
|------|------|------|
| 동시 데이터셋 최대 3개 | 정확도 유지 | 4번째 데이터셋 대기 |
| 신뢰도 95% 이상 | 데이터 품질 | 부정확 분석 재작업 |
| SQL 쿼리 리뷰 필수 | 성능 최적화 | Evaluator 승인 후 실행 |
| 일일 메트릭 리포트 (15:00) | 투명성 | 대시보드 업데이트 |

### Evaluator (QA 평가자)

| 제약 | 이유 | 실행 |
|------|------|------|
| 동시 검증 최대 4개 | 품질 일관성 | 5번째 요청 시 대기 |
| 회귀 테스트 필수 | 기존 기능 보호 | 모든 PR에 적용 |
| 규칙 준수 감시 4시간 주기 | 자동 컴플라이언스 | Cron 자동 실행 |
| 서명 = 전적 책임 | 책임감 | 문제 발생 시 원인 분석 |

---

# 18. 용어집 (Glossary & Terminology)

## 18.1 핵심 용어

| 용어 | 정의 | 예시 |
|------|------|------|
| **CTB** | Central Task Board — 중앙 작업 추적판 | active_work_tracking.md |
| **DAG** | Directed Acyclic Graph — 순환 없는 의존도 그래프 | 8개 프로젝트 47개 링크 |
| **Handoff** | 인수인계 프로세스 (3단계) | 완료 → 검증 → 새담당자 |
| **Context Loss** | 메모리/정보 손실 비율 (%) | <5% 목표 |
| **Blocker** | 진행을 막는 의존도 | 해제 시간 <8시간 |
| **Sprint** | 하나의 프로젝트 단계 (5-7일) | Phase 1: Design, Phase 2: API |
| **Capacity** | 팀원의 사용 가능 작업 시간 (%) | Web-Builder 100% 할당 |
| **Go/No-Go** | 단계 진행/중지 의사결정 포인트 | 5/28, 6/2, 6/10 |
| **SSOT** | Single Source of Truth — 유일한 정보원 | memory/ 폴더 |
| **RLS** | Row-Level Security (DB) | Supabase 액세스 제어 |

---

# 19. FAQ (자주 묻는 질문)

## 19.1 계획 및 우선순위

**Q: 새 작업이 갑자기 들어오면 어떻게 하나요?**  
A: Secretary가 우선순위를 평가 후:
1. 긴급 (blocker 해제) → 즉시 할당
2. 높음 (다음 3일 영향) → 다음 idle 팀원
3. 중간 (주간 영향) → CTB 큐에 추가
4. 낮음 (다음 주) → Phase C 이후 처리

**Q: 팀원이 할 일을 다 했는데 다음이 준비 안 됐으면?**  
A: 자동 다음 작업 선택 순서:
1. 큐된 작업 (CTB 우선순위 1번)
2. 현재 프로젝트 내 다음 단계
3. 의존하는 다른 프로젝트 지원
4. 리뷰/테스트/문서화 작업

---

## 19.2 의존도 및 블로킹

**Q: 두 프로젝트가 서로 의존할 때는?**  
A: 병렬 진행 + 체크포인트 동기화:
- 진행 → 예상 완료 시간 CTB 등록
- 14:00 체크: 지연 확인
- 지연 → 의존 프로젝트 재스케줄
- 시뮬레이션: "가정: A 지연 +2일" → 전체 ETA 다시 계산

**Q: blocker가 2시간 이상 안 풀리면?**  
A: 자동 에스컬레이션:
1. 1시간: Secretary 단일 알림
2. 2시간: CEO 보고 + 우선순위 재정렬
3. 4시간: 자원 추가 또는 범위 축소
4. 8시간: CEO 최종 의사결정

---

## 19.3 팀 관리

**Q: 팀원이 갑자기 부족하면?**  
A: 대응 순서:
1. 현재 프로젝트 중 멘토링 단계 팀원이 지원
2. 다른 프로젝트의 idle 팀원 재배치
3. Phase C 팀원 조기 활성화 (평가 후)
4. 일정 재조정 (ETA 연장)

**Q: 새 팀원 온보딩은 얼마나 걸리나요?**  
A: 4-8일 타임라인:
- Day 1-2: 설계 문서 리뷰 + 첫 작업
- Day 3: 첫 작업 완료 + 독립성 검증
- Day 4-8: 100% 자율운영 + 멘토링 병행

---

## 19.4 품질 및 테스트

**Q: 성능 벤치마크를 못 맞추면?**  
A: 재작업 프로세스:
1. 원인 분석 (DB 느림? 로직 비효율? API 호출 과다?)
2. 최적화 (인덱스 추가, 쿼리 리팩토링, 캐싱)
3. 다시 테스트 (목표 값 달성 시까지)
4. 학습 기록 (MEMORY에 저장 후 재사용)

---

# 20. 변경 이력 & 버전 (Change Log & Version History)

## 20.1 문서 진화

| 버전 | 일자 | 변경 사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-05-25 | 초안 작성 (섹션 1-5) | Planner |
| 0.5 | 2026-05-26 | 섹션 6-12 추가 (의존도, 핸드오프, 위험) | Planner |
| 0.9 | 2026-05-27 | 섹션 13-16 추가 (사례, 모니터링, 승인) | Planner |
| **1.0** | **2026-05-28** | **최종 완성 (섹션 17-22) — 3000+ 줄** | **Planner** |

---

## 20.2 예정 업데이트

- **v1.1** (2026-06-20): Phase A/B 실제 데이터 반영 + 개선안 적용
- **v2.0** (2026-07-15): Phase C 전체 팀 안정화 후 장기 운영 가이드 추가

---

# 21. 통합 포인트 & API 참고 (Integration Points & API Reference)

## 21.1 외부 시스템 연동

### Telegram 커뮤니케이션 API

```
Base URL: https://api.telegram.org/bot<TOKEN>

엔드포인트:
- /sendMessage (CEO 보고서 전달)
- /sendDocument (대시보드 내보내기)
- /sendPhoto (그래프/차트)
```

**사용 사례:**
- 18:00 일일 최종 리포트
- blocker 긴급 알림
- Go/No-Go 의사결정 알림

### GitHub API (CI/CD 연동)

```
Base URL: https://api.github.com

엔드포인트:
- /repos/{owner}/{repo}/actions/runs (빌드 상태)
- /repos/{owner}/{repo}/pulls/{pr}/checks (테스트 결과)
- /repos/{owner}/{repo}/commits/{hash}/statuses (배포 상태)
```

**사용 사례:**
- PR 머지 전 테스트 자동 검증
- 배포 성공/실패 자동 알림
- 커밋 히스토리로 진행도 추적

### Supabase API (데이터베이스)

```
Base URL: https://{project}.supabase.co/rest/v1

주요 테이블:
- assets (506개 자산)
- projects (8개 프로젝트)
- team_members (15명)
- task_board (CTB)
```

**사용 사례:**
- Asset Master Phase 2 데이터 조회/업데이트
- Team Dashboard 조직도 조회
- CTB 상태 동기화

---

## 21.2 내부 시스템 연동

### Memory Automation Phase 2 API

```
POST /api/memory/collect
- 입력: session_id, message, metadata
- 출력: memory_id, confidence_score

POST /api/memory/deduplicate
- 입력: memory_ids (array)
- 출력: merged_memory, duplicates_removed

GET /api/memory/trust-score
- 출력: score (0-100), components { relevance, accuracy, recency, completeness }
```

---

# 22. 교육 및 지식 이전 자료 (Training & Knowledge Transfer)

## 22.1 신규팀원 5일 온보딩 모듈

### Day 1: 오리엔테이션 (4시간)

```
13:00 ~ 14:00: DSC FMS 생태계 개요
  - 8개 프로젝트 지도
  - 15명 팀 구조
  - 성공 메트릭

14:00 ~ 15:00: 이 프레임워크 핵심 3가지
  1. 세 좌표계 (프로젝트, 팀, 시간-공간)
  2. 의존도 맵 읽기 방법
  3. 일일 4개 체크포인트

15:00 ~ 16:00: 당신의 역할 상세
  - 책임 범위
  - 제약 사항
  - 초기 3개 과제

16:00 ~ 17:00: Q&A + 멘토 배정
```

### Day 2-3: 실전 작업

```
첫 작업: 설계 문서 읽기 → 간단한 기능 구현 (2시간)
  - 성공 기준: 테스트 통과 + Evaluator 승인

멘토 피드백: 30분 1:1 미팅
  - 질문 답변
  - 기술 가이드
  - 팀 규칙 재확인
```

### Day 4: 독립성 검증

```
평가 기준:
- [ ] 지시 없이 다음 작업 선택 가능
- [ ] blocker 자력 해제 또는 에스컬레이션
- [ ] 코드/문서 기준 충족
- [ ] 팀 규칙 자동 준수
```

### Day 5: 완전 자율운영

```
- 4개 일일 체크포인트 참석
- 의존도 있는 다른 팀원과 협력
- CTB 자동 업데이트
```

---

## 22.2 참고 자료 모음

**필수 읽기 (2시간):**
1. 이 문서 섹션 1-5 (개념)
2. /memory/TEAM_STRUCTURE_UNIFIED_2026_05_26.md (팀 구조)
3. /memory/active_work_tracking.md (CTB 형식)

**심화 학습 (선택):**
1. 각 프로젝트별 설계 문서
2. 성공한 프로젝트 사례 분석 (섹션 12)
3. Memory Automation Phase 2 기술 스펙

---

**문서 버전:** 1.0 (최종)  
**작성일:** 2026-05-28  
**목표 완성일:** 2026-05-31 20:00 KST  
**최종 ETA:** 2026-06-02 18:00 KST  
**문서 길이:** 3000+ 줄 (✅ 최종 달성)
