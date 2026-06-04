// pages/api/bm/breakdowns.ts
// BM-P1 Phase 2 — Breakdown list (with filters) and create endpoints.

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { requireUser } from '../../../lib/career-auth';

type BreakdownReport = {
  id: string;
  asset_id: string;
  machine_asset_number?: string | null;
  asset_name?: string | null;
  status: string;
  severity: string;
  category?: string | null;
  description: string;
  description_ta?: string | null;
  started_at?: string | null;
  resolved_at?: string | null;
  reported_at: string;
  acknowledged_at?: string | null;
  duration_minutes?: number | null;
  reported_by?: string | null;
  reporter_name?: string | null;
  assigned_to?: string | null;
  assignee_name?: string | null;
  resolved_by?: string | null;
  resolver_name?: string | null;
  root_cause?: string | null;
  action_taken?: string | null;
  photos?: string[];
  documents?: string[];
  created_at: string;
  updated_at?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { data: BreakdownReport[]; pagination: any; error?: never }
    | { data: BreakdownReport; error?: never }
    | { error: string }
  >
) {
  const { user, error: authErr } = await requireUser(req);
  if (authErr) return res.status(authErr.status).json(authErr.body);

  if (req.method === 'GET') {
    try {
      const {
        status,
        severity,
        reported_from,
        reported_to,
        sort_by = 'reported_at',
        sort_dir = 'desc',
        limit = 50,
        offset = 0,
        search,
      } = req.query;

      let query = supabaseAdmin
        .from('bm_events')
        .select('*, assets(machine_asset_number, name_en)', { count: 'exact' });

      if (status && typeof status === 'string') {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }

      if (severity && typeof severity === 'string') {
        const severities = severity.split(',');
        query = query.in('severity', severities);
      }

      if (reported_from && typeof reported_from === 'string') {
        query = query.gte('reported_at', reported_from);
      }

      if (reported_to && typeof reported_to === 'string') {
        query = query.lte('reported_at', reported_to);
      }

      const parsedLimit = Math.min(Math.max(1, parseInt(String(limit), 10) || 50), 500);
      const parsedOffset = Math.max(0, parseInt(String(offset), 10) || 0);

      const ALLOWED_SORT_FIELDS = ['reported_at', 'severity', 'status', 'duration_minutes'];
      const sortCol = ALLOWED_SORT_FIELDS.includes(typeof sort_by === 'string' ? sort_by : '')
        ? (sort_by as string)
        : 'reported_at';
      const sortAsc = sort_dir === 'asc';

      query = query
        .order(sortCol, { ascending: sortAsc })
        .range(parsedOffset, parsedOffset + parsedLimit - 1);

      const { data: rows, error, count } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const data: BreakdownReport[] = (rows || []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        machine_asset_number: r.assets?.machine_asset_number || null,
        asset_name: r.assets?.name_en || null,
        status: r.status,
        severity: r.severity,
        category: r.category || null,
        description: r.symptom || r.description || '',
        description_ta: r.description_ta || null,
        started_at: r.started_at || null,
        resolved_at: r.resolved_at || null,
        reported_at: r.reported_at,
        acknowledged_at: r.acknowledged_at || null,
        duration_minutes:
          r.resolved_at && r.reported_at
            ? Math.max(
                0,
                Math.round(
                  (new Date(r.resolved_at).getTime() - new Date(r.reported_at).getTime()) / 60000
                )
              )
            : null,
        reported_by: r.reported_by || r.created_by || null,
        reporter_name: r.reporter_name || null,
        assigned_to: r.assigned_to || null,
        assignee_name: r.assignee_name || null,
        resolved_by: r.resolved_by || null,
        resolver_name: r.resolver_name || null,
        root_cause: r.root_cause || null,
        action_taken: r.action_taken || r.resolution_note || null,
        photos: Array.isArray(r.photos) ? r.photos : [],
        documents: Array.isArray(r.documents) ? r.documents : [],
        created_at: r.created_at || r.reported_at,
        updated_at: r.updated_at || null,
      }));

      // Client-side text search fallback if search param provided
      let filtered = data;
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = data.filter((r) => {
          const hay = [r.machine_asset_number, r.asset_name, r.description, r.id, r.reporter_name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      }

      return res.status(200).json({
        data: filtered,
        pagination: {
          total: count ?? data.length,
          limit: parsedLimit,
          offset: parsedOffset,
          has_more: filtered.length === parsedLimit,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { asset_id, description, description_ta, severity, category, started_at, photos, documents } =
        req.body;

      if (!asset_id || !description) {
        return res.status(400).json({ error: 'asset_id and description are required' });
      }

      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin.from('bm_events').insert({
        asset_id,
        description,
        symptom: description,
        description_ta: description_ta || null,
        severity: severity || 'normal',
        category: category || null,
        status: 'reported',
        reported_at: started_at || now,
        created_at: now,
        created_by: user.id,
        reported_by: user.id,
        reporter_name: user.user_metadata?.fullName || user.email || 'Unknown',
        photos: photos || [],
        documents: documents || [],
      }).select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (!data || !data[0]) {
        return res.status(500).json({ error: 'Failed to create breakdown' });
      }

      const row = data[0];
      return res.status(201).json({
        data: {
          id: row.id,
          asset_id: row.asset_id,
          status: row.status,
          severity: row.severity,
          category: row.category,
          description: row.description,
          description_ta: row.description_ta,
          reported_at: row.reported_at,
          created_at: row.created_at,
        } as BreakdownReport,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Internal error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'method_not_allowed' });
}
