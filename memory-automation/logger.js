#!/usr/bin/env node
/**
 * Logging System for Phase 2 Memory Automation
 *
 * Levels:
 * - DEBUG: Only when DEBUG=1 env var set
 * - WARN: Console.warn output
 * - ERROR: Console.error output
 * - CRITICAL: Console.error + file
 *
 * INFO level is intentionally removed to reduce noise.
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.debug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
    this.errorLogFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);

    // Ensure log directory exists
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create log directory:', e.message);
    }
  }

  /**
   * Debug level - only if DEBUG env var set
   */
  debug(message, data = null) {
    if (!this.debug) return;
    const timestamp = new Date().toISOString();
    const msg = data ? `${message} ${JSON.stringify(data)}` : message;
    console.log(`[${timestamp}] [DEBUG] ${msg}`);
  }

  /**
   * Warning level
   */
  warn(message, data = null) {
    const timestamp = new Date().toISOString();
    const msg = data ? `${message} ${JSON.stringify(data)}` : message;
    console.warn(`[${timestamp}] [WARN] ${msg}`);
  }

  /**
   * Error level
   */
  error(message, data = null) {
    const timestamp = new Date().toISOString();
    const msg = data ? `${message} ${JSON.stringify(data)}` : message;
    console.error(`[${timestamp}] [ERROR] ${msg}`);

    // Also log to file
    try {
      const logEntry = `[${timestamp}] [ERROR] ${msg}\n`;
      fs.appendFileSync(this.errorLogFile, logEntry);
    } catch (e) {
      // Silently fail file logging
    }
  }

  /**
   * Critical level - severe errors
   */
  critical(message, data = null) {
    const timestamp = new Date().toISOString();
    const msg = data ? `${message} ${JSON.stringify(data)}` : message;
    console.error(`[${timestamp}] [CRITICAL] ${msg}`);

    // Log to file
    try {
      const logEntry = `[${timestamp}] [CRITICAL] ${msg}\n`;
      fs.appendFileSync(this.errorLogFile, logEntry);
    } catch (e) {
      // Silently fail file logging
    }
  }

  /**
   * Get error log file path
   */
  getErrorLogFile() {
    return this.errorLogFile;
  }
}

module.exports = { Logger };

// Test
if (require.main === module) {
  const logger = new Logger('./logs');
  logger.warn('This is a warning');
  logger.error('This is an error');
  logger.critical('This is a critical issue');

  // Test debug (needs DEBUG=1)
  if (process.env.DEBUG === '1') {
    logger.debug('Debug message');
  }
}
