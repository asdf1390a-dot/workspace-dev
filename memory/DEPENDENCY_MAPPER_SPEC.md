---
name: Dependency Mapper Engine Specification
description: 프로젝트 간 의존도 감지, 순환 의존성 분석, 병렬화 기회 식별 + 자동화 규칙
type: project
date: 2026-05-30
status: 기술 명세 완료 (Technical Specification Complete)
---

# 🔗 의존도 매핑 엔진 명세서

**목적:** 8개 병렬 프로젝트의 의존도를 자동으로 감지하고, 순환 의존성을 제거하며, 병렬화 기회를 식별하는 시스템

**대상 사용자:** Secretary AI Agent, Project Planner, DevOps Engineer  
**사용 주기:** 일일 (08:00 Morning Checkpoint), 필요시 실시간  
**운영 환경:** Bash script + Node.js API + Supabase

---

## 1. 의존도 분류 체계

### 1.1 의존도 타입 (Dependency Types)

#### A. API 의존도 (API Dependency)
```
설명: 한 프로젝트의 API가 다른 프로젝트의 API를 호출하는 경우
형식: Project_A.API → Project_B.API
예시: Dashboard-P2 UI → Team Dashboard-P1 API
영향도: CRITICAL (API 없으면 UI 구현 불가)
```

#### B. 데이터베이스 의존도 (Database Dependency)
```
설명: 한 프로젝트의 DB 스키마가 다른 프로젝트의 DB를 참조하는 경우
형식: Project_A.DB_Table → Project_B.DB_Table
예시: Asset Master UI → assets, asset_history 테이블
영향도: HIGH (스키마 변경 시 영향)
```

#### C. 파일 의존도 (File Dependency)
```
설명: 한 프로젝트이 다른 프로젝트의 파일/구성을 참조하는 경우
형식: Project_A.File → Project_B.File
예시: Harness-ENG UI → design-system.scss (공유 스타일)
영향도: MEDIUM (파일 변경 시 재빌드)
```

#### D. 팀 의존도 (Team Dependency)
```
설명: 한 프로젝트의 완료가 다른 프로젝트의 시작 조건인 경우
형식: Project_A.Completion → Project_B.Start
예시: Dashboard-P1 API 완료 → Dashboard-P2 UI 시작
영향도: HIGH (일정상 선행조건)
```

#### E. 구성 의존도 (Configuration Dependency)
```
설명: 한 프로젝트이 다른 프로젝트의 구성/설정을 공유하는 경우
형식: Project_A.Config → Project_B.Config
예시: Vercel 환경변수 (모든 프로젝트 공유)
영향도: LOW (구성 변경 시 재배포)
```

---

## 2. 의존도 매트릭스 (Dependency Matrix)

### 2.1 현재 의존도 매트릭스 (As-Is)

```
                    | Asset | Travel | Backup | BM  | Dashboard | Memory | Harness | Infra |
Asset Master API    |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
Travel API          |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
Backup API          |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
BM API              |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
Dashboard API       |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
Memory Messages API |  ✓    |  ✓     |  ✓     | ✓   |    ✓      |   —    |   —     |  —    |
Harness-ENG API     |  —    |  —     |  —     | —   |    —      |   ✓    |   —     |  —    |
Infrastructure      |  —    |  —     |  —     | —   |    —      |   —    |   —     |  —    |

범례: ✓ = 의존도 있음, — = 의존도 없음
```

### 2.2 의존도 세부 분석

| 의존성 | 타입 | 강도 | 상태 | 비고 |
|--------|------|------|------|------|
| Dashboard-P2 UI ← Dashboard-P1 API | API | CRITICAL | ✅ 완료 | 구현 블로킹 제거 |
| Backup-P2 UI ← Backup API | API | CRITICAL | ✅ 완료 | 구현 블로킹 제거 |
| Asset-P2 UI ← Asset API | API | CRITICAL | ✅ 완료 | 구현 블로킹 제거 |
| Travel-P2 UI ← Travel API | API | CRITICAL | ✅ 완료 | 구현 블로킹 제거 |
| Memory-P2 ← all APIs | API | HIGH | 🟡 진행중 | 데이터 수집 (메시지 추적) |
| Harness-ENG P2 ← Memory API | API | MEDIUM | 🟡 진행중 | 로그 데이터 참조 |
| All Projects ← Vercel Env | Config | LOW | ✅ 완료 | 환경변수 공유 |

