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

async function applyMigration() {
  try {
    console.log('📦 Applying Phase 2C Migration...');
    const migrationPath = path.join(__dirname, '../db/47_team_dashboard_phase2c.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the entire migration as a single statement
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully');
    
    // Verify tables were created
    const tables = ['team_performance_metrics', 'resource_allocations', 'team_activity_logs'];
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!tableError) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`⚠️  Table '${table}' verification: ${tableError.message}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
