import { NextRequest, NextResponse } from 'next/server';
import { calculateMetrics } from '@/lib/backups/service';
import { getSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 });
  }

  try {
    // Get unique users with backups
    const { data: users } = await supabase
      .from('backups')
      .select('user_id');

    if (!users || users.length === 0) {
      return NextResponse.json({ aggregated: 0, status: 200 });
    }

    const uniqueUserIds = Array.from(new Set(users.map(u => (u as any).user_id))) as string[];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const metricDate = yesterday.toISOString().split('T')[0];

    let aggregated = 0;
    for (const userId of uniqueUserIds) {
      try {
        await calculateMetrics(supabase, userId as string, metricDate);
        aggregated++;
      } catch (err) {
        console.error(`Error calculating metrics for ${userId}:`, err);
      }
    }

    return NextResponse.json({ aggregated, status: 200 });
  } catch (error) {
    console.error('Error in metrics aggregation:', error);
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 });
  }
}
