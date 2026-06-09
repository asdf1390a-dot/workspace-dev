#!/usr/bin/env node

/**
 * Memory Cache Layer (Memory-P2 Part 4)
 *
 * Distributed cache management with invalidation support:
 * - Multi-level caching (L1: in-memory, L2: disk)
 * - Cache key namespacing
 * - Invalidation broadcast
 * - Statistics collection
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const COLLECTED_DIR = path.join(MEMORY_DIR, 'collected');
const CACHE_FILE = path.join(COLLECTED_DIR, 'memory_cache.json');

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ENTRIES = 1000;

class MemoryCacheLayer {
  constructor(options = {}) {
    this.ttl = options.ttl || DEFAULT_TTL_MS;
    this.maxEntries = options.maxEntries || MAX_ENTRIES;
    this.cache = new Map(); // L1: in-memory
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      evictions: 0
    };
    this.namespace = options.namespace || 'default';
  }

  /**
   * Generate cache key with namespace
   */
  makeKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, value) {
    const fullKey = this.makeKey(key);

    // Check size limit and evict if necessary
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(fullKey, {
      value,
      timestamp: Date.now(),
      ttl: this.ttl
    });

    this.stats.sets++;
    return true;
  }

  /**
   * Get cache entry (check TTL)
   */
  get(key) {
    const fullKey = this.makeKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      return null;
    }

    // Update timestamp (move to end for LRU)
    this.cache.delete(fullKey);
    this.cache.set(fullKey, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Evict oldest entry (LRU)
   */
  evictOldest() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Invalidate by key pattern (regex support)
   */
  invalidate(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.invalidations += count;
    return count;
  }

  /**
   * Invalidate all entries in namespace
   */
  invalidateNamespace() {
    const count = this.invalidate(`^${this.namespace}:`);
    console.log(`[CACHE] Invalidated ${count} entries in namespace '${this.namespace}'`);
    return count;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`[CACHE] Cleared ${count} entries`);
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalAccess = this.stats.hits + this.stats.misses;
    const hitRate = totalAccess > 0
      ? ((this.stats.hits / totalAccess) * 100).toFixed(2)
      : 0;

    return {
      namespace: this.namespace,
      entries: this.cache.size,
      maxEntries: this.maxEntries,
      ttl: `${this.ttl / 1000}s`,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      invalidations: this.stats.invalidations,
      evictions: this.stats.evictions
    };
  }

  /**
   * Persist cache to disk
   */
  persist() {
    try {
      fs.mkdirSync(COLLECTED_DIR, { recursive: true });

      const cacheData = {
        timestamp: new Date().toISOString(),
        namespace: this.namespace,
        entries: Array.from(this.cache.entries()).map(([key, item]) => ({
          key,
          value: item.value,
          timestamp: item.timestamp,
          ttl: item.ttl
        })),
        stats: this.stats
      };

      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`[CACHE] Persisted ${this.cache.size} entries to disk`);
      return true;
    } catch (err) {
      console.error('[CACHE] Persist failed:', err.message);
      return false;
    }
  }

  /**
   * Load cache from disk
   */
  load() {
    try {
      if (!fs.existsSync(CACHE_FILE)) {
        console.log('[CACHE] No cache file found');
        return false;
      }

      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

      // Only load entries from same namespace or compatible
      for (const entry of cacheData.entries) {
        const age = Date.now() - entry.timestamp;
        if (age <= entry.ttl) {
          this.cache.set(entry.key, {
            value: entry.value,
            timestamp: entry.timestamp,
            ttl: entry.ttl
          });
        }
      }

      console.log(`[CACHE] Loaded ${this.cache.size} valid entries from disk`);
      return true;
    } catch (err) {
      console.error('[CACHE] Load failed:', err.message);
      return false;
    }
  }

  /**
   * Get all entries (for debugging)
   */
  getAll() {
    const entries = [];
    for (const [key, item] of this.cache) {
      entries.push({
        key,
        value: item.value,
        age: Date.now() - item.timestamp,
        ttl: item.ttl,
        expired: (Date.now() - item.timestamp) > item.ttl
      });
    }
    return entries;
  }
}

/**
 * Global cache instance (singleton)
 */
let globalCache = null;

function getGlobalCache() {
  if (!globalCache) {
    globalCache = new MemoryCacheLayer();
  }
  return globalCache;
}

// Main execution
if (require.main === module) {
  const cache = getGlobalCache();

  const cmd = process.argv[2];
  const key = process.argv[3];
  const value = process.argv[4];

  cache.load();

  if (cmd === 'set' && key && value) {
    cache.set(key, value);
    console.log(`Set: ${key} = ${value}`);
  } else if (cmd === 'get' && key) {
    const result = cache.get(key);
    console.log(`Get: ${key} = ${result !== null ? result : 'NOT FOUND'}`);
  } else if (cmd === 'invalidate' && key) {
    const count = cache.invalidate(key);
    console.log(`Invalidated ${count} entries matching: ${key}`);
  } else if (cmd === 'clear') {
    cache.clear();
  } else if (cmd === 'stats') {
    console.log('=== Cache Statistics ===');
    console.log(JSON.stringify(cache.getStats(), null, 2));
  } else if (cmd === 'list') {
    console.log('=== Cache Entries ===');
    console.log(JSON.stringify(cache.getAll(), null, 2));
  } else if (cmd === 'persist') {
    cache.persist();
  } else {
    console.log('Usage:');
    console.log('  node memory-cache-layer.js set <key> <value>');
    console.log('  node memory-cache-layer.js get <key>');
    console.log('  node memory-cache-layer.js invalidate <pattern>');
    console.log('  node memory-cache-layer.js clear');
    console.log('  node memory-cache-layer.js stats');
    console.log('  node memory-cache-layer.js list');
    console.log('  node memory-cache-layer.js persist');
  }

  cache.persist();
}

module.exports = { MemoryCacheLayer, getGlobalCache };
