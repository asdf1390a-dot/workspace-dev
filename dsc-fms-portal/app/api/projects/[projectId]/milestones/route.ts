import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;

    const { data, error } = await supabaseAdmin
      .from('milestones')
      .select('*')
      .eq('portfolio_id', projectId)
      .order('target_date', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const { name, description, target_date, status } = await request.json();

    if (!name || !target_date) {
      return Response.json({ error: 'name and target_date required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('milestones')
      .insert([
        {
          portfolio_id: projectId,
          name,
          description: description || null,
          target_date,
          status: status || 'pending',
        },
      ])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
