# Phase 2C: Trust Score Calculator

**Memory Automation — Duplicate Detection Confidence Scoring**

Trust Score Calculator is a Node.js/Express service that computes confidence scores for duplicate detection results. It uses a 4-component weighted formula to assess how reliably two or more entries are duplicates of each other.

**Service:** trust-score-calculator.js  
**Port:** 3011  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

---

## 📊 Quick Start

### Installation
```bash
cd memory-automation
npm install
```

### Running the Service
```bash
# Foreground (for development)
npm start

# Background (with pm2)
pm2 start trust-score-calculator.js --name trust-scorer
pm2 logs trust-scorer
```

### Health Check
```bash
curl http://localhost:3011/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "trust-score-calculator",
  "version": "2.0.0",
  "uptime": 1.234,
  "timestamp": "2026-05-30T10:15:30.123Z"
}
```

---

## 🔄 Integration with Phase 2B (Duplicate Detection)

Phase 2B produces **duplicate clusters** (groups of similar entries) from three detection layers:

1. **Pattern Detection** — Exact string matching (e.g., identical SKU numbers)
2. **Fuzzy Matching** — String similarity matching (e.g., "SKU 123" ≈ "SKU123")
3. **Semantic Analysis** — Meaning-based matching (e.g., "JIG Part A" ≈ "Part A JIG")

Phase 2C takes these clusters and assigns a **trust score (0.0–1.0)** indicating confidence in the duplicate match.

### Data Flow Diagram

```
Phase 2B Output (Duplicate Clusters)
        ↓
        │ cluster = {
        │   type: "fuzzy_title",
        │   confidence: 0.88,
        │   indices: [12, 34],           ← indices into entry list
        │   matchType: "fuzzy_title"
        │ }
        ↓
Phase 2C Trust Score Calculator
        ↓
Trust Score Result (0.0–1.0)
        ↓
        │ result = {
        │   trustScore: 0.82,             ← final confidence
        │   components: {
        │     detection: 0.88,            ← from detection engine
        │     source: 0.90,               ← telegram is reliable
        │     temporal: 0.75,             ← entries ~3 days old
        │     coverage: 0.80              ← 2 detection layers matched
        │   },
        │   isReliable: true,             ← trustScore >= 0.75
        │   recommendedAction: "REVIEW_AND_MERGE"
        │ }
        ↓
Decision: Merge, Review, or Reject
```

### Integration Example

```javascript
const http = require('http');

// 1. Get duplicate clusters from Phase 2B
const clusters = [
  {
    type: 'fuzzy_content',
    confidence: 0.85,
    indices: [0, 1],
    matchType: 'fuzzy_content'
  }
];

// 2. Get entry data (source, timestamp, etc.)
const entries = [
  {
    id: 'msg_001',
    title: 'Asset SKU 123',
    content: 'JIG tooling part',
    source: 'telegram',
    timestamp: new Date().toISOString()
  },
  {
    id: 'msg_002',
    title: 'Asset SKU123',
    content: 'JIG tooling part',
    source: 'telegram',
    timestamp: new Date().toISOString()
  }
];

// 3. POST to Phase 2C trust calculator
const req = http.request({
  hostname: 'localhost',
  port: 3011,
  path: '/api/calculate-trust-scores',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Trust Score:', result.trustScores[0].trustScore);
    console.log('Recommendation:', result.trustScores[0].recommendedAction);
    // Use recommendedAction to decide: merge, review, or reject
  });
});

req.write(JSON.stringify({ clusters, entries }));
req.end();
```

---

## 📖 API Reference

### POST /api/calculate-trust-scores

Calculate trust scores for multiple duplicate clusters (batch processing).

