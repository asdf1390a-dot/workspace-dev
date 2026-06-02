import { NextRequest, NextResponse } from 'next/server';
import { TeamAssignmentSchema, TeamAssignment } from '@/lib/harness.types';
import { supabaseAdmin } from '@/lib/travel/supabase-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facility_id');
    const teamType = searchParams.get('team_type');
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('team_assignments').select('*');

    if (facilityId) query = query.eq('facility_id', facilityId);
    if (teamType) query = query.eq('team_type', teamType);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : '팀 목록 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = TeamAssignmentSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('team_assignments')
      .insert({
        team_id: validated.team_id,
        team_name: validated.team_name,
        team_type: validated.team_type,
        facility_id: validated.facility_id,
        member_count: validated.member_count,
        leader_id: validated.leader_id,
        status: validated.status || 'active',
        specialization: validated.specialization,
        assigned_assets: validated.assigned_assets || [],
        max_capacity: validated.max_capacity,
        current_workload: 0,
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
    const message = err instanceof Error ? err.message : '팀 생성에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
