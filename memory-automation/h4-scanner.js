#!/usr/bin/env node
/**
 * H4 Component 1: Blocker Scanner
 * Detects BLOCKED_ON_USER items and classifies by execution safety
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  REGISTRY_FILE: path.join(process.cwd(), 'INCOMPLETE_TASKS_REGISTRY.md'),
  MEMORY_DIR: process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory',
  DB_DIR: path.join(process.cwd(), 'db'),
  OUTPUT_FILE: path.join(process.cwd(), 'memory', 'H4_SCANNER_RESULTS.json')
};

class BlockerScanner {
  async scan() {
    const results = {
      timestamp: new Date().toISOString(),
      blockers: [],
      summary: {
        total_blockers: 0,
        high_safety: 0,
        medium_safety: 0,
        low_safety: 0
      }
    };

    // Scan for db migrations
    const dbMigrations = await this.scanDbMigrations();
    results.blockers.push(...dbMigrations);

    // Scan for env vars
    const envConfigs = await this.scanEnvConfigs();
    results.blockers.push(...envConfigs);

    // Update summary
    results.summary.total_blockers = results.blockers.length;
    results.summary.high_safety = results.blockers.filter(b => b.safety_level === 'HIGH').length;
    results.summary.medium_safety = results.blockers.filter(b => b.safety_level === 'MEDIUM').length;
    results.summary.low_safety = results.blockers.filter(b => b.safety_level === 'LOW').length;

    return results;
  }

  async scanDbMigrations() {
    // Target: db/43_breakdown_management_phase1_schema.sql
    const migrationPath = path.join(CONFIG.DB_DIR, '43_breakdown_management_phase1_schema.sql');

    if (!fs.existsSync(migrationPath)) {
      return [{
        blocker_id: 'BM-P1',
        type: 'db_migration',
        file_path: '43_breakdown_management_phase1_schema.sql',
        safety_level: 'UNKNOWN',
        validation_status: 'FILE_NOT_FOUND'
      }];
    }

    const content = fs.readFileSync(migrationPath, 'utf8');

    // Validate SQL syntax
    const validation = this.validateSqlSyntax(content);
    const objects = this.countSqlObjects(content);

    return [{
      blocker_id: 'BM-P1',
      type: 'db_migration',
      file_path: '43_breakdown_management_phase1_schema.sql',
      safety_level: validation.safe ? 'HIGH' : 'LOW',
      objects_created: objects,
      destructive_operations: validation.hasDestructive,
      validation_status: validation.safe ? 'PASSED' : 'FAILED',
      validation_errors: validation.errors,
      execution_method: 'Supabase console with transaction rollback',
      user_action_required: 'Review + Approve before commit',
      schema_details: {
        file_size: content.length,
        lines: content.split('\n').length,
        rls_enabled: content.includes('POLICY') && content.includes('USING')
      }
    }];
  }

  async scanEnvConfigs() {
    // Target: TELEGRAM_SECRETARY_CHAT_ID
    const configPath = path.join(CONFIG.MEMORY_DIR, 'TELEGRAM_SECRETARY_CONFIG.md');

    if (!fs.existsSync(configPath)) {
      return [];
    }

    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/TELEGRAM_SECRETARY_CHAT_ID["\s:=]+(\d+)/);

    if (!match || !match[1]) {
      return [];
    }

    const value = match[1];
    const isValidFormat = /^\d+$/.test(value) && value.length > 8;

    return [{
      blocker_id: 'HARNESS-ENG-P1',
      type: 'env_var_config',
      variable_name: 'TELEGRAM_SECRETARY_CHAT_ID',
      safety_level: isValidFormat ? 'MEDIUM' : 'LOW',
      detected_value: value,
      source: 'memory/TELEGRAM_SECRETARY_CONFIG.md',
      value_format_valid: isValidFormat,
      validation_status: isValidFormat ? 'PASSED' : 'FAILED',
      execution_method: 'Vercel environment variable + test connection',
      user_action_required: 'Verify value correct + confirm connection works',
      env_details: {
        platform: 'Vercel',
        scope: 'Environment variables',
        test_method: 'Send test Telegram message'
      }
    }];
  }

  validateSqlSyntax(content) {
    const errors = [];
    let hasDestructive = false;

    // Check for destructive operations
    const destructivePatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i,
      /TRUNCATE/i,
      /DROP\s+DATABASE/i
    ];

    for (const pattern of destructivePatterns) {
      if (pattern.test(content)) {
        errors.push(`Found destructive operation: ${pattern.source}`);
        hasDestructive = true;
      }
    }

    // Check for proper statement termination
    const statements = content.split(';').filter(s => s.trim());
    const createStatements = (content.match(/CREATE\s+(OR\s+REPLACE\s+)?(TABLE|INDEX|FUNCTION|VIEW|TRIGGER|POLICY)/gi) || []).length;

    if (createStatements > 0 && statements.length < createStatements / 2) {
      errors.push('Possible unclosed SQL statements');
    }

    // Check for common syntax patterns
    const hasValidCreateStatements = /CREATE\s+(TABLE|INDEX|FUNCTION|VIEW|TRIGGER|POLICY)/i.test(content);

    return {
      safe: !hasDestructive && errors.length === 0 && hasValidCreateStatements,
      hasDestructive,
      errors,
      hasValidStatements: hasValidCreateStatements
    };
  }

  countSqlObjects(content) {
    return {
      tables: (content.match(/CREATE\s+TABLE/gi) || []).length,
      indexes: (content.match(/CREATE\s+INDEX/gi) || []).length,
      functions: (content.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/gi) || []).length,
      triggers: (content.match(/CREATE\s+TRIGGER/gi) || []).length,
      views: (content.match(/CREATE\s+(OR\s+REPLACE\s+)?VIEW/gi) || []).length,
      policies: (content.match(/CREATE\s+POLICY/gi) || []).length
    };
  }
}

// Execute
(async () => {
  try {
    const scanner = new BlockerScanner();
    const results = await scanner.scan();

    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Scanner results saved to ${CONFIG.OUTPUT_FILE}`);

    // Output summary for verification
    console.log(`\n📊 SCAN SUMMARY:`);
    console.log(`Total blockers detected: ${results.summary.total_blockers}`);
    console.log(`High safety (auto-executable): ${results.summary.high_safety}`);
    console.log(`Medium safety (user confirmation): ${results.summary.medium_safety}`);
    console.log(`Low safety (manual review): ${results.summary.low_safety}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Scanner error:', err);
    process.exit(1);
  }
})();
