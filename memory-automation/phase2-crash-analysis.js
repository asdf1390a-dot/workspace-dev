#!/usr/bin/env node
// Phase 2 Crash Analysis & Logging
// Aggregates crash dumps and generates analysis reports
// Run periodically to detect patterns and identify root causes

const fs = require('fs');
const path = require('path');

const LOGS_DIR = '/home/jeepney/.openclaw/workspace-dev/memory/logs';
const CRASH_DUMP_DIR = path.join(LOGS_DIR, 'phase2-crashes');
const ANALYSIS_FILE = path.join(LOGS_DIR, 'phase2-crash-analysis.json');
const HEALTH_MONITOR_FILE = path.join(LOGS_DIR, 'phase2-health-monitor.json');

// Ensure directories exist
if (!fs.existsSync(CRASH_DUMP_DIR)) {
  fs.mkdirSync(CRASH_DUMP_DIR, { recursive: true });
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${message}`);
  try {
    const logPath = path.join(LOGS_DIR, 'phase2-crash-analysis.log');
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    console.error(`Failed to write log: ${e.message}`);
  }
}

// Read crash dumps
function getCrashDumps(limit = 50) {
  try {
    const files = fs.readdirSync(CRASH_DUMP_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    return files.map(file => {
      try {
        const content = fs.readFileSync(path.join(CRASH_DUMP_DIR, file), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  } catch (e) {
    log(`⚠️  Failed to read crash dumps: ${e.message}`);
    return [];
  }
}

// Get current health snapshot
function getCurrentHealth() {
  try {
    if (fs.existsSync(HEALTH_MONITOR_FILE)) {
      const content = fs.readFileSync(HEALTH_MONITOR_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    log(`⚠️  Failed to read health monitor file: ${e.message}`);
  }
  return null;
}

// Analyze crash patterns
function analyzeCrashPatterns(crashes) {
  const patterns = {
    byService: {},
    byReason: {},
    timeCluster: [],
    highMemoryCrashes: 0,
    highFdCrashes: 0,
    totalCrashes: crashes.length
  };

  crashes.forEach(crash => {
    const service = crash.service || 'unknown';
    const reason = crash.restartReason || 'unknown';
    const rssMB = crash.metrics.rssMB || 0;
    const fds = crash.metrics.fds || 0;

    // Group by service
    if (!patterns.byService[service]) {
      patterns.byService[service] = { count: 0, avgRss: 0, avgFd: 0 };
    }
    patterns.byService[service].count++;
    patterns.byService[service].avgRss = (patterns.byService[service].avgRss + rssMB) / 2;
    patterns.byService[service].avgFd = (patterns.byService[service].avgFd + fds) / 2;

    // Group by reason
    if (!patterns.byReason[reason]) {
      patterns.byReason[reason] = { count: 0, avgRss: 0 };
    }
    patterns.byReason[reason].count++;
    patterns.byReason[reason].avgRss = (patterns.byReason[reason].avgRss + rssMB) / 2;

    // Count high memory/FD crashes
    if (rssMB > 450) patterns.highMemoryCrashes++;
    if (fds > 900) patterns.highFdCrashes++;
  });

  // Detect time clustering
  if (crashes.length > 1) {
    const timestamps = crashes.map(c => new Date(c.timestamp).getTime());
    let lastTime = timestamps[0];
    let cluster = [crashes[0]];

    for (let i = 1; i < timestamps.length; i++) {
      const timeDiff = (lastTime - timestamps[i]) / 1000 / 60; // minutes
      if (timeDiff < 30) {
        cluster.push(crashes[i]);
      } else {
        if (cluster.length > 1) {
          patterns.timeCluster.push({
            count: cluster.length,
            startTime: cluster[cluster.length - 1].timestamp,
            endTime: cluster[0].timestamp,
            services: [...new Set(cluster.map(c => c.service))]
          });
        }
        cluster = [crashes[i]];
      }
      lastTime = timestamps[i];
    }
  }

  return patterns;
}

// Generate analysis report
function generateReport(crashes, health) {
  const patterns = analyzeCrashPatterns(crashes);
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    summary: {
      totalCrashes: patterns.totalCrashes,
      uniqueServices: Object.keys(patterns.byService).length,
      highMemoryCrashes: patterns.highMemoryCrashes,
      highFdCrashes: patterns.highFdCrashes,
      timeClusterCount: patterns.timeCluster.length
    },
    patterns,
    currentHealth: health,
    recommendations: []
  };

  // Generate recommendations
  if (patterns.highMemoryCrashes > patterns.totalCrashes * 0.7) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'Memory leak suspected',
      action: 'Implement memory limit enforcement and periodic restart'
    });
  }

  if (patterns.highFdCrashes > patterns.totalCrashes * 0.5) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'File descriptor leak',
      action: 'Audit connection pooling and stream closing logic'
    });
  }

  if (patterns.timeCluster.length > 2) {
    report.recommendations.push({
      priority: 'MEDIUM',
      issue: 'Cascading failure pattern detected',
      action: 'Implement staggered restart strategy to prevent simultaneous failures'
    });
  }

  Object.entries(patterns.byService).forEach(([service, data]) => {
    if (data.count > 5) {
      report.recommendations.push({
        priority: 'MEDIUM',
        issue: `${service} restarting frequently (${data.count} times)`,
        action: `Review ${service} code for resource leaks or infinite loops`
      });
    }
  });

  return report;
}

// Save analysis
function saveAnalysis(report) {
  try {
    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(report, null, 2));
    log(`✓ Analysis saved to ${ANALYSIS_FILE}`);
    return true;
  } catch (e) {
    log(`❌ Failed to save analysis: ${e.message}`);
    return false;
  }
}

// Get analysis summary
function getAnalysisSummary() {
  try {
    if (fs.existsSync(ANALYSIS_FILE)) {
      const content = fs.readFileSync(ANALYSIS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    return null;
  }
}

// Main analysis run
function analyzeAndReport() {
  log('Starting Phase 2 crash analysis...');

  const crashes = getCrashDumps(100);
  const health = getCurrentHealth();

  if (crashes.length === 0) {
    log('✓ No crashes detected in recent history');
    return {
      status: 'HEALTHY',
      crashCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  const report = generateReport(crashes, health);
  saveAnalysis(report);

  log(`✓ Analysis complete: ${crashes.length} crashes analyzed`);
  log(`  - High memory crashes: ${report.summary.highMemoryCrashes}`);
  log(`  - High FD crashes: ${report.summary.highFdCrashes}`);
  log(`  - Recommendations: ${report.recommendations.length}`);

  return report;
}

// Run if called directly
if (require.main === module) {
  analyzeAndReport();
}

module.exports = {
  getCrashDumps,
  analyzeCrashPatterns,
  generateReport,
  saveAnalysis,
  getAnalysisSummary,
  analyzeAndReport
};
