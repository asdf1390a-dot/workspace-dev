// app/api/discord/processors/planner/route.ts
// Handles: design docs, roadmap updates, project planning, prioritization

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

export async function POST(req: NextRequest): Promise<NextResponse<ProcessorResponse>> {
  try {
    const { userId, username, content, timestamp } = (await req.json()) as ProcessorRequest;

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const contentLower = content.toLowerCase();
    const isRoadmapQuery = contentLower.includes('로드맵') || contentLower.includes('roadmap') || contentLower.includes('계획');
    const isPriorityQuery = contentLower.includes('우선순위') || contentLower.includes('priority') || contentLower.includes('중요');
    const isDesignQuery = contentLower.includes('설계') || contentLower.includes('design') || contentLower.includes('아키텍처');

    // Roadmap query
    if (isRoadmapQuery) {
      try {
        const { data: milestones, error } = await supabaseAdmin
          .from('milestones')
          .select('*')
          .order('target_date', { ascending: true })
          .limit(15);

        if (error) throw error;

        const grouped: Record<string, any[]> = {
          pending: [],
          in_progress: [],
          completed: [],
          blocked: [],
        };

        (milestones || []).forEach((m: any) => {
          if (m.status in grouped) {
            grouped[m.status].push(m);
          }
        });

        const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

        if (grouped.in_progress.length > 0) {
          fields.push({
            name: '🔄 진행 중 (In Progress)',
            value: grouped.in_progress
              .map((m) => `• **${m.title}** (마감: ${new Date(m.target_date).toLocaleDateString('ko-KR')})`)
              .join('\n'),
            inline: false,
          });
        }

        if (grouped.pending.length > 0) {
          fields.push({
            name: '⏳ 대기 중 (Pending)',
            value: grouped.pending
              .slice(0, 5)
              .map((m) => `• **${m.title}** (마감: ${new Date(m.target_date).toLocaleDateString('ko-KR')})`)
              .join('\n'),
            inline: false,
          });
        }

        if (grouped.completed.length > 0) {
          fields.push({
            name: '✅ 완료 (Completed)',
            value: `총 ${grouped.completed.length}건의 마일스톤 완료`,
            inline: false,
          });
        }

        if (grouped.blocked.length > 0) {
          fields.push({
            name: '⛔ 막힘 (Blocked)',
            value: grouped.blocked.map((m) => `• **${m.title}**`).join('\n'),
            inline: false,
          });
        }

        if (fields.length === 0) {
          fields.push({
            name: '📭 마일스톤',
            value: '등록된 마일스톤이 없습니다.',
            inline: false,
          });
        }

        return NextResponse.json({
          success: true,
          embed: {
            title: '🗺️ 프로젝트 로드맵',
            description: '현재 진행 중인 마일스톤과 계획입니다.',
            color: 0x3498db,
            fields,
            footer: { text: `총 ${milestones?.length || 0}개 항목 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
            timestamp,
          },
        });
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: `로드맵 조회 실패: ${e.message}`,
        });
      }
    }

    // Priority and prioritization guidance
    if (isPriorityQuery) {
      return NextResponse.json({
        success: true,
        embed: {
          title: '⭐ 우선순위 결정 가이드',
          description: '효과적인 우선순위 설정 방법',
          color: 0xf39c12,
          fields: [
            {
              name: '🎯 MoSCoW 방법',
              value: '**M**ust: 필수\n**S**hould: 중요\n**C**ould: 좋으면 좋음\n**W**on\'t: 나중에',
              inline: false,
            },
            {
              name: '⚖️ 영향도 vs 난이도',
              value: '높은 영향도 + 낮은 난이도 = 최우선\n낮은 영향도 + 높은 난이도 = 보류',
              inline: false,
            },
            {
              name: '📊 RICE 스코어',
              value: '**R**each(도달) × **I**mpact(영향) × **C**onfidence(확신) ÷ **E**ffort(노력)',
              inline: false,
            },
            {
              name: '💡 팁',
              value: '이해관계자와 함께 우선순위를 결정하세요.',
              inline: false,
            },
          ],
          footer: { text: `${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
          timestamp,
        },
      });
    }

    // Design and architecture guidance (default)
    return NextResponse.json({
      success: true,
      embed: {
        title: '🏗️ 플래너 도구 및 가이드',
        description: '프로젝트 계획 및 설계를 위한 리소스',
        color: 0x2ecc71,
        fields: [
          {
            name: '📐 설계 원칙',
            value: '**단순성**: 복잡함을 제거\n**확장성**: 미래 성장 고려\n**유지보수성**: 코드의 명확함',
            inline: false,
          },
          {
            name: '🎨 아키텍처 패턴',
            value: 'MVC, MVVM, Clean Architecture 등을 상황에 맞게 적용하세요.',
            inline: false,
          },
          {
            name: '📝 문서화',
            value: '설계 결정사항과 이유를 기록하세요. 이것이 미래의 당신을 돕습니다.',
            inline: false,
          },
          {
            name: '🔄 반복 계획',
            value: '"로드맵", "우선순위", "설계" 등의 키워드로 더 자세한 정보를 얻으세요.',
            inline: false,
          },
        ],
        footer: { text: `${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
        timestamp,
      },
    });
  } catch (e: any) {
    console.error('[planner]', e);
    return NextResponse.json({
      success: false,
      error: `처리 오류: ${e.message}`,
    });
  }
}
