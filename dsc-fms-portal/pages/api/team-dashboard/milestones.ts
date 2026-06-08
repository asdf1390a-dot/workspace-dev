import { supabaseAdmin } from '../../../lib/supabase-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('milestones')
        .select('*')
        .order('target_date', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data || []);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, target_date, status, owner_id, project_id } = req.body;
      const { data, error } = await supabaseAdmin
        .from('milestones')
        .insert([{ title, description, target_date, status, owner_id, project_id }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data?.[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}
