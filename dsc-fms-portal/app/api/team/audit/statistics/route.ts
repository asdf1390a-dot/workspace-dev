import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('team_activity_logs')
      .select('activity_type, actor_name')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const breakdown: Record<string, number> = {
      project_update: 0,
      allocation_change: 0,
      performance_update: 0,
      message_sent: 0,
      login: 0,
      permission_change: 0,
    };

    data?.forEach(log => {
      if (log.activity_type in breakdown) {
        breakdown[log.activity_type]++;
      }
    });

    const actorCounts: Record<string, number> = {};
    data?.forEach(log => {
      if (log.actor_name) {
        actorCounts[log.actor_name] = (actorCounts[log.actor_name] || 0) + 1;
      }
    });

    return Response.json({
      period: `${days}_days`,
      totalActivities: data?.length || 0,
      activityBreakdown: breakdown,
      topActors: Object.entries(actorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, activityCount: count })),
      lastActivityTime: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    }, { status: 500 });
  }
}
