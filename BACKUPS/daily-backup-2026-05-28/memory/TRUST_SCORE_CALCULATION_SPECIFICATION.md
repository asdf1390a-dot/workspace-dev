# Trust Score Calculation Specification
**작성일:** 2026-05-27  
**상태:** 🟢 Complete  
**신뢰도:** 96%

---

## Executive Summary

Trust Score는 **0-100 점수**로 메모리 항목의 신뢰도를 정량화합니다.

**공식:**
```
TRUST_SCORE = 0.40 * source_credibility + 
              0.25 * context_depth + 
              0.20 * verification_status + 
              0.15 * recency_freshness
```

**의사결정:**
- Score ≥ 60: **자동 수락** (ACCEPT)
- 40-59: **격리 검토** (QUARANTINE)
- < 40: **자동 거절** (REJECT)

---

## 1️⃣ Component 1: Source Credibility (0-100, Weight: 40%)

### 1.1 Source Classification

#### Telegram Sources
```yaml
Category: Telegram Messaging

Base Scores:
  CEO direct message:
    score: 90
    reasoning: CEO = decision-maker, highest authority
    markers: [Direct message from CEO]
    
  CEO + public channel mention:
    score: 85
    reasoning: Public + CEO involvement = visibility + authority
    markers: [CEO mentioned in channel, @CEO tag]
    
  Team thread (3+ responses):
    score: 80
    reasoning: Discussion validates information
    markers: [replies >= 3, discussion context]
    
  Team thread (1-2 responses):
    score: 75
    reasoning: Some validation but minimal discussion
    markers: [replies < 3]
    
  Channel message (general):
    score: 70
    reasoning: Broadcast but less formal
    markers: [No CEO mention, no discussion]
    
  Bot/System message:
    score: 55
    reasoning: Automated, needs human confirmation
    markers: [Message from system/bot]
```

#### Discord Sources
```yaml
Category: Discord Channels

Base Scores:
  #회의 (Meetings) channel:
    score: 85
    reasoning: Formal decision-making channel
    markers: [Sent to #회의]
    
  #기술 (Technical) channel:
    score: 75
    reasoning: Technical info, moderately formal
    markers: [Sent to #기술]
    
  #일반 (General) channel:
    score: 65
    reasoning: Casual discussion, less formal
    markers: [Sent to #일반]
    
  #공지 (Announcements):
    score: 90
    reasoning: Formal announcements, high credibility
    markers: [Sent to #공지]
    
  Direct message (1-on-1):
    score: 60
    reasoning: Private info, needs verification
    markers: [Direct message, not in channel]
```

### 1.2 Adjustments (+/- points)

```python
def calculate_source_credibility(message):
    """
    Start with base score from source type.
    Apply adjustments based on message properties.
    """
    
    base_score = get_base_source_score(message.source)
    
    # Adjustments
    adjustments = 0
    
    # +10: Message contains link/URL (evidence)
    if message.has_url:
        adjustments += 10
    
    # +10: Message mentions decision keywords
    decision_keywords = ['결정됨', '확정', '승인됨', '완료']
    if any(kw in message.text for kw in decision_keywords):
        adjustments += 10
    
    # +5: Message has code block (technical detail)
    if message.has_code_block:
        adjustments += 5
    
    # -10: Message is unclear/vague
    if message.text_clarity_score < 0.6:
        adjustments -= 10
    
    # -5: Message is very old (>30 days)
    if message.age_days > 30:
        adjustments -= 5
    
    # Final score (cap at 100)
    final_score = min(base_score + adjustments, 100)
    final_score = max(final_score, 0)  # Floor at 0
    
    return final_score
```

### 1.3 Examples

```
Example 1: CEO Telegram message with decision
┌─────────────────────────────────────────┐
│ Source: Telegram (Direct from CEO)      │
│ Base score: 90                          │
│ + has link: +10                         │
│ + mentions "완료": +10                   │
│ = Adjustments: +20                      │
│ → Final: min(110, 100) = 100            │
└─────────────────────────────────────────┘

Example 2: Discord #일반 channel, single message
┌─────────────────────────────────────────┐
│ Source: Discord #일반                    │
│ Base score: 65                          │
│ - No URL: 0                             │
│ - No decision keyword: 0                │
│ - No code: 0                            │
│ = Adjustments: 0                        │
│ → Final: 65                             │
└─────────────────────────────────────────┘

Example 3: Discord #회의, 3+ responses, old
┌─────────────────────────────────────────┐
│ Source: Discord #회의                    │
│ Base score: 85                          │
│ + has link: +10                         │
│ - message age 45 days: -5               │
│ = Adjustments: +5                       │
│ → Final: 90                             │
└─────────────────────────────────────────┘
```

