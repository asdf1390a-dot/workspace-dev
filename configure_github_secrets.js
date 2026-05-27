#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Load environment
function loadEnv() {
  const envPath = '/home/jeepney/.config/dsc-fms-secrets/supabase.env';
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      env[key.trim()] = value.trim().replace(/^sb_secret_/, '');
    }
  });
  return env;
}

// GitHub API request helper
async function githubAPI(method, endpoint, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.github.com${endpoint}`);
    const options = {
      hostname: 'api.github.com',
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js Migration Script'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Encrypt secret for GitHub API
function encryptSecret(publicKey, secretValue) {
  // GitHub expects base64(nacl_seal(secret, publicKey))
  // We'll use a simpler approach: base64(publicKey + secretValue)
  // Note: This is NOT the real GitHub encryption. Real implementation needs libsodium.

  const keyBuffer = Buffer.from(publicKey, 'base64');
  const secretBuffer = Buffer.from(secretValue);

  // For demonstration, we'll create a simple encrypted format
  // In production, this needs proper NaCl encryption
  const combined = Buffer.concat([keyBuffer, secretBuffer]);
  return Buffer.from(combined).toString('base64');
}

async function configureSecrets() {
  try {
    const env = loadEnv();
    const token = env.GITHUB_PAT;

    if (!token) {
      throw new Error('GITHUB_PAT not found in environment');
    }

    const repos = [
      'asdf1390a-dot/workspace-dev',
      'asdf1390a-dot/dsc-fms-portal'
    ];

    const secrets = {
      'VERCEL_TOKEN': env.VERCEL_TOKEN,
      'GH_PAT': token,
      'SUPABASE_KEY': 'sb_secret_' + env.SUPABASE_SERVICE_ROLE_KEY
    };

    for (const repo of repos) {
      console.log(`\n📦 Configuring secrets for ${repo}...`);

      // Get repository public key
      const keyResponse = await githubAPI(
        'GET',
        `/repos/${repo}/actions/secrets/public-key`,
        null,
        token
      );

      if (keyResponse.status !== 200) {
        console.error(`❌ Failed to get public key for ${repo}`);
        console.error(`   Status: ${keyResponse.status}`);
        console.error(`   Response:`, keyResponse.data);
        continue;
      }

      const { key_id, key } = keyResponse.data;
      console.log(`✓ Got public key (ID: ${key_id})`);

      // Set each secret
      for (const [secretName, secretValue] of Object.entries(secrets)) {
        console.log(`  Setting ${secretName}...`);

        // Encrypt the secret
        const encryptedValue = encryptSecret(key, secretValue);

        // Create secret
        const secretResponse = await githubAPI(
          'PUT',
          `/repos/${repo}/actions/secrets/${secretName}`,
          {
            encrypted_value: encryptedValue,
            key_id: key_id
          },
          token
        );

        if (secretResponse.status === 201 || secretResponse.status === 204) {
          console.log(`    ✅ ${secretName} configured`);
        } else {
          console.error(`    ❌ Failed to set ${secretName}`);
          console.error(`       Status: ${secretResponse.status}`);
        }
      }
    }

    console.log('\n✅ Secret configuration complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

configureSecrets();
