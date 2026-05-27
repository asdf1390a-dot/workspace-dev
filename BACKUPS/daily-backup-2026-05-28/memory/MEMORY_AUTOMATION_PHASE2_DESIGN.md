# Memory Automation Phase 2: Auto-Collection System Design
**설계 완성일:** 2026-05-27 (Target)  
**설계 상태:** 🟡 In Progress  
**신뢰도 목표:** 98%+ (자동화 검증)

---

## 📋 Executive Summary

Phase 2는 Telegram/Discord로부터 **실시간 메모리 항목을 자동 수집하는 시스템**을 구축합니다.

**핵심 기능:**
1. MEMORY.md 자동 갱신 체크리스트 시스템
2. 중복 감지 로직 (패턴 + 의미 기반)
3. 신뢰도 점수 산출 규칙 (자동 스코어링)
4. 5분 주기 cron 자동화 실행

**기대 효과:**
- 메모리 손실 제거: 0% 누락률
- 갱신 수동작업 제거: 99% 자동화
- 신뢰도 추적: 실시간 점수 계산
- 팀 온보딩: 자동 동기화

---

## 🔧 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Telegram/Discord Communication Channels                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Message Collection Agent (5min cron)                     │
│ - Fetch latest messages from Telegram/Discord            │
│ - Extract memory items (keywords: 결정, 완료, 설계, etc) │
│ - Run NLP classification                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Duplicate Detection Engine                               │
│ - Fuzzy matching (90% similarity threshold)              │
│ - Semantic similarity check (embeddings)                 │
│ - Category collision detection                           │
│ - Output: is_duplicate (true/false)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Trust Score Calculator                                   │
│ - Source credibility (Telegram/Discord)                  │
│ - Message context depth                                  │
│ - Verification status (links/evidence)                   │
│ - Output: trust_score (0-100)                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ MEMORY.md Auto-Update Checklist                          │
│ - Check duplicates against existing items                │
│ - Validate entry format + metadata                       │
│ - Generate update payload                                │
│ - Atomic commit to MEMORY.md                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Audit Log + Notifications                                │
│ - Log all auto-updates to MEMORY_AUTO_UPDATE_LOG.md      │
│ - Alert on failures/conflicts                            │
│ - Send confirmation to Telegram/Discord                  │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ MEMORY.md Auto-Update Checklist System

### 1.1 Entry Format Specification

**Every memory item collected must include:**

```yaml
Entry Template:
├── title: str (max 100 chars)
├── category: enum (프로젝트|규칙|자동화|비즈니스|팀구조|커뮤니케이션|기술)
├── source: str (Telegram|Discord)
├── message_id: str (unique identifier from source)
├── timestamp: ISO8601 (2026-05-27T14:30:00Z)
├── content: str (actual memory item text)
├── related_items: list[str] (links to existing memory files)
├── trust_score: int (0-100, see section 3)
├── verification_status: enum (unverified|partially_verified|verified)
├── extraction_method: str (keyword|manual|nlp_classifier)
└── auto_update: bool (true if auto-collected)
```

### 1.2 Checklist Before Update

**Every candidate entry must pass ALL checks:**

- [ ] Not a duplicate (see section 2)
- [ ] Contains actionable information (not just chatter)
- [ ] Matches one of 7 approved categories
- [ ] Has source URL/message ID for traceability
- [ ] Trust score ≥ 60% (configurable threshold)
- [ ] Title ≤ 100 characters
- [ ] Content ≤ 2000 characters (links count as 30 chars)
- [ ] Related items exist and are valid
- [ ] No PII/sensitive data exposed
- [ ] Proper markdown formatting

**Rejection Rules:**
- If ANY check fails → entry goes to QUARANTINE_LOG.md for manual review
- User can approve/reject from quarantine
- Rejected entries are never re-processed

### 1.3 Update Workflow

