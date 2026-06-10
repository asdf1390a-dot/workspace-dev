// Universal health endpoint — works with both Pages Router and App Router in Vercel
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Supabase connectivity test
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabaseOk = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { apikey: supabaseKey },
          signal: AbortSignal.timeout(5000),
        });
        supabaseOk = res.ok;
      } catch {
        supabaseOk = false;
      }
    }

    return NextResponse.json(
      {
        status: supabaseOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          supabase: supabaseOk ? 'ok' : 'failed',
        },
      },
      { status: supabaseOk ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
