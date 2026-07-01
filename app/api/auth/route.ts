import { NextResponse } from 'next/server';
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response';
import { authService } from '@/server/services/auth.service';
import { loginSchema } from '@/server/validations/auth.validation';

const ACCESS_TOKEN_MAX_AGE  = 15 * 60;          // 15 minutes — matches JWT_EXPIRES_IN default
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days — matches JWT_REFRESH_EXPIRES_IN default

// Copies Set-Cookie headers from a response that has cookies set on it (`source`)
// onto a fresh apiSuccess() response (`target`). Needed because the cookie-setting
// helpers in auth.service.ts operate on a NextResponse instance the route doesn't
// directly return — so we transplant the cookies onto the actual response we send.
function withCopiedCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((c) => {
    target.cookies.set(c.name, c.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: c.name === 'accessToken' ? ACCESS_TOKEN_MAX_AGE : REFRESH_TOKEN_MAX_AGE,
    });
  });
  return target;
}

// POST /api/auth — login (default), or ?action=logout / ?action=refresh
export const POST = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    const cookieCarrier = NextResponse.json({});
    await authService.logout(req, cookieCarrier);
    return withCopiedCookies(cookieCarrier, apiSuccess({}, 'Logged out successfully'));
  }

  if (action === 'refresh') {
    const cookieCarrier = NextResponse.json({});
    const user = await authService.refresh(req, cookieCarrier);
    return withCopiedCookies(cookieCarrier, apiSuccess({ user }, 'Token refreshed'));
  }

  // Default: login
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR');
  }

  const cookieCarrier = NextResponse.json({});
  const user = await authService.login(parsed.data.email, parsed.data.password, cookieCarrier);

  return withCopiedCookies(cookieCarrier, apiSuccess({ user }, 'Login successful'));
});

// GET /api/auth — current user, or null if not authenticated.
// Returns 200 with { user: null } for guests — never 401.
// This prevents the axios refresh interceptor from firing on every public page load.
export const GET = withErrorHandler(async (req: Request) => {
  const user = await authService.getMe(req);
  return apiSuccess({ user });
});
