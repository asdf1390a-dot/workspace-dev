import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/team/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UpsertStructureSchema = z.object({
  member_id: z.string().min(1, 'member_id is required'),
  reports_to_id: z.string().optional().nullable(),
  position_level: z.number().int().min(0).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('team_structure')
      .select('*, team_members:member_id(id, name, email, role)');

    if (error) throw error;

    const flat = data || [];
    const tree = buildTree(flat);

    return NextResponse.json({ success: true, data: { tree, flat } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.reason || 'unauthorized' },
      { status: 401 }
    );
  }

  try {
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

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
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
