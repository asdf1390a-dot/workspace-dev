// pages/api/milestones.ts
// Milestones management — list and create endpoints.

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { requireUser } from '../../lib/career-auth';

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

type Milestone = {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  target_date: string;
  completion_date?: string | null;
  status: MilestoneStatus;
  owner_id?: string | null;
  owner_name?: string | null;
  created_at: string;
  updated_at?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { data?: Milestone[]; pagination?: any; error?: never }
    | { data?: Milestone; error?: never }
    | { error: string }
  >
) {
  const { user, error: authErr } = await requireUser(req);
  if (authErr) return res.status(authErr.status).json(authErr.body);

  if (req.method === 'GET') {
    try {
      const { project_id, status, limit = 50, offset = 0, sort_by = 'target_date', sort_dir = 'asc' } = req.query;

      let query = supabaseAdmin.from('milestones').select('*', { count: 'exact' });

      if (project_id && typeof project_id === 'string') {
        query = query.eq('project_id', project_id);
      }

      if (status && typeof status === 'string') {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }

      const parsedLimit = Math.min(Math.max(1, parseInt(String(limit), 10) || 50), 500);
      const parsedOffset = Math.max(0, parseInt(String(offset), 10) || 0);

      const sortCol = typeof sort_by === 'string' ? sort_by : 'target_date';
      const sortAsc = sort_dir === 'asc';

      query = query.order(sortCol, { ascending: sortAsc }).range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data: rows, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const data: Milestone[] = (rows || []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id || null,
        title: r.title,
        description: r.description || null,
        target_date: r.target_date,
        completion_date: r.completion_date || null,
        status: r.status,
        owner_id: r.owner_id || null,
        created_at: r.created_at,
        updated_at: r.updated_at || null,
      }));

      return res.status(200).json({
        data,
        pagination: {
          total: count ?? data.length,
          limit: parsedLimit,
          offset: parsedOffset,
          has_more: data.length === parsedLimit,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { project_id, title, description, target_date, status } = req.body;

      if (!title || !target_date) {
        return res.status(400).json({ error: 'title and target_date are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('milestones')
        .insert({
          project_id: project_id || null,
          title,
          description: description || null,
          target_date,
          status: status || 'pending',
          owner_id: user.id,
        })
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (!data || !data[0]) {
        return res.status(500).json({ error: 'Failed to create milestone' });
      }

      const row = data[0];
      return res.status(201).json({
        data: {
          id: row.id,
          project_id: row.project_id || null,
          title: row.title,
          description: row.description || null,
          target_date: row.target_date,
          completion_date: row.completion_date || null,
          status: row.status,
          owner_id: row.owner_id,
          created_at: row.created_at,
          updated_at: row.updated_at || null,
        } as Milestone,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Internal error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'method_not_allowed' });
}
