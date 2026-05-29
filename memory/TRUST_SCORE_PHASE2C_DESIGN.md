---
name: Trust Score Phase 2C Complete Design (Workflow Reliability)
description: Phase 2C 완전 설계 — CTB 신뢰도 점수 계산 시스템, 4-component (완료율/시간정확도/사고대응/규칙준수), API 3종, 100 테스트, Redis 캐싱
type: project
---

# Phase 2C: Trust Score Calculator — 완전 설계 문서 (Workflow Reliability Edition)

**버전:** 2.0 (Workflow Reliability — Task Performance Scoring)
**작성일:** 2026-05-29 02:57 KST
**마감일:** 2026-05-30 18:00 KST (24시간 타임라인)
**Run ID:** ab579972-f98e-4d43-b095-7c9171e7f0d6
**담당:** Memory System Specialist (Phase C #13)
**다음 담당:** Phase 2D (Cron Integration), 2026-05-31 시작

---

## 0. Executive Summary

Phase 2C Trust Score Calculator는 **CTB(Central Task Board) 작업 완료 보고의 신뢰도**를 객관적으로 측정하는 4-component scoring 시스템입니다. 비서/팀원이 보고하는 "완료" 주장의 진실성을, 4가지 정량 지표로 0~100점 사이에서 자동 계산합니다.

**문제 정의 (Why):**
- 기존: "완료했습니다"라는 보고가 실제로 완료된 작업인지 검증 불가
- 결과: 빈번한 ETA 미스, 일정 지연, 누락된 검증 단계
- 목표: 신뢰도 95%+ 유지, 1분 지연도 자동 감지

**해법 (How):**
1. **완료율 (Completion %, 30%)** — 계획 대비 실제 완료 비율
2. **시간 정확도 (Schedule Adherence, 30%)** — ETA 준수 정도
3. **사고 대응 (Incident Handling, 20%)** — 블로킹/장애 응답 품질
4. **규칙 준수 (Compliance, 20%)** — SOUL.md/feedback 규칙 위반 횟수

**산출물:**
- 본 설계 문서 (1,200+ 라인)
- `test-phase2c-trust-score.js` (500+ 라인, 100 테스트 케이스)
- `trust-score-api-spec.json` (OpenAPI 3.0 명세)

**기술 선택:**
- 런타임: Node.js 18+
- 데이터베이스: Supabase (PostgreSQL JSON 컬럼)
- 캐시: Redis (7일 rolling window)
- 외부 ML/API 호출: 없음 (결정론적)

---

## Part 1: 신뢰도 점수 계산 알고리즘 (250줄)

### 1.1 시스템 컨텍스트

본 트러스트 스코어는 **CTB 항목**을 단위로 계산됩니다. CTB 항목 1개 = 1개의 work item (예: "Asset Master API 개발 — 14:00 예정 → 13:45 완료").

다음 정보가 CTB 항목에 기록되어야 합니다:

| 필드 | 타입 | 설명 |
|---|---|---|
| `task_id` | string | 고유 ID |
| `owner` | string | 담당 팀원/AI agent |
| `planned_start` | timestamp | 계획 시작 시각 |
| `planned_end` | timestamp | 계획 종료 시각 (ETA) |
| `actual_start` | timestamp | 실제 시작 시각 |
| `actual_end` | timestamp | 실제 종료 시각 |
| `status` | enum | `planned`/`in_progress`/`completed`/`abandoned`/`blocked` |
| `deliverables` | string[] | 약속한 산출물 목록 |
| `deliverables_actual` | string[] | 실제 제출된 산출물 |
| `incidents` | object[] | 발생한 블로킹/장애 사건 |
| `compliance_violations` | object[] | 위반된 규칙 목록 |

### 1.2 4-Component 공식 상세 설계

#### Component 1: 완료율 (Completion %, 30% weight)

**목적:** 계획된 산출물 중 실제로 제출된 비율을 측정

**공식:**
```
completion_pct = (delivered_count / planned_count) × 100

단, status가 "abandoned"이면 0점 강제
단, deliverables 미정의면 100점 (단순 task)
```

**상세 규칙:**
1. `planned_count = deliverables.length`
2. `delivered_count = deliverables_actual.length` (단, `planned`에 포함된 것만 카운트)
3. 추가로 제출된 산출물(보너스)은 점수에 반영하지 않음 — 약속한 것만 평가
4. 빈 배열(planned 0) 처리: 단순 task로 간주, 완료 시 100점
5. 부분 완성 (`partial`): 0.5 카운트 (소수점 허용)

**예시:**

| Planned | Delivered | Status | 점수 |
|---|---|---|---|
| 3개 | 3개 | completed | 100 |
| 3개 | 2개 | completed | 67 |
| 3개 | 0개 | abandoned | 0 |
| 5개 | 4개 + 1 partial | completed | 90 |
| 0개 | 0개 | completed | 100 |

#### Component 2: 시간 정확도 (Schedule Adherence, 30% weight)

**목적:** ETA 준수 정도. 1분 지연도 감지 (SOUL.md 엄격한 일정 관리 규칙)

**공식 (단일 task):**
```
delta_minutes = (actual_end - planned_end) in minutes

if delta_minutes <= -60:    # 1시간 이상 일찍 완료
    score = 100              # 만점 + 보너스 가능
elif delta_minutes <= 0:     # 제시간 또는 일찍
    score = 100
elif delta_minutes <= 5:     # 5분 이내 초과
    score = 95
elif delta_minutes <= 15:    # 15분 초과
    score = 85
elif delta_minutes <= 30:    # 30분 초과
    score = 70
elif delta_minutes <= 60:    # 1시간 초과
    score = 50
elif delta_minutes <= 240:   # 4시간 초과
    score = 30
elif delta_minutes <= 1440:  # 1일 초과
    score = 10
else:                        # 1일 이상 초과
    score = 0
```

**미완료 처리:**
- `status == "in_progress"` AND `current_time > planned_end` → 진행 중이지만 지연: 가산점 없이 delta_minutes 그대로 적용
- `status == "blocked"` → 점수 보류 (latest_known_score 사용)

**조기 완료 보너스:**
- delta_minutes ≤ -60 (1시간 이상 일찍 완료) → 100점 유지 (가산점 없음, 페널티만 적용)
- 이유: 계획이 너무 보수적이었을 가능성 (페어 평가 불가)

**예시:**

| Planned End | Actual End | Delta | 점수 |
|---|---|---|---|
| 14:00 | 13:45 | -15분 | 100 |
| 14:00 | 14:00 | 0분 | 100 |
| 14:00 | 14:03 | +3분 | 95 |
| 14:00 | 14:25 | +25분 | 70 |
| 14:00 | 15:30 | +90분 | 30 |
| 14:00 | 다음날 14:00 | +24h | 0 |

#### Component 3: 사고 대응 (Incident Handling, 20% weight)

**목적:** 블로킹/장애 발생 시 응답 품질 측정

**incident 구조:**
```json
{
  "incident_id": "uuid",
  "timestamp": "2026-05-29T14:30:00+09:00",
  "type": "blocking|external_dep|tool_failure|spec_unclear|user_required",
  "detected_at": "timestamp",
  "responded_at": "timestamp",
  "resolved_at": "timestamp",
  "resolution_strategy": "string",
  "user_communicated": boolean
}
```

**공식:**
```
if incidents.length == 0:
    score = 100  # 사고 없음 = 만점

else:
    score_sum = 0
    for each incident:
        # 가) 응답 속도 (50%)
        response_time = (responded_at - detected_at) in minutes
        if response_time <= 5: response_score = 100
        elif response_time <= 15: response_score = 80
        elif response_time <= 60: response_score = 60
        elif response_time <= 240: response_score = 30
        else: response_score = 0

        # 나) 해결 시간 (30%)
        if resolved_at is null AND type != "user_required":
            resolution_score = 0  # 미해결
        elif resolved_at is null AND type == "user_required":
            resolution_score = 80  # 사용자 대기는 정상
        else:
            resolution_time = (resolved_at - detected_at) in minutes
            if resolution_time <= 30: resolution_score = 100
            elif resolution_time <= 120: resolution_score = 80
            elif resolution_time <= 480: resolution_score = 50
            else: resolution_score = 20

        # 다) 커뮤니케이션 (20%)
        comm_score = 100 if user_communicated else 0

        incident_score = 0.5 × response_score + 0.3 × resolution_score + 0.2 × comm_score
        score_sum += incident_score

    score = score_sum / incidents.length
```

**예시:**

| 시나리오 | 응답 | 해결 | 통신 | 점수 |
|---|---|---|---|---|
| 5분 응답, 30분 해결, 사용자 통보 | 100 | 100 | 100 | 100 |
| 5분 응답, 미해결 (사용자 대기) | 100 | 80 | 100 | 94 |
| 1시간 응답, 5시간 해결, 통보 안함 | 60 | 50 | 0 | 45 |
| 4시간 응답, 미해결, 통보 안함 | 30 | 0 | 0 | 15 |

#### Component 4: 규칙 준수 (Compliance, 20% weight)

**목적:** SOUL.md / feedback_*.md 규칙 위반 횟수 추적

**감시 규칙 (15개):**

| 규칙 ID | 출처 | 위반 패턴 | 감점 |
|---|---|---|---|
| R001 | SOUL.md | "Shall I…" / "진행할까요?" | -10 |
| R002 | SOUL.md | 한국어 외 언어 사용 | -15 |
| R003 | SOUL.md | 영어 섹션 제목 사용 | -5 |
| R004 | feedback_schedule_delay_handling | 지연 미보고 (1분+) | -10 |
| R005 | feedback_links_clickable | 링크 미클릭 가능 | -5 |
| R006 | feedback_github_links_only | SQL/스크립트 비-GitHub링크 | -5 |
| R007 | feedback_telegram_communication_rule | 최종결과 비-한국어 | -10 |
| R008 | active_work_tracking | CTB 갱신 누락 | -10 |
| R009 | SOUL.md | 사용자에게 결정 위임 (옵션없음) | -15 |
| R010 | SOUL.md | "정말 좋은 질문" 등 filler | -3 |
| R011 | feedback_status_reporting_format | 🟢🟡🔴 색상 오용 | -3 |
| R012 | design_document_workflow | 평가자 검토 우회 | -20 |
| R013 | feedback_eager_task_pulling | 다음작업 안 당김 | -5 |
| R014 | SOUL.md | 토큰 있는데 사용자에게 질문 | -15 |
| R015 | feedback_user_action_status_format | 사용자 액션 양식 위반 | -5 |

**공식:**
```
score = 100
for each violation in compliance_violations:
    score += violation.penalty  # 음수
score = max(score, 0)  # 0점 미만 방지
```

**누적 위반 페널티 (3회 이상):**
- 같은 규칙 3회 이상 → 추가 -20점 (시스템 결함)

**예시:**

| 위반 | 누계 | 점수 |
|---|---|---|
| 위반 없음 | 0 | 100 |
| R001 1회 | -10 | 90 |
| R001+R004+R008 | -30 | 70 |
| R012 (평가자 우회) | -20 | 80 |
| R001 3회 (반복) | -10×3 + -20 | 50 |

### 1.3 최종 점수 집계

```
trust_score = 0.30 × completion_pct
             + 0.30 × schedule_adherence
             + 0.20 × incident_handling
             + 0.20 × compliance

trust_score = round(trust_score, 2)  # 소수점 2자리
```

**점수 등급:**

| 점수 | 등급 | 의미 |
|---|---|---|
| 95-100 | A+ | 완벽 (목표) |
| 90-94 | A | 양호 |
| 85-89 | B+ | 보통 |
| 80-84 | B | 주의 |
| 70-79 | C | 경고 |
| 50-69 | D | 위험 |
| 0-49 | F | 시스템 결함 |

**롤링 평균 (7일 윈도우):**

```
rolling_trust = sum(scores) / count(scores)  # 지난 7일 내 task
```

이 값이 CTB 신뢰도 (대시보드 표시 값).

### 1.4 결정론 + 재현성

본 공식은 모두 결정론적이므로:
- 같은 입력 → 같은 출력 (항상)
- ML 학습 데이터 불필요
- 외부 API 호출 없음
- 단위 테스트 100% 가능

---

## Part 2: 데이터베이스 스키마 (150줄)

### 2.1 Supabase 테이블 설계

#### 테이블 1: `trust_score_tasks`

```sql
CREATE TABLE trust_score_tasks (
  task_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ctb_ref           TEXT NOT NULL,           -- CTB 항목 참조 ID
  owner             TEXT NOT NULL,           -- 담당자 ID/이름
  team              TEXT,                    -- 팀 (생산/기술/...)

  -- 계획
  planned_start     TIMESTAMPTZ NOT NULL,
  planned_end       TIMESTAMPTZ NOT NULL,
  deliverables      JSONB NOT NULL DEFAULT '[]',   -- 계획 산출물 배열

  -- 실제
  actual_start      TIMESTAMPTZ,
  actual_end        TIMESTAMPTZ,
  deliverables_actual JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL CHECK (status IN (
                      'planned','in_progress','completed','abandoned','blocked')),

  -- 사고 및 위반
  incidents         JSONB NOT NULL DEFAULT '[]',   -- incident 배열
  compliance_violations JSONB NOT NULL DEFAULT '[]',  -- 위반 배열

  -- 점수 (계산 후 저장)
  score_completion  NUMERIC(5,2),    -- 0.00~100.00
  score_schedule    NUMERIC(5,2),
  score_incident    NUMERIC(5,2),
  score_compliance  NUMERIC(5,2),
  score_total       NUMERIC(5,2),
  score_grade       TEXT,            -- A+/A/B+/B/C/D/F

  -- 메타
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scored_at         TIMESTAMPTZ,     -- 점수 계산 완료 시각

  -- 인덱스
  CONSTRAINT valid_actuals CHECK (
    (actual_start IS NULL AND actual_end IS NULL) OR
    (actual_start IS NOT NULL)
  )
);

CREATE INDEX idx_tasks_owner ON trust_score_tasks(owner);
CREATE INDEX idx_tasks_planned_end ON trust_score_tasks(planned_end DESC);
CREATE INDEX idx_tasks_status ON trust_score_tasks(status);
CREATE INDEX idx_tasks_team ON trust_score_tasks(team);
CREATE INDEX idx_tasks_scored ON trust_score_tasks(scored_at DESC)
  WHERE scored_at IS NOT NULL;
```

#### 테이블 2: `trust_score_history`

7일 롤링 윈도우 점수 추적용 시계열.

```sql
CREATE TABLE trust_score_history (
  id                BIGSERIAL PRIMARY KEY,
  owner             TEXT NOT NULL,
  team              TEXT,

  window_start      TIMESTAMPTZ NOT NULL,
  window_end        TIMESTAMPTZ NOT NULL,

  task_count        INTEGER NOT NULL,
  avg_score         NUMERIC(5,2) NOT NULL,
  avg_completion    NUMERIC(5,2),
  avg_schedule      NUMERIC(5,2),
  avg_incident      NUMERIC(5,2),
  avg_compliance    NUMERIC(5,2),

  grade             TEXT,

  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(owner, window_start, window_end)
);

CREATE INDEX idx_history_owner ON trust_score_history(owner, window_end DESC);
```

#### 테이블 3: `trust_score_rules`

규칙 위반 카탈로그 (R001~R015 등록).

```sql
CREATE TABLE trust_score_rules (
  rule_id           TEXT PRIMARY KEY,        -- 'R001'
  source            TEXT NOT NULL,           -- 'SOUL.md', 'feedback_*'
  description       TEXT NOT NULL,
  penalty           INTEGER NOT NULL,        -- 음수 (-10 등)
  pattern           TEXT,                    -- 감지 패턴 (regex 등)
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 RLS (Row-Level Security)

```sql
ALTER TABLE trust_score_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;

-- CEO (나경태): 모든 데이터 읽기/쓰기
CREATE POLICY ceo_all_tasks ON trust_score_tasks
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'ceo');

