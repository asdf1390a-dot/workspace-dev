#!/usr/bin/env node
/**
 * Phase 2C: Express Wrapper for Trust Score Calculator
 * Provides REST API interface for trust score calculation
 * Port: 3011 (configurable via PORT env var)
 */

const express = require('express');
const trustCalc = require('./phase2c-trust-score-calculator.js');

const app = express();
const PORT = process.env.PORT || 3011;

app.use(express.json());

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
app.post('/api/calculate-trust-scores', (req, res) => {
  requestCount++;
  try {
    const { entries = [] } = req.body;
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

        return {
          index: idx,
          filename: entry.filename,
          trustScore: score,
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

    // Summary stats
    const accepted = results.filter(r => r.trustScore >= 75).length;
    const quarantined = results.filter(r => r.trustScore >= 50 && r.trustScore < 75).length;
    const rejected = results.filter(r => r.trustScore < 50).length;

    res.json({
      success: true,
      total: results.length,
      accepted,
      quarantined,
      rejected,
      entries: results,
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
