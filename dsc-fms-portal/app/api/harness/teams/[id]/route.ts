import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/travel/supabase-client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('team_assignments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : '팀 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
