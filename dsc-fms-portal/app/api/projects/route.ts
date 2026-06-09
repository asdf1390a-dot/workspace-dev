import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberId = request.nextUrl.searchParams.get('member_id');
    const status = request.nextUrl.searchParams.get('status');

    let query = supabaseAdmin
      .from('portfolio')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (memberId) query = query.eq('member_id', memberId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { member_id, project_name, description, status, target_date } = await request.json();

    if (!member_id || !project_name) {
      return Response.json({ error: 'member_id and project_name required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('portfolio')
      .insert([
        {
          member_id,
          project_name,
          description: description || null,
          status: status || 'active',
          target_date: target_date || null,
        },
      ])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
