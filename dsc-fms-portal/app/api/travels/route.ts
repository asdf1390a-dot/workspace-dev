// Travel Management — Travel list (GET all, POST new)
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sb = getSupabaseClient();
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: user, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } }, { status: 401 });
    }

    // Get travels where user is owner or member
    const { data, error } = await sb
      .from('travels')
      .select('*')
      .or(`user_id.eq.${user.user.id},id.in(select travel_id from travel_members where user_id = ${user.user.id})`, { foreignTable: 'travel_members' })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Travels retrieved' }, { status: 200 });
  } catch (err) {
    console.error('GET /api/travels error:', err);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sb = getSupabaseClient();
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: user, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, start_date, end_date, location } = body;

    if (!name || !start_date || !end_date || !location) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } }, { status: 400 });
    }

    const { data, error } = await sb.from('travels').insert({
      user_id: user.user.id,
      name,
      description,
      start_date,
      end_date,
      location,
      status: 'upcoming',
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Travel created' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/travels error:', err);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' } }, { status: 500 });
  }
}
