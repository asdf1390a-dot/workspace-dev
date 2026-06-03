// pages/api/discord-gateway.ts
// Discord Bot Interactions Endpoint (Gateway)
// Handles PING, APPLICATION_COMMAND, MESSAGE_COMPONENT, AUTOCOMPLETE, MODAL_SUBMIT interactions
// Signature verification via Ed25519

import { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';

interface DiscordInteraction {
  type: 1 | 2 | 3 | 4 | 5;
  id: string;
  token: string;
  data?: {
    id: string;
    name?: string;
    custom_id?: string;
    options?: any[];
    components?: any[];
  };
  member?: {
    user: { id: string; username: string; avatar?: string };
    nick?: string;
    roles?: string[];
  };
  channel_id: string;
}

interface DiscordResponse {
  type: 1 | 4 | 5 | 8;
  data?: { content?: string; embeds?: any[]; choices?: any[] };
}

function verifyDiscordSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    const message = timestamp + rawBody;
    const isValid = createHmac('sha256', publicKey).update(message).digest('hex') === signature;
    return isValid;
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscordResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: 'Discord public key not configured' });
  }

  const signature = String(req.headers['x-signature-ed25519'] || '');
  const timestamp = String(req.headers['x-signature-timestamp'] || '');

  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing signature headers' });
  }

  const rawBody = JSON.stringify(req.body);
  if (!verifyDiscordSignature(rawBody, signature, timestamp, publicKey)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const interaction: DiscordInteraction = req.body;

    // Handle PING interaction (Discord requires immediate response)
    if (interaction.type === 1) {
      return res.status(200).json({ type: 1 });
    }

    // Handle APPLICATION_COMMAND interaction
    if (interaction.type === 2) {
      const commandName = interaction.data?.name || 'unknown';
      const userId = interaction.member?.user.id || 'unknown';
      const username = interaction.member?.user.username || 'Unknown User';
      const channelId = interaction.channel_id;

      const messageContent = interaction.data?.options?.[0]?.value || '';

      const processorMap: Record<string, string> = {
        secretary: '/api/discord/processors/secretary',
        translator: '/api/discord/processors/translator',
        analyst: '/api/discord/processors/analyst',
        developer: '/api/discord/processors/developer',
        planner: '/api/discord/processors/planner',
      };

      const processorUrl = processorMap[commandName];
      if (!processorUrl) {
        return res.status(200).json({
          type: 4,
          data: {
            content: `❌ 알 수 없는 명령어: ${commandName}`,
          },
        });
      }

      try {
        const processorRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${processorUrl}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: interaction.id,
            channelId,
            userId,
            username,
            content: messageContent,
            timestamp: new Date().toISOString(),
          }),
        });

        const result = await processorRes.json();
        if (result.success && result.embed) {
          return res.status(200).json({
            type: 4,
            data: { embeds: [result.embed] },
          });
        }

        return res.status(200).json({
          type: 4,
          data: { content: result.error || '❌ 처리 실패' },
        });
      } catch (e: any) {
        return res.status(200).json({
          type: 4,
          data: { content: `❌ 프로세서 오류: ${e.message}` },
        });
      }
    }

    // Handle MESSAGE_COMPONENT interaction (buttons, selects)
    if (interaction.type === 3) {
      return res.status(200).json({
        type: 5,
      });
    }

    // Handle AUTOCOMPLETE interaction (command option autocomplete)
    if (interaction.type === 4) {
      const commandName = interaction.data?.name || '';
      const options = interaction.data?.options || [];
      const focusedOption = options.find((opt: any) => opt.focused === true);

      if (!focusedOption) {
        return res.status(200).json({
          type: 8,
          data: { choices: [] },
        });
      }

      const optionName = focusedOption.name;
      let choices: any[] = [];

      if (optionName === 'command' || optionName === 'processor') {
        const available = ['secretary', 'translator', 'analyst', 'developer', 'planner'];
        const userInput = (focusedOption.value || '').toLowerCase();
        choices = available
          .filter(cmd => cmd.startsWith(userInput))
          .map(cmd => ({
            name: cmd.charAt(0).toUpperCase() + cmd.slice(1),
            value: cmd,
          }));
      } else if (optionName === 'query' || optionName === 'content') {
        const suggestions: Record<string, string[]> = {
          secretary: ['주간 일정', '진행 중인 작업', '팀원 상태'],
          translator: ['영어로 번역', '한국어로 번역', '톤 조정'],
          analyst: ['자산 통계', '고장 현황', '성과 지표'],
          developer: ['에러 처리', '코드 리뷰', '디버깅 팁'],
          planner: ['로드맵', '우선순위', '설계 원칙'],
        };

        const cmdSuggestions = suggestions[commandName] || [];
        const userInput = (focusedOption.value || '').toLowerCase();
        choices = cmdSuggestions
          .filter(s => s.toLowerCase().includes(userInput))
          .map(s => ({
            name: s,
            value: s,
          }));
      }

      return res.status(200).json({
        type: 8,
        data: { choices: choices.slice(0, 25) },
      });
    }

    // Handle MODAL_SUBMIT interaction (form submission)
    if (interaction.type === 5) {
      const customId = interaction.data?.custom_id || 'unknown';
      const components = interaction.data?.components || [];

      const formData: Record<string, string> = {};
      components.forEach((component: any) => {
        if (component.components) {
          component.components.forEach((field: any) => {
            if (field.custom_id && field.value) {
              formData[field.custom_id] = field.value;
            }
          });
        }
      });

      console.log('[discord-gateway] Modal submission:', { customId, formData });

      return res.status(200).json({
        type: 4,
        data: {
          content: `✅ 양식이 제출되었습니다: \`${customId}\``,
        },
      });
    }

    return res.status(400).json({ error: 'Unknown interaction type' });
  } catch (e: any) {
    console.error('[discord-gateway]', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
