import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_DISPOSAL_REASONS = ['수명만료', '손상', '판매', '기증', '기타'];

// POST /api/assets/[assetId]/dispose — Asset disposal registration
export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const body = await request.json();
    const { disposal_reason, disposal_date, disposal_certificate_url } = body;

    if (!disposal_reason || !disposal_date) {
      return NextResponse.json(
        { error: 'disposal_reason and disposal_date are required' },
        { status: 400 }
      );
    }

    if (!VALID_DISPOSAL_REASONS.includes(disposal_reason)) {
      return NextResponse.json(
        { error: `Invalid disposal_reason. Must be one of: ${VALID_DISPOSAL_REASONS.join(', ')}` },
        { status: 400 }
      );
    }

    const disposalDateObj = new Date(disposal_date);
    if (disposalDateObj > new Date()) {
      return NextResponse.json(
        { error: 'disposal_date cannot be in the future' },
        { status: 400 }
      );
    }

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, status')
      .eq('id', params.assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    if (asset.status === 'disposed') {
      return NextResponse.json(
        { error: 'Asset is already disposed' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: disposal, error: disposalError } = await supabase
      .from('asset_disposals')
      .insert({
        asset_id: params.assetId,
        disposed_by: user.id,
        disposal_reason,
        disposal_date,
        disposal_certificate_url: disposal_certificate_url || null,
      })
      .select()
      .single();

    if (disposalError) throw disposalError;

    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: 'disposed' })
      .eq('id', params.assetId);

    if (updateError) throw updateError;

    await supabase
      .from('asset_edit_history')
      .insert({
        asset_id: params.assetId,
        changed_by: user.id,
        changed_field: 'status',
        previous_value: asset.status,
        new_value: 'disposed',
      });

    return NextResponse.json(
      {
        id: disposal.id,
        asset_id: disposal.asset_id,
        disposal_reason: disposal.disposal_reason,
        disposal_date: disposal.disposal_date,
        created_at: disposal.created_at,
        status: 'recorded',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[dispose]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
