import { getSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_projects')
      .select(`
        *,
        company:user_companies(id, company_name, logo_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_name,
      company_id,
      role,
      description,
      tech_stack,
      start_date,
      end_date,
      status,
      impact,
      project_url,
    } = body;

    if (!project_name?.trim()) {
      return NextResponse.json(
        { error: '프로젝트명은 필수입니다' },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: '시작 날짜는 필수입니다' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_projects')
      .insert({
        user_id: user.id,
        project_name: project_name.trim(),
        company_id: company_id || null,
        role: role?.trim() || null,
        description: description?.trim() || null,
        tech_stack: Array.isArray(tech_stack) ? tech_stack : null,
        start_date,
        end_date: end_date || null,
        status: status || 'in_progress',
        impact: impact?.trim() || null,
        project_url: project_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}