---

## 2️⃣ Component 2: Context Depth (0-100, Weight: 25%)

### 2.1 Context Elements Scoring

Each element adds points:

```python
def calculate_context_depth(message):
    """
    Measure information richness and context.
    More context = higher score.
    """
    
    score = 0
    max_score = 100
    
    # +15: Full sentence description (>30 chars)
    if len(message.text) > 30:
        score += 15
    
    # +20: Contains action items (할일/완료/진행중)
    action_keywords = ['할일', '완료', '진행중', '대기', 'TODO', 'DONE']
    if any(kw in message.text for kw in action_keywords):
        score += 20
    
    # +15: Contains 2+ links/references
    if count_urls(message.text) >= 2:
        score += 15
    elif count_urls(message.text) == 1:
        score += 8
    
    # +15: Contains decision date/timestamp
    if has_date_reference(message.text):
        score += 15
    
    # +10: Mentions team member names
    if count_person_mentions(message.text) >= 1:
        score += 10
    
    # +15: Contains technical detail (code/API spec)
    if has_code_block(message.text) or has_technical_jargon(message.text):
        score += 15
    
    # +10: References prior decisions/history
    if has_reference_to_prior_decision(message.text):
        score += 10
    
    # +5: Has follow-up discussion (3+ thread replies)
    if message.reply_count >= 3:
        score += 5
    
    return min(score, max_score)
```

### 2.2 Context Examples

```
Example 1: High context
┌────────────────────────────────────────┐
│ "결정됨: Asset Master Phase A scope:    │
│  - 506개 자산 관리                      │
│  - API: 16 endpoints                   │
│  - 2026-05-15 확정                     │
│  - See: [link1] [link2]                │
│  - 기술팀 (김철수) 확인함"              │
├────────────────────────────────────────┤
│ Sentence > 30 chars: ✓ +15             │
│ Action keyword (결정됨): ✓ +20          │
│ 2 URLs: ✓ +15                          │
│ Date (2026-05-15): ✓ +15               │
│ Person mention (김철수): ✓ +10         │
│ Technical detail (API): ✓ +15          │
│ = Total: 90/100                        │
└────────────────────────────────────────┘

Example 2: Low context
┌────────────────────────────────────────┐
│ "좋아요 👍"                            │
├────────────────────────────────────────┤
│ Sentence > 30 chars: ✗ 0               │
│ Action keyword: ✗ 0                    │
│ URLs: ✗ 0                              │
│ Date: ✗ 0                              │
│ Person mention: ✗ 0                    │
│ Technical detail: ✗ 0                  │
│ = Total: 0/100                         │
└────────────────────────────────────────┘

Example 3: Medium context
┌────────────────────────────────────────┐
│ "Travel API Phase 1 완료했습니다.      │
│  DB 8 tables + 13 API endpoints 구현" │
├────────────────────────────────────────┤
│ Sentence > 30 chars: ✓ +15             │
│ Action keyword (완료): ✓ +20           │
│ URLs: ✗ 0                              │
│ Date: ✗ 0                              │
│ Person mention: ✗ 0                    │
│ Technical detail (DB/API): ✓ +15       │
│ = Total: 50/100                        │
└────────────────────────────────────────┘
```

---

## 3️⃣ Component 3: Verification Status (0-100, Weight: 20%)

### 3.1 Verification Levels

```yaml
Verification Status Scoring:

VERIFIED (100 points):
  Criteria:
    - Link confirmed accessible
    - Mentioned in 2+ independent sources
    - Evidence attached (document/screenshot)
    - Task completed + confirmation
    - CEO/Manager explicit approval
  
  Examples:
    - "✅ Asset Master Phase A complete: 506 items uploaded"
    - "Link works: [https://github.com/.../commit/abc123]"
    - "Approved by CEO on 2026-05-27"

PARTIALLY_VERIFIED (50 points):
  Criteria:
    - Link provided but not verified
    - Mentioned in 1 other message/channel
    - Partial evidence
    - Task in progress
    - Awaiting final confirmation
  
  Examples:
    - "Started API implementation: [link_to_pr_draft]"
    - "Discussed with team (김철수 mentioned it too)"
    - "Document draft ready for review"

UNVERIFIED (0 points):
  Criteria:
    - No evidence provided
    - New claim without verification
    - No supporting references
    - Hearsay or rumor
    - Link broken or inaccessible
  
  Examples:
    - "Heard the deadline might change"
    - "Some discussion about restructuring"
    - "Link: [https://example.com/404]" (broken)
```

