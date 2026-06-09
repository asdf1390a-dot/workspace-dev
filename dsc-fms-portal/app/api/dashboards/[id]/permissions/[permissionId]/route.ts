import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const { role } = await request.json();

    if (!role || !['owner', 'editor', 'viewer'].includes(role)) {
      return Response.json({ error: 'invalid role' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('dashboard_permissions')
      .update({ role })
      .eq('id', params.permissionId)
      .eq('dashboard_id', params.id)
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('dashboard_permissions')
      .delete()
      .eq('id', params.permissionId)
      .eq('dashboard_id', params.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true }, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