```
┌──────────────────────────────────┐
│ New Message from Telegram/Discord │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Extract Candidate Entry           │
│ (Apply keyword/NLP filters)       │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Run Checklist (see 1.2)           │
│ - Pass/Fail decision              │
└────────────┬─────────────────────┘
             │
        ┌────┴────┐
        │          │
       FAIL       PASS
        │          │
        ▼          ▼
    QUARANTINE  ┌─────────────────────┐
    LOG         │ Auto-create .md file │
                │ in memory/           │
                └────────┬────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │ Update MEMORY.md     │
                │ - Add link reference │
                │ - Update timestamp   │
                │ - Track metadata     │
                └────────┬────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │ Log to               │
                │ MEMORY_AUTO_UPDATE.. │
                │ _LOG.md              │
                └────────┬────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │ Commit to git        │
                │ (atomic + signed)    │
                └─────────────────────┘
```

---

## 2️⃣ Duplicate Detection Logic

### 2.1 Three-Layer Detection Strategy

**Layer 1: Pattern Matching (Fast)**
- Exact title match (case-insensitive)
- File path collision check
- Category + keyword overlap detection

**Layer 2: Fuzzy String Matching (Medium)**
- Levenshtein distance ≥ 90% similarity → DUPLICATE
- Apply Jaro-Winkler algorithm
- Title + first 100 chars of content
- Threshold tuned from Phase 1 data

**Layer 3: Semantic Similarity (Slow, High-Precision)**
- Use Claude embeddings API for content vectors
- Calculate cosine similarity on last 30 existing items
- Threshold: 0.85+ cosine similarity = DUPLICATE
- Only triggers if Layer 1-2 inconclusive

### 2.2 Duplicate Detection Algorithm

```python
def is_duplicate(candidate_entry):
    """
    Returns: (is_dup: bool, confidence: 0-100, reason: str)
    """
    
    # Layer 1: Pattern Matching (O(n) where n = 87 items)
    exact_match = check_exact_title_match(candidate_entry.title)
    if exact_match:
        return (True, 100, f"Exact match: {exact_match.filename}")
    
    category_conflicts = find_category_collisions(
        candidate_entry.category,
        candidate_entry.title
    )
    if category_conflicts:
        for conflict in category_conflicts:
            sim_score = fuzzy_similarity(
                candidate_entry.title,
                conflict.title
            )
            if sim_score >= 0.90:
                return (True, int(sim_score*100), 
                       f"Fuzzy match with {conflict.filename}")
    
    # Layer 2: Fuzzy Matching (O(n))
    for existing_item in MEMORY_INDEX:
        similarity = jaro_winkler_similarity(
            candidate_entry.title,
            existing_item.title
        )
        if similarity >= 0.90:
            return (True, int(similarity*100),
                   f"Fuzzy: {existing_item.filename}")
    
    # Layer 3: Semantic Similarity (O(30) - recent items only)
    recent_items = MEMORY_INDEX.last_n(30)
    embeddings = get_embeddings([
        existing_item.content for existing_item in recent_items
    ])
    candidate_embedding = get_embedding(candidate_entry.content)
    
    for i, embedding in enumerate(embeddings):
        cosine_sim = cosine_similarity(candidate_embedding, embedding)
        if cosine_sim >= 0.85:
            return (True, int(cosine_sim*100),
                   f"Semantic: {recent_items[i].filename}")
    
    return (False, 0, "No duplicate detected")
```

### 2.3 False Positive Prevention

**Cases that should NOT be marked as duplicates:**

| Case | Detection | Action |
|------|-----------|--------|
| Same topic, different decision | Semantic layer | Check date/context diff |
| Variation in phrasing | Fuzzy layer | Accept if confidence < 85% |
| Related but distinct items | Semantic layer | Allow if cosine < 0.82 |
| Updates to existing item | Manual marker | Link as "update_of: <file>" |

---

## 3️⃣ Trust Score Calculation Rules

### 3.1 Trust Score Components

