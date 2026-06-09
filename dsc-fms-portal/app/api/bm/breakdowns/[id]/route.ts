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

function mapRowToReport(r: any): BreakdownReport {
  return {
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
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid breakdown id' }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('breakdown_reports')
      .select('*, assets(machine_asset_number, name_en)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'Breakdown not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToReport(row));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid breakdown id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      severity,
      category,
      assigned_to,
      resolved_at,
      resolved_by,
      root_cause,
      action_taken,
      photos,
      documents,
    } = body;

    const updates: Record<string, any> = {};

    if (status !== undefined) updates.status = status;
    if (severity !== undefined) updates.severity = severity;
    if (category !== undefined) updates.category = category;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (resolved_at !== undefined) updates.resolved_at = resolved_at;
    if (resolved_by !== undefined) updates.resolved_by = resolved_by;
    if (root_cause !== undefined) updates.root_cause = root_cause;
    if (action_taken !== undefined) updates.action_taken = action_taken;
    if (photos !== undefined) updates.photos = photos;
    if (documents !== undefined) updates.documents = documents;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: rows, error } = await supabase
      .from('breakdown_reports')
      .update(updates)
      .eq('id', id)
      .select('*, assets(machine_asset_number, name_en)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rows || !rows[0]) {
      return NextResponse.json({ error: 'Breakdown not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToReport(rows[0]));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid breakdown id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('breakdown_reports')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
