const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57';

// Read the db/43 SQL file for BM-P1
const sqlContent = fs.readFileSync('./db/43_breakdown_management_phase1_schema.sql', 'utf8');

console.log('🚀 Executing db/43: Breakdown Management Phase 1 Schema...');
console.log('SQL File:', './db/43_breakdown_management_phase1_schema.sql');
console.log('Size:', sqlContent.length, 'bytes');
console.log('Lines:', sqlContent.split('\n').length);

// Execute SQL via Supabase REST API
const data = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'pzkvhomhztikhkgwgqzr.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Prefer': 'return=minimal'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 Response Status:', res.statusCode);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
      console.log('\nNext steps:');
      console.log('1. Verify endpoint health: curl http://localhost:3000/api/bm/breakdowns/health');
      console.log('2. Run integration tests: npm run test:bm-p1');
      console.log('3. Deploy to Vercel: git push origin main');
      process.exit(0);
    } else {
      console.log('❌ Failed to apply migration');
      console.log('Response:', responseData);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
