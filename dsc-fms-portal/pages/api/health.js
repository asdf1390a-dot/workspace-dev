export default async function handler(req, res) {
  try {
    const startTime = Date.now();
    
    // Supabase 연결 테스트
    const supabaseHealth = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      }
    ).then(() => true).catch(() => false);

    const duration = Date.now() - startTime;

    res.status(200).json({
      status: supabaseHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        supabase: supabaseHealth ? 'ok' : 'failed',
      },
      responseTime: duration,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
