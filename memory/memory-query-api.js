#!/usr/bin/env node

/**
 * Memory Query API (Memory-P2)
 *
 * Simple interface for querying indexed memory entries.
 * Used by other scripts to look up memory entries quickly.
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const COLLECTED_DIR = path.join(MEMORY_DIR, 'collected');
const INDEX_FILE = path.join(COLLECTED_DIR, 'memory_index.json');
const METADATA_FILE = path.join(COLLECTED_DIR, 'memory_metadata.json');
const CACHE_FILE = path.join(COLLECTED_DIR, 'memory_cache.json');

class MemoryQueryAPI {
  constructor() {
    this.index = null;
    this.metadata = null;
    this.cache = new Map();
    this.loadIndex();
  }

  /**
   * Load index from disk
   */
  loadIndex() {
    try {
      if (fs.existsSync(INDEX_FILE)) {
        this.index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
      }

      if (fs.existsSync(METADATA_FILE)) {
        this.metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      }

      if (fs.existsSync(CACHE_FILE)) {
        const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        if (cacheData.entries) {
          cacheData.entries.forEach(item => {
            this.cache.set(item.key, item.value);
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load index:', err.message);
      this.index = null;
      this.metadata = null;
    }
  }

  /**
   * Check if index is loaded
   */
  isReady() {
    return this.index !== null;
  }

  /**
   * Get all entries in a category
   */
  getByCategory(category) {
    if (!this.index) return [];
    if (!this.index.categories[category]) return [];

    const ids = this.index.categories[category];
    return this.index.entries.filter(e => ids.includes(e.id));
  }

  /**
   * Get entry by ID
   */
  getById(id) {
    if (!this.index) return null;
    return this.index.entries.find(e => e.id === id) || null;
  }

  /**
   * Search entries by query
   */
  search(query) {
    if (!this.index) return [];

    const q = query.toLowerCase();
    return this.index.entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.link.toLowerCase().includes(q) ||
      (e.preview && e.preview.toLowerCase().includes(q))
    );
  }

  /**
   * Get all categories
   */
  getCategories() {
    if (!this.index) return [];
    return Object.keys(this.index.categories);
  }

  /**
   * Get category counts
   */
  getCategoryCounts() {
    if (!this.index) return {};

    const counts = {};
    for (const [category, ids] of Object.entries(this.index.categories)) {
      counts[category] = ids.length;
    }
    return counts;
  }

  /**
   * Get all entries
   */
  getAllEntries() {
    if (!this.index) return [];
    return this.index.entries;
  }

  /**
   * Get statistics
   */
  getStats() {
    if (!this.index) return null;

    return {
      totalEntries: this.index.entries.length,
      categories: this.getCategoryCounts(),
      duplicates: this.metadata?.duplicatesDetected || 0,
      staleEntries: this.metadata?.staleEntriesCount || 0,
      cacheSize: this.cache.size,
      lastIndexed: this.metadata?.lastIndexed || null
    };
  }

  /**
   * Get recent entries (ordered by timestamp)
   */
  getRecent(limit = 10) {
    if (!this.index) return [];

    const withTimestamp = this.index.entries
      .filter(e => e.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return withTimestamp.slice(0, limit);
  }

  /**
   * Get feedback entries (for compliance checking)
   */
  getFeedbackRules() {
    const feedback = this.getByCategory('feedback');
    return feedback.map(e => ({
      id: e.id,
      title: e.title,
      link: e.link,
      timestamp: e.timestamp
    }));
  }

  /**
   * Get project entries
   */
  getProjects() {
    return this.getByCategory('project');
  }

  /**
   * Get reference materials
   */
  getReferences() {
    return this.getByCategory('reference');
  }

  /**
   * Get user info
   */
  getUserInfo() {
    return this.getByCategory('user');
  }

  /**
   * Get incidents
   */
  getIncidents() {
    return this.getByCategory('incident');
  }
}

// Export for use as module
module.exports = MemoryQueryAPI;

// CLI interface if run directly
if (require.main === module) {
  const api = new MemoryQueryAPI();

  if (!api.isReady()) {
    console.error('Memory index not loaded. Run memory-indexer.js first.');
    process.exit(1);
  }

  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'stats':
      console.log(JSON.stringify(api.getStats(), null, 2));
      break;

    case 'categories':
      console.log(JSON.stringify(api.getCategories(), null, 2));
      break;

    case 'list':
      const category = args[0] || 'feedback';
      console.log(JSON.stringify(api.getByCategory(category), null, 2));
      break;

    case 'search':
      const query = args.join(' ');
      console.log(JSON.stringify(api.search(query), null, 2));
      break;

    case 'recent':
      const limit = parseInt(args[0]) || 10;
      console.log(JSON.stringify(api.getRecent(limit), null, 2));
      break;

    case 'rules':
      console.log(JSON.stringify(api.getFeedbackRules(), null, 2));
      break;

    default:
      console.log('Memory Query API');
      console.log('Usage:');
      console.log('  node memory-query-api.js stats                  - Show statistics');
      console.log('  node memory-query-api.js categories              - List categories');
      console.log('  node memory-query-api.js list [category]         - List entries in category');
      console.log('  node memory-query-api.js search <query>          - Search entries');
      console.log('  node memory-query-api.js recent [limit]          - Get recent entries');
      console.log('  node memory-query-api.js rules                   - Get feedback rules');
  }
}
