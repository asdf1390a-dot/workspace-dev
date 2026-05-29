# Phase 2C: Trust Score Calculator — Specification

**Version:** 1.0  
**Created:** 2026-05-29  
**Status:** Production Ready  
**Task ID:** ab579972-f98e-4d43-b095-7c9171e7f0d6

---

## 📋 Overview

Trust Score Calculator determines reliability of messages from Phase 2A and Phase 2B, routing them to:
- **ACCEPT** (score ≥ 60): Trusted memory candidates
- **QUARANTINE** (40–59): Review before acceptance
- **REJECT** (< 40): Low-confidence information

---

## 🔧 API Specification

### Main Calculation Function

#### `calculateTrustScore(message, options)`

Calculates trust score for a single message.

**Input:**
```javascript
{
  messageId: string,           // Unique identifier
  source: 'telegram' | 'discord',
  channel: string,            // Channel name
  author: string,             // Author/sender name
  text: string,               // Message content (required)
  timestamp: ISO8601 string,  // Message creation time (required)
  replyCount: number,         // Thread replies (optional, default 0)
  isDuplicate: boolean,       // Known duplicate flag (optional)
  isContradicted: boolean,    // Conflicts with prior message (optional)
}
```

**Output:**
```javascript
{
  scoreId: string,                    // Unique result ID
  messageId: string,                  // Input message ID
  trustScore: number,                 // 0–100
  decision: 'ACCEPT' | 'QUARANTINE' | 'REJECT',
  
  // Component breakdown
  components: {
    sourceCredibility: {
      score: number,
      baseScore: number,
      adjustments: [{ reason: string, delta: number }],
      signals: string[],
    },
    contextDepth: {
      score: number,
      signals: [
        { type: string, present: boolean, weight: number }
      ],
    },
    verificationStatus: {
      score: number,
      signalCount: number,
      signals: string[],
    },
    recencyFreshness: {
      score: number,
      daysOld: number,
      bracket: string,
    },
  },
  
  // Metadata
  weights: {
    sourceCredibility: 0.40,
    contextDepth: 0.25,
    verificationStatus: 0.20,
    recencyFreshness: 0.15,
  },
  processingTimeMs: number,
  processedAt: ISO8601 string,
  source: string,
  channel: string,
  textSnippet: string,
}
```

**Errors:**
```javascript
{
  scoreId: string,
  messageId: string,
  trustScore: 0,
  decision: 'REJECT',
  error: string,
  processedAt: ISO8601 string,
}
```

---

## 📊 Component Details

### Component 1: Source Credibility (40% weight)

Measures channel trustworthiness and author authority.

#### Telegram Base Scores
- **CEO Direct** (90): Message from @nakyeongtae or author field = "CEO"
- **CEO Mentioned** (85): Text contains CEO reference
- **Team Thread 3+** (80): Thread with ≥3 replies
- **Team Thread 1-2** (75): Thread with 1-2 replies
- **General** (70): General or announcements channel
- **Bot Automated** (55): Automated/bot source
- **Unknown** (40): No channel match

#### Discord Base Scores
- **Announcements** (90): #announcements or similar
- **Meetings** (85): #meetings, #sync, or similar
- **Technical** (75): #technical, #dev, #tech
- **General** (65): #general or default
- **DM** (60): Direct message
- **Unknown** (50): No match

#### Adjustments
Applied post-calculation, clamped to [0, 100]:

