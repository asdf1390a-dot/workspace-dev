// Travel Members — Add/remove members
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

async function isOrganizer(userId: string, travelId: string) {
  const { data, error } = await sb
    .from('travels')
    .select('user_id')
    .eq('id', travelId)
    .single();
  if (error || !data || data.user_id !== userId) throw new Error('Only organizer can manage members');
}

export async function POST(
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
    await isOrganizer(user.id, params.id);

    const body = await req.json();
    const { user_id, role = 'companion', permission = 'read_write' } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'user_id required' } }, { status: 400 });
    }

    const { data, error } = await sb
      .from('travel_members')
      .insert({
        travel_id: params.id,
        user_id,
        role,
        permission,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Member added' }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('organizer') ? 403 : 500;
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
    await isOrganizer(user.id, params.id);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'user_id query param required' } }, { status: 400 });
    }

    const { error } = await sb
      .from('travel_members')
      .delete()
      .eq('travel_id', params.id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Member removed' }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('organizer') ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
}
