# Phase 2D: Cron Integration

**Memory Automation — Cron-Driven Full-Cycle Orchestration**

**Version:** 1.0  
**Created:** 2026-05-30  
**Status:** Implementation Complete  
**Task ID:** Phase-2D-Cron-Integration

---

## 📋 Overview

Phase 2D integrates Phase 2A (Message Collection), Phase 2B (Duplicate Detection), and Phase 2C (Trust Score Calculation) into an automated 5-minute cron cycle that:

1. **Collects** messages from Telegram/Discord via Phase 2A API
2. **Detects** duplicates using Phase 2B engine
3. **Scores** messages using Phase 2C trust calculator
4. **Updates** MEMORY.md with new high-confidence entries
5. **Logs** all activities for monitoring and analytics

**Expected outcome:** MEMORY.md auto-updated every 5 minutes with 95%+ trust score entries.

---

## 🚀 Quick Start

### Prerequisites

- Phase 2A running on port 3009 (`npm start` in memory-automation)
- Phase 2B running on port 3010 (monitoring service)
- Phase 2C running on port 3011 (trust score calculator)
- `bash`, `curl`, `jq` available
- Write access to `/home/jeepney/.openclaw/workspace-dev/memory`

### Running Manually (Test)

```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation

# Dry-run mode (no file writes)
bash phase2d-cron.sh --dry-run

# Single execution
bash phase2d-cron.sh

# Watch logs
tail -f /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-$(date +%Y%m%d).log
```

### Scheduling with Cron (5-minute interval)

Add to crontab:

```bash
crontab -e
```

Add line:

```crontab
*/5 * * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2d-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-cron.log 2>&1
```

Verify installation:

```bash
crontab -l | grep phase2d
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│  5-minute Cron Trigger                      │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────┐
│Phase 2A │  │Phase 2B │  │Phase 2C  │
│Collect  │→ │Detect   │→ │Score     │
│Messages │  │Dups     │  │Trust     │
└────┬────┘  └────┬────┘  └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ MEMORY.md Update   │
         │ - Merge entries    │
         │ - Atomic write     │
         │ - Backup           │
         └──────────┬─────────┘
                    │
                    ▼
         ┌────────────────────┐
         │ Logging & Analytics│
         │ - Activity log     │
         │ - Error tracking   │
         │ - Metrics          │
         └────────────────────┘
```

---

## 🔧 Configuration

Edit variables at the top of `phase2d-cron.sh`:

```bash
# Service URLs
PHASE2A_URL="http://localhost:3009"
PHASE2B_URL="http://localhost:3010"
PHASE2C_URL="http://localhost:3011"

# Thresholds
TRUST_SCORE_THRESHOLD=60        # Min score to accept
DUPLICATE_CONFIDENCE_THRESHOLD=0.80  # Min confidence to merge

# Timeouts (seconds)
CURL_TIMEOUT=10
API_TIMEOUT=30

# Directories (usually auto-detected)
MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
```

---

## 📝 Execution Flow

### 1. Phase 2A: Message Collection (0-5s)

```
POST /api/collect-and-deduplicate
↓
Response: {
  success: true,
  messagesCollected: 5,
  messages: [...]
}
↓
Saved to: collected/messages_YYYYMMDD_HHMMSS.jsonl
```

**Health check:** 3 retries, 2s delay between attempts

**Failure handling:** Logs error, continues to next phase (resilient)

### 2. Phase 2B: Duplicate Detection (5-10s)

```
POST /api/detect-duplicates
↓
Response: {
  success: true,
  duplicateClusters: [...]
}
↓
Saved to: collected/duplicates_YYYYMMDD_HHMMSS.jsonl
```

**Duplicate merge:** Only clusters with confidence ≥ 0.80

**Output:** Consolidated list ready for scoring

### 3. Phase 2C: Trust Score Calculation (10-20s)

```
POST /api/calculate-trust-scores
↓
Response: {
  success: true,
  summary: {
    accepted: 4,
    quarantined: 1,
    rejected: 0
  },
  results: [...]
}
↓
Saved to: collected/trust_scores_YYYYMMDD_HHMMSS.jsonl
```

**Decision routing:**
- **ACCEPT** (score ≥ 60): Merge to MEMORY.md
- **QUARANTINE** (40–59): Log to quarantine, await manual review
- **REJECT** (< 40): Log to reject log

### 4. MEMORY.md Update (20-25s)