---

## 3. 순환 의존성 감지 (Circular Dependency Detection)

### 3.1 순환 의존성 분석 알고리즘

**입력:** 의존도 그래프 (프로젝트 정점, 의존성 간선)

**알고리즘:** DFS (Depth-First Search) + Cycle Detection

```
ALGORITHM: DetectCycles(graph)
  INPUT: 프로젝트 의존도 그래프
  OUTPUT: 순환 의존성 목록 또는 공집합

  visited = {}
  rec_stack = {}
  cycles = []

  FOR EACH project IN graph.nodes:
    IF NOT visited[project]:
      dfs(project, visited, rec_stack, cycles)

  RETURN cycles

FUNCTION dfs(node, visited, rec_stack, cycles):
  visited[node] = TRUE
  rec_stack[node] = TRUE

  FOR EACH neighbor IN graph.adj[node]:
    IF NOT visited[neighbor]:
      dfs(neighbor, visited, rec_stack, cycles)
    ELSE IF rec_stack[neighbor]:
      cycle_path = traceback(node, neighbor)
      cycles.append(cycle_path)

  rec_stack[node] = FALSE
```

### 3.2 현재 순환 의존성 상태

**결과: 순환 의존성 없음 (0건)** ✅

```
✓ Asset → Memory → (Asset로 돌아오지 않음) = 선형
✓ Travel → Memory → (Travel로 돌아오지 않음) = 선형
✓ Backup → Memory → (Backup로 돌아오지 않음) = 선형
✓ Dashboard-P1 → Dashboard-P2 → (역방향 없음) = 선형
```

**의존도 그래프 (순환 없는 DAG):**
```
Asset API ──┐
            ├─→ Memory Messages API ──┐
Travel API ─┤                         ├─→ (배포 완료)
            │                         │
Backup API ─┤                    Harness-ENG API
            │                         │
BM API ─────┤                    (참조 선택적)
            │
Dashboard API

결론: 모든 프로젝트가 DAG 구조 → 순환 의존성 없음 = 병렬화 가능
```

---

## 4. 병렬화 기회 식별 (Parallelization Opportunities)

### 4.1 병렬화 가능 조합 분석

**원칙:** 같은 레벨의 프로젝트는 병렬 실행 가능

```
【레벨 0】 (의존도 없음 = 즉시 병렬화 가능)
├─ Asset Master (완료) ✅
├─ Travel (완료) ✅
├─ Backup (진행중, 병렬 가능)
├─ BM (완료) ✅
├─ Discord Bot (완료) ✅
└─ Infrastructure Monitoring (준비)

【레벨 1】 (상위 프로젝트 의존)
├─ Team Dashboard-P2 UI ← Dashboard-P1 API (의존성 충족)
├─ Memory Auto-P2 ← (선택적 의존, 독립 진행 가능)
└─ Harness-ENG-P2 ← (설계 완료, 의존도 낮음)

【병렬화 우선순위】
1. Backup-P2 + Dashboard-P2 UI (동시 진행, 리소스 분배)
2. Memory Auto + Infrastructure (동시 진행, 다른 팀)
3. Harness-ENG (Backup 완료 후 순차)
```

### 4.2 병렬화 제약 조건

