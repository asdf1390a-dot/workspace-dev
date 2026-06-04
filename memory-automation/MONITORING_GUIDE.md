# Phase 2 Refactoring — Monitoring Guide

**Version:** 1.0  
**Updated:** 2026-06-04  
**Dashboard Location:** `/memory-automation/metrics/metrics.json`

---

## Overview

The refactored Phase 2 system tracks 5 automated metrics in real-time:

1. **Memory RSS** (5min interval) — Process memory usage
2. **Processing Latency** (1hr rolling average) — Stage latency baseline
3. **Error Rate** (realtime) — Collection/Dedup/Calc success rates
4. **Data Integrity** (1day interval) — MD5 checksums + file state
5. **Checkpoint SLA** (per execution) — CTB/Checkpoint completion within 5min

---

## Metrics File Structure

**Location:** `/memory-automation/metrics/metrics.json`

```json
{
  "timestamp": "2026-06-04T07:40:36.000Z",
  "process": {
    "pid": 1234,
    "uptime_ms": 3600000
  },
  "memory": {
    "rss_mb": 75.5,
    "heapUsed_mb": 25.3,
    "external_mb": 2.1
  },
  "errors": {
    "collection": {
      "success": 240,
      "failed": 3,
      "rate": "98.8%"
    },
    "deduplication": {
      "success": 95,
      "failed": 0,
      "rate": "100.0%"
    },
    "calculation": {
      "success": 92,
      "failed": 1,
      "rate": "98.9%"
    }
  },
  "latency": {
    "collection_ms": [2000, 2100, 1950],
    "deduplication_ms": [3000, 3100, 2950],
    "calculation_ms": [1500, 1550, 1480]
  },
  "checkpoints": {
    "total": 12,
    "completed_within_sla": 11,
    "sla_rate": "91.7%"
  },
  "integrity": {
    "last_check": "2026-06-04T07:40:36.000Z",
    "checksums": {
      "MEMORY.md": "a1b2c3d4e5f6...",
      "messages.jsonl": "f6e5d4c3b2a1..."
    }
  }
}
```

---

## Metric Definitions

### 1. Memory RSS Monitoring

**What:** Process resident set size (actual physical memory)  
**Interval:** Updated every 5 minutes  
**Alert Threshold:** > 350MB  
**Baseline:** ~50MB (varies by message volume)  
**Growth Pattern:** Linear with queue length, resets after dequeue

```bash
# Check current memory
jq '.memory' metrics/metrics.json

# Expected over 4 hours: growth < 50MB (50 → 100MB ok, 50 → 300MB alert)
```

**Healthy Indicators:**
- RSS stable between 50-150MB during normal operation
- Heap used < 30% of RSS
- No memory spikes > 100MB in 5-min intervals

**Alert Actions:**
- If RSS > 350MB: Check for memory leak in queue/logger
- If growing > 50MB/hour: May need to increase dequeue frequency
- Review: `process.memoryUsage()` diagnostics

### 2. Processing Latency

**What:** Duration of collection → dedup → calculation stages  
**Interval:** Tracked per execution, 1-hour rolling average  
**Baseline:** 3 minutes for full cycle  
**Alert Threshold:** > 5 minutes average  

```bash
# Check latency trend
jq '.latency' metrics/metrics.json

# Calculate average
node -e "
const m = require('./metrics/metrics.json');
const avg = (arr) => arr.reduce((a,b) => a+b, 0) / arr.length;
console.log('Collection avg:', Math.round(avg(m.latency.collection_ms)), 'ms');
console.log('Dedup avg:', Math.round(avg(m.latency.deduplication_ms)), 'ms');
console.log('Calc avg:', Math.round(avg(m.latency.calculation_ms)), 'ms');
"
```

**Healthy Indicators:**
- Collection: 2000-2500ms (network + formatting)
- Deduplication: 3000-3500ms (2-layer matching)
- Calculation: 1500-2000ms (formula evaluation)
- Total cycle: < 5 min for 100+ messages

