import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SHARED_SECRET = process.env.DISCORD_API_SHARED_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check
  const botSecret = req.headers['x-bot-secret'] as string;
  if (!botSecret || botSecret !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    // Create task
    return handlePostTask(req, res);
  } else if (req.method === 'GET') {
    // List task queue
    return handleGetTasks(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePostTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { assigned_to, task_description, priority, deadline, platform_origin } = req.body;

    if (!assigned_to || !task_description) {
      return res.status(400).json({ error: 'Missing assigned_to or task_description' });
    }

    if (task_description.length < 5 || task_description.length > 500) {
      return res
        .status(400)
        .json({ error: 'task_description must be between 5 and 500 characters' });
    }

    const { data, error } = await supabase
      .from('discord_task_queue')
      .insert({
        assigned_to,
        task_description,
        priority: priority || 'P1',
        deadline: deadline || null,
        platform_origin: platform_origin || 'discord',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ data: data?.[0] });
  } catch (e: any) {
    console.error('[discord task POST]', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}

async function handleGetTasks(req: NextApiRequest, res: NextApiResponse) {
  try {
    const status = req.query.status as string | undefined;
    const assigned_to = req.query.assigned_to as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);

    let query = supabase.from('discord_task_queue').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      data,
      count,
      limit,
    });
  } catch (e: any) {
    console.error('[discord task GET]', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
