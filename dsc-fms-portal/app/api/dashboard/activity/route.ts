import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CreateActivitySchema = z.object({
  member_id: z.string().uuid(),
  action_type: z.enum(['created', 'updated', 'completed', 'commented', 'joined', 'left']),
  subject: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
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

// GET /api/dashboard/activity - List activity log
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action_type = searchParams.get('action_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('activity_log')
      .select('*', { count: 'exact' });

    if (action_type) {
      query = query.eq('action_type', action_type);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
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

// POST /api/dashboard/activity - Log activity
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const validated = CreateActivitySchema.parse(body);

    const { data, error } = await supabase
      .from('activity_log')
      .insert([{
        ...validated,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ data: data?.[0] }, 201);
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
