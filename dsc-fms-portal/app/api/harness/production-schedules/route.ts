import { NextRequest, NextResponse } from 'next/server';
import { ProductionScheduleSchema } from '@/lib/harness.types';
import { supabaseAdmin } from '@/lib/travel/supabase-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facility_id');

    let query = supabaseAdmin.from('production_schedules').select('*');

    if (facilityId) query = query.eq('facility_id', facilityId);

    const { data, error } = await query.order('scheduled_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : '생산일정 목록 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = ProductionScheduleSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('production_schedules')
      .insert({
        facility_id: validated.facility_id,
        asset_ids: validated.asset_ids,
        scheduled_date: validated.scheduled_date,
        shift: validated.shift,
        target_quantity: validated.target_quantity,
        planned_downtime_minutes: validated.planned_downtime_minutes,
        notes: validated.notes || '',
        created_by: 'system',
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
    const message = err instanceof Error ? err.message : '생산일정 생성에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
