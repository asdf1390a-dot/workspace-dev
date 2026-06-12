#!/usr/bin/env node
// Phase 2 Health Monitor — Memory & FD tracking for predictive restart
// Monitors RSS, VSZ, File Descriptors per process
// Runs every minute via cron (can integrate into watchdog)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_DIR = '/home/jeepney/.openclaw/workspace-dev';
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory-automation');
const LOGS_DIR = path.join(WORKSPACE_DIR, 'memory/logs');
const MONITOR_FILE = path.join(LOGS_DIR, 'phase2-health-monitor.json');

// Thresholds for alerts
const THRESHOLDS = {
  rssWarning: 400 * 1024 * 1024,  // 400 MB
  rssCritical: 500 * 1024 * 1024, // 500 MB
  fdWarning: 800,
  fdCritical: 1000,
  vszWarning: 1024 * 1024 * 1024  // 1 GB
};

const SERVICES = [
  { name: 'Phase2A', port: 3009, script: 'phase2a-message-collection.js' },
  { name: 'Phase2B', port: 3010, script: 'phase2b-express-wrapper.js' },
  { name: 'Phase2C', port: 3011, script: 'phase2c-express-wrapper.js' }
];

// Helper: Read process stats from /proc
function getProcessStats(pid) {
  try {
    const statusPath = `/proc/${pid}/status`;
    const fdPath = `/proc/${pid}/fd`;

    if (!fs.existsSync(statusPath)) return null;

    const status = fs.readFileSync(statusPath, 'utf8');
    const fds = fs.readdirSync(fdPath).length;

    let rss = 0, vsz = 0;
    status.split('\n').forEach(line => {
      if (line.startsWith('VmRSS:')) {
        rss = parseInt(line.match(/\d+/)[0]) * 1024; // KB to bytes
      }
      if (line.startsWith('VmSize:')) {
        vsz = parseInt(line.match(/\d+/)[0]) * 1024; // KB to bytes
      }
    });

    return { rss, vsz, fds, pid };
  } catch (e) {
    return null;
  }
}

// Get PID from port
function getPidFromPort(port) {
  try {
    const result = execSync(`lsof -i :${port} -t 2>/dev/null | tail -1`, { encoding: 'utf8' }).trim();
    return result ? parseInt(result) : null;
  } catch {
    return null;
  }
}

// Log monitoring data
function logEvent(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logPath = path.join(LOGS_DIR, 'phase2-health-monitor.log');
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Alert function (integrate with Telegram if available)
function sendAlert(level, message) {
  logEvent(`${level === 'CRITICAL' ? '🔴' : '🟡'} ALERT: ${message}`);

  // Potential Telegram integration point
  // if (process.env.TELEGRAM_BOT_TOKEN) {
  //   sendTelegramMessage(`Phase 2 Health Alert [${level}]: ${message}`);
  // }
}

// Monitor services
function monitorServices() {
  const timestamp = new Date().toISOString();
  const snapshot = {
    timestamp,
    services: {},
    alerts: []
  };

  SERVICES.forEach(service => {
    const pid = getPidFromPort(service.port);

    if (!pid) {
      logEvent(`⚠️  ${service.name} (${service.port}) - No process found`);
      snapshot.alerts.push({
        service: service.name,
        level: 'WARNING',
        message: 'Service process not found'
      });
      return;
    }

    const stats = getProcessStats(pid);
    if (!stats) {
      logEvent(`⚠️  ${service.name} (${service.port}) - Cannot read stats for PID ${pid}`);
      return;
    }

    snapshot.services[service.name] = {
      pid,
      port: service.port,
      rss: stats.rss,
      rssMB: Math.round(stats.rss / 1024 / 1024),
      vsz: stats.vsz,
      vszMB: Math.round(stats.vsz / 1024 / 1024),
      fds: stats.fds
    };

    // Check thresholds
    if (stats.rss > THRESHOLDS.rssCritical) {
      snapshot.alerts.push({
        service: service.name,
        level: 'CRITICAL',
        metric: 'RSS',
        value: `${Math.round(stats.rss / 1024 / 1024)} MB`,
        threshold: `${THRESHOLDS.rssCritical / 1024 / 1024} MB`
      });
      sendAlert('CRITICAL', `${service.name} RSS memory critical: ${Math.round(stats.rss / 1024 / 1024)} MB`);
    } else if (stats.rss > THRESHOLDS.rssWarning) {
      snapshot.alerts.push({
        service: service.name,
        level: 'WARNING',
        metric: 'RSS',
        value: `${Math.round(stats.rss / 1024 / 1024)} MB`,
        threshold: `${THRESHOLDS.rssWarning / 1024 / 1024} MB`
      });
      sendAlert('WARNING', `${service.name} RSS memory elevated: ${Math.round(stats.rss / 1024 / 1024)} MB`);
    }

    if (stats.fds > THRESHOLDS.fdCritical) {
      snapshot.alerts.push({
        service: service.name,
        level: 'CRITICAL',
        metric: 'FD',
        value: stats.fds,
        threshold: THRESHOLDS.fdCritical
      });
      sendAlert('CRITICAL', `${service.name} file descriptors critical: ${stats.fds}`);
    } else if (stats.fds > THRESHOLDS.fdWarning) {
      snapshot.alerts.push({
        service: service.name,
        level: 'WARNING',
        metric: 'FD',
        value: stats.fds,
        threshold: THRESHOLDS.fdWarning
      });
      sendAlert('WARNING', `${service.name} file descriptors elevated: ${stats.fds}`);
    }

    logEvent(`✓ ${service.name} (PID ${pid}): RSS=${Math.round(stats.rss / 1024 / 1024)}MB, FDs=${stats.fds}`);
  });

  // Write snapshot
  try {
    fs.writeFileSync(MONITOR_FILE, JSON.stringify(snapshot, null, 2));
  } catch (e) {
    logEvent(`❌ Failed to write monitor snapshot: ${e.message}`);
  }

  return snapshot;
}

// Run monitor
if (require.main === module) {
  try {
    logEvent('Starting Phase 2 health monitor...');
    const snapshot = monitorServices();

    if (snapshot.alerts.length > 0) {
      logEvent(`⚠️  Found ${snapshot.alerts.length} alert(s)`);
    } else {
      logEvent('✓ All services healthy');
    }
  } catch (e) {
    logEvent(`❌ Monitor error: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { monitorServices, getProcessStats, getPidFromPort };
