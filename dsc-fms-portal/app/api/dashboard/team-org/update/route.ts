import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UpdateOrgSchema = z.object({
  member_id: z.string().uuid(),
  role: z.string().optional(),
  department: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
});

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

// POST /api/dashboard/team-org/update - Update member organization details
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const validated = UpdateOrgSchema.parse(body);

    const { data, error } = await supabase
      .from('team_members')
      .update({
        role: validated.role,
        department: validated.department,
        manager_id: validated.manager_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.member_id)
      .select();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ data: data?.[0] }, 200);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        { error: 'Validation error', details: error.issues },
        400
      );
    }
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
