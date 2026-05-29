#!/usr/bin/env node
/**
 * H4: Smart Checkpoint Escalation for Phase C Designs
 *
 * Purpose: Monitor Phase 2D/2E/2F design checkpoints to detect and escalate
 * design stall conditions (>12h silent) before implementation teams block.
 *
 * Run: Every hour at :45 mark (e.g., 00:45, 01:45, 02:45)
 * Owner: Project-Planner (Phase C #15)
 * Created: 2026-05-30 02:30 KST
 *
 * Spec: H4_SMART_CHECKPOINT_ESCALATION_SPEC.md
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  CHECKPOINT_DIR: '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory',
  STATE_FILE: '/home/jeepney/.openclaw/workspace-dev/memory/PHASE_CHECKPOINT_STATE.json',
  ESCALATION_LOG: '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/PHASE_CHECKPOINT_ESCALATION_LOG.md',
  PHASE_TARGETS: {
    PHASE2D: {
      files: ['PHASE2D_TIMELINE.md', 'PHASE2D_CRON_INTEGRATION.sh', 'CRON_DEPLOYMENT_PLAN.md'],
      eta: '2026-05-31 12:00',
      silent_threshold_hours: 12,
    },
    PHASE2E: {
      files: ['PHASE2E_TEST_EXECUTION_LOG.md', 'TEST_RESULTS_*.md'],
      eta: '2026-06-01 12:00',
      silent_threshold_hours: 12,
    },
    PHASE2F: {
      files: ['PHASE2F_PRODUCTION_CHECKLIST.md', 'DEPLOYMENT_*.md'],
      eta: '2026-06-02 18:00',
      silent_threshold_hours: 12,
    },
  },
  RAMP_UP_MINUTES: 120,
  CHECK_INTERVAL_MINUTES: 60,
  REPORT_TIMESTAMP: new Date().toISOString().slice(0, 19),
};

/**
 * Load or initialize checkpoint tracking state
 */
function loadState() {
  try {
    if (fs.existsSync(CONFIG.STATE_FILE)) {
      const data = fs.readFileSync(CONFIG.STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not load state file, initializing fresh');
  }

  // Initialize fresh state
  const fresh_state = { initialized_at: CONFIG.REPORT_TIMESTAMP };
  Object.keys(CONFIG.PHASE_TARGETS).forEach(phase => {
    fresh_state[phase] = {
      first_run: true,
      last_check: CONFIG.REPORT_TIMESTAMP,
      escalations_sent: [],
      phase_start_time: CONFIG.REPORT_TIMESTAMP,
    };
  });
  return fresh_state;
}

/**
 * Save state to disk
 */
function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(CONFIG.STATE_FILE), { recursive: true });
    fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save state:', e.message);
  }
}

/**
 * Find checkpoint files for a phase by pattern matching
 */
