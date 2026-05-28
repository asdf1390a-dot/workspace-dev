#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

const MEMORY_DIR = process.env.MEMORY_DIR || '/home/jeepney/.openclaw/workspace-dev/memory';
const PHASE2B_URL = process.env.PHASE2B_URL || 'http://localhost:3010';
const TIMEOUT_SECS = 180;

function readMemoryFiles() {
  const entries = [];

  try {
    const files = fs.readdirSync(MEMORY_DIR);

    for (const filename of files) {
      if (!filename.endsWith('.md')) continue;

      const filepath = path.join(MEMORY_DIR, filename);
      const stats = fs.statSync(filepath);

      if (!stats.isFile()) continue;

      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.split('\n');
        let title = lines[0];

        if (title === '---') {
          for (let i = 1; i < lines.length; i++) {
            if (lines[i] === '---') {
              title = lines[i + 1] || filename;
              break;
            }
          }
        }

        title = title
          .replace(/^#+\s*/, '')
          .replace(/^---\s*/, '')
          .trim()
          .substring(0, 200);

        entries.push({
          filename,
          title: title || filename,
          size: stats.size,
        });
      } catch (e) {
        // Silently skip failed files
      }
    }
  } catch (e) {
    process.exit(1);
  }

  return entries;
}

function detectDuplicates(entries) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      entries,
      includeSemantics: false,
    });

    const url = new URL('/api/detect-duplicates', PHASE2B_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: TIMEOUT_SECS * 1000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    const entries = readMemoryFiles();

    if (entries.length === 0) {
      console.log(JSON.stringify({ success: false, error: 'No memory files to analyze' }));
      process.exit(1);
    }

    const result = await detectDuplicates(entries);
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
  } catch (e) {
    console.log(JSON.stringify({ success: false, error: e.message }));
    process.exit(1);
  }
})();