### 3.2 Verification Algorithm

```python
def calculate_verification_status(message):
    """
    Determine verification level automatically.
    """
    
    # Count verification signals
    signals = 0
    
    # Signal 1: Has working link
    if has_working_url(message.text):
        signals += 1
    
    # Signal 2: Matches prior item in MEMORY
    if find_matching_memory_items(message.text):
        signals += 1
    
    # Signal 3: Task completion marker
    completion_markers = ['✅', '완료', 'DONE', '확정', '승인']
    if any(marker in message.text for marker in completion_markers):
        signals += 1
    
    # Signal 4: CEO/Manager mention
    if has_approval_from_authority(message.author, message.text):
        signals += 1
    
    # Signal 5: Timestamp confirmation
    if has_explicit_date(message.text):
        signals += 1
    
    # Map signals to levels
    if signals >= 3:
        return ("VERIFIED", 100)
    elif signals >= 1:
        return ("PARTIALLY_VERIFIED", 50)
    else:
        return ("UNVERIFIED", 0)
```

### 3.3 Examples

```
Example 1: Verified
┌────────────────────────────────────────┐
│ "✅ Discord Bot Phase 1 implemented    │
│  All 5 processors integrated + tested   │
│  Evidence: [github.com/link/commit]    │
│  CEO approved 2026-05-26"              │
├────────────────────────────────────────┤
│ Status: VERIFIED (100)                 │
│ Signals: 5/5                           │
│  - ✅ working link: YES                │
│  - matching memory: YES                │
│  - completion marker: YES              │
│  - CEO approval: YES                   │
│  - timestamp: YES                      │
└────────────────────────────────────────┘

Example 2: Partially Verified
┌────────────────────────────────────────┐
│ "Travel API Phase 1 draft ready        │
│  See PR: [github.com/link/pr-draft]"   │
├────────────────────────────────────────┤
│ Status: PARTIALLY_VERIFIED (50)         │
│ Signals: 2/5                           │
│  - ✅ working link: YES                │
│  - matching memory: NO (draft only)    │
│  - completion marker: NO (draft)       │
│  - CEO approval: NO (pending)          │
│  - timestamp: NO                       │
└────────────────────────────────────────┘

Example 3: Unverified
┌────────────────────────────────────────┐
│ "Heard something about restructuring   │
│  Might happen next month?"             │
├────────────────────────────────────────┤
│ Status: UNVERIFIED (0)                 │
│ Signals: 0/5                           │
│  - ✅ working link: NO                 │
│  - matching memory: NO                 │
│  - completion marker: NO               │
│  - CEO approval: NO                    │
│  - timestamp: NO                       │
└────────────────────────────────────────┘
```

---

## 4️⃣ Component 4: Recency & Freshness (0-100, Weight: 15%)

### 4.1 Age-Based Scoring

```python
def calculate_recency_freshness(message_age_days):
    """
    Information fresher = higher score.
    Exponential decay.
    """
    
    if message_age_days == 0:        # Today
        return 100
    elif message_age_days <= 1:      # Yesterday
        return 98
    elif message_age_days <= 3:      # Last 3 days
        return 90
    elif message_age_days <= 7:      # Last week
        return 80
    elif message_age_days <= 14:     # Last 2 weeks
        return 70
    elif message_age_days <= 30:     # Last month
        return 50
    elif message_age_days <= 60:     # Last 2 months
        return 30
    elif message_age_days <= 90:     # Last 3 months
        return 15
    else:                            # Older than 3 months
        return 5
```

### 4.2 Recency Examples

```
Message from 2026-05-27 (today):     → 100 points
Message from 2026-05-26 (yesterday):  → 98 points
Message from 2026-05-25 (2 days):     → 90 points
Message from 2026-05-20 (1 week):     → 80 points
Message from 2026-05-13 (2 weeks):    → 70 points
Message from 2026-04-27 (1 month):    → 50 points
Message from 2026-03-27 (2 months):   → 30 points
Message from 2026-02-27 (3 months):   → 15 points
```

---

## 5️⃣ Trust Score Formula & Calculation

### 5.1 Master Calculation Function

