import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    if (!assetId) {
      return NextResponse.json({ error: 'assetId 파라미터 필수' }, { status: 400 });
    }

    const { data, error, count } = await supabase
      .from('asset_edit_history')
      .select('*', { count: 'exact' })
      .eq('asset_id', assetId)
      .order('changed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < (count || 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '알 수 없는 오류 발생' }, { status: 500 });
  }
}
