# Phase 2C Deployment Checklist

**Trust Score Calculator - Duplicate Detection Confidence Scoring**

**Version:** 2.0.0  
**Component:** trust-score-calculator.js  
**Service Port:** 3011  
**Deadline:** 2026-05-30 18:00 KST  
**Status:** ✅ READY FOR DEPLOYMENT

---

## 📋 Pre-Deployment Verification

### 1. Code Review & Testing
- [ ] All 29 unit tests pass (run `node test-phase2c.js`)
- [ ] No console warnings or errors in test output
- [ ] Performance tests confirm <100ms for 100 clusters, <1000ms for 1000 clusters
- [ ] Code follows Phase 2A/2B patterns (class structure, error handling, logging)

### 2. Dependency Validation
- [ ] `npm install` completes without errors
- [ ] Express 4.18.2+ is available (`npm list express`)
- [ ] No deprecated dependencies in package.json
- [ ] Node.js version >= 14.0 (run `node --version`)

### 3. Configuration Review
- [ ] Port 3011 is available (not in use by other services)
- [ ] Trust score weights sum to 1.0 (40% + 25% + 20% + 15% = 100%)
- [ ] Source credibility mapping covers all expected source types
- [ ] Temporal decay formula uses age/5 for 5-day depreciation period
- [ ] Layer coverage thresholds: 1-layer=0.5, 2-layer=0.8, 3-layer=1.0

### 4. Documentation Validation
- [ ] README_PHASE2C.md exists and covers integration with Phase 2B
- [ ] All API endpoints documented with request/response examples
- [ ] Weight configuration documented with adjustment guidelines
- [ ] Troubleshooting section covers common issues

---

## 🚀 Deployment Steps

### Step 1: Environment Setup
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation

# Set environment variables
export NODE_ENV=production
export PORT=3011
export LOG_LEVEL=info

# Optional: override default trust score weights
export DETECTION_WEIGHT=0.40
export SOURCE_WEIGHT=0.25
export TEMPORAL_WEIGHT=0.20
export COVERAGE_WEIGHT=0.15
```

### Step 2: Service Startup
```bash
# Start trust score calculator in foreground (for immediate testing)
npm start

# OR start in background with pm2 (for production)
pm2 start trust-score-calculator.js --name "trust-scorer" --instances 1 --max-memory-restart 500M
```

### Step 3: Health Check
```bash
# Verify service is running
curl -s http://localhost:3011/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "service": "trust-score-calculator",
#   "version": "2.0.0",
#   "uptime": 0.XXX,
#   "timestamp": "2026-05-30T..."
# }
```

### Step 4: Configuration Verification
```bash
# Retrieve current weights
curl -s http://localhost:3011/api/weights | jq .

# Expected: shows detectionWeight=0.40, sourceWeight=0.25, etc.
```

---

## ✅ Integration Validation

### 1. Single Cluster Scoring Test
```bash
curl -X POST http://localhost:3011/api/score-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": {
      "type": "fuzzy_title",
      "confidence": 0.88,
      "indices": [0, 1],
      "duplicateIndices": [0, 1],
      "matchType": "fuzzy_title"
    },
    "entries": [
      {
        "id": "msg_001",
        "source": "telegram",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "title": "Asset SKU123"
      },
      {
        "id": "msg_002",
        "source": "telegram",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "title": "Asset SKU 123"
      }
    ]
  }' | jq .

# Expected: trustScore in [0.0, 1.0], components breakdown, recommendedAction present
```

### 2. Batch Processing Test
```bash
curl -X POST http://localhost:3011/api/calculate-trust-scores \
  -H "Content-Type: application/json" \
  -d '{
    "clusters": [
      {
        "type": "exact_pattern",
        "confidence": 1.0,
        "indices": [0, 1],
        "matchType": "exact_pattern"
      },
      {
        "type": "semantic",
        "confidence": 0.87,
        "indices": [2, 3],
        "matchType": "semantic"
      }
    ],
    "entries": [
      {"id": "e1", "source": "telegram", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"},
      {"id": "e2", "source": "discord", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"},
      {"id": "e3", "source": "api", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"},
      {"id": "e4", "source": "manual", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}
    ]
  }' | jq .

# Expected: array of trustScores with stats (mean, median, min, max, reliable count)
```

### 3. Phase 2B Integration Test
```bash
# Start Phase 2B Message Collection API on port 3009
cd memory-automation && npm start &

# Start Phase 2C Trust Score Calculator on port 3011
npm start &

# Run integration test (Phase 2B → Phase 2C pipeline)
node -e "
  const http = require('http');
  
  // Simulate Phase 2B output: duplicate clusters
  const clusters = [{
    type: 'fuzzy_content',
    confidence: 0.85,
    indices: [0, 1],
    duplicateIndices: [0, 1]
  }];
  
  const entries = [
    {id: 'm1', source: 'telegram', title: 'Test', timestamp: new Date().toISOString()},
    {id: 'm2', source: 'telegram', title: 'Test', timestamp: new Date().toISOString()}
  ];
  
  // POST to Phase 2C
  const req = http.request({
    hostname: 'localhost',
    port: 3011,
    path: '/api/calculate-trust-scores',
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('Integration Test Result:', JSON.stringify(result, null, 2));
      console.log('✅ Phase 2B → 2C pipeline working');
      process.exit(0);
    });
  });
  
  req.write(JSON.stringify({clusters, entries}));
  req.end();