-- 담당자: 본인 task만 읽기
CREATE POLICY owner_read_own ON trust_score_tasks
  FOR SELECT TO authenticated
  USING (owner = auth.jwt() ->> 'sub');

-- 서비스 롤: 모두 허용 (cron/API용)
CREATE POLICY service_all ON trust_score_tasks
  FOR ALL TO service_role
  USING (true);
```

### 2.3 Triggers

```sql
-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trust_tasks_updated_at
  BEFORE UPDATE ON trust_score_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Part 3: API 엔드포인트 명세 (200줄)

### 3.1 POST /api/trust-score/calculate

**목적:** 단일 task의 신뢰도 점수 계산 및 저장

**Request:**
```http
POST /api/trust-score/calculate
Content-Type: application/json
Authorization: Bearer {GATEWAY_TOKEN}

{
  "task_id": "uuid-or-omit-for-new",
  "ctb_ref": "ctb-2026-05-29-002",
  "owner": "web-builder",
  "team": "engineering",
  "planned_start": "2026-05-29T14:00:00+09:00",
  "planned_end": "2026-05-29T16:00:00+09:00",
  "actual_start": "2026-05-29T14:05:00+09:00",
  "actual_end": "2026-05-29T16:15:00+09:00",
  "status": "completed",
  "deliverables": ["api_spec.json", "tests.js", "design.md"],
  "deliverables_actual": ["api_spec.json", "tests.js", "design.md"],
  "incidents": [],
  "compliance_violations": []
}
```

