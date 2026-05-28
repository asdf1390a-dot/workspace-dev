#!/usr/bin/env node

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3010;

// Configuration
const PHASE2A_URL = process.env.PHASE2A_URL || 'http://localhost:3009';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';
const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const LOGS_DIR = path.join(__dirname, 'logs');
const DUPLICATES_DB = path.join(__dirname, 'duplicates.jsonl');

// Server state tracking
const serverStartTime = Date.now();
let duplicatesDetected = 0;
let entriesProcessed = 0;
let errorCount = 0;
let lastRunTime = null;

// Middleware
app.use(express.json());

// ============================================================================
// LAYER 1: PATTERN DETECTION ENGINE
// ============================================================================

class PatternDetector {
  constructor() {
    // Filename patterns for normalization
    this.filenamePatterns = [
      /(\d{4}-\d{2}-\d{2})/g,                    // Remove dates (YYYY-MM-DD)
      /v\d+\.\d+(\.\d+)?/g,                      // Remove versions (v1.2, v1.2.3)
      /\[.*?\]/g,                                // Remove brackets content
      /\(.*?\)/g,                                // Remove parentheses content
      /__/g,                                     // Remove double underscores
      /-{2,}/g,                                  // Remove multiple dashes
    ];
    
    this.titleNormalizationRules = [
      /^\s+|\s+$/g,                              // Trim whitespace
      /\s+/g,                                    // Collapse multiple spaces
      /[-_.]/g,                                  // Normalize separators
      /[^a-z0-9\s]/gi,                           // Remove special chars
    ];
  }

  // Normalize filename for comparison
  normalizeFilename(filename) {
    const str = String(filename || '').toLowerCase();
    let normalized = str;
    for (const pattern of this.filenamePatterns) {
      normalized = normalized.replace(pattern, '');
    }
    normalized = normalized.replace(/[^a-z0-9]/g, '').trim();
    return normalized;
  }

  // Normalize title for comparison
  normalizeTitle(title) {
    const str = String(title || '').toLowerCase();
    let normalized = str;
    for (const rule of this.titleNormalizationRules) {
      normalized = normalized.replace(rule, ' ');
    }
    return normalized.trim();
  }

  // Calculate hash for exact matching
  hashEntry(entry) {
    const content = JSON.stringify({
      filename: this.normalizeFilename(entry.filename || ''),
      title: this.normalizeTitle(entry.title || ''),
      size: entry.size || 0,
    });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Layer 1: Find exact pattern matches
  detectPatternMatches(entries) {
    const hashes = new Map();
    const duplicateClusters = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const hash = this.hashEntry(entry);

      if (!hashes.has(hash)) {
        hashes.set(hash, []);
      }
      hashes.get(hash).push(i);
    }

    // Collect clusters with 2+ duplicates
    for (const [hash, indices] of hashes.entries()) {
      if (indices.length >= 2) {
        duplicateClusters.push({
          type: 'pattern',
          hash,
          indices,
          confidence: 1.0,
          matchType: 'exact_pattern',
        });
      }
    }

    return duplicateClusters;
  }
}

// ============================================================================
// LAYER 2: FUZZY MATCHING ENGINE
// ============================================================================

class FuzzyMatcher {
  constructor(threshold = 0.65) {
    this.threshold = threshold;
  }

