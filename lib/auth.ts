import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { JwtPayload, UserRole } from '@/types';

const JWT_SECRET         = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Token generation ─────────────────────────────────────────────────────────
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

// ─── Token verification ───────────────────────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw { message: 'Access token expired', code: 'TOKEN_EXPIRED', status: 401 };
    }
    throw { message: 'Invalid access token', code: 'TOKEN_INVALID', status: 401 };
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw { message: 'Refresh token expired, please login again', code: 'REFRESH_EXPIRED', status: 401 };
    }
    throw { message: 'Invalid refresh token', code: 'REFRESH_INVALID', status: 401 };
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────
export function setCookies(res: NextResponse, accessToken: string, refreshToken: string): void {
  res.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    maxAge:   15 * 60,
    path:     '/',
  });
  res.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60,
    path:     '/',
  });
}

export function clearCookies(res: NextResponse): void {
  res.cookies.delete('accessToken');
  res.cookies.delete('refreshToken');
}

// ─── Server component auth ────────────────────────────────────────────────────
export async function getServerUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ─── Route handler auth ───────────────────────────────────────────────────────
export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/accessToken=([^;]+)/);
  return match?.[1] ?? null;
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/refreshToken=([^;]+)/);
  return match?.[1] ?? null;
}

// ─── Permission checks ────────────────────────────────────────────────────────
import { PERMISSIONS } from '@/types';

export function can(permission: keyof typeof PERMISSIONS, role: UserRole): boolean {
  return (PERMISSIONS[permission] as UserRole[]).includes(role);
}

export function isRole(role: UserRole, ...roles: UserRole[]): boolean {
  return roles.includes(role);
}

// ─── Unified auth guard for Route Handlers ────────────────────────────────────
// Throws an AppError-shaped object (status/code/message) that withErrorHandler
// in lib/api-response.ts already knows how to convert into the right HTTP response.
// Use this instead of repeating "get token -> verify -> check permission" in
// every single route file.
export function requireAuth(req: Request, permission?: keyof typeof PERMISSIONS): JwtPayload {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw { message: 'Authentication required', status: 401, code: 'NO_TOKEN' };
  }

  const decoded = verifyAccessToken(token); // throws TOKEN_EXPIRED / TOKEN_INVALID itself

  if (permission && !can(permission, decoded.role)) {
    throw { message: 'Insufficient permissions', status: 403, code: 'FORBIDDEN' };
  }

  return decoded;
}

// Returns the decoded user if a valid token is present, or null otherwise —
// never throws. Use this on routes that should work for logged-out visitors
// but want to personalize behavior when a user IS logged in.
export function optionalAuth(req: Request): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
