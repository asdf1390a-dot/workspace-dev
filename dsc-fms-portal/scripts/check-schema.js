import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  try {
    // Try inserting a test record with channel column
    const { error } = await supabase
      .from('team_activity_logs')
      .insert([{
        activity_type: 'test',
        channel: 'slack'
      }])
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Error code:', error.code);
    } else {
      console.log('✅ Table schema is correct');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkSchema();