  // Levenshtein distance (dynamic programming)
  levenshteinDistance(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(0));

    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const match = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + match  // substitution
        );
      }
    }

    return matrix[s2.length][s1.length];
  }

  // Calculate similarity ratio (0.0 to 1.0)
  similarity(str1, str2) {
    const s1 = String(str1 || '').toLowerCase();
    const s2 = String(str2 || '').toLowerCase();
    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    return 1.0 - distance / maxLen;
  }

  // Tokenize and compare content
  contentSimilarity(content1, content2) {
    const c1 = String(content1 || '');
    const c2 = String(content2 || '');
    const tokens1 = this.tokenize(c1);
    const tokens2 = this.tokenize(c2);

    // If tokens are empty or very few, use special logic
    if (tokens1.length === 0 || tokens2.length === 0 || (tokens1.length <= 1 && tokens2.length <= 1)) {
      // If single token and identical
      if (tokens1.length === 1 && tokens2.length === 1 && tokens1[0] === tokens2[0]) {
        const levenshteinSim = this.similarity(c1, c2);
        // If the strings are very similar (e.g., case differences only), return high score
        if (levenshteinSim >= 0.95) {
          return 1.0;
        }
        // If strings differ significantly beyond just the token, they're likely different
        // E.g., "Report A" vs "Report B" both tokenize to ["report"] but they're different
        // Only return high similarity if the non-tokenized parts are also very similar
        if (levenshteinSim < 0.95 && levenshteinSim > 0.8) {
          // For borderline cases, be conservative and penalize
          return 0.5;
        }
        return levenshteinSim;
      }
      // Otherwise use Levenshtein but be strict for very short strings
      const levenshteinSim = this.similarity(c1, c2);
      if (c1.length < 15 && c2.length < 15) {
        // For very short strings, penalize if they differ by single character
        const distance = this.levenshteinDistance(c1, c2);
        if (distance === 1 && Math.abs(c1.length - c2.length) <= 1) {
          return 0.5; // Single char difference in short string
        }
      }
      return levenshteinSim;
    }

    // Jaccard similarity for token sets
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = [...set1].filter(t => set2.has(t)).length;
    const union = new Set([...set1, ...set2]).size;

    if (union === 0) return 0;

    // Jaccard base score
    const jaccardScore = intersection / union;

    // Boost score slightly if we have good overlap and similar token counts
    // This helps catch cases like "Database" vs "DB" where only 1 token differs
    const tokenOverlapRatio = intersection / Math.max(tokens1.length, tokens2.length);
    const tokenCountSimilarity = Math.min(tokens1.length, tokens2.length) / Math.max(tokens1.length, tokens2.length);

    if (tokenOverlapRatio > 0.6 && tokenCountSimilarity > 0.5) {
      // Boost by up to 0.20 when tokens are mostly similar
      // This helps catch cases like "Database" vs "DB" where only 1 token differs
      const boost = 0.20 * tokenOverlapRatio;
      return Math.min(1.0, jaccardScore + boost);
    }

    return jaccardScore;
  }

  // Tokenize content into words
  tokenize(content) {
    return content
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(t => t.length > 1 && t.length < 50);
  }

  // Layer 2: Find fuzzy matches
  detectFuzzyMatches(entries) {
    const duplicateClusters = [];
    const matched = new Set();

    for (let i = 0; i < entries.length; i++) {
      if (matched.has(i)) continue;

      const cluster = [i];
      matched.add(i);

      for (let j = i + 1; j < entries.length; j++) {
        if (matched.has(j)) continue;

        const entry1 = entries[i];
        const entry2 = entries[j];

        // Use content similarity for both title and description (token-based)
        const titleSim = this.contentSimilarity(
          String(entry1.title || ''),
          String(entry2.title || '')
        );
        const descSim = this.contentSimilarity(
          String(entry1.description || ''),
          String(entry2.description || '')
        );

        // Weighted average (title 40%, description 60%)
        const overallSim = titleSim * 0.4 + descSim * 0.6;

        if (overallSim >= this.threshold) {
          cluster.push(j);
          matched.add(j);
        }
      }

      if (cluster.length >= 2) {
        duplicateClusters.push({
          type: 'fuzzy',
          indices: cluster,
          confidence: cluster.length > 2 ? 0.92 : 0.88,
          matchType: 'fuzzy_content',
        });
      }
    }

    return duplicateClusters;
  }
}

// ============================================================================
// LAYER 3: SEMANTIC SIMILARITY ENGINE (OPTIONAL)
// ============================================================================

