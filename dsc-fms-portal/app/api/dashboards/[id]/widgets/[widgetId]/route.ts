import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; widgetId: string } }
) {
  try {
    const { type, title, position, config } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('dashboard_widgets')
      .update({
        type,
        title,
        position,
        config,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.widgetId)
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
  { params }: { params: { id: string; widgetId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('dashboard_widgets')
      .delete()
      .eq('id', params.widgetId)
      .eq('dashboard_id', params.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true }, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
