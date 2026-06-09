import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type BreakdownSeverity = 'minor' | 'normal' | 'major' | 'line_down';

interface AnalyticsSummary {
  asset_id: string;
  machine_asset_number: string;
  asset_name: string;
  month: string;
  summary: {
    total_breakdowns: number;
    resolved_count: number;
    open_count: number;
    resolution_rate: number;
  };
  severity_distribution: {
    line_down: number;
    major: number;
    normal: number;
    minor: number;
  };
  performance_metrics: {
    avg_mttr_minutes: number | null;
    avg_mtbf_hours: number | null;
    total_downtime_minutes: number;
  };
}

interface OverallMetrics {
  total_breakdowns: number;
  resolved_count: number;
  open_count: number;
  resolution_rate: number;
  severity_distribution: {
    line_down: number;
    major: number;
    normal: number;
    minor: number;
  };
  total_downtime_minutes: number;
  avg_mttr_minutes?: number | null;
  avg_mtbf_hours?: number | null;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset_id = searchParams.get('asset_id');
    const reported_from = searchParams.get('reported_from');
    const reported_to = searchParams.get('reported_to');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    let query = supabase
      .from('breakdown_reports')
      .select('id, asset_id, status, severity, reported_at, resolved_at, assets(machine_asset_number, name_en)');

    if (asset_id) {
      query = query.eq('asset_id', asset_id);
    }

    if (reported_from) {
      query = query.gte('reported_at', reported_from);
    }

    if (reported_to) {
      query = query.lte('reported_at', reported_to);
    }

    query = query.limit(2000);

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type Row = {
      id: string;
      asset_id: string;
      status: string;
      severity: BreakdownSeverity;
      reported_at: string;
      resolved_at: string | null;
      assets: { machine_asset_number?: string; name_en?: string } | null;
    };
    const all = (rows || []) as Row[];

    const buckets: Record<string, AnalyticsSummary> = {};
    for (const r of all) {
      const monthKey = (r.reported_at || '').slice(0, 7) + '-01';
      const key = `${r.asset_id}__${monthKey}`;
      if (!buckets[key]) {
        buckets[key] = {
          asset_id: r.asset_id,
          machine_asset_number: r.assets?.machine_asset_number || '',
          asset_name: r.assets?.name_en || '',
          month: monthKey,
          summary: { total_breakdowns: 0, resolved_count: 0, open_count: 0, resolution_rate: 0 },
          severity_distribution: { line_down: 0, major: 0, normal: 0, minor: 0 },
          performance_metrics: { avg_mttr_minutes: null, avg_mtbf_hours: null, total_downtime_minutes: 0 },
        };
      }
      const b = buckets[key];
      b.summary.total_breakdowns++;
      if (r.status === 'resolved') b.summary.resolved_count++;
      else b.summary.open_count++;
      const sev: BreakdownSeverity = r.severity in b.severity_distribution ? r.severity : 'normal';
      (b.severity_distribution as Record<string, number>)[sev]++;
      if (r.resolved_at) {
        const dur = Math.round(
          (new Date(r.resolved_at).getTime() - new Date(r.reported_at).getTime()) / 60000
        );
        if (dur > 0) b.performance_metrics.total_downtime_minutes += dur;
      }
    }
    for (const b of Object.values(buckets)) {
      b.summary.resolution_rate =
        b.summary.total_breakdowns > 0
          ? Math.round((b.summary.resolved_count / b.summary.total_breakdowns) * 100)
          : 0;
      const resolvedDur = b.performance_metrics.total_downtime_minutes;
      b.performance_metrics.avg_mttr_minutes =
        b.summary.resolved_count > 0 ? Math.round(resolvedDur / b.summary.resolved_count) : null;
    }
    const data = Object.values(buckets).sort((a, b) => (a.month < b.month ? 1 : -1));

    const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 100), 500);
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const paginatedData = data.slice(parsedOffset, parsedOffset + parsedLimit);

    const overall: OverallMetrics = {
      total_breakdowns: all.length,
      resolved_count: all.filter((r) => r.status === 'resolved').length,
      open_count: all.filter((r) => r.status !== 'resolved').length,
      resolution_rate: 0,
      severity_distribution: { line_down: 0, major: 0, normal: 0, minor: 0 },
      total_downtime_minutes: 0,
      avg_mttr_minutes: null,
      avg_mtbf_hours: null,
    };
    for (const r of all) {
      const sev: BreakdownSeverity = r.severity in overall.severity_distribution ? r.severity : 'normal';
      (overall.severity_distribution as Record<string, number>)[sev]++;
      if (r.resolved_at) {
        const dur = Math.round(
          (new Date(r.resolved_at).getTime() - new Date(r.reported_at).getTime()) / 60000
        );
        if (dur > 0) overall.total_downtime_minutes += dur;
      }
    }
    overall.resolution_rate =
      overall.total_breakdowns > 0
        ? Math.round((overall.resolved_count / overall.total_breakdowns) * 100)
        : 0;
    overall.avg_mttr_minutes =
      overall.resolved_count > 0 ? Math.round(overall.total_downtime_minutes / overall.resolved_count) : null;

    return NextResponse.json({
      data: paginatedData,
      overall_metrics: overall,
      pagination: {
        total: data.length,
        limit: parsedLimit,
        offset: parsedOffset,
        has_more: parsedOffset + parsedLimit < data.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
