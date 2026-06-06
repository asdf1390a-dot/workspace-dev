import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const activityTypes = searchParams.get('activityTypes')?.split(',');
  const days = parseInt(searchParams.get('days') || '30');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('team_activity_logs')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    if (activityTypes && activityTypes.length > 0) {
      query = query.in('activity_type', activityTypes);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return Response.json({
      data: data || [],
      total: count || 0,
      page: 1,
      limit,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
    }, { status: 500 });
  }
}