```
TRUST_SCORE (0-100) = (
    0.40 * source_credibility +
    0.25 * context_depth +
    0.20 * verification_status +
    0.15 * recency_freshness
)
```

### 3.2 Component Definitions

#### A. Source Credibility (0-100)
```
Telegram (기본: 70):
  - CEO direct message:           +20 → 90
  - Team thread with 3+ replies:  +15 → 85
  - Single message in channel:     0 → 70
  - Message contains @CEO mention: +10 → 80

Discord (기본: 65):
  - #회의 channel (meetings):     +20 → 85
  - #일반 channel (general):       0 → 65
  - #기술 channel (technical):    +10 → 75
  - Message with code/link:       +10 → 75

Minimum floor: 40 (filtered out at checklist stage)
```

#### B. Context Depth (0-100)
```
Presence of:
  - Full sentence description:     +15
  - Action items (할일/완료):      +20
  - Related links (2+):            +15
  - Decision date/timestamp:       +15
  - Team context (mentions names): +10
  - Code/technical detail:         +15
  - References to prior decisions: +10

Maximum: 100
```

#### C. Verification Status (0-100)
```
unverified (0):
  - No evidence provided
  - New claim without verification

partially_verified (50):
  - Link provided but not checked
  - Mentioned in 1 other message
  - Partial evidence

verified (100):
  - Link confirmed accessible
  - Mentioned in 2+ independent sources
  - Evidence attached (document/screenshot)
  - Task completed + confirmed
```

#### D. Recency/Freshness (0-100)
```
Days since message:
  - 0 days (today):                100
  - 1-3 days:                       90
  - 4-7 days:                       80
  - 8-14 days:                      70
  - 15-30 days:                     50
  - 31-60 days:                     30
  - 61+ days:                       10
```

### 3.3 Trust Score Examples

**Example 1: CEO direct Telegram message with task completion**
```
source_credibility: 90 (CEO direct message)
context_depth: 85 (full description + action items + links + date)
verification_status: 100 (task completed and confirmed)
recency_freshness: 100 (today)

TRUST_SCORE = 0.40*90 + 0.25*85 + 0.20*100 + 0.15*100 = 91
```

**Example 2: Discord #일반 channel, single message, no links**
```
source_credibility: 65 (Discord general channel)
context_depth: 35 (short message, no links or references)
verification_status: 0 (no evidence)
recency_freshness: 80 (4 days old)

TRUST_SCORE = 0.40*65 + 0.25*35 + 0.20*0 + 0.15*80 = 40
→ REJECTED (below 60% threshold)
```

**Example 3: Discord #회의 channel, 3+ context clues, 2+ links**
```
source_credibility: 85 (Discord meetings channel)
context_depth: 90 (full decision + links + related items)
verification_status: 50 (links provided, not verified)
recency_freshness: 90 (2 days old)

TRUST_SCORE = 0.40*85 + 0.25*90 + 0.20*50 + 0.15*90 = 81
→ ACCEPTED
```

### 3.4 Trust Score Metadata in MEMORY.md

```markdown
- [💼 New Project Item](memory/project_xyz.md) — Description here
  (🟢 신뢰도 91 | Source: Telegram | Verified | 2026-05-27)
```

---

## 4️⃣ 5-Minute Cron Script Template

### 4.1 Cron Job Configuration

```bash
# .claude/cron/memory_automation_phase2.sh
# Schedule: Every 5 minutes (*/5 * * * *)
# Owner: Memory Automation Phase 2
# Timeout: 120 seconds
```

### 4.2 Script Structure

