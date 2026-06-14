// app/api/discord/processors/translator/route.ts
// Handles: Korean ↔ English translation with tone adjustment via Claude API

import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
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

async function translateWithClaude(text: string, targetLang: 'en' | 'ko'): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set, returning original text');
    return text;
  }

  const client = new Anthropic({ apiKey });

  const prompt =
    targetLang === 'en'
      ? `Translate the following Korean business text to professional English. Maintain tone and context.\n\nKorean:\n${text}\n\nProvide only the English translation, no explanations.`
      : `Translate the following English business text to natural Korean. Maintain tone and context.\n\nEnglish:\n${text}\n\nProvide only the Korean translation, no explanations.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const translatedText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    return translatedText || text;
  } catch (error) {
    console.error('Claude API error:', error);
    return text;
  }
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
    const translated = sanitizeText(await translateWithClaude(content, targetLang));

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
