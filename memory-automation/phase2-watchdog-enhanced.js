#!/usr/bin/env node
// Enhanced Phase 2 Watchdog — Predictive restart + dependency checks
// Integrates health monitor data for proactive maintenance
// Runs every 2 minutes via cron

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { monitorServices, getProcessStats, getPidFromPort } = require('./phase2-health-monitor');

const WORKSPACE_DIR = '/home/jeepney/.openclaw/workspace-dev';
const LOGS_DIR = path.join(WORKSPACE_DIR, 'memory/logs');
const CRASH_DUMP_DIR = path.join(LOGS_DIR, 'phase2-crashes');

// Create crash dump directory if needed
if (!fs.existsSync(CRASH_DUMP_DIR)) {
  fs.mkdirSync(CRASH_DUMP_DIR, { recursive: true });
}

// Predictive restart thresholds (more aggressive than health-monitor)
const PREDICTIVE_THRESHOLDS = {
  rssRestart: 450 * 1024 * 1024,    // 450 MB - trigger preventive restart
  fdRestart: 900,                    // 900 FDs - trigger preventive restart
  uptimeMinutes: 120                 // Restart every 2 hours as fallback
};

const SERVICES = [
  { name: 'Phase2A', port: 3009, script: 'phase2a-message-collection.js' },
  { name: 'Phase2B', port: 3010, script: 'phase2b-express-wrapper.js' },
  { name: 'Phase2C', port: 3011, script: 'phase2c-express-wrapper.js' }
];

// Helper: log events
function logEvent(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logPath = path.join(LOGS_DIR, 'phase2-watchdog-enhanced.log');
  console.log(`[${timestamp}] ${message}`);
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    console.error(`Failed to write log: ${e.message}`);
  }
}

// Check dependency health
function checkDependencies() {
  const deps = {
    redis: false,
    database: false,
    network: true
  };

  // Check Redis
  try {
    execSync('redis-cli ping 2>/dev/null', { timeout: 2000 });
    deps.redis = true;
  } catch (e) {
    logEvent('⚠️  Redis unavailable');
  }

  // Check database connection (via port 5432 if available)
  try {
    const result = execSync('nc -zv 127.0.0.1 5432 2>&1 | grep -q open', { timeout: 2000 });
    deps.database = true;
  } catch (e) {
    logEvent('⚠️  Database unavailable');
  }

  return deps;
}

// Capture crash state before restart
function captureCrashState(service, stats, pid) {
  const timestamp = new Date().toISOString().slice(0, 19);
  const dumpFile = path.join(CRASH_DUMP_DIR, `${service.name}-${timestamp.replace(/[:]/g, '-')}.json`);

  const crashDump = {
    timestamp,
    service: service.name,
    port: service.port,
    pid,
    metrics: {
      rss: stats.rss,
      rssMB: Math.round(stats.rss / 1024 / 1024),
      vsz: stats.vsz,
      vszMB: Math.round(stats.vsz / 1024 / 1024),
      fds: stats.fds
    },
    restartReason: stats.rss > PREDICTIVE_THRESHOLDS.rssRestart ? 'RSS_THRESHOLD' : 'FD_THRESHOLD',
    dependencies: checkDependencies()
  };

  try {
    fs.writeFileSync(dumpFile, JSON.stringify(crashDump, null, 2));
    logEvent(`📋 Crash state dumped: ${dumpFile}`);
  } catch (e) {
    logEvent(`❌ Failed to dump crash state: ${e.message}`);
  }

  return crashDump;
}

// Graceful restart with pre-restart state capture
function gracefulRestart(service, reason) {
  const pid = getPidFromPort(service.port);
  if (!pid) return;

  const stats = getProcessStats(pid);
  if (!stats) return;

  logEvent(`🔄 ${service.name} (${service.port}) — Graceful restart (${reason})`);

  // Capture state before restart
  captureCrashState(service, stats, pid);

  try {
    // Try graceful shutdown first (SIGTERM)
    process.kill(pid, 'SIGTERM');
    logEvent(`  → Sent SIGTERM to PID ${pid}`);

    // Wait 3 seconds for graceful shutdown
    let waited = 0;
    while (getPidFromPort(service.port) && waited < 3000) {
      waited += 100;
      execSync('sleep 0.1');
    }

    // Force kill if still running
    if (getPidFromPort(service.port)) {
      process.kill(pid, 'SIGKILL');
      logEvent(`  → Sent SIGKILL to PID ${pid}`);
    }
  } catch (e) {
    logEvent(`  ⚠️  Kill signal failed: ${e.message}`);
  }

  // Wait before restart
  execSync('sleep 2');

  // Restart service
  try {
    const env = service.name === 'Phase2B' ? 'PORT=3010' : (service.name === 'Phase2C' ? 'PORT=3011' : '');
    const cmd = env ? `${env} node ${service.script}` : `node ${service.script}`;

    execSync(`cd ${path.join(WORKSPACE_DIR, 'memory-automation')} && nohup bash -c "${cmd}" >> ${LOGS_DIR}/${service.name}-restart.log 2>&1 &`);
    logEvent(`  ✅ Restart command sent`);

    // Verify restart
    execSync('sleep 2');
    const newPid = getPidFromPort(service.port);
    if (newPid) {
      logEvent(`  ✅ ${service.name} restarted successfully (new PID: ${newPid})`);
    } else {
      logEvent(`  ❌ ${service.name} failed to restart`);
    }
  } catch (e) {
    logEvent(`  ❌ Restart failed: ${e.message}`);
  }
}

