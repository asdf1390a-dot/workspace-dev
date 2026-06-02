const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pzkvhomhztikhkgwgqzr.supabase.co',
  'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57',
  { auth: { persistSession: false } }
);

async function findUser() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (data.users && data.users.length > 0) {
    const user = data.users[0];
    console.log('Found user:', user.id);
    console.log('Email:', user.email);
  } else {
    console.log('No users found');
  }
}

findUser().catch(console.error);
