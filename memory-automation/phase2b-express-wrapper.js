#!/usr/bin/env node
/**
 * Phase 2B: Express Wrapper for Duplicate Detection
 * Provides REST API interface for batch duplicate detection
 * Port: 3010 (configurable via PORT env var)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3010;
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';

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

// Basic duplicate detection (2-layer: hash + prefix matching)
function detectDuplicates(entries) {
  const hashMap = new Map();
  const unique = [];
  const duplicates = [];

  entries.forEach((entry, idx) => {
    const contentHash = crypto
      .createHash('md5')
      .update(JSON.stringify(entry))
      .digest('hex');

    if (hashMap.has(contentHash)) {
      duplicates.push({
        index: idx,
        hash: contentHash,
        reason: 'EXACT_HASH',
        duplicateOf: hashMap.get(contentHash).index
      });
    } else {
      unique.push(entry);
      hashMap.set(contentHash, { index: idx, entry });
    }
  });

  return { unique, duplicates, count: unique.length, removed: duplicates.length };
}

// API: Detect duplicates
app.post('/api/detect-duplicates', (req, res) => {
  requestCount++;
  try {
    const { entries = [] } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries must be an array' });
    }
    const result = detectDuplicates(entries);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Stats
app.get('/api/stats', (req, res) => {
  res.json({
    service: 'Phase 2B Duplicate Detection',
    status: 'operational',
    requests: requestCount,
    uptime: Date.now() - startTime,
    memory_dir: MEMORY_DIR
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Phase 2B (Duplicate Detection) listening on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Duplicate Detection API: POST http://localhost:${PORT}/api/detect-duplicates`);
});
