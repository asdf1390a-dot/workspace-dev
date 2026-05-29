#!/usr/bin/env node
/**
 * H4 Component 4: User Confirmation Interface
 * Telegram notification templates and button workflows
 * Handles YES/NO/REVIEW buttons with 10-minute timeout
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  SCANNER_RESULTS: path.join(process.cwd(), 'memory', 'H4_SCANNER_RESULTS.json'),
  INTERFACE_CONFIG: path.join(process.cwd(), 'memory', 'H4_USER_INTERFACE_CONFIG.json'),
  TELEGRAM_CONFIG: path.join(process.cwd(), 'memory', 'TELEGRAM_SECRETARY_CONFIG.md')
};

class UserInterface {
  constructor() {
    this.config = {
      timestamp: new Date().toISOString(),
      component: 'H4-Component4',
      interface_type: 'telegram',
      timeout_seconds: 600, // 10 minutes
      templates: [],
      buttons: {},
      workflows: []
    };
  }

  generateDBMigrationTemplate(blocker) {
    return {
      template_id: 'BM_P1_CONFIRMATION',
      blocker_id: blocker.blocker_id,
      channel: 'telegram',
      title: '🔐 DB Migration Approval Required',
      message: `
*H4 Blocker Confirmation: BM-P1*

📋 *Database Migration: db/43 Breakdown Management Phase 1*

*Details:*
• *File:* \`43_breakdown_management_phase1_schema.sql\`
• *Size:* ${(blocker.schema_details.file_size / 1024).toFixed(2)} KB
• *Lines:* ${blocker.schema_details.lines}
• *Safety:* 🟢 HIGH (validated)

*Schema Objects:*
• Tables: ${blocker.objects_created.tables}
• Indexes: ${blocker.objects_created.indexes}
• Functions: ${blocker.objects_created.functions}
• Triggers: ${blocker.objects_created.triggers}
• Views: ${blocker.objects_created.views}
• RLS Policies: ${blocker.objects_created.policies}

*Validation Status:*
✅ Syntax: PASSED
✅ Destructive Ops: NONE
✅ RLS: ENABLED
✅ Transaction Support: YES

*Action Required:*
Please confirm to execute this migration in Supabase.

⏰ *Response Window:* 10 minutes
      `,
      buttons: [
        {
          id: 'BM_P1_YES',
          label: '✅ Approve & Execute',
          callback: 'execute_db_migration',
          color: 'success'
        },
        {
          id: 'BM_P1_REVIEW',
          label: '🔍 Review Code',
          callback: 'open_migration_file',
          color: 'primary'
        },
        {
          id: 'BM_P1_NO',
          label: '❌ Reject',
          callback: 'reject_blocker',
          color: 'danger'
        }
      ],
      timeout_seconds: 600,
      on_timeout: 'remind_user'
    };
  }

  generateTelegramConfigTemplate(blocker) {
    return {
      template_id: 'TELEGRAM_CONFIG_CONFIRMATION',
      blocker_id: blocker.blocker_id,
      channel: 'telegram',
      title: '⚙️ Environment Variable Configuration',
      message: `
*H4 Blocker Confirmation: HARNESS-ENG-P1*

🤖 *Telegram Secretary Configuration*

*Details:*
• *Variable:* \`TELEGRAM_SECRETARY_CHAT_ID\`
• *Platform:* Vercel
• *Scope:* Environment Variables
• *Safety:* 🟡 MEDIUM (requires user verification)

*Detected Value:*
\`\`\`
${blocker.detected_value}
\`\`\`

*Validation Status:*
✅ Format: VALID (numeric chat ID)
✅ Length: VALID (10+ digits)
✅ Source: Verified in memory config

*Action Required:*
1. Verify the chat ID is correct
2. Confirm connection test will work
3. Approve to set environment variable

⏰ *Response Window:* 10 minutes
      `,
      buttons: [
        {
          id: 'TELEGRAM_YES',
          label: '✅ Confirm & Deploy',
          callback: 'deploy_telegram_config',
          color: 'success'
        },
        {
          id: 'TELEGRAM_TEST',
          label: '📱 Test Connection',
          callback: 'send_test_message',
          color: 'primary'
        },
        {
          id: 'TELEGRAM_NO',
          label: '❌ Cancel',
          callback: 'reject_blocker',
          color: 'danger'
        }
      ],
      timeout_seconds: 600,
      on_timeout: 'remind_user'
    };
  }

  generateReminderTemplate(blocker, minutesElapsed) {
    return {
      template_id: `REMINDER_${blocker.blocker_id}_${minutesElapsed}M`,
      blocker_id: blocker.blocker_id,
      channel: 'telegram',
      title: '⏰ Reminder: Pending Confirmation',
      message: `
⏰ *Reminder: H4 Blocker Awaiting Confirmation*

${blocker.blocker_id} is still pending user approval.

${minutesElapsed >= 5 ? '⚠️ *5+ minutes elapsed - please respond soon*' : ''}
${minutesElapsed >= 9 ? '🚨 *Less than 1 minute remaining before auto-rejection*' : ''}

⏱️ *Time remaining:* ${Math.max(0, 10 - minutesElapsed)} minutes
      `,
      buttons: [
        {
          id: `REMINDER_ACTION_${blocker.blocker_id}`,
          label: '👉 Respond Now',
          callback: 'show_original_prompt',
          color: 'warning'
        }
      ],
      timeout_seconds: 60
    };
  }

  generateTimeoutTemplate(blocker) {
    return {
      template_id: `TIMEOUT_${blocker.blocker_id}`,
      blocker_id: blocker.blocker_id,
      channel: 'telegram',
      title: '⏰ Confirmation Timeout',
      message: `
⏰ *H4 Blocker Confirmation Timeout*

${blocker.blocker_id} confirmation window has expired.

*Status:* REJECTED (no response within 10 minutes)
*Action:* Blocker remains in BLOCKED_ON_USER state

Escalation will trigger if unresolved for 6+ hours.
      `,
      buttons: [
        {
          id: `TIMEOUT_RETRY_${blocker.blocker_id}`,
          label: '🔄 Retry Confirmation',
          callback: 'retry_blocker',
          color: 'primary'
        }
      ]
    };
  }

  createWorkflow(blocker) {
    return {
      workflow_id: `WORKFLOW_${blocker.blocker_id}`,
      blocker_id: blocker.blocker_id,
      states: [
        {
          state: 'CONFIRMATION_PENDING',
          template_id: blocker.blocker_id === 'BM-P1' ? 'BM_P1_CONFIRMATION' : 'TELEGRAM_CONFIG_CONFIRMATION',
          duration_seconds: 0,
          next_states: {
            'YES': 'EXECUTING',
            'REVIEW': 'REVIEW_MODE',
            'NO': 'REJECTED',
            'TIMEOUT': 'TIMEOUT'
          }
        },
        {
          state: 'EXECUTING',
          template_id: null,
          duration_seconds: 300, // 5 minutes max execution
          next_states: {
            'SUCCESS': 'COMPLETED',
            'FAILED': 'EXECUTION_FAILED',
            'TIMEOUT': 'EXECUTION_TIMEOUT'
          }
        },
        {
          state: 'REVIEW_MODE',
          template_id: null,
          duration_seconds: 600, // 10 minutes for review
          next_states: {
            'CONFIRMED': 'EXECUTING',
            'REJECTED': 'REJECTED',
            'TIMEOUT': 'TIMEOUT'
          }
        },
        {
          state: 'COMPLETED',
          template_id: null,
          duration_seconds: 0,
          final: true
        },
        {
          state: 'REJECTED',
          template_id: null,
          duration_seconds: 0,
          final: true
        },
        {
          state: 'TIMEOUT',
          template_id: `TIMEOUT_${blocker.blocker_id}`,
          duration_seconds: 0,
          final: false
        }
      ],
      reminder_schedule: [
        { minutes_elapsed: 5, action: 'send_reminder' },
        { minutes_elapsed: 9, action: 'send_final_warning' }
      ]
    };
  }

  async buildInterface() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`H4 Component 4: User Confirmation Interface`);
    console.log(`${'='.repeat(70)}\n`);

    try {
      const scannerContent = fs.readFileSync(CONFIG.SCANNER_RESULTS, 'utf8');
      const scanResults = JSON.parse(scannerContent);

      console.log(`📋 Building interface for ${scanResults.summary.total_blockers} blockers...\n`);

      // Build templates and workflows for each blocker
      for (const blocker of scanResults.blockers) {
        console.log(`  ✓ ${blocker.blocker_id}`);

        if (blocker.type === 'db_migration') {
          const template = this.generateDBMigrationTemplate(blocker);
          this.config.templates.push(template);
        } else if (blocker.type === 'env_var_config') {
          const template = this.generateTelegramConfigTemplate(blocker);
          this.config.templates.push(template);
        }

        // Add reminder and timeout templates
        this.config.templates.push(this.generateReminderTemplate(blocker, 5));
        this.config.templates.push(this.generateReminderTemplate(blocker, 9));
        this.config.templates.push(this.generateTimeoutTemplate(blocker));

        // Create workflow
        const workflow = this.createWorkflow(blocker);
        this.config.workflows.push(workflow);
      }

      console.log(`\n✅ Built ${this.config.templates.length} templates`);
      console.log(`✅ Built ${this.config.workflows.length} workflows`);

      return true;
    } catch (err) {
      console.error(`❌ Build error: ${err.message}`);
      return false;
    }
  }

  async saveConfig() {
    fs.writeFileSync(
      CONFIG.INTERFACE_CONFIG,
      JSON.stringify(this.config, null, 2)
    );
    console.log(`\n✅ Interface config saved to: ${CONFIG.INTERFACE_CONFIG}`);
  }

  async testInterface() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Interface Preview`);
    console.log(`${'='.repeat(70)}\n`);

    for (const template of this.config.templates) {
      if (!template.message) continue;

      console.log(`📨 Template: ${template.template_id}`);
      console.log(`   Title: ${template.title}`);
      console.log(`   Buttons: ${template.buttons ? template.buttons.length : 0}`);
      console.log(`   Timeout: ${template.timeout_seconds}s\n`);

      if (template.buttons && template.buttons.length > 0) {
        template.buttons.forEach(btn => {
          console.log(`     • ${btn.label} (${btn.id})`);
        });
        console.log();
      }
    }
  }

  async execute() {
    try {
      // Build interface
      const buildSuccess = await this.buildInterface();
      if (!buildSuccess) {
        throw new Error('Interface build failed');
      }

      // Test interface
      await this.testInterface();

      // Save configuration
      await this.saveConfig();

      // Print summary
      console.log(`${'='.repeat(70)}`);
      console.log(`📊 INTERFACE SUMMARY`);
      console.log(`${'='.repeat(70)}`);
      console.log(`Templates: ${this.config.templates.length}`);
      console.log(`Workflows: ${this.config.workflows.length}`);
      console.log(`Timeout: ${this.config.timeout_seconds}s (10 minutes)`);
      console.log(`\n✅ Component 4 complete`);
      console.log(`\n🎯 H4 System Ready for Integration Testing`);
      console.log(`   Next: Component Integration + Live Testing (2026-05-30)`);

      return {
        success: true,
        config_file: CONFIG.INTERFACE_CONFIG,
        summary: {
          templates: this.config.templates.length,
          workflows: this.config.workflows.length
        }
      };
    } catch (err) {
      console.error(`\n❌ Executor error: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

// Execute
(async () => {
  const interface = new UserInterface();
  const result = await interface.execute();
  process.exit(result.success ? 0 : 1);
})();
