import { NextRequest, NextResponse } from 'next/server';
import { MaintenancePlanSchema } from '@/lib/harness.types';
import { supabaseAdmin } from '@/lib/travel/supabase-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('asset_id');
    const facilityId = searchParams.get('facility_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('maintenance_plans').select('*');

    if (assetId) query = query.eq('asset_id', assetId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('scheduled_start_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : '유지보수계획 목록 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = MaintenancePlanSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('maintenance_plans')
      .insert({
        asset_id: validated.asset_id,
        maintenance_type: validated.maintenance_type,
        scheduled_start: validated.scheduled_start,
        scheduled_end: validated.scheduled_end,
        duration_minutes: validated.duration_minutes,
        maintenance_team_id: validated.maintenance_team_id,
        required_downtime: validated.required_downtime,
        priority: validated.priority,
        impact_scope: validated.impact_scope,
        notes: validated.notes || '',
        created_by: validated.created_by || 'system',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof Error && 'issues' in err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : '유지보수계획 생성에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
