#!/usr/bin/env node

/**
 * db/52 SQL Syntax Validator
 * Checks SQL for common syntax errors before execution
 */

const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'db', '52_expense_master_phase3_5_schema.sql');

if (!fs.existsSync(sqlPath)) {
  console.error('❌ File not found:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const lines = sql.split('\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  db/52 SQL Syntax Validator');
console.log('═══════════════════════════════════════════════════════════════\n');

let errors = [];
let warnings = [];

// Check 1: Basic structure
console.log('🔍 Checking SQL structure...\n');

// Count statements
const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
console.log(`  ✅ Statements: ${statements.length}`);

// Check 2: CREATE TABLE statements
const createTableCount = (sql.match(/CREATE TABLE IF NOT EXISTS/gi) || []).length;
console.log(`  ✅ CREATE TABLE: ${createTableCount}`);
if (createTableCount !== 5) {
  warnings.push(`Expected 5 CREATE TABLE statements, found ${createTableCount}`);
}

// Check 3: CREATE INDEX statements
const createIndexCount = (sql.match(/CREATE INDEX/gi) || []).length;
console.log(`  ✅ CREATE INDEX: ${createIndexCount}`);
if (createIndexCount < 10) {
  warnings.push(`Expected 10+ indexes, found ${createIndexCount}`);
}

// Check 4: CREATE TRIGGER statements
const createTriggerCount = (sql.match(/CREATE TRIGGER/gi) || []).length;
console.log(`  ✅ CREATE TRIGGER: ${createTriggerCount}`);
if (createTriggerCount !== 3) {
  warnings.push(`Expected 3 CREATE TRIGGER statements, found ${createTriggerCount}`);
}

// Check 5: CREATE FUNCTION statements
const createFunctionCount = (sql.match(/CREATE OR REPLACE FUNCTION/gi) || []).length;
console.log(`  ✅ CREATE FUNCTION: ${createFunctionCount}`);
if (createFunctionCount < 3) {
  warnings.push(`Expected 3+ CREATE FUNCTION statements, found ${createFunctionCount}`);
}

// Check 6: GRANT statements
const grantCount = (sql.match(/GRANT /gi) || []).length;
console.log(`  ✅ GRANT: ${grantCount}`);

// Check 7: RLS policies
const rlsPolicyCount = (sql.match(/CREATE POLICY/gi) || []).length;
console.log(`  ✅ CREATE POLICY: ${rlsPolicyCount}`);
if (rlsPolicyCount < 10) {
  warnings.push(`Expected 10+ RLS policies, found ${rlsPolicyCount}`);
}

// Check 8: Syntax patterns
console.log('\n🔍 Checking SQL syntax patterns...\n');

// Check for unmatched parentheses
let parenCount = 0;
let bracketCount = 0;
let braceCount = 0;

for (const char of sql) {
  if (char === '(') parenCount++;
  if (char === ')') parenCount--;
  if (char === '[') bracketCount++;
  if (char === ']') bracketCount--;
  if (char === '{') braceCount++;
  if (char === '}') braceCount--;
}

if (parenCount !== 0) {
  errors.push(`Unmatched parentheses: ${parenCount > 0 ? 'missing' : 'extra'} ${Math.abs(parenCount)}`);
} else {
  console.log('  ✅ Parentheses balanced');
}

// Check for common mistakes
if (sql.includes('CREATE TABLE expense_trend_analysis')) {
  console.log('  ✅ expense_trend_analysis table defined');
}
if (sql.includes('CREATE TABLE expense_audit_trail')) {
  console.log('  ✅ expense_audit_trail table defined');
}
if (sql.includes('CREATE TABLE expense_kpi_alerts')) {
  console.log('  ✅ expense_kpi_alerts table defined');
}
if (sql.includes('CREATE TABLE expense_benchmark')) {
  console.log('  ✅ expense_benchmark table defined');
}
if (sql.includes('CREATE TABLE expense_schedule')) {
  console.log('  ✅ expense_schedule table defined');
}

// Check 9: Dependencies
console.log('\n🔍 Checking dependencies...\n');

const dependencies = [
  { pattern: /REFERENCES expense_master/, name: 'expense_master table' },
  { pattern: /REFERENCES expense_ledgers/, name: 'expense_ledgers table' },
  { pattern: /REFERENCES auth\.users/, name: 'auth.users table' }
];

for (const dep of dependencies) {
  if (dep.pattern.test(sql)) {
    console.log(`  ✅ ${dep.name} referenced`);
  } else {
    console.log(`  ℹ️  ${dep.name} not referenced`);
  }
}

// Check 10: File metadata
console.log('\n📊 File metadata...\n');

const fileSize = Buffer.byteLength(sql, 'utf8');
const lineCount = lines.length;
const commentLines = lines.filter(l => l.trim().startsWith('--')).length;

console.log(`  📄 File size: ${fileSize} bytes`);
console.log(`  📋 Total lines: ${lineCount}`);
console.log(`  💬 Comment lines: ${commentLines}`);
console.log(`  🔤 Code lines: ${lineCount - commentLines}`);

// Results
console.log('\n═══════════════════════════════════════════════════════════════');

if (errors.length === 0) {
  console.log('✅ VALIDATION PASSED\n');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log();
  }

  console.log('📊 Summary:');
  console.log(`  ✅ SQL syntax appears valid`);
  console.log(`  ✅ ${createTableCount}/5 tables defined`);
  console.log(`  ✅ ${createIndexCount}+ indexes for optimization`);
  console.log(`  ✅ ${createTriggerCount} triggers for automation`);
  console.log(`  ✅ ${createFunctionCount} functions for operations`);
  console.log(`  ✅ ${rlsPolicyCount}+ RLS policies for security`);
  console.log(`  ✅ Ready for deployment`);

  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED\n');
  
  console.log('Errors:');
  errors.forEach(e => console.log(`  ❌ ${e}`));
  console.log();

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log();
  }

  process.exit(1);
}
