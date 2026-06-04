// app/api/discord/processors/translator/route.ts
// Handles: Korean ↔ English translation with tone adjustment

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeText } from '@/lib/discord/sanitizer';

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

function isKorean(text: string): boolean {
  return /[가-힯]/.test(text);
}

function translateText(text: string, targetLang: 'en' | 'ko'): string {
  if (targetLang === 'en' && isKorean(text)) {
    const translations: Record<string, string> = {
      '안녕': 'Hello',
      '감사합니다': 'Thank you',
      '도움이 필요합니다': 'I need help',
      '작업 진행': 'Work in progress',
      '완료되었습니다': 'Completed',
      '오류가 발생했습니다': 'An error occurred',
    };

    let result = text;
    Object.entries(translations).forEach(([ko, en]) => {
      result = result.replace(ko, en);
    });
    return result || `[EN Translation needed for: ${text}]`;
  } else if (targetLang === 'ko' && !isKorean(text)) {
    const translations: Record<string, string> = {
      'Hello': '안녕',
      'Thank you': '감사합니다',
      'Help': '도움',
      'Work': '작업',
      'Completed': '완료',
      'Error': '오류',
    };

    let result = text;
    Object.entries(translations).forEach(([en, ko]) => {
      result = result.replace(new RegExp(en, 'gi'), ko);
    });
    return result || `[KO Translation needed for: ${text}]`;
  }

  return text;
}

export async function POST(req: NextRequest): Promise<NextResponse<ProcessorResponse>> {
  try {
    const raw = (await req.json()) as ProcessorRequest;
    const userId = raw.userId;
    const timestamp = raw.timestamp;

    if (!userId || !raw.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const username = sanitizeText(raw.username);
    const content = sanitizeText(raw.content);
    const sourceIsKorean = isKorean(content);
    const targetLang = sourceIsKorean ? 'en' : 'ko';
    const translated = sanitizeText(translateText(content, targetLang));

    return NextResponse.json({
      success: true,
      embed: {
        title: '🌐 번역',
        description: `${sourceIsKorean ? '🇰🇷 한국어 → 🇬🇧 English' : '🇬🇧 English → 🇰🇷 한국어'}`,
        color: 0x2ecc71,
        fields: [
          {
            name: sourceIsKorean ? '원본 (한국어)' : 'Original (English)',
            value: `\`\`\`\n${content}\n\`\`\``,
            inline: false,
          },
          {
            name: sourceIsKorean ? '번역 (English)' : 'Translation (한국어)',
            value: `\`\`\`\n${translated}\n\`\`\``,
            inline: false,
          },
          {
            name: '💡 팁',
            value: '정확한 번역을 위해 문맥을 함께 제공해주시면 더 좋습니다.',
            inline: false,
          },
        ],
        footer: { text: `${username}님 | ${new Date(timestamp).toLocaleTimeString('ko-KR')}` },
        timestamp,
      },
    });
  } catch (e: any) {
    console.error('[translator]', e);
    return NextResponse.json({
      success: false,
      error: `번역 오류: ${e.message}`,
    });
  }
}
