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

// 설정
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const INPUT_FILE = path.join(MEMORY_DIR, 'messages.jsonl');
const OUTPUT_FILE = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');
const LOG_DIR = path.join(MEMORY_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, `phase2b-dedup-${new Date().toISOString().split('T')[0]}.log`);

function log(level, msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${msg}`;
  console.log(logMsg);
  try {
    fs.appendFileSync(LOG_FILE, logMsg + '\n');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

// ============================================================================
// LAYER 1: EXACT HASH MATCHING
// ============================================================================

function layer1ExactMatching(messages) {
  const hashMap = new Map();
  const unique = [];
  const duplicates = [];

  messages.forEach((msg, idx) => {
    const contentHash = msg.hash; // Use existing hash from messages
    if (hashMap.has(contentHash)) {
      duplicates.push({
        index: idx,
        hash: contentHash,
        sourceFile: msg.sourceFile,
        reason: 'EXACT_HASH',
        duplicateOf: hashMap.get(contentHash).index
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
    method: 'LAYER1_EXACT'
  };
}

// ============================================================================
// LAYER 2: FAST PREFIX-BASED MATCHING (Non-Levenshtein)
// ============================================================================

function normalizeText(text) {
  return text.toLowerCase().trim();
}

function getPrefixKey(text) {
  const normalized = normalizeText(text);
  return normalized.substring(0, Math.min(100, normalized.length));
}

function layer2PrefixMatching(uniqueMessages, prefixLen = 80) {
  const prefixMap = new Map();
  const unique = [];
  const duplicates = [];

  uniqueMessages.forEach((msg, idx) => {
    const normalized = normalizeText(msg.content);
    const prefix = normalized.substring(0, prefixLen);

    if (prefixMap.has(prefix)) {
      const duplicate = {
        index: idx,
        sourceFile: msg.sourceFile,
        reason: 'PREFIX_MATCH',
        duplicateOf: prefixMap.get(prefix).index,
        prefixLen
      };
      duplicates.push(duplicate);
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
    method: 'LAYER2_PREFIX'
  };
}

// ============================================================================
// LOAD & SAVE
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
    messages.forEach(msg => {
      const enriched = {
        ...msg,
        dedup_timestamp: new Date().toISOString(),
        dedup_layers_passed: 2
      };
      const jsonLine = JSON.stringify(enriched) + '\n';
      fs.appendFileSync(OUTPUT_FILE, jsonLine);
    });

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
// MAIN
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
    // Clear old output
    if (fs.existsSync(OUTPUT_FILE)) {
      fs.unlinkSync(OUTPUT_FILE);
    }

    log('INFO', 'Step 1: Loading messages...');
    const messages = loadMessages();
    log('INFO', `Loaded ${messages.length} messages`);

    if (messages.length === 0) {
      log('WARN', 'No messages found');
      clearTimeout(timeoutHandle);
      process.exit(0);
    }

    log('INFO', 'Step 2: Running Layer 1 - Exact Hash Matching...');
    const layer1Result = layer1ExactMatching(messages);
    log('INFO', `Layer 1: ${layer1Result.count} unique, ${layer1Result.removed} exact duplicates`);

    log('INFO', 'Step 3: Running Layer 2 - Prefix Matching...');
    const layer2Result = layer2PrefixMatching(layer1Result.unique, 80);
    log('INFO', `Layer 2: ${layer2Result.count} unique, ${layer2Result.removed} prefix duplicates`);

    log('INFO', 'Step 4: Saving deduplicated messages...');
    const metadata = {
      timestamp: new Date().toISOString(),
      runtime_ms: Date.now() - startTime,
      input: {
        file: INPUT_FILE,
        count: messages.length
      },
      layer1: {
        unique: layer1Result.count,
        duplicates: layer1Result.removed,
        method: 'EXACT_HASH'
      },
      layer2: {
        unique: layer2Result.count,
        duplicates: layer2Result.removed,
        method: 'PREFIX_MATCH',
        prefixLen: 80
      },
      final: {
        unique: layer2Result.count,
        reduction: ((messages.length - layer2Result.count) / messages.length * 100).toFixed(1) + '%'
      }
    };

    saveDeduplicatedMessages(layer2Result.unique, metadata);

    log('INFO', `Final: ${layer2Result.count} unique messages (${metadata.final.reduction} reduction)`);
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

main();