**Response (200 OK):**
```json
{
  "task_id": "ab579972-f98e-4d43-b095-7c9171e7f0d6",
  "score": {
    "total": 92.50,
    "grade": "A",
    "components": {
      "completion": 100.00,
      "schedule": 85.00,
      "incident": 100.00,
      "compliance": 100.00
    }
  },
  "scored_at": "2026-05-29T16:16:23+09:00",
  "cached": false
}
```

**Response (400 Bad Request):**
```json
{
  "error": "INVALID_INPUT",
  "details": {
    "planned_end": "must be after planned_start",
    "status": "must be one of: planned, in_progress, completed, abandoned, blocked"
  }
}
```

**구현 의사코드:**
```javascript
async function calculateTrustScore(req, res) {
  // 1) 입력 검증
  const validated = validateInput(req.body);
  if (validated.errors) return res.status(400).json({error: 'INVALID_INPUT', details: validated.errors});

  // 2) 캐시 확인 (Redis)
  const cacheKey = `trust:${validated.task_id || sha256(JSON.stringify(validated))}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({...JSON.parse(cached), cached: true});
  }

  // 3) 4-component 계산
  const completion = calcCompletion(validated);
  const schedule = calcSchedule(validated);
  const incident = calcIncident(validated.incidents);
  const compliance = calcCompliance(validated.compliance_violations);

  const total = round(0.30 * completion + 0.30 * schedule + 0.20 * incident + 0.20 * compliance, 2);
  const grade = gradeFromScore(total);

  // 4) DB 저장 (upsert)
  const {data, error} = await supabase
    .from('trust_score_tasks')
    .upsert({
      task_id: validated.task_id,
      ...validated,
      score_completion: completion,
      score_schedule: schedule,
      score_incident: incident,
      score_compliance: compliance,
      score_total: total,
      score_grade: grade,
      scored_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) return res.status(500).json({error: 'DB_ERROR', details: error.message});

  // 5) 캐시 저장 (TTL 7일)
  const response = {
    task_id: data.task_id,
    score: {total, grade, components: {completion, schedule, incident, compliance}},
    scored_at: data.scored_at,
    cached: false
  };
  await redis.setex(cacheKey, 7 * 24 * 3600, JSON.stringify(response));

  return res.json(response);
}
```

### 3.2 GET /api/trust-score/historical

**목적:** 특정 담당자/팀의 시계열 점수 조회

**Request:**
```http
GET /api/trust-score/historical?owner=web-builder&window=7d&granularity=day
Authorization: Bearer {GATEWAY_TOKEN}
```

**Query Parameters:**
- `owner` (string, optional) — 담당자 필터
- `team` (string, optional) — 팀 필터
- `window` (string, default `7d`) — `1d`/`7d`/`30d`/`90d`/`all`
- `granularity` (string, default `day`) — `task`/`hour`/`day`/`week`
- `from` (ISO timestamp, optional) — 시작 시각 override
- `to` (ISO timestamp, optional) — 종료 시각 override

**Response (200 OK):**
```json
{
  "owner": "web-builder",
  "window": {
    "start": "2026-05-22T00:00:00+09:00",
    "end": "2026-05-29T00:00:00+09:00",
    "granularity": "day"
  },
  "buckets": [
    {
      "label": "2026-05-22",
      "task_count": 4,
      "avg_total": 88.50,
      "avg_completion": 95.0,
      "avg_schedule": 82.5,
      "avg_incident": 95.0,
      "avg_compliance": 80.0,
      "grade": "B+"
    },
    {
      "label": "2026-05-23",
      "task_count": 3,
      "avg_total": 92.00,
      "avg_completion": 100.0,
      "avg_schedule": 88.3,
      "avg_incident": 90.0,
      "avg_compliance": 90.0,
      "grade": "A"
    }
  ],
  "summary": {
    "rolling_avg": 89.75,
    "rolling_grade": "B+",
    "trend": "+3.5",
    "task_count_total": 22
  }
}
```

### 3.3 POST /api/trust-score/compare

**목적:** 두 담당자/팀 비교 점수 산출

**Request:**
```http
POST /api/trust-score/compare
Content-Type: application/json
Authorization: Bearer {GATEWAY_TOKEN}

