#!/usr/bin/env node
/**
 * Phase 2B: Express Wrapper for Duplicate Detection Engine
 * Provides REST API interface for duplicate detection
 * Port: 3010 (configurable via PORT env var)
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { FileQueue } = require('./queue');

const app = express();
const PORT = process.env.PORT || 3010;

// Memory output directory (where pipeline files live)
const MEMORY_DIR = process.env.MEMORY_DIR ||
  '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory';
const QUEUE_DIR = process.env.QUEUE_DIR || path.join(__dirname, 'queue');
const DEDUP_OUTPUT = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');

// Lazy queue init
let queue = null;
function getQueue() {
  if (!queue) queue = new FileQueue(QUEUE_DIR);
  return queue;
}

app.use(express.json({ limit: '50mb' }));

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
// Body options:
//   { entries: [...] }                              — explicit entries (legacy)
//   { source: 'queue' }                             — auto-read from FileQueue (dequeueAll)
//   { writeOutput: true }                           — write deduped entries to MEMORY_DIR/messages_deduplicated.jsonl
app.post('/api/detect-duplicates', (req, res) => {
  requestCount++;
  try {
    let { entries = [], source, writeOutput = false } = req.body || {};

    // Auto-read from queue if requested
    let queueDrained = 0;
    if (source === 'queue') {
      const q = getQueue();
      const queued = q.dequeueAll();
      queueDrained = queued.length;
      // Flatten queue envelope: { id, timestamp, data: { type, data: {...}, filename } }
      // Surface 'content' for hashing: use inner data.content or stringified inner data
      entries = queued.map((m) => {
        const inner = m && m.data ? m.data : m;
        const payload = inner && inner.data ? inner.data : inner;
        const content =
          (payload && payload.content) ||
          (typeof inner.content === 'string' ? inner.content : '') ||
          JSON.stringify(payload || inner);
        return {
          ...payload,
          _queueId: m.id,
          _queueTimestamp: m.timestamp,
          _envelopeType: inner.type,
          filename: payload && payload.filename ? payload.filename : (inner && inner.filename) || undefined,
          content,
        };
      });
    }

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries must be an array' });
    }

    if (entries.length === 0) {
      // Still write an empty file if requested (so downstream sees zero)
      if (writeOutput) {
        try {
          if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
          fs.writeFileSync(DEDUP_OUTPUT, '');
        } catch (_) {}
      }
      return res.json({
        success: true,
        unique: [],
        duplicates: [],
        deduped_entries: [],
        count: 0,
        removed: 0,
        queueDrained,
        outputFile: writeOutput ? DEDUP_OUTPUT : null,
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

    const dedupedEntries = layer2Result.unique;

    // Optional file output for downstream Phase 2C
    let outputFile = null;
    if (writeOutput) {
      try {
        if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
        const lines = dedupedEntries.map((e) => JSON.stringify(e)).join('\n') + (dedupedEntries.length ? '\n' : '');
        fs.writeFileSync(DEDUP_OUTPUT, lines);
        outputFile = DEDUP_OUTPUT;
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to write output file: ' + err.message,
        });
      }
    }

    res.json({
      success: true,
      unique: dedupedEntries,
      deduped_entries: dedupedEntries,
      duplicates: allDuplicates,
      count: layer2Result.count,
      removed: layer1Result.removed + layer2Result.removed,
      queueDrained,
      outputFile,
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
