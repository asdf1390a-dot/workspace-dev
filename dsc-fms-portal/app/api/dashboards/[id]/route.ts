import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('team_dashboards')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, is_shared } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('team_dashboards')
      .update({ name, description, is_shared, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('team_dashboards')
      .delete()
      .eq('id', params.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true }, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
