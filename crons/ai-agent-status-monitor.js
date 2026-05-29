#!/usr/bin/env node
/**
 * H2: AI Agent Status Monitor
 *
 * Purpose: Monitor active background AI agent tasks for status updates
 * Escalates if any AI agent is silent for 2+ consecutive hours
 *
 * Run: Every 1 hour at :15 mark (e.g., 01:15, 02:15, 03:15)
 * Owner: DevOps Engineer (Phase C #12) + Automation Specialist
 * Created: 2026-05-30 02:00 KST
 *
 * Spec: WEEKLY_IMPROVEMENT_REPORT_2026_05_30.md § 4.2 (H2)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  MEMORY_DIR: '/home/jeepney/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory',
  REGISTRY_FILE: '/home/jeepney/.openclaw/workspace-dev/INCOMPLETE_TASKS_REGISTRY.md',
  STATE_FILE: '/home/jeepney/.openclaw/workspace-dev/memory/AI_AGENT_STATUS_MONITOR_STATE.json',
  SILENT_THRESHOLD_HOURS: 2,
  CHECK_INTERVAL_MINUTES: 60,
  REPORT_TIMESTAMP: new Date().toISOString().slice(0, 19),
};

// Track AI agents and their last reported status
const AI_AGENTS = {
  'Memory-System-Specialist': {
    current_task: 'Phase 2C Trust Score Calculator',
    expected_activity: true,
    min_reporting_interval_hours: 3,
  },
  'DevOps-Engineer': {
    current_task: 'Phase C #12 Infrastructure Monitoring Design',
    expected_activity: true,
    min_reporting_interval_hours: 6,
  },
  'QA-Specialist': {
    current_task: 'Phase C #14 Integration Test Strategy',
    expected_activity: true,
    min_reporting_interval_hours: 6,
  },
  'Project-Planner': {
    current_task: 'Phase C #15 Cross-Project Coordination',
    expected_activity: true,
    min_reporting_interval_hours: 6,
  },
  'Evaluator-AI': {
    current_task: 'Daily compliance audit + QA validation',
    expected_activity: true,
    min_reporting_interval_hours: 4,
  },
};

/**
 * Load or initialize agent status tracking state
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

  // Initialize fresh state for all agents (using current time as baseline)
  // This prevents false escalations on first run
  const fresh_state = { initialized_at: CONFIG.REPORT_TIMESTAMP };
  Object.keys(AI_AGENTS).forEach(agent => {
    fresh_state[agent] = {
      last_report: CONFIG.REPORT_TIMESTAMP,
      silent_hours: 0,
      escalation_sent: false,
      checkpoint_count: 0,
      first_run: true, // Flag to skip escalation checks on initialization
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
 * Check if agent has reported in the last N hours
 */
function getAgentSilenceDuration(agent_name, state, current_timestamp) {
  const last_report = new Date(state[agent_name]?.last_report || current_timestamp);
  const now = new Date(current_timestamp);
  const silence_hours = (now - last_report) / (1000 * 60 * 60);
  return Math.floor(silence_hours);
}

/**
 * Check agent status by scanning memory files for recent updates
 * Falls back to checkpoint pattern matching if specific agent files not found
 */
function updateAgentStatusFromMemory(agent_name, state) {
  try {
    const memory_files = fs.readdirSync(CONFIG.MEMORY_DIR);

    // Look for agent-specific files (e.g., checkpoint files with agent names)
    const agent_pattern = agent_name.toLowerCase().replace(/-/g, '_');
    let agent_files = memory_files.filter(f => {
      const lower = f.toLowerCase();
      return lower.includes(agent_pattern) ||
             (lower.includes('checkpoint') && lower.includes('phase'));
    });

    // If no specific files found, use the most recent checkpoint as proxy
    if (agent_files.length === 0) {
      agent_files = memory_files.filter(f =>
        f.toLowerCase().includes('checkpoint')
      ).sort().reverse().slice(0, 1);
    }

    // Update last report timestamp if we find recent activity
    if (agent_files.length > 0) {
      const latest_file = agent_files.sort().pop();
      const file_path = path.join(CONFIG.MEMORY_DIR, latest_file);
      const stat = fs.statSync(file_path);
      state[agent_name].last_report = stat.mtime.toISOString();
      state[agent_name].checkpoint_count = (state[agent_name].checkpoint_count || 0) + 1;
    }
  } catch (e) {
    // Silently skip memory check errors - agent may be in isolated session
  }
}

/**
 * Generate escalation message for silent AI agent
 */
function generateEscalationMessage(agent_name, silent_hours, task_name) {
  const templates = {
    2: `🟡 AI AGENT STATUS: ${agent_name} Silent for 2+ Hours\n` +
        `Task: ${task_name}\n` +
        `Duration: ${silent_hours}h\n` +
        `Status: ⚠️ Check if task is still running (may need restart)`,

    4: `🟠 AI AGENT STATUS: ${agent_name} Silent for 4+ Hours\n` +
        `Task: ${task_name}\n` +
        `Duration: ${silent_hours}h\n` +
        `Status: ⚠️ Task may be stuck (requires human investigation)`,

    6: `🔴 AI AGENT STATUS: ${agent_name} Silent for 6+ Hours\n` +
        `Task: ${task_name}\n` +
        `Duration: ${silent_hours}h\n` +
        `Status: 🔴 CRITICAL — Task likely failed (recovery team engaged)`,
  };

  const threshold = silent_hours >= 6 ? 6 : (silent_hours >= 4 ? 4 : 2);
  return templates[threshold] || templates[2];
}