**Request Body:**
```json
{
  "clusters": [
    {
      "type": "fuzzy_title",
      "confidence": 0.88,
      "indices": [0, 1],
      "duplicateIndices": [0, 1],
      "matchType": "fuzzy_title"
    },
    {
      "type": "semantic",
      "confidence": 0.87,
      "indices": [2, 3],
      "duplicateIndices": [2, 3],
      "matchType": "semantic"
    }
  ],
  "entries": [
    {
      "id": "msg_001",
      "source": "telegram",
      "title": "Asset SKU123",
      "timestamp": "2026-05-30T10:00:00Z"
    },
    {
      "id": "msg_002",
      "source": "telegram",
      "title": "Asset SKU 123",
      "timestamp": "2026-05-30T10:05:00Z"
    },
    {
      "id": "msg_003",
      "source": "api",
      "title": "Jig Fixture",
      "timestamp": "2026-05-30T11:00:00Z"
    },
    {
      "id": "msg_004",
      "source": "manual",
      "title": "Jig Fixture Tool",
      "timestamp": "2026-05-30T11:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "trustScores": [
    {
      "clusterId": "a7f3b291",
      "trustScore": 0.8573,
      "components": {
        "detection": 0.88,
        "source": 0.9,
        "temporal": 0.75,
        "coverage": 0.8
      },
      "cluster": { ... },
      "isReliable": true,
      "recommendedAction": "REVIEW_AND_MERGE"
    },
    {
      "clusterId": "c2e9d4f1",
      "trustScore": 0.7842,
      "components": {
        "detection": 0.87,
        "source": 0.95,
        "temporal": 0.7,
        "coverage": 1.0
      },
      "cluster": { ... },
      "isReliable": true,
      "recommendedAction": "REVIEW_AND_MERGE"
    }
  ],
  "stats": {
    "total": 2,
    "mean": 0.8208,
    "median": 0.8208,
    "min": 0.7842,
    "max": 0.8573,
    "reliable": 2,
    "needsReview": 0,
    "rejected": 0
  },
  "executionTime": 12
}
```

---

### POST /api/score-duplicate

Calculate trust score for a single duplicate cluster.

**Request Body:**
```json
{
  "cluster": {
    "type": "fuzzy_title",
    "confidence": 0.88,
    "indices": [0, 1],
    "matchType": "fuzzy_title"
  },
  "entries": [
    {
      "id": "msg_001",
      "source": "telegram",
      "timestamp": "2026-05-30T10:00:00Z"
    },
    {
      "id": "msg_002",
      "source": "discord",
      "timestamp": "2026-05-30T10:15:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "clusterId": "a7f3b291",
  "trustScore": 0.8573,
  "components": {
    "detection": 0.88,
    "source": 0.875,
    "temporal": 0.75,
    "coverage": 0.8
  },
  "isReliable": true,
  "recommendedAction": "REVIEW_AND_MERGE"
}
```

---

### GET /api/weights

Retrieve current trust score configuration (weights and source credibility mapping).

**Response:**
```json
{
  "detectionWeight": 0.40,
  "sourceWeight": 0.25,
  "temporalWeight": 0.20,
  "coverageWeight": 0.15,
  "sourceCredibilityMap": {
    "telegram": 0.90,
    "discord": 0.85,
    "api": 0.75,
    "manual": 0.95,
    "system": 0.70,
    "unknown": 0.50
  }
}
```

---

### GET /health

