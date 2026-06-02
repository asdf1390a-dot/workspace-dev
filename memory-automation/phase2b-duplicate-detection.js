#!/usr/bin/env node
/**
 * Phase 2B: Duplicate Detection Engine (SIMPLIFIED)
 * 입력: /memory/messages.jsonl
 * 처리: 2-layer duplicate detection (Exact Hash + Fast Prefix Matching)
 * 출력: /memory/messages_deduplicated.jsonl
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const INPUT_FILE = path.join(MEMORY_DIR, 'messages.jsonl');
const OUTPUT_FILE = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');
const LOG_DIR = path.join(MEMORY_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, `phase2b-dedup-${new Date().toISOString().split('T')[0]}.log`);

// ============================================================================
// LOGGER
// ============================================================================

function log(level, msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${msg}`;
  console.log(logMsg);
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logMsg + '\n');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

// ============================================================================
// DUPLICATE DETECTION ENGINE (MODULAR)
// ============================================================================

class DuplicateDetectionEngine {
  constructor(prefixLen = 80) {
    this.prefixLen = prefixLen;
  }

  /**
   * Run full deduplication pipeline: Layer 1 + Layer 2
   */
  deduplicate(messages) {
    const layer1Result = this.layer1ExactMatching(messages);
    const layer2Result = this.layer2PrefixMatching(layer1Result.unique);

    return {
      original: messages.length,
      layer1: layer1Result,
      layer2: layer2Result,
      final: {
        unique: layer2Result.unique,
        totalRemoved: layer1Result.removed + layer2Result.removed,
        allDuplicates: [...layer1Result.duplicates, ...layer2Result.duplicates],
      },
    };
  }

  /**
   * Layer 1: Exact Hash Matching (O(n))
   */
  layer1ExactMatching(messages) {
    const hashMap = new Map();
    const unique = [];
    const duplicates = [];

    messages.forEach((msg, idx) => {
      const contentHash = msg.hash || this.computeHash(msg);
      if (hashMap.has(contentHash)) {
        duplicates.push({
          index: idx,
          hash: contentHash,
          sourceFile: msg.sourceFile,
          reason: 'EXACT_HASH',
          duplicateOf: hashMap.get(contentHash).index,
        });
      } else {
        unique.push(msg);
        hashMap.set(contentHash, { index: idx, message: msg });
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

  /**
   * Layer 2: Prefix-Based Matching (O(n))
   */
  layer2PrefixMatching(uniqueMessages) {
    const prefixMap = new Map();
    const unique = [];
    const duplicates = [];

    uniqueMessages.forEach((msg, idx) => {
      const normalized = this.normalizeText(msg.content);
      const prefix = normalized.substring(0, this.prefixLen);

      if (prefixMap.has(prefix)) {
        duplicates.push({
          index: idx,
          sourceFile: msg.sourceFile,
          reason: 'PREFIX_MATCH',
          duplicateOf: prefixMap.get(prefix).index,
          prefixLen: this.prefixLen,
        });
      } else {
        unique.push(msg);
        prefixMap.set(prefix, { index: idx, message: msg });
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

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().trim();
  }

  /**
   * Compute SHA256 hash of message content (content field only)
   */
  computeHash(msg) {
    const content = typeof msg === 'string' ? msg : (msg.content || JSON.stringify(msg));
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

// ============================================================================
// FILE I/O
// ============================================================================

function loadMessages() {
  const messages = [];

  try {
    if (!fs.existsSync(INPUT_FILE)) {
      log('ERROR', `Input file not found: ${INPUT_FILE}`);
      return [];
    }

    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    lines.forEach((line, idx) => {
      try {
        const msg = JSON.parse(line);
        messages.push(msg);
      } catch (e) {
        log('WARN', `Failed to parse line ${idx}: ${e.message}`);
      }
    });
  } catch (error) {
    log('ERROR', `Failed to load messages: ${error.message}`);
    throw error;
  }

  return messages;
}

function saveDeduplicatedMessages(messages, metadata) {
  try {
    // Clear output file
    if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }

    // Write deduplicated messages
    messages.forEach(msg => {
      const enriched = {
        ...msg,
        dedup_timestamp: new Date().toISOString(),
        dedup_layers_passed: 2,
      };
      const jsonLine = JSON.stringify(enriched) + '\n';
      fs.appendFileSync(OUTPUT_FILE, jsonLine);
    });

    // Write metadata
    const metaFile = path.join(MEMORY_DIR, 'dedup_metadata.json');
    fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));

    log('INFO', `✓ Saved ${messages.length} deduplicated messages to ${OUTPUT_FILE}`);
    log('INFO', `✓ Metadata saved to ${metaFile}`);
  } catch (error) {
    log('ERROR', `Failed to save messages: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN (CLI MODE)
// ============================================================================

async function main() {
  const startTime = Date.now();
  const MASTER_TIMEOUT = 180000; // 3-minute master timeout

  const timeoutHandle = setTimeout(() => {
    log('ERROR', 'MASTER TIMEOUT: Process exceeded 3 minutes, forcing exit');
    process.exit(1);
  }, MASTER_TIMEOUT);

  log('INFO', '========== Phase 2B Duplicate Detection Start (SIMPLIFIED) ==========');
  log('INFO', `Input: ${INPUT_FILE}`);
  log('INFO', `Output: ${OUTPUT_FILE}`);

  try {
    log('INFO', 'Step 1: Loading messages...');
    const messages = loadMessages();
    log('INFO', `Loaded ${messages.length} messages`);

    if (messages.length === 0) {
      log('WARN', 'No messages found');
      clearTimeout(timeoutHandle);
      process.exit(0);
    }

    log('INFO', 'Step 2: Running deduplication pipeline...');
    const engine = new DuplicateDetectionEngine(80);
    const result = engine.deduplicate(messages);

    log('INFO', `Layer 1: ${result.layer1.count} unique, ${result.layer1.removed} exact duplicates`);
    log('INFO', `Layer 2: ${result.layer2.count} unique, ${result.layer2.removed} prefix duplicates`);

    log('INFO', 'Step 3: Saving deduplicated messages...');
    const metadata = {
      timestamp: new Date().toISOString(),
      runtime_ms: Date.now() - startTime,
      input: {
        file: INPUT_FILE,
        count: messages.length,
      },
      layer1: {
        unique: result.layer1.count,
        duplicates: result.layer1.removed,
        method: 'EXACT_HASH',
      },
      layer2: {
        unique: result.layer2.count,
        duplicates: result.layer2.removed,
        method: 'PREFIX_MATCH',
        prefixLen: 80,
      },
      final: {
        unique: result.layer2.count,
        reduction: ((messages.length - result.layer2.count) / messages.length * 100).toFixed(1) + '%',
      },
    };

    saveDeduplicatedMessages(result.layer2.unique, metadata);

    log('INFO', `Final: ${result.layer2.count} unique messages (${metadata.final.reduction} reduction)`);
    log('INFO', `Total runtime: ${metadata.runtime_ms}ms`);
    log('INFO', '========== Phase 2B Duplicate Detection Complete ==========');

    clearTimeout(timeoutHandle);
    process.exit(0);
  } catch (error) {
    log('ERROR', `Deduplication failed: ${error.message}`);
    clearTimeout(timeoutHandle);
    process.exit(1);
  }
}

// ============================================================================
// EXPORTS (FOR TESTING & MODULES)
// ============================================================================

module.exports = {
  DuplicateDetectionEngine,
  loadMessages,
  saveDeduplicatedMessages,
  log,
};

// ============================================================================
// RUN IF CALLED DIRECTLY
// ============================================================================

if (require.main === module) {
  main();
}