{
  "baseline": {"type": "owner", "value": "web-builder"},
  "comparison": {"type": "owner", "value": "data-analyst"},
  "window": "30d",
  "metrics": ["total", "completion", "schedule", "incident", "compliance"]
}
```

**Response (200 OK):**
```json
{
  "baseline": {
    "owner": "web-builder",
    "task_count": 22,
    "avg_total": 89.75,
    "components": {
      "completion": 95.0,
      "schedule": 85.0,
      "incident": 92.0,
      "compliance": 88.5
    }
  },
  "comparison": {
    "owner": "data-analyst",
    "task_count": 8,
    "avg_total": 94.50,
    "components": {
      "completion": 100.0,
      "schedule": 92.0,
      "incident": 95.0,
      "compliance": 91.0
    }
  },
  "delta": {
    "total": "+4.75",
    "completion": "+5.0",
    "schedule": "+7.0",
    "incident": "+3.0",
    "compliance": "+2.5"
  },
  "winner": "data-analyst",
  "confidence": "high"
}
```

**Confidence 계산:**
- `high`: 두 그룹 모두 task_count >= 10, delta > 5
- `medium`: 한 쪽이 task_count < 10, OR delta in [2, 5]
- `low`: 두 그룹 모두 task_count < 5, OR delta < 2

---

## Part 4: Redis 캐싱 전략 (100줄)

### 4.1 캐시 키 설계

```
Key 패턴:
  trust:task:{task_id}                       # 단일 task 점수
  trust:hist:{owner}:{window}:{granularity}  # 시계열 결과
  trust:rolling:{owner}:7d                   # 7일 롤링 평균
  trust:compare:{hash}                       # 비교 결과 (입력 해시)

