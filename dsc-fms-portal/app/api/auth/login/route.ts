import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!url || !anon) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다' },
        { status: 400 }
      );
    }

    const client = createClient(url, anon, {
      auth: { persistSession: false },
    });

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || '로그인 실패' },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: '세션 생성 실패' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: data.user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );

    response.cookies.set('supabase-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생' },
      { status: 500 }
    );
  }
}