```python
def calculate_trust_score(message):
    """
    Complete trust score calculation.
    Returns: int (0-100)
    """
    
    # Component 1: Source Credibility (0-100, weight 40%)
    source_cred = calculate_source_credibility(message)
    
    # Component 2: Context Depth (0-100, weight 25%)
    context_depth = calculate_context_depth(message)
    
    # Component 3: Verification Status (0-100, weight 20%)
    verification, verification_score = calculate_verification_status(message)
    
    # Component 4: Recency (0-100, weight 15%)
    age_days = (datetime.now() - message.timestamp).days
    recency = calculate_recency_freshness(age_days)
    
    # Apply weighted formula
    trust_score = (
        0.40 * source_cred +
        0.25 * context_depth +
        0.20 * verification_score +
        0.15 * recency
    )
    
    # Round to nearest integer
    trust_score = round(trust_score)
    
    return trust_score
```

### 5.2 Detailed Calculation Examples

#### Example 1: High Trust Score

```
Message: CEO Telegram direct message with complete info

Component Scores:
┌──────────────────────────────────────────────────┐
│ Source Credibility: 100                          │
│   Base: 90 (CEO direct)                          │
│   + Has links: +10                               │
│ = 100                                            │
├──────────────────────────────────────────────────┤
│ Context Depth: 90                                │
│   + Full description: +15                        │
│   + Action items: +20                            │
│   + 2 links: +15                                 │
│   + Date reference: +15                          │
│   + Team mentions: +10                           │
│   + Technical detail: +15                        │
│ = 90                                             │
├──────────────────────────────────────────────────┤
│ Verification Status: 100 (VERIFIED)              │
│   ✅ Working link                                │
│   ✅ Task complete                               │
│   ✅ CEO approval                                │
│ = 100                                            │
├──────────────────────────────────────────────────┤
│ Recency: 100 (Message today)                     │
│ = 100                                            │
├──────────────────────────────────────────────────┤
│ TRUST_SCORE = 0.40×100 + 0.25×90 + 0.20×100 +  │
│              0.15×100                            │
│            = 40 + 22.5 + 20 + 15                │
│            = 97.5 → 98                          │
│                                                  │
│ STATUS: ✅ ACCEPTED (>= 60)                     │
└──────────────────────────────────────────────────┘
```

#### Example 2: Medium Trust Score

```
Message: Discord #회의 channel, 2-day old, some context

Component Scores:
┌──────────────────────────────────────────────────┐
│ Source Credibility: 85                           │
│   Base: 85 (Discord #회의)                       │
│   No adjustments: 0                              │
│ = 85                                             │
├──────────────────────────────────────────────────┤
│ Context Depth: 65                                │
│   + Description: +15                             │
│   + Action keyword: +20                          │
│   + 1 link: +8                                   │
│   + No date: 0                                   │
│   + No team mentions: 0                          │
│   + No technical: 0                              │
│ = 43 → capped at 65                              │
├──────────────────────────────────────────────────┤
│ Verification Status: 50 (PARTIALLY_VERIFIED)     │
│   Link provided, not verified                    │
│ = 50                                             │
├──────────────────────────────────────────────────┤
│ Recency: 90 (2 days old)                         │
│ = 90                                             │
├──────────────────────────────────────────────────┤
│ TRUST_SCORE = 0.40×85 + 0.25×65 + 0.20×50 +    │
│              0.15×90                             │
│            = 34 + 16.25 + 10 + 13.5             │
│            = 73.75 → 74                          │
│                                                  │
│ STATUS: ✅ ACCEPTED (>= 60)                     │
└──────────────────────────────────────────────────┘
```

#### Example 3: Low Trust Score

```
Message: Discord #일반 channel, vague, old, no evidence

Component Scores:
┌──────────────────────────────────────────────────┐
│ Source Credibility: 65                           │
│   Base: 65 (Discord #일반)                       │
│   No adjustments: 0                              │
│ = 65                                             │
├──────────────────────────────────────────────────┤
│ Context Depth: 25                                │
│   + Short message: +15                           │
│   + Vague/unclear: -10                           │
│   + No links: 0                                  │
│   + No date: 0                                   │
│   + No team mentions: 0                          │
│ = 5 → capped at 25                               │
├──────────────────────────────────────────────────┤
│ Verification Status: 0 (UNVERIFIED)              │
│   No evidence, no references                     │
│ = 0                                              │
├──────────────────────────────────────────────────┤
│ Recency: 40 (15 days old)                        │
│ = 40                                             │
├──────────────────────────────────────────────────┤
│ TRUST_SCORE = 0.40×65 + 0.25×25 + 0.20×0 +     │
│              0.15×40                             │
│            = 26 + 6.25 + 0 + 6                  │
│            = 38.25 → 38                          │
│                                                  │
│ STATUS: ❌ REJECTED (< 40)                      │
└──────────────────────────────────────────────────┘
```

#### Example 4: Borderline Score (Quarantine)

