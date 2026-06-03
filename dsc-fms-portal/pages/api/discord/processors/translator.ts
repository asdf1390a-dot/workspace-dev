// pages/api/discord/processors/translator.ts
// Handles: Korean ↔ English translation with tone adjustment

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

// Simple heuristic for language detection
function isKorean(text: string): boolean {
  return /[가-힯]/.test(text);
}

// Mock translation function (in production, would call a translation API)
function translateText(text: string, targetLang: 'en' | 'ko'): string {
  if (targetLang === 'en' && isKorean(text)) {
    // Korean to English (mock)
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
    // English to Korean (mock)
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

    const sourceIsKorean = isKorean(content);
    const targetLang = sourceIsKorean ? 'en' : 'ko';
    const translated = translateText(content, targetLang);

    return res.status(200).json({
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
    return res.status(200).json({
      success: false,
      error: `번역 오류: ${e.message}`,
    });
  }
}
