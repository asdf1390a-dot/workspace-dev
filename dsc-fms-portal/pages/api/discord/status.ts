import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get 24h sync metrics
    const { data: syncLogs, error: syncError } = await supabase
      .from('discord_sync_log')
      .select('sync_status')
      .gte('created_at', oneDayAgo);

    if (syncError) {
      return res.status(500).json({ error: syncError.message });
    }

    const syncStats = {
      total: syncLogs?.length || 0,
      success: syncLogs?.filter((s) => s.sync_status === 'success').length || 0,
      fallback: syncLogs?.filter((s) => s.sync_status === 'fallback').length || 0,
      error: syncLogs?.filter((s) => s.sync_status === 'error').length || 0,
      duplicate: syncLogs?.filter((s) => s.sync_status === 'duplicate').length || 0,
    };

    const successRate = syncStats.total > 0 ? ((syncStats.success / syncStats.total) * 100).toFixed(2) : 'N/A';

    // Get task queue counts
    const { data: taskQueue, error: taskError } = await supabase
      .from('discord_task_queue')
      .select('status');

    if (taskError) {
      return res.status(500).json({ error: taskError.message });
    }

    const taskStats = {
      pending: taskQueue?.filter((t) => t.status === 'pending').length || 0,
      in_progress: taskQueue?.filter((t) => t.status === 'in_progress').length || 0,
      completed: taskQueue?.filter((t) => t.status === 'completed').length || 0,
      cancelled: taskQueue?.filter((t) => t.status === 'cancelled').length || 0,
    };

    // Get last 20 events
    const { data: recentEvents, error: eventError } = await supabase
      .from('discord_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (eventError) {
      return res.status(500).json({ error: eventError.message });
    }

    return res.status(200).json({
      timestamp: now.toISOString(),
      sync_metrics_24h: {
        ...syncStats,
        success_rate: `${successRate}%`,
      },
      task_queue: taskStats,
      recent_events: recentEvents,
      uptime_status: 'healthy',
    });
  } catch (e: any) {
    console.error('[discord status]', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
