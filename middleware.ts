import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/login'];
const AUTH_ROUTES   = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // No token on protected route → redirect to login
  if (!accessToken && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Valid token on auth route (login page) → redirect to dashboard
  if (accessToken && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(accessToken, secret);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Token invalid/expired — let them visit login
      const response = NextResponse.next();
      response.cookies.delete('accessToken');
      return response;
    }
  }

  // Protected route with token — verify before proceeding
  if (accessToken && !isPublicRoute) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(accessToken, secret);
    } catch {
      // Expired — clear and send to login (client will try refresh first via axios interceptor)
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('accessToken');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