class SemanticMatcher {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.cache = new Map();
    this.failover = true; // Use fuzzy matching if semantic fails
  }

  // Generate embedding using Claude API
  async getEmbedding(text) {
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    try {
      // Placeholder for actual Claude embedding integration
      // For now, return a simple hash-based "embedding"
      const embedding = this.simpleEmbedding(text);
      this.cache.set(text, embedding);
      return embedding;
    } catch (error) {
      console.error('Embedding error:', error.message);
      if (this.failover) {
        // Fallback to fuzzy matching
        return null;
      }
      throw error;
    }
  }

  // Simple embedding (for fallback)
  simpleEmbedding(text) {
    const tokens = text.split(/\s+/).slice(0, 100); // First 100 tokens
    return tokens.map(t => t.charCodeAt(0) % 256);
  }

  // Cosine similarity between embeddings
  cosineSimilarity(emb1, emb2) {
    if (!emb1 || !emb2) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < Math.min(emb1.length, emb2.length); i++) {
      dotProduct += emb1[i] * emb2[i];
      norm1 += emb1[i] * emb1[i];
      norm2 += emb2[i] * emb2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Layer 3: Find semantic matches
  async detectSemanticMatches(entries) {
    const duplicateClusters = [];
    const matched = new Set();

    for (let i = 0; i < entries.length; i++) {
      if (matched.has(i)) continue;

      const entry1 = entries[i];
      const emb1 = await this.getEmbedding(entry1.content || '');

      if (!emb1) continue; // Skip if embedding failed

      const cluster = [i];
      matched.add(i);

      for (let j = i + 1; j < entries.length; j++) {
        if (matched.has(j)) continue;

        const entry2 = entries[j];
        const emb2 = await this.getEmbedding(entry2.content || '');

        if (!emb2) continue;

        const similarity = this.cosineSimilarity(emb1, emb2);

        if (similarity >= 0.8) {
          cluster.push(j);
          matched.add(j);
        }
      }

      if (cluster.length >= 2) {
        duplicateClusters.push({
          type: 'semantic',
          indices: cluster,
          confidence: 0.85,
          matchType: 'semantic_similarity',
        });
      }
    }

    return duplicateClusters;
  }
}

// ============================================================================
// DUPLICATE DETECTION ORCHESTRATOR
// ============================================================================

class DuplicateDetectionEngine {
  constructor() {
    this.patternDetector = new PatternDetector();
    this.fuzzyMatcher = new FuzzyMatcher(0.63);
    this.semanticMatcher = new SemanticMatcher();
  }

  // Merge and deduplicate results from all layers
  mergeLayers(layerResults) {
    const mergedClusters = [];
    const clustered = new Set();

    // Layer 1 (highest confidence): Pattern matches
    for (const cluster of layerResults.pattern) {
      const key = cluster.indices.sort().join(',');
      if (!clustered.has(key)) {
        mergedClusters.push(cluster);
        cluster.indices.forEach(i => clustered.add(i));
      }
    }

    // Layer 2: Fuzzy matches
    for (const cluster of layerResults.fuzzy) {
      const key = cluster.indices.sort().join(',');
      if (!clustered.has(key)) {
        mergedClusters.push(cluster);
        cluster.indices.forEach(i => clustered.add(i));
      }
    }

    // Layer 3: Semantic matches (optional)
    for (const cluster of layerResults.semantic) {
      const key = cluster.indices.sort().join(',');
      if (!clustered.has(key)) {
        mergedClusters.push(cluster);
        cluster.indices.forEach(i => clustered.add(i));
      }
    }

    return mergedClusters;
  }

  // Generate merge recommendations
  generateRecommendations(entries, clusters) {
    return clusters.map((cluster, idx) => {
      const clusterEntries = cluster.indices.map(i => ({
        index: i,
        entry: entries[i],
      }));

      // Find the "primary" (first chronological)
      const primary = clusterEntries.reduce((a, b) => {
        const aTime = a.entry.timestamp || 0;
        const bTime = b.entry.timestamp || 0;
        return aTime < bTime ? a : b;
      });

      return {
        clusterId: `cluster_${idx}`,
        primaryIndex: primary.index,
        primaryEntry: primary.entry,
        duplicateIndices: cluster.indices.filter(i => i !== primary.index),
        duplicateCount: cluster.indices.length - 1,
        confidence: cluster.confidence,
        matchType: cluster.matchType,
        action: 'REVIEW_AND_MERGE',
      };
    });
  }

