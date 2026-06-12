import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('milestones')
      .select('*')
      .order('target_date', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, target_date, status, owner_id, project_id } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('milestones')
      .insert([{ title, description, target_date, status, owner_id, project_id }])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, description, target_date, status, owner_id } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('milestones')
      .update({ title, description, target_date, status, owner_id, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0]);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const { error } = await supabaseAdmin
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
