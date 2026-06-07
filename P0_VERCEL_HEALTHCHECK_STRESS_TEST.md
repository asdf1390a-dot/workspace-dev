# 🧪 P0 Vercel Health Check — 24-Hour Stress Test Plan

**Status:** ✅ DEPLOYED @ 14:08 KST  
**Feature:** Vercel HTTP 200 health check in CTB polling cycle  
**Test Window:** 2026-06-07 14:08 → 2026-06-08 14:08 KST (24 hours)  
**Owner:** CTB Polling System + DevOps  
**Success Criteria:** HTTP failures detected ≤5 min, zero false positives

---

## 📋 Test Scenarios

### Scenario 1: Normal Operation (Passive Monitoring)
**Duration:** 2026-06-07 14:08 → 2026-06-07 22:00 KST (8 hours)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Vercel HTTP | 200 | 200 | ✅ PASS |
| Detection latency | ≤ 5 min | Monitored | 🟡 In progress |
| False positives | 0 | TBD | 🟡 In progress |
| Log entries | Clear | TBD | 🟡 In progress |

**Actions:**
- Run CTB polling cycle every 5 minutes
- Monitor for false positives (network glitches triggering alerts)
- Verify Vercel HTTP 200 consistently detected
- Count: At least 96 polling cycles (5min interval × 8hr)

---

### Scenario 2: Intentional Failure Testing
**Duration:** 2026-06-07 22:00 → 2026-06-08 06:00 KST (8 hours)

**Test 1: Simulate HTTP 404 (like the incident)**
```bash
# Step 1: Break Vercel by reverting redirect fix
cd dsc-fms-portal
git revert <commit> # Revert root redirect change
npm run build
vercel deploy --prod

# Step 2: Monitor detection
# Expected: CTB detects HTTP 404 in next cycle (≤5 min)
# Verify: Log shows "CRITICAL: Vercel deployment health check failed — HTTP 404"

# Step 3: Fix and revert
git reset --hard # Restore working redirect
npm run build
vercel deploy --prod
# Expected: CTB detects HTTP 200 again within 5 min
```

**Test 2: Network Timeout Simulation**
```bash
# Use firewall rule to block HTTPS on port 443 temporarily
# Expected: CTB detects timeout (curl returns non-200)
# Verify: Alert appears in logs
# Then unblock and verify recovery
```

**Test 3: DNS Failure Simulation**
```bash
# Temporarily redirect DNS for dsc-fms-portal.vercel.app
# Expected: CTB detects connection failure
# Verify: Logged as CRITICAL alert
# Then restore DNS and verify recovery
```

| Scenario | Expected Detection | Actual | Status |
|----------|---|---|---|
| HTTP 404 | ≤5 min (1 cycle) | TBD | 🟡 Testing |
| Network timeout | ≤5 min (1 cycle) | TBD | 🟡 Testing |
| DNS failure | ≤5 min (1 cycle) | TBD | 🟡 Testing |
| Recovery detection | ≤5 min after fix | TBD | 🟡 Testing |

---

### Scenario 3: False Positive Prevention
**Duration:** 2026-06-08 06:00 → 2026-06-08 14:08 KST (8 hours)

**Objective:** Ensure no false alerts during normal operation

| Source | Expected | Threshold | Actual | Pass? |
|--------|---|---|---|---|
| Network glitches | 0 alerts | <2 transient errors | TBD | 🟡 Testing |
| CDN cache issues | 0 alerts | No sustained failures | TBD | 🟡 Testing |
| Vercel platform maintenance | 0 alerts | Graceful degradation only | TBD | 🟡 Testing |

**Actions:**
- Run normal monitoring for 8 hours
- Expect ≥0 Vercel HTTP 200 readings
- Flag any false "BROKEN" alerts
- If >2 false positives: ROLLBACK

---

## ✅ Success Metrics

| Metric | Target | Pass Criteria |
|--------|--------|---|
| **Detection Latency** | ≤5 minutes | Any Vercel HTTP ≠ 200 detected in next CTB cycle |
| **Accuracy** | 100% | HTTP 200 → "OK", anything else → "BROKEN (HTTP XXX)" |
| **False Positives** | <2 | ≤1 false alert during 24h window acceptable |
| **False Negatives** | 0 | ALL intentional failures detected |
| **Recovery Detection** | ≤5 minutes | When Vercel fixed, HTTP 200 detected within 1 cycle |
| **Log Quality** | Clear records | All state transitions logged with HTTP code |

---

## 📊 Monitoring Dashboard

**CTB Polling Cycle:**
```
Every 5 minutes:
  ✅ Phase2A (3009): LISTEN
  ✅ Phase2B (3010): LISTEN
  ✅ Phase2C (3011): LISTEN
  [NEW] Vercel HTTPS: HTTP 200 expected
```

**Status File (.ctb-state.json):**
```json
{
  "production": {
    "vercel": "OK|BROKEN (HTTP XXX)",
    "vercel_http": "200|404|500|..."
  }
}
```

**Alert Trigger:**
- If `vercel_http ≠ 200` → Log: "🚨 CRITICAL: Vercel deployment health check failed"
- If alert triggered 2+ times in 5min → Escalate (potential incident)

---

## 🔄 Rollback Plan

If false positives exceed threshold:

```bash
# Revert P0 fix
git revert 10676ed9
bash memory-automation/ctb-auto-update.sh

# Back to local-only monitoring
# No Vercel HTTP check
```

**Decision Gate:** If >2 false positives in first 8 hours → ROLLBACK

---

## 📅 Test Schedule

| Time | Phase | Action | Metric |
|------|-------|--------|--------|
| 14:08-22:00 | Scenario 1 | Passive monitoring | 96 cycles, zero alerts (normal) |
| 22:00-06:00 | Scenario 2 | Intentional failures | 3/3 tests detected ≤5min |
| 06:00-14:08 | Scenario 3 | Stability check | <2 false positives |
| 14:08 | **Sign-off** | **Decision: KEEP or ROLLBACK** | **Success metric 3/3 ✅** |

---

## 🎯 Success Definition

**PASS IF ALL TRUE:**
- ✅ HTTP 404 detected within 5 minutes
- ✅ HTTP 200 recovery detected within 5 minutes
- ✅ <2 false positives during 24h window
- ✅ Zero deployment incidents caused by P0 change

**FAIL IF ANY TRUE:**
- ❌ Detection latency > 5 minutes
- ❌ >2 false positives
- ❌ Rollback needed due to side effects

---

**Test Initiated:** 2026-06-07 14:08 KST  
**Validation Deadline:** 2026-06-08 14:08 KST  
**Owner:** Phase C + DevOps  
**Status:** 🟢 **IN PROGRESS**
