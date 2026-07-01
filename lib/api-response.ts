import { NextResponse } from 'next/server';
import type { PaginationMeta } from '@/types';

export function apiSuccess<T>(data: T, message?: string, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function apiError(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ success: false, message, code }, { status });
}

export function apiPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  status = 200
): NextResponse {
  return NextResponse.json({ success: true, data, pagination }, { status });
}

// ─── AppError class for service layer ────────────────────────────────────────
export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ─── Route error handler wrapper ──────────────────────────────────────────────
// ─── Route error handler wrapper ──────────────────────────────────────────────
export function withErrorHandler<Ctx = { params?: Record<string, string> }>(
  handler: (req: Request, ctx: Ctx) => Promise<NextResponse>
) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return apiError(err.message, err.status, err.code);
      }
      if (err && typeof err === 'object' && 'status' in err) {
        const e = err as { message: string; status: number; code?: string };
        return apiError(e.message, e.status, e.code);
      }
      console.error('[API Error]', err);
      return apiError('Internal server error', 500);
    }
  };
}
