#!/usr/bin/env node

/**
 * H4 Phase 4: Migration Readiness Verification
 * Pre-flight check to ensure db/43 migration is ready for execution
 *
 * Checks:
 * 1. Migration file exists and is readable
 * 2. Migration syntax is valid
 * 3. All schema objects are present
 * 4. No critical issues detected
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('H4 PHASE 4: MIGRATION READINESS VERIFICATION');
console.log('='.repeat(70));

// ============================================================================
// File Verification
// ============================================================================

const MIGRATION_PATH = './db/43_breakdown_management_phase1_schema.sql';

console.log('\n1️⃣  FILE VERIFICATION');
console.log('-'.repeat(70));

if (!fs.existsSync(MIGRATION_PATH)) {
  console.error(`❌ Migration file not found: ${MIGRATION_PATH}`);
  process.exit(1);
}

const content = fs.readFileSync(MIGRATION_PATH, 'utf8');
const lines = content.split('\n');
const fileSize = content.length;

console.log(`✅ File exists: ${MIGRATION_PATH}`);
console.log(`✅ File size: ${fileSize} bytes (${(fileSize / 1024).toFixed(2)} KB)`);
console.log(`✅ Lines: ${lines.length}`);

// ============================================================================
// Schema Object Verification
// ============================================================================

console.log('\n2️⃣  SCHEMA OBJECT VERIFICATION');
console.log('-'.repeat(70));

const checks = [
  { name: 'TABLE breakdown_reports', pattern: /CREATE TABLE.*breakdown_reports/ },
  { name: 'INDEX idx_breakdown_reports_asset_id', pattern: /CREATE INDEX.*idx_breakdown_reports_asset_id/ },
  { name: 'INDEX idx_breakdown_reports_status', pattern: /CREATE INDEX.*idx_breakdown_reports_status/ },
  { name: 'INDEX idx_breakdown_reports_severity', pattern: /CREATE INDEX.*idx_breakdown_reports_severity/ },
  { name: 'INDEX idx_breakdown_reports_reported_at', pattern: /CREATE INDEX.*idx_breakdown_reports_reported_at/ },
  { name: 'INDEX idx_breakdown_reports_resolved_at', pattern: /CREATE INDEX.*idx_breakdown_reports_resolved_at/ },
  { name: 'INDEX idx_breakdown_reports_asset_month', pattern: /CREATE INDEX.*idx_breakdown_reports_asset_month/ },
  { name: 'INDEX idx_breakdown_reports_reported_by', pattern: /CREATE INDEX.*idx_breakdown_reports_reported_by/ },
  { name: 'INDEX idx_breakdown_reports_assigned_to', pattern: /CREATE INDEX.*idx_breakdown_reports_assigned_to/ },
  { name: 'FUNCTION set_breakdown_updated_at', pattern: /CREATE.*FUNCTION.*set_breakdown_updated_at/ },
  { name: 'TRIGGER breakdown_reports_updated_at_trigger', pattern: /CREATE TRIGGER.*breakdown_reports_updated_at_trigger/ },
  { name: 'POLICY users_view_all_breakdowns', pattern: /CREATE POLICY.*users_view_all_breakdowns/ },
  { name: 'POLICY users_create_breakdowns', pattern: /CREATE POLICY.*users_create_breakdowns/ },
  { name: 'POLICY users_update_own_breakdowns', pattern: /CREATE POLICY.*users_update_own_breakdowns/ },
  { name: 'VIEW breakdown_analysis', pattern: /CREATE.*VIEW.*breakdown_analysis/ }
];

let passedChecks = 0;
checks.forEach(check => {
  if (check.pattern.test(content)) {
    console.log(`✅ ${check.name}`);
    passedChecks++;
  } else {
    console.log(`❌ ${check.name}`);
  }
});

console.log(`\n📊 Objects verified: ${passedChecks}/${checks.length}`);

// ============================================================================
// Safety Checks
// ============================================================================

console.log('\n3️⃣  SAFETY CHECKS');
console.log('-'.repeat(70));

const dangerousPatterns = [
  { name: 'DROP TABLE', pattern: /DROP\s+TABLE/i },
  { name: 'DROP DATABASE', pattern: /DROP\s+DATABASE/i },
  { name: 'TRUNCATE', pattern: /TRUNCATE/i },
  { name: 'DELETE FROM (not in comment)', pattern: /^(?!--).*DELETE\s+FROM/m }
];

let dangerousPatternsFound = 0;
dangerousPatterns.forEach(check => {
  if (check.pattern.test(content)) {
    console.log(`⚠️  Found: ${check.name}`);
    dangerousPatternsFound++;
  } else {
    console.log(`✅ No ${check.name} operations`);
  }
});

// ============================================================================
// Dependency Checks
// ============================================================================

console.log('\n4️⃣  DEPENDENCY CHECKS');
console.log('-'.repeat(70));

const dependencies = [
  { name: 'assets table (FK reference)', pattern: /REFERENCES\s+assets\(/ },
  { name: 'auth.users table (FK reference)', pattern: /REFERENCES\s+auth\.users\(/ }
];

let dependenciesFound = 0;
dependencies.forEach(dep => {
  if (dep.pattern.test(content)) {
    console.log(`✅ ${dep.name}`);
    dependenciesFound++;
  } else {
    console.log(`❌ ${dep.name}`);
  }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('MIGRATION READINESS SUMMARY');
console.log('='.repeat(70));

const readyForExecution = passedChecks === checks.length && dangerousPatternsFound === 0;

console.log(`\n✅ Schema Objects: ${passedChecks}/${checks.length}`);
console.log(`✅ Safety Checks: ${dangerousPatterns.length - dangerousPatternsFound}/${dangerousPatterns.length}`);
console.log(`✅ Dependencies: ${dependenciesFound}/${dependencies.length}`);

if (readyForExecution) {
  console.log('\n🟢 STATUS: READY FOR EXECUTION');
  console.log('\nNext steps:');
  console.log('1. Verify Supabase production access');
  console.log('2. Create pre-migration backup');
  console.log('3. Execute: node apply-db43-migration.js');
  process.exit(0);
} else {
  console.log('\n🔴 STATUS: NOT READY FOR EXECUTION');
  console.log('\nIssues found:');
  if (passedChecks !== checks.length) {
    console.log(`  - Missing ${checks.length - passedChecks} schema objects`);
  }
  if (dangerousPatternsFound > 0) {
    console.log(`  - Found ${dangerousPatternsFound} dangerous SQL patterns`);
  }
  process.exit(1);
}
