import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// GET /api/dashboard/team-org/hierarchy - Get hierarchical view with manager relationships
export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, name, role, manager_id, active')
      .eq('active', true);

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    // Build hierarchy tree
    const membersMap = new Map((members || []).map((m: any) => [m.id, m]));
    const hierarchy: any[] = [];

    (members || []).forEach((member: any) => {
      if (!member.manager_id) {
        hierarchy.push({
          ...member,
          subordinates: [],
        });
      }
    });

    // Attach subordinates
    (members || []).forEach((member: any) => {
      if (member.manager_id) {
        const manager = membersMap.get(member.manager_id);
        if (manager) {
          const root = hierarchy.find((h: any) => h.id === manager.id);
          if (!root) {
            hierarchy.push({
              ...manager,
              subordinates: [member],
            });
          } else {
            if (!root.subordinates) root.subordinates = [];
            root.subordinates.push(member);
          }
        }
      }
    });

    return jsonResponse({
      data: hierarchy,
      count: members?.length || 0,
    });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
