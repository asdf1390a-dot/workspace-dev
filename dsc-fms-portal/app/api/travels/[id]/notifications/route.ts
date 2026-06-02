// Travel Notifications — Notification rules management
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

async function canManage(userId: string, travelId: string) {
  const { data: travel } = await sb
    .from('travels')
    .select('user_id')
    .eq('id', travelId)
    .single();

  if (!travel) throw new Error('Travel not found');
  if (travel.user_id === userId) return true;

  const { data: member } = await sb
    .from('travel_members')
    .select('permission')
    .eq('travel_id', travelId)
    .eq('user_id', userId)
    .single();

  if (!member || member.permission !== 'read_write') throw new Error('Insufficient permissions');
  return true;
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
    await canManage(user.id, params.id);

    const body = await req.json();
    const { rule_type, rule_config } = body;

    if (!rule_type || !rule_config) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } }, { status: 400 });
    }

    const { data, error } = await sb
      .from('travel_notification_rules')
      .insert({
        travel_id: params.id,
        rule_type,
        rule_config,
        is_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Notification rule created' }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('permissions') ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
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

    const { data, error } = await sb
      .from('travel_notification_rules')
      .select('*')
      .eq('travel_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status: 500 });
  }
}
