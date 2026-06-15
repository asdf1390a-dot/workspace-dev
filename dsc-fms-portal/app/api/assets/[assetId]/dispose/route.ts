import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;
    const body = await request.json();
    const { disposal_reason, disposal_date, disposal_certificate_url } = body;

    if (!assetId || !disposal_reason || !disposal_date) {
      return NextResponse.json(
        { error: 'assetId, disposal_reason, disposal_date 필수' },
        { status: 400 }
      );
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 인증 필수' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('asset_disposals')
      .insert({
        asset_id: assetId,
        disposed_by: userId,
        disposal_reason,
        disposal_date,
        disposal_certificate_url: disposal_certificate_url || null,
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '자산 폐기 처리 완료',
        data: data?.[0] || null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '알 수 없는 오류 발생' },
      { status: 500 }
    );
  }
}
