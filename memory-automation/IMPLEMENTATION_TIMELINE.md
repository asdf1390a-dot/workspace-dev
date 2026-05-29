# Trust Score Calculator — 구현 로드맵
# Memory Automation Phase 2C Implementation Timeline

**버전:** 2C-1.0  
**작성일:** 2026-05-29  
**담당:** 웹개발자 (web-builder)  
**기간:** 2026-05-30 ~ 2026-06-03 (5일)  
**포트:** 3011  
**마감:** 2026-06-03 18:00 KST

---

## 시스템 개요

```
[Phase 2A: 메시지 수집 — PORT 3009] ✅ 완료
        ↓
[Phase 2B: 중복 감지 — PORT 3010] ✅ 완료
        ↓
[Phase 2C: 신뢰도 점수 계산 — PORT 3011] ← 현재 구현 대상
        ↓
[Phase 2D: Cron 통합] ← 다음 단계
```

**Trust Score 공식:**
```
Trust Score = SC×0.40 + CD×0.25 + VS×0.20 + RF×0.15
판정: ≥60 → ACCEPT | 40-59 → QUARANTINE | <40 → REJECT
```

---

## 전제 조건 (구현 시작 전 확인)

- [ ] Phase 2A 서버 실행 중 (PORT 3009)
- [ ] Phase 2B 서버 실행 중 (PORT 3010)
- [ ] Node.js v18+ 설치됨
- [ ] Supabase 연결 정보 (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
- [ ] `memory-automation/` 디렉토리 존재
- [ ] `TRUST_SCORE_DESIGN.md` 숙지 완료

---

## Day 1 (2026-05-30): 프로젝트 기반 + C1/C2 컴포넌트

**목표:** 프로젝트 구조 설정 및 2개 컴포넌트 구현 완료

### 오전 (09:00–12:00): 프로젝트 초기화

**1. 파일 구조 생성**

```
memory-automation/
├── phase2c-trust-score.js      ← 메인 서버 (신규)
├── lib/
│   ├── score-components.js     ← 4개 컴포넌트 계산기 (신규)
│   ├── score-classifier.js     ← ACCEPT/QUARANTINE/REJECT 분류기 (신규)
│   ├── lru-cache.js            ← 3-layer LRU 캐시 (신규)
│   └── jsonl-store.js          ← JSONL 파일 저장소 (신규)
├── test-phase2c.js             ← 테스트 스위트 (신규)
├── data/
│   ├── trust_scores.jsonl      ← 점수 저장소 (자동 생성)
│   ├── quarantine_log.jsonl    ← 격리 로그 (자동 생성)
│   ├── reject_log.jsonl        ← 거부 로그 (자동 생성)
│   └── weight_history.jsonl    ← 가중치 이력 (자동 생성)
└── package.json                ← 의존성 추가
```

**2. package.json 의존성 추가**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "lru-cache": "^10.0.0",
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

**3. 환경 변수 확인**

```bash
export PORT=3011
export PHASE2A_URL="http://localhost:3009"
export PHASE2B_URL="http://localhost:3010"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
export MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"
```

### 오후 (13:00–18:00): C1 + C2 컴포넌트 구현

**4. C1 — 출처 신뢰도 (Source Credibility) 구현**

```javascript
// lib/score-components.js

const CHANNEL_BASE_SCORES = {
  'telegram_ceo_personal': 90,
  'telegram_team_channel': 85,
  'discord_meeting': 85,
  'telegram_direct': 80,
  'discord_general': 65,
  'discord_random': 40,
  'default': 20
};

const ROLE_ADJUSTMENTS = {
  'CEO': +10,
  'Manager': +5,
  'TeamMember': 0,
  'External': -15
};

function scoreSourceCredibility({ channel, senderRole, verificationCount = 0, contradictionCount = 0 }) {
  const normalizedChannel = (channel || '').toLowerCase();
  const normalizedRole = normalizeRole(senderRole);
  
  const baseScore = CHANNEL_BASE_SCORES[normalizedChannel] ?? CHANNEL_BASE_SCORES['default'];
  const roleAdj = ROLE_ADJUSTMENTS[normalizedRole] ?? 0;
  const verificationBonus = Math.min(20, Math.floor(verificationCount / 5) * 5);
  const contradictionPenalty = contradictionCount * 10;
  
  const raw = baseScore + roleAdj + verificationBonus - contradictionPenalty;
  return Math.max(0, Math.min(100, raw));
}
```

**5. C2 — 내용 풍부도 (Context Depth) 구현**

```javascript
const SIGNAL_SCORES = {
  hasText: 15,
  hasActionKeyword: 20,
  hasLinks: 15,          // 2개 이상
  hasTimestamp: 15,
  hasTeamMention: 10,
  hasCode: 15,
  hasReference: 10,
  hasIssueRef: 10
};
const METRICS_PER_ITEM = 10;
const CD_MAX = 100;

function scoreContextDepth(signals) {
  let total = 0;
  for (const [key, value] of Object.entries(signals || {})) {
    if (key === 'hasMetrics') {
      total += (value || 0) * METRICS_PER_ITEM;
    } else if (SIGNAL_SCORES[key] && value) {
      total += SIGNAL_SCORES[key];
    }
  }
  return Math.min(CD_MAX, total);
}
```

**Day 1 완료 기준:**
- [ ] 프로젝트 구조 생성 완료
- [ ] `scoreSourceCredibility()` 구현 + TC-SC-001~015 통과
- [ ] `scoreContextDepth()` 구현 + TC-CD-001~015 통과
- [ ] `npm test` 30개 통과

---

## Day 2 (2026-05-31): C3/C4 컴포넌트 + 메인 계산기

**목표:** 나머지 2개 컴포넌트 + 핵심 점수 계산 로직 완성

### 오전 (09:00–12:00): C3 + C4 구현

**6. C3 — 검증 일관성 (Verification Status) 구현**

```javascript
const VS_SCORES = {
  'VERIFIED': 100,
  'PARTIALLY_VERIFIED': 50,
  'UNVERIFIED': 0
};

const QUARANTINE_AFTER_DAYS_UNVERIFIED = 7;
const REVERIFY_AFTER_DAYS_PARTIAL = 30;

function scoreVerificationStatus({ verificationStatus, verificationSource = [], contradictionDetected = false, createdAt, currentDate }) {
  let status = (verificationStatus || 'UNVERIFIED').toUpperCase();
  
  // 소스 없는 VERIFIED → 강등
  if (status === 'VERIFIED' && verificationSource.length === 0) {
    status = 'PARTIALLY_VERIFIED';
  }
  
  // 모순 발견 시 강등
  if (contradictionDetected && status === 'VERIFIED') {
    status = 'PARTIALLY_VERIFIED';
  }
  
  const score = VS_SCORES[status] ?? 0;
  
  // 자동 격리 플래그 계산
  const autoQuarantine = checkAutoQuarantine(status, createdAt, currentDate);
  const reverifyAlert = checkReverifyAlert(status, createdAt, currentDate);
  
  return { score, status, autoQuarantine, reverifyAlert };
}
```

**7. C4 — 최신성 (Recency Freshness) 구현**

```javascript
const RF_DECAY_TABLE = [
  { maxDays: 1,  score: 100 },
  { maxDays: 3,  score: 90 },
  { maxDays: 7,  score: 80 },
  { maxDays: 14, score: 70 },
  { maxDays: 30, score: 50 },
  { maxDays: 60, score: 30 },
  { maxDays: 90, score: 15 },
  { maxDays: Infinity, score: 5 }
];

const RF_DEFAULT_NO_TIMESTAMP = 50;

function scoreRecencyFreshness(timestamp) {
  if (!timestamp) return RF_DEFAULT_NO_TIMESTAMP;
  
  const ageDays = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
  
  // 미래 타임스탬프
  if (ageDays < 0) return 100;
  
  for (const { maxDays, score } of RF_DECAY_TABLE) {
    if (ageDays <= maxDays) return score;
  }
  return 5;
}
```

### 오후 (13:00–18:00): 메인 계산기 + 분류기

**8. 메인 신뢰도 점수 계산기 구현**

```javascript
const DEFAULT_WEIGHTS = { SC: 0.40, CD: 0.25, VS: 0.20, RF: 0.15 };

async function calculateTrustScore(item, weights = DEFAULT_WEIGHTS) {
  // 병렬 계산
  const [SC, CD, VS, RF] = await Promise.all([
    scoreSourceCredibility(item),
    scoreContextDepth(item.signals || {}),
    scoreVerificationStatus(item),
    scoreRecencyFreshness(item.timestamp)
  ]);
  
  const vsScore = typeof VS === 'object' ? VS.score : VS;
  
  const rawScore = SC * weights.SC + CD * weights.CD + vsScore * weights.VS + RF * weights.RF;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const decision = classifyScore(finalScore);
  
  return {
    scoreId: generateScoreId(),
    trustScore: finalScore,
    decision,
    components: { sourceCredibility: SC, contextDepth: CD, verificationStatus: vsScore, recencyFreshness: RF },
    weights,
    calculatedAt: new Date().toISOString()
  };
}

function classifyScore(score) {
  if (score >= 60) return 'ACCEPT';
  if (score >= 40) return 'QUARANTINE';
  return 'REJECT';
}
```

**Day 2 완료 기준:**
- [ ] `scoreVerificationStatus()` 구현 + TC-VS-001~010 통과
- [ ] `scoreRecencyFreshness()` 구현 + TC-RF-001~015 통과
- [ ] `calculateTrustScore()` 메인 함수 구현 + TC-INT-001~010 통과
- [ ] `classifyScore()` 분류기 구현
- [ ] `npm test` 70개 통과

---

## Day 3 (2026-06-01): Express API 서버 + JSONL 저장소

**목표:** REST API 9개 엔드포인트 + 파일 저장소 완성

### API 엔드포인트 명세

| 메서드 | 경로 | 기능 | 응답 코드 |
|--------|------|------|-----------|
| GET | `/health` | 서비스 상태 확인 | 200 |
| POST | `/api/v1/trust-score` | 단일 항목 점수 계산 | 200, 400, 500 |
| POST | `/api/v1/trust-score/batch` | 배치 점수 계산 | 200, 400, 500 |
| GET | `/api/v1/trust-report` | 신뢰도 리포트 | 200 |
| PATCH | `/api/v1/trust-score/:id` | 검증 상태 업데이트 | 200, 404 |
| GET | `/api/v1/trust-weights` | 현재 가중치 조회 | 200 |
| PATCH | `/api/v1/trust-weights` | 가중치 업데이트 | 200, 400 |
| GET | `/api/v1/quarantine` | 격리 항목 목록 | 200 |
| DELETE | `/api/v1/quarantine/:id` | 격리 해제 | 200, 404 |

### 오전 (09:00–12:00): 핵심 API 구현

**9. POST /api/v1/trust-score 구현**

```javascript
// phase2c-trust-score.js

app.post('/api/v1/trust-score', async (req, res) => {
  const startTime = Date.now();
  const { content, channel, senderRole, timestamp, verificationStatus, signals } = req.body;
  
  if (!channel) {
    return res.status(400).json({ success: false, error: 'channel 필드 필수' });
  }
  
  try {
    const result = await calculateTrustScore({
      channel, senderRole, timestamp, verificationStatus,
      signals: signals || extractSignals(content)
    });
    
    result.processingTimeMs = Date.now() - startTime;
    
    // JSONL 저장
    await saveToJsonl(result);
    
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**10. POST /api/v1/trust-score/batch 구현**

```javascript
app.post('/api/v1/trust-score/batch', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'items 배열 필수' });
  }
  
  const CHUNK_SIZE = 50;
  const results = [];
  
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(chunk.map(item => calculateTrustScore(item)));
    results.push(...chunkResults);
  }
  
  await Promise.all(results.map(r => saveToJsonl(r)));
  
  res.json({
    success: true,
    totalItems: results.length,
    acceptCount: results.filter(r => r.decision === 'ACCEPT').length,
    quarantineCount: results.filter(r => r.decision === 'QUARANTINE').length,
    rejectCount: results.filter(r => r.decision === 'REJECT').length,
    items: results
  });
});
```

### 오후 (13:00–18:00): 리포트 + 가중치 API

**11. GET /api/v1/trust-report 구현**

```javascript
app.get('/api/v1/trust-report', async (req, res) => {
  const { period = 'daily' } = req.query;
  const items = await loadFromJsonl('trust_scores.jsonl');
  const filtered = filterByPeriod(items, period);
  
  const stats = {
    period,
    totalItems: filtered.length,
    acceptCount: filtered.filter(i => i.decision === 'ACCEPT').length,
    quarantineCount: filtered.filter(i => i.decision === 'QUARANTINE').length,
    rejectCount: filtered.filter(i => i.decision === 'REJECT').length,
    averageScore: filtered.length ? Math.round(filtered.reduce((s, i) => s + i.trustScore, 0) / filtered.length) : 0,
    items: filtered
  };
  
  res.json({ success: true, ...stats });
});
```

**12. JSONL 저장소 구현 (`lib/jsonl-store.js`)**

```javascript
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function saveToJsonl(record, filename = 'trust_scores.jsonl') {
  const filePath = path.join(DATA_DIR, filename);
  const line = JSON.stringify({ schemaVersion: '2C-1.0', ...record }) + '\n';
  await fs.appendFile(filePath, line, 'utf8');
}

