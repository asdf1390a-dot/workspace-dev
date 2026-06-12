import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    env_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    env_supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || 'local',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    status: 'ok',
    message: '인증 시스템 상태 확인',
    checks,
    ok: checks.env_supabase_url && checks.env_supabase_anon_key,
  });
}
