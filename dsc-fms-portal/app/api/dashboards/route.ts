import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('team_dashboards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, owner_id, is_shared } = await request.json();

    if (!name || !owner_id) {
      return Response.json({ error: 'name and owner_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('team_dashboards')
      .insert([{ name, description, owner_id, is_shared: is_shared ?? false }])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
