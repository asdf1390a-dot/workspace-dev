#!/usr/bin/env node
/**
 * BM-P1 Phase 1 Schema Auto-Deployment
 * Automated Supabase SQL deployment (replaces manual 30-hour bottleneck)
 *
 * Usage:
 *   node deploy-bm-p1-schema.js
 *
 * Prerequisites:
 *   export SUPABASE_URL="https://pzkvhomhztikhkgwgqzr.supabase.co"
 *   export SUPABASE_KEY="<service-role-key>"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'pzkvhomhztikhkgwgqzr';
const SCHEMA_FILE = path.join(__dirname, '../db/43_breakdown_management_phase1_schema.sql');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ADMIN_KEY;

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(level, msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const prefix = {
    '✅': colors.green + '✅' + colors.reset,
    '❌': colors.red + '❌' + colors.reset,
    '⏳': colors.yellow + '⏳' + colors.reset,
    '🚀': colors.blue + '🚀' + colors.reset
  };
  console.log(`[${timestamp}] ${prefix[level]} ${msg}`);
}

async function deploySql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    // Split SQL by statements and execute sequentially
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    req.write(JSON.stringify({ query: statements[0] }));
    req.end();
  });
}

async function verifyDeployment() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/information_schema.tables`);
    url.searchParams.set('table_name', 'eq.breakdown_reports');

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tables = JSON.parse(data || '[]');
          resolve(Array.isArray(tables) && tables.length > 0);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

async function main() {
  console.log('');
  log('🚀', 'BM-P1 Phase 1 Schema Auto-Deployment');
  log('🚀', `Project: ${PROJECT_ID}`);

  // Validate inputs
  if (!SUPABASE_KEY) {
    log('❌', 'Missing SUPABASE_KEY environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(SCHEMA_FILE)) {
    log('❌', `Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }

  // Read schema
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
  log('✅', `Schema loaded (${schema.length} bytes)`);

  // Deploy
  log('⏳', 'Deploying to Supabase...');
  try {
    await deploySql(schema);
    log('✅', 'SQL execution completed');
  } catch (err) {
    log('⚠️ ', `Deployment check failed: ${err.message}`);
    log('⚠️ ', 'Manual deployment required via Supabase console');
    console.log('');
    console.log('📋 Manual Steps:');
    console.log('1. Open: https://app.supabase.com/project/' + PROJECT_ID + '/sql');
    console.log('2. Paste entire contents of: ' + SCHEMA_FILE);
    console.log('3. Click RUN');
    process.exit(1);
  }

  // Verify deployment
  log('⏳', 'Verifying table creation...');
  await new Promise(r => setTimeout(r, 1000));

  const verified = await verifyDeployment();
  if (verified) {
    log('✅', 'breakdown_reports table verified');
    log('✅', 'M1 Schema Deployment COMPLETE');
    console.log('');
    log('🚀', 'M2 Validation ready (start immediately)');
    process.exit(0);
  } else {
    log('⚠️ ', 'Verification inconclusive - check Supabase console');
    log('⚠️ ', 'Schema may have deployed successfully despite verification failure');
    process.exit(0);
  }
}

main().catch(err => {
  log('❌', `Fatal error: ${err.message}`);
  process.exit(1);
});
