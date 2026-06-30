import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api-response';
import { authService } from '@/server/services/auth.service';
import { loginSchema } from '@/server/validations/auth.validation';

// POST /api/auth/login
export const POST = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    const res = apiSuccess({}, 'Logged out successfully');
    await authService.logout(req, res);
    return res;
  }

  if (action === 'refresh') {
    const res = apiSuccess({});
    const user = await authService.refresh(req, res);
    return apiSuccess({ user }, 'Token refreshed');
  }

  // Default: login
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR');
  }

  const res = NextResponse.json({});
  const user = await authService.login(parsed.data.email, parsed.data.password, res);

  // Build fresh response with cookies from the service-set response
  const finalRes = apiSuccess({ user }, 'Login successful');
  // Copy cookies
  res.cookies.getAll().forEach((c) => {
    finalRes.cookies.set(c.name, c.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: c.name === 'accessToken' ? 15 * 60 : 7 * 24 * 60 * 60,
    });
  });
  return finalRes;
});

// GET /api/auth/me
export const GET = withErrorHandler(async (req: Request) => {
  const user = await authService.getMe(req);
  return apiSuccess({ user });
});