| Signal | Delta | Condition |
|--------|-------|-----------|
| Working URL | +10 | Contains HTTP/HTTPS link |
| Decision keyword | +10 | Contains "결정", "확정", "승인", etc. |
| Code block | +5 | Contains ` ``` ` or SQL/API patterns |
| Multiple verification | +10 | Cross-referenced in multiple sources |
| CEO direct | +10 | Author is CEO (overlaps base) |
| Low clarity | -10 | Short text, unclear intent |
| Old message (30d) | -5 | Message > 30 days |
| Duplicate | -15 | Known duplicate detection |
| Contradicted | -20 | Conflicts with accepted message |

---

### Component 2: Context Depth (25% weight)

Measures richness of content signals.

#### Scoring Algorithm
Each signal contributes if present (0–100 scale):

| Signal | Weight | Condition |
|--------|--------|-----------|
| Text length | 10 | text.length > 50 chars |
| Action keyword | 15 | Contains TODO, 완료, 담당자, etc. |
| URL count | 20 | Has working HTTP(S) links |
| Explicit date | 15 | YYYY-MM-DD, MM/DD/YYYY, or Korean date |
| Team mention | 10 | @username or team member name |
| Code block | 10 | ` ``` ` or SQL/API patterns |
| Tech pattern match | 15 | Matches project tech (API, DB, JWT, etc.) |
| Thread engagement | 10 | replyCount > 0 |

**Final Score:** Sum all present signals, capped at 100.

---

### Component 3: Verification Status (20% weight)

Determines if message has supporting evidence.

#### Scoring
- **Manually Verified** (100): 3+ verification signals present
- **Partially Verified** (50): 1–2 verification signals
- **Unverified** (0): No signals

#### Verification Signals
- Has working URLs
- Contains completion markers (✅, 완료, DONE, 확정)
- Mentions approval terms (CEO 확인, 나경태 승인, approved by)
- Includes explicit dates + owner
- Matches memory system entries
- Contains code/schema references
- Technical validation (API syntax, SQL structure)

---

### Component 4: Recency Freshness (15% weight)

Applies exponential decay based on message age.

#### Scoring Brackets
| Days Old | Score |
|----------|-------|
| 0 (today) | 100 |
| 1 | 98 |
| 3 | 90 |
| 7 | 80 |
| 14 | 70 |
| 30 | 50 |
| 60 | 30 |
| 90 | 15 |
| 90+ | 5 |

**Calculation:** `daysElapsed = (now - timestamp) / (1000*60*60*24)`  
**Lookup:** Find bracket containing days, use score. Future dates score 100.

---

## 🔄 Batch Processing

### `calculateBatch(messages, options)`

Processes up to 1000 messages with backpressure control.

**Input:**
```javascript
{
  messages: Array<message>,    // Array of message objects
  options: {
    chunkSize: number,         // Default: 50
    onProgress: Function,      // (progress) => void
  }
}
```

**Output:**
```javascript
{
  results: Array<calculateTrustScore result>,
  summary: {
    total: number,
    accepted: number,          // count where decision === 'ACCEPT'
    quarantined: number,       // count where decision === 'QUARANTINE'
    rejected: number,          // count where decision === 'REJECT'
    avgScore: number,
    processingTimeMs: number,
    throughputMsPerMessage: string,
  }
}
```

**Behavior:**
- Processes in chunks (default 50 messages/chunk)
- 10ms delay between chunks for backpressure
- Progress callback fires after each chunk
- Max 1000 messages per call

---

## 💾 Persistence (JSONL Format)

### File Structure

Each file appends records (1 per line) with schema versioning:

```json
{
  "schemaVersion": "1.0",
  "scoreId": "ts_...",
  "messageId": "...",
  "trustScore": 75,
  "decision": "ACCEPT",
  "timestamp": "2026-05-29T12:34:56Z",
  ...
}
```

### Output Destinations

#### `trust_scores.jsonl`
All calculated scores (regardless of decision).

#### `quarantine_log.jsonl`
Messages needing review (40–59 range).

#### `reject_log.jsonl`
Low-confidence messages (< 40).

#### `weight_history.jsonl`
Historical weight adjustments for analysis.

---

## 🔌 Integration Points

### Phase 2A: Message Collection API

**Input Source:** `http://localhost:3009/api/messages`  
**Query:** Retrieve recent messages to score.  
**Link:** messageId references Phase 2A collection ID.

### Phase 2B: Duplicate Detection

