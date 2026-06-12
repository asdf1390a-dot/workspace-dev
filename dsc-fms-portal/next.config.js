const nextConfig = {
  async headers() {
    return [
      {
        source: '/assets(/.*)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '-1',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'X-Accel-Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/cost-budget(/.*)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
          },
        ],
      },
      {
        source: '/productivity(/.*)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
          },
        ],
      },
      {
        source: '/api(/.*)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, s-maxage=0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://discord.com https://discordapp.com https://cdn.discordapp.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
// Force redeploy - rebuild .next directory [2026-06-12T17:15:00Z]
