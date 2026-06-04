#!/usr/bin/env node
/**
 * Phase 2B: Duplicate Detection Engine (REFACTORED)
 * 입력: queue/messages.jsonl (from phase2a via FileQueue)
 * 처리: 2-layer duplicate detection (Exact Hash + Fast Prefix Matching)
 * 출력: /memory/messages_deduplicated.jsonl
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { FileQueue } = require('./queue');
const { Logger } = require('./logger');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const QUEUE_DIR = path.join(__dirname, 'queue');
const OUTPUT_FILE = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');
const LOG_DIR = path.join(MEMORY_DIR, 'logs');

// Initialize queue and logger
const queue = new FileQueue(QUEUE_DIR);
const logger = new Logger(LOG_DIR);

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
  // Load from queue instead of file
  const queuedMessages = queue.dequeueAll();

  if (queuedMessages.length === 0) {
    logger.warn('No messages in queue');
    return [];
  }

  // Extract actual message data from queue items
  const messages = queuedMessages.map((item) => item.data || item);
  logger.debug(`Loaded ${messages.length} messages from queue`);

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

    logger.debug(`Saved ${messages.length} deduplicated messages to ${OUTPUT_FILE}`);
    logger.debug(`Metadata saved to ${metaFile}`);
  } catch (error) {
    logger.error(`Failed to save messages: ${error.message}`);
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
    logger.critical('MASTER TIMEOUT: Process exceeded 3 minutes, forcing exit');
    process.exit(1);
  }, MASTER_TIMEOUT);

  logger.debug('========== Phase 2B Duplicate Detection Start (Queue-based) ==========');
  logger.debug(`Output: ${OUTPUT_FILE}`);

  try {
    logger.debug('Step 1: Loading messages from queue...');
    const messages = loadMessages();
    logger.debug(`Loaded ${messages.length} messages`);

    if (messages.length === 0) {
      logger.warn('No messages in queue');
      clearTimeout(timeoutHandle);
      process.exit(0);
    }

    logger.debug('Step 2: Running deduplication pipeline...');
    const engine = new DuplicateDetectionEngine(80);
    const result = engine.deduplicate(messages);

    logger.debug(`Layer 1: ${result.layer1.count} unique, ${result.layer1.removed} exact duplicates`);
    logger.debug(`Layer 2: ${result.layer2.count} unique, ${result.layer2.removed} prefix duplicates`);

    logger.debug('Step 3: Saving deduplicated messages...');
    const metadata = {
      timestamp: new Date().toISOString(),
      runtime_ms: Date.now() - startTime,
      input: {
        source: 'queue',
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
        reduction: messages.length > 0 ?
          ((messages.length - result.layer2.count) / messages.length * 100).toFixed(1) + '%' : '0%',
      },
    };

    saveDeduplicatedMessages(result.layer2.unique, metadata);

    logger.debug(`Final: ${result.layer2.count} unique messages (${metadata.final.reduction} reduction)`);
    logger.debug(`Total runtime: ${metadata.runtime_ms}ms`);
    logger.debug('========== Phase 2B Duplicate Detection Complete ==========');

    clearTimeout(timeoutHandle);
    process.exit(0);
  } catch (error) {
    logger.error(`Deduplication failed: ${error.message}`);
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
