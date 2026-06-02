// Travel Management — Travel detail (GET, PUT, DELETE)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function getUser(token: string) {
  const { data: user, error } = await sb.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  return user.user;
}

async function canAccessTravel(userId: string, travelId: string) {
  const { data, error } = await sb
    .from('travels')
    .select('user_id')
    .eq('id', travelId)
    .single();

  if (error || !data) throw new Error('Travel not found');
  if (data.user_id === userId) return true;

  const { data: member, error: memberError } = await sb
    .from('travel_members')
    .select('id')
    .eq('travel_id', travelId)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) throw new Error('Access denied');
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await getUser(token);
    await canAccessTravel(user.id, params.id);

    const { data, error } = await sb
      .from('travels')
      .select(`
        *,
        members:travel_members(*),
        events:travel_events(*),
        costs:travel_costs(*),
        checklist_items:travel_checklist_items(*),
        documents:travel_documents(*),
        notification_rules:travel_notification_rules(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Access denied') ? 403 : msg.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await getUser(token);
    await canAccessTravel(user.id, params.id);

    const body = await req.json();
    const { data, error } = await sb
      .from('travels')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Travel updated' }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await getUser(token);

    const { data: travel, error: travelError } = await sb
      .from('travels')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (travelError || !travel || travel.user_id !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only organizer can delete' } }, { status: 403 });
    }

    const { error } = await sb.from('travels').delete().eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Travel deleted' }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status: 500 });
  }
}
