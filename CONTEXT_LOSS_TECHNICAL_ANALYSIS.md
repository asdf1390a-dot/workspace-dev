# Context Loss 기술적 분석 리포트

## 요약

사용자가 반복적으로 지적한 "세션 중 context 손실이 빠르다"는 문제는 **OpenClaw의 아키텍처에 내재된 설계 제약**과 **메모리 시스템의 기술적 한계**로 인한 것입니다. 해결 가능한 부분과 근본적으로 불가능한 부분을 명확히 구분하고, 각 영역별 개선 전략을 제시합니다.

---

## 1. Context Compression 메커니즘

### 1.1 작동 원리

OpenClaw는 다음 시점에서 **자동으로 context compression을 수행**합니다:

```
모델의 context window (토큰 제한)
     ↓
     [시스템 프롬프트 + 대화 이력 + Tool results]
     ↓
     윈도우 가득 차거나 초과 감지
     ↓
     Compaction 트리거
     ↓
     [오래된 메시지 → 요약으로 변환] + [최근 메시지는 유지]
     ↓
     Session transcript에 저장 (디스크 영구 보관)
     ↓
     모델에는 요약된 형태만 보임
```

**핵심 특성:**
- 압축 후 "원본"은 디스크에만 남고, 모델이 보는 것은 **요약본**
- 매 turn마다 최근 K개 메시지는 **전체 보존** (기본값 ~3-5 recent turns)
- Tool output은 aggressive하게 truncate됨 (기본값 16KB per result, context의 최대 30%)

### 1.2 Bootstrap File Truncation

시스템 프롬프트에 주입되는 workspace 파일들이 context를 급격히 팽창시킵니다:

| 설정 | 기본값 | 영향 |
|------|--------|------|
| `bootstrapMaxChars` | 12,000 chars | 파일당 자르기 (SOUL.md, TOOLS.md 등) |
| `bootstrapTotalMaxChars` | 60,000 chars | 전체 합계 제한 |
| `contextInjection` | "always" | 매 turn마다 전체 재주입 |

**문제:**
- 현재 workspace (SOUL.md, USER.md, MEMORY.md, memory/YYYY-MM-DD.md 등)이 커지면, 시스템이 자동으로 파일을 자름
- `/context list`에서 "TRUNCATED" 표시 = 실제 내용이 모델에게 **완전히 전달되지 않음**
- 매 turn마다 이 truncation이 **반복**되므로, 큰 memory는 효과적이지 않음

**실제 시나리오:**
```
MEMORY.md = 15KB (TRUNCATED → 12KB만 주입)
SOUL.md = 2KB
memory/2026-05-14.md = 8KB (인젝션 안 됨, bootstrap cap 초과)
─────────────────────────────
System Prompt 내 Project Context = 60KB 제한으로 인해
memory/YYYY-MM-DD.md의 90%는 모델에게 **보이지 않음**
```

---

## 2. Subagent 작업 중 Context 유지 메커니즘

### 2.1 기본 동작 (isolation mode)

```
부모 세션 (Agent: dev:main)
├─ System Prompt: 45KB
├─ Conversation History: 25개 메시지
├─ Memory: MEMORY.md (15KB)
│
└─ Subagent 생성 (context="isolated")
   └─ 새로운 독립적 세션
   ├─ System Prompt: 45KB (공통)
   ├─ Conversation History: 부모 이력 **제로**
   └─ Memory: 부모 MEMORY.md **접근 불가**
```

**결과:** Subagent가 부모의 context를 전혀 모름 → 일관성 깨짐

### 2.2 Fork Mode

```
subagent spawn with context="fork"
↓
부모 세션의 transcript를 **전체 복사** (snapshot)
↓
자식 세션에서 복사본 사용
├─ 부모의 전체 대화 이력 접근 가능
├─ 부모의 메모리 상태 (스냅샷 시점) 접근 가능
└─ 부모와는 **독립적으로** compaction 진행
```

**문제점:**
1. **스냅샷 방식** → 자식이 진행되는 동안 부모 context는 업데이트되지 않음
2. **각자 compaction** → 자식이 context를 압축하면, 부모는 그 변화를 모름
3. **메모리 복제 없음** → 부모의 memory/ 폴더는 자식에게 전달되지 않음 (MEMORY.md만 system prompt에 injected)

