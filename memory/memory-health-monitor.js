#!/usr/bin/env node

/**
 * Memory System Health Monitor (Memory-P2 Part 3)
 *
 * Monitors and reports on memory system health:
 * - Cache performance metrics
 * - Index freshness
 * - Queue depth
 * - Cleanup effectiveness
 * - Sync reliability
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const COLLECTED_DIR = path.join(MEMORY_DIR, 'collected');
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archive');
const BACKUPS_DIR = path.join(MEMORY_DIR, 'backups');

const INDEX_FILE = path.join(COLLECTED_DIR, 'memory_index.json');
const METADATA_FILE = path.join(COLLECTED_DIR, 'memory_metadata.json');
const CACHE_FILE = path.join(COLLECTED_DIR, 'memory_cache.json');
const SYNC_STATE = path.join(COLLECTED_DIR, 'sync_state.json');

class MemoryHealthMonitor {
  constructor() {
    this.health = {
      timestamp: new Date().toISOString(),
      checks: {},
      score: 0,
      status: 'unknown'
    };
  }

  /**
   * Check if index is fresh (within 1 hour)
   */
  checkIndexFreshness() {
    if (!fs.existsSync(METADATA_FILE)) {
      return {
        healthy: false,
        reason: 'metadata file not found',
        age: 'unknown'
      };
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      const lastIndexed = new Date(metadata.lastIndexed);
      const ageMinutes = (Date.now() - lastIndexed) / 60000;

      return {
        healthy: ageMinutes < 60,
        ageMinutes: ageMinutes.toFixed(2),
        lastIndexed: metadata.lastIndexed,
        reason: ageMinutes < 60 ? 'fresh' : 'stale'
      };
    } catch (err) {
      return { healthy: false, reason: 'parse error' };
    }
  }

  /**
   * Check cache performance
   */
  checkCacheHealth() {
    if (!fs.existsSync(CACHE_FILE)) {
      return {
        healthy: false,
        reason: 'cache file not found',
        entries: 0,
        hitRate: 0
      };
    }

    try {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      const entries = cache.entries ? cache.entries.length : 0;
      const meta = cache.metadata || {};

      const totalAccess = (meta.cacheHits || 0) + (meta.cacheMisses || 0);
      const hitRate = totalAccess > 0
        ? ((meta.cacheHits || 0) / totalAccess * 100).toFixed(2)
        : 0;

      return {
        healthy: entries > 0 && hitRate >= 50,
        entries,
        hits: meta.cacheHits || 0,
        misses: meta.cacheMisses || 0,
        hitRate: `${hitRate}%`,
        reason: entries > 0 ? 'operational' : 'empty'
      };
    } catch (err) {
      return { healthy: false, reason: 'parse error' };
    }
  }

  /**
   * Check memory index quality
   */
  checkIndexQuality() {
    if (!fs.existsSync(INDEX_FILE)) {
      return {
        healthy: false,
        entries: 0,
        duplicates: 0,
        staleEntries: 0
      };
    }

    try {
      const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
      const entries = index.entries ? index.entries.length : 0;
      const meta = index.metadata || {};

      const duplicateRate = entries > 0 ? ((meta.duplicatesDetected || 0) / entries * 100).toFixed(2) : 0;
      const staleRate = entries > 0 ? ((meta.staleEntriesCount || 0) / entries * 100).toFixed(2) : 0;

      return {
        healthy: duplicateRate < 5 && staleRate < 30,
        entries,
        categories: index.categories ? Object.keys(index.categories).length : 0,
        duplicates: meta.duplicatesDetected || 0,
        duplicateRate: `${duplicateRate}%`,
        staleEntries: meta.staleEntriesCount || 0,
        staleRate: `${staleRate}%`
      };
    } catch (err) {
      return { healthy: false, reason: 'parse error' };
    }
  }

  /**
   * Check directory sizes and growth
   */
  checkStorageHealth() {
    try {
      const getDirSize = (dir) => {
        if (!fs.existsSync(dir)) return 0;

        return fs.readdirSync(dir).reduce((sum, file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          return sum + (stat.isFile() ? stat.size : 0);
        }, 0);
      };

      const collectedSize = getDirSize(COLLECTED_DIR);
      const archiveSize = getDirSize(ARCHIVE_DIR);
      const backupSize = getDirSize(BACKUPS_DIR);
      const totalSize = collectedSize + archiveSize + backupSize;

      // Alert if >100MB
      const healthy = totalSize < 100 * 1024 * 1024;

      return {
        healthy,
        collectedMB: (collectedSize / 1024 / 1024).toFixed(2),
        archiveMB: (archiveSize / 1024 / 1024).toFixed(2),
        backupMB: (backupSize / 1024 / 1024).toFixed(2),
        totalMB: (totalSize / 1024 / 1024).toFixed(2),
        reason: healthy ? 'normal' : 'excessive'
      };
    } catch (err) {
      return { healthy: false, reason: 'io error' };
    }
  }

  /**
   * Check sync reliability
   */
  checkSyncHealth() {
    if (!fs.existsSync(SYNC_STATE)) {
      return {
        healthy: false,
        reason: 'sync state not found',
        syncs: 0
      };
    }

    try {
      const syncState = JSON.parse(fs.readFileSync(SYNC_STATE, 'utf-8'));
      const totalSyncs = syncState.syncCount || 0;
      const failures = syncState.failureCount || 0;

      const successRate = totalSyncs > 0
        ? ((totalSyncs - failures) / totalSyncs * 100).toFixed(2)
        : 0;

      return {
        healthy: successRate >= 95,
        syncs: totalSyncs,
        failures,
        successRate: `${successRate}%`,
        lastSync: syncState.lastSync,
        reason: successRate >= 95 ? 'reliable' : 'degraded'
      };
    } catch (err) {
      return { healthy: false, reason: 'parse error' };
    }
  }

  /**
   * Check queue depth (memory-automation queue)
   */
  checkQueueHealth() {
    const queueMetricsFile = '/home/jeepney/.openclaw/workspace-dev/memory-automation/queue/metrics.json';
    if (!fs.existsSync(queueMetricsFile)) {
      return {
        healthy: true,
        reason: 'queue not active'
      };
    }

    try {
      const metrics = JSON.parse(fs.readFileSync(queueMetricsFile, 'utf-8'));
      const enqueued = metrics.enqueued || 0;
      const dequeued = metrics.dequeued || 0;
      const expired = metrics.expired || 0;
      const pending = enqueued - dequeued - expired;

      return {
        healthy: pending < 100,
        enqueued,
        dequeued,
        expired,
        pending,
        reason: pending < 100 ? 'normal' : 'backlog'
      };
    } catch (err) {
      return { healthy: false, reason: 'parse error' };
    }
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore() {
    const checks = [
      this.checkIndexFreshness(),
      this.checkCacheHealth(),
      this.checkIndexQuality(),
      this.checkStorageHealth(),
      this.checkSyncHealth(),
      this.checkQueueHealth()
    ];

    const healthyCount = checks.filter(c => c.healthy).length;
    return Math.round((healthyCount / checks.length) * 100);
  }

  /**
   * Run all health checks
   */
  runAllChecks() {
    this.health.checks = {
      indexFreshness: this.checkIndexFreshness(),
      cache: this.checkCacheHealth(),
      indexQuality: this.checkIndexQuality(),
      storage: this.checkStorageHealth(),
      sync: this.checkSyncHealth(),
      queue: this.checkQueueHealth()
    };

    this.health.score = this.calculateHealthScore();

    // Determine overall status
    if (this.health.score >= 90) {
      this.health.status = 'healthy';
    } else if (this.health.score >= 70) {
      this.health.status = 'degraded';
    } else {
      this.health.status = 'unhealthy';
    }

    return this.health;
  }

  /**
   * Generate health report
   */
  generateReport() {
    const report = this.runAllChecks();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     Memory System Health Report        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\nStatus: ${report.status.toUpperCase()}`);
    console.log(`Health Score: ${report.score}/100\n`);

    console.log('📋 Detailed Checks:\n');

    for (const [check, result] of Object.entries(report.checks)) {
      const symbol = result.healthy ? '✅' : '❌';
      console.log(`${symbol} ${check}:`);
      console.log(`   ${JSON.stringify(result, null, 2).split('\n').slice(1, -1).join('\n   ')}`);
    }

    console.log('\n' + '═'.repeat(42) + '\n');

    return report;
  }

  /**
   * Save health report to file
   */
  saveReport() {
    const report = this.runAllChecks();
    const reportFile = path.join(COLLECTED_DIR, `health_report_${Date.now()}.json`);

    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`Report saved to ${reportFile}`);
    } catch (err) {
      console.error('Failed to save report:', err.message);
    }

    return report;
  }
}

// Main execution
if (require.main === module) {
  const monitor = new MemoryHealthMonitor();

  const cmd = process.argv[2];

  if (cmd === 'json') {
    // JSON output only
    const report = monitor.runAllChecks();
    console.log(JSON.stringify(report, null, 2));
  } else if (cmd === 'save') {
    // Generate and save report
    monitor.saveReport();
  } else {
    // Default: pretty print
    monitor.generateReport();
  }
}

module.exports = MemoryHealthMonitor;