| 제약 | 영향 | 완화책 |
|------|------|--------|
| **Web-Builder#1 병렬화 불가** | Backup + Dashboard UI 순차만 가능 | 웹개발자 추가 고용 또는 우선순위 명확화 |
| **Evaluator 부족** | 검증 병렬화 제한 | Evaluator#2 + QA-Specialist 활용 |
| **API 준비도** | UI 시작 전 API 필수 | 모든 API 사전 완료 (현재 완료) ✅ |
| **Vercel 배포 순서** | 배포 충돌 가능성 | 배포 스케줄 조정 (시간대 분산) |

### 4.3 권장 병렬화 계획

```
【Phase 1: 즉시 병렬화 (6/1-6/2)】
Lane A: Backup-P2 UI 마무리 (Web-Builder#1)
Lane B: Dashboard-P2 설계 (Planner + Design-Specialist)
Lane C: Memory Auto P2D (Auto-Specialist + Memory-Specialist)
Lane D: Infrastructure Monitoring 설계 (DevOps-Engineer)

→ 예상 효과: 용량 활용도 55% → 70%

【Phase 2: 구현 병렬화 (6/3-6/5)】
Lane A: Harness-ENG P2 UI (Web-Builder#1)
Lane B: Dashboard-P2 UI (Web-Builder#2)
Lane C: Infrastructure P1 구현 (DevOps-Engineer)
Lane D: Memory Auto Phase 2E-F (Auto + Memory-Specialist)

→ 예상 효과: 용량 활용도 70% → 85%

【Phase 3: 완성 병렬화 (6/6-6/10)】
Lane A: Harness-ENG 배포 (Web-Builder#1)
Lane B: Infrastructure 완성 (DevOps-Engineer)
Lane C: 신규 프로젝트 A (Web-Builder#2 + #3)
Lane D: Memory Auto 배포 (Auto + Memory-Specialist)

→ 예상 효과: 용량 활용도 85% → 93.3%
```

---

## 5. 자동화 규칙 (Automation Rules)

### 5.1 의존도 자동 감지 규칙

#### Rule 1: API 호출 추적
```
【조건】
- 프로젝트 A의 코드가 프로젝트 B의 API 엔드포인트를 호출

【감지 방법】
1. 소스코드 정적 분석: grep "fetch|axios.get|api/" → URL 패턴 매칭
2. 프로젝트 메타데이터: package.json/project.json의 dependencies
3. 환경변수 분석: .env* 파일의 API_URL 추적

【액션】
- 새로운 의존도 발견 → CTB 업데이트
- 의존도 레벨 변경 → Secretary 알림
- 블로킹 가능성 → Escalation 준비
```

#### Rule 2: DB 참조 추적
```
【조건】
- 프로젝트 A가 프로젝트 B의 DB 테이블을 쿼리

【감지 방법】
1. Supabase 메타데이터: table definitions + RLS policies
2. 마이그레이션 파일 분석: db/XX_*.sql의 외래키 참조
3. ORM 코드 분석: models/ 디렉토리의 table references

【액션】
- 새로운 테이블 참조 → Schema 호환성 검증
- 외래키 추가 → 마이그레이션 순서 재검토
- 순환 참조 감지 → 설계 리뷰
```

#### Rule 3: 파일 공유 추적
```
【조건】
- 프로젝트 A가 프로젝트 B의 파일을 import/include

【감지 방법】
1. import 문 분석: "from '../..." 패턴 추출
2. 공유 디렉토리 감시: src/shared/, design-system/ 등
3. node_modules 의존도: yarn.lock의 외부 패키지 버전

【액션】
- 새로운 공유 파일 → version 관리 추가
- 파일 변경 → 의존 프로젝트 재빌드 필요 통보
- 버전 충돌 → 호환성 검증
```

#### Rule 4: 팀 의존도 추적
```
【조건】
- 프로젝트 A의 완료가 프로젝트 B의 시작 전제

【감지 방법】
1. CTB (Central Task Board) 상태 추적: project.status 기반
2. 마일스톤 분석: project.dependencies[] 필드
3. 일정 분석: 시작일 < 의존 프로젝트 완료일 → 블로킹

【액션】
- 의존 프로젝트 지연 → 종속 프로젝트 스케줄 조정
- 완료 신호 감지 → 스폰 준비
- 병렬화 기회 → 자동으로 재평가
```

