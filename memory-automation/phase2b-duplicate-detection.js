#!/usr/bin/env node
/**
 * Phase 2B: Duplicate Detection Engine
 * 입력: /memory/messages.jsonl (281 messages)
 * 처리: 3-layer duplicate detection (Pattern → Fuzzy → Semantic)
 * 출력: /memory/messages_deduplicated.jsonl (예상 50-100 고유 메시지)
 * 주기: Phase 2A 완료 후 자동 실행
 */

const fs = require('fs');
const path = require('path');

// 설정
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const INPUT_FILE = path.join(MEMORY_DIR, 'messages.jsonl');
const OUTPUT_FILE = path.join(MEMORY_DIR, 'messages_deduplicated.jsonl');
const LOG_DIR = path.join(MEMORY_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, `phase2b-dedup-${new Date().toISOString().split('T')[0]}.log`);
const ERROR_LOG = path.join(LOG_DIR, 'phase2b-errors.log');

// 로깅
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
// LAYER 1: PATTERN-BASED EXACT MATCHING
// ============================================================================

function layer1PatternMatching(messages) {
  const exactHashMap = new Map();
  const duplicates = [];
  const unique = [];

  messages.forEach((msg, idx) => {
    if (exactHashMap.has(msg.hash)) {
      duplicates.push({
        index: idx,
        hash: msg.hash,
        sourceFile: msg.sourceFile,
        reason: 'EXACT_HASH_MATCH',
        duplicateOf: exactHashMap.get(msg.hash).index
      });
    } else {
      exactHashMap.set(msg.hash, { index: idx, msg });
      unique.push(msg);
    }
  });

  return {
    unique,
    duplicates,
    count: unique.length,
    removed: duplicates.length,
    method: 'LAYER1_PATTERN'
  };
}

// ============================================================================
// LAYER 2: FUZZY MATCHING (Levenshtein Distance + Similarity Score)
// ============================================================================

function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      const cost = s1[j - 1] === s2[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len2][len1];
}

