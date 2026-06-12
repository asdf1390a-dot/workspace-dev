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

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    const client = createClient(url, anon, {
      auth: { persistSession: false },
    });

    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || '가입 실패' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: '사용자 생성 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다. 이메일 확인 링크를 확인해주세요.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생' },
      { status: 500 }
    );
  }
}
