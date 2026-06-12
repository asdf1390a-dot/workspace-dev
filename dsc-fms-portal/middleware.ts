import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // 모든 동적 페이지에 no-cache 헤더 설정
  if (pathname.startsWith('/assets') || pathname.startsWith('/cost-budget') || pathname.startsWith('/productivity')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '-1');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/assets/:path*', '/cost-budget/:path*', '/productivity/:path*'],
};
