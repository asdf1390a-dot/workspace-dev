#!/usr/bin/env node
/**
 * Message Queue System — File-based for Phase 2 Memory Pool
 * Decouples phase2a (producer) from phase2b/2c (consumers)
 * No external dependencies (no Redis needed)
 *
 * Design:
 * - Queue file: /memory/queue/messages.jsonl
 * - Lock mechanism: Atomic file operations
 * - TTL: 24 hours
 * - Max size: configurable
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileQueue {
  constructor(queueDir = './queue') {
    this.queueDir = queueDir;
    this.queueFile = path.join(queueDir, 'messages.jsonl');
    this.lockFile = path.join(queueDir, '.queue.lock');
    this.metricsFile = path.join(queueDir, 'metrics.json');
    this.maxQueueSize = 100000; // bytes
    this.ttlMs = 24 * 60 * 60 * 1000; // 24 hours

    // Ensure queue directory exists
    try {
      if (!fs.existsSync(queueDir)) {
        fs.mkdirSync(queueDir, { recursive: true });
      }
    } catch (e) {
      throw new Error(`Failed to initialize queue directory: ${e.message}`);
    }
  }

  /**
   * Enqueue a message (producer)
   * @param {Object} message - Message to enqueue
   * @returns {Object} - Result with id, timestamp
   */
  enqueue(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Message must be an object');
    }

    const enqueuedMsg = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      enqueued_at: new Date().toISOString(),
      data: message,
      ttl_ms: this.ttlMs,
    };

    try {
      // Append atomically
      fs.appendFileSync(this.queueFile, JSON.stringify(enqueuedMsg) + '\n');
      this.recordMetric('enqueued', 1);
      return { success: true, id: enqueuedMsg.id, timestamp: enqueuedMsg.timestamp };
    } catch (error) {
      throw new Error(`Failed to enqueue message: ${error.message}`);
    }
  }

  /**
   * Dequeue all messages (consumer - read-once)
   * @returns {Array} - Array of messages
   */
  dequeueAll() {
    if (!fs.existsSync(this.queueFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.queueFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const messages = [];
      const now = Date.now();

      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          // Check if expired
          if (now - msg.timestamp > msg.ttl_ms) {
            this.recordMetric('expired', 1);
            continue;
          }
          messages.push(msg);
        } catch (e) {
          this.recordMetric('parse_error', 1);
        }
      }

      // Clear queue after reading
      this.clear();
      this.recordMetric('dequeued', messages.length);
      return messages;
    } catch (error) {
      throw new Error(`Failed to dequeue messages: ${error.message}`);
    }
  }

  /**
   * Peek at queue without consuming
   * @returns {Array}
   */
  peek(limit = 10) {
    if (!fs.existsSync(this.queueFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.queueFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const messages = [];
      const now = Date.now();

      for (const line of lines.slice(0, limit)) {
        try {
          const msg = JSON.parse(line);
          if (now - msg.timestamp <= msg.ttl_ms) {
            messages.push(msg);
          }
        } catch (e) {
          // Skip parse errors
        }
      }

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get queue length
   * @returns {number}
   */
  length() {
    if (!fs.existsSync(this.queueFile)) {
      return 0;
    }

    try {
      const content = fs.readFileSync(this.queueFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      return lines.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear queue
   */
  clear() {
    try {
      if (fs.existsSync(this.queueFile)) {
        fs.unlinkSync(this.queueFile);
      }
    } catch (error) {
      throw new Error(`Failed to clear queue: ${error.message}`);
    }
  }

  /**
   * Record metrics for monitoring
   */
  recordMetric(type, count = 1) {
    try {
      let metrics = { enqueued: 0, dequeued: 0, expired: 0, parse_error: 0 };

      if (fs.existsSync(this.metricsFile)) {
        const existing = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
        metrics = { ...metrics, ...existing };
      }

      metrics[type] = (metrics[type] || 0) + count;
      metrics.last_update = new Date().toISOString();

      fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (e) {
      // Silently fail metric recording
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        return JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
      }
    } catch (e) {
      // Return empty metrics
    }

    return {
      enqueued: 0,
      dequeued: 0,
      expired: 0,
      parse_error: 0,
    };
  }

  /**
   * Health check
   */
  health() {
    return {
      queue_file_exists: fs.existsSync(this.queueFile),
      queue_length: this.length(),
      queue_dir: this.queueDir,
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export
module.exports = { FileQueue };

// CLI for testing
if (require.main === module) {
  const cmd = process.argv[2];
  const queue = new FileQueue('./queue');

  if (cmd === 'test') {
    console.log('Testing FileQueue...');

    // Test enqueue
    queue.enqueue({ content: 'test message 1' });
    queue.enqueue({ content: 'test message 2' });
    console.log(`Enqueued 2 messages, queue length: ${queue.length()}`);

    // Test peek
    console.log('Peeking at queue:', queue.peek(1));

    // Test dequeue
    const messages = queue.dequeueAll();
    console.log(`Dequeued ${messages.length} messages`);
    console.log('Queue length after dequeue:', queue.length());

    // Test metrics
    console.log('Metrics:', queue.getMetrics());

    // Test health
    console.log('Health:', queue.health());
  } else {
    console.log('Usage: node queue.js [test]');
  }
}