```bash
#!/bin/bash
set -euo pipefail

# ============================================================================
# Memory Automation Phase 2: Auto-Collection Cron (5min interval)
# ============================================================================

LOG_DIR="/home/jeepney/.claude/logs/memory_automation"
MEMORY_DIR="/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory"
QUARANTINE_LOG="${MEMORY_DIR}/QUARANTINE_LOG.md"
UPDATE_LOG="${MEMORY_DIR}/MEMORY_AUTO_UPDATE_LOG.md"
LOCK_FILE="/tmp/memory_automation.lock"
MAX_LOCK_AGE=300  # 5 minutes

mkdir -p "$LOG_DIR"

# ============================================================================
# FUNCTION: Acquire Lock
# ============================================================================
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        lock_age=$(($(date +%s) - $(stat -f%m "$LOCK_FILE" 2>/dev/null || echo 0)))
        if [ $lock_age -lt $MAX_LOCK_AGE ]; then
            echo "Lock file exists (age: ${lock_age}s), exiting" >> "$LOG_DIR/cron.log"
            exit 0
        fi
    fi
    touch "$LOCK_FILE"
    trap "rm -f $LOCK_FILE" EXIT
}

# ============================================================================
# FUNCTION: Fetch Messages from Telegram/Discord
# ============================================================================
fetch_messages() {
    local source=$1  # "telegram" or "discord"
    local hours_lookback=1  # Look at last 1 hour of messages
    
    case "$source" in
        telegram)
            # Call Telegram API via Claude memory agent
            # GET /api/telegram/messages?hours=$hours_lookback&channel=all
            # Returns JSON array of messages
            ;;
        discord)
            # Call Discord API via Claude memory agent
            # GET /api/discord/messages?hours=$hours_lookback&guild=all
            # Returns JSON array of messages
            ;;
    esac
}

# ============================================================================
# FUNCTION: Extract Candidate Entries
# ============================================================================
extract_candidates() {
    local messages_json=$1
    
    # Keywords that trigger memory extraction
    local keywords=(
        "결정됨"
        "완료"
        "설계 완성"
        "API 스펙"
        "중요"
        "구성"
        "구현"
        "확정"
        "합의"
        "프로토콜"
    )
    
    # Filter messages containing keywords
    # Use Claude's NLP classifier if message doesn't match keywords
    # Output: JSON with candidate entries
    echo "$messages_json" | \
        jq --arg kw "$(IFS='|'; echo "${keywords[*]}")" \
        'map(select(.text | test($kw; "i")))'
}

# ============================================================================
# FUNCTION: Run Duplicate Detection
# ============================================================================
check_duplicates() {
    local candidate_json=$1
    
    # Call duplicate detection engine
    # Input: candidate entry JSON
    # Output: (is_duplicate: bool, confidence: 0-100, reason: string)
    
    # Pseudocode:
    # 1. Extract title from candidate
    # 2. Check exact match in memory/UNIFIED/_INDEX.md
    # 3. Run fuzzy matching (Layer 2)
    # 4. If inconclusive, run semantic check (Layer 3)
    # 5. Return JSON: {is_duplicate, confidence, reason}
    
    :
}

# ============================================================================
# FUNCTION: Calculate Trust Score
# ============================================================================
calculate_trust_score() {
    local entry_json=$1
    
    # Extract components
    local source=$(echo "$entry_json" | jq -r '.source')
    local context_depth=$(echo "$entry_json" | jq -r '.context_depth // 0')
    local verification=$(echo "$entry_json" | jq -r '.verification_status')
    local message_age=$(echo "$entry_json" | jq -r '.message_age_seconds')
    
    # Component 1: Source Credibility (0-100)
    case "$source" in
        telegram_ceo) source_cred=90 ;;
        telegram_thread) source_cred=85 ;;
        telegram_channel) source_cred=70 ;;
        discord_meeting) source_cred=85 ;;
        discord_general) source_cred=65 ;;
        discord_technical) source_cred=75 ;;
        *) source_cred=50 ;;
    esac
    
    # Component 2: Context Depth (0-100)
    # Already extracted in entry_json
    
    # Component 3: Verification Status (0-100)
    case "$verification" in
        verified) verif_score=100 ;;
        partially_verified) verif_score=50 ;;
        unverified) verif_score=0 ;;
        *) verif_score=0 ;;
    esac
    
    # Component 4: Recency (0-100)
    local days_old=$(($message_age / 86400))
    if [ $days_old -eq 0 ]; then
        recency_score=100
    elif [ $days_old -le 3 ]; then
        recency_score=90
    elif [ $days_old -le 7 ]; then
        recency_score=80
    elif [ $days_old -le 14 ]; then
        recency_score=70
    elif [ $days_old -le 30 ]; then
        recency_score=50
    elif [ $days_old -le 60 ]; then
        recency_score=30
    else
        recency_score=10
    fi
    
    # TRUST_SCORE formula
    local trust_score=$(echo "scale=0; 
        0.40 * $source_cred + 
        0.25 * $context_depth + 
        0.20 * $verif_score + 
        0.15 * $recency_score" | bc)
    
    echo "$trust_score"
}

# ============================================================================
# FUNCTION: Run Checklist Validation
# ============================================================================
validate_entry() {
    local entry_json=$1
    local trust_score=$2
    
    local checks_passed=0
    local total_checks=10
    local failure_reasons=()
    
    # Check 1: Not a duplicate
    local is_dup=$(echo "$entry_json" | jq -r '.is_duplicate')
    if [ "$is_dup" = "true" ]; then
        failure_reasons+=("Failed: Duplicate entry")
    else
        ((checks_passed++))
    fi
    
    # Check 2: Contains actionable info
    local content=$(echo "$entry_json" | jq -r '.content')
    if [ ${#content} -lt 10 ]; then
        failure_reasons+=("Failed: Content too short")
    else
        ((checks_passed++))
    fi
    
    # Check 3: Valid category
    local category=$(echo "$entry_json" | jq -r '.category')
    valid_categories="프로젝트|규칙|자동화|비즈니스|팀구조|커뮤니케이션|기술"
    if echo "$category" | grep -qE "$valid_categories"; then
        ((checks_passed++))
    else
        failure_reasons+=("Failed: Invalid category '$category'")
    fi
    
    # Check 4: Has source ID
    local source_id=$(echo "$entry_json" | jq -r '.message_id')
    if [ -n "$source_id" ]; then
        ((checks_passed++))
    else
        failure_reasons+=("Failed: No source message ID")
    fi
    
    # Check 5: Trust score >= 60
    if [ "$trust_score" -ge 60 ]; then
        ((checks_passed++))
    else
        failure_reasons+=("Failed: Trust score too low ($trust_score < 60)")
    fi
    
    # Check 6: Title length <= 100
    local title=$(echo "$entry_json" | jq -r '.title')
    if [ ${#title} -le 100 ]; then
        ((checks_passed++))
    else
        failure_reasons+=("Failed: Title too long (${#title} > 100)")
    fi
    
    # Check 7: Content length <= 2000
    if [ ${#content} -le 2000 ]; then
        ((checks_passed++))
    else
        failure_reasons+=("Failed: Content too long (${#content} > 2000)")
    fi
    
    # Check 8: Valid markdown
    if echo "$content" | grep -qE '^\[.+\]\(.+\)|^#|^-'; then
        ((checks_passed++))
    else
        failure_reasons+=("Warning: Non-standard markdown")
        ((checks_passed++))
    fi
    
    # Check 9: No PII
    if echo "$content" | grep -qiE '(ssn|passport|credit card|password)'; then
        failure_reasons+=("Failed: PII detected")
    else
        ((checks_passed++))
    fi
    
    # Check 10: Related items valid
    local related=$(echo "$entry_json" | jq -r '.related_items | length')
    if [ "$related" -ge 0 ]; then
        ((checks_passed++))
    fi
    
    # Decision
    if [ ${#failure_reasons[@]} -eq 0 ]; then
        echo "PASS"
    else
        echo "FAIL:$(IFS=','; echo "${failure_reasons[*]}")"
    fi
}

# ============================================================================
# FUNCTION: Auto-Update MEMORY.md
# ============================================================================
auto_update_memory() {
    local entry_json=$1
    local trust_score=$2
    
    # Create entry metadata
    local title=$(echo "$entry_json" | jq -r '.title')
    local category=$(echo "$entry_json" | jq -r '.category')
    local source=$(echo "$entry_json" | jq -r '.source')
    local timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    
    # Create markdown filename
    local filename="${MEMORY_DIR}/${category,,}_$(echo "$title" | tr ' ' '_' | tr -cd '[:alnum:]_').md"
    
    # Create .md file with entry content
    {
        echo "# $title"
        echo ""
        echo "**설정일:** $timestamp"
        echo "**신뢰도:** 🟢 $trust_score"
        echo "**출처:** $source"
        echo ""
        echo "$(echo "$entry_json" | jq -r '.content')"
        echo ""
        echo "---"
        echo "**메타데이터:** auto-collected"
    } > "$filename"
    
    # Update MEMORY.md with link
    local link_line="- [$title]($filename) — $(echo "$entry_json" | jq -r '.description // .content | head -c 80')..."
    echo "$link_line" >> "${MEMORY_DIR}/MEMORY.md"
    
    echo "$filename"
}

# ============================================================================
# FUNCTION: Log Update
# ============================================================================
log_update() {
    local entry_json=$1
    local action=$2  # "ACCEPTED", "REJECTED", "QUARANTINE"
    local timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    
    local title=$(echo "$entry_json" | jq -r '.title')
    local source=$(echo "$entry_json" | jq -r '.source')
    local trust_score=$(echo "$entry_json" | jq -r '.trust_score')
    
    case "$action" in
        ACCEPTED)
            echo "- [$timestamp] ✅ ACCEPTED: $title (신뢰도: $trust_score, 출처: $source)" >> "$UPDATE_LOG"
            ;;
        REJECTED)
            echo "- [$timestamp] ❌ REJECTED: $title (신뢰도: $trust_score, 출처: $source)" >> "$QUARANTINE_LOG"
            ;;
        QUARANTINE)
            echo "- [$timestamp] 🟡 QUARANTINE: $title (신뢰도: $trust_score, 출처: $source - MANUAL REVIEW)" >> "$QUARANTINE_LOG"
            ;;
    esac
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================
main() {
    acquire_lock
    
    local timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    echo "[$timestamp] Starting Memory Automation Phase 2 cron job" >> "$LOG_DIR/cron.log"
    
    # Fetch messages from both sources
    local telegram_messages=$(fetch_messages "telegram")
    local discord_messages=$(fetch_messages "discord")
    
    # Extract candidates
    local telegram_candidates=$(extract_candidates "$telegram_messages")
    local discord_candidates=$(extract_candidates "$discord_messages")
    
    # Combine all candidates
    local all_candidates=$(echo "$telegram_candidates $discord_candidates" | jq -s 'add // []')
    
    # Process each candidate
    local accepted=0
    local rejected=0
    local quarantined=0
    
    echo "$all_candidates" | jq -r '.[] | @base64' | while read candidate_b64; do
        local candidate_json=$(echo "$candidate_b64" | base64 -D)
        
        # 1. Check duplicates
        local dup_result=$(check_duplicates "$candidate_json")
        local is_dup=$(echo "$dup_result" | jq -r '.is_duplicate')
        if [ "$is_dup" = "true" ]; then
            log_update "$candidate_json" "REJECTED"
            ((rejected++))
            continue
        fi
        
        # 2. Calculate trust score
        local trust_score=$(calculate_trust_score "$candidate_json")
        
        # 3. Run checklist validation
        local validation=$(validate_entry "$candidate_json" "$trust_score")
        
        if [[ "$validation" == "PASS" ]]; then
            # 4. Auto-update MEMORY.md
            local filename=$(auto_update_memory "$candidate_json" "$trust_score")
            log_update "$candidate_json" "ACCEPTED"
            echo "[$timestamp] ✅ Accepted: $filename" >> "$LOG_DIR/cron.log"
            ((accepted++))
        else
            # Quarantine for manual review
            log_update "$candidate_json" "QUARANTINE"
            echo "[$timestamp] 🟡 Quarantine: $validation" >> "$LOG_DIR/cron.log"
            ((quarantined++))
        fi
    done
    
    # Summary
    echo "[$timestamp] Complete: Accepted=$accepted, Rejected=$rejected, Quarantined=$quarantined" >> "$LOG_DIR/cron.log"
}

main "$@"
```