function findCheckpointFiles(phase_name) {
  const phase_config = CONFIG.PHASE_TARGETS[phase_name];
  if (!phase_config) return [];

  try {
    const all_files = fs.readdirSync(CONFIG.CHECKPOINT_DIR);
    const checkpoint_files = [];

    phase_config.files.forEach(pattern => {
      // Convert glob pattern to regex
      const regex_pattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regex_pattern}$`, 'i');

      all_files.forEach(file => {
        if (regex.test(file)) {
          checkpoint_files.push({
            name: file,
            path: path.join(CONFIG.CHECKPOINT_DIR, file),
          });
        }
      });
    });

    return checkpoint_files;
  } catch (e) {
    console.error(`Error scanning checkpoint directory for ${phase_name}:`, e.message);
    return [];
  }
}

/**
 * Check silence duration of a checkpoint file
 */
function checkSilenceDuration(file_path, current_time) {
  try {
    const stat = fs.statSync(file_path);
    const last_modified = new Date(stat.mtime);
    const silence_hours = (current_time - last_modified) / (1000 * 60 * 60);
    return Math.floor(silence_hours);
  } catch (e) {
    console.error(`Error checking file mtime for ${file_path}:`, e.message);
    return -1;
  }
}

/**
 * Check if checkpoint file is marked COMPLETE
 */
function isPhaseComplete(file_path) {
  try {
    const content = fs.readFileSync(file_path, 'utf8');
    // Look for status: COMPLETE in frontmatter or headers
    return /status:\s*COMPLETE|Current Status:\s*COMPLETE/i.test(content);
  } catch (e) {
    return false;
  }
}

/**
 * Generate tiered escalation message
 */
function generateEscalationMessage(phase_name, silence_hours, file_name) {
  const templates = {
    12: `🟡 PHASE ${phase_name} WARNING: Design checkpoint silent for 12+ hours\n` +
        `File: ${file_name}\n` +
        `Duration: ${silence_hours}h\n` +
        `Status: ⚠️ Design progress stalled — check if team is blocked`,

    18: `🟠 PHASE ${phase_name} CAUTION: Design checkpoint silent for 18+ hours\n` +
        `File: ${file_name}\n` +
        `Duration: ${silence_hours}h\n` +
        `Status: ⚠️ Design team may be blocked — intervention recommended`,

    24: `🔴 PHASE ${phase_name} CRITICAL: Design checkpoint silent for 24+ hours\n` +
        `File: ${file_name}\n` +
        `Duration: ${silence_hours}h\n` +
        `Status: 🔴 CRITICAL — Design team likely blocked (escalation to H1 rule)`,
  };

  const threshold = silence_hours >= 24 ? 24 : (silence_hours >= 18 ? 18 : 12);
  return templates[threshold] || templates[12];
}

/**
 * Send escalation notification
 */
function sendEscalation(phase_name, silence_hours, file_name, state) {
  const message = generateEscalationMessage(phase_name, silence_hours, file_name);
  const escalation_id = `${CONFIG.REPORT_TIMESTAMP}|${phase_name}|${silence_hours}h`;

  // Check if we've already escalated for this file in this cycle
  if (state[phase_name].escalations_sent.includes(escalation_id)) {
    return false;
  }

  console.log(`[ESCALATION] ${message}`);

  // Append to escalation log
  const log_entry = `\n- **${CONFIG.REPORT_TIMESTAMP}** | ${phase_name} | ${silence_hours}h silent | File: ${file_name} | [ESCALATED]`;

  try {
    let log_content = '';
    if (fs.existsSync(CONFIG.ESCALATION_LOG)) {
      log_content = fs.readFileSync(CONFIG.ESCALATION_LOG, 'utf8');
    }
    log_content += log_entry;
    fs.writeFileSync(CONFIG.ESCALATION_LOG, log_content, 'utf8');
  } catch (e) {
    console.warn('Could not update escalation log:', e.message);
  }

  state[phase_name].escalations_sent.push(escalation_id);
  return true;
}

/**
 * Write checkpoint for phase monitoring
 */
function writeCheckpoint(summary) {
  const checkpoint_file = path.join(
    CONFIG.CHECKPOINT_DIR,
    `CHECKPOINT_PHASE_MONITOR_${summary.timestamp.replace(/[:-]/g, '_')}.md`
  );

  const content = `---
name: Phase Checkpoint Monitor
timestamp: ${summary.timestamp} KST
type: system
---

# Phase Checkpoint Monitor — ${summary.timestamp} KST

**Summary:**
- Phases checked: ${summary.phases_checked}
- Escalations sent: ${summary.escalations_sent}
- Overall status: ${summary.status}

**Phase Status:**
${Object.entries(summary.phase_details).map(([phase, details]) =>
  `- **${phase}**: ${details.files_found} files | ${details.max_silence}h max silence | Status: ${details.status}`
).join('\n')}

---

**Next check:** ${new Date(Date.now() + 60*60*1000).toISOString().slice(0, 19)} KST
`;

  try {
    fs.writeFileSync(checkpoint_file, content, 'utf8');
  } catch (e) {
    console.warn('Could not write checkpoint:', e.message);
  }
}

/**
 * Main monitoring function
 */
function monitorPhaseCheckpoints() {
  const state = loadState();
  const current_time = new Date();
  const current_timestamp = current_time.toISOString().slice(0, 19);

  console.log(`\n[Phase Checkpoint Escalation Monitor] ${current_timestamp} KST`);
  console.log('='.repeat(70));

  let total_escalations = 0;
  let phases_checked = 0;
  const summary = {
    timestamp: current_timestamp,
    phases_checked: 0,
    escalations_sent: 0,
    status: 'HEALTHY',
    phase_details: {},
  };

  Object.entries(CONFIG.PHASE_TARGETS).forEach(([phase_name, phase_config]) => {
    const checkpoint_files = findCheckpointFiles(phase_name);
    let max_silence = 0;
    let phase_escalations = 0;

    console.log(`\n[${phase_name}] Checking ${checkpoint_files.length} checkpoint files`);

    if (checkpoint_files.length === 0) {
      console.log(`  ℹ️  No checkpoint files found yet (phase may not have started)`);
      summary.phase_details[phase_name] = {
        files_found: 0,
        max_silence: 0,
        status: 'NO_FILES',
      };
      return;
    }

    checkpoint_files.forEach(file_obj => {
      // Skip if phase marked COMPLETE
      if (isPhaseComplete(file_obj.path)) {
        console.log(`  ✅ ${file_obj.name}: COMPLETE (no escalation needed)`);
        return;
      }

      const silence_hours = checkSilenceDuration(file_obj.path, current_time);

      // Skip first ramp-up period (2 hours after phase start)
      const ramp_up_threshold = CONFIG.RAMP_UP_MINUTES * 60 * 1000;
      if (current_time - new Date(state[phase_name].phase_start_time) < ramp_up_threshold) {
        console.log(`  ℹ️  ${file_obj.name}: ${silence_hours}h (ramp-up period, no escalation)`);
        return;
      }

      if (silence_hours < 0) {
        console.log(`  ⚠️  ${file_obj.name}: Error checking mtime`);
        return;
      }

      max_silence = Math.max(max_silence, silence_hours);

      // Escalate if silent >= 12 hours
      if (silence_hours >= phase_config.silent_threshold_hours) {
        console.log(`  🟡 ${file_obj.name}: ${silence_hours}h silent (ESCALATING)`);
        if (sendEscalation(phase_name, silence_hours, file_obj.name, state)) {
          phase_escalations++;
          total_escalations++;
        }
      } else {
        console.log(`  ✅ ${file_obj.name}: ${silence_hours}h silent (OK)`);
      }
    });

    phases_checked++;
    summary.phases_checked = phases_checked;
    summary.phase_details[phase_name] = {
      files_found: checkpoint_files.length,
      max_silence: max_silence,
      status: phase_escalations > 0 ? 'ESCALATIONS_SENT' : 'HEALTHY',
    };
  });

  // Update summary
  summary.escalations_sent = total_escalations;
  summary.status = total_escalations === 0 ? 'HEALTHY' : 'ESCALATIONS_SENT';

  console.log('\n' + '='.repeat(70));
  console.log(`Summary: ${phases_checked} phases checked`);
  if (total_escalations > 0) {
    console.log(`⚠️  ${total_escalations} escalation(s) sent`);
  }
  console.log(`Status: ${summary.status}`);

  // Update state
  state.last_check = current_timestamp;
  saveState(state);

  // Write checkpoint
  writeCheckpoint(summary);
}

// Run the monitor
monitorPhaseCheckpoints();
