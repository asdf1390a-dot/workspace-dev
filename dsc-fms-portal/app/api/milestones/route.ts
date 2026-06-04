import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const portfolioId = request.nextUrl.searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('target_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      portfolio_id,
      title,
      description = null,
      target_date,
      status = 'pending',
      weight = 1.0
    } = body;

    if (!portfolio_id || !title || !target_date) {
      return NextResponse.json(
        { error: 'portfolio_id, title, and target_date required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('milestones')
      .insert([{
        portfolio_id,
        title,
        description,
        target_date,
        status,
        weight
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