async function loadFromJsonl(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch {
    return [];
  }
}
```

**Day 3 완료 기준:**
- [ ] 9개 API 엔드포인트 모두 구현
- [ ] JSONL 4개 파일 저장/로드 동작
- [ ] 헬스체크 `GET /health` 정상 응답
- [ ] TC-INT-011~030 통과
- [ ] `npm test` 90개 통과

---

## Day 4 (2026-06-02): LRU 캐시 + Phase 2A/2B 통합

**목표:** 캐싱 최적화 + 업스트림 서비스 통합 + 성능 목표 달성

### 오전 (09:00–12:00): LRU 캐시 구현

**13. 3-layer LRU 캐시 구현 (`lib/lru-cache.js`)**

```javascript
const { LRUCache } = require('lru-cache');

// L1: 출처 신뢰도 점수 캐시 (TTL 60분)
const sourceCache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 60 });

// L2: URL 유효성 캐시 (TTL 5분)
const urlCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 });

// L3: 메모리 매칭 캐시 (TTL 30분)
const matchCache = new LRUCache({ max: 2000, ttl: 1000 * 60 * 30 });

function getCachedSourceScore(sourceKey) {
  return sourceCache.get(sourceKey);
}

function setCachedSourceScore(sourceKey, score) {
  sourceCache.set(sourceKey, score);
}

