import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, count, error } = await supabase
      .from('asset_disposals')
      .select('*, disposed_by(id, raw_user_meta_data)', { count: 'exact' })
      .eq('asset_id', params.assetId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      asset_id: params.assetId,
      total_count: count || 0,
      disposals: data?.map(d => ({
        id: d.id,
        disposal_reason: d.disposal_reason,
        disposal_date: d.disposal_date,
        disposal_certificate_url: d.disposal_certificate_url,
        disposed_by: d.disposed_by?.raw_user_meta_data?.name || 'Unknown',
        created_at: d.created_at,
      })) || [],
    });
  } catch (error: any) {
    console.error('[asset-disposals]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
