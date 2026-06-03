import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, costId } = req.query;
    const { action } = req.body;

    if (!id || !costId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is organizer of this travel
    const { data: travel } = await supabase
      .from('travels')
      .select('id')
      .eq('id', id as string)
      .single();

    if (!travel) {
      return res.status(404).json({ error: 'Travel not found' });
    }

    // Update cost workflow status
    const newStatus =
      action === 'approve' ? 'approved' : 'pending_approval';

    const { error: updateError } = await supabase
      .from('travel_costs')
      .update({
        workflow_status: newStatus,
        approved_by: action === 'approve' ? token : null,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', costId as string)
      .eq('travel_id', id as string);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: `Cost ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
