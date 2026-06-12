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
    const field = searchParams.get('field');

    let query = supabase
      .from('asset_edit_history')
      .select('*, changed_by(id, raw_user_meta_data)', { count: 'exact' })
      .eq('asset_id', params.assetId)
      .order('changed_at', { ascending: false });

    if (field) {
      query = query.eq('changed_field', field);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      asset_id: params.assetId,
      total_count: count || 0,
      entries: data?.map(entry => ({
        id: entry.id,
        changed_by: {
          id: entry.changed_by?.id,
          name: entry.changed_by?.raw_user_meta_data?.name || 'Unknown',
        },
        changed_field: entry.changed_field,
        previous_value: entry.previous_value,
        new_value: entry.new_value,
        changed_at: entry.changed_at,
      })) || [],
    });
  } catch (error: any) {
    console.error('[edit-history]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
