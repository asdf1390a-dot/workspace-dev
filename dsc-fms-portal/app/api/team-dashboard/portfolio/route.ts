import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data || []);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, skills_used, owner_id } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .insert([{ title, description, skills_used, owner_id }])
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, description, skills_used } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .update({ title, description, skills_used, updated_at: new Date().toISOString() })
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
      .from('portfolio_items')
      .delete()
      .eq('id', id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
