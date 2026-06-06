import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  try {
    const { data, error, count } = await supabase
      .from('team_performance_metrics')
      .select('member_id, technical_competency, task_achievement, communication, learning_speed, reliability, completion_rate', { count: 'exact' })
      .order(sort === 'trustScore' ? 'reliability' : sort, { ascending: order === 'asc' })
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
      error: error instanceof Error ? error.message : 'Failed to fetch members',
    }, { status: 500 });
  }
}