module.exports = { getCachedSourceScore, setCachedSourceScore, urlCache, matchCache };
```

**14. scoreSourceCredibility()에 캐시 통합**

```javascript
async function scoreSourceCredibilityWithCache(params) {
  const cacheKey = `${params.channel}:${params.senderRole}:${params.verificationCount}`;
  const cached = getCachedSourceScore(cacheKey);
  if (cached !== undefined) return cached;
  
  const score = scoreSourceCredibility(params);
  setCachedSourceScore(cacheKey, score);
  return score;
}
```

### 오후 (13:00–18:00): Phase 2B 통합 + 폴백 처리

**15. Phase 2B 중복 감지 결과 수신**

```javascript
async function getPhase2BDuplicateStatus(itemId) {
  const PHASE2B_URL = process.env.PHASE2B_URL || 'http://localhost:3010';
  try {
    const res = await fetch(`${PHASE2B_URL}/api/v1/duplicate-check/${itemId}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error('Phase 2B unavailable');
    return await res.json();
  } catch {
    // Phase 2B 다운 → VS 기본값 50 폴백
    return { duplicateDetected: false, similarity: 0, fallback: true };
  }
}
```

**16. 성능 최적화 확인**

```javascript
// 성능 벤치마크 (Day 4 종료 전 실행)
async function benchmarkSingleItem() {
  const start = Date.now();
  await calculateTrustScore({
    channel: 'telegram_team_channel',
    senderRole: 'TeamMember',
    timestamp: new Date().toISOString(),
    verificationStatus: 'UNVERIFIED'
  });
  const duration = Date.now() - start;
  console.log(`단일 항목 처리시간: ${duration}ms (목표: <50ms)`);
  console.assert(duration < 50, `성능 목표 미달: ${duration}ms`);
}
```

**Day 4 완료 기준:**
- [ ] LRU 3-layer 캐시 구현 + TC-INT-014 통과
- [ ] Phase 2B 폴백 동작 + TC-EDGE-015 통과
- [ ] 단일 항목 처리 시간 <50ms 달성 + TC-INT-023 통과
- [ ] 동시 100개 요청 <5초 + TC-INT-025 통과
- [ ] `npm test` 100개 모두 통과

---

## Day 5 (2026-06-03): 테스트 완성 + 배포

**목표:** 전체 테스트 스위트 완성 + 배포 준비 + 문서화

### 오전 (09:00–12:00): 전체 테스트 스위트

**17. 테스트 스위트 완성 (`test-phase2c.js`)**

```javascript
const assert = require('assert');
const { calculateTrustScore, scoreSourceCredibility, scoreContextDepth,
        scoreVerificationStatus, scoreRecencyFreshness } = require('./lib/score-components');

async function runAllTests() {
  let passed = 0, failed = 0;
  
  // 단위 테스트 — C1 (15개)
  await testSourceCredibility();
  
  // 단위 테스트 — C2 (15개)
  await testContextDepth();
  
  // 단위 테스트 — C3 (10개)
  await testVerificationStatus();
  
  // 단위 테스트 — C4 (15개)
  await testRecencyFreshness();
  
  // 통합 테스트 (30개)
  await testIntegration();
  
  // 엣지 케이스 (20개)
  await testEdgeCases();
  
  console.log(`\n결과: ${passed}개 통과 / ${failed}개 실패 (총 ${passed + failed}개)`);
  process.exit(failed > 0 ? 1 : 0);
}
```

**18. 배포 스크립트**

```bash
#!/bin/bash
# scripts/start-phase2c.sh

echo "Phase 2C Trust Score Calculator 시작..."

# 전제 조건 확인
if ! curl -s http://localhost:3009/health > /dev/null 2>&1; then
  echo "오류: Phase 2A 서버 미실행 (PORT 3009)"
  exit 1
fi

if ! curl -s http://localhost:3010/health > /dev/null 2>&1; then
  echo "경고: Phase 2B 서버 미실행 (PORT 3010) — 폴백 모드로 시작"
fi

# 의존성 확인
cd "$(dirname "$0")/.."
npm install 2>/dev/null

# 서버 시작
PORT=3011 node phase2c-trust-score.js &
PID=$!
echo "Phase 2C 서버 시작 (PID: $PID)"

# 헬스체크
sleep 2
if curl -s http://localhost:3011/health | grep -q '"status":"healthy"'; then
  echo "✅ Phase 2C 정상 실행 중 (PORT 3011)"
else
  echo "❌ Phase 2C 시작 실패"
  kill $PID
  exit 1
fi
```

### 오후 (13:00–18:00): Supabase DDL + 최종 검증

**19. Supabase DDL 실행 (선택적)**

```sql
-- Supabase SQL Editor에서 실행
-- Phase 2C 테이블 생성

CREATE TABLE IF NOT EXISTS trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id TEXT UNIQUE NOT NULL,
  item_id TEXT,
  trust_score INTEGER NOT NULL CHECK (trust_score BETWEEN 0 AND 100),
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT', 'QUARANTINE', 'REJECT')),
  source_credibility INTEGER,
  context_depth INTEGER,
  verification_status INTEGER,
  recency_freshness INTEGER,
  channel TEXT,
  sender_role TEXT,
  weights JSONB DEFAULT '{"SC":0.40,"CD":0.25,"VS":0.20,"RF":0.15}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_decision ON trust_scores(decision);
CREATE INDEX idx_trust_scores_calculated_at ON trust_scores(calculated_at DESC);
CREATE INDEX idx_trust_scores_score ON trust_scores(trust_score DESC);

ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON trust_scores
  FOR ALL USING (auth.role() = 'service_role');
```

**20. 최종 수락 기준 체크리스트**

```
[ ] 단위 테스트 55개 통과 (C1×15 + C2×15 + C3×10 + C4×15)
[ ] 통합 테스트 30개 통과
[ ] 엣지 케이스 20개 통과
[ ] 단일 항목 처리 <50ms
[ ] 배치 1000개 처리 <2000ms
[ ] Phase 2A/2B 파이프라인 연동 동작
[ ] JSONL 4개 파일 저장/로드 정상
[ ] 헬스체크 응답 정상
[ ] PORT 3011 충돌 없음
[ ] 환경 변수 문서 최신화
```

**Day 5 완료 기준:**
- [ ] `npm test` 105개 모두 통과
- [ ] `scripts/start-phase2c.sh` 정상 실행
- [ ] 헬스체크 `GET /health` 응답 확인
- [ ] Supabase DDL 실행 (선택적 — 팀 여건에 따라)
- [ ] README_PHASE2C.md 작성 완료

---

## 완료 기준 요약

| 날짜 | 마일스톤 | 산출물 | 기준 |
|------|---------|--------|------|
| 2026-05-30 | C1 + C2 구현 | score-components.js (부분) | 30개 테스트 통과 |
| 2026-05-31 | C3 + C4 + 메인 계산기 | score-components.js (완성) | 70개 테스트 통과 |
| 2026-06-01 | REST API 9개 + JSONL | phase2c-trust-score.js | 90개 테스트 통과 |
| 2026-06-02 | LRU 캐시 + 통합 | lru-cache.js | 105개 테스트 통과 + <50ms |
| 2026-06-03 | 배포 완료 | 서버 실행 확인 | 전체 파이프라인 동작 |

---

## 다음 단계 — Phase 2D Cron 통합

Phase 2C 완료 후:

```
Phase 2D: Cron 통합 (2026-06-04)
- 5분 주기 자동 점수 계산 cron 설정
- Phase 2A → 2B → 2C 전체 파이프라인 자동 실행
- 일일 리포트 자동 발송 (Telegram)
- 임계값 미달 시 자동 알림
```

**담당:** DevOps Engineer (Phase C #12)  
**시작일:** 2026-06-04 09:00 KST  
**참조:** Phase C #12 스폰 메모리 파일

---

**작성자:** Memory System Specialist (Phase C #13)  
**검토자:** Evaluator AI Agent (QA Specialist — Phase C #14)  
**마감:** 2026-05-30 18:00 KST  
**구현 시작:** 2026-05-30 09:00 KST
