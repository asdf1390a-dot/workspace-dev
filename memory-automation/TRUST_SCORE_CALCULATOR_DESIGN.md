# Phase 2C: Trust Score Calculator — System Design

**단계:** DESIGN  
**작성일:** 2026-05-27  
**ETA:** 2026-05-30 18:00 KST  
**담당:** Memory System Specialist  
**상태:** 🟢 설계 완료 (구현 대기)  
**의존성:** Phase 2A ✅ 완료 | Phase 2B ✅ 완료  

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처 설계](#2-아키텍처-설계)
3. [4-컴포넌트 상세 명세](#3-4-컴포넌트-상세-명세)
4. [알고리즘 의사코드 및 복잡도 분석](#4-알고리즘-의사코드-및-복잡도-분석)
5. [캐싱 및 성능 최적화](#5-캐싱-및-성능-최적화)
6. [에러 핸들링 및 경계 조건](#6-에러-핸들링-및-경계-조건)
7. [Phase 2A/2B 통합 설계](#7-phase-2a2b-통합-설계)
8. [DB 스키마 및 영속성 설계](#8-db-스키마-및-영속성-설계)
9. [API 엔드포인트 명세](#9-api-엔드포인트-명세)
10. [모니터링 및 감사 추적 설계](#10-모니터링-및-감사-추적-설계)
11. [Cron 통합 설계](#11-cron-통합-설계)
12. [배포 및 확장 전략](#12-배포-및-확장-전략)
13. [구현 핸드오프 체크리스트](#13-구현-핸드오프-체크리스트)

---

## 1. 시스템 개요

### 1.1 목표

Phase 2C Trust Score Calculator는 **Telegram/Discord 메시지의 신뢰도를 0~100 점수로 자동 정량화**하는 독립 마이크로서비스입니다.

**핵심 역할:**
- Phase 2A(메시지 수집) + Phase 2B(중복 감지) 결과를 입력으로 받아
- 4개 컴포넌트 가중 점수를 계산하고
- 결과를 memory 파일 메타데이터 및 DB에 저장
- 60+ 점수 항목만 MEMORY.md 자동 등록, 나머지 격리/거부

### 1.2 Trust Score 공식

```
TRUST_SCORE (0-100) = (
    0.40 × source_credibility     // 소스 신뢰도 (Telegram/Discord 채널/발신자)
  + 0.25 × context_depth          // 메시지 내용 풍부도
  + 0.20 × verification_status    // 증거/링크 존재 여부
  + 0.15 × recency_freshness      // 시간 감쇠 신선도
)
```

**의사결정 임계값:**

| 점수 | 상태 | 처리 |
|------|------|------|
| 60-100 | ✅ ACCEPT | MEMORY.md 자동 등록 |
| 40-59  | 🟡 QUARANTINE | 수동 검토 대기열 |
| 0-39   | ❌ REJECT | 거부 로그 기록 |

### 1.3 성능 목표

| 지표 | 목표 | 비고 |
|------|------|------|
| 단일 항목 점수 계산 | < 100ms | CPU-only (LLM 제외) |
| 배치 처리 (100건) | < 5s | 병렬 처리 적용 |
| 배치 처리 (1000건) | < 30s | 스트리밍 응답 |
| 캐시 히트율 | > 70% | 소스 점수 재사용 |
| 가용성 | 99.5% | cron 주기 완료 기준 |

---

## 2. 아키텍처 설계

### 2.1 서비스 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                    외부 데이터 소스                              │
│  [Phase 2A: Message Collection]  [Phase 2B: Duplicate Detection] │
│         PORT 3009                      PORT 3010                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / 직접 파일 읽기
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Phase 2C: Trust Score Calculator                    │
│                       PORT 3011                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Request Router / Middleware                               │   │
│  │  - Auth token validation                                 │   │
│  │  - Rate limiting (100 req/min)                           │   │
│  │  - Input sanitization                                    │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │              Scoring Engine (Core)                        │  │
│  │                          │                                │  │
│  │  ┌─────────────┐  ┌──────┴──────┐  ┌────────────────┐   │  │
│  │  │  Component  │  │  Component  │  │   Component    │   │  │
│  │  │  C1: Source │  │  C2: Context│  │ C3: Verification│  │  │
│  │  │ Credibility │  │    Depth    │  │     Status     │   │  │
│  │  │  (weight 40)│  │  (weight 25)│  │   (weight 20)  │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬───────┘   │  │
│  │         │                │                   │           │  │
│  │  ┌──────┴────────────────┴───────────────────┴──────┐   │  │
│  │  │            Component C4: Recency Freshness        │   │  │
│  │  │                      (weight 15)                  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                          │                               │  │
│  │  ┌───────────────────────▼──────────────────────────┐   │  │
│  │  │             Score Aggregator                      │   │  │
│  │  │  TRUST_SCORE = 0.40*C1 + 0.25*C2 + 0.20*C3 +   │   │  │
│  │  │                0.15*C4                           │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │ Decision Router                                           │  │
│  │  score ≥ 60 → ACCEPT queue                               │  │
│  │  40 ≤ score < 60 → QUARANTINE queue                      │  │
│  │  score < 40 → REJECT queue                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌───────────────┬─────────▼──────────┬─────────────────────┐  │
│  │  Cache Layer  │  Persistence Layer  │  Notification Layer │  │
│  │  (LRU, 5min  │  (JSONL + MEMORY   │  (Quarantine alert) │  │
│  │   TTL)       │   files)            │                     │  │
│  └───────────────┴────────────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
Phase 2A output           Phase 2B output
   (messages)       +     (duplicates)
        │                      │
        └──────────┬───────────┘
                   │
          ┌────────▼────────┐
          │  Input Normalizer│  // 포맷 표준화
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Cache Check     │  // 소스/채널 점수 캐시
          └────────┬────────┘
                   │
         ┌─────────▼──────────┐
         │  Parallel Scorers   │
         │  [C1][C2][C3][C4]   │  // 4개 병렬 계산
         └─────────┬──────────┘
                   │
          ┌────────▼────────┐
          │  Aggregator      │  // 가중합 계산
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Decision Engine │  // ACCEPT/QUARANTINE/REJECT
          └────────┬────────┘
                   │
         ┌─────────┼──────────┐
    ACCEPT         │         REJECT
         │      QUARANTINE    │
         │         │          │
     memory/    quarantine  reject_log/
     auto-save   _log.md    YYYY-MM-DD.md
```

### 2.3 컴포넌트 인터페이스

각 컴포넌트는 독립 모듈로 구성됩니다:

```javascript
// 공통 인터페이스 (모든 컴포넌트 준수)
interface ScorerComponent {
  score(message: NormalizedMessage): Promise<ComponentResult>;
  reset(): void;
  getStats(): ComponentStats;
}

interface ComponentResult {
  score: number;           // 0-100
  confidence: number;      // 0-1 (계산 신뢰도)
  signals: string[];       // 어떤 신호로 점수 계산됐는지
  debugInfo: object;       // 디버깅 상세
}

interface NormalizedMessage {
  messageId: string;
  source: 'telegram' | 'discord';
  channel: string;
  author: string;
  text: string;
  timestamp: Date;
  hasUrl: boolean;
  urlList: string[];
  replyCount: number;
  hasCodeBlock: boolean;
  mentionedUsers: string[];
  isDuplicate: boolean;         // Phase 2B 결과
  duplicateClusterId?: string;  // Phase 2B 결과
}
```

---

## 3. 4-컴포넌트 상세 명세

### 3.1 Component C1: Source Credibility (가중치 40%)

**목적:** 메시지의 발신 채널과 발신자 권한에 따른 신뢰도 측정

#### 3.1.1 Telegram 소스 기본 점수

| 소스 유형 | 기본 점수 | 이유 |
|-----------|-----------|------|
| CEO 직접 메시지 | 90 | 최고 의사결정권자 |
| CEO 언급 채널 메시지 | 85 | CEO 관여 = 공식성 |
| 팀 스레드 (3+ 답변) | 80 | 다수 검증 |
| 팀 스레드 (1-2 답변) | 75 | 일부 검증 |
| 일반 채널 메시지 | 70 | 공지 수준 |
| 봇/시스템 메시지 | 55 | 자동화, 인간 확인 필요 |
| 알 수 없는 소스 | 40 | 기본 최솟값 |

#### 3.1.2 Discord 소스 기본 점수

| 채널 | 기본 점수 | 이유 |
|------|-----------|------|
| #공지 (Announcements) | 90 | 공식 발표 채널 |
| #회의 (Meetings) | 85 | 공식 의사결정 채널 |
| #기술 (Technical) | 75 | 기술 정보 채널 |
| #일반 (General) | 65 | 일상 대화 |
| DM (1-on-1) | 60 | 비공개, 검증 필요 |
| 알 수 없는 채널 | 50 | 기본 최솟값 |

#### 3.1.3 조정값 (adjustments)

```javascript
const ADJUSTMENTS = {
  hasWorkingUrl: +10,       // 링크 포함 시
  hasDecisionKeyword: +10,  // 결정/확정/승인/완료 포함 시
  hasCodeBlock: +5,         // 코드 블록 포함 시
  lowTextClarity: -10,      // 내용이 불명확할 때 (clarity < 0.6)
  oldMessage_30d: -5,       // 30일 이상 오래된 메시지
  isDuplicate: -15,         // Phase 2B: 중복 감지된 메시지
};
```

**최종 C1 점수:** `Math.min(100, Math.max(0, baseScore + sumAdjustments))`

#### 3.1.4 엣지 케이스

| 상황 | 처리 |
|------|------|
| source가 null | 점수 40 (최소 기본값) |
| source 값이 'telegram'/'discord' 아님 | 점수 40 |
| CEO와 bot이 동시에 언급 | CEO 기준 우선 적용 |
| 두 채널 동시 발송 | 높은 채널 점수 적용 |
| 조정값 합이 100을 초과 | min(100) 클램핑 |
| 조정값 합이 음수로 내려감 | max(0) 클램핑 |

---

### 3.2 Component C2: Context Depth (가중치 25%)

**목적:** 메시지 내용 자체의 정보 밀도와 풍부도 측정

#### 3.2.1 Context 신호 점수표

| 신호 | 점수 | 감지 기준 |
|------|------|-----------|
| 충분한 설명 텍스트 | +15 | len(text) > 30자 |
| 액션 키워드 | +20 | '할일','완료','진행중','대기','TODO','DONE' |
| 2개 이상 URL | +15 | count_urls ≥ 2 |
| 1개 URL | +8 | count_urls == 1 |
| 날짜/타임스탬프 참조 | +15 | 날짜 패턴 감지 |
| 팀원 언급 | +10 | @mention 또는 이름 |
| 기술적 세부사항 | +15 | 코드 블록 또는 기술 용어 |
| 이전 결정 참조 | +10 | "이전에", "기존에", 이전 링크 |
| 스레드 토론 (3+ 답변) | +5 | replyCount ≥ 3 |
| **최대 합계** | **100** | min(합계, 100) |

#### 3.2.2 감지 알고리즘 세부

```javascript
// 날짜 패턴 감지
const DATE_PATTERNS = [
  /\d{4}-\d{2}-\d{2}/,             // YYYY-MM-DD
  /\d{2}\/\d{2}\/\d{4}/,           // MM/DD/YYYY
  /(?:오늘|내일|어제|이번주|다음주)/,  // 한국어 날짜 표현
  /(?:January|February|...|December)\s+\d{1,2}/i, // 영어 월
];

// 기술 용어 감지 (DSC FMS 도메인 특화)
const TECH_JARGON = [
  /API|endpoint|POST|GET|PUT|DELETE/i,
  /DB|database|schema|table|column/i,
  /JWT|RLS|auth|token/i,
  /Supabase|Vercel|Next\.js|React/i,
  /commit|deploy|build|CI\/CD/i,
  /Phase|Sprint|iteration/i,
];
```

#### 3.2.3 엣지 케이스

| 상황 | 처리 |
|------|------|
| text가 빈 문자열 | 0점 반환 |
| text가 이모지만 | 0점 (30자 미만) |
| text가 2000자 초과 | 점수는 정상 계산 (길이 제한은 MEMORY 등록 단계에서) |
| URL이 모두 broken | URL 카운트는 정상 계산 (C3에서 broken URL 감점) |
| 한국어와 영어 혼합 | 양쪽 패턴 모두 적용 |

---

### 3.3 Component C3: Verification Status (가중치 20%)

**목적:** 메시지 내용이 외부 증거/확인으로 뒷받침되는 수준 측정

#### 3.3.1 검증 레벨 정의

```
VERIFIED (100점) — 신호 3개 이상
  ✅ 동작하는 링크 확인 가능
  ✅ 2개 이상 독립 소스에 언급
  ✅ 완료 마커 (✅, 완료, DONE, 확정, 승인)
  ✅ CEO/관리자 명시적 승인
  ✅ 명시적 날짜 포함

PARTIALLY_VERIFIED (50점) — 신호 1-2개
  🟡 링크 제공됨 (확인 안됨)
  🟡 1개 채널에서만 언급
  🟡 부분적 증거
  🟡 진행 중 상태

UNVERIFIED (0점) — 신호 0개
  ❌ 증거 없음
  ❌ 링크 없음
  ❌ 신규 주장, 검증 전
  ❌ 소문/추측성
```

#### 3.3.2 신호 감지 로직

```javascript
const COMPLETION_MARKERS = ['✅', '완료', 'DONE', '확정', '승인', 'COMPLETE', '완성'];
const APPROVAL_TERMS = ['CEO 확인', 'CEO 승인', 'approved by', '나경태 확인'];

function detectVerificationSignals(message) {
  const signals = [];

  // 신호 1: 동작 링크 (URL 존재 여부 검사)
  if (message.urlList.length > 0) {
    signals.push('has_url');
  }

  // 신호 2: 메모리 파일과 매칭 (이미 기록된 사실 참조)
  if (matchesExistingMemory(message.text)) {
    signals.push('matches_memory');
  }

  // 신호 3: 완료 마커
  if (COMPLETION_MARKERS.some(m => message.text.includes(m))) {
    signals.push('has_completion_marker');
  }

  // 신호 4: 권한자 승인
  if (APPROVAL_TERMS.some(t => message.text.toLowerCase().includes(t.toLowerCase()))) {
    signals.push('has_authority_approval');
  }

  // 신호 5: 명시적 타임스탬프
  if (hasExplicitDate(message.text)) {
    signals.push('has_explicit_date');
  }

  return signals;
}
```

#### 3.3.3 엣지 케이스

| 상황 | 처리 |
|------|------|
| URL이 있지만 404 | 신호 제외 (async URL check with timeout 2s) |
| URL 확인 타임아웃 | 신호 포함 (fail-open — 링크 제공 자체를 신호로) |
| 복수 완료 마커 | 단일 신호로 카운트 (중복 카운트 방지) |
| 메모리 매칭 API 실패 | 신호 0으로 계산 (fail-safe) |

---

### 3.4 Component C4: Recency Freshness (가중치 15%)

**목적:** 메시지 나이에 따른 시간 감쇠 신선도 측정

#### 3.4.1 시간 구간 점수표

| 나이 | 점수 | 이유 |
|------|------|------|
| 오늘 (0일) | 100 | 최신 |
| 어제 (1일 이하) | 98 | 거의 최신 |
| 3일 이내 | 90 | 매우 신선 |
| 1주일 이내 | 80 | 신선 |
| 2주 이내 | 70 | 보통 |
| 1달 이내 | 50 | 약간 오래됨 |
| 2달 이내 | 30 | 오래됨 |
| 3달 이내 | 15 | 매우 오래됨 |
| 3달 초과 | 5 | 아카이브 수준 |

#### 3.4.2 계산 함수

```javascript
function calculateRecencyFreshness(messageDateOrDays) {
  let ageDays;
  if (messageDateOrDays instanceof Date) {
    ageDays = Math.floor((Date.now() - messageDateOrDays.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    ageDays = messageDateOrDays; // 숫자로 직접 전달 가능
  }

  if (ageDays < 0) return 100;         // 미래 타임스탬프 → 최신 처리
  if (ageDays === 0) return 100;
  if (ageDays <= 1) return 98;
  if (ageDays <= 3) return 90;
  if (ageDays <= 7) return 80;
  if (ageDays <= 14) return 70;
  if (ageDays <= 30) return 50;
  if (ageDays <= 60) return 30;
  if (ageDays <= 90) return 15;
  return 5;
}
```

#### 3.4.3 엣지 케이스

| 상황 | 처리 |
|------|------|
| timestamp가 null | 현재 시각 기준 0일로 처리 (100점) |
| timestamp가 미래 | ageDays = 0 처리 (100점) |
| timestamp 형식 불일치 | try-parse 실패 시 50점 (중간값) |
| DST 변경 경계 | UTC 기준으로 통일 계산 |

---

## 4. 알고리즘 의사코드 및 복잡도 분석

### 4.1 메인 점수 계산 알고리즘

```
FUNCTION calculateTrustScore(message):
  INPUT: NormalizedMessage
  OUTPUT: TrustScoreResult

  // Step 1: 병렬 컴포넌트 계산 (Promise.all)
  [c1, c2, c3, c4] = PARALLEL(
    scoreSourceCredibility(message),    // O(1)
    scoreContextDepth(message),         // O(n) n = text length
    scoreVerificationStatus(message),   // O(m) m = url count
    scoreRecencyFreshness(message)      // O(1)
  )

  // Step 2: 가중합 계산
  trustScore = ROUND(0.40 * c1.score
                   + 0.25 * c2.score
                   + 0.20 * c3.score
                   + 0.15 * c4.score)

  // Step 3: 경계 보정
  trustScore = CLAMP(trustScore, 0, 100)

  // Step 4: 결정 분류
  decision = CLASSIFY(trustScore)
    60 ≤ score ≤ 100 → ACCEPT
    40 ≤ score < 60  → QUARANTINE
    0 ≤ score < 40   → REJECT

  // Step 5: 결과 구성
  RETURN TrustScoreResult {
    score: trustScore,
    decision: decision,
    components: {c1, c2, c3, c4},
    processedAt: NOW()
  }

TIME COMPLEXITY: O(n + m) where n = text length, m = url count
SPACE COMPLEXITY: O(1) (상수 크기의 결과 객체)
LATENCY TARGET: < 100ms (URL 확인 제외)
```

### 4.2 배치 처리 알고리즘

```
FUNCTION processBatch(messages, options):
  INPUT: messages[] (최대 1000건), options.concurrency = 10
  OUTPUT: BatchResult[]

  // 청크 분할 (메모리 효율)
  chunks = CHUNK(messages, size=50)

  results = []
  FOR chunk IN chunks:
    // 청크 내 병렬 처리
    chunkResults = PARALLEL(
      FOR msg IN chunk: calculateTrustScore(msg),
      CONCURRENCY_LIMIT = options.concurrency
    )
    results.EXTEND(chunkResults)

    // 배압 제어 (rate limiting)
    IF remaining_chunks > 0:
      SLEEP(10ms)  // 타 서비스 영향 최소화

  RETURN results

TIME COMPLEXITY: O(k × n) where k = chunks, n = messages per chunk
THROUGHPUT: ~100 messages/second (단일 worker)
```

### 4.3 URL 검증 알고리즘

```
FUNCTION verifyUrl(url, timeout=2000):
  INPUT: url string, timeout ms
  OUTPUT: boolean

  // 캐시 확인 (URL별 TTL 5분)
  IF urlCache.has(url) AND urlCache.get(url).ttl > NOW():
    RETURN urlCache.get(url).result

  TRY:
    response = HTTP_HEAD(url, timeout=timeout)
    isValid = (response.status >= 200 AND response.status < 400)
    urlCache.set(url, {result: isValid, ttl: NOW() + 5min})
    RETURN isValid
  CATCH timeout:
    RETURN true   // fail-open: 타임아웃은 유효로 처리
  CATCH error:
    RETURN false  // 명시적 오류만 무효 처리

TIME COMPLEXITY: O(1) 캐시 히트 / O(network latency) 캐시 미스
```

---

## 5. 캐싱 및 성능 최적화

### 5.1 캐시 전략

```
┌───────────────────────────────────────────────────────────┐
│                   3-레이어 캐시                           │
│                                                           │
│  L1: Source Score Cache (인메모리)                        │
│  - Key: `${source}:${channel}:${author}`                  │
│  - TTL: 60분                                              │
│  - 크기: 최대 500 엔트리                                 │
│  - 용도: 동일 소스의 반복 메시지 빠른 처리               │
│                                                           │
│  L2: URL Validity Cache (인메모리)                        │
│  - Key: url string                                        │
│  - TTL: 5분                                               │
│  - 크기: 최대 1000 엔트리                                │
│  - 용도: URL HEAD 요청 중복 방지                         │
│                                                           │
│  L3: Memory Match Cache (파일 기반)                       │
│  - Key: content hash (MD5)                               │
│  - TTL: 30분                                              │
│  - 파일: cache/memory_match_cache.json                   │
│  - 용도: MEMORY.md 내용과의 매칭 결과 재사용             │
└───────────────────────────────────────────────────────────┘
```

### 5.2 LRU 캐시 구현

```javascript
class LRUCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();  // 삽입 순서 보장
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const entry = this.cache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // LRU: 최근 접근 시 맨 끝으로 이동
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거 (Map의 첫 번째 키)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }
}
```

### 5.3 병렬 처리 최적화

- 4개 컴포넌트 계산은 `Promise.all`로 완전 병렬 실행
- URL 검증 (C3 내부)은 배치 URL 검증으로 최적화
  - `Promise.all(urls.map(url => verifyUrl(url)))` 형태
  - 단, 최대 5개 동시 HEAD 요청으로 제한 (서버 과부하 방지)
- 배치 처리 시 청크당 10개 동시 처리 (concurrency = 10)

### 5.4 성능 프로파일링 포인트

```javascript
// 각 컴포넌트별 소요시간 추적
const perfMarkers = {
  c1_start: performance.now(),
  c1_end: null,
  c2_start: null,
  c2_end: null,
  // ...
};

// 100ms 초과 시 경고 로그
if (totalTime > 100) {
  logger.warn('Slow scoring detected', {
    messageId: msg.messageId,
    totalTime,
    breakdown: perfMarkers
  });
}
```

---

## 6. 에러 핸들링 및 경계 조건

### 6.1 에러 카테고리

| 에러 유형 | 처리 전략 | 결과 |
|-----------|-----------|------|
| 입력 검증 실패 | 즉시 400 반환 | 채점 불가 메시지 |
| Phase 2A 연결 실패 | 재시도 3회 후 503 | 배치 전체 실패 |
| Phase 2B 데이터 없음 | 기본값 사용 (isDuplicate=false) | 채점 계속 |
| URL HEAD 타임아웃 | fail-open (유효로 처리) | 채점 계속 |
| 메모리 파일 읽기 실패 | 신호 0으로 처리 | 채점 계속 |
| 점수 계산 오버플로 | clamp(0, 100) | 안전한 점수 반환 |
| 타임스탬프 파싱 실패 | 50점 (중간값) | 채점 계속 |

### 6.2 입력 검증 스키마

```javascript
const messageSchema = {
  messageId: { type: 'string', required: true, minLength: 1 },
  source: { type: 'enum', values: ['telegram', 'discord'], required: true },
  channel: { type: 'string', required: true },
  author: { type: 'string', required: true },
  text: { type: 'string', required: true, maxLength: 10000 },
  timestamp: { type: 'date', required: true },
  hasUrl: { type: 'boolean', default: false },
  urlList: { type: 'array', items: { type: 'string' }, default: [] },
  replyCount: { type: 'integer', min: 0, default: 0 },
  hasCodeBlock: { type: 'boolean', default: false },
  mentionedUsers: { type: 'array', items: { type: 'string' }, default: [] },
  isDuplicate: { type: 'boolean', default: false },
  duplicateClusterId: { type: 'string', optional: true },
};
```

### 6.3 Circuit Breaker 패턴

```javascript
class CircuitBreaker {
  constructor(threshold = 5, resetTimeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.state = 'CLOSED';  // CLOSED | OPEN | HALF_OPEN
    this.lastFailureTime = null;
    this.resetTimeout = resetTimeout;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Phase 2A 연결에 적용
const phase2aCircuitBreaker = new CircuitBreaker(5, 60000);
```

### 6.4 경계 조건 매트릭스

| 조건 | C1 동작 | C2 동작 | C3 동작 | C4 동작 |
|------|---------|---------|---------|---------|
| 빈 메시지 ("") | 40 (기본) | 0 | 0 | timestamp 기준 |
| 이모지만 (👍) | 정상 | 0 | 0 | 정상 |
| 최대 길이 텍스트 | 정상 | 100 (상한) | 정상 | 정상 |
| null timestamp | 정상 | 정상 | 정상 | 100 (오늘) |
| 미래 timestamp | 정상 | 정상 | 정상 | 100 |
| source=null | 40 | 정상 | 정상 | 정상 |
| isDuplicate=true | -15 조정 | 정상 | 정상 | 정상 |
| urlList=[] + hasUrl=true | 정상 | 정상 | 0 신호 | 정상 |

---

## 7. Phase 2A/2B 통합 설계

### 7.1 Phase 2A 통합 (Message Collection)

**입력 수신 방법:**

```javascript
// 방법 1: 직접 API 호출
async function fetchFromPhase2A(sessionKey, limit = 100) {
  const response = await phase2aCircuitBreaker.call(() =>
    fetch('http://localhost:3009/api/collect-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionKey, limit })
    })
  );
  return response.json();
}

// 방법 2: 배치 수집
async function fetchBatchFromPhase2A(items) {
  return fetch('http://localhost:3009/api/batch-collect', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}
```

**Phase 2A 출력 → Phase 2C 입력 변환:**

```javascript
function normalizePhase2AMessage(rawMsg) {
  return {
    messageId: rawMsg.messageId,
    source: detectSource(rawMsg.author),  // author 패턴으로 telegram/discord 감지
    channel: rawMsg.channel || 'unknown',
    author: rawMsg.author,
    text: rawMsg.content || '',
    timestamp: new Date(rawMsg.timestamp),
    hasUrl: /https?:\/\//.test(rawMsg.content),
    urlList: extractUrls(rawMsg.content),
    replyCount: rawMsg.toolCalls?.length || 0,  // 도구 호출 수로 활동도 추정
    hasCodeBlock: /```/.test(rawMsg.content),
    mentionedUsers: extractMentions(rawMsg.content),
    isDuplicate: false,        // Phase 2B에서 덮어씀
    duplicateClusterId: null,
  };
}
```

### 7.2 Phase 2B 통합 (Duplicate Detection)

**중복 감지 결과 병합:**

```javascript
async function enrichWithDuplicateInfo(messages) {
  // Phase 2B API 호출
  const dupResult = await fetch('http://localhost:3010/api/detect-duplicates', {
    method: 'POST',
    body: JSON.stringify({ entries: messages.map(m => ({
      filename: m.messageId,
      title: m.text.slice(0, 100),
      description: m.text,
    }))})
  });

  const { recommendations } = await dupResult.json();

  // 중복 정보 메시지에 병합
  const duplicateMap = new Map();
  for (const rec of recommendations) {
    for (const idx of rec.duplicateIndices) {
      duplicateMap.set(idx, {
        isDuplicate: true,
        clusterId: rec.clusterId,
        confidence: rec.confidence,
      });
    }
  }

  return messages.map((msg, idx) => ({
    ...msg,
    ...duplicateMap.get(idx) || { isDuplicate: false }
  }));
}
```

**통합 파이프라인:**

```javascript
async function fullPipeline(sessionKey) {
  // 1. Phase 2A: 메시지 수집
  const raw = await fetchFromPhase2A(sessionKey);

  // 2. 정규화
  const normalized = raw.messages.map(normalizePhase2AMessage);

  // 3. Phase 2B: 중복 감지 및 병합
  const enriched = await enrichWithDuplicateInfo(normalized);

  // 4. Phase 2C: 신뢰도 점수 계산
  const scored = await processBatch(enriched);

  // 5. 결정 및 저장
  await routeAndSave(scored);

  return scored;
}
```

---

## 8. DB 스키마 및 영속성 설계

### 8.1 trust_scores JSONL (영속 저장)

```
// 파일: memory-automation/trust_scores.jsonl
// 형식: 줄당 1개 JSON 오브젝트
{
  "scoreId": "ts_20260527_abc123",
  "messageId": "tg_12345_67890",
  "source": "telegram",
  "channel": "general",
  "author": "nakyeongtae",
  "textSnippet": "Asset Master Phase A 결정됨...",
  "trustScore": 87,
  "decision": "ACCEPT",
  "components": {
    "sourceCredibility": { "score": 90, "signals": ["CEO_direct", "has_url"] },
    "contextDepth": { "score": 85, "signals": ["action_keyword", "date_ref"] },
    "verificationStatus": { "score": 100, "signals": ["completion_marker", "url"] },
    "recencyFreshness": { "score": 98, "signals": ["age_1_day"] }
  },
  "processingTimeMs": 45,
  "processedAt": "2026-05-27T14:30:00.000Z",
  "phase2bClusterId": null,
  "memoryFileCreated": "project_asset_master_phase_a.md"
}
```

### 8.2 quarantine_log JSONL

```
// 파일: memory-automation/quarantine_log.jsonl
{
  "quarantineId": "qr_20260527_def456",
  "messageId": "tg_11111_22222",
  "trustScore": 52,
  "reason": "QUARANTINE: score 40-59",
  "components": { ... },
  "reviewStatus": "PENDING",  // PENDING | APPROVED | REJECTED
  "reviewedAt": null,
  "reviewedBy": null,
  "quarantinedAt": "2026-05-27T14:35:00.000Z"
}
```

### 8.3 reject_log JSONL

```
// 파일: memory-automation/reject_log.jsonl
{
  "rejectId": "rj_20260527_ghi789",
  "messageId": "dsc_33333_44444",
  "trustScore": 28,
  "reason": "REJECT: score < 40",
  "components": { ... },
  "rejectedAt": "2026-05-27T14:36:00.000Z"
}
```

### 8.4 MEMORY.md 메타데이터 형식

신뢰도 점수가 60 이상인 항목은 메모리 파일 생성 시 YAML frontmatter 추가:

```yaml
---
name: Asset Master Phase A 완료
description: 506개 자산 관리 + API 16개 엔드포인트 (2026-05-27)
type: project
trust_score: 87
trust_breakdown:
  source_credibility: 90
  context_depth: 85
  verification_status: 100
  recency_freshness: 98
source: telegram
source_message_id: tg_12345_67890
auto_collected: true
processed_at: "2026-05-27T14:30:00Z"
---
```

### 8.5 스키마 버전 관리

```javascript
const SCHEMA_VERSION = '2C-1.0';

function writeRecord(record) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ...record,
  };
}

function readRecord(raw) {
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return migrateRecord(raw, raw.schemaVersion, SCHEMA_VERSION);
  }
  return raw;
}
```

---

## 9. API 엔드포인트 명세

### 9.1 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /health | 상태 확인 |
| GET | /api/status | 서비스 통계 |
| POST | /api/score | 단일 메시지 채점 |
| POST | /api/score-batch | 배치 채점 |
| POST | /api/pipeline | 전체 파이프라인 실행 |
| GET | /api/quarantine | 격리 대기 목록 |
| POST | /api/quarantine/:id/approve | 격리 항목 승인 |
| POST | /api/quarantine/:id/reject | 격리 항목 거부 |
| GET | /api/scores | 최근 점수 이력 |

### 9.2 상세 API 명세

**POST /api/score — 단일 채점**

```
Request:
{
  "messageId": "tg_12345",
  "source": "telegram",
  "channel": "general",
  "author": "nakyeongtae",
  "text": "Asset Master Phase A 결정됨: 506개 자산, 16 API",
  "timestamp": "2026-05-27T14:30:00Z",
  "hasUrl": false,
  "urlList": [],
  "replyCount": 0,
  "hasCodeBlock": false,
  "mentionedUsers": [],
  "isDuplicate": false
}

Response 200:
{
  "success": true,
  "scoreId": "ts_20260527_abc123",
  "messageId": "tg_12345",
  "trustScore": 87,
  "decision": "ACCEPT",
  "components": {
    "sourceCredibility": { "score": 90, "weight": 0.40, "contribution": 36.0 },
    "contextDepth":      { "score": 85, "weight": 0.25, "contribution": 21.25 },
    "verificationStatus":{ "score": 100,"weight": 0.20, "contribution": 20.0 },
    "recencyFreshness":  { "score": 98, "weight": 0.15, "contribution": 14.7 }
  },
  "processingTimeMs": 45,
  "processedAt": "2026-05-27T14:30:00.123Z"
}

Response 400 (입력 오류):
{
  "error": "Invalid input",
  "code": "VALIDATION_FAILED",
  "details": [{ "field": "source", "message": "must be telegram or discord" }]
}
```

**POST /api/score-batch — 배치 채점**

```
Request:
{
  "messages": [ ...NormalizedMessage[] ],
  "options": {
    "concurrency": 10,
    "includeRejected": false
  }
}

Response 200:
{
  "success": true,
  "total": 100,
  "accepted": 77,
  "quarantined": 14,
  "rejected": 9,
  "results": [ ...TrustScoreResult[] ],
  "processingTimeMs": 1234,
  "processedAt": "2026-05-27T14:30:00.000Z"
}
```

**POST /api/pipeline — 전체 파이프라인**

```
Request:
{
  "sessionKey": "telegram:main",
  "limit": 100,
  "options": { "saveToMemory": true }
}

Response 200:
{
  "success": true,
  "messagesCollected": 100,
  "duplicatesDetected": 5,
  "scored": 95,
  "accepted": 72,
  "quarantined": 15,
  "rejected": 8,
  "memoryFilesCreated": 72,
  "processingTimeMs": 4500
}
```

---

## 10. 모니터링 및 감사 추적 설계

### 10.1 핵심 메트릭

```javascript
const metrics = {
  // 처리량
  totalScored: 0,          // 전체 채점 수
  acceptedCount: 0,        // 수락 수
  quarantinedCount: 0,     // 격리 수
  rejectedCount: 0,        // 거부 수

  // 컴포넌트별 평균 점수
  avgC1Score: [],          // 이동 평균용 배열
  avgC2Score: [],
  avgC3Score: [],
  avgC4Score: [],

  // 성능
  scoringLatencyMs: [],    // 최근 100건 소요 시간
  cacheHitRate: 0,         // 캐시 히트율

  // 에러
  errorCount: 0,
  lastError: null,
};
```

### 10.2 감사 로그 형식

```
// 파일: memory-automation/logs/trust_score_audit.log
// 형식: 줄당 1개 JSON
{
  "auditId": "audit_20260527_001",
  "action": "SCORE_CALCULATED",
  "messageId": "tg_12345",
  "trustScore": 87,
  "decision": "ACCEPT",
  "processingTimeMs": 45,
  "cacheHit": true,
  "timestamp": "2026-05-27T14:30:00.000Z"
}

{
  "auditId": "audit_20260527_002",
  "action": "QUARANTINE_ADDED",
  "messageId": "dsc_67890",
  "trustScore": 52,
  "reason": "score_40_59",
  "timestamp": "2026-05-27T14:31:00.000Z"
}

{
  "auditId": "audit_20260527_003",
  "action": "QUARANTINE_APPROVED",
  "quarantineId": "qr_20260527_def456",
  "approvedBy": "system_cron",
  "timestamp": "2026-05-27T15:00:00.000Z"
}
```

### 10.3 점수 분포 히스토그램

```javascript
// 실시간 분포 추적
class ScoreHistogram {
  constructor() {
    this.buckets = new Array(10).fill(0); // 0-9, 10-19, ..., 90-100
  }

  record(score) {
    const bucket = Math.min(Math.floor(score / 10), 9);
    this.buckets[bucket]++;
  }

  report() {
    return {
      '0-9':   this.buckets[0],
      '10-19': this.buckets[1],
      '20-29': this.buckets[2],
      '30-39': this.buckets[3],
      '40-49': this.buckets[4],
      '50-59': this.buckets[5],
      '60-69': this.buckets[6],
      '70-79': this.buckets[7],
      '80-89': this.buckets[8],
      '90-100':this.buckets[9],
      acceptRate: `${((this.buckets.slice(6).reduce((a,b)=>a+b,0) / this.total()) * 100).toFixed(1)}%`,
    };
  }

  total() {
    return this.buckets.reduce((a, b) => a + b, 0);
  }
}
```

### 10.4 알림 조건

| 조건 | 알림 수준 | 처리 |
|------|-----------|------|
| 수락률 < 50% | WARNING | 로그 + 격리 대기열 증가 알림 |
| 수락률 < 30% | CRITICAL | 로그 + 운영자 알림 |
| 채점 latency > 500ms | WARNING | 성능 저하 로그 |
| 격리 대기 > 50건 | WARNING | 수동 검토 필요 알림 |
| 에러율 > 5% | CRITICAL | Circuit breaker 트리거 |

---

## 11. Cron 통합 설계

### 11.1 Cron 주기 및 동작

```bash
#!/usr/bin/env bash
# 파일: memory-automation/phase2c-cron.sh
# 주기: 5분마다 (*/5 * * * *)

PHASE2C_URL="http://localhost:3011"
LOG_FILE="memory-automation/logs/phase2c-cron.log"
LOCK_FILE="/tmp/phase2c.lock"
TIMEOUT=240  # 4분 타임아웃 (5분 주기보다 짧게)

log() { echo "$(date -Iseconds) $*" | tee -a "$LOG_FILE"; }

# 멱등성 보장: 이전 실행 중이면 스킵
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE")
  if kill -0 "$LOCK_PID" 2>/dev/null; then
    log "SKIP: previous run (PID $LOCK_PID) still active"
    exit 0
  fi
  log "WARN: stale lock file removed"
  rm -f "$LOCK_FILE"
fi

echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# 건강 확인
if ! curl -sf --max-time 5 "$PHASE2C_URL/health" > /dev/null; then
  log "ERROR: Phase 2C service not responding"
  exit 1
fi

# 파이프라인 실행
RESPONSE=$(curl -sf --max-time $TIMEOUT -X POST "$PHASE2C_URL/api/pipeline" \
  -H "Content-Type: application/json" \
  -d '{"sessionKey": "telegram:main", "limit": 200, "options": {"saveToMemory": true}}')

if [ $? -ne 0 ]; then
  log "ERROR: Pipeline request failed"
  exit 1
fi

# 결과 파싱 및 로그
ACCEPTED=$(echo "$RESPONSE" | jq -r '.accepted // 0')
QUARANTINED=$(echo "$RESPONSE" | jq -r '.quarantined // 0')
REJECTED=$(echo "$RESPONSE" | jq -r '.rejected // 0')

log "SUCCESS: accepted=$ACCEPTED quarantined=$QUARANTINED rejected=$REJECTED"
```

### 11.2 멱등성 설계

- **messageId 기반 중복 처리 방지:** 이미 채점된 messageId는 trust_scores.jsonl에서 확인 후 스킵
- **Lock 파일:** 동시 실행 방지 (`/tmp/phase2c.lock`)
- **타임아웃:** 4분 (5분 cron 주기보다 1분 짧게)
- **재시도 없음:** cron 실패 시 다음 5분 주기에 자동 재실행

---

## 12. 배포 및 확장 전략

### 12.1 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Phase 2A | 3009 | Message Collection |
| Phase 2B | 3010 | Duplicate Detection |
| Phase 2C | 3011 | Trust Score Calculator |

### 12.2 수평 확장 고려사항

- **Worker isolation:** 각 worker는 독립적 메모리 상태
- **공유 상태 최소화:** JSONL 파일은 append-only (충돌 없음)
- **캐시 불일치:** L1 인메모리 캐시는 worker별 독립 (L3 파일 캐시는 공유)
- **Lock 파일:** 멀티 worker 환경에서는 Redis distributed lock으로 교체 필요

### 12.3 의존성 매트릭스

```
Phase 2C 시작 조건:
  ✅ Phase 2A (3009) 실행 중
  ✅ Phase 2B (3010) 실행 중
  ✅ MEMORY_DIR 접근 가능
  ✅ memory-automation/logs/ 디렉터리 존재

Phase 2C 중단 시 영향:
  ❌ 자동 신뢰도 채점 중단 (수동 처리 필요)
  ✅ Phase 2A/2B 독립 동작 가능
  ✅ 기존 MEMORY.md 영향 없음
```

---

## 13. 구현 핸드오프 체크리스트

Phase 2C 구현자(웹개발자)에게 전달할 핵심 체크리스트:

### 13.1 구현 우선순위

```
P0 (필수):
  [ ] phase2c-trust-score.js (메인 서비스, ~500줄)
  [ ] 4개 컴포넌트 모듈 (scorers/)
  [ ] POST /api/score 엔드포인트
  [ ] POST /api/score-batch 엔드포인트
  [ ] trust_scores.jsonl 영속 저장
  [ ] 기본 에러 핸들링

P1 (중요):
  [ ] Phase 2A 통합 (fetchFromPhase2A)
  [ ] Phase 2B 통합 (enrichWithDuplicateInfo)
  [ ] POST /api/pipeline 엔드포인트
  [ ] LRU 캐시 (L1, L2)
  [ ] quarantine_log.jsonl
  [ ] Cron 스크립트 (phase2c-cron.sh)

P2 (부가):
  [ ] GET /api/quarantine 엔드포인트
  [ ] 격리 승인/거부 API
  [ ] Score histogram 모니터링
  [ ] Circuit breaker
  [ ] 감사 로그 (trust_score_audit.log)
```

### 13.2 파일 구조

```
memory-automation/
├── phase2c-trust-score.js          # 메인 서비스
├── scorers/
│   ├── source-credibility.js       # Component C1
│   ├── context-depth.js            # Component C2
│   ├── verification-status.js      # Component C3
│   └── recency-freshness.js        # Component C4
├── utils/
│   ├── lru-cache.js                # LRU 캐시
│   ├── url-verifier.js             # URL HEAD 검증
│   ├── input-normalizer.js         # Phase 2A 출력 정규화
│   └── circuit-breaker.js          # 회로 차단기
├── phase2c-cron.sh                 # 5분 주기 cron
├── test-phase2c.js                 # 100+ 테스트
├── trust_scores.jsonl              # (auto-created)
├── quarantine_log.jsonl            # (auto-created)
├── reject_log.jsonl                # (auto-created)
└── README_PHASE2C.md
```

---

**설계 상태:** 🟢 완료  
**구현 ETA:** 2026-05-31  
**다음 단계:** 평가자 검토 → 웹개발자#1 구현 핸드오프  
**의존성:** Phase 2A ✅ | Phase 2B ✅ | Phase 2C Design ✅  

---

*작성: Memory System Specialist | 2026-05-27*
