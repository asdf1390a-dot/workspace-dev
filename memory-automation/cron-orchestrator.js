#!/usr/bin/env node
/**
 * Cron Orchestrator for Phase 2 Memory Automation
 *
 * Consolidates:
 * 1. Message collection → Queue enqueue (phase2a) — every 2 hours
 * 2. Duplicate detection → Queue consume (phase2b) — every 2 hours (offset +30min)
 * 3. Trust score calculation → Storage (phase2c) — every 2 hours (offset +1hr)
 * 4. CTB + Checkpoint consolidation — 2x daily (08:00, 18:00 KST)
 * 5. Backup — every 6 hours
 * 6. Integrity audit — once daily (03:00 KST)
 *
 * Schedule:
 * - 00:00: Collection cycle start
 * - 02:00: Collection cycle start
 * - 04:00: Collection cycle start
 * - 06:00: Collection cycle start
 * - 08:00: [Checkpoint + CTB] + Collection cycle
 * - 10:00: Collection cycle start
 * - 12:00: Collection cycle start
 * - 14:00: Collection cycle start
 * - 16:00: Collection cycle start
 * - 18:00: [Checkpoint + CTB] + Collection cycle
 * - 20:00: Collection cycle start
 * - 22:00: Collection cycle start
 * - 03:00: Daily integrity audit
 * - Every 6 hours: Backup (00, 06, 12, 18)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Service endpoints (configurable via env)
const PHASE2A_URL = process.env.PHASE2A_URL || 'http://localhost:3009';
const PHASE2B_URL = process.env.PHASE2B_URL || 'http://localhost:3010';
const PHASE2C_URL = process.env.PHASE2C_URL || 'http://localhost:3011';
// Default cycle: 2 hours
const CYCLE_INTERVAL_MS = parseInt(process.env.CYCLE_INTERVAL_MS || (2 * 60 * 60 * 1000), 10);

// Test-mode session keys (used when PHASE2A_TEST_MODE=true is set on the phase2a service)
const DEFAULT_SESSION_KEYS = (process.env.SESSION_KEYS || 'default').split(',').map((s) => s.trim()).filter(Boolean);

async function httpJson(method, url, body, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = { raw: text }; }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${url}: ${text.slice(0, 200)}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

class CronOrchestrator {
  constructor(config = {}) {
    this.workspaceDir = config.workspaceDir || '/home/jeepney/.openclaw/workspace-dev';
    this.memoryDir = config.memoryDir ||
      '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory';
    this.scriptDir = config.scriptDir || path.join(this.workspaceDir, 'memory-automation');
    // Daemon log: write to memory-automation/logs/cron-daemon.log (spec requirement)
    this.logDir = config.logDir || path.join(this.scriptDir, 'logs');
    this.daemonLogFile = path.join(this.logDir, 'cron-daemon.log');
    this.schedules = [];
    this.running = false;
    this.daemonTimer = null;
    this.cycleCount = 0;

    // Ensure log directory
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create log directory:', e.message);
    }
  }

  /**
   * Parse cron expression to next run time
   */
  getNextRunTime(cronExpr) {
    // Simple cron parser for "0 H * * *" format
    // Return next Date when this should run
    const now = new Date();
    const parts = cronExpr.split(' ');

    if (parts[0] !== '0') {
      throw new Error('Only hour-based cron supported (0 H * * * format)');
    }

    const targetHour = parseInt(parts[1]);
    const nextRun = new Date(now);
    nextRun.setHours(targetHour, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Log cron activity
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const dailyLog = path.join(this.logDir, `cron-orchestrator-${new Date().toISOString().split('T')[0]}.log`);
    const logMsg = `[${timestamp}] [${level}] ${message}`;

    console.log(logMsg);

    try {
      fs.appendFileSync(dailyLog, logMsg + '\n');
    } catch (e) { /* silent */ }

    // Also append to canonical daemon log file (spec requirement)
    try {
      fs.appendFileSync(this.daemonLogFile, logMsg + '\n');
    } catch (e) { /* silent */ }
  }

  /**
   * Execute a command and return promise
   */
  executeCommand(command, args = [], timeout = 300000) {
    // 5 min default
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        timeout: timeout,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data;
      });

      proc.stderr.on('data', (data) => {
        stderr += data;
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ code, stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Run collection cycle (phase2a → queue)
   * Calls POST /api/collect-messages for each configured session key.
   */
  async runCollectionCycle() {
    this.log('INFO', 'Starting collection cycle (phase2a)');
    const startTime = Date.now();

    try {
      let totalCollected = 0;
      let totalEnqueued = 0;
      const failures = [];

      for (const sessionKey of DEFAULT_SESSION_KEYS) {
        try {
          const r = await httpJson('POST', `${PHASE2A_URL}/api/collect-messages`, {
            sessionKey,
            limit: 100,
            offset: 0,
            includeTools: true,
          });
          totalCollected += r.count || 0;
          totalEnqueued += r.enqueued || 0;
          this.log('INFO', `[2A] session=${sessionKey} collected=${r.count || 0} enqueued=${r.enqueued || 0}`);
        } catch (err) {
          failures.push({ sessionKey, error: err.message });
          this.log('WARN', `[2A] session=${sessionKey} failed: ${err.message}`);
        }
      }

      const duration = Date.now() - startTime;
      this.log('INFO', `Collection cycle completed in ${duration}ms (collected=${totalCollected}, enqueued=${totalEnqueued}, failures=${failures.length})`);
      return { success: failures.length < DEFAULT_SESSION_KEYS.length, duration, totalCollected, totalEnqueued, failures };
    } catch (error) {
      this.log('ERROR', `Collection cycle failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run deduplication (phase2b: queue → deduplicated)
   * Asks phase2b wrapper to dequeue and write messages_deduplicated.jsonl.
   */
  async runDeduplicationCycle() {
    this.log('INFO', 'Starting deduplication cycle (phase2b)');
    const startTime = Date.now();

    try {
      const r = await httpJson('POST', `${PHASE2B_URL}/api/detect-duplicates`, {
        source: 'queue',
        writeOutput: true,
      }, 120000);

      const duration = Date.now() - startTime;
      this.log(
        'INFO',
        `[2B] queueDrained=${r.queueDrained} unique=${r.count} removed=${r.removed} outputFile=${r.outputFile}`
      );
      this.log('INFO', `Deduplication completed in ${duration}ms`);
      return { success: true, duration, ...r };
    } catch (error) {
      this.log('ERROR', `Deduplication failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run trust score calculation (phase2c)
   * Reads messages_deduplicated.jsonl and writes messages_with_scores.jsonl.
   */
  async runCalculationCycle() {
    this.log('INFO', 'Starting calculation cycle (phase2c)');
    const startTime = Date.now();

    try {
      const r = await httpJson('POST', `${PHASE2C_URL}/api/calculate-trust-scores`, {
        source: 'file',
        writeOutput: true,
      }, 120000);

      const duration = Date.now() - startTime;
      this.log(
        'INFO',
        `[2C] processed=${r.processed} accepted=${r.accepted} quarantined=${r.quarantined} rejected=${r.rejected} outputFile=${r.outputFile}`
      );
      this.log('INFO', `Calculation completed in ${duration}ms`);
      return { success: true, duration, ...r };
    } catch (error) {
      this.log('ERROR', `Calculation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run full pipeline: A → B → C → checkpoint
   */
  async runFullPipeline() {
    this.cycleCount++;
    this.log('INFO', `=== Full pipeline cycle #${this.cycleCount} starting ===`);
    const startTime = Date.now();

    const collection = await this.runCollectionCycle();
    const dedup = await this.runDeduplicationCycle();
    const calc = await this.runCalculationCycle();
    const checkpoint = await this.runCheckpoint();

    const duration = Date.now() - startTime;
    this.log('INFO', `=== Full pipeline cycle #${this.cycleCount} done in ${duration}ms ===`);
    return { cycle: this.cycleCount, duration, collection, dedup, calc, checkpoint };
  }

  /**
   * Start daemon: run pipeline every CYCLE_INTERVAL_MS
   */
  startDaemon() {
    if (this.running) {
      this.log('WARN', 'Daemon already running');
      return;
    }
    this.running = true;
    this.log('INFO', `Daemon starting (interval=${CYCLE_INTERVAL_MS}ms, ~${Math.round(CYCLE_INTERVAL_MS / 60000)}min)`);
    this.log('INFO', `Endpoints: 2A=${PHASE2A_URL} 2B=${PHASE2B_URL} 2C=${PHASE2C_URL}`);

    // Kick off first cycle immediately
    this.runFullPipeline().catch((err) => this.log('ERROR', `First cycle error: ${err.message}`));

    this.daemonTimer = setInterval(() => {
      this.runFullPipeline().catch((err) => this.log('ERROR', `Cycle error: ${err.message}`));
    }, CYCLE_INTERVAL_MS);

    // Signal handlers for graceful shutdown
    const shutdown = (sig) => {
      this.log('INFO', `${sig} received, shutting down daemon (cycles completed=${this.cycleCount})`);
      if (this.daemonTimer) clearInterval(this.daemonTimer);
      this.running = false;
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Run backup (every 6 hours)
   */
  async runBackup() {
    this.log('INFO', 'Starting backup cycle');
    const startTime = Date.now();

    try {
      // Backup MEMORY.md and key files
      const backupDir = path.join(this.memoryDir, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const memoryFile = path.join(this.memoryDir, '..', 'MEMORY.md');
      if (fs.existsSync(memoryFile)) {
        const backupFile = path.join(
          backupDir,
          `MEMORY_${new Date().toISOString().split('T')[0]}_${new Date().getHours().toString().padStart(2, '0')}.md.bak`
        );
        fs.copyFileSync(memoryFile, backupFile);
        this.log('INFO', `Backup saved: ${path.basename(backupFile)}`);
      }

      this.log('INFO', 'Backup completed in ' + (Date.now() - startTime) + 'ms');
      return { success: true, duration: Date.now() - startTime };
    } catch (error) {
      this.log('ERROR', `Backup failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run checkpoint + CTB update (2x daily)
   */
  async runCheckpoint() {
    this.log('INFO', 'Running checkpoint + CTB update');
    const startTime = Date.now();

    try {
      // Update CTB (memory/CTB_*.json)
      const ctbFile = path.join(this.memoryDir, `CTB_${new Date().toISOString().split('T')[0]}.json`);
      const ctb = {
        timestamp: new Date().toISOString(),
        cycle: Math.floor(Date.now() / (60 * 60 * 1000)),
        phase2_status: {
          collection: 'ready',
          deduplication: 'ready',
          calculation: 'ready',
        },
      };
      fs.writeFileSync(ctbFile, JSON.stringify(ctb, null, 2));

      this.log('INFO', `Checkpoint completed in ${Date.now() - startTime}ms`);
      return { success: true, duration: Date.now() - startTime };
    } catch (error) {
      this.log('ERROR', `Checkpoint failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run integrity audit (daily)
   */
  async runIntegrityAudit() {
    this.log('INFO', 'Running integrity audit');
    const startTime = Date.now();

    try {
      // Check key files exist and are readable
      const files = [
        path.join(this.memoryDir, '..', 'MEMORY.md'),
        path.join(this.memoryDir, 'messages.jsonl'),
        path.join(this.memoryDir, 'messages_deduplicated.jsonl'),
      ];

      const audit = {
        timestamp: new Date().toISOString(),
        files: {},
      };

      for (const file of files) {
        try {
          const stats = fs.statSync(file);
          audit.files[path.basename(file)] = {
            exists: true,
            size: stats.size,
            mtime: stats.mtime.toISOString(),
          };
        } catch (e) {
          audit.files[path.basename(file)] = {
            exists: false,
            error: e.message,
          };
        }
      }

      this.log('INFO', `Integrity audit completed in ${Date.now() - startTime}ms`);
      return { success: true, duration: Date.now() - startTime, audit };
    } catch (error) {
      this.log('ERROR', `Integrity audit failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get schedule status
   */
  getStatus() {
    return {
      running: this.running,
      timestamp: new Date().toISOString(),
      next_collection: this.getNextRunTime('0 */2 * * *'),
      next_checkpoint: this.getNextRunTime('0 8 * * *'), // 08:00
      next_backup: this.getNextRunTime('0 */6 * * *'),
      next_audit: this.getNextRunTime('0 3 * * *'), // 03:00
    };
  }
}

module.exports = { CronOrchestrator };

// CLI
if (require.main === module) {
  const orchestrator = new CronOrchestrator();

  const cmd = process.argv[2];

  if (cmd === 'status') {
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
  } else if (cmd === 'backup') {
    orchestrator.runBackup().then((result) => {
      console.log('Backup result:', result);
      process.exit(result.success ? 0 : 1);
    });
  } else if (cmd === 'checkpoint') {
    orchestrator.runCheckpoint().then((result) => {
      console.log('Checkpoint result:', result);
      process.exit(result.success ? 0 : 1);
    });
  } else if (cmd === 'audit') {
    orchestrator.runIntegrityAudit().then((result) => {
      console.log('Audit result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    });
  } else if (cmd === 'pipeline') {
    // One-shot end-to-end run (A → B → C → checkpoint)
    orchestrator.runFullPipeline().then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }).catch((err) => {
      console.error('Pipeline failed:', err.message);
      process.exit(1);
    });
  } else if (cmd === '--daemon' || cmd === 'daemon') {
    orchestrator.startDaemon();
    // Keep alive
  } else {
    console.log('Usage: node cron-orchestrator.js [status|backup|checkpoint|audit|pipeline|--daemon]');
  }
}
