const { createClient } = require('@supabase/supabase-js');

const url = 'https://pzkvhomhztikhkgwgqzr.supabase.co';
const key = 'sb_secret_Uz2G3zJYx77CUoKVMEeb8Q_382yFu57';

const supabase = createClient(url, key);

// List available methods
console.log('Available Supabase client methods:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(supabase)).filter(m => !m.startsWith('_')).join('\n'));
