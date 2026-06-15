import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId 파라미터 필수' },
        { status: 400 }
      );
    }

    // 전체 편집 이력 조회
    const { data: editHistory, error: historyError } = await supabase
      .from('asset_edit_history')
      .select('*')
      .eq('asset_id', assetId)
      .order('changed_at', { ascending: false });

    if (historyError) {
      return NextResponse.json(
        { error: historyError.message },
        { status: 500 }
      );
    }

    // 통계 계산
    const totalChanges = editHistory?.length || 0;
    const fieldChangeCounts: Record<string, number> = {};
    const changedByUsers = new Set<string>();
    let firstChange: string | null = null;
    let lastChange: string | null = null;

    if (editHistory && editHistory.length > 0) {
      editHistory.forEach((entry: any) => {
        fieldChangeCounts[entry.changed_field] = (fieldChangeCounts[entry.changed_field] || 0) + 1;
        if (entry.changed_by) {
          changedByUsers.add(entry.changed_by);
        }
      });

      lastChange = editHistory[0]?.changed_at;
      firstChange = editHistory[editHistory.length - 1]?.changed_at;
    }

    const topChangedFields = Object.entries(fieldChangeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([field, count]) => ({ field, count }));

    return NextResponse.json({
      success: true,
      assetId,
      statistics: {
        totalChanges,
        uniqueUsers: changedByUsers.size,
        topChangedFields,
        firstChangeAt: firstChange,
        lastChangeAt: lastChange,
      },
      editHistory: editHistory || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '알 수 없는 오류 발생' },
      { status: 500 }
    );
  }
}
