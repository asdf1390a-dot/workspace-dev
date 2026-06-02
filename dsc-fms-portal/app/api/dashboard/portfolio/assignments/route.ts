import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CreateAssignmentSchema = z.object({
  member_id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
  role: z.enum(['lead', 'contributor', 'reviewer']),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
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

// GET /api/dashboard/portfolio/assignments - List assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get('member_id');
    const portfolio_id = searchParams.get('portfolio_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('portfolio_assignments')
      .select('*', { count: 'exact' });

    if (member_id) {
      query = query.eq('member_id', member_id);
    }
    if (portfolio_id) {
      query = query.eq('portfolio_id', portfolio_id);
    }

    const { data, error, count } = await query
      .order('start_date', { ascending: false })
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

// POST /api/dashboard/portfolio/assignments - Create assignment
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const validated = CreateAssignmentSchema.parse(body);

    const { data, error } = await supabase
      .from('portfolio_assignments')
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
