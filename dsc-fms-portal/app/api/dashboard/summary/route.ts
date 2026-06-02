import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// GET /api/dashboard/summary - Get dashboard summary statistics
export async function GET() {
  try {
    // Fetch all required data in parallel
    const [
      { data: members },
      { data: portfolios },
      { data: assignments },
      { data: activities },
    ] = await Promise.all([
      supabase
        .from('team_members')
        .select('id, department, role')
        .eq('active', true),
      supabase
        .from('portfolio_items')
        .select('id, status, member_id'),
      supabase
        .from('portfolio_assignments')
        .select('id, role'),
      supabase
        .from('activity_log')
        .select('id, action_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    // Calculate statistics
    const totalMembers = members?.length || 0;
    const departmentCounts = {} as Record<string, number>;
    (members || []).forEach((m: any) => {
      departmentCounts[m.department] = (departmentCounts[m.department] || 0) + 1;
    });

    const portfolioByStatus = {} as Record<string, number>;
    (portfolios || []).forEach((p: any) => {
      portfolioByStatus[p.status] = (portfolioByStatus[p.status] || 0) + 1;
    });

    const assignmentsByRole = {} as Record<string, number>;
    (assignments || []).forEach((a: any) => {
      assignmentsByRole[a.role] = (assignmentsByRole[a.role] || 0) + 1;
    });

    // Recent activity summary
    const actionTypeCounts = {} as Record<string, number>;
    (activities || []).forEach((a: any) => {
      actionTypeCounts[a.action_type] = (actionTypeCounts[a.action_type] || 0) + 1;
    });

    return jsonResponse({
      data: {
        members: {
          total: totalMembers,
          byDepartment: departmentCounts,
        },
        portfolio: {
          total: portfolios?.length || 0,
          byStatus: portfolioByStatus,
        },
        assignments: {
          total: assignments?.length || 0,
          byRole: assignmentsByRole,
        },
        recentActivity: {
          total: activities?.length || 0,
          byType: actionTypeCounts,
        },
      },
    });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
