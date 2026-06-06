#!/usr/bin/env node
/**
 * Phase 2C: Express Wrapper for Trust Score Calculator
 * Provides REST API interface for trust score calculation
 * Port: 3011 (configurable via PORT env var)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const trustCalc = require('./phase2c-trust-score-calculator.js');

const app = express();
const PORT = process.env.PORT || 3011;

const MEMORY_DIR = process.env.MEMORY_DIR ||
  '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory';
const DEDUP_INPUT = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');
const SCORES_OUTPUT = path.join(MEMORY_DIR, 'messages_with_scores.jsonl');

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const out = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch (_) {
      // skip malformed
    }
  }
  return out;
}

app.use(express.json({ limit: '50mb' }));

// State tracking
let startTime = Date.now();
let requestCount = 0;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    requests: requestCount
  });
});

// API: Calculate trust scores
// Body options:
//   { entries: [...] }          — explicit entries (legacy)
//   { source: 'file' }          — auto-read from MEMORY_DIR/messages_deduplicated.jsonl
//   { writeOutput: true }       — write annotated entries to MEMORY_DIR/messages_with_scores.jsonl
app.post('/api/calculate-trust-scores', (req, res) => {
  requestCount++;
  try {
    let { entries = [], source, writeOutput = false } = req.body || {};

    let inputFile = null;
    if (source === 'file') {
      inputFile = DEDUP_INPUT;
      entries = readJsonl(DEDUP_INPUT);
    }

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries must be an array' });
    }

    // Calculate trust scores for each entry
    const results = entries.map((entry, idx) => {
      try {
        // Extract timestamp from entry (collectedAt or lastModified)
        const timestamp = entry.collectedAt
          ? new Date(entry.collectedAt).getTime()
          : entry.lastModified
          ? new Date(entry.lastModified).getTime()
          : Date.now();

        // Calculate trust score using entry metadata
        const score = trustCalc.calculateTrustScore({
          timestamp: timestamp,
          frequency: 1, // Single entry, frequency = 1
          source: 'automated_collection',
          hasManualEdits: false,
        });

        // Determine decision based on score thresholds (aligned with Phase 2D)
        let decision = 'REJECT';
        if (score.score >= 50) {
          decision = 'ACCEPT';
        } else if (score.score >= 40) {
          decision = 'QUARANTINE';
        }

        return {
          index: idx,
          filename: entry.filename,
          trustScore: score,
          decision: decision,
          components: {
            ageDecay: trustCalc.ageDecay(timestamp),
            frequency: trustCalc.frequencyWeight(1),
            source: trustCalc.sourceReliability('automated_collection'),
            manualEdit: trustCalc.manualEditIndicator(false),
          },
        };
      } catch (error) {
        return {
          index: idx,
          filename: entry.filename,
          error: error.message,
          trustScore: 0,
        };
      }
    });

    // Summary stats (aligned with Phase 2D threshold of 50 for acceptance)
    const accepted = results.filter(r => r.trustScore.score >= 50).length;
    const quarantined = results.filter(r => r.trustScore.score >= 40 && r.trustScore.score < 50).length;
    const rejected = results.filter(r => r.trustScore.score < 40).length;

    // Optional file output for pipeline
    let outputFile = null;
    if (writeOutput) {
      try {
        if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
        // Annotate original entries with score + decision
        const annotated = entries.map((entry, idx) => ({
          ...entry,
          _trustScore: results[idx] ? results[idx].trustScore : null,
          _decision: results[idx] ? results[idx].decision : 'REJECT',
        }));
        const lines = annotated.map((e) => JSON.stringify(e)).join('\n') + (annotated.length ? '\n' : '');
        fs.writeFileSync(SCORES_OUTPUT, lines);
        outputFile = SCORES_OUTPUT;
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to write output file: ' + err.message,
        });
      }
    }

    res.json({
      success: true,
      total: results.length,
      processed: results.length,
      trust_scores_applied: results.filter((r) => r.trustScore && r.trustScore.score != null).length,
      accepted,
      quarantined,
      rejected,
      entries: results,
      inputFile,
      outputFile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API: Stats
app.get('/api/stats', (req, res) => {
  res.json({
    service: 'Phase 2C Trust Score Calculator',
    status: 'operational',
    uptime_ms: Date.now() - startTime,
    total_requests: requestCount,
    port: PORT,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Phase 2C Trust Score Calculator listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/calculate-trust-scores`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
