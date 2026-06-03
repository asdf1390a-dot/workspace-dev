// app/api/discord/processors/secretary/route.ts
// Handles: team schedule queries, task status, technical resource recommendations

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
    const isScheduleQuery = contentLower.includes('일정') || contentLower.includes('스케줄');
    const isTaskStatus = contentLower.includes('작업') || contentLower.includes('태스크') || contentLower.includes('진행');
    const isResourceRequest = contentLower.includes('자료') || contentLower.includes('리소스');

    // Team schedule query
    if (isScheduleQuery) {
      try {
        const { data: milestones, error } = await supabaseAdmin
          .from('milestones')
          .select('*')
          .in('status', ['pending', 'in_progress'])
          .gte('target_date', new Date().toISOString())
          .order('target_date', { ascending: true })
          .limit(10);

        if (error) throw error;

        const fields = (milestones || []).map((m: any) => ({
          name: `📌 ${m.title}`,
          value: `**마감:** ${new Date(m.target_date).toLocaleDateString('ko-KR')}\n**상태:** ${m.status}`,
          inline: false,
        }));

        if (fields.length === 0) {
          fields.push({
            name: '📭 진행 중인 일정',
            value: '현재 등록된 일정이 없습니다.',
            inline: false,
          });
        }

        return NextResponse.json({
          success: true,
          embed: {
            title: '📅 주간 일정 현황',
            description: `${username}님을 위한 팀 일정입니다.`,
            color: 0x3498db,
            fields,
            footer: { text: `요청: ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
            timestamp,
          },
        });
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: `일정 조회 실패: ${e.message}`,
        });
      }
    }

    // Task status query
    if (isTaskStatus) {
      try {
        const { data: tasks, error } = await supabaseAdmin
          .from('milestones')
          .select('*')
          .eq('status', 'in_progress')
          .limit(10);

        if (error) throw error;

        const fields = (tasks || []).map((t: any) => ({
          name: `⚙️ ${t.title}`,
          value: `**마감:** ${new Date(t.target_date).toLocaleDateString('ko-KR')}\n**설명:** ${t.description || '상세 설명 없음'}`,
          inline: false,
        }));

        if (fields.length === 0) {
          fields.push({
            name: '✅ 진행 중인 작업',
            value: '현재 진행 중인 작업이 없습니다.',
            inline: false,
          });
        }

        return NextResponse.json({
          success: true,
          embed: {
            title: '⚡ 진행 중인 작업 현황',
            description: '팀의 현재 진행 중인 작업 목록입니다.',
            color: 0xf39c12,
            fields,
            footer: { text: `요청: ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
            timestamp,
          },
        });
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: `작업 조회 실패: ${e.message}`,
        });
      }
    }

    // Resource recommendation (fallback)
    return NextResponse.json({
      success: true,
      embed: {
        title: '📚 비서 도움말',
        description: '다음 명령어를 사용할 수 있습니다:',
        color: 0x9b59b6,
        fields: [
          {
            name: '🗓️ 팀 일정 조회',
            value: '"일정", "스케줄" 등의 단어로 주간 일정을 확인하세요.',
            inline: false,
          },
          {
            name: '⚡ 작업 현황 조회',
            value: '"작업", "진행" 등의 단어로 진행 중인 작업을 확인하세요.',
            inline: false,
          },
          {
            name: '💡 팁',
            value: '자세한 정보가 필요하시면 언제든 다시 물어보세요!',
            inline: false,
          },
        ],
        footer: { text: `${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
        timestamp,
      },
    });
  } catch (e: any) {
    console.error('[secretary]', e);
    return NextResponse.json({
      success: false,
      error: `처리 오류: ${e.message}`,
    });
  }
}
