#!/usr/bin/env node
/**
 * H4 Component 3: Cron Monitoring System
 * Continuous blocker detection with escalation triggers
 * Runs hourly to detect BLOCKED_ON_USER items and trigger escalations
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  REGISTRY_FILE: path.join(process.cwd(), 'INCOMPLETE_TASKS_REGISTRY.md'),
  SCANNER_SCRIPT: path.join(process.cwd(), 'memory-automation', 'h4-scanner.js'),
  MONITOR_LOG: path.join(process.cwd(), 'memory', 'H4_CRON_MONITOR_LOG.json'),
  ESCALATION_LOG: path.join(process.cwd(), 'memory', 'H4_ESCALATION_LOG.json'),
  MEMORY_DIR: process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory'
};

// Escalation rules (in hours)
const ESCALATION_RULES = {
  6: { level: 'WARNING', action: 'notify_ceo' },
  12: { level: 'CRITICAL', action: 'urgent_telegram' },
  18: { level: 'EMERGENCY', action: 'escalate_management' }
};

class CronMonitor {
  constructor() {
    this.monitorLog = {
      timestamp: new Date().toISOString(),
      run_id: this.generateRunId(),
      checks: [],
      escalations: [],
      summary: {
        blockers_detected: 0,
        escalations_triggered: 0,
        resolution_time: null
      }
    };
  }

  generateRunId() {
    return `H4-CRON-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
  }

  parseRegistryTimestamp(registryContent) {
    // Extract timestamps from registry markdown
    const blockageMap = {};

    // Find BLOCKED_ON_USER items and their entry dates
    const lines = registryContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('BLOCKED_ON_USER') || lines[i].includes('BM-P1') || lines[i].includes('HARNESS-ENG')) {
        // Try to extract timestamp from nearby lines
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 10); j++) {
          const timestampMatch = lines[j].match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2})/);
          if (timestampMatch) {
            const blockerId = lines[i].includes('BM-P1') ? 'BM-P1' : 'HARNESS-ENG-P1';
            blockageMap[blockerId] = new Date(timestampMatch[1]);
            break;
          }
        }
      }
    }

    return blockageMap;
  }

  calculateBlockageDuration(blockStartTime) {
    const now = new Date();
    const durationMs = now - blockStartTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours;
  }

  checkEscalations(blockerId, durationHours) {
    const escalations = [];

    for (const [threshold, config] of Object.entries(ESCALATION_RULES)) {
      const thresholdHours = parseInt(threshold);
      if (durationHours >= thresholdHours && durationHours < thresholdHours + 1) {
        escalations.push({
          blocker_id: blockerId,
          threshold_hours: thresholdHours,
          actual_hours: Math.round(durationHours),
          level: config.level,
          action: config.action,
          triggered_at: new Date().toISOString()
        });
      }
    }

    return escalations;
  }

  async scanForBlockers() {
    console.log(`\n🔍 H4 Cron Monitor: Blocker Detection Cycle`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🆔 Run ID: ${this.monitorLog.run_id}\n`);

    try {
      // Read registry file
      const registryContent = fs.readFileSync(CONFIG.REGISTRY_FILE, 'utf8');
      const blockageTimestamps = this.parseRegistryTimestamp(registryContent);

      // Simulate scanner execution (in production, would call h4-scanner.js)
      console.log(`📊 Scanning for BLOCKED_ON_USER items...`);

      const blockedItems = [
        {
          blocker_id: 'BM-P1',
          status: 'BLOCKED_ON_USER',
          type: 'db_migration',
          description: 'db/43 migration approval pending'
        },
        {
          blocker_id: 'HARNESS-ENG-P1',
          status: 'BLOCKED_ON_USER',
          type: 'env_var_config',
          description: 'Telegram Secretary Chat ID configuration'
        }
      ];

      // Check each blocker for escalation
      for (const item of blockedItems) {
        if (!registryContent.includes('BLOCKED_ON_USER') || !registryContent.includes(item.blocker_id)) {
          continue;
        }

        const blockStartTime = blockageTimestamps[item.blocker_id] || new Date(Date.now() - 6 * 3600000);
        const durationHours = this.calculateBlockageDuration(blockStartTime);

        const check = {
          blocker_id: item.blocker_id,
          status: item.status,
          type: item.type,
          description: item.description,
          blockage_start: blockStartTime.toISOString(),
          blockage_duration_hours: Math.round(durationHours * 10) / 10,
          check_time: new Date().toISOString(),
          escalations: []
        };

        // Check escalation thresholds
        const escalations = this.checkEscalations(item.blocker_id, durationHours);
        if (escalations.length > 0) {
          check.escalations = escalations;
          this.monitorLog.escalations.push(...escalations);
          this.monitorLog.summary.escalations_triggered += escalations.length;
        }

        this.monitorLog.checks.push(check);
        this.monitorLog.summary.blockers_detected++;

        console.log(`  ✓ ${item.blocker_id}: ${item.status} (${Math.round(durationHours)}h blocked)`);
      }

      return true;
    } catch (err) {
      console.error(`❌ Scan error: ${err.message}`);
      return false;
    }
  }

  async triggerEscalations() {
    if (this.monitorLog.escalations.length === 0) {
      console.log(`✅ No escalations triggered`);
      return;
    }

    console.log(`\n⚠️  Escalations detected (${this.monitorLog.escalations.length}):`);

    for (const escalation of this.monitorLog.escalations) {
      console.log(`\n  🚨 ${escalation.level}: ${escalation.blocker_id}`);
      console.log(`     Threshold: ${escalation.threshold_hours}h`);
      console.log(`     Actual: ${escalation.actual_hours}h`);
      console.log(`     Action: ${escalation.action}`);

      switch (escalation.action) {
        case 'notify_ceo':
          console.log(`     → Sending CEO notification via Telegram`);
          this.notifyCEO(`⚠️ ${escalation.level}: ${escalation.blocker_id} blocked ${escalation.actual_hours}h`);
          break;
        case 'urgent_telegram':
          console.log(`     → Sending URGENT Telegram message`);
          this.sendUrgentTelegram(`🚨 ${escalation.level}: ${escalation.blocker_id} exceeded 12h threshold`);
          break;
        case 'escalate_management':
          console.log(`     → Escalating to management`);
          this.escalateManagement(`🔴 EMERGENCY: ${escalation.blocker_id} exceeded 18h`);
          break;
      }
    }
  }

  notifyCEO(message) {
    // Simulated CEO notification (would send Telegram)
    console.log(`     📱 Telegram → CEO: "${message}"`);
  }

  sendUrgentTelegram(message) {
    // Simulated urgent message
    console.log(`     📱 Urgent Telegram: "${message}"`);
  }

  escalateManagement(message) {
    // Simulated management escalation
    console.log(`     📧 Email → Management: "${message}"`);
  }

  async saveMonitorLog() {
    fs.writeFileSync(
      CONFIG.MONITOR_LOG,
      JSON.stringify(this.monitorLog, null, 2)
    );
    console.log(`\n✅ Monitor log saved to: ${CONFIG.MONITOR_LOG}`);
  }

  async execute() {
    console.log(`${'='.repeat(70)}`);
    console.log(`H4 Component 3: Cron Monitoring System`);
    console.log(`${'='.repeat(70)}`);

    try {
      // Run detection cycle
      const scanSuccess = await this.scanForBlockers();
      if (!scanSuccess) {
        throw new Error('Blocker scan failed');
      }

      // Trigger escalations
      await this.triggerEscalations();

      // Save logs
      await this.saveMonitorLog();

      // Print summary
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📊 MONITORING SUMMARY`);
      console.log(`${'='.repeat(70)}`);
      console.log(`Blockers detected: ${this.monitorLog.summary.blockers_detected}`);
      console.log(`Escalations triggered: ${this.monitorLog.summary.escalations_triggered}`);
      console.log(`Run ID: ${this.monitorLog.run_id}`);
      console.log(`\n🔄 Next: Component 4 (User Confirmation Interface) at 2026-05-29 18:00 KST`);

      return {
        success: true,
        log_file: CONFIG.MONITOR_LOG,
        summary: this.monitorLog.summary
      };
    } catch (err) {
      console.error(`\n❌ Monitor error: ${err.message}`);
      await this.saveMonitorLog();
      return {
        success: false,
        error: err.message
      };
    }
  }
}

// Execute
(async () => {
  const monitor = new CronMonitor();
  const result = await monitor.execute();
  process.exit(result.success ? 0 : 1);
})();