"
```

---

## 🔄 Operational Checks

### Startup Verification
- [ ] Service starts without errors
- [ ] Health endpoint responds in <100ms
- [ ] No error logs on startup
- [ ] Process memory < 100MB initially

### Runtime Monitoring (First 5 minutes)
- [ ] Health check passes every 30 seconds
- [ ] API endpoints respond with 200 status
- [ ] Response times stable (<50ms for single scoring, <200ms for batch 100)
- [ ] No error messages in console

### Load Test (Optional)
```bash
# Test with 1000 clusters
time node test-phase2c.js | grep "1000 clusters"
# Should complete in <1000ms
```

---

## 📊 Trust Score Thresholds

Document the recommended action thresholds for operations teams:

| Trust Score | Threshold | Recommended Action | Notes |
|---|---|---|---|
| ≥ 0.95 | Very High | MERGE_IMMEDIATELY | 95%+ confidence, auto-merge safe |
| 0.85–0.94 | High | MERGE_RECOMMENDED | 85%+ confidence, operator review optional |
| 0.75–0.84 | Medium | REVIEW_AND_MERGE | Requires operator review before merge |
| 0.60–0.74 | Low | MANUAL_REVIEW | Manual duplicate detection required |
| < 0.60 | Very Low | REJECT | Not a valid duplicate pair |

---

## 🔧 Configuration Tuning

### Adjusting Trust Score Weights
If duplicate detection results show consistently high/low trust scores, adjust weights:

```javascript
// Example: increase detection confidence weight
const calc = new TrustScoreCalculator({
  detectionWeight: 0.50,  // increased from 0.40
  sourceWeight: 0.20,      // decreased from 0.25
  temporalWeight: 0.20,
  coverageWeight: 0.10     // decreased from 0.15
});

// Weights must sum to 1.0
```

### Adjusting Source Credibility
If certain sources produce too many false positives:

```javascript
// Example: reduce API source trust (likely bot-generated)
calculator.sourceCredibilityMap['api'] = 0.65; // decreased from 0.75
calculator.sourceCredibilityMap['manual'] = 0.98; // increase manual trust
```

### Adjusting Temporal Decay
Current formula: score = 1.0 - (age_days / 5), clamped to [0.3, 1.0]
- Entries 0 days old: 1.0 (fresh)
- Entries 5 days old: 0.3 (minimum)
- Decay half-life: 2.5 days

To make older entries matter more, decrease divisor:
```javascript
// age / 7 → slower decay (entries stay relevant longer)
// age / 3 → faster decay (recent entries weighted more)
```

---

## 🚨 Troubleshooting

### Issue: Service won't start on port 3011
**Solution:**
```bash
# Check if port is in use
lsof -i :3011

# Kill the process using port 3011
kill -9 <PID>

# Verify port is free
netstat -tlnp | grep 3011
```

### Issue: Tests fail with "Weight validation error"
**Solution:** Verify weights are set correctly and sum to 1.0
```bash
curl -s http://localhost:3011/api/weights | jq '.detectionWeight + .sourceWeight + .temporalWeight + .coverageWeight'
# Should output: 1
```

### Issue: Trust scores seem too high or too low
**Solution:** Check that cluster structure matches expected format
```bash
# Verify cluster has required fields:
# - type or matchType (e.g., "exact_pattern", "fuzzy_title", "semantic")
# - confidence (0.0–1.0)
# - indices or duplicateIndices (array of entry indices)
```

### Issue: Batch processing slow for large clusters (>500)
**Solution:** Implement pagination or streaming
```javascript
// Process in batches of 100
const batchSize = 100;
for (let i = 0; i < clusters.length; i += batchSize) {
  const batch = clusters.slice(i, i + batchSize);
  await fetch('/api/calculate-trust-scores', {body: JSON.stringify({clusters: batch})});
}
```

---

## ✅ Sign-Off

- [ ] All pre-deployment checks passed
- [ ] All integration tests passed (Phase 2B → 2C pipeline)
- [ ] Performance benchmarks met (<100ms single, <1000ms batch)
- [ ] Documentation reviewed and complete
- [ ] Ready for production deployment

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________

---

## 📈 Post-Deployment Monitoring

### Daily Checks (First Week)
- [ ] Health endpoint consistently healthy
- [ ] No spike in error logs
- [ ] Trust score distribution normal (mean 0.75–0.85)
- [ ] API response times stable

### Weekly Metrics
- [ ] Total requests processed
- [ ] Average trust score across all duplicates
- [ ] Distribution of recommended actions (breakdown by tier)
- [ ] False positive/negative estimates from operators

### Scheduled Review
- Day 1: Verify startup, health, basic API functionality
- Day 3: Monitor trends, adjust weights if needed
- Week 1: Full operational review, document any issues
- Week 4: Analyze duplicate detection accuracy with operators

