import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function applySecurityHeaders(res: NextResponse) {
  // Conservative defaults for authenticated pages; kept permissive to avoid breakage
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https:",
      "font-src 'self' https: data:",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return res;
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', req.nextUrl.pathname);
    const res = NextResponse.redirect(url);
    return applySecurityHeaders(res);
  }
  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

export const config = {
  matcher: ['/profile', '/profile/:path*'],
};
