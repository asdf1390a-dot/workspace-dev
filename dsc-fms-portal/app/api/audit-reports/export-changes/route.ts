import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, assetId, userId, format = 'csv' } = body;

    let query = supabase
      .from('asset_edit_history')
      .select(
        'id, asset_id, changed_field, previous_value, new_value, changed_at, changed_by(id, raw_user_meta_data), assets(id, name)'
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

    const { data, error } = await query;

    if (error) throw error;

    if (format === 'csv') {
      const csvHeader = ['ID', 'Asset ID', 'Asset Name', 'Field', 'Previous Value', 'New Value', 'Changed By', 'Changed At'].join(',');
      const csvRows = data?.map((entry: any) => {
        const changedByName = (entry.changed_by as any)?.raw_user_meta_data?.name || 'Unknown';
        return [
          entry.id,
          entry.asset_id,
          `"${entry.assets?.[0]?.name || 'Unknown'}"`,
          entry.changed_field,
          `"${entry.previous_value || ''}"`,
          `"${entry.new_value || ''}"`,
          `"${changedByName}"`,
          entry.changed_at,
        ].join(',');
      }) || [];

      const csv = [csvHeader, ...csvRows].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'json') {
      const json = {
        generated_at: new Date().toISOString(),
        total_records: data?.length || 0,
        data: data?.map((entry: any) => {
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

      return NextResponse.json(json);
    }

    return NextResponse.json(
      { error: 'Invalid format. Must be csv or json' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[export-changes]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
