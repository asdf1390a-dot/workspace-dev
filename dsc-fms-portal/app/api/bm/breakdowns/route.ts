import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const reported_from = searchParams.get('reported_from');
    const reported_to = searchParams.get('reported_to');
    const sort_by = searchParams.get('sort_by') || 'reported_at';
    const sort_dir = searchParams.get('sort_dir') || 'desc';
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 500);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    const search = searchParams.get('search');

    let query = supabase
      .from('breakdown_reports')
      .select('*, assets(machine_asset_number, name_en)', { count: 'exact' });

    if (status) {
      query = query.in('status', status.split(','));
    }
    if (severity) {
      query = query.in('severity', severity.split(','));
    }
    if (reported_from) {
      query = query.gte('reported_at', reported_from);
    }
    if (reported_to) {
      query = query.lte('reported_at', reported_to);
    }

    const ALLOWED_SORT_FIELDS = ['reported_at', 'severity', 'status', 'duration_minutes'];
    const sortCol = ALLOWED_SORT_FIELDS.includes(sort_by) ? sort_by : 'reported_at';
    const sortAsc = sort_dir === 'asc';

    query = query
      .order(sortCol, { ascending: sortAsc })
      .range(offset, offset + limit - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
          ? Math.max(0, Math.round((new Date(r.resolved_at).getTime() - new Date(r.reported_at).getTime()) / 60000))
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

    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = data.filter((r) => {
        const hay = [r.machine_asset_number, r.asset_name, r.description, r.id, r.reporter_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return NextResponse.json({
      data: filtered,
      pagination: {
        total: count ?? data.length,
        limit,
        offset,
        has_more: filtered.length === limit,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset_id, description, description_ta, severity, category, started_at, photos, documents } = body;

    if (!asset_id || !description) {
      return NextResponse.json({ error: 'asset_id and description are required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('breakdown_reports')
      .insert({
        asset_id,
        description,
        symptom: description,
        description_ta: description_ta || null,
        severity: severity || 'normal',
        category: category || null,
        status: 'reported',
        reported_at: started_at || now,
        created_at: now,
        photos: photos || [],
        documents: documents || [],
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !data[0]) {
      return NextResponse.json({ error: 'Failed to create breakdown' }, { status: 500 });
    }

    const row = data[0];
    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
