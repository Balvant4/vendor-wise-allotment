import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require a logged-in user to even load the page.
// Everything NOT in this list is public — visitors can browse without an account.
// (Server actions / API mutations still enforce their own permission checks —
// this list only controls whether the PAGE itself redirects to /login.)
const PROTECTED_PAGE_PREFIXES = [
  '/upload',
  '/settings',  // covers /settings (profile), /settings/users, /settings/transporters
];

const AUTH_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files — APIs handle their own auth per-route
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // No token on a protected page → redirect to login
  if (!accessToken && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Valid token on the login page → no need to log in again, go to dashboard
  if (accessToken && isAuthRoute) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(accessToken, secret);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Token invalid/expired — let them visit login, and clear the dead cookie
      const response = NextResponse.next();
      response.cookies.delete('accessToken');
      return response;
    }
  }

  // Protected page with a token present — verify it before letting them through
  if (accessToken && isProtectedPage) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(accessToken, secret);
    } catch {
      // Expired/invalid — send to login; the axios interceptor will have already
      // tried a silent refresh for API calls, but a full page load needs this.
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete('accessToken');
      return response;
    }
  }

  // Everything else (dashboard, vehicles, alerts, division, vendors, settings,
  // home) is public — visitors browse freely, individual actions are gated
  // by the AuthProvider's `can()` checks and by each API route's own guard.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
