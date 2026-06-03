// pages/api/discord/processors/developer.ts
// Handles: technical problem solving, code review guidance, debugging assistance

import { NextApiRequest, NextApiResponse } from 'next';

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
    const isErrorQuery = contentLower.includes('에러') || contentLower.includes('error') || contentLower.includes('bug');
    const isReviewRequest = contentLower.includes('리뷰') || contentLower.includes('review') || contentLower.includes('코드');
    const isDebugRequest = contentLower.includes('디버그') || contentLower.includes('debug') || contentLower.includes('문제');

    // Error handling and troubleshooting
    if (isErrorQuery) {
      return res.status(200).json({
        success: true,
        embed: {
          title: '🐛 오류 진단 가이드',
          description: `${username}님의 문제를 해결하기 위한 체크리스트입니다.`,
          color: 0xe67e22,
          fields: [
            {
              name: '1️⃣ 에러 메시지 수집',
              value: '전체 스택 트레이스와 발생 시점을 기록하세요.',
              inline: false,
            },
            {
              name: '2️⃣ 환경 확인',
              value: 'Node.js, npm, 데이터베이스 버전 확인. 최근 변경사항 검토.',
              inline: false,
            },
            {
              name: '3️⃣ 재현 가능성',
              value: '같은 조건에서 오류를 반복할 수 있는지 확인하세요.',
              inline: false,
            },
            {
              name: '4️⃣ 로그 분석',
              value: '서버/클라이언트 로그에서 이상 징후를 찾으세요.',
              inline: false,
            },
            {
              name: '5️⃣ 경우의 수 제거',
              value: '하나씩 변수를 제거하면서 원인을 찾으세요.',
              inline: false,
            },
          ],
          footer: { text: `문의: ${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
          timestamp,
        },
      });
    }

    // Code review guidance
    if (isReviewRequest) {
      return res.status(200).json({
        success: true,
        embed: {
          title: '👨‍💻 코드 리뷰 체크리스트',
          description: '좋은 코드 리뷰를 위한 필수 항목입니다.',
          color: 0x9b59b6,
          fields: [
            {
              name: '✅ 기능성 (Functionality)',
              value: '의도한 대로 동작하는가? 엣지 케이스는 처리되는가?',
              inline: false,
            },
            {
              name: '✅ 가독성 (Readability)',
              value: '네이밍이 명확한가? 로직이 이해하기 쉬운가?',
              inline: false,
            },
            {
              name: '✅ 성능 (Performance)',
              value: 'O(n²) 루프는 없는가? 불필요한 계산이 있는가?',
              inline: false,
            },
            {
              name: '✅ 보안 (Security)',
              value: 'SQL injection, XSS, 인증/인가 체크는 충분한가?',
              inline: false,
            },
            {
              name: '✅ 테스트 (Testing)',
              value: '단위 테스트, 통합 테스트가 있는가?',
              inline: false,
            },
          ],
          footer: { text: `요청: ${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
          timestamp,
        },
      });
    }

    // Debugging guidance (default)
    return res.status(200).json({
      success: true,
      embed: {
        title: '🛠️ 개발자 도구 및 가이드',
        description: '기술적인 문제 해결을 위한 리소스',
        color: 0x16a085,
        fields: [
          {
            name: '🔍 디버깅 팁',
            value: '`console.log()`, 브라우저 DevTools, 서버 로그를 활용하세요.',
            inline: false,
          },
          {
            name: '📚 리소스',
            value: '[Next.js Docs](https://nextjs.org) | [Supabase Docs](https://supabase.com/docs)',
            inline: false,
          },
          {
            name: '🚀 최적화',
            value: 'npm audit으로 의존성 검사, Code splitting으로 번들 최적화.',
            inline: false,
          },
          {
            name: '💬 더 알아보기',
            value: '"에러", "리뷰", "문제" 등의 키워드로 더 구체적인 도움을 받으세요.',
            inline: false,
          },
        ],
        footer: { text: `${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
        timestamp,
      },
    });
  } catch (e: any) {
    console.error('[developer]', e);
    return res.status(200).json({
      success: false,
      error: `처리 오류: ${e.message}`,
    });
  }
}
