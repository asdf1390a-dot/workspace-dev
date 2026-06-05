#!/usr/bin/env node

/**
 * Phase 4 Agent Context Loader
 * Runtime mechanism for auto-loading Learnings templates into agent system prompts
 *
 * Responsibilities:
 * 1. Detect task type from agent input/context
 * 2. Match against TASK_PATTERNS_REGISTRY
 * 3. Load relevant learnings + auto-injection template
 * 4. Inject into agent system prompt
 * 5. Log template activation (for feedback loop)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  REGISTRY_PATH: path.join(__dirname, '../skills/TASK_PATTERNS_REGISTRY.json'),
  AGENT_INSTRUCTIONS_PATH: path.join(__dirname, '../skills/AGENT_SYSTEM_INSTRUCTIONS.json'),
  TEMPLATE_CACHE_TTL_MS: 60 * 1000, // 1 minute
  TELEMETRY_LOG_PATH: path.join(__dirname, '../skills/TEMPLATE_USAGE_METRICS.json'),
  CONFIDENCE_THRESHOLD: 0.80,
  MAX_TEMPLATE_TOKENS: 2000,
};

class AgentContextLoader {
  constructor() {
    this.templateCache = new Map();
    this.lastCacheTime = new Map();
    this.registry = null;
    this.agentInstructions = null;
    this.telemetryBuffer = [];
  }

  /**
   * Initialize: Load registries from disk
   */
  async initialize() {
    try {
      this.registry = JSON.parse(fs.readFileSync(CONFIG.REGISTRY_PATH, 'utf8'));
      this.agentInstructions = JSON.parse(fs.readFileSync(CONFIG.AGENT_INSTRUCTIONS_PATH, 'utf8'));
      console.log('[AgentContextLoader] Initialized: Registry + Agent Instructions loaded');
      return true;
    } catch (err) {
      console.error('[AgentContextLoader] Failed to initialize:', err.message);
      return false;
    }
  }

  /**
   * Main entry point: Load context for a task
   *
   * @param {Object} input
   *   - taskDescription: string (what the user wants to do)
   *   - agentRole: string (web-builder, evaluator, etc.)
   *   - context: object (optional additional context)
   * @returns {Object} { success, template, confidence, injectedContext, errors }
   */
  async loadContext(input) {
    const { taskDescription, agentRole, context = {} } = input;

    if (!taskDescription || !agentRole) {
      return { success: false, error: 'Missing taskDescription or agentRole' };
    }

    // Step 1: Detect task pattern
    const detected = this.detectTaskPattern(taskDescription);

    if (!detected.success) {
      return {
        success: false,
        confidence: detected.confidence,
        message: 'No matching task pattern found'
      };
    }

    // Step 2: Validate agent matches detected pattern
    if (!detected.pattern.agents.includes(agentRole)) {
      return {
        success: false,
        error: `Agent "${agentRole}" not applicable for task pattern "${detected.pattern.id}"`,
        suggestedAgents: detected.pattern.agents,
        confidence: detected.confidence
      };
    }

    // Step 3: Load template
    const templatePath = detected.pattern.templates[0]; // Use first template (usually only one)
    const template = await this.loadTemplate(templatePath);

    if (!template) {
      return {
        success: false,
        error: `Failed to load template: ${templatePath}`,
        fallback: 'Proceeding with base learnings only'
      };
    }

    // Step 4: Extract relevant sections
    const sections = this.extractSections(template, detected.pattern.trigger_sections);

    // Step 5: Format injected context
    const injectedContext = this.formatInjectedContext(
      detected.pattern.id,
      sections,
      detected.confidence
    );

    // Step 6: Log activation (telemetry)
    this.logActivation({
      taskId: context.taskId || `task_${Date.now()}`,
      taskDescription,
      agentRole,
      detectedPattern: detected.pattern.id,
      confidenceScore: detected.confidence,
      template: templatePath,
      sectionsUsed: detected.pattern.trigger_sections,
      timestamp: new Date().toISOString(),
      gitCommit: context.gitCommit || 'unknown'
    });

    return {
      success: true,
      patternId: detected.pattern.id,
      confidence: detected.confidence,
      template: templatePath,
      sections: detected.pattern.trigger_sections,
      injectedContext,
      errors: []
    };
  }

  /**
   * Detect task pattern from description using regex matching
   * Returns: { success, pattern, confidence }
   */
  detectTaskPattern(taskDescription) {
    const normalizedDesc = taskDescription.toLowerCase();
    const results = [];

    for (const pattern of this.registry.task_patterns) {
      let matchCount = 0;
      let totalPatterns = pattern.patterns.length;

      for (const regex of pattern.patterns) {
        const re = new RegExp(regex, 'i');
        if (re.test(normalizedDesc)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // Confidence = (matched_patterns / total_patterns) * base_weight
        const confidence = (matchCount / totalPatterns) * 0.9 + 0.1; // Range: 0.1-1.0
        results.push({
          pattern,
          confidence: Math.min(confidence, 1.0),
          matchCount
        });
      }
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    if (results.length === 0) {
      return { success: false, confidence: 0 };
    }

    const winner = results[0];

    // Apply confidence threshold
    if (winner.confidence < CONFIG.CONFIDENCE_THRESHOLD) {
      return {
        success: false,
        confidence: winner.confidence,
        message: `Confidence ${winner.confidence.toFixed(2)} below threshold ${CONFIG.CONFIDENCE_THRESHOLD}`
      };
    }

    return {
      success: true,
      pattern: winner.pattern,
      confidence: winner.confidence,
      allMatches: results
    };
  }

  /**
   * Load template file with caching
   */
  async loadTemplate(templatePath) {
    const fullPath = path.join(__dirname, '..', templatePath);

    // Check cache
    if (this.templateCache.has(fullPath)) {
      const cacheTime = this.lastCacheTime.get(fullPath);
      if (Date.now() - cacheTime < CONFIG.TEMPLATE_CACHE_TTL_MS) {
        return this.templateCache.get(fullPath);
      }
    }

    // Load from disk
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      this.templateCache.set(fullPath, content);
      this.lastCacheTime.set(fullPath, Date.now());
      return content;
    } catch (err) {
      console.error(`[AgentContextLoader] Failed to load template ${fullPath}:`, err.message);
      return null;
    }
  }

  /**
   * Extract relevant sections from template based on trigger_sections
   */
  extractSections(template, triggerSections) {
    const sections = [];
    const lines = template.split('\n');

    let currentSection = null;
    let sectionContent = [];

    for (const line of lines) {
      // Check if this line starts a section we're looking for
      for (const sectionName of triggerSections) {
        if (line.includes(sectionName)) {
          // Save previous section
          if (currentSection) {
            sections.push({ name: currentSection, content: sectionContent.join('\n') });
          }
          currentSection = sectionName;
          sectionContent = [line];
          break;
        }
      }

      // Accumulate content for current section
      if (currentSection) {
        sectionContent.push(line);
      }
    }

    // Save final section
    if (currentSection) {
      sections.push({ name: currentSection, content: sectionContent.join('\n') });
    }

    return sections;
  }

  /**
   * Format injected context with markers
   */
  formatInjectedContext(patternId, sections, confidence) {
    const prefix = `--- AUTO-LOADED LEARNINGS (Pattern: ${patternId}, Confidence: ${confidence.toFixed(2)}) ---`;
    const suffix = `--- END AUTO-LOADED LEARNINGS ---`;
    const content = sections.map(s => s.content).join('\n\n');

    return `${prefix}\n\n${content}\n\n${suffix}`;
  }

  /**
   * Log template activation for feedback loop
   */
  logActivation(activation) {
    this.telemetryBuffer.push({
      ...activation,
      timestamp: activation.timestamp || new Date().toISOString()
    });

    // Periodically flush to disk (every 10 activations or 30 seconds)
    if (this.telemetryBuffer.length >= 10) {
      this.flushTelemetry();
    }
  }

  /**
   * Flush telemetry buffer to disk
   */
  flushTelemetry() {
    if (this.telemetryBuffer.length === 0) return;

    try {
      let existing = [];
      if (fs.existsSync(CONFIG.TELEMETRY_LOG_PATH)) {
        try {
          existing = JSON.parse(fs.readFileSync(CONFIG.TELEMETRY_LOG_PATH, 'utf8'));
          if (!Array.isArray(existing)) existing = [];
        } catch (e) {
          existing = [];
        }
      }

      const updated = [...existing, ...this.telemetryBuffer];
      fs.writeFileSync(
        CONFIG.TELEMETRY_LOG_PATH,
        JSON.stringify(updated, null, 2),
        'utf8'
      );

      this.telemetryBuffer = [];
    } catch (err) {
      console.error('[AgentContextLoader] Failed to flush telemetry:', err.message);
    }
  }

  /**
   * Get activation statistics for feedback loop
   */
  getStatistics() {
    try {
      if (!fs.existsSync(CONFIG.TELEMETRY_LOG_PATH)) {
        return { totalActivations: 0, patterns: {} };
      }

      const logs = JSON.parse(fs.readFileSync(CONFIG.TELEMETRY_LOG_PATH, 'utf8'));
      const stats = {
        totalActivations: logs.length,
        patterns: {},
        byAgent: {}
      };

      for (const log of logs) {
        stats.patterns[log.detectedPattern] = (stats.patterns[log.detectedPattern] || 0) + 1;
        stats.byAgent[log.agentRole] = (stats.byAgent[log.agentRole] || 0) + 1;
      }

      return stats;
    } catch (err) {
      console.error('[AgentContextLoader] Failed to compute statistics:', err.message);
      return { error: err.message };
    }
  }
}

// CLI usage
async function main() {
  const loader = new AgentContextLoader();
  await loader.initialize();

  // Example: Detect task pattern
  const example = await loader.loadContext({
    taskDescription: 'Add POST /api/bm/events endpoint with Supabase RLS',
    agentRole: 'web-builder',
    context: { gitCommit: 'abc123def456' }
  });

  console.log('\n[Example Output]');
  console.log(JSON.stringify(example, null, 2));

  // Show statistics
  console.log('\n[Statistics]');
  console.log(JSON.stringify(loader.getStatistics(), null, 2));
}

// Export for use in other modules
module.exports = AgentContextLoader;

// Run CLI if invoked directly
if (require.main === module) {
  main().catch(console.error);
}