Service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "trust-score-calculator",
  "version": "2.0.0",
  "uptime": 123.456,
  "timestamp": "2026-05-30T10:15:30.123Z"
}
```

---

## 🧮 Trust Score Formula

The trust score combines four independent confidence scores using a weighted formula:

```
Trust Score = (0.40 × Detection) + (0.25 × Source) + (0.20 × Temporal) + (0.15 × Coverage)
```

All components are normalized to [0.0, 1.0] range, and the final score is clamped to [0.0, 1.0].

### Component 1: Detection Confidence (40% weight)

Confidence from the duplicate detection engine based on which layer(s) matched:

| Match Type | Confidence |
|---|---|
| exact_pattern, exact | 1.0 |
| fuzzy_title | 0.88 |
| semantic | 0.87 |
| fuzzy_content | 0.85 |

If cluster has explicit `confidence` field, it's averaged with type confidence.

**Rationale:** Pattern matching (exact/fuzzy) is most reliable; semantic matching is good but can have false positives.

### Component 2: Source Credibility (25% weight)

Reliability of the data source where entries originated:

| Source | Credibility | Rationale |
|---|---|---|
| manual | 0.95 | Highest — manually verified/curated |
| telegram | 0.90 | High — direct user input, fast feedback |
| discord | 0.85 | High — community verified |
| api | 0.75 | Medium — automated collection, may include noise |
| system | 0.70 | Medium — system-generated, less reliable |
| unknown | 0.50 | Low — credibility unclear |

If entries have different sources, the score is the **average** of their individual credibilities.

**Rationale:** Duplicates from trusted sources (manual curation, direct user input) are more likely to be correct.

### Component 3: Temporal Relevance (20% weight)

Recency and consistency of entries over time.

**Recency Score:**
- Fresh (0 days old): 1.0
- 5 days old: 0.3
- 8+ days old: 0.3 (clamped minimum)
- Formula: `score = max(0.3, 1.0 - (age_days / 5))`

**Consistency Bonus:**
- If all entries have similar age, consistency score = 1.0 (10% of final)
- If entries have widely different ages, consistency score ≈ 0.0 (penalizes mixed-age clusters)
- Formula: `variance = avg((recency[i] - mean_recency)^2)`

**Final Temporal Score:**
```
temporal = (0.90 × avg_recency) + (0.10 × consistency)
```

**Rationale:** Recent entries are more reliable. Consistency indicates the entries were captured together or represent the same state.

### Component 4: Layer Coverage (15% weight)

How many detection layers confirmed the match:

| Layers | Score |
|---|---|
| 1 layer (pattern OR fuzzy OR semantic) | 0.5 |
| 2 layers (pattern+fuzzy, fuzzy+semantic, etc.) | 0.8 |
| 3 layers (all matched) | 1.0 |

If cluster has `layers` object, count number of truthy values.

**Rationale:** Multiple independent confirmations increase confidence.

---

## 📋 Recommended Actions

Based on trust score, the calculator recommends an action:

| Score Range | Action | Notes |
|---|---|---|
| ≥ 0.95 | MERGE_IMMEDIATELY | 95%+ confidence; safe to auto-merge |
| 0.85–0.94 | MERGE_RECOMMENDED | 85%+ confidence; operator review optional |
| 0.75–0.84 | REVIEW_AND_MERGE | Requires operator review before merge |
| 0.60–0.74 | MANUAL_REVIEW | Significant uncertainty; manual assessment needed |
| < 0.60 | REJECT | Likely not a duplicate; keep separate |

**Merge Workflow Example:**
```javascript
const result = await fetch('http://localhost:3011/api/score-duplicate', {
  method: 'POST',
  body: JSON.stringify({cluster, entries})
}).then(r => r.json());

switch (result.recommendedAction) {
  case 'MERGE_IMMEDIATELY':
    await mergeEntries(cluster.indices); // Auto-merge
    break;
  case 'MERGE_RECOMMENDED':
    notifyOperator(`Merge recommended for ${cluster.clusterId}`);
    break;
  case 'REVIEW_AND_MERGE':
    addToReviewQueue(cluster.clusterId); // Operator review needed
    break;
  case 'MANUAL_REVIEW':
    requireManualDuplicateDetection(cluster); // Fallback to manual
    break;
  case 'REJECT':
    logNonDuplicate(cluster); // Not a duplicate
    break;
}
```

---

## 🔧 Configuration & Tuning

### Environment Variables

```bash
# Service configuration
PORT=3011                      # Express server port
NODE_ENV=production|development

# Trust score weights (optional; defaults shown)
DETECTION_WEIGHT=0.40
SOURCE_WEIGHT=0.25
TEMPORAL_WEIGHT=0.20
COVERAGE_WEIGHT=0.15

# Logging
LOG_LEVEL=info|debug|warn|error
```

### Adjusting Weights

If you want to emphasize certain factors, adjust weights in code:

```javascript
const calc = new TrustScoreCalculator({
  detectionWeight: 0.50,    // increase detection importance
  sourceWeight: 0.20,       // decrease source importance
  temporalWeight: 0.20,
  coverageWeight: 0.10      // decrease layer coverage importance
  // Weights must sum to 1.0
});
```

### Adjusting Source Credibility

If certain sources consistently produce false positives:

```javascript
// Reduce API source trust (often noisy bot data)
calculator.sourceCredibilityMap['api'] = 0.60;

