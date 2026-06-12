import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    const { data, error } = await supabase
      .from('asset_disposals')
      .select('disposal_date, disposal_reason')
      .gte('disposal_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) throw error;

    // Group by month and reason
    const trends: any = {};
    const reasonCounts: any = {};

    data?.forEach((record: any) => {
      const dateObj = new Date(record.disposal_date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!trends[monthKey]) {
        trends[monthKey] = 0;
      }
      trends[monthKey]++;

      if (!reasonCounts[record.disposal_reason]) {
        reasonCounts[record.disposal_reason] = 0;
      }
      reasonCounts[record.disposal_reason]++;
    });

    const monthlyTrends = Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        disposals: count,
      }));

    const reasonDistribution = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
      percentage: ((count as number) / (data?.length || 1) * 100).toFixed(2),
    }));

    return NextResponse.json({
      period_months: months,
      total_disposals: data?.length || 0,
      monthly_trends: monthlyTrends,
      reason_distribution: reasonDistribution,
    });
  } catch (error: any) {
    console.error('[asset-disposals-trends]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