### 5.2 의존도 변경 감지 (Change Detection)

#### Monitor 1: 매시간 자동 검사 (Hourly Check)
```bash
#!/bin/bash
# /usr/local/bin/dependency-monitor-hourly.sh

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEPS_DIR="/home/jeepney/.openclaw/workspace-dev/memory/dependencies"

# 1. API 엔드포인트 스캔
rg "https://[a-zA-Z0-9-]+\.(vercel\.app|supabase\.co)" \
  --type tsx --type ts --type js \
  /home/jeepney/.openclaw/workspace-dev \
  > "$DEPS_DIR/api_endpoints_current.txt"

# 2. 이전 스냅샷과 비교
diff -u "$DEPS_DIR/api_endpoints_prev.txt" \
        "$DEPS_DIR/api_endpoints_current.txt" > "$DEPS_DIR/api_diff.log"

if [ -s "$DEPS_DIR/api_diff.log" ]; then
  echo "[$TIMESTAMP] API 의존도 변경 감지" >> "$DEPS_DIR/changes.log"
  cat "$DEPS_DIR/api_diff.log" >> "$DEPS_DIR/changes.log"
  
  # Secretary에 알림
  notify-secretary "API 의존도 변경: $(wc -l < "$DEPS_DIR/api_diff.log") 줄"
fi

# 3. 현재 상태 저장
cp "$DEPS_DIR/api_endpoints_current.txt" "$DEPS_DIR/api_endpoints_prev.txt"
```

#### Monitor 2: 마이그레이션 감시 (Migration Watch)
```bash
#!/bin/bash
# /usr/local/bin/dependency-monitor-migrations.sh

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MIGRATIONS_DIR="/home/jeepney/.openclaw/workspace-dev/db"

# 새로운 마이그레이션 파일 감지
find "$MIGRATIONS_DIR" -name "*.sql" -newer "$MIGRATIONS_DIR/.lastcheck" \
  > /tmp/new_migrations.txt

if [ -s /tmp/new_migrations.txt ]; then
  echo "[$TIMESTAMP] 새 마이그레이션 감지" >> /tmp/migration_monitor.log
  
  # 각 마이그레이션에서 외래키/참조 추출
  for migration in $(cat /tmp/new_migrations.txt); do
    grep -i "references\|foreign key\|references\|table" "$migration" \
      >> "$DEPENDENCIES_DIR/migration_refs.txt"
  done
  
  # 순환 의존성 검사
  python3 /usr/local/bin/check_circular_deps.py \
    --input "$DEPENDENCIES_DIR/migration_refs.txt" \
    --output /tmp/circular_check.json
  
  if jq -e '.cycles | length > 0' /tmp/circular_check.json > /dev/null; then
    notify-secretary "⚠️ 순환 의존성 감지: $(jq '.cycles | length' /tmp/circular_check.json)개"
  fi
  
  touch "$MIGRATIONS_DIR/.lastcheck"
fi
```

#### Monitor 3: 배포 충돌 감시 (Deployment Conflict Watch)
```bash
#!/bin/bash
# /usr/local/bin/dependency-monitor-deployments.sh

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Vercel 배포 상태 확인
vercel list --json > /tmp/vercel_status.json

# 동시 배포 감지
CONCURRENT=$(jq '[.[] | select(.state == "BUILDING")] | length' /tmp/vercel_status.json)

if [ "$CONCURRENT" -gt 1 ]; then
  echo "[$TIMESTAMP] 동시 배포 감지: $CONCURRENT개 프로젝트"
  echo "주의: 배포 충돌 가능성 높음"
  
  # 배포 스케줄 조정
  DELAY_SECONDS=$((CONCURRENT * 300))  # 프로젝트당 5분 간격
  echo "권장: 다음 배포를 ${DELAY_SECONDS}초 후로 연기"
fi
```

