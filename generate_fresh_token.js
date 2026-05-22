const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3Zob21oenRpa2hrZ3dncXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzE4NjUsImV4cCI6MjA5Mzg0Nzg2NX0.hbhswNU-8YqhuxwfPL7_ANGr4CykS-BQaVcQXtjPfsE';

async function generateToken() {
  try {
    const supabase = createClient(supabaseUrl, anonKey);
    
    // Sign in with the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testapi@dscindia.local',
      password: 'TestPassword123!',
    });
    
    if (error) {
      console.error('Sign in error:', error.message);
      process.exit(1);
    }
    
    console.log('Fresh token generated:');
    console.log(data.session.access_token);
    console.log('\nToken expires at:', new Date(data.session.expires_at * 1000).toISOString());
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

generateToken();
