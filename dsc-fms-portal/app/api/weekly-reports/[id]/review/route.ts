import { NextRequest, NextResponse } from 'next/server';
import { reviewWeeklyReport } from '@/lib/weekly-reports/service';
import { getSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseClient();
  try {
    const body = await request.json();
    const { reviewed_by_user, department_reviewed = [] } = body;

    const userId = reviewed_by_user || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', status: 401 },
        { status: 401 }
      );
    }

    const result = await reviewWeeklyReport(
      supabase,
      params.id,
      userId,
      department_reviewed
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error reviewing weekly report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to review weekly report', status: 500 },
      { status: 500 }
    );
  }
}
