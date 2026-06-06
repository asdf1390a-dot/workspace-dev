import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const projectId = searchParams.get('projectId');

  try {
    let query = supabase.from('resource_allocations').select('*', { count: 'exact' });

    if (month) {
      const monthStart = `${month}-01`;
      query = query.gte('start_date', monthStart);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error, count } = await query.limit(100);
    if (error) throw error;

    return Response.json({
      month: month || new Date().toISOString().substring(0, 7),
      data: data || [],
      total: count || 0,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to fetch allocations',
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    const body = await req.json();

    const { error } = await supabase
      .from('resource_allocations')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      allocationId: id,
      status: 'updated',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to update allocation',
    }, { status: 500 });
  }
}
