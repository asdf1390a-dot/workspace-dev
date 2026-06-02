import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/travel/supabase-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get('facility_id');
    const severity = searchParams.get('severity');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let query = supabaseAdmin.from('conflicts').select('*');

    if (facilityId) query = query.eq('facility_id', facilityId);
    if (severity) query = query.eq('severity', severity);

    if (fromDate && toDate) {
      query = query
        .gte('created_at', fromDate)
        .lte('created_at', toDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : '충돌 목록 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
