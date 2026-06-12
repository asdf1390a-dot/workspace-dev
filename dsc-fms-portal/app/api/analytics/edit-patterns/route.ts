import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || 'month';

    const now = new Date();
    let startDate: Date;
    let periodLabel: string;

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodLabel = `${now.getFullYear()}-W${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)}`;
    } else if (timeRange === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const quarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      startDate = quarterStart;
      periodLabel = `${now.getFullYear()}-Q${quarter}`;
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      periodLabel = `${now.getFullYear()}`;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const { data: edits, error } = await supabase
      .from('asset_edit_history')
      .select('*')
      .gte('changed_at', startDate.toISOString());

    if (error) throw error;

    // Calculate edit velocity
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const editsPerDayAvg = (edits?.length || 0) / daysDiff;

    const dayOfWeekCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    const hourCounts: Record<string, number> = {};

    edits?.forEach((edit: any) => {
      const date = new Date(edit.changed_at);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      dayOfWeekCounts[dayName]++;

      const hour = date.getHours();
      const hourRange = `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`;
      hourCounts[hourRange] = (hourCounts[hourRange] || 0) + 1;
    });

    const peakEditDay = Object.entries(dayOfWeekCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const peakEditHour = Object.entries(hourCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Calculate field volatility
    const fieldStats: Record<string, any> = {};

    edits?.forEach((edit: any) => {
      const field = edit.changed_field;
      if (!fieldStats[field]) {
        fieldStats[field] = {
          change_frequency: 0,
          transitions: {},
          total_changes: 0,
        };
      }

      fieldStats[field].change_frequency++;
      fieldStats[field].total_changes++;

      const transition = `${edit.previous_value} → ${edit.new_value}`;
      fieldStats[field].transitions[transition] = (fieldStats[field].transitions[transition] || 0) + 1;
    });

    const fieldVolatility: Record<string, any> = {};

    Object.entries(fieldStats).forEach(([field, stats]: [string, any]) => {
      const commonTransitions = Object.entries(stats.transitions)
        .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
        .slice(0, 5)
        .map(([transition, count]) => `${transition} (${count} times)`);

      const stabilityScore = (1 - (stats.change_frequency / Math.max(1, edits?.length || 1))).toFixed(2);

      fieldVolatility[field] = {
        change_frequency: stats.change_frequency,
        common_transitions: commonTransitions,
        stability_score: parseFloat(stabilityScore),
      };
    });

    return NextResponse.json({
      analysis_period: periodLabel,
      edit_velocity: {
        edits_per_day_avg: parseFloat(editsPerDayAvg.toFixed(2)),
        peak_edit_day: peakEditDay,
        peak_edit_hour: peakEditHour,
      },
      field_volatility: fieldVolatility,
    });
  } catch (error: any) {
    console.error('[edit-patterns]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