### 5.3 자동화 트리거 (Automation Triggers)

#### Trigger 1: 의존 프로젝트 완료 감지
```yaml
Event: project.status == "COMPLETE"
  ├─ Condition: has_dependents == true
  └─ Actions:
      ├─ Update dependent projects' blockers
      ├─ Notify dependent project leads
      ├─ Auto-spawn next phase (if ready)
      └─ Log to CTB
```

#### Trigger 2: 블로킹 의존도 감지
```yaml
Event: dependency.status == "BLOCKED"
  ├─ Condition: days_blocked > 0.5 (12시간)
  └─ Actions:
      ├─ Send escalation to dependent project lead
      ├─ Suggest mitigation (parallel work/scope reduction)
      ├─ Update risk matrix
      └─ CEO notification (if CRITICAL)
```

#### Trigger 3: 병렬화 기회 감지
```yaml
Event: new_parallelizable_lane_detected()
  ├─ Condition: slack > 0 days AND idle_resources > 0
  └─ Actions:
      ├─ Alert Planner to consider parallelization
      ├─ Calculate capacity gain
      ├─ Suggest project pairing
      └─ Update resource allocation plan
```

---

## 6. API 명세 (API Specification)

### 6.1 의존도 쿼리 API

#### Endpoint: GET /api/dependencies/graph

**요청:**
```javascript
GET /api/dependencies/graph?project=all&depth=2

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
```

**응답:**
```json
{
  "nodes": [
    {
      "id": "asset-master-api",
      "name": "Asset Master API",
      "type": "api",
      "status": "complete",
      "completionDate": "2026-05-25T10:00:00Z"
    },
    {
      "id": "dashboard-p2-ui",
      "name": "Team Dashboard P2 UI",
      "type": "ui",
      "status": "in_progress",
      "progress": 55
    }
  ],
  "edges": [
    {
      "from": "dashboard-p2-ui",
      "to": "dashboard-api",
      "type": "api",
      "strength": "CRITICAL",
      "status": "unblocked"
    },
    {
      "from": "memory-auto-p2",
      "to": "asset-master-api",
      "type": "data",
      "strength": "HIGH",
      "status": "unblocked"
    }
  ],
  "cycles": [],
  "criticalPath": [
    "backup-api",
    "backup-p2-ui",
    "deployment"
  ]
}
```

#### Endpoint: GET /api/dependencies/analysis

**요청:**
```javascript
GET /api/dependencies/analysis?project=backup-p2&includeDownstream=true
```

**응답:**
```json
{
  "project": "backup-p2-ui",
  "blockedBy": [],
  "blocking": [
    {
      "project": "deployment",
      "type": "precedence",
      "criticalPath": true
    }
  ],
  "parallelizable": [
    "dashboard-p2-ui",
    "memory-auto-p2",
    "harness-eng-p2"
  ],
  "recommendations": [
    "Backup-P2 타이트 일정: 4시간마다 모니터링",
    "Dashboard-P2와 동시 진행 가능: 별도 리소스 필요",
    "Memory Auto는 완전 독립: 병렬화 권장"
  ]
}
```

---

## 7. 실행 규칙 (Execution Rules)

### 7.1 의존도 기반 스포닝 (Dependency-Based Spawning)

**Rule:** 프로젝트는 모든 선행 의존도가 완료될 때만 스폰 가능

```javascript
FUNCTION canSpawn(project) {
  FOR EACH dependency IN project.dependencies:
    IF dependency.status != "COMPLETE":
      RETURN false  // 스폰 불가
  
  RETURN true  // 스폰 가능
}
```

### 7.2 의존도 기반 우선순위 (Dependency-Based Priority)

```
Priority = BaseScore + DependentCount * 10 + BlockingDaysCount * 50

예시:
- Backup-P2 UI: 80 (기본) + 1*10 (배포 블로킹) + 3*50 (3일 타이트) = 240 (P0)
- Dashboard-P2 UI: 70 (기본) + 0*10 + 0.5*50 (0.5일 여유) = 95 (P1)
- Memory Auto: 60 (기본) + 5*10 (5개 프로젝트 참조) + 0*50 = 110 (P1)
```

