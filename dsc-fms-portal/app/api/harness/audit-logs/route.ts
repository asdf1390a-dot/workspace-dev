import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/travel/supabase-client';
import { getAuditLogs } from '@/lib/harness/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('request_id');
    const status = searchParams.get('status') as 'success' | 'failure' | undefined;
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    const filters = {
      requestId: requestId || undefined,
      status,
      dateRange: fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
    };

    const logs = await getAuditLogs(filters);

    return NextResponse.json(logs);
  } catch (err) {
    const message = err instanceof Error ? err.message : '감사 로그 조회에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
