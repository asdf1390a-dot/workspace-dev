import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { calculateSettlement } from '@/lib/travel/settlement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing travel ID' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify travel exists
    const { data: travel } = await supabase
      .from('travels')
      .select('id')
      .eq('id', id as string)
      .single();

    if (!travel) {
      return res.status(404).json({ error: 'Travel not found' });
    }

    // Calculate settlement
    const settlement = await calculateSettlement(
      supabase,
      id as string
    );

    return res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Settlement calculation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
