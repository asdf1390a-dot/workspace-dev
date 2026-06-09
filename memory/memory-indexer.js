#!/usr/bin/env node

/**
 * Memory Indexing System (Memory-P2)
 *
 * Parses MEMORY.md, creates indexed JSON files, manages caching and auto-cleanup.
 * Supports:
 * - Category-based indexing (user, feedback, project, reference)
 * - Quick-lookup JSON index generation
 * - Change detection and auto-reindex
 * - LRU cache with TTL (15 min default)
 * - Duplicate detection and staleness marking
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const COLLECTED_DIR = path.join(MEMORY_DIR, 'collected');
const MEMORY_FILE = path.join(MEMORY_DIR, 'MEMORY.md');
const INDEX_FILE = path.join(COLLECTED_DIR, 'memory_index.json');
const CACHE_FILE = path.join(COLLECTED_DIR, 'memory_cache.json');
const METADATA_FILE = path.join(COLLECTED_DIR, 'memory_metadata.json');

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const STALENESS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_SIZE = 1000; // LRU cache max entries

class MemoryIndexer {
  constructor() {
    this.index = { categories: {}, entries: [] };
    this.cache = new Map();
    this.metadata = {
      lastIndexed: null,
      memoryHash: null,
      indexVersion: 1,
      cacheHits: 0,
      cacheMisses: 0,
      duplicatesDetected: 0,
      staleEntriesCount: 0
    };
  }

  /**
   * Parse MEMORY.md and extract structured data
   */
  parseMemory() {
    if (!fs.existsSync(MEMORY_FILE)) {
      console.error(`MEMORY.md not found at ${MEMORY_FILE}`);
      process.exit(1);
    }

    const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');

    // Check if already indexed
    if (fs.existsSync(METADATA_FILE)) {
      const meta = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      if (meta.memoryHash === hash) {
        console.log('Memory file unchanged. Skipping reindex.');
        return false;
      }
    }

    this.index.categories = {
      user: [],
      feedback: [],
      project: [],
      reference: [],
      incident: [],
      archive: []
    };

    const lines = content.split('\n');
    let currentSection = null;
    let entryId = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Section detection
      if (line.includes('👤 **USER & TEAM**')) currentSection = 'user';
      else if (line.includes('🔴') || line.includes('feedback')) currentSection = 'feedback';
      else if (line.includes('📊 **REFERENCE**')) currentSection = 'reference';
      else if (line.includes('📚 **HISTORICAL ARCHIVES**')) currentSection = 'archive';
      else if (line.includes('🚨')) currentSection = 'incident';
      else if (line.match(/^## 🚀|^## ✅|^## 🟢/)) currentSection = 'project';

      // Entry extraction: [text](link) pattern
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && currentSection) {
        entryId++;
        const [fullMatch, title, link] = linkMatch;
        const timestamp = this.extractTimestamp(line);

        const entry = {
          id: entryId,
          title: title.trim(),
          link,
          category: currentSection,
          timestamp,
          lineNumber: i + 1,
          preview: line.substring(0, 100).trim(),
          hash: crypto.createHash('md5').update(`${title}${link}`).digest('hex')
        };

        this.index.entries.push(entry);
        if (!this.index.categories[currentSection]) {
          this.index.categories[currentSection] = [];
        }
        this.index.categories[currentSection].push(entryId);
      }
    }

    this.metadata.memoryHash = hash;
    this.metadata.lastIndexed = new Date().toISOString();
    this.detectDuplicates();
    this.markStaleEntries();

    console.log(`Indexed ${this.index.entries.length} entries across ${Object.keys(this.index.categories).length} categories`);
    return true;
  }

  /**
   * Extract timestamp from line (various formats)
   */
  extractTimestamp(line) {
    const patterns = [
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/,
      /(\d{4}-\d{2}-\d{2})/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Detect duplicate entries based on title/link similarity
   */
  detectDuplicates() {
    const seen = new Set();
    let duplicateCount = 0;

    for (const entry of this.index.entries) {
      const signature = `${entry.title}${entry.link}`;
      if (seen.has(signature)) {
        entry.isDuplicate = true;
        duplicateCount++;
      }
      seen.add(signature);
    }

    this.metadata.duplicatesDetected = duplicateCount;
  }

  /**
   * Mark entries older than 30 days as stale
   */
  markStaleEntries() {
    const now = new Date();
    let staleCount = 0;

    for (const entry of this.index.entries) {
      if (!entry.timestamp) continue;

      const entryDate = new Date(entry.timestamp);
      const ageMs = now - entryDate;

      if (ageMs > STALENESS_THRESHOLD_MS) {
        entry.isStale = true;
        staleCount++;
      }
    }

    this.metadata.staleEntriesCount = staleCount;
  }

  /**
   * Save index to JSON file
   */
  saveIndex() {
    if (!fs.existsSync(COLLECTED_DIR)) {
      fs.mkdirSync(COLLECTED_DIR, { recursive: true });
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(this.index, null, 2));
    console.log(`Index saved to ${INDEX_FILE}`);
  }

  /**
   * Save metadata
   */
  saveMetadata() {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(this.metadata, null, 2));
    console.log(`Metadata saved to ${METADATA_FILE}`);
  }

  /**
   * Quick lookup by category
   */
  getByCategory(category) {
    if (!this.index.categories[category]) return [];

    const ids = this.index.categories[category];
    return this.index.entries.filter(e => ids.includes(e.id));
  }

  /**
   * Search entries by title/content
   */
  search(query) {
    const q = query.toLowerCase();
    return this.index.entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.link.toLowerCase().includes(q)
    );
  }

  /**
   * LRU Cache - Get
   */
  cacheGet(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.metadata.cacheMisses++;
      return null;
    }

    // Check TTL
    if (Date.now() - item.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      this.metadata.cacheMisses++;
      return null;
    }

    this.metadata.cacheHits++;
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  /**
   * LRU Cache - Set
   */
  cacheSet(key, value) {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Save cache state to disk
   */
  saveCache() {
    const cacheData = {
      entries: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        value: item.value,
        timestamp: item.timestamp
      })),
      metadata: this.metadata
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Load cache from disk
   */
  loadCache() {
    if (!fs.existsSync(CACHE_FILE)) return;

    try {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      for (const item of cacheData.entries) {
        this.cache.set(item.key, {
          value: item.value,
          timestamp: item.timestamp
        });
      }
      if (cacheData.metadata) {
        this.metadata = { ...this.metadata, ...cacheData.metadata };
      }
      console.log(`Loaded ${this.cache.size} cache entries`);
    } catch (err) {
      console.warn('Failed to load cache:', err.message);
    }
  }

  /**
   * Generate summary statistics
   */
  getSummary() {
    return {
      totalEntries: this.index.entries.length,
      categories: Object.entries(this.index.categories).map(([cat, ids]) => ({
        category: cat,
        count: ids.length
      })),
      duplicates: this.metadata.duplicatesDetected,
      staleEntries: this.metadata.staleEntriesCount,
      cacheSize: this.cache.size,
      cacheHitRate: this.metadata.cacheHits + this.metadata.cacheMisses > 0
        ? (this.metadata.cacheHits / (this.metadata.cacheHits + this.metadata.cacheMisses) * 100).toFixed(2) + '%'
        : 'N/A',
      lastIndexed: this.metadata.lastIndexed
    };
  }

  /**
   * Run full indexing pipeline
   */
  run() {
    console.log('=== Memory Indexer Starting ===');

    this.loadCache();
    const needsIndex = this.parseMemory();

    if (needsIndex) {
      this.saveIndex();
    } else {
      // Load existing index
      if (fs.existsSync(INDEX_FILE)) {
        this.index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
      }
    }

    this.saveMetadata();
    this.saveCache();

    const summary = this.getSummary();
    console.log('\n=== Summary ===');
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  }
}

// Auto-cleanup routine for old collected files
function cleanupOldFiles() {
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  try {
    const files = fs.readdirSync(COLLECTED_DIR);

    for (const file of files) {
      if (file === 'memory_index.json' ||
          file === 'memory_cache.json' ||
          file === 'memory_metadata.json') {
        continue; // Skip core files
      }

      const filePath = path.join(COLLECTED_DIR, file);
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;

      if (ageMs > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (err) {
    console.warn('Cleanup failed:', err.message);
  }
}

// Main execution
if (require.main === module) {
  const indexer = new MemoryIndexer();
  indexer.run();
  cleanupOldFiles();
}

module.exports = { MemoryIndexer, MEMORY_FILE, INDEX_FILE, CACHE_FILE };
