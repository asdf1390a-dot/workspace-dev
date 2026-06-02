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

// GET /api/dashboard/team-org/departments - Get all departments with member counts
export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('department')
      .eq('active', true);

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    // Count members per department
    const departments: Record<string, number> = {};
    (members || []).forEach((member: any) => {
      if (member.department) {
        departments[member.department] = (departments[member.department] || 0) + 1;
      }
    });

    const data = Object.entries(departments).map(([name, count]) => ({
      name,
      count,
    }));

    return jsonResponse({
      data,
      count: data.length,
    });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
