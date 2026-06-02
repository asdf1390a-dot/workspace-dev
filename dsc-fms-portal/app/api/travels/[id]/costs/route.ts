// Travel Costs — Create/list costs
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
  const { data: travel, error } = await sb
    .from('travels')
    .select('user_id')
    .eq('id', travelId)
    .single();

  if (error || !travel) throw new Error('Travel not found');
  if (travel.user_id === userId) return true;

  const { data: member } = await sb
    .from('travel_members')
    .select('id')
    .eq('travel_id', travelId)
    .eq('user_id', userId)
    .single();

  if (!member) throw new Error('Access denied');
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
    await canAccessTravel(user.id, params.id);

    const body = await req.json();
    const { title, amount, currency = 'INR', cost_type, payment_method, cost_date, splits } = body;

    if (!title || !amount || !cost_date) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } }, { status: 400 });
    }

    const { data: cost, error } = await sb
      .from('travel_costs')
      .insert({
        travel_id: params.id,
        payer_id: user.id,
        title,
        amount,
        currency,
        cost_type,
        payment_method,
        cost_date,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert splits if provided
    if (splits && splits.length > 0) {
      const splitData = splits.map((s: { member_id: string; amount: number }) => ({
        cost_id: cost.id,
        member_id: s.member_id,
        amount: s.amount,
      }));

      const { error: splitError } = await sb.from('travel_cost_splits').insert(splitData);
      if (splitError) throw splitError;

      cost.splits = splitData;
    }

    return NextResponse.json({ success: true, data: cost, message: 'Cost created' }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Access denied') ? 403 : 500;
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
    await canAccessTravel(user.id, params.id);

    const { data, error } = await sb
      .from('travel_costs')
      .select('*, splits:travel_cost_splits(*)')
      .eq('travel_id', params.id)
      .order('cost_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const status = msg.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ success: false, error: { code: 'ERROR', message: msg } }, { status });
  }
}
