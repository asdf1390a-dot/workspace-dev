import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SHARED_SECRET = process.env.DISCORD_API_SHARED_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: check x-bot-secret header
  const botSecret = req.headers['x-bot-secret'] as string;
  if (!botSecret || botSecret !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { discord_msg_id, user_id, user_name, channel_id, channel_name, content, is_command } = req.body;

    if (!discord_msg_id || !channel_id || !user_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Compute content hash for dedup
    const contentHash = crypto
      .createHash('sha256')
      .update(`${discord_msg_id}:${content}`)
      .digest('hex');

    // Check for duplicate
    const { data: existingHash } = await supabase
      .from('discord_sync_log')
      .select('id')
      .eq('content_hash', contentHash)
      .eq('sync_status', 'success')
      .maybeSingle();

    if (existingHash) {
      // Log as duplicate, skip
      await supabase.from('discord_sync_log').insert({
        source_platform: 'discord',
        source_msg_id: discord_msg_id,
        content_hash: contentHash,
        sync_status: 'duplicate',
        created_at: new Date().toISOString(),
      });
      return res.status(200).json({ status: 'duplicate' });
    }

    // Archive message
    await supabase.from('discord_messages').insert({
      discord_msg_id,
      user_id,
      user_name,
      channel_id,
      channel_name,
      content,
      is_command: is_command || false,
      created_at: new Date().toISOString(),
    });

    // Log sync attempt
    await supabase.from('discord_sync_log').insert({
      source_platform: 'discord',
      source_msg_id: discord_msg_id,
      target_platform: 'telegram',
      content_hash: contentHash,
      sync_status: 'success',
      synced_at: new Date().toISOString(),
    });

    return res.status(200).json({ status: 'success', content_hash: contentHash });
  } catch (e: any) {
    console.error('[discord webhook]', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
