import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);

  try {
    const monthStart = `${month}-01`;
    const nextMonth = new Date(month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().substring(0, 7) + '-01';

    const { data: allocations, error } = await supabase
      .from('resource_allocations')
      .select('member_id, allocated_hours')
      .gte('start_date', monthStart)
      .lte('end_date', monthEnd);

    if (error) {
      console.error('Availability query error:', error);
      throw error;
    }

    return Response.json({
      month,
      data: allocations?.map(a => ({
        memberId: a.member_id,
        totalCapacityHours: 160,
        allocatedHours: a.allocated_hours || 0,
        availableHours: 160 - (a.allocated_hours || 0),
        allocationPercentage: ((a.allocated_hours || 0) / 160) * 100,
        nextAvailableDate: new Date().toISOString().split('T')[0],
        activeProjects: 1,
      })) || [],
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to fetch availability',
    }, { status: 500 });
  }
}
