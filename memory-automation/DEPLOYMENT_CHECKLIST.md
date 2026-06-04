# Phase 2 Refactoring — Deployment Checklist

**Version:** 1.0  
**Date:** 2026-06-04  
**Stability Target:** 4+ hours uptime, 0 INFO-level logs, all 5 metrics tracked

---

## Pre-Deployment (Development Environment)

### Code Quality
- [x] All 4 new modules created (queue.js, logger.js, monitoring.js, cron-orchestrator.js)
- [x] All 35 unit tests passing
- [x] Phase2a/2b/2c refactored to use new infrastructure
- [x] No console.log() remaining (use logger instead)
- [x] No INFO level logging (DEBUG/WARN/ERROR/CRITICAL only)

### Integration Testing
- [x] FileQueue: enqueue/dequeue/peek/metrics operations working
- [x] Logger: debug/warn/error/critical outputs to console + file
- [x] Monitoring: all 5 metrics (memory/latency/errors/integrity/SLA) tracking
- [x] CronOrchestrator: backup/checkpoint/audit tasks execute successfully

---

## Deployment Steps

### Step 1: Pre-flight Check (5 min)
- [ ] Verify current phase2a/2b/2c PIDs running
- [ ] Check memory usage: all under 150MB
- [ ] Verify /memory and /memory-automation directories readable
- [ ] Confirm no stale lock files

### Step 2: Initialize Queue Infrastructure (5 min)
```bash
mkdir -p /home/jeepney/.openclaw/workspace-dev/memory-automation/queue
mkdir -p /home/jeepney/.openclaw/workspace-dev/memory-automation/metrics
```
- [ ] Queue directory created
- [ ] Metrics directory created
- [ ] Both directories writable

### Step 3: Stop Current Services (2 min)
```bash
# Save current PIDs
ps aux | grep "phase2[a-c]"

# Kill gracefully (30 sec timeout, then SIGKILL)
kill -0 $(cat phase2a.pid) 2>/dev/null && kill -15 $(cat phase2a.pid)
kill -0 $(cat phase2b.pid) 2>/dev/null && kill -15 $(cat phase2b.pid)
kill -0 $(cat phase2c.pid) 2>/dev/null && kill -15 $(cat phase2c.pid)

sleep 5
pkill -9 -f "phase2[a-c]"
```
- [ ] phase2a stopped
- [ ] phase2b stopped
- [ ] phase2c stopped
- [ ] All ports (3009, 3010, 3011) available

### Step 4: Start New Services (3 min)
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation

# Start phase2a with queue support
PORT=3009 node phase2a-message-collection.js > logs/phase2a-service.log 2>&1 &
echo $! > phase2a.pid

# Optional: start phase2b as independent consumer
# PORT=3010 node phase2b-duplicate-detection.js > logs/phase2b-service.log 2>&1 &
# echo $! > phase2b.pid

# Optional: start phase2c as independent consumer
# PORT=3011 node phase2c-trust-score-calculator.js > logs/phase2c-service.log 2>&1 &
# echo $! > phase2c.pid
```
- [ ] phase2a process started (PID saved)
- [ ] Health check: curl http://localhost:3009/health
- [ ] Queue directory accessible
- [ ] Metrics directory accessible

### Step 5: Verify Integration (5 min)
```bash
# Check API responses
curl http://localhost:3009/api/status | jq '.'

# Test message enqueue
curl -X POST http://localhost:3009/api/collect-messages \
  -H "Content-Type: application/json" \
  -d '{"sessionKey":"test","limit":10}'

# Verify queue contains messages
node -e "const {FileQueue} = require('./queue'); const q = new FileQueue('./queue'); console.log('Queue length:', q.length())"

# Verify metrics tracked
cat metrics/metrics.json | jq '.errors'
```
- [ ] Health endpoint responds (status: ready)
- [ ] Status endpoint shows messagesEnqueued > 0
- [ ] Queue directory contains messages.jsonl
- [ ] metrics/metrics.json updated with statistics

### Step 6: Monitor for Stability (4+ hours)
```bash
# Watch logs for errors
tail -f logs/phase2a-service.log | grep -E "ERROR|CRITICAL"

# Check memory growth
watch -n 60 'ps aux | grep phase2a'

