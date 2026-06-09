#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !sr) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, sr, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deployPhase2C() {
  try {
    console.log('📦 Deploying Team Dashboard Phase 2C...');
    const migrationPath = path.join(__dirname, '../db/47_team_dashboard_phase2c.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements`);

    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec', { query: stmt });

        if (error) {
          console.error(`  ⚠️  Statement ${i + 1}:`, error.message);
        } else {
          console.log(`  ✅ Statement ${i + 1} executed`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log(`\n✅ Deployment complete: ${successCount}/${statements.length} statements executed`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Deployment error:', err.message);
    process.exit(1);
  }
}

deployPhase2C();
