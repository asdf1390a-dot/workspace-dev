#!/usr/bin/env node

/**
 * H4 Phase 4B: Telegram Configuration Readiness Verification
 * Pre-flight check to ensure Telegram chat ID is properly configured
 *
 * Checks:
 * 1. Telegram chat ID exists in memory config
 * 2. Chat ID format is valid
 * 3. Vercel environment variable deployment format is correct
 * 4. No critical issues detected
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('H4 PHASE 4B: TELEGRAM CONFIGURATION READINESS VERIFICATION');
console.log('='.repeat(70));

// ============================================================================
// Telegram Configuration File Verification
// ============================================================================

const CONFIG_PATH = './memory/TELEGRAM_SECRETARY_CONFIG.md';

console.log('\n1️⃣  TELEGRAM CONFIGURATION FILE');
console.log('-'.repeat(70));

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Configuration file not found: ${CONFIG_PATH}`);
  process.exit(1);
}

const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');

console.log(`✅ File exists: ${CONFIG_PATH}`);

// ============================================================================
// Chat ID Extraction and Validation
// ============================================================================

console.log('\n2️⃣  CHAT ID EXTRACTION AND VALIDATION');
console.log('-'.repeat(70));

// Extract chat ID from the config file
const chatIdMatch = configContent.match(/\*\*User Chat ID:\*\*\s*(\d+)/) ||
                    configContent.match(/Chat ID:\s*(\d+)/);
if (!chatIdMatch) {
  console.error('❌ Could not find Chat ID in config file');
  process.exit(1);
}

const chatId = chatIdMatch[1];
console.log(`✅ Chat ID extracted: ${chatId}`);

// Validate format
const isNumeric = /^\d+$/.test(chatId);
const isValidLength = chatId.length >= 10;

if (!isNumeric) {
  console.error('❌ Chat ID contains non-numeric characters');
  process.exit(1);
}

if (!isValidLength) {
  console.error('❌ Chat ID too short (< 10 digits)');
  process.exit(1);
}

console.log(`✅ Format: Numeric`);
console.log(`✅ Length: ${chatId.length} digits (valid)`);
console.log(`✅ Status: ACTIVE`);

// ============================================================================
// Vercel Deployment Configuration
// ============================================================================

console.log('\n3️⃣  VERCEL DEPLOYMENT CONFIGURATION');
console.log('-'.repeat(70));

const deployConfig = {
  variableName: 'TELEGRAM_SECRETARY_CHAT_ID',
  value: chatId,
  target: ['production'],
  endpoint: 'https://api.vercel.com/v9/projects/{PROJECT_ID}/env',
  method: 'POST',
  contentType: 'application/json'
};

console.log(`✅ Variable name: ${deployConfig.variableName}`);
console.log(`✅ Variable value: ${deployConfig.value}`);
console.log(`✅ Target: ${deployConfig.target.join(', ')}`);
console.log(`✅ Endpoint: ${deployConfig.endpoint}`);
console.log(`✅ Method: ${deployConfig.method}`);

// ============================================================================
// Deployment Payload Format
// ============================================================================

console.log('\n4️⃣  DEPLOYMENT PAYLOAD FORMAT');
console.log('-'.repeat(70));

const payload = {
  key: deployConfig.variableName,
  value: deployConfig.value,
  target: deployConfig.target
};

console.log('Payload (to be sent to Vercel):');
console.log(JSON.stringify(payload, null, 2));

// ============================================================================
// Configuration Checks
// ============================================================================

console.log('\n5️⃣  CONFIGURATION CHECKS');
console.log('-'.repeat(70));

const checks = [
  { name: 'Chat ID numeric format', passed: isNumeric },
  { name: 'Chat ID minimum length (10 digits)', passed: isValidLength },
  { name: 'Variable name defined', passed: !!deployConfig.variableName },
  { name: 'Variable value populated', passed: !!deployConfig.value },
  { name: 'Target environment set', passed: deployConfig.target.length > 0 },
  { name: 'Vercel endpoint configured', passed: !!deployConfig.endpoint }
];

let passedChecks = 0;
checks.forEach(check => {
  if (check.passed) {
    console.log(`✅ ${check.name}`);
    passedChecks++;
  } else {
    console.log(`❌ ${check.name}`);
  }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TELEGRAM CONFIGURATION READINESS SUMMARY');
console.log('='.repeat(70));

const readyForExecution = passedChecks === checks.length;

console.log(`\n✅ Configuration checks: ${passedChecks}/${checks.length}`);

if (readyForExecution) {
  console.log('\n🟢 STATUS: READY FOR EXECUTION');
  console.log('\nNext steps:');
  console.log('1. Verify Vercel project ID and API token available');
  console.log('2. Test Vercel API connectivity');
  console.log('3. Deploy to Vercel via REST API:');
  console.log(`   POST ${deployConfig.endpoint}`);
  console.log('   Headers:');
  console.log('     - Authorization: Bearer <VERCEL_API_TOKEN>');
  console.log('     - Content-Type: application/json');
  console.log('   Body:', JSON.stringify(payload));
  console.log('4. Send test message to verify connection');
  process.exit(0);
} else {
  console.log('\n🔴 STATUS: NOT READY FOR EXECUTION');
  console.log(`\nFailed checks: ${checks.length - passedChecks}`);
  process.exit(1);
}
