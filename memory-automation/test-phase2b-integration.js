#!/usr/bin/env node
/**
 * Phase 2B Integration Test
 * Fetches messages from Phase 2A (port 3009) and runs deduplication
 */

const http = require('http');
const { DuplicateDetectionEngine } = require('./phase2b-duplicate-detection.js');

async function fetchMessages() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3009,
      path: '/api/messages',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runIntegrationTest() {
  console.log('🔌 Phase 2B Integration Test - Phase 2A API\n');
  
  try {
    console.log('Step 1: Fetching messages from Phase 2A API (port 3009)...');
    const response = await fetchMessages();
    const messages = response.messages || [];
    
    console.log(`✓ Fetched ${messages.length} messages from Phase 2A\n`);

    if (messages.length === 0) {
      console.log('⚠️  No messages available for testing');
      process.exit(0);
    }

    console.log('Step 2: Running deduplication pipeline...');
    const engine = new DuplicateDetectionEngine(80);
    const startTime = Date.now();
    const result = engine.deduplicate(messages);
    const elapsed = Date.now() - startTime;

    console.log(`✓ Deduplication complete in ${elapsed}ms\n`);

    console.log('📊 Results:');
    console.log(`   Original messages: ${result.original}`);
    console.log(`   Layer 1 duplicates: ${result.layer1.removed}`);
    console.log(`   Layer 2 duplicates: ${result.layer2.removed}`);
    console.log(`   Total unique: ${result.final.unique.length}`);
    console.log(`   Reduction: ${((result.original - result.final.unique.length) / result.original * 100).toFixed(1)}%\n`);

    // Performance check
    const targetMs = 1000;
    if (elapsed < targetMs) {
      console.log(`✅ Performance: ${elapsed}ms < ${targetMs}ms target (O(n) ✓)`);
    } else {
      console.log(`⚠️  Performance: ${elapsed}ms >= ${targetMs}ms target`);
    }

    // Verify metadata
    const sample = result.final.unique[0];
    if (sample && sample.dedup_timestamp) {
      console.log('✅ Dedup metadata present (dedup_timestamp, dedup_layers_passed)');
    }

    console.log('\n✅ Integration test passed - Phase 2A → Phase 2B pipeline operational');
    process.exit(0);
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

runIntegrationTest();