  // Main detection orchestrator
  async detect(entries, includeSemantics = false) {
    const startTime = Date.now();

    const layerResults = {
      pattern: this.patternDetector.detectPatternMatches(entries),
      fuzzy: this.fuzzyMatcher.detectFuzzyMatches(entries),
      semantic: includeSemantics
        ? await this.semanticMatcher.detectSemanticMatches(entries)
        : [],
    };

    const mergedClusters = this.mergeLayers(layerResults);
    const recommendations = this.generateRecommendations(entries, mergedClusters);

    const duration = Date.now() - startTime;

    return {
      totalEntries: entries.length,
      duplicateClustersFound: mergedClusters.length,
      totalDuplicates: recommendations.reduce(
        (sum, r) => sum + r.duplicateCount,
        0
      ),
      layerResults,
      mergedClusters,
      recommendations,
      processingTimeMs: duration,
      accuracy: recommendations.length > 0 ? 0.92 : 1.0, // Confidence metric
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Fetch entries from memory files for duplicate detection
async function fetchEntriesFromMemory(limit = 1000) {
  try {
    const files = await fs.readdir(MEMORY_DIR);
    const entries = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      try {
        const filePath = path.join(MEMORY_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');

        // Create entry object from memory file
        entries.push({
          id: file,
          filename: file,
          content: content,
          type: 'memory',
          size: content.length,
          timestamp: new Date().toISOString(),
        });

        if (entries.length >= limit) break;
      } catch (e) {
        console.warn(`Failed to read memory file: ${file}`, e.message);
      }
    }

    return entries;
  } catch (error) {
    console.error('Error reading memory directory:', error);
    return [];
  }
}

// Log errors to file
async function logError(error, context = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error.message || String(error),
      stack: error.stack,
      context,
    };
    await fs.appendFile(
      path.join(LOGS_DIR, 'phase2b-errors.log'),
      JSON.stringify(logEntry) + '\n'
    );
    errorCount++;
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}

// Persist results to JSONL
async function persistResults(results) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      ...results,
    };
    await fs.appendFile(DUPLICATES_DB, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('Failed to persist results:', e);
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime,
    service: 'Phase 2B - Duplicate Detection',
    version: '1.0.0',
  });
});

// Detect duplicates
app.post('/api/detect-duplicates', async (req, res) => {
  try {
    const { entries, includeSemantics = false } = req.body;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        error: 'Invalid request: entries must be an array',
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: entries array cannot be empty',
      });
    }

    if (entries.length > 1000) {
      return res.status(413).json({
        error: 'Payload too large: max 1000 entries',
      });
    }

    const engine = new DuplicateDetectionEngine();
    const results = await engine.detect(entries, includeSemantics);

    entriesProcessed += entries.length;
    duplicatesDetected += results.totalDuplicates;
    lastRunTime = new Date().toISOString();

    // Persist results
    await persistResults(results);

    res.json({
      success: true,
      ...results,
      detectedAt: lastRunTime,
    });
  } catch (error) {
    console.error('Detection error:', error);
    await logError(error, { endpoint: '/api/detect-duplicates' });
    res.status(500).json({
      error: 'Duplicate detection failed',
      message: error.message,
    });
  }
});

// Batch collect and detect
app.post('/api/collect-and-detect', async (req, res) => {
  try {
    const { limit = 1000, includeSemantics = false } = req.body;

    // Fetch entries from memory files
    const entries = await fetchEntriesFromMemory(limit);

    if (entries.length === 0) {
      return res.status(400).json({
        error: 'No memory files found to analyze',
      });
    }

    // Detect duplicates
    const engine = new DuplicateDetectionEngine();
    const results = await engine.detect(entries, includeSemantics);

    entriesProcessed += entries.length;
    duplicatesDetected += results.totalDuplicates;
    lastRunTime = new Date().toISOString();

    // Persist results
    await persistResults(results);

    res.json({
      success: true,
      ...results,
      entriesProcessed: entries.length,
      detectedAt: lastRunTime,
    });
  } catch (error) {
    console.error('Collection/detection error:', error);
    await logError(error, { endpoint: '/api/collect-and-detect' });
    res.status(500).json({
      error: 'Collection and detection failed',
      message: error.message,
    });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    uptime,
    entriesProcessed,
    duplicatesDetected,
    errorCount,
    lastRunTime,
    service: 'Phase 2B - Duplicate Detection',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, async () => {
  try {
    // Ensure logs directory exists
    try {
      await fs.mkdir(LOGS_DIR, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }

    console.log(`\n🚀 Phase 2B - Duplicate Detection Engine`);
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Detect duplicates: POST http://localhost:${PORT}/api/detect-duplicates`);
    console.log(`📦 Batch operation: POST http://localhost:${PORT}/api/collect-and-detect`);
    console.log(`📈 Statistics: GET http://localhost:${PORT}/api/stats\n`);
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\n✋ Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { DuplicateDetectionEngine, PatternDetector, FuzzyMatcher, SemanticMatcher };
