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

// GET /api/dashboard/team-org/members - Get team members with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('team_members')
      .select('id, name, email, role, department, avatar_url, active, start_date', { count: 'exact' });

    if (department) {
      query = query.eq('department', department);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query
      .eq('active', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({
      data,
      count,
      limit,
      offset,
    });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