**Alert Actions:**
- If collection > 3s: Check gateway network health
- If dedup > 5s: Check for duplicate message volume spike
- If calc > 3s: May need to batch-process smaller sets

### 3. Error Rate Tracking

**What:** Success/failure ratio for each stage  
**Interval:** Realtime, updated with every operation  
**Alert Threshold:** Success rate < 90%  

```bash
# Check error rates
jq '.errors' metrics/metrics.json

# Calculate success rate
node -e "
const m = require('./metrics/metrics.json');
Object.entries(m.errors).forEach(([stage, stats]) => {
  const total = stats.success + stats.failed;
  if (total > 0) {
    const rate = ((stats.success / total) * 100).toFixed(1);
    console.log(stage + ':', rate + '% success (' + stats.success + '/' + total + ')');
  }
});
"
```

**Healthy Indicators:**
- Collection: > 95% success (network may cause occasional failures)
- Deduplication: > 99% success (should be deterministic)
- Calculation: > 99% success (should be deterministic)
- Total operations: > 100 to ensure statistical significance

**Alert Actions:**
- If collection < 90%: Check gateway connectivity, auth tokens
- If dedup < 95%: Review duplicate detection logic, input format
- If calc < 95%: Check for invalid timestamp/frequency values

### 4. Data Integrity Monitoring

**What:** MD5 checksums of key output files  
**Interval:** Daily at 03:00 KST  
**Purpose:** Detect unexpected data mutations  

```bash
# Check last integrity audit
jq '.integrity' metrics/metrics.json

# Manual verification
md5sum /memory/MEMORY.md
md5sum /memory/messages.jsonl
md5sum /memory/messages_deduplicated.jsonl
```

**Healthy Indicators:**
- Checksums match between consecutive runs (if data unchanged)
- Checksums change only when new messages added
- No mid-cycle checksum mismatches

**Alert Actions:**
- If checksum changes unexpectedly: Check for concurrent writes
- If file size decreases: May indicate data loss, investigate immediately
- If audit fails: Check file permissions, disk space

### 5. Checkpoint SLA Monitoring

**What:** CTB + Checkpoint completion within 5 minutes  
**Interval:** Per cron execution (2x daily: 08:00, 18:00 KST)  
**Target SLA:** ≥ 90% within 5min  

```bash
# Check SLA history
jq '.checkpoints' metrics/metrics.json

# Expected pattern
# total: increments every 12 hours (2x daily)
# completed_within_sla: should equal total for healthy system
# sla_rate: should be 100.0% or close to it
```

**Healthy Indicators:**
- SLA rate ≥ 90%
- Most checkpoints complete in < 2 min
- No timeout-related failures

**Alert Actions:**
- If SLA rate < 90%: Checkpoint taking too long
  - Check: Phase 2 service availability
  - Check: Disk I/O performance (CTB writes)
  - Check: Queue backlog size
- If specific checkpoint fails: Review cron logs

---

## Real-time Monitoring

### Setup Local Dashboard (Optional)

```bash
# Watch metrics update every 5 seconds
watch -n 5 'jq ".memory, .errors, .checkpoints" metrics/metrics.json'

# Or use a simple loop
while true; do
  clear
  echo "=== Phase 2 Metrics Dashboard ==="
  date
  echo ""
  echo "Memory (MB):"
  jq '.memory' metrics/metrics.json | grep rss_mb
  echo ""
  echo "Error Rates:"
  jq '.errors' metrics/metrics.json | grep rate
  echo ""
  echo "SLA:"
  jq '.checkpoints.sla_rate' metrics/metrics.json
  sleep 5
done
```

### Log-based Monitoring

```bash
# Watch for ERROR/CRITICAL logs
tail -f logs/phase2a-service.log | grep -E "ERROR|CRITICAL"

# Watch queue metrics
tail -f logs/cron-orchestrator-*.log | grep -E "completed|failed"

# Count issues over 4 hours
grep "ERROR\|CRITICAL" logs/phase2a-service.log | wc -l  # Should be < 5
```

