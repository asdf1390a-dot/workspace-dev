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
    const assetId = searchParams.get('asset_id');
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('asset_edit_history')
      .select(
        'id, asset_id, changed_field, previous_value, new_value, changed_at, changed_by(id, raw_user_meta_data), assets(id, name)',
        { count: 'exact' }
      )
      .order('changed_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('changed_at', `${dateFrom}T00:00:00Z`);
    }

    if (dateTo) {
      query = query.lte('changed_at', `${dateTo}T23:59:59Z`);
    }

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    if (userId) {
      query = query.eq('changed_by', userId);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const report = {
      generated_at: new Date().toISOString(),
      filters: {
        date_from: dateFrom,
        date_to: dateTo,
        asset_id: assetId,
        user_id: userId,
      },
      total_changes: count || 0,
      changes: data?.map((entry: any) => {
        const changedByName = (entry.changed_by as any)?.raw_user_meta_data?.name || 'Unknown';
        return {
          id: entry.id,
          asset_id: entry.asset_id,
          asset_name: entry.assets?.[0]?.name || 'Unknown',
          changed_field: entry.changed_field,
          previous_value: entry.previous_value,
          new_value: entry.new_value,
          changed_by: changedByName,
          changed_at: entry.changed_at,
        };
      }) || [],
    };

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[audit-reports-asset-changes]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