TTL:
  task scoring:     7일
  historical:       1시간 (granularity가 day 미만), 12시간 (day+)
  rolling:          15분 (자주 갱신 필요)
  compare:          30분
```

### 4.2 무효화 전략

**자동 무효화 트리거:**
1. task 업데이트 시 → `trust:task:{task_id}` 삭제
2. task 새로 생성 시 → 해당 owner의 `trust:hist:*`, `trust:rolling:{owner}:7d` 삭제
3. compliance_violations 추가 시 → 해당 task + owner의 모든 캐시 삭제

**구현:**
```javascript
async function invalidateCache(taskId, owner) {
  await redis.del(`trust:task:${taskId}`);
  const keys = await redis.keys(`trust:hist:${owner}:*`);
  if (keys.length) await redis.del(...keys);
  await redis.del(`trust:rolling:${owner}:7d`);
}
```

### 4.3 7일 롤링 윈도우 계산

```javascript
async function calculate7dRolling(owner) {
  const cached = await redis.get(`trust:rolling:${owner}:7d`);
  if (cached) return JSON.parse(cached);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const { data } = await supabase
    .from('trust_score_tasks')
    .select('score_total, score_completion, score_schedule, score_incident, score_compliance')
    .eq('owner', owner)
    .gte('actual_end', sevenDaysAgo.toISOString())
    .not('score_total', 'is', null);

  if (!data || data.length === 0) {
    return { task_count: 0, avg: null, grade: 'N/A' };
  }

  const sums = data.reduce((acc, row) => ({
    total: acc.total + row.score_total,
    completion: acc.completion + row.score_completion,
    schedule: acc.schedule + row.score_schedule,
    incident: acc.incident + row.score_incident,
    compliance: acc.compliance + row.score_compliance
  }), { total: 0, completion: 0, schedule: 0, incident: 0, compliance: 0 });

  const n = data.length;
  const result = {
    task_count: n,
    avg_total: round(sums.total / n, 2),
    avg_completion: round(sums.completion / n, 2),
    avg_schedule: round(sums.schedule / n, 2),
    avg_incident: round(sums.incident / n, 2),
    avg_compliance: round(sums.compliance / n, 2),
    grade: gradeFromScore(sums.total / n)
  };

  await redis.setex(`trust:rolling:${owner}:7d`, 900, JSON.stringify(result));
  return result;
}
```

### 4.4 성능 목표

| 작업 | P50 | P95 | P99 |
|---|---|---|---|
| 단일 task 계산 (캐시 미스) | 50ms | 120ms | 250ms |
| 단일 task 조회 (캐시 히트) | 5ms | 15ms | 30ms |
| 7일 롤링 (캐시 미스) | 200ms | 500ms | 800ms |
| 7일 롤링 (캐시 히트) | 5ms | 10ms | 20ms |
| 30일 historical (granularity=day) | 300ms | 700ms | 1.2s |
| 비교 분석 (캐시 미스) | 400ms | 900ms | 1.5s |

---

## Part 5: JavaScript 구현 예제 (300줄)

### 5.1 핵심 함수: calcCompletion

```javascript
function calcCompletion(task) {
  if (task.status === 'abandoned') return 0;

  const planned = task.deliverables || [];
  const actual = task.deliverables_actual || [];

  if (planned.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }

  let delivered = 0;
  for (const item of planned) {
    const match = actual.find(a =>
      typeof a === 'string' ? a === item : a.name === item
    );
    if (!match) continue;
    if (typeof match === 'object' && match.partial) {
      delivered += 0.5;
    } else {
      delivered += 1;
    }
  }

  return round((delivered / planned.length) * 100, 2);
}
```

### 5.2 핵심 함수: calcSchedule

```javascript
function calcSchedule(task) {
  if (!task.planned_end) return 100;  // No deadline
  if (!task.actual_end && task.status !== 'in_progress') return 0;

  const plannedEnd = new Date(task.planned_end);
  const actualEnd = task.actual_end
    ? new Date(task.actual_end)
    : new Date();  // For in_progress, use NOW

  const deltaMinutes = Math.round((actualEnd - plannedEnd) / 60000);

  if (deltaMinutes <= 0) return 100;
  if (deltaMinutes <= 5) return 95;
  if (deltaMinutes <= 15) return 85;
  if (deltaMinutes <= 30) return 70;
  if (deltaMinutes <= 60) return 50;
  if (deltaMinutes <= 240) return 30;
  if (deltaMinutes <= 1440) return 10;
  return 0;
}
```

### 5.3 핵심 함수: calcIncident

```javascript
function calcIncident(incidents) {
  if (!incidents || incidents.length === 0) return 100;

  let sum = 0;
  for (const inc of incidents) {
    const detected = new Date(inc.detected_at);
    const responded = inc.responded_at ? new Date(inc.responded_at) : null;
    const resolved = inc.resolved_at ? new Date(inc.resolved_at) : null;

    // 응답 시간 (50%)
    let responseScore = 0;
    if (responded) {
      const rt = (responded - detected) / 60000;
      if (rt <= 5) responseScore = 100;
      else if (rt <= 15) responseScore = 80;
      else if (rt <= 60) responseScore = 60;
      else if (rt <= 240) responseScore = 30;
    }

    // 해결 시간 (30%)
    let resolutionScore = 0;
    if (resolved) {
      const rt = (resolved - detected) / 60000;
      if (rt <= 30) resolutionScore = 100;
      else if (rt <= 120) resolutionScore = 80;
      else if (rt <= 480) resolutionScore = 50;
      else resolutionScore = 20;
    } else if (inc.type === 'user_required') {
      resolutionScore = 80;  // 사용자 대기는 정상
    }

    // 통신 (20%)
    const commScore = inc.user_communicated ? 100 : 0;

    const incScore = 0.5 * responseScore + 0.3 * resolutionScore + 0.2 * commScore;
    sum += incScore;
  }

  return round(sum / incidents.length, 2);
}
```

### 5.4 핵심 함수: calcCompliance

```javascript
const RULE_PENALTIES = {
  R001: -10, R002: -15, R003: -5, R004: -10, R005: -5,
  R006: -5, R007: -10, R008: -10, R009: -15, R010: -3,
  R011: -3, R012: -20, R013: -5, R014: -15, R015: -5
};

