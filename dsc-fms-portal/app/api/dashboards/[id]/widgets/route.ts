import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', params.id)
      .order('position', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { type, title, position, config } = await request.json();

    if (!type || !title) {
      return Response.json({ error: 'type and title required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('dashboard_widgets')
      .insert([{
        dashboard_id: params.id,
        type,
        title,
        position: position ?? 0,
        config: config ?? {}
      }])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