// Forced restart (reactive to health check failure)
function forcedRestart(service, reason) {
  logEvent(`🔴 ${service.name} (${service.port}) — Forced restart (${reason})`);

  try {
    execSync(`pkill -f "${service.script}" 2>/dev/null || true`);
    execSync('sleep 1');

    const env = service.name === 'Phase2B' ? 'PORT=3010' : (service.name === 'Phase2C' ? 'PORT=3011' : '');
    const cmd = env ? `${env} node ${service.script}` : `node ${service.script}`;

    execSync(`cd ${path.join(WORKSPACE_DIR, 'memory-automation')} && nohup bash -c "${cmd}" >> ${LOGS_DIR}/${service.name}-restart.log 2>&1 &`);
    logEvent(`  ✅ Force restart sent`);

    execSync('sleep 2');
    const newPid = getPidFromPort(service.port);
    if (newPid) {
      logEvent(`  ✅ ${service.name} force-restarted (PID: ${newPid})`);
    } else {
      logEvent(`  ❌ ${service.name} failed to restart`);
    }
  } catch (e) {
    logEvent(`  ❌ Force restart failed: ${e.message}`);
  }
}

// Check and restart service
function checkAndRestartService(service) {
  // First, reactive health check
  try {
    execSync(`curl -s http://127.0.0.1:${service.port}/health >/dev/null 2>&1`);
  } catch (e) {
    // Service is down
    forcedRestart(service, 'HEALTH_CHECK_FAILED');
    return;
  }

  // Second, proactive resource monitoring
  const pid = getPidFromPort(service.port);
  if (!pid) return;

  const stats = getProcessStats(pid);
  if (!stats) return;

  // Predictive restart if memory/FDs are high
  if (stats.rss > PREDICTIVE_THRESHOLDS.rssRestart) {
    gracefulRestart(service, `RSS_HIGH(${Math.round(stats.rss / 1024 / 1024)}MB)`);
  } else if (stats.fds > PREDICTIVE_THRESHOLDS.fdRestart) {
    gracefulRestart(service, `FD_HIGH(${stats.fds})`);
  }
}

// Main watchdog cycle
function runWatchdog() {
  try {
    logEvent('Watchdog cycle started');

    // Run health monitor
    monitorServices();

    // Check each service
    SERVICES.forEach(service => {
      checkAndRestartService(service);
    });

    // Check Next.js portal
    try {
      execSync('curl -s http://127.0.0.1:3000 >/dev/null 2>&1');
    } catch (e) {
      logEvent('⚠️  Next.js FMS Portal (3000) DOWN — Restarting...');
      try {
        execSync('pkill -f "next dev" 2>/dev/null || true');
        execSync('sleep 1');
        execSync(`cd ${path.join(WORKSPACE_DIR, 'dsc-fms-portal')} && nohup npm run dev >> ${LOGS_DIR}/nextjs-restart.log 2>&1 &`);
        execSync('sleep 3');
        execSync('curl -s http://127.0.0.1:3000 >/dev/null 2>&1');
        logEvent('✅ Next.js FMS Portal restarted successfully');
      } catch (e2) {
        logEvent(`❌ Failed to restart Next.js portal: ${e2.message}`);
      }
    }

    logEvent('✓ Watchdog cycle complete');
  } catch (e) {
    logEvent(`❌ Watchdog error: ${e.message}`);
  }
}

// Run watchdog
if (require.main === module) {
  runWatchdog();
}

module.exports = { checkAndRestartService, forcedRestart, gracefulRestart };
