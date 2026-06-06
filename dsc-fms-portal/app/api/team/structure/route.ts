import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UpsertStructureSchema = z.object({
  member_id: z.string().uuid(),
  reports_to_id: z.string().uuid().optional().nullable(),
  position_level: z.number().int().min(0).optional(),
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
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('team_structure')
      .select('*, team_members:member_id(id, name, email, role)');

    if (error) {
      return jsonResponse(
        { error: error.message, code: error.code },
        400
      );
    }

    // Build tree structure
    const flat = data || [];
    const tree = buildTree(flat);

    return jsonResponse({ data: { tree, flat } });
  } catch (error: any) {
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const validated = UpsertStructureSchema.parse(body);

    const { data, error } = await supabase
      .from('team_structure')
      .upsert([{
        member_id: validated.member_id,
        reports_to_id: validated.reports_to_id || null,
        position_level: validated.position_level || 0,
      }])
      .select();

    if (error) {
      return jsonResponse(
        { error: error.message, code: error.code },
        400
      );
    }

    return jsonResponse({ data: data[0] }, 201);
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

function buildTree(items: any[]): any {
  const map = new Map(items.map(i => [i.member_id, { ...i, children: [] }]));
  const roots: any[] = [];

  items.forEach((item) => {
    if (!item.reports_to_id) {
      roots.push(map.get(item.member_id));
    } else {
      const parent = map.get(item.reports_to_id);
      if (parent) parent.children.push(map.get(item.member_id));
    }
  });

  return roots;
}
