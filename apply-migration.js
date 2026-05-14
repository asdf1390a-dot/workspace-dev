const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57';

// Read the SQL file
const sqlContent = fs.readFileSync('./dsc-fms-portal/db/22_backup_module.sql', 'utf8');

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
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
      process.exit(0);
    } else {
      console.log('❌ Failed to apply migration');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