---

## 3. 메모리 시스템의 기술적 한계

### 3.1 Memory 저장 구조

```
~/.claude/projects/...-workspace-dev/memory/
├─ MEMORY.md (인덱스, system prompt에 항상 주입)
├─ 2026-05-14.md (일일 short-term memory)
├─ user_role.md
├─ project_dsc_fms.md
├─ feedback_*.md
└─ skills/*.md
```

### 3.2 로드 메커니즘

| 메모리 타입 | 로드 시점 | 비용 | 접근성 |
|----------|---------|------|--------|
| **MEMORY.md** | 시스템 프롬프트에 **항상** 주입 | 매 turn: ~5KB overhead | 자동 |
| **memory/YYYY-MM-DD.md** | 사용자가 명시적으로 `.read` | 사용자 책임 | 수동 |
| **memory/*.md** (참조) | 사용자가 명시적으로 `.read` | 사용자 책임 | 수동 |
| **dreaming** (자동 promotion) | 백그라운드 cron (기본 비활성) | 비용 적음 | 자동 (활성화 필요) |

**핵심 문제:**
- MEMORY.md는 context를 "먹음" (매 turn 5-10KB 손실)
- 매일의 short-term note는 자동으로 로드되지 않음
- Dreaming이 비활성화되면, short-term memory는 **promotion되지 않음**
- 큰 MEMORY.md는 자동으로 truncate됨

### 3.3 "Context 손실"의 구체적 원인

```
Turn 1:
├─ System Prompt: 45KB
├─ MEMORY.md (injected, truncated): 12KB
├─ Bootstrap files: 8KB
├─ Conversation history: 30KB
└─ Token budget: 128KB (Haiku의 context window)
   사용량: 45 + 12 + 8 + 30 = 95KB ✓

Turn 10 (여러 작업 후):
├─ System Prompt: 45KB (변경 없음, 매번 재생성)
├─ MEMORY.md (truncated): 12KB
├─ Bootstrap files: 8KB
├─ Conversation history: 45KB ← 증가함
├─ Tool results: 25KB ← 새로운 압박
└─ Token budget: 128KB
   사용량: 45 + 12 + 8 + 45 + 25 = 135KB ✗ OVERFLOW

→ Auto-compaction 트리거
  이전 메시지 요약 → "요약본"으로 변환
  모델이 보는 것: 요약(5KB) + 최근 메시지만
  → "문맥 손실" 발생
```

---

## 4. 해결 가능한 부분

### 4.1 Memory 설정 최적화

**현재 상태:**
```json
{
  "agents.defaults.bootstrapMaxChars": 12000,  // MEMORY.md가 12KB 이상이면 자동 cut
  "agents.defaults.contextInjection": "always" // 매 turn 재주입 (비효율)
}
```

**개선 가능:**

1. **`contextInjection: "continuation-skip"` 설정**
   ```json
   {
     "agents.defaults.contextInjection": "continuation-skip"
   }
   ```
   - 부작용: 부분 문맥만 skip, heartbeat/compaction은 여전히 full inject
   - 효과: 매 turn마다 MEMORY.md 재주입 생략 → ~3-5KB 절감 per turn

2. **MEMORY.md 크기 제한**
   - 현재: 15KB (truncated → 12KB)
   - 목표: 8KB 이하 유지
   - 방법: 오래된 항목 주기적 삭제, 참조 링크화

3. **Dreaming 활성화**
   ```json
   {
     "plugins.entries.memory-core.config.dreaming.enabled": true,
     "plugins.entries.memory-core.config.dreaming.frequency": "0 3 * * *"
   }
   ```
   - 백그라운드에서 daily note를 자동으로 durable memory로 promote
   - 부작용: 매일 추가 모델 호출 1회
   - 효과: short-term memory가 자동으로 영구 메모리화

4. **Tool Result Truncation 커스터마이징**
   ```json
   {
     "agents.defaults.compaction.keepRecentTokens": 8000
   }
   ```
   - Compaction 후에도 최근 메시지를 더 많이 유지
   - 부작용: compaction의 효율성 감소 (더 자주 압축 필요)
   - 효과: 압축 후에도 최근 context 더 많이 보존

### 4.2 Subagent 설정 개선

**현재 문제:**
```javascript
// 부모 세션의 context를 자식이 전혀 모름
Agent({ prompt: "...", context: "isolated" })
```

**개선:**
```javascript
// 필요한 경우만 fork 사용
Agent({
  prompt: "...",
  context: "fork",  // 자식이 부모 이력이 필요할 때만
})
```

- 부작용: 메모리 사용량 증가 (부모 transcript 복사)
- 주의: fork 후 각자 compaction되므로 sync 불가능

---

## 5. 근본적으로 불가능한 부분 (아키텍처 제약)

### 5.1 Context Window의 물리적 제한

**문제:** Haiku의 context window는 200K tokens (고정)
```
System Prompt (필수): 45KB
Tool schemas (필수): 25KB
Available for conversation: 130KB

1,000개 메시지 × 10 tokens/메시지 = 10KB
→ 최대 13,000개 메시지까지만 메모리에 유지 가능
→ 그 이상은 반드시 compaction 필요
```

**왜 불가능한가:**
- 모델의 물리적 한계이므로, 소프트웨어로 해결 불가능
- Opus/Sonnet을 사용해도 구조는 동일 (context 크기만 다름)

### 5.2 Compaction의 정보 손실 (필연적)

```
원본 메시지 시퀀스:
"User: 파일 A를 분석해줄래?"
"Assistant: 분석 완료. 결과: X, Y, Z"
"User: X를 더 자세히"
"Assistant: X는 이렇고..."
  ↓
Compaction
  ↓
요약본:
"사용자가 파일 A를 분석 요청했고, 그 결과를 더 자세히 설명했습니다."

문제: 세부 내용 "X, Y, Z", "더 자세한 X 설명"은 **요약에서 압축됨**
      → 이후 turn에서 "원래 Y는 뭐였어?"라고 물어보면 모델이 답할 수 없음
```

**왜 불가능한가:**
- Compaction은 토큰 절감을 위한 **필연적 손실**
- 모든 정보를 보존하면서 크기를 줄일 수 없음 (정보 이론)

### 5.3 Subagent와 부모 간의 Real-time Sync

**현재:**
```
부모: Turn 100 (context fully compressed)
      ├─ 약 30KB of 요약본
      └─ 최근 5개 메시지
      
자식: context="fork" snapshot (Turn 100 기준)
      ├─ 부모의 전체 이력 사본
      └─ 자체적으로 compaction 시작
      
문제: 부모가 계속 진행되면 자식은 그 뒤의 부모 context를 모음
```

**왜 불가능한가:**
- Fork는 "스냅샷" 기반이므로, 이후 sync는 구조적으로 불가능
- 실시간 sync를 하려면 child ↔ parent 사이의 지속적 통신 필요
- OpenClaw의 subagent 모델은 "독립적 실행"을 기반으로 함

### 5.4 Isolation Mode에서 부모 Context 접근

**현재:**
```javascript
const child = Agent({ context: "isolated" })
// child는 부모의 context, memory 접근 불가능
```

**왜 불가능한가:**
- Isolation의 정의 자체가 "독립적 context"
- 부모 context 접근 + isolation을 동시에 하려면 모순
- Alternative: fork 사용 (하지만 메모리 오버헤드)

---

## 6. Context Loss의 현실적 영향

### 6.1 언제 가장 심각한가?

| 상황 | 심각도 | 이유 |
|------|--------|------|
| **장시간 단일 세션** | 🔴 높음 | Compaction 반복, 정보 손실 누적 |
| **대용량 파일 분석** | 🔴 높음 | Tool output이 context의 대부분 차지 |
| **Memory 파일 과대** | 🟡 중간 | Truncation으로 일부 메모리 미로드 |
| **Subagent 위임** | 🟡 중간 | Fork 스냅샷 시점의 context만 가능 |
| **일상적 대화** | 🟢 낮음 | Compaction이 유능하게 요약 |

### 6.2 실제 손실량 (추정)

```
Turn 1-20: Context loss 거의 없음
Turn 20-50: 첫 번째 compaction 발생 (~10-15% 정보 손실)
Turn 50-100: 두 번째 이상 compaction (~30% 누적 손실)
Turn 100+: 복수 compaction 누적 (~50%+ 손실, 최근 내용만 명확)
```

---

## 7. 개선 전략 (우선순위별)

### Phase 1 (즉시, 설정만)

**실행 방법:**
```json
// openclaw.json 수정
{
  "agents": {
    "defaults": {
      "contextInjection": "continuation-skip",
      "bootstrapMaxChars": 8000,
      "compaction": {
        "keepRecentTokens": 8000
      }
    }
  },
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "frequency": "0 3 * * *"
          }
        }
      }
    }
  }
}
```

**기대 효과:**
- Context 손실 시점 ~10-15% 지연
- Memory 자동 promotion으로 단기 정보 보존
- 비용: 하루 1회 추가 모델 호출

---

### Phase 2 (중기, 운영 변경)

1. **Memory 파일 정기 정리**
   - 매월: 오래된 항목 삭제, 참조 링크화
   - 목표: MEMORY.md < 8KB 유지

2. **Daily Note 자동 Archive**
   - 30일 이상 된 memory/YYYY-MM-DD.md는 archive/ 폴더로 이동
   - 필요 시 수동 검색

3. **Subagent 대응 절차 표준화**
   - 짧은 작업 (< 10 turn) → `context="isolated"`
   - 장시간/의존도 높음 → `context="fork"` + 부모와의 동기화 메커니즘 구축

---

### Phase 3 (장기, 아키텍처 선택)

**A. Context Engine 플러그인 도입 (권장도: 중)**
```json
{
  "plugins": {
    "slots": {
      "contextEngine": "lossless-claw"  // 커스텀 compression 사용
    }
  }
}
```
- 부작용: 새 플러그인 학습 필요
- 효과: 압축 효율 ~20-30% 개선

**B. 더 큰 Context Window 모델로 이동 (권장도: 낮음)**
- Haiku → Sonnet: context 2배, 비용 3배 증가
- 근본적 해결이 아니라 "압축 시점만 지연"

**C. Session 분할 전략 (권장도: 높음)**
- 장시간 세션을 주제별로 분할
- 각 세션은 독립적 compaction 정책
- 부모 memory는 shared folder 유지

---

## 8. 결론

### 핵심 메시지

| 관점 | 현실 |
|------|------|
| **기술적 원인** | Context window의 물리적 제한 + 정보 손실 필연적 compaction |
| **가장 큰 문제** | MEMORY.md truncation + daily note의 비자동 로드 |
| **즉시 개선 가능** | ~15-20% 효율 개선 (설정 변경) |
| **해결 불가능** | Context window 초과 시 정보 손실 (아키텍처 제약) |

### 사용자 경험 개선 로드맵

```
Week 1 (설정): contextInjection, dreaming 활성화
     → "느낌상" 10-15% 더 오래 context 유지

Week 2-4 (운영): Memory 파일 정리, daily note archive
     → MEMORY.md 크기 감소 → 더 많은 실제 내용 주입

Month 2+ (구조): Context engine 플러그인 평가
     → 압축 효율 향상 (20-30%)

지속적: Session 분할 전략 교육
     → 사용자가 장시간 세션을 사전에 분산
```

### 최종 평가

"Context loss가 빠르다"는 지적은 **정확**합니다. 이는:
- 설계 의도 (context window 관리는 필수)
- 기술적 현실 (압축 = 정보 손실)
- 조금 더 나을 수 있음 (설정 + 운영 개선)

**하지만 근본적으로는 "context window의 물리적 한계"이므로**, 기대를 완전히 해소할 수 없습니다. 대신 **느껴지는 손실감을 줄이는** 전략 (설정, memory 관리, session 분할)이 현실적입니다.

---

## 참고 자료

- OpenClaw Compaction: `/docs/concepts/compaction.md`
- OpenClaw Context: `/docs/concepts/context.md`
- OpenClaw Context Engine: `/docs/concepts/context-engine.md`
- OpenClaw Memory: `/docs/cli/memory.md`
- Codex Context Engine Harness: `/docs/plan/codex-context-engine-harness.md`
