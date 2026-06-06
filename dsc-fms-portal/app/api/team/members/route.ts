/// <reference lib="dom" />
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/team/auth';
import { CreateTeamMemberRequest, UpdateTeamMemberRequest } from '@/lib/types/team-dashboard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
const CreateMemberSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'role is required').optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  start_date: z.string().date().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
});

const UpdateMemberSchema = CreateMemberSchema.partial();

// GET /api/team/members - List all team members with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100);
    const offset = (page - 1) * limit;

    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    let query = supabase
      .from('team_members')
      .select('*', { count: 'exact' });

    if (department) {
      query = query.eq('department', department);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/team/members - Create a new team member
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
    const validated = CreateMemberSchema.parse(body);

    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        ...validated,
        active: true,
      }])
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      );
    }

    const response = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