```
Read: trust_scores_YYYYMMDD_HHMMSS.jsonl
Filter: decision == "ACCEPT" AND trustScore >= 60
↓
Backup: MEMORY_YYYYMMDD_HHMMSS.md.bak
↓
Append entries to MEMORY.md (auto-update section)
↓
Atomic write (temp file + rename)
```

**Conflict avoidance:** Append-only semantics + separate section for auto-collected

**Safety:** Atomic writes + backup before modification

### 5. Logging & Reporting

```
Logs recorded to:
- phase2d-cron-YYYYMMDD.log     ← Text log with timestamps
- phase2d-activity-YYYYMMDD.jsonl ← JSONL activity stream
- phase2d-errors-YYYYMMDD.log    ← Error-only log
```

---

## 📊 Log Format

### Text Log (phase2d-cron-YYYYMMDD.log)

```
[2026-05-30 10:05:00] [INFO] === PHASE 2A: Message Collection ===
[2026-05-30 10:05:02] [INFO] Phase 2A health check PASSED
[2026-05-30 10:05:04] [INFO] Phase 2A collected 5 messages in 1823ms
[2026-05-30 10:05:04] [INFO] Messages saved to: messages_20260530_100504.jsonl
[2026-05-30 10:05:05] [INFO] === PHASE 2B: Duplicate Detection ===
...
```

### Activity JSONL (phase2d-activity-YYYYMMDD.jsonl)

```json
{"timestamp":"2026-05-30T10:05:00Z","phase":"PHASE2A","status":"SUCCESS","duration_ms":1823,"details":{"messages_collected":5}}
{"timestamp":"2026-05-30T10:05:05Z","phase":"PHASE2B","status":"SUCCESS","duration_ms":1200,"details":{"clusters_found":1,"memory_files":87}}
{"timestamp":"2026-05-30T10:05:08Z","phase":"PHASE2C","status":"SUCCESS","duration_ms":2500,"details":{"accepted":4,"quarantined":1,"rejected":0,"total":5}}
{"timestamp":"2026-05-30T10:05:15Z","phase":"MEMORY_UPDATE","status":"SUCCESS","duration_ms":500,"details":{"entries_added":4,"accepted":4}}
```

---

## 🧪 Testing & Validation

### Test 1: Dry-Run Mode (No File Writes)

```bash
# Check if all services are available without modifying files
bash phase2d-cron.sh --dry-run 2>&1 | grep -E "(PASSED|FAILED|health check)"
```

**Expected output:**
```
[...] [INFO] Phase 2A health check PASSED
[...] [INFO] Phase 2B health check PASSED
[...] [INFO] Phase 2C health check PASSED
```

### Test 2: Single Execution

```bash
# Run one full cycle and verify file updates
bash phase2d-cron.sh

# Check logs
tail -30 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-$(date +%Y%m%d).log

# Verify MEMORY.md was updated
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md

# Verify backup was created
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/backups/ | tail -5
```

**Expected results:**
- All phases show "SUCCESS"
- MEMORY.md timestamp is recent
- Backup file created in backups/
- Activity logged to activity JSONL

### Test 3: Three Consecutive Runs (Schedule Simulation)

```bash
# Simulate cron running 3 times (5 minutes apart)
for i in {1..3}; do
  echo "=== Run $i ==="
  bash phase2d-cron.sh
  echo "Sleeping 5 minutes..."
  sleep 300  # 5 minutes
done

# Summary
echo "=== Results ==="
tail -100 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-$(date +%Y%m%d).log | tail -30
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-activity-$(date +%Y%m%d).jsonl
```

**Success criteria:**
- All 3 runs complete without errors
- Activity log shows 3 "CYCLE_COMPLETE" entries
- No duplicate entries in MEMORY.md (Phase 2B deduplication working)
- Each run takes 20-30 seconds
- Trust score distribution reasonable (some ACCEPT, maybe some QUARANTINE)

---

## 🔍 Troubleshooting

### Issue: "Phase 2A service not responding"

```bash
# Check if Phase 2A is running
curl -s http://localhost:3009/health | jq .

# Start Phase 2A if needed
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
PORT=3009 npm start phase2a-message-collection.js &
```

### Issue: "Phase 2D collected 0 messages"

```bash
# Check Phase 2A directly for messages
curl -s http://localhost:3009/api/messages | jq .

# Verify Telegram/Discord have recent activity
# (Messages must be from monitored channels)
```

### Issue: "MEMORY.md not updated but phases succeeded"

