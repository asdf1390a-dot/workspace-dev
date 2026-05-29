# Phase 2C: Trust Score Calculator — 완전 설계 문서

**버전:** 1.0  
**작성일:** 2026-05-29 KST  
**담당:** Memory System Specialist (Phase C #13)  
**상태:** 🟢 설계 완료 — 구현 대기  
**의존성:** Phase 2A ✅ 완료 | Phase 2B ✅ 완료  
**마감:** 2026-05-30 18:00 KST  
**다음 단계:** 평가자(Evaluator) 검토 → 웹개발자 구현 (Phase 2D)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처 설계](#2-아키텍처-설계)
3. [4-컴포넌트 공식 상세 명세](#3-4-컴포넌트-공식-상세-명세)
4. [가중치 설계 근거](#4-가중치-설계-근거)
5. [점수 범위 및 경계 조건](#5-점수-범위-및-경계-조건)
6. [알고리즘 의사코드](#6-알고리즘-의사코드)
7. [DB 스키마 설계](#7-db-스키마-설계)
8. [실시간 점수 산출 최적화](#8-실시간-점수-산출-최적화)
9. [API 엔드포인트 명세](#9-api-엔드포인트-명세)
10. [Phase 2A/2B 통합 설계](#10-phase-2a2b-통합-설계)
11. [모니터링 및 감사 추적](#11-모니터링-및-감사-추적)
12. [배포 및 확장 전략](#12-배포-및-확장-전략)

---

## 1. 시스템 개요

### 1.1 목적과 역할

Trust Score Calculator(Phase 2C)는 메모리 자동화 파이프라인의 세 번째 서브시스템입니다.

**입력:** Phase 2A(메시지 수집) + Phase 2B(중복 감지) 결과  
**처리:** 4개 가중 컴포넌트로 신뢰도 0-100점 산출  
**출력:** 자동 승인(≥60) / 격리(40-59) / 거부(<40) 분류

```
Phase 2A             Phase 2B
(수집 메시지)   +   (중복 감지 결과)
       │                   │
       └─────────┬─────────┘
                 ↓
      [Phase 2C: Trust Score Calculator]
                 ↓
      ┌──────────┬──────────┐
      ↓          ↓          ↓
   ACCEPT    QUARANTINE   REJECT
  (≥60점)   (40-59점)   (<40점)
      ↓          ↓          ↓
 memory/      격리 큐     거부 로그
 자동 저장   수동 검토
```

### 1.2 공식 요약

```
Trust Score (0-100) =
    SC × 0.40    (Source Credibility — 출처 신뢰도)
  + CD × 0.25    (Context Depth — 내용 풍부도)
  + VS × 0.20    (Verification Status — 검증 상태)
  + RF × 0.15    (Recency Freshness — 최신성)
```

**4개 컴포넌트 역할:**
- **SC (Relevance)** — 메시지 출처 채널과 발신자 역할에 따른 관련성/신뢰도
- **CD (Quality)** — 메시지 내용 자체의 정보 밀도와 완전성
- **VS (Consistency)** — 정보가 외부 증거나 다중 소스로 뒷받침되는 일관성
- **RF (Recency)** — 정보의 나이와 시간 감쇠 신선도

### 1.3 성능 목표

| 지표 | 목표값 | 비고 |
|------|--------|------|
| 단일 항목 채점 | < 50ms | CPU-only, LLM 제외 |
| 배치 처리 100건 | < 5s | 병렬 처리 적용 |
| 배치 처리 1000건 | < 30s | 스트리밍 응답 |
| 캐시 히트율 | > 70% | 소스 점수 재사용 |
| 가용성 | 99.5% | Cron 주기 완료 기준 |

### 1.4 기술 스택

- **언어:** JavaScript (Node.js v18+)
- **서버:** Express.js 4.18+
- **영속성:** JSONL 파일 (trust_scores.jsonl, quarantine_log.jsonl)
- **포트:** 3011 (Phase 2A=3009, Phase 2B=3010에 이어)
- **테스트:** Jest 29+

---

## 2. 아키텍처 설계

### 2.1 서비스 구성도

```
┌──────────────────────────────────────────────────────────────┐
│                     외부 데이터 소스                          │
│  [Phase 2A: PORT 3009]      [Phase 2B: PORT 3010]            │
│    메시지 수집 API              중복 감지 API                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP 또는 직접 파일 읽기
                   ↓
┌──────────────────────────────────────────────────────────────┐
│              Phase 2C: Trust Score Calculator                 │
│                        PORT 3011                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Request Middleware                                   │   │
│  │  - Bearer 토큰 인증                                   │   │
│  │  - Rate limiting (100 req/min)                        │   │
│  │  - Input sanitization & validation                    │   │
│  └─────────────────────────┬────────────────────────────┘   │
│                             │                                 │
│  ┌──────────────────────────▼──────────────────────────┐    │
│  │              Scoring Engine                           │    │
│  │                                                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │    │
│  │  │C1: Source│ │C2:Context│ │C3: Verif │ │C4:Rec  │  │    │
│  │  │Credib.   │ │Depth     │ │Status    │ │Freshness│  │    │
│  │  │(40%)     │ │(25%)     │ │(20%)     │ │(15%)   │  │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘  │    │
│  │       └────────────┴─────────────┴───────────┘        │    │
│  │                           │                            │    │
│  │  ┌────────────────────────▼────────────────────────┐  │    │
│  │  │         Score Aggregator (가중합 계산)           │  │    │
│  │  │  score = 0.40*C1 + 0.25*C2 + 0.20*C3 + 0.15*C4 │  │    │
│  │  └────────────────────────┬────────────────────────┘  │    │
│  └──────────────────────────┬┘                            │    │
│                              │                             │    │
│  ┌───────────────────────────▼───────────────────────┐   │    │
│  │  Decision Router                                   │   │    │
│  │  score ≥ 60 → ACCEPT   40 ≤ score < 60 → QUARANTINE│   │    │
│  │  score < 40 → REJECT                               │   │    │
│  └─────────────────────────┬─────────────────────────┘   │    │
│                             │                              │    │
│  ┌────────────┬─────────────▼────────┬───────────────┐   │    │
│  │  LRU Cache │  Persistence Layer   │  Alert Layer  │   │    │
│  │  (5min TTL)│  (JSONL 파일들)      │  (격리 알림)  │   │    │
│  └────────────┴──────────────────────┴───────────────┘   │    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
1. 입력 수신
   └─ POST /api/score  또는  POST /api/score-batch
   └─ NormalizedMessage 형식으로 파싱

2. 캐시 확인
   └─ L1: 소스 점수 캐시 (동일 채널/작성자 재사용)
   └─ L2: URL 유효성 캐시 (HEAD 요청 재사용)

3. 병렬 컴포넌트 채점 (Promise.all)
   ├─ C1: scoreSourceCredibility(msg)
   ├─ C2: scoreContextDepth(msg)
   ├─ C3: scoreVerificationStatus(msg)
   └─ C4: scoreRecencyFreshness(msg)

4. 가중합 집계
   └─ score = ROUND(0.40*c1 + 0.25*c2 + 0.20*c3 + 0.15*c4)

5. 결정 분류 및 라우팅
   ├─ ACCEPT → memory/ 파일 생성 + MEMORY.md 등록
   ├─ QUARANTINE → quarantine_log.jsonl 저장 + 알림
   └─ REJECT → reject_log.jsonl 저장

6. 점수 이력 저장
   └─ trust_scores.jsonl 추가 기록
```

---

## 3. 4-컴포넌트 공식 상세 명세

### 3.1 C1: Source Credibility (출처 신뢰도, 40%)

**목적:** 메시지 발신 채널과 발신자 역할에 따른 신뢰도. 모든 정보는 출처가 중요하며, DSC 조직 구조를 반영해야 합니다.

#### 채널별 기본 점수

**Telegram:**

| 발신자 유형 | 기본 점수 | 근거 |
|-------------|-----------|------|
| CEO 직접 메시지 (나경태) | 90 | 최고 의사결정권자 직접 발신 |
| CEO 언급 채널 메시지 | 85 | CEO 관여 = 공식성 확보 |
| 팀 스레드 (답변 3개+) | 80 | 다수 검증으로 신뢰도 향상 |
| 팀 스레드 (답변 1-2개) | 75 | 일부 검증 |
| 일반 채널 메시지 | 70 | 공지 수준 |
| 봇/시스템 자동 메시지 | 55 | 자동화, 인간 확인 필요 |
| 출처 불명 | 40 | 기본 최솟값 |

**Discord:**

| 채널 | 기본 점수 | 근거 |
|------|-----------|------|
| #공지 (Announcements) | 90 | 공식 발표 채널 |
| #회의 (Meetings) | 85 | 공식 의사결정 채널 |
| #기술 (Technical) | 75 | 기술 정보 채널 |
| #일반 (General) | 65 | 일상 대화 |
| DM (1-on-1) | 60 | 비공개, 검증 필요 |
| 알 수 없는 채널 | 50 | 기본값 |

#### 조정값 (Adjustments)

```javascript
const C1_ADJUSTMENTS = {
  hasWorkingUrl:        +10,  // 동작하는 링크 포함
  hasDecisionKeyword:   +10,  // 결정/확정/승인/완료/DONE 포함
  hasCodeBlock:          +5,  // 코드 블록 포함 (기술 근거)
  verifiedByMultiple:   +10,  // 2명 이상이 확인/언급
  isCEODirectMessage:   +10,  // CEO 본인 발신 (기본값 추가)
  lowTextClarity:       -10,  // 내용 모호 (30자 미만)
  oldMessage30d:         -5,  // 30일 이상 경과
  isDuplicate:          -15,  // Phase 2B 중복 감지됨
  isContradicted:       -20,  // 다른 메시지와 모순
};

// 최종 C1: CLAMP(base + sum(adjustments), 0, 100)
```

#### C1 엣지 케이스

| 상황 | 처리 방법 |
|------|-----------|
| source가 null/undefined | 기본값 40점 반환 |
| source가 'telegram'/'discord' 외 값 | 기본값 40점 반환 |
| CEO와 봇이 동시 표시 | CEO 기준 우선 적용 |
| 두 채널 동시 발송 | 높은 채널 점수 적용 |
| 조정값 합 > 100 초과 | CLAMP(score, 0, 100) |

---

### 3.2 C2: Context Depth (내용 풍부도, 25%)

**목적:** 메시지 내용 자체의 정보 밀도와 완전성. DSC FMS 도메인 특화 신호를 우선 반영합니다.

#### 점수 항목표 (합산 방식, 최대 100점)

| 신호 | 점수 | 감지 기준 |
|------|------|-----------|
| 충분한 본문 텍스트 | +15 | 길이 30자 초과 |
| 액션 키워드 포함 | +20 | 할일/완료/진행중/TODO/DONE/마감/담당자 |
| URL 2개 이상 | +15 | count_urls ≥ 2 |
| URL 1개 | +8 | count_urls == 1 |
| 날짜/시간 참조 | +15 | YYYY-MM-DD, 오늘/내일/다음주, ISO 날짜 |
| 팀원 언급 | +10 | @mention 또는 팀원 이름 (최대 2명 가산) |
| 코드 블록 또는 SQL | +15 | ``` ``` 또는 기술 용어 (API, POST, SELECT) |
| 이전 결정 참조 | +10 | "이전에", "기존에", commit hash, 링크 |
| 스레드 토론 | +5 | replyCount ≥ 3 |
| **상한** | **100** | 합산 초과 시 100으로 제한 |

#### DSC FMS 기술 용어 감지 패턴

```javascript
const TECH_PATTERNS = [
  /API|endpoint|POST|GET|PUT|DELETE|PATCH/i,
  /DB|database|schema|table|column|migration/i,
  /JWT|RLS|auth|token|session/i,
  /Supabase|Vercel|Next\.js|React|TypeScript/i,
  /commit|deploy|build|CI\/CD|pipeline/i,
  /Phase|Sprint|iteration|milestone/i,
  /Asset Master|Backup|Travel|Discord Bot|Team Dashboard/i,
  /할일|완료|진행중|대기|TODO|DONE|WIP/i,
];
```

#### C2 엣지 케이스

| 상황 | 처리 방법 |
|------|-----------|
| text가 빈 문자열 | 0점 반환 |
| text가 이모지만 (길이 < 30) | 0점 (텍스트 신호 미충족) |
| text 2000자 초과 | 정상 계산 (길이 제한은 MEMORY 등록 단계) |
| URL이 모두 broken | URL 카운트 정상 반영 (C3에서 broken URL 처리) |
| 한국어/영어 혼합 | 양쪽 패턴 모두 적용 |
| 팀원 언급 3명+ | 2명까지만 가산 (중복 멘션 방지) |

---

### 3.3 C3: Verification Status (검증 일관성, 20%)

**목적:** 메시지 내용이 외부 증거나 다중 소스로 뒷받침되는 수준. 정보의 일관성과 검증 가능성을 평가합니다.

#### 검증 레벨 정의

```
VERIFIED (100점) — 신호 3개 이상 충족
  ✅ 동작하는 링크 포함 및 확인 가능
  ✅ 완료 마커 존재 (✅, 완료, DONE, 확정, 승인)
  ✅ CEO/권한자 명시적 승인
  ✅ 명시적 날짜 + 담당자 포함
  ✅ 2개 이상 독립 소스에서 언급

PARTIALLY_VERIFIED (50점) — 신호 1-2개
  🟡 링크 제공됨 (확인 미완료)
  🟡 1개 소스에서만 언급
  🟡 부분적 증거
  🟡 진행 중 상태 (in-progress)

UNVERIFIED (0점) — 신호 0개
  ❌ 증거 없음
  ❌ 링크 없음
  ❌ 신규 주장 (검증 전)
  ❌ 소문/추측성 정보
```

#### 신호 감지 로직

```javascript
const COMPLETION_MARKERS = ['✅', '완료', 'DONE', '확정', '승인', 'COMPLETE', '완성'];
const APPROVAL_TERMS = ['CEO 확인', 'CEO 승인', 'approved by', '나경태 확인'];

function detectVerificationSignals(msg) {
  const signals = [];

  // 신호 1: URL 존재
  if (msg.urlList.length > 0) signals.push('has_url');

  // 신호 2: 완료 마커
  if (COMPLETION_MARKERS.some(m => msg.text.includes(m)))
    signals.push('has_completion_marker');

  // 신호 3: 권한자 승인
  if (APPROVAL_TERMS.some(t => msg.text.toLowerCase().includes(t.toLowerCase())))
    signals.push('has_authority_approval');

  // 신호 4: 명시적 날짜 + 담당자 동시 포함
  if (hasExplicitDate(msg.text) && hasTeamMemberMention(msg.text))
    signals.push('has_date_and_owner');

  // 신호 5: 기존 메모리 파일과 일치 (Phase 2B 정보 활용)
  if (msg.matchesExistingMemory) signals.push('matches_memory');

  const count = signals.length;
  if (count >= 3) return 100;      // VERIFIED
  if (count >= 1) return 50;       // PARTIALLY_VERIFIED
  return 0;                         // UNVERIFIED
}
```

#### C3 엣지 케이스

| 상황 | 처리 방법 |
|------|-----------|
| URL이 있지만 404 반환 | has_url 신호 제외 (async HEAD check, 2s timeout) |
| URL 확인 타임아웃 | fail-open: has_url 신호 포함 처리 |
| 복수 완료 마커 | 단일 신호로 카운트 (중복 방지) |
| 메모리 매칭 API 실패 | 해당 신호 0으로 계산 (fail-safe) |
| 승인 패턴 변형 | lowercase 후 includes 처리 |

---

### 3.4 C4: Recency Freshness (최신성, 15%)

**목적:** 메시지 나이에 따른 시간 감쇠. 최신 정보일수록 신뢰도가 높습니다.

#### 시간 구간 점수표

| 나이 (일) | 점수 | 의미 |
|-----------|------|------|
| 0 (오늘) | 100 | 신규 |
| 1일 이내 | 98 | 거의 신규 |
| 1-3일 | 90 | 매우 신선 |
| 4-7일 | 80 | 신선 |
| 8-14일 | 70 | 보통 |
| 15-30일 | 50 | 약간 오래됨 |
| 31-60일 | 30 | 오래됨 |
| 61-90일 | 15 | 매우 오래됨 |
| 90일 초과 | 5 | 아카이브 수준 |

#### JavaScript 구현

```javascript
function scoreRecencyFreshness(timestamp) {
  if (!timestamp) return 50; // null 처리: 중간값 반환

  const ageDays = (Date.now() - new Date(timestamp).getTime())
                  / (1000 * 60 * 60 * 24);

  if (ageDays < 0) return 100;   // 미래 타임스탬프 → 신규 처리
  if (ageDays < 1) return 100;
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

#### 최신성 조정 규칙

```
규칙 RF-1: 최근 24시간 내 업데이트 → +10점 (최신성 리셋)
규칙 RF-2: 반복 언급 3회+ → +5점 (관련성 증가)
규칙 RF-3: 30일+ 미업데이트 → display_label = "구식 정보 — 최신 확인 필요"
```

#### C4 엣지 케이스

| 상황 | 처리 방법 |
|------|-----------|
| timestamp가 null | 50점 반환 (중간값, 오류 전파 방지) |
| timestamp가 미래 | ageDays = 0 처리 (100점) |
| ISO 형식 불일치 | try-parse 실패 시 50점 |
| DST 경계 시간 | UTC 기준으로 통일 계산 |
| 음수 경과일 | 0으로 clamp 후 100점 |

---

## 4. 가중치 설계 근거

### 4.1 가중치 결정 원칙

```
C1 (Source Credibility) = 40%   ← 가장 높음
C2 (Context Depth)      = 25%
C3 (Verification Status) = 20%
C4 (Recency Freshness)  = 15%   ← 가장 낮음

합계: 100%
```

### 4.2 각 컴포넌트 가중치 근거

**C1 (40%) — "출처가 내용보다 중요"**

DSC Mannur 공장 운영 환경에서 정보 출처는 신뢰도의 핵심 결정 요소입니다. CEO 직접 지시와 Discord #일반 채널 잡담은 동일하게 처리해서는 안 됩니다. 채널/발신자 역할이 가장 강력한 신뢰 신호입니다.

**C2 (25%) — "풍부한 내용은 검증된 정보의 특징"**

진짜 중요한 결정이나 업무 정보는 날짜, 담당자, 링크, 실행 항목을 포함합니다. 단순 잡담과 구조화된 업무 정보를 구별하는 핵심 지표입니다.

**C3 (20%) — "증거가 있어야 사실"**

링크, 완료 마커, 권한자 승인이 있는 정보는 더 신뢰할 수 있습니다. 하지만 모든 정보에 검증을 요구하면 가치 있는 실시간 정보가 거부됩니다. 중간 가중치가 적절합니다.

**C4 (15%) — "최신성은 보조 신호"**

오래된 정보도 여전히 유효할 수 있습니다(예: 연간 규칙, 정책). 최신성은 단독으로 신뢰도를 결정하지 않으므로 가장 낮은 가중치를 부여합니다.

### 4.3 가중치 유효성 검증

```
가중치 합 = 0.40 + 0.25 + 0.20 + 0.15 = 1.00 ✅

극단값 검증:
  모두 100점: 0.40×100 + 0.25×100 + 0.20×100 + 0.15×100 = 100 ✅
  모두 0점: 0.40×0 + 0.25×0 + 0.20×0 + 0.15×0 = 0 ✅
  최대 공식 범위: [0, 100] ✅
```

### 4.4 동적 가중치 조정 (월간)

월간 단위로 실제 성능 데이터를 기반으로 가중치를 미세 조정할 수 있습니다:

```javascript
// 월간 가중치 조정 프로세스
const DEFAULT_WEIGHTS = { sc: 0.40, cd: 0.25, vs: 0.20, rf: 0.15 };

async function adjustWeights(performanceMetrics) {
  // 지난 달 자동 승인 항목 중 실제 유용했던 비율
  const acceptAccuracy = performanceMetrics.userApprovalRate;

  // 격리 항목 중 수동 승인된 비율 (false positive)
  const quarantineFalsePositiveRate = performanceMetrics.quarantineApprovalRate;

  // 조정 로직 (최대 ±5% 변동 제한)
  const delta = calculateWeightDelta(acceptAccuracy, quarantineFalsePositiveRate);

  // 조정 결과 저장 (weight_history.jsonl)
  await saveWeightAdjustment(delta, performanceMetrics);
}
```

---

## 5. 점수 범위 및 경계 조건

### 5.1 점수 범위 및 처리

```
점수 범위   상태         처리                    색상
0-19      매우 낮음    자동 거부               🔴
20-39     낮음         자동 거부               🔴
40-59     중간         격리 (수동 검토 대기)   🟡
60-79     높음         자동 승인               🟢
80-100    매우 높음    자동 승인 (우선 처리)   🟢
```

### 5.2 임계값 결정 근거

**60점 자동 승인 기준:**
- 신뢰도 60점 = C1(40%) + C2(25%) + C3(20%) + C4(15%) 기준으로 "보통 이상 채널에서 어느 정도 내용이 있는 최신 메시지"에 해당
- 너무 높으면(예: 70) 유용한 정보가 과도하게 격리됨
- 너무 낮으면(예: 50) 노이즈가 메모리에 축적됨

**40점 격리 기준:**
- 40점 미만은 "출처 불명 + 내용 없음 + 미검증 + 오래됨"의 조합
- 이런 메시지는 메모리에 등록 가치가 없음

### 5.3 경계 조건 처리

```javascript
function classifyScore(rawScore) {
  // 소수점 반올림
  const score = Math.round(rawScore);

  // 범위 강제 clamp (비정상 입력 방어)
  const bounded = Math.max(0, Math.min(100, score));

  // 임계값 경계 처리 (정확히 60은 ACCEPT)
  if (bounded >= 60) return { decision: 'ACCEPT', score: bounded };
  if (bounded >= 40) return { decision: 'QUARANTINE', score: bounded };
  return { decision: 'REJECT', score: bounded };
}

// 특수 케이스: NaN 입력
function safeTrustScore(sc, cd, vs, rf) {
  const safeNum = (n) => (isNaN(n) || n == null) ? 0 : n;
  return 0.40 * safeNum(sc)
       + 0.25 * safeNum(cd)
       + 0.20 * safeNum(vs)
       + 0.15 * safeNum(rf);
}
```

---

## 6. 알고리즘 의사코드

### 6.1 메인 채점 알고리즘

```
FUNCTION calculateTrustScore(message: NormalizedMessage) → TrustScoreResult:

  INPUT:
    message.source        : 'telegram' | 'discord'
    message.channel       : string
    message.author        : string
    message.text          : string
    message.timestamp     : ISO8601 string
    message.urlList       : string[]
    message.replyCount    : number
    message.hasCodeBlock  : boolean
    message.isDuplicate   : boolean   (Phase 2B 결과)
    message.mentionedUsers: string[]

  // Step 1: 캐시 확인
  cacheKey = hash(source + channel + author)
  IF sourceScoreCache.has(cacheKey):
    c1_base = sourceScoreCache.get(cacheKey)
  ELSE:
    c1_base = lookupChannelBaseScore(source, channel, author)
    sourceScoreCache.set(cacheKey, c1_base, TTL=60min)

  // Step 2: 병렬 컴포넌트 계산
  [c1, c2, c3, c4] = await Promise.all([
    scoreC1_SourceCredibility(message, c1_base),  // O(1)
    scoreC2_ContextDepth(message),                // O(n), n = text length
    scoreC3_VerificationStatus(message),          // O(m), m = url count
    scoreC4_RecencyFreshness(message.timestamp),  // O(1)
  ])

  // Step 3: 가중합 집계
  rawScore = 0.40 * c1.score
           + 0.25 * c2.score
           + 0.20 * c3.score
           + 0.15 * c4.score

  // Step 4: 정규화
  trustScore = CLAMP(ROUND(rawScore), 0, 100)

  // Step 5: 결정 분류
  decision = CLASSIFY(trustScore)

  // Step 6: 결과 반환
  RETURN {
    scoreId: generateId(),
    messageId: message.messageId,
    trustScore: trustScore,
    decision: decision,
    components: { c1, c2, c3, c4 },
    processedAt: NOW_ISO()
  }

TIME COMPLEXITY: O(n + m)  where n=text length, m=url count
SPACE COMPLEXITY: O(1)
P50 latency: ~20ms | P99 latency: ~80ms
```

### 6.2 배치 처리 알고리즘

```
FUNCTION processBatch(messages[], options) → BatchResult[]:

  INPUT:
    messages[]: NormalizedMessage[]  (최대 1000건)
    options.concurrency: number = 10

  // 입력 검증
  IF messages.length > 1000:
    THROW BatchSizeExceedError("최대 1000건 제한")

  // 청크 분할 (메모리 효율 + 진행률 추적)
  chunks = CHUNK(messages, chunkSize=50)
  results = []
  processed = 0

  FOR chunk OF chunks:
    // 청크 내 병렬 처리
    chunkResults = await Promise.all(
      chunk.map(msg => calculateTrustScore(msg))
    )
    results.push(...chunkResults)
    processed += chunk.length

    // 진행률 이벤트 발행
    emit('progress', { processed, total: messages.length })

    // 배압 제어 (10ms 간격)
    IF chunks.remaining > 0:
      await sleep(10)

  RETURN {
    results,
    summary: {
      total: results.length,
      accepted: results.filter(r => r.decision === 'ACCEPT').length,
      quarantined: results.filter(r => r.decision === 'QUARANTINE').length,
      rejected: results.filter(r => r.decision === 'REJECT').length,
      avgScore: AVERAGE(results.map(r => r.trustScore))
    }
  }

THROUGHPUT: ~100 messages/second
BATCH_TIME(100): < 2s | BATCH_TIME(1000): < 15s
```

### 6.3 격리 검토 알고리즘

```
FUNCTION processQuarantineReview(quarantineId, action, reviewer):

  INPUT:
    quarantineId: string
    action: 'APPROVE' | 'REJECT'
    reviewer: string

  // 격리 항목 조회
  entry = quarantineLog.findById(quarantineId)
  IF NOT entry: THROW NotFoundError

  IF action === 'APPROVE':
    // 메모리 파일 생성 및 MEMORY.md 등록
    filePath = createMemoryFile(entry.message, entry.trustScore)
    updateMEMORYmd(filePath, entry)
    quarantineLog.update(quarantineId, { status: 'APPROVED', reviewedBy: reviewer })
    RETURN { success: true, memoryFile: filePath }

  ELSE (REJECT):
    // 거부 로그 이동
    rejectLog.append({ ...entry, rejectedBy: reviewer, rejectedAt: NOW() })
    quarantineLog.update(quarantineId, { status: 'REJECTED', reviewedBy: reviewer })
    RETURN { success: true }
```

---

## 7. DB 스키마 설계

### 7.1 JSONL 파일 구조

Phase 2C는 Supabase/PostgreSQL 대신 파일 기반 JSONL을 사용합니다 (Phase 2A/2B 일관성 유지, 외부 DB 의존성 제거).

#### 파일 목록

| 파일 | 용도 | 위치 |
|------|------|------|
| `trust_scores.jsonl` | 모든 채점 이력 | memory-automation/ |
| `quarantine_log.jsonl` | 격리된 항목 (수동 검토 대기) | memory-automation/ |
| `reject_log.jsonl` | 거부된 항목 | memory-automation/ |
| `weight_history.jsonl` | 가중치 조정 이력 | memory-automation/ |

### 7.2 trust_scores.jsonl 레코드 스키마

```json
{
  "schemaVersion": "2C-1.0",
  "scoreId": "ts_20260529_abc123def456",
  "messageId": "tg_12345_67890",
  "source": "telegram",
  "channel": "general",
  "author": "nakyeongtae",
  "textSnippet": "Asset Master Phase A 결정됨... (최초 100자)",
  "trustScore": 87,
  "decision": "ACCEPT",
  "components": {
    "sourceCredibility": {
      "score": 90,
      "baseScore": 90,
      "adjustments": [
        { "reason": "has_url", "delta": +10 },
        { "reason": "isDuplicate", "delta": 0 }
      ],
      "signals": ["CEO_direct", "has_url"]
    },
    "contextDepth": {
      "score": 85,
      "breakdown": {
        "hasText": 15,
        "hasActionKeyword": 20,
        "hasUrl": 8,
        "hasDate": 15,
        "hasMention": 10,
        "hasCode": 0,
        "hasPrevRef": 10
      },
      "signals": ["action_keyword", "date_ref", "team_mention"]
    },
    "verificationStatus": {
      "score": 100,
      "level": "VERIFIED",
      "signalCount": 3,
      "signals": ["has_url", "has_completion_marker", "has_authority_approval"]
    },
    "recencyFreshness": {
      "score": 98,
      "ageDays": 1,
      "signals": ["age_1_day"]
    }
  },
  "processingTimeMs": 45,
  "processedAt": "2026-05-29T14:30:00.000Z",
  "phase2bClusterId": null,
  "memoryFileCreated": "project_asset_master_phase_a.md",
  "batchId": null
}
```

### 7.3 quarantine_log.jsonl 레코드 스키마

```json
{
  "schemaVersion": "2C-1.0",
  "quarantineId": "qr_20260529_def456",
  "messageId": "tg_11111_22222",
  "trustScore": 52,
  "decision": "QUARANTINE",
  "reason": "score 40-59: 일부 검증 필요",
  "components": { "...(위와 동일 구조)..." },
  "reviewStatus": "PENDING",
  "reviewedAt": null,
  "reviewedBy": null,
  "quarantinedAt": "2026-05-29T14:35:00.000Z",
  "expiresAt": "2026-06-05T14:35:00.000Z"
}
```

### 7.4 메모리 파일 메타데이터 (YAML frontmatter)

신뢰도 60점+ 자동 승인 시 memory/ 파일 생성, frontmatter 포함:

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
trust_decision: ACCEPT
source: telegram
source_channel: general
source_message_id: tg_12345_67890
auto_collected: true
processed_at: "2026-05-29T14:30:00Z"
phase2c_schema: "2C-1.0"
---
```

### 7.5 Supabase 테이블 (선택적 확장)

향후 Phase 2D에서 Supabase 연동 시 사용할 스키마:

```sql
-- 신뢰도 점수 테이블
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('telegram', 'discord', 'manual')),
  channel TEXT,
  author TEXT,
  text_snippet TEXT,
  trust_score SMALLINT NOT NULL CHECK (trust_score BETWEEN 0 AND 100),
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT', 'QUARANTINE', 'REJECT')),
  sc_score SMALLINT,
  cd_score SMALLINT,
  vs_score SMALLINT,
  rf_score SMALLINT,
  processing_time_ms INTEGER,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  memory_file TEXT,
  batch_id TEXT,
  schema_version TEXT DEFAULT '2C-1.0'
);

-- 격리 로그 테이블
CREATE TABLE quarantine_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  trust_score SMALLINT NOT NULL,
  reason TEXT,
  review_status TEXT DEFAULT 'PENDING'
    CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 점수 이력 인덱스 (빠른 조회)
CREATE INDEX idx_trust_scores_processed_at ON trust_scores(processed_at DESC);
CREATE INDEX idx_trust_scores_decision ON trust_scores(decision, processed_at DESC);
CREATE INDEX idx_quarantine_review_status ON quarantine_log(review_status)
  WHERE review_status = 'PENDING';

-- RLS 정책
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarantine_log ENABLE ROW LEVEL SECURITY;
```

---

## 8. 실시간 점수 산출 최적화

### 8.1 3계층 캐시 전략

```
L1: 소스 점수 캐시 (인메모리 LRU)
  - Key: `${source}:${channel}:${author}`
  - TTL: 60분
  - 최대 크기: 500 엔트리
  - 목적: 같은 채널/발신자 재요청 시 즉시 반환

L2: URL 유효성 캐시 (인메모리)
  - Key: URL 문자열
  - TTL: 5분
  - 최대 크기: 1000 엔트리
  - 목적: HEAD 요청 중복 방지

L3: 메모리 매칭 캐시 (파일 기반)
  - Key: content hash (MD5 16자리)
  - TTL: 30분
  - 파일: cache/memory_match_cache.json
  - 목적: MEMORY.md 매칭 결과 재사용
```

### 8.2 LRU 캐시 구현

```javascript
class LRUCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const entry = this.cache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // LRU: 최근 접근 항목을 끝으로 이동
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

const sourceScoreCache = new LRUCache(500, 60 * 60 * 1000); // 60분 TTL
const urlValidityCache = new LRUCache(1000, 5 * 60 * 1000);  // 5분 TTL
```

### 8.3 성능 벤치마크 목표

| 시나리오 | 목표 P50 | 목표 P99 |
|----------|----------|----------|
| 단일 채점 (캐시 히트) | < 5ms | < 20ms |
| 단일 채점 (캐시 미스) | < 30ms | < 80ms |
| 단일 채점 (URL 확인 포함) | < 50ms | < 2s |
| 배치 100건 | < 2s | < 5s |
| 배치 1000건 | < 15s | < 30s |

### 8.4 메모리 최적화

```javascript
// 텍스트 분석 시 전체 텍스트 대신 필요한 부분만 처리
function analyzeText(text, maxLength = 2000) {
  const truncated = text.slice(0, maxLength); // 메모리 절약

  return {
    length: text.length,           // 원본 길이 보존
    hasEnoughText: text.length > 30,
    // 패턴 매칭은 truncated 텍스트에만 수행
    hasActionKeyword: ACTION_PATTERNS.some(p => p.test(truncated)),
    hasDate: DATE_PATTERNS.some(p => p.test(truncated)),
    hasTechJargon: TECH_PATTERNS.some(p => p.test(truncated)),
    urlCount: countUrls(truncated),
    mentionCount: countMentions(truncated),
  };
}
```

---

## 9. API 엔드포인트 명세

### 9.1 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /health | 서비스 상태 확인 | 불필요 |
| GET | /api/status | 서비스 통계 | Bearer |
| POST | /api/score | 단일 메시지 채점 | Bearer |
| POST | /api/score-batch | 배치 채점 (최대 1000건) | Bearer |
| POST | /api/pipeline | Phase 2A→2B→2C 전체 실행 | Bearer |
| GET | /api/quarantine | 격리 대기 목록 | Bearer |
| POST | /api/quarantine/:id/approve | 격리 항목 수동 승인 | Bearer |
| POST | /api/quarantine/:id/reject | 격리 항목 거부 | Bearer |
| GET | /api/scores | 최근 채점 이력 (최대 100건) | Bearer |

### 9.2 POST /api/score — 단일 채점

```
요청:
POST /api/score
Authorization: Bearer <GATEWAY_TOKEN>
Content-Type: application/json

{
  "messageId": "tg_12345",
  "source": "telegram",
  "channel": "general",
  "author": "nakyeongtae",
  "text": "Asset Master Phase A 결정: 506개 자산 관리 시스템 확정됨 ✅",
  "timestamp": "2026-05-29T14:30:00Z",
  "hasUrl": false,
  "urlList": [],
  "replyCount": 2,
  "hasCodeBlock": false,
  "mentionedUsers": [],
  "isDuplicate": false
}

응답 200:
{
  "success": true,
  "scoreId": "ts_20260529_abc123",
  "messageId": "tg_12345",
  "trustScore": 87,
  "decision": "ACCEPT",
  "components": {
    "sourceCredibility": { "score": 90, "signals": ["CEO_direct"] },
    "contextDepth": { "score": 80, "signals": ["has_text", "action_keyword", "completion_marker"] },
    "verificationStatus": { "score": 100, "signals": ["has_completion_marker"] },
    "recencyFreshness": { "score": 100, "signals": ["age_0_days"] }
  },
  "processingTimeMs": 32,
  "processedAt": "2026-05-29T14:30:00.500Z"
}

응답 400 (잘못된 입력):
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "source must be 'telegram' or 'discord'"
}
```

### 9.3 POST /api/score-batch — 배치 채점

```
요청:
POST /api/score-batch
Authorization: Bearer <GATEWAY_TOKEN>
Content-Type: application/json

{
  "messages": [ {...}, {...}, ... ],  // 최대 1000건
  "options": {
    "concurrency": 10,
    "includeRejected": false
  }
}

응답 200:
{
  "success": true,
  "batchId": "batch_20260529_xyz789",
  "summary": {
    "total": 150,
    "accepted": 89,
    "quarantined": 43,
    "rejected": 18,
    "avgScore": 61.3
  },
  "results": [
    { "scoreId": "...", "messageId": "...", "trustScore": 87, "decision": "ACCEPT", ... },
    ...
  ],
  "processingTimeMs": 1240
}
```

### 9.4 GET /api/quarantine — 격리 목록

```
요청:
GET /api/quarantine?status=PENDING&limit=20&offset=0
Authorization: Bearer <GATEWAY_TOKEN>

응답 200:
{
  "success": true,
  "total": 43,
  "items": [
    {
      "quarantineId": "qr_20260529_def456",
      "messageId": "tg_11111",
      "textSnippet": "내일 회의 일정...",
      "trustScore": 52,
      "quarantinedAt": "2026-05-29T14:35:00Z",
      "expiresAt": "2026-06-05T14:35:00Z",
      "reviewStatus": "PENDING"
    }
  ]
}
```

---

## 10. Phase 2A/2B 통합 설계

### 10.1 데이터 정규화

Phase 2A 출력과 Phase 2B 중복 정보를 Phase 2C 입력 형식으로 변환:

```javascript
function normalizeFromPhase2A(raw2A) {
  return {
    messageId: raw2A.id || `${raw2A.platform}_${raw2A.timestamp}`,
    source: raw2A.platform,              // 'telegram' | 'discord'
    channel: raw2A.channel_name,
    author: raw2A.sender_username,
    text: raw2A.text || raw2A.content,
    timestamp: raw2A.created_at || raw2A.timestamp,
    hasUrl: (raw2A.entities || []).some(e => e.type === 'url'),
    urlList: (raw2A.entities || [])
      .filter(e => e.type === 'url')
      .map(e => e.url),
    replyCount: raw2A.reply_count || 0,
    hasCodeBlock: /```/.test(raw2A.text || ''),
    mentionedUsers: (raw2A.entities || [])
      .filter(e => e.type === 'mention')
      .map(e => e.value),
    isDuplicate: false,        // Phase 2B에서 enrichment
    duplicateClusterId: null,
  };
}

// Phase 2B 중복 정보 병합
function enrichWithPhase2B(messages, phase2bResult) {
  const duplicateMap = new Map();
  for (const cluster of phase2bResult.clusters) {
    for (const idx of cluster.duplicateIndices) {
      duplicateMap.set(idx, {
        isDuplicate: true,
        clusterId: cluster.clusterId,
      });
    }
  }
  return messages.map((msg, i) => ({
    ...msg,
    ...(duplicateMap.get(i) || { isDuplicate: false }),
  }));
}
```

### 10.2 전체 파이프라인 실행

```javascript
async function runFullPipeline(sessionKey) {
  // 1. Phase 2A: 메시지 수집
  const raw = await fetch(`http://localhost:3009/api/messages?session=${sessionKey}`);
  const messages2A = await raw.json();

  // 2. 정규화
  const normalized = messages2A.messages.map(normalizeFromPhase2A);

  // 3. Phase 2B: 중복 감지
  const dupResult = await fetch('http://localhost:3010/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ entries: normalized }),
  });
  const phase2B = await dupResult.json();

  // 4. 병합
  const enriched = enrichWithPhase2B(normalized, phase2B);

  // 5. Phase 2C: 신뢰도 채점
  const scored = await processBatch(enriched);

  // 6. 결과 라우팅
  await routeAndPersist(scored);

  return scored;
}
```

---

## 11. 모니터링 및 감사 추적

### 11.1 핵심 지표

```javascript
const METRICS = {
  totalProcessed: 0,
  acceptRate: 0,       // 목표: > 60%
  quarantineRate: 0,   // 목표: < 30%
  rejectRate: 0,       // 목표: < 15%
  avgProcessingMs: 0,  // 목표: < 50ms
  cacheHitRate: 0,     // 목표: > 70%
  avgTrustScore: 0,    // 목표: > 65
};
```

### 11.2 알림 규칙

```
격리율 > 50%  → 🔴 경보: 메시지 품질 저하 (채널/소스 점검 필요)
거부율 > 30%  → 🔴 경보: 노이즈 급증 (임계값 재검토 필요)
평균점수 < 55 → 🟡 경고: 전반적 신뢰도 하락
처리속도 > 100ms → 🟡 경고: 성능 저하 (캐시 점검)
```

### 11.3 감사 로그 형식

모든 채점 결정은 `audit_log.jsonl`에 기록됩니다:

```json
{
  "auditId": "audit_20260529_000001",
  "scoreId": "ts_20260529_abc123",
  "action": "AUTO_ACCEPT",
  "trustScore": 87,
  "decision": "ACCEPT",
  "reason": "score >= 60 threshold",
  "timestamp": "2026-05-29T14:30:00.500Z"
}
```

---

## 12. 배포 및 확장 전략

### 12.1 시작 명령

```bash
# 환경 변수
export GATEWAY_URL="http://localhost:3000"
export GATEWAY_TOKEN="your-token-here"
export MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"
export PHASE2A_URL="http://localhost:3009"
export PHASE2B_URL="http://localhost:3010"
export PORT=3011

# 서버 시작
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
node phase2c-trust-score-calculator.js

# 상태 확인
curl http://localhost:3011/health
```

### 12.2 Cron 통합 (Phase 2D 준비)

Phase 2C는 Phase 2D Cron 통합을 위해 다음 인터페이스를 제공합니다:

```bash
# Cron에서 직접 호출 가능한 CLI 모드
node phase2c-trust-score-calculator.js --mode=cron --session=all

# 파이프라인 모드 (2A→2B→2C 순차)
node phase2c-trust-score-calculator.js --mode=pipeline --session=telegram_main
```

### 12.3 성공 기준

```
✅ 설계 문서: 800+ 줄 (현재: 충족)
✅ 테스트 케이스: 100개 (TEST_CASES.md)
✅ API 명세: 9개 엔드포인트 (위 명세 완료)
✅ DB 스키마: JSONL 4개 파일 + Supabase DDL
✅ 단일 채점 < 50ms 목표
✅ 배치 100건 < 5s 목표
✅ Evaluator AI 검토 대기
✅ 마감: 2026-05-30 18:00 KST
```

---

**문서 끝**  
**다음 단계:** Evaluator AI 검토 → 승인 후 Phase 2D (웹개발자 구현) 진행