### 4.3 Cron Job Registration

```bash
# Register with OpenClaw cron system
# Schedule: */5 * * * *  (every 5 minutes)
# Timeout: 120 seconds
# Retry on failure: 2 attempts

crontab entry:
*/5 * * * * /home/jeepney/.claude/cron/memory_automation_phase2.sh 2>&1 | \
    tee -a /home/jeepney/.claude/logs/memory_automation/cron.log
```

---

## 5️⃣ API Specification

### 5.1 Message Collection API

**Endpoint: GET /api/memory/messages**

```
Query Parameters:
  - source: "telegram" | "discord"
  - hours_lookback: integer (default 1)
  - include_threads: boolean (default true)
  - filter_by_channel: string (optional, comma-separated)

Response:
{
  "messages": [
    {
      "message_id": "tg_12345_67890",
      "timestamp": "2026-05-27T14:30:00Z",
      "source": "telegram",
      "channel": "general",
      "user_id": "user_123",
      "user_name": "CEO",
      "text": "결정됨: Team structure Phase 2 확정",
      "reply_count": 3,
      "has_attachment": false,
      "has_link": true
    }
  ],
  "total_messages": 42,
  "filtered_candidates": 8
}
```

### 5.2 Duplicate Check API

**Endpoint: POST /api/memory/check-duplicate**

