#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !sr) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, sr, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyTables() {
  const tables = [
    'team_performance_metrics',
    'resource_allocations',
    'team_activity_logs'
  ];

  console.log('🔍 Verifying Phase 2C tables...\n');

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists (${count} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Error - ${e.message}`);
    }
  }
}

verifyTables();
