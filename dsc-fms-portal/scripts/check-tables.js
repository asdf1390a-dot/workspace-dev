import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTables() {
  const tables = [
    'team_performance_metrics',
    'resource_allocations',
    'team_activity_logs'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error && error.message.includes('does not exist')) {
        console.log(`❌ ${table}: Does not exist`);
      } else if (error) {
        console.log(`⚠️  ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

checkTables();
