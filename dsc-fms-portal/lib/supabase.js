import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (url && anon) {
  supabase = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
} else if (typeof window !== 'undefined') {
  console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or _ANON_KEY env vars');
}

export const getSupabase = () => {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      supabase = createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
    }
  }
  return supabase;
};

export { supabase };
