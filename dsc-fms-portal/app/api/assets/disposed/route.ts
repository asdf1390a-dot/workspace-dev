import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const reason = searchParams.get('reason');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('asset_disposals')
      .select(
        'id, asset_id, disposal_reason, disposal_date, created_at, disposed_by(id, raw_user_meta_data), assets(id, name, status)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('disposal_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('disposal_date', dateTo);
    }

    if (reason) {
      query = query.eq('disposal_reason', reason);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      total_count: count || 0,
      disposals: data?.map((d: any) => {
        const disposedByName = (d.disposed_by as any)?.raw_user_meta_data?.name || 'Unknown';
        return {
          id: d.id,
          asset_id: d.asset_id,
          asset_name: d.assets?.[0]?.name || 'Unknown',
          disposal_reason: d.disposal_reason,
          disposal_date: d.disposal_date,
          disposed_by: disposedByName,
          created_at: d.created_at,
        };
      }) || [],
    });
  } catch (error: any) {
    console.error('[disposed]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