// Increase manual trust for high-confidence sources
calculator.sourceCredibilityMap['manual'] = 0.98;
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test                    # Runs test-phase2c.js
node test-phase2c.js        # Run directly with detailed output
```

Test coverage:
- 11 component calculation tests
- 4 trust score integration tests
- 5 recommended action tests
- 3 summary statistics tests
- 2 weight validation tests
- 2 cluster ID generation tests
- 2 performance tests

**All 29 tests should pass.**

---

## 📊 Example Scenarios

### Scenario 1: High-Confidence Exact Match

```
Input:
- cluster: exact pattern match, confidence=1.0
- entries: both from telegram, same day

Calculation:
- Detection: 1.0 (exact pattern)
- Source: 0.90 (telegram credibility)
- Temporal: 0.95 (fresh, consistent)
- Coverage: 1.0 (exact pattern layer)

Trust Score = (0.40 × 1.0) + (0.25 × 0.90) + (0.20 × 0.95) + (0.15 × 1.0)
            = 0.40 + 0.225 + 0.19 + 0.15
            = 0.965

Action: MERGE_IMMEDIATELY (≥0.95)
```

### Scenario 2: Medium-Confidence Fuzzy Match with Mixed Sources

```
Input:
- cluster: fuzzy_title, confidence=0.88
- entries: one from telegram (0.90), one from api (0.75)
- timestamps: 1 day and 2 days ago

Calculation:
- Detection: (0.88 + 0.88) / 2 = 0.88
- Source: (0.90 + 0.75) / 2 = 0.825
- Temporal: 0.9 × 0.92 + 0.1 × 0.98 = 0.920
- Coverage: 0.8 (2 layers: fuzzy + assumption)

Trust Score = (0.40 × 0.88) + (0.25 × 0.825) + (0.20 × 0.920) + (0.15 × 0.8)
            = 0.352 + 0.206 + 0.184 + 0.12
            = 0.862

Action: MERGE_RECOMMENDED (0.85–0.94)
```

### Scenario 3: Low-Confidence Semantic Match

```
Input:
- cluster: semantic match, confidence=0.70
- entries: one from api, one from system, 8 and 5 days old
- Different sources

Calculation:
- Detection: 0.70
- Source: (0.75 + 0.70) / 2 = 0.725
- Temporal: 0.9 × 0.45 + 0.1 × 0.2 = 0.425 (old, inconsistent)
- Coverage: 0.5 (1 layer: semantic)

Trust Score = (0.40 × 0.70) + (0.25 × 0.725) + (0.20 × 0.425) + (0.15 × 0.5)
            = 0.28 + 0.181 + 0.085 + 0.075
            = 0.621

Action: MANUAL_REVIEW (0.60–0.74)
```

---

## 🔍 Debugging

### Check cluster structure
```bash
# Verify cluster has required fields
echo '{"cluster":{"type":"exact_pattern","confidence":1.0,"indices":[0,1],"matchType":"exact_pattern"},"entries":[]}' | \
  curl -X POST http://localhost:3011/api/score-duplicate \
    -H 'Content-Type: application/json' -d @- | jq .
```

### Check source mapping
```bash
# Verify all entry sources are in credibility map
curl http://localhost:3011/api/weights | jq .sourceCredibilityMap
```

### Monitor performance
```bash
# Test with increasing batch sizes
for size in 10 50 100 500 1000; do
  time curl -X POST http://localhost:3011/api/calculate-trust-scores \
    -H 'Content-Type: application/json' \
    -d "{\"clusters\": $(node -e "console.log(JSON.stringify(Array(${size}).fill({type:'fuzzy_title',confidence:0.88,indices:[0,1]})))")}"
done
```

---

## 📚 Related Documentation

- **Phase 2B (Duplicate Detection):** DUPLICATE_DETECTION_SPECIFICATION.md
- **Phase 2A (Message Collection):** README_PHASE2A.md
- **Deployment:** PHASE2C_DEPLOYMENT_CHECKLIST.md
- **Architecture:** MEMORY_AUTOMATION_PHASE2_DESIGN.md

---

## 📞 Support & Feedback

Issues or questions:
1. Check PHASE2C_DEPLOYMENT_CHECKLIST.md Troubleshooting section
2. Review trust score formula above
3. Run test suite: `npm test`
4. Check service health: `curl http://localhost:3011/health`

