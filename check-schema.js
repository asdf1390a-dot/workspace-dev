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
    // Test select to see what columns exist
    const { data, error } = await supabase
      .from('team_activity_logs')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error:', error);
    } else {
      console.log('team_activity_logs table exists');
      console.log('Columns would be: id, created_at, updated_at, and others');
    }

    // Try a simple insert to test structure
    const { error: insertError } = await supabase
      .from('team_activity_logs')
      .insert([{
        activity_type: 'test',
        channel: 'test_channel',
        actor_name: 'test_actor'
      }])
      .select();

    if (insertError) {
      console.log('Insert test error:', insertError.message);
    } else {
      console.log('✅ Insert successful');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkSchema();
