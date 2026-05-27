/**
 * Phase 2B Alert System
 * Monitors cron execution and sends alerts for failures or performance degradation
 * Runs as a background process checking logs periodically
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = '/home/jeepney/.openclaw/workspace-dev/memory/logs';
const MEMORY_DIR = '/home/jeepney/.openclaw/workspace-dev/memory';
const ALERT_STATE_FILE = path.join(LOG_DIR, '.alert-state.json');

// Alert thresholds
const THRESHOLDS = {
  execution_time_ms: 600000,      // 10 minutes
  error_count_per_week: 5,
  consecutive_failures: 3,
  slow_run_threshold_ms: 300000,  // 5 minutes
};

// Load previous alert state
function loadAlertState() {
  if (fs.existsSync(ALERT_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ALERT_STATE_FILE, 'utf8'));
    } catch (e) {
      return { lastChecked: Date.now(), consecutiveFailures: 0 };
    }
  }
  return { lastChecked: Date.now(), consecutiveFailures: 0 };
}

// Save alert state
function saveAlertState(state) {
  fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(state, null, 2));
}

// Get recent log files
function getRecentLogs(hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const files = fs.readdirSync(LOG_DIR);

  return files
    .filter((f) => f.startsWith('phase2b-cron-run-') && f.endsWith('.log'))
    .map((f) => ({
      name: f,
      path: path.join(LOG_DIR, f),
      mtime: fs.statSync(path.join(LOG_DIR, f)).mtimeMs,
    }))
    .filter((f) => f.mtime > cutoff)
    .sort((a, b) => b.mtime - a.mtime);
}

// Parse log file for metrics
function parseLogFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const metrics = {};

    // Extract execution time
    const timeMatch = content.match(/Detection successful in (\d+)ms/);
    if (timeMatch) {
      metrics.executionTime = parseInt(timeMatch[1]);
      metrics.success = true;
    } else if (content.includes('API call failed')) {
      metrics.success = false;
      metrics.error = 'API call failed';
    } else {
      metrics.success = false;
      metrics.error = 'Unknown error';
    }

    // Extract file count
    const filesMatch = content.match(/Found (\d+) memory files/);
    if (filesMatch) {
      metrics.filesProcessed = parseInt(filesMatch[1]);
    }

    // Extract duplicate count
    const duplicatesMatch = content.match(/Found (\d+) duplicate clusters/);
    if (duplicatesMatch) {
      metrics.duplicatesFound = parseInt(duplicatesMatch[1]);
    }

    return metrics;
  } catch (e) {
    return { success: false, error: 'Failed to parse log' };
  }
}

// Send alert (would integrate with actual notification system)
function sendAlert(severity, title, message) {
  const timestamp = new Date().toISOString();
  const alertLog = path.join(LOG_DIR, 'phase2b-alerts.log');

  const alertEntry = `[${timestamp}] [${severity}] ${title}: ${message}`;
  console.log(alertEntry);

  // Append to alert log
  fs.appendFileSync(alertLog, alertEntry + '\n');

  // In a real system, this would send to Slack/Discord/Email/etc
  // For now, we just log it
}

// Check for failures
function checkForFailures(logs, state) {
  if (logs.length === 0) {
    return;
  }

  const lastLog = logs[0];
  const metrics = parseLogFile(lastLog.path);

  if (!metrics.success) {
    state.consecutiveFailures++;

    if (state.consecutiveFailures === 1) {
      sendAlert('WARNING', 'Cron Execution Failed', metrics.error);
    } else if (state.consecutiveFailures >= THRESHOLDS.consecutive_failures) {
      sendAlert(
        'CRITICAL',
        'Multiple Consecutive Failures',
        `${state.consecutiveFailures} consecutive cron failures detected. Immediate action required.`
      );
    }
  } else {
    state.consecutiveFailures = 0;
  }
}

// Check for slow execution
function checkForSlowRuns(logs) {
  const slowRuns = logs
    .map((log) => ({
      name: log.name,
      metrics: parseLogFile(log.path),
    }))
    .filter((r) => r.metrics.success && r.metrics.executionTime > THRESHOLDS.slow_run_threshold_ms);

  if (slowRuns.length > 0) {
    sendAlert(
      'WARNING',
      'Slow Cron Execution',
      `${slowRuns.length} runs exceeded ${THRESHOLDS.slow_run_threshold_ms}ms threshold`
    );
  }
}

// Check error log volume
function checkErrorLog() {
  const errorLogPath = path.join(LOG_DIR, 'phase2b-cron-errors.log');

  if (!fs.existsSync(errorLogPath)) {
    return;
  }

  const lines = fs
    .readFileSync(errorLogPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  // Check if too many errors in past 7 days (rough estimate)
  if (lines.length > THRESHOLDS.error_count_per_week) {
    sendAlert('WARNING', 'High Error Rate', `${lines.length} errors logged in error log`);
  }
}

// Check API health
async function checkAPIHealth() {
  try {
    const response = await fetch('http://localhost:3010/health', { timeout: 5000 });
    if (!response.ok) {
      sendAlert('WARNING', 'API Health Check Failed', `Phase 2B returned status ${response.status}`);
    }
  } catch (e) {
    sendAlert('CRITICAL', 'API Unreachable', 'Phase 2B service is not responding');
  }
}

// Main monitoring loop
async function monitor() {
  try {
    const state = loadAlertState();
    const recentLogs = getRecentLogs(24);

    // Run checks
    checkForFailures(recentLogs, state);
    checkForSlowRuns(recentLogs);
    checkErrorLog();
    await checkAPIHealth();

    // Update state
    state.lastChecked = Date.now();
    saveAlertState(state);

    console.log(`[${new Date().toISOString()}] Monitor check completed`);
  } catch (e) {
    console.error('Monitor error:', e.message);
  }
}

// Entry point
if (require.main === module) {
  const INTERVAL_MS = parseInt(process.env.ALERT_CHECK_INTERVAL || '600000'); // 10 minutes default

  console.log(`Phase 2B Alert System started (check interval: ${INTERVAL_MS}ms)`);

  // Run immediately
  monitor();

  // Run periodically
  setInterval(monitor, INTERVAL_MS);
}

module.exports = {
  monitor,
  parseLogFile,
  sendAlert,
  THRESHOLDS,
};
