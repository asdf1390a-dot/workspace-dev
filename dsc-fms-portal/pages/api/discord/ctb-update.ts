import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SHARED_SECRET = process.env.DISCORD_API_SHARED_SECRET || '';

interface CTBChange {
  task_name: string;
  assignee: string;
  old_status: string;
  new_status: string;
  eta?: string;
  time_delta?: string;
}

const STATUS_COLORS: Record<string, number> = {
  IN_PROGRESS: 0xffa500, // Orange
  COMPLETED: 0x27ae60,   // Green
  BLOCKED: 0xe74c3c,     // Red
  PENDING: 0x95a5a6,     // Gray
};

const CHANNEL_MAP: Record<string, string> = {
  IN_PROGRESS: process.env.DISCORD_CHANNEL_INPROGRESS || '',
  COMPLETED: process.env.DISCORD_CHANNEL_COMPLETED || '',
  BLOCKED: process.env.DISCORD_CHANNEL_ISSUES || '',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: check either x-bot-secret header or Vercel Cron header
  const botSecret = req.headers['x-bot-secret'] as string;
  const cronHeader = req.headers['x-vercel-cron'] as string;

  if (!botSecret && !cronHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (botSecret && botSecret !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  try {
    const { changes } = req.body;

    if (!Array.isArray(changes)) {
      return res.status(400).json({ error: 'changes must be an array' });
    }

    const results: Array<Record<string, any>> = [];

    for (const change of changes as CTBChange[]) {
      const { task_name, assignee, old_status, new_status, eta, time_delta } = change;

      if (!task_name || !new_status) {
        results.push({ task_name, status: 'error', reason: 'Missing task_name or new_status' });
        continue;
      }

      const channelId = CHANNEL_MAP[new_status];
      if (!channelId) {
        results.push({ task_name, status: 'warning', reason: `No channel mapped for status ${new_status}` });
        continue;
      }

      // Build embed
      const embed = {
        title: `【${new_status}】 ${task_name}`,
        color: STATUS_COLORS[new_status] || 0x95a5a6,
        fields: [
          {
            name: '담당자',
            value: assignee || '-',
            inline: true,
          },
          {
            name: '상태변화',
            value: `${old_status} → ${new_status}`,
            inline: true,
          },
        ] as Array<{ name: string; value: string; inline: boolean }>,
        timestamp: new Date().toISOString(),
      };

      if (eta) {
        embed.fields.push({
          name: 'ETA',
          value: eta,
          inline: true,
        });
      }

      if (time_delta) {
        embed.fields.push({
          name: 'Time Delta',
          value: time_delta,
          inline: true,
        });
      }

      // Log the CTB update
      await supabase.from('discord_sync_log').insert({
        source_platform: 'ctb',
        target_platform: 'discord',
        sync_status: 'success',
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      });

      results.push({
        task_name,
        status: 'posted',
        channel_id: channelId,
        embed,
      });
    }

    return res.status(200).json({
      status: 'ok',
      processed: results.length,
      results,
    });
  } catch (e: any) {
    console.error('[discord ctb-update]', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
