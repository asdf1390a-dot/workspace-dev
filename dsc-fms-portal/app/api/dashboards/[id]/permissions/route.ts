import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('dashboard_permissions')
      .select('*')
      .eq('dashboard_id', params.id);

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
    const { user_id, role } = await request.json();

    if (!user_id || !role) {
      return Response.json({ error: 'user_id and role required' }, { status: 400 });
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return Response.json({ error: 'invalid role' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('dashboard_permissions')
      .insert([{
        dashboard_id: params.id,
        user_id,
        role
      }])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