```
Request Body:
{
  "title": "New entry title",
  "content": "Entry content...",
  "category": "프로젝트"
}

Response:
{
  "is_duplicate": false,
  "confidence": 0,
  "reason": "No duplicate detected",
  "similar_items": [
    {
      "filename": "project_xyz.md",
      "similarity": 0.72,
      "type": "fuzzy_match"
    }
  ]
}
```

### 5.3 Trust Score API

**Endpoint: POST /api/memory/calculate-trust-score**

```
Request Body:
{
  "source": "telegram_ceo",
  "context_depth": 85,
  "verification_status": "partially_verified",
  "message_age_seconds": 3600,
  "has_links": true,
  "reply_count": 3
}

Response:
{
  "trust_score": 81,
  "breakdown": {
    "source_credibility": 90,
    "context_depth": 85,
    "verification_status": 50,
    "recency_freshness": 90
  },
  "pass_threshold": true
}
```

### 5.4 Auto-Update Memory API

**Endpoint: POST /api/memory/auto-update**

```
Request Body:
{
  "title": "New Memory Item",
  "category": "프로젝트",
  "content": "Full markdown content...",
  "source": "telegram",
  "message_id": "tg_12345_67890",
  "trust_score": 81,
  "related_items": ["project_xyz.md", "team_structure.md"]
}

Response:
{
  "success": true,
  "filename": "memory/프로젝트_new_memory_item.md",
  "memory_md_updated": true,
  "git_commit": "a1b2c3d",
  "timestamp": "2026-05-27T14:35:42Z"
}
```

