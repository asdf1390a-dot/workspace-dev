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

function getCurrentUserId(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtSecret) as any;
    return decoded.sub || null;
  } catch {
    return null;
  }
}

// GET /api/dashboard/team-org/structure - Get organization structure
export async function GET() {
  try {
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, name, role, department, manager_id, active')
      .eq('active', true)
      .order('department');

    if (membersError) {
      return jsonResponse(
        { error: membersError.message },
        400
      );
    }

    // Group by department
    const structure: Record<string, any> = {};
    (members || []).forEach((member: any) => {
      if (!structure[member.department]) {
        structure[member.department] = [];
      }
      structure[member.department].push({
        id: member.id,
        name: member.name,
        role: member.role,
        manager_id: member.manager_id,
      });
    });

    return jsonResponse({
      data: structure,
      count: members?.length || 0,
    });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