function similarityScore(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function layer2FuzzyMatching(uniqueMessages, threshold = 0.70) {
  const clusters = [];
  const processed = new Set();

  uniqueMessages.forEach((msg, idx) => {
    if (processed.has(idx)) return;

    const cluster = [{ index: idx, message: msg, score: 1.0 }];
    processed.add(idx);

    const normalizedA = normalizeText(msg.content);

    for (let j = idx + 1; j < uniqueMessages.length; j++) {
      if (processed.has(j)) continue;

      const msg2 = uniqueMessages[j];
      const normalizedB = normalizeText(msg2.content);
      const score = similarityScore(normalizedA, normalizedB);

      if (score >= threshold) {
        cluster.push({ index: j, message: msg2, score });
        processed.add(j);
      }
    }

    clusters.push(cluster);
  });

  const fuzzyUnique = [];
  const fuzzyDuplicates = [];

  clusters.forEach((cluster) => {
    const primary = cluster[0];
    fuzzyUnique.push(primary.message);

    if (cluster.length > 1) {
      cluster.slice(1).forEach(item => {
        fuzzyDuplicates.push({
          index: item.index,
          sourceFile: item.message.sourceFile,
          reason: 'FUZZY_MATCH',
          similarity: item.score,
          duplicateOf: primary.index,
          clusterSize: cluster.length
        });
      });
    }
  });

  return {
    unique: fuzzyUnique,
    duplicates: fuzzyDuplicates,
    clusters: clusters.length,
    count: fuzzyUnique.length,
    removed: fuzzyDuplicates.length,
    method: 'LAYER2_FUZZY'
  };
}

// ============================================================================
// LAYER 3: SEMANTIC CLUSTERING (Keyword-based grouping)
// ============================================================================

function extractKeywords(text, topK = 5) {
  const words = text.toLowerCase().match(/\b[a-z가-힣]{3,}\b/g) || [];
  const freq = {};

  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(entry => entry[0]);
}

function keywordSimilarity(kw1, kw2) {
  const set1 = new Set(kw1);
  const set2 = new Set(kw2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

function layer3SemanticClustering(fuzzyUnique, threshold = 0.50) {
  const semanticGroups = [];
  const processed = new Set();

  fuzzyUnique.forEach((msg, idx) => {
    if (processed.has(idx)) return;

    const keywords = extractKeywords(msg.content);
    const group = [{ index: idx, message: msg, keywords, sim: 1.0 }];
    processed.add(idx);

    for (let j = idx + 1; j < fuzzyUnique.length; j++) {
      if (processed.has(j)) continue;

      const msg2 = fuzzyUnique[j];
      const kw2 = extractKeywords(msg2.content);
      const sim = keywordSimilarity(keywords, kw2);

      if (sim >= threshold) {
        group.push({ index: j, message: msg2, keywords: kw2, sim });
        processed.add(j);
      }
    }

    semanticGroups.push(group);
  });

  const semanticUnique = [];
  const semanticDuplicates = [];

  semanticGroups.forEach((group) => {
    const primary = group[0];
    semanticUnique.push(primary.message);

    if (group.length > 1) {
      group.slice(1).forEach(item => {
        semanticDuplicates.push({
          index: item.index,
          sourceFile: item.message.sourceFile,
          reason: 'SEMANTIC_CLUSTER',
          similarity: item.sim,
          duplicateOf: primary.index,
          groupSize: group.length,
          primaryKeywords: primary.keywords,
          itemKeywords: item.keywords
        });
      });
    }
  });

  return {
    unique: semanticUnique,
    duplicates: semanticDuplicates,
    groups: semanticGroups.length,
    count: semanticUnique.length,
    removed: semanticDuplicates.length,
    method: 'LAYER3_SEMANTIC'
  };
}

// ============================================================================
// 메시지 로드 및 저장
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
        dedup_layers_passed: 3
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
  log('INFO', '========== Phase 2B Duplicate Detection Start ==========');
  log('INFO', `Input: ${INPUT_FILE}`);
  log('INFO', `Output: ${OUTPUT_FILE}`);

  try {
    log('INFO', 'Step 1: Loading messages...');
    const messages = loadMessages();
    log('INFO', `Loaded ${messages.length} messages`);

    if (messages.length === 0) {
      log('WARN', 'No messages found, nothing to deduplicate');
      process.exit(0);
    }

    log('INFO', 'Step 2: Running Layer 1 - Pattern-Based Exact Matching...');
    const layer1Result = layer1PatternMatching(messages);
    log('INFO', `Layer 1: ${layer1Result.count} unique, ${layer1Result.removed} duplicates (exact hash)`);

    log('INFO', 'Step 3: Running Layer 2 - Fuzzy Matching...');
    const layer2Result = layer2FuzzyMatching(layer1Result.unique, 0.70);
    log('INFO', `Layer 2: ${layer2Result.count} unique, ${layer2Result.removed} duplicates (fuzzy >=70% similarity)`);
    log('INFO', `Layer 2: ${layer2Result.clusters} clusters formed`);

    log('INFO', 'Step 4: Running Layer 3 - Semantic Clustering...');
    const layer3Result = layer3SemanticClustering(layer2Result.unique, 0.50);
    log('INFO', `Layer 3: ${layer3Result.count} unique, ${layer3Result.removed} duplicates (semantic >=50% keyword overlap)`);
    log('INFO', `Layer 3: ${layer3Result.groups} semantic groups formed`);

    log('INFO', 'Step 5: Saving deduplicated messages...');
    const metadata = {
      timestamp: new Date().toISOString(),
      input: {
        file: INPUT_FILE,
        count: messages.length
      },
      layer1: {
        unique: layer1Result.count,
        duplicates: layer1Result.removed,
        threshold: 'EXACT_HASH'
      },
      layer2: {
        unique: layer2Result.count,
        duplicates: layer2Result.removed,
        threshold: 0.70,
        clusters: layer2Result.clusters
      },
      layer3: {
        unique: layer3Result.count,
        duplicates: layer3Result.removed,
        threshold: 0.50,
        groups: layer3Result.groups
      },
      final: {
        unique: layer3Result.count,
        reduction: ((messages.length - layer3Result.count) / messages.length * 100).toFixed(1) + '%'
      }
    };

    saveDeduplicatedMessages(layer3Result.unique, metadata);

    log('INFO', `Final: ${layer3Result.count} unique messages (${metadata.final.reduction} reduction)`);
    log('INFO', '========== Phase 2B Duplicate Detection End ==========');

    process.exit(0);
  } catch (error) {
    log('ERROR', `Deduplication failed: ${error.message}`);
    try {
      fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${error.message}\n`);
    } catch (e) {
      console.error('Failed to write error log:', e);
    }
    process.exit(1);
  }
}

main();
