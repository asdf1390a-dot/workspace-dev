#!/usr/bin/env node
/**
 * Monitoring System for Phase 2 Memory Automation
 *
 * Tracks 5 key metrics:
 * 1. Memory RSS (5min interval): Warn if > 350MB
 * 2. Processing Latency (1hr interval): Baseline 3min, warn if > 5min
 * 3. Error Rate (realtime): Collection/dedup/calc success rates
 * 4. Data Integrity (1day): MD5 checksum verification
 * 5. Checkpoint SLA (after cron): Completion within 5min
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class Monitoring {
  constructor(metricsDir = './metrics') {
    this.metricsDir = metricsDir;
    this.metricsFile = path.join(metricsDir, 'metrics.json');
    this.processStartTime = Date.now();
    this.startTime = new Date().toISOString();

    // Ensure metrics directory exists
    try {
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create metrics directory:', e.message);
    }

    // Initialize metrics
    this.metrics = {
      timestamp: this.startTime,
      process: {
        pid: process.pid,
        uptime_ms: 0,
      },
      memory: {
        rss_mb: 0,
        heapUsed_mb: 0,
        external_mb: 0,
      },
      errors: {
        collection: { success: 0, failed: 0, rate: 0 },
        deduplication: { success: 0, failed: 0, rate: 0 },
        calculation: { success: 0, failed: 0, rate: 0 },
      },
      latency: {
        collection_ms: [],
        deduplication_ms: [],
        calculation_ms: [],
      },
      checkpoints: {
        total: 0,
        completed_within_sla: 0,
        sla_rate: 0,
      },
      integrity: {
        last_check: null,
        checksums: {},
      },
    };

    this.saveMetrics();
  }

  /**
   * Metric 1: Memory RSS monitoring
   */
  recordMemory() {
    const mem = process.memoryUsage();
    const rss_mb = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
    const heapUsed_mb = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
    const external_mb = Math.round((mem.external / 1024 / 1024) * 100) / 100;

    this.metrics.memory = { rss_mb, heapUsed_mb, external_mb };

    // Check threshold
    if (rss_mb > 350) {
      console.error(`[ALERT] Memory RSS exceeds 350MB: ${rss_mb}MB`);
      return { alert: true, level: 'critical', metric: 'memory', value: rss_mb };
    }

    return { alert: false, metric: 'memory', value: rss_mb };
  }

  /**
   * Metric 2: Processing latency
   */
  recordLatency(stage, durationMs) {
    if (!this.metrics.latency[`${stage}_ms`]) {
      this.metrics.latency[`${stage}_ms`] = [];
    }

    this.metrics.latency[`${stage}_ms`].push(durationMs);

    // Keep only last 100 entries
    if (this.metrics.latency[`${stage}_ms`].length > 100) {
      this.metrics.latency[`${stage}_ms`].shift();
    }

    // Calculate average
    const avg =
      this.metrics.latency[`${stage}_ms`].reduce((a, b) => a + b, 0) /
      this.metrics.latency[`${stage}_ms`].length;

    // Baseline: 3 minutes for full cycle
    if (avg > 5 * 60 * 1000) {
      // 5 minutes
      console.error(
        `[ALERT] ${stage} latency exceeds 5min baseline: ${Math.round(avg / 1000)}s`
      );
      return { alert: true, level: 'warning', stage, avg_ms: avg };
    }

    return { alert: false, stage, avg_ms: avg };
  }

  /**
   * Metric 3: Error rate tracking
   */
  recordError(stage, success = false) {
    if (!this.metrics.errors[stage]) {
      this.metrics.errors[stage] = { success: 0, failed: 0, rate: 0 };
    }

    if (success) {
      this.metrics.errors[stage].success++;
    } else {
      this.metrics.errors[stage].failed++;
    }

    const total = this.metrics.errors[stage].success + this.metrics.errors[stage].failed;
    this.metrics.errors[stage].rate = total > 0 ?
      ((this.metrics.errors[stage].success / total) * 100).toFixed(1) + '%' : '0%';

    // Alert if error rate > 10%
    const rate = parseFloat(this.metrics.errors[stage].rate);
    if (rate < 90 && total > 10) {
      console.error(
        `[ALERT] ${stage} error rate: ${this.metrics.errors[stage].rate} (${total} total)`
      );
      return { alert: true, level: 'critical', stage, rate: this.metrics.errors[stage].rate };
    }

    return { alert: false, stage, rate: this.metrics.errors[stage].rate };
  }

  /**
   * Metric 4: Data integrity via checksum
   */
  recordChecksum(filename, content) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(content).digest('hex');

    if (!this.metrics.integrity.checksums) {
      this.metrics.integrity.checksums = {};
    }

    const previous = this.metrics.integrity.checksums[filename];
    this.metrics.integrity.checksums[filename] = hash;
    this.metrics.integrity.last_check = new Date().toISOString();

    // Alert if checksum changed unexpectedly
    if (previous && previous !== hash) {
      console.warn(`[WARN] Checksum changed for ${filename}: ${previous} → ${hash}`);
      return { alert: true, level: 'warning', filename, changed: true };
    }

    return { alert: false, filename, hash };
  }

  /**
   * Metric 5: Checkpoint SLA (5 min completion)
   */
  recordCheckpoint(completed = true, durationMs = 0) {
    this.metrics.checkpoints.total++;

    if (completed && durationMs <= 5 * 60 * 1000) {
      // 5 minutes
      this.metrics.checkpoints.completed_within_sla++;
    }

    const total = this.metrics.checkpoints.total;
    this.metrics.checkpoints.sla_rate = (
      (this.metrics.checkpoints.completed_within_sla / total) *
      100
    ).toFixed(1);

    // Alert if SLA rate drops below 90%
    if (parseFloat(this.metrics.checkpoints.sla_rate) < 90) {
      console.error(
        `[ALERT] Checkpoint SLA rate dropped: ${this.metrics.checkpoints.sla_rate}%`
      );
      return { alert: true, level: 'warning', sla_rate: this.metrics.checkpoints.sla_rate };
    }

    return { alert: false, sla_rate: this.metrics.checkpoints.sla_rate };
  }

  /**
   * Update process uptime
   */
  updateUptime() {
    this.metrics.process.uptime_ms = Date.now() - this.processStartTime;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    this.updateUptime();
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Save metrics to file
   */
  saveMetrics() {
    try {
      this.updateUptime();
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (e) {
      console.error('Failed to save metrics:', e.message);
    }
  }

  /**
   * Health check
   */
  health() {
    return {
      process_uptime_s: Math.floor(this.metrics.process.uptime_ms / 1000),
      memory_mb: this.metrics.memory.rss_mb,
      error_rates: this.metrics.errors,
      checkpoint_sla: this.metrics.checkpoints.sla_rate,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { Monitoring };

// Test
if (require.main === module) {
  const monitor = new Monitoring('./metrics');

  // Simulate metrics
  console.log('Recording memory...');
  monitor.recordMemory();

  console.log('Recording latency...');
  monitor.recordLatency('collection', 2000);
  monitor.recordLatency('collection', 2500);

  console.log('Recording errors...');
  monitor.recordError('collection', true);
  monitor.recordError('collection', true);
  monitor.recordError('collection', false);

  console.log('Recording checksum...');
  monitor.recordChecksum('test.json', 'test content');

  console.log('Recording checkpoint...');
  monitor.recordCheckpoint(true, 30000);

  console.log('\nMetrics:');
  console.log(JSON.stringify(monitor.getMetrics(), null, 2));

  monitor.saveMetrics();
  console.log('\nMetrics saved to', monitor.metricsFile);
}