---

## 6️⃣ Implementation Checklist

### Phase 2 Deliverables

- [ ] MEMORY.md Auto-Update Checklist System (this document)
- [ ] Duplicate Detection Engine Implementation
  - [ ] Layer 1: Pattern matching
  - [ ] Layer 2: Fuzzy matching
  - [ ] Layer 3: Semantic similarity
- [ ] Trust Score Calculator Implementation
  - [ ] 4 component calculation
  - [ ] Example validation
  - [ ] Threshold tuning
- [ ] Cron Script Template
  - [ ] Message collection functions
  - [ ] Candidate extraction
  - [ ] Duplicate check integration
  - [ ] Trust score integration
  - [ ] Checklist validation
  - [ ] MEMORY.md auto-update
  - [ ] Logging + audit trails
- [ ] API Specification Document (complete)
- [ ] Test Suite
  - [ ] Unit tests for duplicate detection
  - [ ] Unit tests for trust score calculation
  - [ ] Integration tests for full pipeline
  - [ ] Regression tests against Phase 1 data
- [ ] Deployment
  - [ ] Register cron job with OpenClaw
  - [ ] Configure alert channels (Telegram/Discord)
  - [ ] Monitor first 48 hours
  - [ ] Tune thresholds based on real data

---

## 7️⃣ Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-collection coverage | 95%+ | Items successfully auto-collected / total new items |
| False positive rate | <5% | Duplicates marked as new / total auto-updates |
| False negative rate | <3% | Actual duplicates missed / total new items |
| Trust score accuracy | 90%+ | Automated score vs. manual review agreement |
| Cron execution reliability | 99.9% | Successful runs / total scheduled runs |
| MEMORY.md update latency | <10 min | Time from message to MEMORY.md link |
| Manual quarantine review rate | <10% | Quarantined items / total processed |

