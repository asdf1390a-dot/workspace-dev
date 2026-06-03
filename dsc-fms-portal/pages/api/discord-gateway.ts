// pages/api/discord-gateway.ts
// Discord Bot Interactions Endpoint (Gateway)
// Handles PING, APPLICATION_COMMAND, MESSAGE_COMPONENT interactions
// Signature verification via Ed25519

import { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';

interface DiscordInteraction {
  type: 1 | 2 | 3;
  id: string;
  token: string;
  data?: {
    id: string;
    name?: string;
    options?: any[];
  };
  member?: {
    user: { id: string; username: string; avatar?: string };
    nick?: string;
    roles?: string[];
  };
  channel_id: string;
}

interface DiscordResponse {
  type: 1 | 4 | 5;
  data?: { content?: string; embeds?: any[] };
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

    return res.status(400).json({ error: 'Unknown interaction type' });
  } catch (e: any) {
    console.error('[discord-gateway]', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
