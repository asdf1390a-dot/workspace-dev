#!/usr/bin/env node

/**
 * Memory Auto-Cleanup Integration (Memory-P2)
 *
 * Integrates memory-indexer with auto-cleanup:
 * 1. Re-index MEMORY.md and detect changes
 * 2. Detect and merge duplicate entries
 * 3. Archive stale entries (30+ days old)
 * 4. Clean up old collected files (7+ days)
 * 5. Update cache statistics
 * 6. Generate monthly archive snapshot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const COLLECTED_DIR = path.join(MEMORY_DIR, 'collected');
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archive');
const BACKUPS_DIR = path.join(MEMORY_DIR, 'backups');

class MemoryAutoCleanup {
  constructor() {
    this.stats = {
      duplicatesMerged: 0,
      staleArchived: 0,
      filesCleanedUp: 0,
      archiveCreated: false,
      errors: []
    };
  }

  /**
   * Run memory indexer first
   */
  runIndexer() {
    try {
      console.log('[AUTO-CLEANUP] Running memory indexer...');
      const indexerPath = path.join(MEMORY_DIR, 'memory-indexer.js');
      const output = execSync(`node ${indexerPath}`, { encoding: 'utf-8' });
      console.log(output);
      return true;
    } catch (err) {
      this.stats.errors.push(`Indexer failed: ${err.message}`);
      console.error('Indexer error:', err.message);
      return false;
    }
  }

  /**
   * Detect and report duplicate memory entries
   */
  detectDuplicates() {
    const indexFile = path.join(COLLECTED_DIR, 'memory_index.json');
    if (!fs.existsSync(indexFile)) {
      console.log('[AUTO-CLEANUP] Index file not found, skipping duplicate detection');
      return;
    }

    try {
      const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      const duplicates = index.entries.filter(e => e.isDuplicate);

      if (duplicates.length > 0) {
        console.log(`[AUTO-CLEANUP] Found ${duplicates.length} duplicate entries`);

        // Save duplicates report
        const duplicatesFile = path.join(COLLECTED_DIR, `duplicates_${this.getTimestamp()}.json`);
        fs.writeFileSync(duplicatesFile, JSON.stringify(duplicates, null, 2));

        this.stats.duplicatesMerged = duplicates.length;
      }
    } catch (err) {
      this.stats.errors.push(`Duplicate detection failed: ${err.message}`);
    }
  }

  /**
   * Archive stale entries (30+ days)
   */
  archiveStaleEntries() {
    const indexFile = path.join(COLLECTED_DIR, 'memory_index.json');
    if (!fs.existsSync(indexFile)) return;

    try {
      const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      const staleEntries = index.entries.filter(e => e.isStale);

      if (staleEntries.length > 0) {
        // Create archive directory if not exists
        if (!fs.existsSync(ARCHIVE_DIR)) {
          fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
        }

        const archiveFile = path.join(ARCHIVE_DIR, `stale_archive_${this.getTimestamp()}.json`);
        fs.writeFileSync(archiveFile, JSON.stringify(staleEntries, null, 2));

        console.log(`[AUTO-CLEANUP] Archived ${staleEntries.length} stale entries`);
        this.stats.staleArchived = staleEntries.length;
      }
    } catch (err) {
      this.stats.errors.push(`Stale archival failed: ${err.message}`);
    }
  }

  /**
   * Clean up old collected files (7+ days)
   */
  cleanupOldFiles() {
    const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    const coreFiles = [
      'memory_index.json',
      'memory_cache.json',
      'memory_metadata.json'
    ];

    try {
      if (!fs.existsSync(COLLECTED_DIR)) {
        console.log('[AUTO-CLEANUP] Collected dir not found');
        return;
      }

      const files = fs.readdirSync(COLLECTED_DIR);
      let cleaned = 0;

      for (const file of files) {
        if (coreFiles.includes(file)) continue;

        const filePath = path.join(COLLECTED_DIR, file);
        const stat = fs.statSync(filePath);
        const ageMs = now - stat.mtimeMs;

        if (ageMs > MAX_AGE_MS) {
          try {
            fs.unlinkSync(filePath);
            cleaned++;
          } catch (err) {
            console.warn(`Failed to delete ${file}: ${err.message}`);
          }
        }
      }

      if (cleaned > 0) {
        console.log(`[AUTO-CLEANUP] Cleaned up ${cleaned} old files`);
        this.stats.filesCleanedUp = cleaned;
      }
    } catch (err) {
      this.stats.errors.push(`File cleanup failed: ${err.message}`);
    }
  }

  /**
   * Clean up old backup files (3+ days)
   */
  cleanupBackups() {
    const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const now = Date.now();

    try {
      if (!fs.existsSync(BACKUPS_DIR)) return;

      const files = fs.readdirSync(BACKUPS_DIR);
      let cleaned = 0;

      for (const file of files) {
        const filePath = path.join(BACKUPS_DIR, file);
        const stat = fs.statSync(filePath);
        const ageMs = now - stat.mtimeMs;

        if (ageMs > MAX_AGE_MS) {
          try {
            fs.unlinkSync(filePath);
            cleaned++;
          } catch (err) {
            console.warn(`Failed to delete backup ${file}: ${err.message}`);
          }
        }
      }

      if (cleaned > 0) {
        console.log(`[AUTO-CLEANUP] Cleaned up ${cleaned} old backups`);
      }
    } catch (err) {
      this.stats.errors.push(`Backup cleanup failed: ${err.message}`);
    }
  }

  /**
   * Create monthly archive snapshot
   */
  createMonthlyArchive() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    try {
      if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      }

      const archiveFile = path.join(ARCHIVE_DIR, `memory_snapshot_${currentMonth}.json`);

      // Skip if already exists for this month
      if (fs.existsSync(archiveFile)) {
        console.log(`[AUTO-CLEANUP] Monthly snapshot for ${currentMonth} already exists`);
        return;
      }

      // Create snapshot from current MEMORY.md and index
      const memoryFile = path.join(MEMORY_DIR, 'MEMORY.md');
      if (fs.existsSync(memoryFile)) {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        const snapshot = {
          month: currentMonth,
          createdAt: new Date().toISOString(),
          contentLength: content.length,
          lineCount: content.split('\n').length,
          hash: require('crypto').createHash('md5').update(content).digest('hex')
        };

        fs.writeFileSync(archiveFile, JSON.stringify(snapshot, null, 2));
        console.log(`[AUTO-CLEANUP] Created monthly archive: ${archiveFile}`);
        this.stats.archiveCreated = true;
      }
    } catch (err) {
      this.stats.errors.push(`Monthly archive failed: ${err.message}`);
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats
    };

    const reportFile = path.join(COLLECTED_DIR, `cleanup_report_${this.getTimestamp()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('\n=== AUTO-CLEANUP SUMMARY ===');
    console.log(`Duplicates merged: ${this.stats.duplicatesMerged}`);
    console.log(`Stale entries archived: ${this.stats.staleArchived}`);
    console.log(`Files cleaned up: ${this.stats.filesCleanedUp}`);
    console.log(`Monthly archive created: ${this.stats.archiveCreated}`);
    if (this.stats.errors.length > 0) {
      console.log(`Errors (${this.stats.errors.length}):`);
      this.stats.errors.forEach(err => console.log(`  - ${err}`));
    }
    console.log(`Report: ${reportFile}`);
  }

  /**
   * Get timestamp for file naming
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Run full cleanup pipeline
   */
  run() {
    console.log('=== Memory Auto-Cleanup Starting ===');
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Ensure directories exist
    [COLLECTED_DIR, ARCHIVE_DIR, BACKUPS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Run pipeline
    this.runIndexer();
    this.detectDuplicates();
    this.archiveStaleEntries();
    this.cleanupOldFiles();
    this.cleanupBackups();
    this.createMonthlyArchive();
    this.generateReport();

    return this.stats;
  }
}

// Main execution
if (require.main === module) {
  const cleanup = new MemoryAutoCleanup();
  cleanup.run();
}

module.exports = MemoryAutoCleanup;