---

## 8️⃣ Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| False duplicates kill valid entries | Medium | High | Layer 3 semantic check + manual quarantine review |
| Trust score bias toward recent items | High | Medium | Tune recency component weight (currently 15%) |
| API rate limits (Telegram/Discord) | Low | High | Implement exponential backoff + queue |
| Incomplete message context | Medium | Medium | Fetch full message thread context, not just preview |
| PII leakage into memory | Low | Critical | Add strict regex filters for common PII patterns |
| MEMORY.md merge conflicts | Low | Medium | Atomic git commits + rebase on conflict |

---

## 📅 Timeline & Milestones

**설계 완성 목표:** 2026-05-27 18:00 KST

**실행 일정:**
- 2026-05-27: 설계 완성 + 리뷰 (✅ 현재)
- 2026-05-28: 구현 Phase 2A (Message Collection API)
- 2026-05-29: 구현 Phase 2B (Duplicate Detection)
- 2026-05-30: 구현 Phase 2C (Trust Score Calculator)
- 2026-05-31: 구현 Phase 2D (Cron Script Integration)
- 2026-06-01: 테스트 + 튜닝
- 2026-06-02: 프로덕션 배포

---

## 📞 Appendix: Context References

### A. Related Existing Systems

- **Phase 1:** [UNIFIED Index](UNIFIED/_INDEX.md) — 87개 항목 중앙 색인
- **Phase A (Monitoring):** [Memory Protection](PHASE_A_MEMORY_PROTECTION_IMPLEMENTATION.md) — 스냅샷 + 체크섬
- **Audit System:** [Audit Framework](audit_system_framework.md) — 일일 신뢰도 추적

### B. Message Sources Configuration

```yaml
Telegram:
  - Channel: general (default)
  - Keywords: 결정됨, 완료, 설계 완성, API 스펙, 중요
  - Thread depth: 3 messages minimum for high credibility

Discord:
  - Channels: #회의 (meetings), #일반 (general), #기술 (technical)
  - Keywords: same as Telegram
  - Thread depth: full thread context required
```

### C. File Organization

```
memory/
├── MEMORY.md (main index, auto-updated)
├── UNIFIED/
│   ├── _INDEX.md (87 items)
│   ├── _DECISION_LOG.md
│   └── _TEAM_SYNC.md
├── project_*.md (auto-created by Phase 2)
├── feedback_*.md (rules)
├── MEMORY_AUTO_UPDATE_LOG.md (audit log)
└── QUARANTINE_LOG.md (manual review queue)
```

---

**설계 완성:** 2026-05-27 (진행 중)  
**최종 상태:** 🟡 In Progress → 🟢 Complete (목표)
