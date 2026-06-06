import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('team_activity_logs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Audit log not found');

    return Response.json({
      auditId: data.id,
      activityType: data.activity_type,
      actorId: data.actor_id,
      actorName: data.actor_name,
      targetType: data.target_type,
      targetId: data.target_id,
      targetName: data.target_name,
      changes: data.changes || [],
      reason: data.reason,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to fetch audit log',
    }, { status: 500 });
  }
}