**Input:** Phase 2B output (deduplicated messages)  
**Flag:** Pass `isDuplicate` field if matched to earlier message.  
**Logic:** Reduces C1 by 15 points if flagged.

### Output to Decision Queue

**Routing:**
- ACCEPT ✅ → Insert into approved_memory table
- QUARANTINE ⚠️ → Insert into quarantine_log, await review
- REJECT ❌ → Log to reject_log, monitor for patterns

---

## ⚙️ Configuration

Modifiable constants in `calculator.js`:

```javascript
CHANNEL_BASE_SCORES    // Telegram/Discord channel scores
C1_ADJUSTMENTS         // Adjustment deltas for signals
COMPLETION_MARKERS     // Strings indicating task completion
APPROVAL_TERMS         // Keywords indicating approval
ACTION_KEYWORDS        // Keywords indicating action items
TECH_PATTERNS          // RegExp for technical content detection
RECENCY_SCORES         // Age → score mapping
```

---

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- `fs` and `path` modules (built-in)

### Installation
```bash
cd memory-automation
npm install  # If using dependencies
```

### Running

**Single calculation:**
```bash
node calculator.js
```

**With test suite:**
```bash
node calculator.js --test
```

**In code:**
```javascript
const {
  calculateTrustScore,
  calculateBatch,
} = require('./calculator.js');

const result = calculateTrustScore({ /* message */ });
```

---

## 📈 Performance Characteristics

### Single Message
- **Target:** P50 < 20ms, P99 < 80ms
- **Cache hits:** 10x speedup (typical)
- **No external I/O**

### Batch Processing
- **Throughput:** ~50 messages/chunk
- **Backpressure:** 10ms inter-chunk delay
- **Concurrency:** Serialized (10ms delays prevent overload)

### Cache
- **Strategy:** LRU (Least Recently Used)
- **Default TTL:** 1 hour (3,600,000ms)
- **Max entries:** 1000
- **Hit rate tracking:** Per-session stats

---

## 🧪 Testing

Minimum 10 test cases in `test.js`:

1. **Component tests (C1–C4)** — Individual scoring
2. **Edge cases** — Null inputs, invalid timestamps, future dates
3. **Integration tests** — Full pipeline
4. **Batch tests** — 50+ message processing
5. **Cache tests** — Hit/miss scenarios
6. **Boundary tests** — Exactly 40 and 60 scores
7. **Channel tests** — Telegram CEO vs Discord announcements
8. **Signal detection** — URL, keyword, code block detection
9. **Decision routing** — ACCEPT/QUARANTINE/REJECT distribution
10. **Error handling** — Invalid input, missing fields

---

## 📝 Example Usage

### Single Message
```javascript
const { calculateTrustScore } = require('./calculator.js');

const result = calculateTrustScore({
  messageId: 'msg_123',
  source: 'telegram',
  channel: 'general',
  author: 'nakyeongtae',
  text: '✅ Asset API 완료. https://github.com/api-docs',
  timestamp: new Date().toISOString(),
  replyCount: 3,
});

console.log(result.trustScore);  // e.g., 78
console.log(result.decision);    // 'ACCEPT'
```

### Batch Processing
```javascript
const messages = [
  { messageId: 'msg_1', source: 'telegram', ... },
  { messageId: 'msg_2', source: 'discord', ... },
];

const { results, summary } = await calculateBatch(messages, {
  chunkSize: 50,
  onProgress: (p) => console.log(`${p.processed}/${p.total}`),
});

console.log(summary.accepted);  // e.g., 45
console.log(summary.rejected);  // e.g., 5
```

---

## 📌 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-29 | Initial release, 4-component formula, JSONL persistence |

---

## 🔗 Related Documents

- **Design:** `/memory-automation/TRUST_SCORE_DESIGN.md`
- **Implementation:** `/memory-automation/calculator.js`
- **Tests:** `/memory-automation/test.js`
- **Phase 2A:** `/memory-automation/README_PHASE2A.md`
- **Phase 2B:** `/memory-automation/README_PHASE2B.md`
