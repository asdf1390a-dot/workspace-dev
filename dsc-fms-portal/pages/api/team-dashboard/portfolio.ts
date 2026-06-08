import { supabaseAdmin } from '../../../lib/supabase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    try {
      const { title, description, skills_used } = req.body;
      const { data, error } = await supabaseAdmin
        .from('portfolio_items')
        .insert([{ title, description, skills_used }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data?.[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}
