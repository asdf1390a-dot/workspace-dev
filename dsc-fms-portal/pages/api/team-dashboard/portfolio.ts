import { supabaseAdmin } from '../../../lib/supabase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
