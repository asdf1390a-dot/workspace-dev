#!/usr/bin/env node
/**
 * Phase 2B: Express Wrapper for Duplicate Detection Engine
 * Provides REST API interface for duplicate detection
 * Port: 3010 (configurable via PORT env var)
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());

// State tracking
let startTime = Date.now();
let requestCount = 0;

// Duplicate Detection Logic (extracted from phase2b-duplicate-detection.js)

function normalizeText(text) {
  return text.toLowerCase().trim();
}

function layer1ExactMatching(entries) {
  const hashMap = new Map();
  const unique = [];
  const duplicates = [];

  entries.forEach((entry, idx) => {
    // Calculate MD5 hash of content
    const contentHash = crypto
      .createHash('md5')
      .update(entry.content || JSON.stringify(entry))
      .digest('hex');

    if (hashMap.has(contentHash)) {
      duplicates.push({
        index: idx,
        hash: contentHash,
        reason: 'EXACT_HASH',
        duplicateOf: hashMap.get(contentHash).index,
      });
    } else {
      unique.push({
        ...entry,
        _hash: contentHash,
        _layer1_unique: true,
      });
      hashMap.set(contentHash, { index: idx, entry });
    }
  });

  return {
    unique,
    duplicates,
    count: unique.length,
    removed: duplicates.length,
    method: 'LAYER1_EXACT',
  };
}

function layer2PrefixMatching(uniqueEntries, prefixLen = 80) {
  const prefixMap = new Map();
  const unique = [];
  const duplicates = [];

  uniqueEntries.forEach((entry, idx) => {
    const text = entry.content || JSON.stringify(entry);
    const normalized = normalizeText(text);
    const prefix = normalized.substring(0, prefixLen);

    if (prefixMap.has(prefix)) {
      duplicates.push({
        index: idx,
        reason: 'PREFIX_MATCH',
        duplicateOf: prefixMap.get(prefix).index,
        prefixLen,
      });
    } else {
      unique.push(entry);
      prefixMap.set(prefix, { index: idx, entry });
    }
  });

  return {
    unique,
    duplicates,
    count: unique.length,
    removed: duplicates.length,
    method: 'LAYER2_PREFIX',
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    requests: requestCount,
  });
});

// API: Detect duplicates
app.post('/api/detect-duplicates', (req, res) => {
  requestCount++;
  try {
    const { entries = [] } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries must be an array' });
    }

    if (entries.length === 0) {
      return res.json({
        success: true,
        unique: [],
        duplicates: [],
        count: 0,
        removed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Run Layer 1: Exact Hash Matching
    const layer1Result = layer1ExactMatching(entries);

    // Run Layer 2: Prefix Matching
    const layer2Result = layer2PrefixMatching(layer1Result.unique, 80);

    // Combine duplicate reports
    const allDuplicates = [...layer1Result.duplicates];
    layer2Result.duplicates.forEach((dup) => {
      allDuplicates.push({
        ...dup,
        layer: 2,
      });
    });

    res.json({
      success: true,
      unique: layer2Result.unique,
      duplicates: allDuplicates,
      count: layer2Result.count,
      removed: layer1Result.removed + layer2Result.removed,
      layer1: {
        unique: layer1Result.count,
        duplicates: layer1Result.removed,
      },
      layer2: {
        unique: layer2Result.count,
        duplicates: layer2Result.removed,
      },
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
    service: 'Phase 2B Duplicate Detection',
    status: 'operational',
    uptime_ms: Date.now() - startTime,
    total_requests: requestCount,
    port: PORT,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Phase 2B Duplicate Detection listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/detect-duplicates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