/**
 * Send escalation notification (Telegram)
 */
function sendEscalation(agent_name, silent_hours, task_name) {
  const message = generateEscalationMessage(agent_name, silent_hours, task_name);

  // In real implementation, would use Telegram API
  // For now, log to console + memory file
  const log_entry = {
    timestamp: CONFIG.REPORT_TIMESTAMP,
    agent: agent_name,
    silent_hours: silent_hours,
    message: message,
    status: 'ESCALATED',
  };

  console.log(`[ESCALATION] ${message}`);

  // Append to escalation log
  const log_file = path.join(CONFIG.MEMORY_DIR, 'AI_AGENT_ESCALATION_LOG.md');
  try {
    let log_content = '';
    if (fs.existsSync(log_file)) {
      log_content = fs.readFileSync(log_file, 'utf8');
    }
    log_content += `\n- **${CONFIG.REPORT_TIMESTAMP}** | ${agent_name} | ${silent_hours}h silent | [ESCALATED]`;
    fs.writeFileSync(log_file, log_content, 'utf8');
  } catch (e) {
    console.warn('Could not update escalation log:', e.message);
  }

  return true;
}

/**
 * Main monitoring function
 */
function monitorAIAgents() {
  const state = loadState();
  const current_time = new Date();
  const current_timestamp = current_time.toISOString().slice(0, 19);

  console.log(`\n[AI Agent Status Monitor] ${current_timestamp} KST`);
  console.log('='.repeat(60));

  let escalation_count = 0;
  let reporting_agents = 0;

  Object.keys(AI_AGENTS).forEach(agent_name => {
    const agent_config = AI_AGENTS[agent_name];

    // Update status from memory
    updateAgentStatusFromMemory(agent_name, state);

    const silence_hours = getAgentSilenceDuration(agent_name, state, current_timestamp);
    const is_overdue = silence_hours > agent_config.min_reporting_interval_hours;

    if (silence_hours <= agent_config.min_reporting_interval_hours) {
      console.log(`✅ ${agent_name}: ${silence_hours}h silent (OK, threshold: ${agent_config.min_reporting_interval_hours}h)`);
      reporting_agents++;
    } else {
      console.log(`⚠️  ${agent_name}: ${silence_hours}h silent (OVERDUE by ${silence_hours - agent_config.min_reporting_interval_hours}h)`);
    }

    // Escalate if silent >= 2 hours AND hasn't been escalated yet AND not first run
    if (silence_hours >= CONFIG.SILENT_THRESHOLD_HOURS && !state[agent_name].escalation_sent && !state[agent_name].first_run) {
      console.log(`   → Escalating: ${agent_config.current_task}`);
      sendEscalation(agent_name, silence_hours, agent_config.current_task);
      state[agent_name].escalation_sent = true;
      escalation_count++;
    }

    // Clear first_run flag after first check
    if (state[agent_name].first_run) {
      state[agent_name].first_run = false;
    }

    // Clear escalation flag if agent resumes reporting
    if (silence_hours < CONFIG.SILENT_THRESHOLD_HOURS && state[agent_name].escalation_sent) {
      console.log(`   → Escalation cleared: ${agent_name} resumed reporting`);
      state[agent_name].escalation_sent = false;
    }

    state[agent_name].silent_hours = silence_hours;
  });

  // Generate summary report
  const summary = {
    timestamp: current_timestamp,
    total_agents: Object.keys(AI_AGENTS).length,
    reporting: reporting_agents,
    escalations: escalation_count,
    status: escalation_count === 0 ? 'HEALTHY' : 'ESCALATIONS_SENT',
  };

  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${reporting_agents}/${Object.keys(AI_AGENTS).length} agents reporting normally`);
  if (escalation_count > 0) {
    console.log(`⚠️  ${escalation_count} agent(s) escalated`);
  }
  console.log(`Status: ${summary.status}`);

  // Save state
  saveState(state);

  // Write checkpoint
  writeCheckpoint(summary, state);
}

/**
 * Write checkpoint to memory for Phase B monitoring
 */
function writeCheckpoint(summary, state) {
  const checkpoint_file = path.join(CONFIG.MEMORY_DIR, `CHECKPOINT_AI_MONITOR_${summary.timestamp.replace(/[:-]/g, '_')}.md`);

  const content = `---
name: AI Agent Status Monitor Checkpoint
timestamp: ${summary.timestamp} KST
type: system
---

# AI Agent Status Monitor — ${summary.timestamp} KST

**Summary:**
- Agents reporting: ${summary.reporting}/${summary.total_agents}
- Escalations sent: ${summary.escalations}
- Overall status: ${summary.status}

**Agent Status:**
${Object.entries(state).map(([agent, data]) =>
  `- **${agent}**: ${data.silent_hours}h silent | Checkpoints: ${data.checkpoint_count} | Escalated: ${data.escalation_sent ? '🔴' : '✅'}`
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

// Run the monitor
monitorAIAgents();
