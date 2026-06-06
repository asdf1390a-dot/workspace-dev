import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const { error } = await supabase
      .from('resource_allocations')
      .update({
        start_date: body.startDate,
        end_date: body.endDate,
        allocated_hours: body.allocatedHours,
        priority: body.priority,
      })
      .eq('id', params.id);

    if (error) throw error;

    return Response.json({
      allocationId: params.id,
      status: 'updated',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to update allocation',
    }, { status: 500 });
  }
}