---

## Alert Rules

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Memory RSS | > 350MB | CRITICAL | Kill process, investigate leak, restart |
| Latency avg | > 5min | WARNING | Check gateway/disk performance |
| Collection rate | < 90% | WARNING | Verify gateway auth, network |
| Dedup rate | < 95% | WARNING | Check input format, duplicate logic |
| Calc rate | < 95% | WARNING | Verify trust score component inputs |
| Checkpoint SLA | < 90% | WARNING | Check phase2 service availability |
| Data checksum | Unexpected change | CRITICAL | Investigate file mutations |

---

## Troubleshooting Guide

### Issue: Memory growing > 50MB/hour

**Symptoms:** RSS increases continuously

**Root Causes:**
1. Queue not dequeuing (consumer not running)
2. Message size bloat (attachments/large objects)
3. Logging accumulation (despite INFO removal)

**Debug Steps:**
```bash
# Check queue length
node -e "const {FileQueue} = require('./queue'); console.log('Queue:', new FileQueue('./queue').health())"

# Check for consumer processes
ps aux | grep phase2b
ps aux | grep phase2c

# Check file sizes
ls -lh queue/ metrics/
du -sh /memory/*

# Restart queue
rm -rf queue/messages.jsonl
node -e "const {FileQueue} = require('./queue'); new FileQueue('./queue').clear()"
```

### Issue: Error rate < 90%

**Symptoms:** Collection failures spike

**Root Causes:**
1. Gateway auth expired (token invalid)
2. Network timeout (gateway unreachable)
3. Session not found (invalid sessionKey)

**Debug Steps:**
```bash
# Test gateway connectivity
curl -v http://localhost:3000/mcp/sessions_history \
  -H "Authorization: Bearer $GATEWAY_TOKEN"

# Check recent errors
tail -100 logs/phase2a-errors.log | grep -i "gateway\|auth\|timeout"

# Verify environment variables
echo $GATEWAY_URL
echo $GATEWAY_TOKEN
echo $MEMORY_DIR
```

### Issue: Checkpoint SLA < 90%

**Symptoms:** CTB/Checkpoint takes > 5 minutes

**Root Causes:**
1. Disk I/O bottleneck (CTB file write slow)
2. Phase 2 services hanging/unresponsive
3. Queue backlog too large

**Debug Steps:**
```bash
# Check disk I/O
iostat -x 1 10

# Check phase2a health
curl http://localhost:3009/health

# Check queue length
node -e "const {FileQueue} = require('./queue'); console.log(new FileQueue('./queue').length())"

# Check CTB write time
time ls -lh /memory/CTB_*.json
```

---

## Metrics Export (for external dashboards)

To integrate with external monitoring (Prometheus, DataDog, etc.):

```bash
# Expose metrics via HTTP
node -e "
const fs = require('fs');
const http = require('http');
const metrics = require('./metrics/metrics.json');

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(metrics));
}).listen(3012);

console.log('Metrics server on :3012');
"
```

Then scrape `http://localhost:3012` from your monitoring tool.

---

## Dashboard Maintenance

### Daily Tasks
- [ ] Review error rates (should be < 5% total)
- [ ] Check memory trend (should be stable ±25MB)
- [ ] Verify latest checkpoint SLA completed

### Weekly Tasks
- [ ] Analyze latency baseline (should be consistent)
- [ ] Review integrity checksums (should match)
- [ ] Check storage growth rate

### Monthly Tasks
- [ ] Archive old metrics (> 30 days)
- [ ] Capacity planning: Is growth sustainable?
- [ ] Tune thresholds based on production baseline

---

## Success Metrics

After deployment, the system should show:

✅ **Week 1:**
- Zero memory leaks (stable RSS)
- < 2% error rate across all stages
- 100% checkpoint SLA

✅ **Month 1:**
- Stable performance baseline established
- No data integrity issues
- Predictable latency (± 10% of baseline)

---

For detailed implementation: see `monitoring.js` source code