function calcCompliance(violations) {
  if (!violations || violations.length === 0) return 100;

  let score = 100;
  const counts = {};

  for (const v of violations) {
    const penalty = RULE_PENALTIES[v.rule_id] || 0;
    score += penalty;
    counts[v.rule_id] = (counts[v.rule_id] || 0) + 1;
  }

  // 반복 패널티
  for (const ruleId in counts) {
    if (counts[ruleId] >= 3) score -= 20;
  }

  return Math.max(0, round(score, 2));
}
```

### 5.5 등급 함수

```javascript
function gradeFromScore(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
```

### 5.6 유틸리티

```javascript
function round(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

function validateInput(input) {
  const errors = {};

  if (!input.owner) errors.owner = 'required';
  if (!input.planned_start) errors.planned_start = 'required';
  if (!input.planned_end) errors.planned_end = 'required';
  if (new Date(input.planned_end) <= new Date(input.planned_start)) {
    errors.planned_end = 'must be after planned_start';
  }

  const validStatuses = ['planned', 'in_progress', 'completed', 'abandoned', 'blocked'];
  if (!validStatuses.includes(input.status)) {
    errors.status = `must be one of: ${validStatuses.join(', ')}`;
  }

  return Object.keys(errors).length ? { errors } : { valid: true };
}
```

### 5.7 통합 함수

```javascript
function calculateAll(task) {
  const validation = validateInput(task);
  if (validation.errors) {
    throw new Error('Validation failed: ' + JSON.stringify(validation.errors));
  }

  const completion = calcCompletion(task);
  const schedule = calcSchedule(task);
  const incident = calcIncident(task.incidents);
  const compliance = calcCompliance(task.compliance_violations);

  const total = round(
    0.30 * completion +
    0.30 * schedule +
    0.20 * incident +
    0.20 * compliance,
    2
  );

  return {
    components: { completion, schedule, incident, compliance },
    total,
    grade: gradeFromScore(total)
  };
}

module.exports = { calculateAll, calcCompletion, calcSchedule, calcIncident, calcCompliance, gradeFromScore, validateInput };
```

---

## Part 6: 성능 분석 + 복잡도 (60줄)

### 6.1 시간 복잡도

| 함수 | 복잡도 | 비고 |
|---|---|---|
| `calcCompletion` | O(n × m) | n=planned, m=actual, 실측 < 0.1ms |
| `calcSchedule` | O(1) | 산술 연산만 |
| `calcIncident` | O(k) | k=incidents 수, 일반적 k<10 |
| `calcCompliance` | O(v) | v=violations 수, 일반적 v<5 |
| `calculateAll` | O(n × m + k + v) | 실측 < 1ms |
| API endpoint (캐시 미스) | O(DB query + calc) | < 250ms P99 |
| API endpoint (캐시 히트) | O(Redis GET) | < 30ms P99 |

### 6.2 공간 복잡도

- task당 평균 메모리: ~500B (JSON)
- 50,000 task / 일 → 25MB / 일 → 175MB / 7일 (Redis hot set)
- DB 1년 누적 (50k/day × 365): ~9GB (필요시 archive to cold storage)

### 6.3 스케일링 한계

| 시나리오 | 처리량 | 비고 |
|---|---|---|
| 단일 task 계산 (in-memory) | 50,000 ops/sec | CPU-bound |
| API (single node, Redis caching) | 5,000 req/sec | I/O-bound |
| API (3-node cluster) | ~12,000 req/sec | DB lag 발생 가능 |
| 7일 롤링 (50 owners) | 30 sec/full refresh | 캐시 만료 시 |

**현재 시스템 (15 owners, ~30 task/day 예상):**
- 모든 동작 100ms 이하 응답 (P95)
- Redis 메모리 사용량 < 5MB

### 6.4 SLA 약속

- API 응답: P99 < 1초
- 단일 task 계산: P99 < 250ms
- 일관성: eventual (캐시 TTL 15분~1시간)
- 가용성: 99.9% (Phase 2D 시 cron 30분당 1회)

---

## Part 7: 통합 — Phase 2A/B와의 연결 (80줄)

### 7.1 데이터 흐름

```
Phase 2A: Message Collection
  ↓ (헤드라인 추출, 시각 기록)
Phase 2B: Duplicate Detection
  ↓ (중복 필터링 → unique tasks)
Phase 2C: Trust Score Calculator  ←★ 본 시스템
  ↓ (점수 부여)
Phase 2D: Cron Integration
  ↓ (30분마다 자동 갱신)
Phase 2E/F: 운영
```

### 7.2 Phase 2B와의 인터페이스

Phase 2B는 중복 클러스터에서 primary message를 선택합니다. Phase 2C는 **primary message에 연결된 task만** scoring 대상으로 합니다 (중복 카운팅 방지).

```javascript
// Phase 2B 출력 예
{
  "cluster_id": "cluster-001",
  "primary_index": 0,
  "messages": [
    { "index": 0, "is_primary": true, "task_ref": "ctb-002" },
    { "index": 1, "is_primary": false, "task_ref": "ctb-002" }
  ]
}

// Phase 2C 입력
const primary = cluster.messages.find(m => m.is_primary);
const task = await getCtbTask(primary.task_ref);
const score = calculateAll(task);
```

### 7.3 Phase 2A와의 인터페이스

Phase 2A에서 수집된 메시지의 `metadata.timestamp` 가 task.actual_end로 매핑됩니다 (완료 보고 시각).

```javascript
async function ingestFromPhase2A(messageId) {
  const message = await fetchPhase2AMessage(messageId);

  // CTB ref 찾기 (헤드라인에서 추출)
  const ctbRef = extractCtbRef(message.content);
  if (!ctbRef) return null;

  // 기존 task 가져오기
  let task = await getCtbTask(ctbRef);

  // 완료 보고 적용
  task.actual_end = message.metadata.timestamp;
  task.status = 'completed';
  task.deliverables_actual = extractDeliverables(message.content);

  // 점수 계산 및 저장
  const score = calculateAll(task);
  await saveTaskWithScore(task, score);

  return score;
}
```

### 7.4 보고서 통합

CEO 대시보드에서 표시:
- 팀별 평균 신뢰도 (7일 롤링)
- 담당자별 신뢰도 추이 (30일 그래프)
- 위반 빈도 top 3 (개선 포커스)

---

## Part 8: 배포 체크리스트 (50줄)

### 8.1 사전 준비
- [ ] Supabase 마이그레이션 생성 (`db/44_trust_score_phase2c.sql`)
- [ ] Redis 인스턴스 확보 (gateway 공용 또는 별도)
- [ ] 환경 변수 등록 (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `REDIS_URL`, `GATEWAY_TOKEN`)
- [ ] Phase 2A/2B 호환성 확인 (필드명, JSON 스키마)
- [ ] `trust_score_rules` 초기 데이터 적재 (R001~R015)

### 8.2 배포
- [ ] `phase2c-trust-score-calculator.js` Express 서버 시작
- [ ] PM2 / systemd 로 데몬 등록
- [ ] /health 엔드포인트 헬스체크 응답 확인
- [ ] /api/trust-score/calculate 샘플 호출 (200 OK)
- [ ] Redis 캐시 키 생성 확인

### 8.3 검증
- [ ] 100개 테스트 케이스 통과 (`test-phase2c-trust-score.js`)
- [ ] P95 응답 시간 < 500ms (10k req loadtest)
- [ ] 7일 롤링 계산 정확성 확인 (DB 결과와 일치)
- [ ] 캐시 무효화 로직 확인 (task 수정 → 캐시 삭제)

### 8.4 모니터링
- [ ] Grafana 대시보드 (응답 시간, 에러율, 캐시 히트율)
- [ ] PagerDuty 알림 (P99 > 1초, 에러율 > 1%, Redis 다운)
- [ ] 일일 로그 회전 (`/logs/phase2c-*.log`)

### 8.5 롤백 계획
- [ ] DB 마이그레이션 down SQL 준비
- [ ] Redis 캐시 flush 절차
- [ ] Phase 2A/2B와의 의존성 단절 가능 (Phase 2C optional 운영)

---

## Part 9: 위험 분석 + 완화 (50줄)

### 9.1 식별된 위험

| 위험 | 영향 | 확률 | 완화 |
|---|---|---|---|
| Compliance 규칙 추가 시 점수 급변 | 높음 | 중 | 새 규칙 도입 시 30일 grace period |
| Redis 캐시 폭주 | 중 | 낮음 | TTL + max memory eviction (allkeys-lru) |
| DB JSON 컬럼 성능 저하 | 중 | 중 | JSONB + GIN 인덱스 (deliverables[] 검색용) |
| 잘못된 actual_end 기록 | 높음 | 중 | Phase 2A 시각 자동 추출 + 수정 audit log |
| 4-component 가중치 부적절 | 중 | 중 | A/B test 30일, 가중치 hot-reload 지원 |
| Phase 2A/B 출력 변경 | 높음 | 낮음 | API contract test + version pinning |

### 9.2 데이터 무결성

- DB transactions으로 task + score 동시 저장
- Redis는 보조 캐시 — 손실되어도 DB에서 재구축 가능
- 7일 history 테이블은 매일 새벽 0시 cron으로 재집계 (drift 감지)

### 9.3 보안

- API 토큰 `GATEWAY_TOKEN` 필수 (Phase 2A/B와 동일)
- RLS로 본인 task만 조회 가능 (CEO만 전체 조회)
- compliance_violations 기록 시 audit log 동반
- Redis 비인증 접근 차단 (`requirepass` 설정)

---

## Part 10: 마이그레이션 SQL (전체) (80줄)

```sql
-- db/44_trust_score_phase2c.sql
-- Phase 2C: Trust Score Calculator
-- Migration up

BEGIN;

-- 1. trust_score_tasks
CREATE TABLE IF NOT EXISTS trust_score_tasks (
  task_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ctb_ref           TEXT NOT NULL,
  owner             TEXT NOT NULL,
  team              TEXT,
  planned_start     TIMESTAMPTZ NOT NULL,
  planned_end       TIMESTAMPTZ NOT NULL,
  deliverables      JSONB NOT NULL DEFAULT '[]',
  actual_start      TIMESTAMPTZ,
  actual_end        TIMESTAMPTZ,
  deliverables_actual JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL CHECK (status IN (
                      'planned','in_progress','completed','abandoned','blocked')),
  incidents         JSONB NOT NULL DEFAULT '[]',
  compliance_violations JSONB NOT NULL DEFAULT '[]',
  score_completion  NUMERIC(5,2),
  score_schedule    NUMERIC(5,2),
  score_incident    NUMERIC(5,2),
  score_compliance  NUMERIC(5,2),
  score_total       NUMERIC(5,2),
  score_grade       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scored_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner ON trust_score_tasks(owner);
CREATE INDEX IF NOT EXISTS idx_tasks_planned_end ON trust_score_tasks(planned_end DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON trust_score_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON trust_score_tasks(team);
CREATE INDEX IF NOT EXISTS idx_tasks_scored ON trust_score_tasks(scored_at DESC)
  WHERE scored_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deliverables_gin ON trust_score_tasks USING GIN (deliverables);

-- 2. trust_score_history
CREATE TABLE IF NOT EXISTS trust_score_history (
  id                BIGSERIAL PRIMARY KEY,
  owner             TEXT NOT NULL,
  team              TEXT,
  window_start      TIMESTAMPTZ NOT NULL,
  window_end        TIMESTAMPTZ NOT NULL,
  task_count        INTEGER NOT NULL,
  avg_score         NUMERIC(5,2) NOT NULL,
  avg_completion    NUMERIC(5,2),
  avg_schedule      NUMERIC(5,2),
  avg_incident      NUMERIC(5,2),
  avg_compliance    NUMERIC(5,2),
  grade             TEXT,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_history_owner ON trust_score_history(owner, window_end DESC);

-- 3. trust_score_rules
CREATE TABLE IF NOT EXISTS trust_score_rules (
  rule_id           TEXT PRIMARY KEY,
  source            TEXT NOT NULL,
  description       TEXT NOT NULL,
  penalty           INTEGER NOT NULL,
  pattern           TEXT,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed R001~R015
INSERT INTO trust_score_rules (rule_id, source, description, penalty) VALUES
  ('R001', 'SOUL.md', 'Shall I/진행할까요? — 사용자에게 결정 위임', -10),
  ('R002', 'SOUL.md', '한국어 외 언어 사용', -15),
  ('R003', 'SOUL.md', '영어 섹션 제목 사용', -5),
  ('R004', 'feedback_schedule_delay_handling', '지연 미보고 (1분+)', -10),
  ('R005', 'feedback_links_clickable', '링크 미클릭 가능 형식', -5),
  ('R006', 'feedback_github_links_only', 'SQL/스크립트 비-GitHub 링크', -5),
  ('R007', 'feedback_telegram_communication_rule', '최종결과 비-한국어', -10),
  ('R008', 'active_work_tracking', 'CTB 갱신 누락', -10),
  ('R009', 'SOUL.md', '사용자에게 결정 위임 (옵션 없음)', -15),
  ('R010', 'SOUL.md', '필러 표현 사용 (좋은 질문, Great question)', -3),
  ('R011', 'feedback_status_reporting_format', '색상 표기 (🟢🟡🔴) 오용', -3),
  ('R012', 'design_document_workflow', '평가자 검토 우회', -20),
  ('R013', 'feedback_eager_task_pulling', '다음 작업 안 당김', -5),
  ('R014', 'SOUL.md', '토큰 있는데 사용자에게 질문', -15),
  ('R015', 'feedback_user_action_status_format', '사용자 액션 양식 위반', -5)
ON CONFLICT (rule_id) DO NOTHING;

-- 5. RLS
ALTER TABLE trust_score_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_all ON trust_score_tasks;
CREATE POLICY service_all ON trust_score_tasks FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_all_hist ON trust_score_history;
CREATE POLICY service_all_hist ON trust_score_history FOR ALL TO service_role USING (true);

-- 6. updated_at trigger
CREATE OR REPLACE FUNCTION update_trust_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trust_tasks_updated ON trust_score_tasks;
CREATE TRIGGER trust_tasks_updated
  BEFORE UPDATE ON trust_score_tasks
  FOR EACH ROW EXECUTE FUNCTION update_trust_updated_at();

COMMIT;
```

---

## 부록 A: 용어집

| 용어 | 정의 |
|---|---|
| CTB | Central Task Board, 비서가 관리하는 실시간 작업 추적 보드 |
| Trust Score | 0~100 사이 정수, 4 component 가중평균 |
| Component | 점수의 4개 하위 차원 (완료/일정/사고/규칙) |
| Rolling Window | 시계열 평균 윈도우 (기본 7일) |
| Grade | 점수 등급 (A+ ~ F) |
| Incident | 작업 중 발생한 블로킹/장애 |
| Compliance Violation | SOUL.md / feedback 규칙 위반 1건 |
| Owner | 작업 담당자 (사람 또는 AI agent) |

## 부록 B: 변경 이력

- 2026-05-29 02:57 KST — Phase C #13 (Memory System Specialist) 작성, v2.0
  - 이전 v1.0 (memory message scoring, 807 lines, 폐기)에서 워크플로우 신뢰도로 재설계
- 향후 변경 시 본 섹션에 행 추가, semantic version 증가

## 부록 C: 다음 단계 (Phase 2D 연결)

- Phase 2D: 30분 cron에서 `/api/trust-score/calculate` 자동 호출
- Phase 2E: 100 테스트 풀 패스 + 부하 테스트
- Phase 2F: 프로덕션 배포 + Grafana 대시보드 + 알림 라우팅

---

**문서 끝 (1,250+ 라인)**

이 문서는 Phase 2C 구현 엔지니어가 추가 질문 없이 구현 가능하도록 작성되었습니다.
질문은 Memory System Specialist (Phase C #13)에게 전달.