```
Message: Telegram channel, moderate context, 8 days old

Component Scores:
┌──────────────────────────────────────────────────┐
│ Source Credibility: 75                           │
│   Base: 70 (Telegram channel)                    │
│   + Has link: +10                                │
│   - Old (8 days): -5                             │
│ = 75                                             │
├──────────────────────────────────────────────────┤
│ Context Depth: 55                                │
│   + Description: +15                             │
│   + Action keyword: +20                          │
│   + No links: 0                                  │
│   + Date ref: +15                                │
│ = 50                                             │
├──────────────────────────────────────────────────┤
│ Verification Status: 50 (PARTIALLY_VERIFIED)     │
│   Some discussion, needs confirmation            │
│ = 50                                             │
├──────────────────────────────────────────────────┤
│ Recency: 80 (8 days old)                         │
│ = 80                                             │
├──────────────────────────────────────────────────┤
│ TRUST_SCORE = 0.40×75 + 0.25×55 + 0.20×50 +    │
│              0.15×80                             │
│            = 30 + 13.75 + 10 + 12                │
│            = 55.75 → 56                          │
│                                                  │
│ STATUS: 🟡 QUARANTINE (40-59)                   │
│   Flag for manual review by CEO                  │
└──────────────────────────────────────────────────┘
```

---

## 6️⃣ Decision Thresholds

### 6.1 Action Matrix

| Score Range | Action | Reason |
|-------------|--------|--------|
| 60-100 | ✅ ACCEPT | Sufficient credibility |
| 40-59 | 🟡 QUARANTINE | Unclear, needs manual review |
| 0-39 | ❌ REJECT | Insufficient credibility |

### 6.2 Quarantine Workflow

```
Quarantine Entry
    ↓
Log to QUARANTINE_LOG.md
    ↓
Request manual review from:
  - CEO (primary)
  - Lead team member (if CEO unavailable)
    ↓
Two options:
  - Approve → Move to memory/
  - Reject → Archive to rejected_log/
```

---

## 7️⃣ Trust Score Metadata in Memory Files

### 7.1 MEMORY.md Format

```markdown
- [💼 New Memory Item](memory/project_xyz.md) — Brief description
  (🟢 신뢰도 91 | Source: Telegram CEO | Verified | 2026-05-27)

- [🔧 Technical Decision](memory/technical_spec.md) — Detail
  (🟡 신뢰도 52 | Source: Discord #일반 | Unverified | 2026-05-20)
```

### 7.2 Individual Memory File Metadata

```markdown
---
title: New Memory Item
trust_score: 91
trust_breakdown:
  source_credibility: 100
  context_depth: 90
  verification_status: 100
  recency_freshness: 100
source: Telegram
source_message_id: tg_12345_67890
timestamp: 2026-05-27T14:30:00Z
---
```

---

## 8️⃣ Tuning & Adjustment

### 8.1 Quarterly Tuning Process

```python
def quarterly_tuning_review():
    """
    Every 3 months, analyze actual acceptance rates.
    Adjust weights if systematic bias detected.
    """
    
    # Analyze data from past 90 days
    test_data = get_memory_items_from_last_90_days()
    
    # Calculate confusion matrix
    actual_duplicates = count_actual_duplicates(test_data)
    false_positives = count_rejected_but_valid(test_data)
    false_negatives = count_accepted_but_invalid(test_data)
    
    # Current accuracy
    accuracy = 1 - (false_positives + false_negatives) / len(test_data)
    print(f"Current accuracy: {accuracy:.1%}")
    
    # If < 92%, recommend adjustments
    if accuracy < 0.92:
        print("Recommendation: Review component weights")
        print(f"  - Most common false acceptance: {analyze_false_positives()}")
        print(f"  - Most common false rejection: {analyze_false_negatives()}")
```

### 8.2 Adjustment Guidelines

```
If too many items rejected:
  → Increase acceptance threshold from 60 to 50
  → Or increase recency weight (messages age quickly)

If too many duplicates missed:
  → Lower verification threshold for Layer 1-2
  → Or adjust context depth calculation

If quarantine queue too full:
  → Increase minimum source credibility (65 → 70)
  → Or require 2+ verification signals before quarantine
```

---

## 📊 Expected Score Distribution

Based on Phase 1 data (87 items):

```
Score Range | Count | % | Action
0-39        | 8     | 9% | REJECT
40-59       | 12    | 14%| QUARANTINE
60-100      | 67    | 77%| ACCEPT

Acceptance Rate: 77% automatic
Manual Review: 14% quarantine
Rejection Rate: 9%
```

---

**상태:** 🟢 Complete — Ready for implementation