### 7.3 의존도 기반 모니터링 빈도

| 의존도 유형 | 모니터링 빈도 | 에스컬레이션 기준 |
|------------|-------------|---------------|
| CRITICAL (블로킹) | 4시간마다 | 1시간 지연 |
| HIGH (중요) | 매 8시간 | 2시간 지연 |
| MEDIUM (보통) | 매일 1회 | 4시간 지연 |
| LOW (낮음) | 주 1회 | 1일 지연 |

---

## 8. 구현 가이드 (Implementation Guide)

### 8.1 Phase 1: 의존도 그래프 구축 (6/1-6/2)

**산출물:**
1. `dependency_graph.json` — 모든 프로젝트/의존도 정의
2. `circular_dependencies.json` — 순환 의존성 목록 (0건 기대)
3. `parallelization_plan.md` — 병렬화 기회

**실행 순서:**
```bash
# 1. 현재 의존도 스캔
./scripts/scan-dependencies.sh

# 2. 그래프 생성
node scripts/build-dependency-graph.js

# 3. 순환 의존성 검사
python3 scripts/detect-cycles.py

# 4. 병렬화 분석
python3 scripts/analyze-parallelization.py

# 5. 결과 검증
./scripts/validate-graph.sh
```

### 8.2 Phase 2: 자동 모니터링 활성화 (6/3-6/5)

**Cron Jobs:**
```bash
# Hourly monitoring
0 * * * * /usr/local/bin/dependency-monitor-hourly.sh

# Migration watch (every 30 min)
*/30 * * * * /usr/local/bin/dependency-monitor-migrations.sh

# Deployment conflict watch (every 15 min)
*/15 * * * * /usr/local/bin/dependency-monitor-deployments.sh

# Daily summary
0 18 * * * /usr/local/bin/dependency-daily-summary.sh
```

### 8.3 Phase 3: API 배포 (6/5-6/7)

**Docker Container:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src ./src
COPY scripts ./scripts

EXPOSE 3011

CMD ["node", "src/dependency-mapper-api.js"]
```

**배포 명령:**
```bash
docker build -t dependency-mapper:latest .
docker push dependency-mapper:latest
docker service update --image dependency-mapper:latest dependency-mapper
```

---

## 9. 성공 기준 (Success Criteria)

### 9.1 Dependency Mapper 성공 기준

| 기준 | 목표 | 검증 방법 |
|------|------|---------|
| **그래프 정확도** | 95%+ | 수동 검증 vs 자동 감지 비교 |
| **순환 의존성** | 0건 | 자동 검사 통과 |
| **병렬화 식별** | 90%+ | 실제 병렬화 가능 프로젝트 수 비교 |
| **모니터링 정확도** | 100% | 모든 변경사항 감지 |
| **에스컬레이션 응답** | <30분 | CTB 업데이트 시간 측정 |

### 9.2 팀 용량 목표

| 기간 | 할당 | 활용도 | 목표 |
|------|------|--------|------|
| 6/1 | 830% | 55% | 기준선 |
| 6/5 | 1350% | 90% | 병렬화 최대화 |
| 6/10 | 1400% | 93.3% | **목표 달성** |

---

## 📋 부록: 기술 스택

**언어:** Python 3.8+, Node.js 18+, Bash  
**라이브러리:** networkx, pandas, express, supabase-js  
**데이터베이스:** Supabase (PostgreSQL)  
**모니터링:** Cron, Sentry, Datadog  
**배포:** Docker, Kubernetes (선택)

---

**작성일:** 2026-05-30  
**최종 검토:** 2026-05-30 21:30 KST  
**담당:** Project Planner AI  
**상태:** ✅ 명세 완료, 구현 준비 완료
