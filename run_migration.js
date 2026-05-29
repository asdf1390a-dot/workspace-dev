const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const key = 'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57';

const supabase = createClient(url, key);

(async () => {
  try {
    const sql = fs.readFileSync('./db/42b_team_dashboard_phase2_additional.sql', 'utf8');
    
    const { error } = await supabase.rpc('execute_sql', { sql_text: sql });
    
    if (error) {
      console.log('RPC not available, trying alternative approach...');
      // Direct admin query
      const { error: queryError, data } = await supabase
        .from('information_schema.tables')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.error('Connection test failed:', queryError.message);
      } else {
        console.log('✅ Connection successful');
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
