// pages/api/discord/processors/analyst.ts
// Handles: data queries - assets, breakdown management (BM), KPIs with statistics

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

interface ProcessorRequest {
  messageId: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

interface ProcessorResponse {
  success: boolean;
  embed?: DiscordEmbed;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, username, content, timestamp } = req.body as ProcessorRequest;

    if (!userId || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const contentLower = content.toLowerCase();
    const isAssetQuery = contentLower.includes('자산') || contentLower.includes('장비') || contentLower.includes('에셋');
    const isBMQuery = contentLower.includes('breakdown') || contentLower.includes('고장') || contentLower.includes('정지');
    const isKPIQuery = contentLower.includes('kpi') || contentLower.includes('지표') || contentLower.includes('성과');

    // Asset statistics query
    if (isAssetQuery) {
      try {
        const { data: assets, error: assetsError } = await supabaseAdmin
          .from('assets')
          .select('id, name_en, asset_class, location, status')
          .limit(10);

        if (assetsError) throw assetsError;

        const totalAssets = assets?.length || 0;
        const activeAssets = assets?.filter((a: any) => a.status === 'active').length || 0;

        return res.status(200).json({
          success: true,
          embed: {
            title: '📊 자산 통계',
            description: '현재 시스템의 자산 현황입니다.',
            color: 0x3498db,
            fields: [
              {
                name: '📈 전체 자산',
                value: `\`${totalAssets}\``,
                inline: true,
              },
              {
                name: '✅ 운영 중인 자산',
                value: `\`${activeAssets}\``,
                inline: true,
              },
              {
                name: '📍 주요 위치',
                value: assets?.slice(0, 3).map((a: any) => a.location || '미지정').join(', ') || '정보 없음',
                inline: false,
              },
            ],
            footer: { text: `데이터 업데이트: ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
            timestamp,
          },
        });
      } catch (e: any) {
        return res.status(200).json({
          success: false,
          error: `자산 조회 실패: ${e.message}`,
        });
      }
    }

    // BM (Breakdown Management) query
    if (isBMQuery) {
      try {
        const { data: breakdowns, error: bmError } = await supabaseAdmin
          .from('bm_events')
          .select('id, status, severity, reported_at')
          .order('reported_at', { ascending: false })
          .limit(50);

        if (bmError) throw bmError;

        const totalBreakdowns = breakdowns?.length || 0;
        const resolvedCount = breakdowns?.filter((b: any) => b.status === 'resolved').length || 0;
        const resolutionRate = totalBreakdowns > 0 ? Math.round((resolvedCount / totalBreakdowns) * 100) : 0;

        const severities = {
          line_down: breakdowns?.filter((b: any) => b.severity === 'line_down').length || 0,
          major: breakdowns?.filter((b: any) => b.severity === 'major').length || 0,
          normal: breakdowns?.filter((b: any) => b.severity === 'normal').length || 0,
          minor: breakdowns?.filter((b: any) => b.severity === 'minor').length || 0,
        };

        return res.status(200).json({
          success: true,
          embed: {
            title: '🔧 생산 고장 현황 (BM)',
            description: `최근 ${totalBreakdowns}건의 고장 데이터 분석`,
            color: 0xe74c3c,
            fields: [
              {
                name: '📊 전체 고장',
                value: `\`${totalBreakdowns}\``,
                inline: true,
              },
              {
                name: '✅ 해결된 고장',
                value: `\`${resolvedCount}\` (${resolutionRate}%)`,
                inline: true,
              },
              {
                name: '🔴 심각도 분포',
                value: `라인정지: ${severities.line_down} | 심각: ${severities.major} | 일반: ${severities.normal} | 경미: ${severities.minor}`,
                inline: false,
              },
            ],
            footer: { text: `분석 시점: ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
            timestamp,
          },
        });
      } catch (e: any) {
        return res.status(200).json({
          success: false,
          error: `고장 분석 실패: ${e.message}`,
        });
      }
    }

    // KPI metrics query (default)
    try {
      const { data: breakdowns, error: bmError } = await supabaseAdmin
        .from('bm_events')
        .select('resolved_at, reported_at, severity')
        .not('resolved_at', 'is', null);

      if (bmError) throw bmError;

      const mttrValues = (breakdowns || [])
        .map((b: any) => {
          const resolved = new Date(b.resolved_at).getTime();
          const reported = new Date(b.reported_at).getTime();
          return (resolved - reported) / 60000;
        })
        .filter((m) => m > 0);

      const avgMTTR = mttrValues.length > 0 ? Math.round(mttrValues.reduce((a, b) => a + b) / mttrValues.length) : 0;

      return res.status(200).json({
        success: true,
        embed: {
          title: '📈 KPI 지표',
          description: '주요 성과 지표 요약',
          color: 0x27ae60,
          fields: [
            {
              name: '⏱️ 평균 복구 시간 (MTTR)',
              value: `\`${avgMTTR}분\``,
              inline: true,
            },
            {
              name: '📊 샘플 수',
              value: `\`${mttrValues.length}건\``,
              inline: true,
            },
            {
              name: '💡 해석',
              value: avgMTTR > 0 ? `평균적으로 고장 발생 후 ${avgMTTR}분 내에 해결됩니다.` : '데이터가 부족합니다.',
              inline: false,
            },
          ],
          footer: { text: `계산: ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
          timestamp,
        },
      });
    } catch (e: any) {
      console.error('[analyst]', e);
      return res.status(200).json({
        success: false,
        error: `KPI 계산 실패: ${e.message}`,
      });
    }
  } catch (e: any) {
    console.error('[analyst]', e);
    return res.status(200).json({
      success: false,
      error: `처리 오류: ${e.message}`,
    });
  }
}