```bash
# Check trust scores calculated
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-$(date +%Y%m%d).log | grep PHASE2C

# Verify trust scores in collected files
jq '.decision' /home/jeepney/.openclaw/workspace-dev/memory/collected/trust_scores_*.jsonl | sort | uniq -c
```

**Common causes:**
- No messages scored ACCEPT (all below threshold or REJECT)
- Trust score threshold too high (default: 60) — adjust if needed
- Phase 2A not collecting messages from correct sources

### Issue: "Atomic write failed"

```bash
# Check disk space
df -h /home/jeepney/.openclaw/workspace-dev

# Check file permissions
ls -la /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md

# Verify no concurrent writes
lsof | grep MEMORY.md
```

### Issue: "Cron not running as expected"

```bash
# Check crontab entry
crontab -l | grep phase2d

# Check cron logs (system-dependent)
grep CRON /var/log/syslog | tail -20

# Test cron environment
env | grep -E "(PATH|SHELL|HOME)" > /tmp/cron-env.txt
bash -c "source /tmp/cron-env.txt && bash phase2d-cron.sh"
```

---

## 📈 Monitoring & Metrics

### Activity Dashboard (JSONL)

```bash
# Count successes vs failures by day
jq -r '.phase + "_" + .status' /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-activity-*.jsonl | sort | uniq -c

# Calculate average phase duration
jq -r '.phase + " " + (.duration_ms|tostring)' /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-activity-*.jsonl | \
  awk '{phases[$1]+=$2; counts[$1]++} END {for (p in phases) printf "%s: %.0fms avg\n", p, phases[p]/counts[p]}'

# Track memory updates over time
jq -r 'select(.phase=="MEMORY_UPDATE") | .timestamp + " entries:" + (.details.entries_added|tostring)' /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-activity-*.jsonl
```

### Error Tracking

```bash
# Recent errors
tail -50 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-errors-$(date +%Y%m%d).log

# Error frequency
grep ERROR /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-*.log | cut -d' ' -f2- | sort | uniq -c | sort -rn
```

---

## 🔐 Safety & Resilience

### Atomic File Writes

```bash
# Phase 2D writes to temp file first, then renames atomically
# This prevents partial/corrupted MEMORY.md writes
old_size=$(wc -c < /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md)
bash phase2d-cron.sh
new_size=$(wc -c < /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md)
# Size should only increase (append-only), never corrupt
```

### Automatic Backups

```bash
# Before each execution, MEMORY.md is backed up
ls -lah /home/jeepney/.openclaw/workspace-dev/memory/backups/ | head -10

# Restore backup if needed
cp /home/jeepney/.openclaw/workspace-dev/memory/backups/MEMORY_20260530_100500.md.bak \
   /home/jeepney/.openclaw/workspace-dev/memory/MEMORY.md
```

### Graceful Degradation

If any phase fails:
- Phase 2A down → Continues to Phase 2B with skipped status
- Phase 2B down → Continues to Phase 2C (may have fewer duplicates to score)
- Phase 2C down → Skips MEMORY.md update, logs warning
- MEMORY.md locked → Logs error, doesn't abort cron (next cycle will retry)

No failures prevent the cron from completing.

---

## 🚀 Next Steps (Phase 2E/2F)

### Phase 2E: Testing & Tuning (2026-06-01)

- Monitor first 48 hours of cron execution
- Tune thresholds based on acceptance rate
- Validate duplicate detection accuracy
- Measure MEMORY.md growth rate

### Phase 2F: Production Deployment (2026-06-02)

- Finalize cron schedule (current: every 5 minutes)
- Set up monitoring alerts on error threshold
- Document operational runbooks
- Training for team on manual quarantine review

---

## 📚 Related Documentation

- **Phase 2A (Message Collection):** `README_PHASE2A.md`
- **Phase 2B (Duplicate Detection):** `README_PHASE2B.md`
- **Phase 2C (Trust Score):** `README_PHASE2C.md`
- **Design (all phases):** `MEMORY_AUTOMATION_PHASE2_DESIGN.md`
- **Deployment checklist:** `PHASE2D_DEPLOYMENT_CHECKLIST.md`

---

## 📞 Support

Issues or questions:
1. Check logs: `tail -50 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-$(date +%Y%m%d).log`
2. Verify services: `curl -s http://localhost:300{9,10,11}/health | jq .`
3. Test manually: `bash phase2d-cron.sh`
4. Review error log: `cat /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-errors-$(date +%Y%m%d).log`

