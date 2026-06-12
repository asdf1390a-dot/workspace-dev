import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('asset_edit_history')
      .select(
        'id, asset_id, changed_field, changed_at, assets(id, name)',
        { count: 'exact' }
      )
      .eq('changed_by', userId)
      .order('changed_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('changed_at', `${dateFrom}T00:00:00Z`);
    }

    if (dateTo) {
      query = query.lte('changed_at', `${dateTo}T23:59:59Z`);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Get user info
    const { data: { users = [] } = {} } = await supabase.auth.admin.listUsers();
    const user = (users as any[])?.find(u => u.id === userId);

    return NextResponse.json({
      user: {
        id: userId,
        name: user?.user_metadata?.name || 'Unknown User',
      },
      total_changes: count || 0,
      changes: data?.map((entry: any) => ({
        asset_id: entry.asset_id,
        asset_name: entry.assets?.[0]?.name || 'Unknown Asset',
        changed_field: entry.changed_field,
        changed_at: entry.changed_at,
      })) || [],
    });
  } catch (error: any) {
    console.error('[changes-by-user]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