# Check cron logs
tail -f memory/logs/cron-orchestrator-*.log
```
- [ ] No ERROR or CRITICAL logs in 4+ hours
- [ ] Memory stays under 200MB (RSS)
- [ ] Queue metrics show consistent enqueue/dequeue
- [ ] No parse errors in queue.js

### Step 7: Enable Cron Jobs (Optional)
```bash
# Add to crontab
0 */2 * * * cd /home/jeepney/.openclaw/workspace-dev/memory-automation && node -e "const {CronOrchestrator} = require('./cron-orchestrator'); const o = new CronOrchestrator(); o.runCollectionCycle();" 2>&1 | tee -a logs/cron.log

0 8,18 * * * cd /home/jeepney/.openclaw/workspace-dev/memory-automation && node -e "const {CronOrchestrator} = require('./cron-orchestrator'); const o = new CronOrchestrator(); o.runCheckpoint();" 2>&1 | tee -a logs/cron.log

0 */6 * * * cd /home/jeepney/.openclaw/workspace-dev/memory-automation && node -e "const {CronOrchestrator} = require('./cron-orchestrator'); const o = new CronOrchestrator(); o.runBackup();" 2>&1 | tee -a logs/cron.log

0 3 * * * cd /home/jeepney/.openclaw/workspace-dev/memory-automation && node -e "const {CronOrchestrator} = require('./cron-orchestrator'); const o = new CronOrchestrator(); o.runIntegrityAudit();" 2>&1 | tee -a logs/cron.log
```
- [ ] Cron jobs added to crontab
- [ ] Log files created in logs/cron-orchestrator-*.log
- [ ] No cron execution errors

---

## Health Checks

### Memory Usage
```bash
ps aux | grep phase2a | grep -v grep | awk '{print $6}'  # Should be < 200MB
```
**Target:** < 200MB RSS (baseline ~50MB, growth < 150MB in 4 hours)

### Queue Status
```bash
node -e "const {FileQueue} = require('./queue'); const q = new FileQueue('./queue'); console.log(JSON.stringify(q.health(), null, 2))"
```
**Target:** queue_length manageable, no expired messages

### Monitoring Dashboard
```bash
cat metrics/metrics.json | jq '.checkpoints, .errors, .memory'
```
**Targets:**
- Checkpoint SLA: ≥ 90%
- Collection error rate: ≥ 95%
- Memory RSS: < 200MB

### Log Analysis
```bash
# No INFO logs
grep "\[INFO\]" logs/phase2a-service.log | wc -l  # Should be 0

# Count errors/warnings
grep -E "\[ERROR\]|\[CRITICAL\]" logs/phase2a-service.log | wc -l  # Should be < 5 in 4 hours
```

---

## Rollback Plan

If deployment fails at any step:

### Rollback Option 1: Use Previous Code
```bash
git stash  # Discard refactored code
git checkout HEAD~2  # Revert to last stable
./phase2-services-startup.sh
```

### Rollback Option 2: Keep Refactored Code, Disable Queue
```bash
# Comment out queue integration in phase2a
# Change phase2b input back to /memory/messages.jsonl
# Restart services
```

### Verification After Rollback
```bash
curl http://localhost:3009/health
ps aux | grep phase2[a-c]
tail -f memory/logs/*.log
```

---

## Success Criteria

- [x] All 35 unit tests passing
- [ ] Phase 2 services stable for 4+ hours without restart
- [ ] Zero INFO-level logs in service logs
- [ ] Memory usage stable (no growth > 50MB/hour)
- [ ] Queue operations: 0 parse errors, 0 expired messages
- [ ] Error rate: < 5% for collection/dedup/calculation
- [ ] Checkpoint SLA: ≥ 90% completion within 5 min

---

## Post-Deployment Tasks

### Week 1
- Monitor phase2a/2b/2c stability continuously
- Review monitoring metrics dashboard daily
- Validate data integrity: checksums match across runs
- Verify cron jobs execute successfully

### Week 2
- Analyze performance baseline (memory, latency, throughput)
- Tune queue TTL if messages expiring too frequently
- Optimize logging verbosity if DEBUG too noisy

### Ongoing
- Weekly checkpoint SLA audit
- Monthly integrity verification
- Quarterly capacity planning (monitor growth trends)

---

## Contact & Support

**On-Call:** Claude Bot (deployed via CI/CD)  
**Monitoring:** `/home/jeepney/.openclaw/workspace-dev/memory-automation/metrics/metrics.json`  
**Logs:** `/home/jeepney/.openclaw/workspace-dev/memory/logs/`  
**Issues:** Create git issue with error logs + metrics dump
