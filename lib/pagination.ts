import type { PaginationMeta } from '@/types';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationOptions {
  /** Used when the request omits ?limit or sends a non-numeric value. */
  defaultLimit?: number;
  /** Hard ceiling — protects the DB from a client requesting limit=999999. */
  maxLimit?: number;
}

/**
 * Parses page/limit query params into a consistent { page, limit, skip }
 * shape. Centralizes the clamping rules that used to be re-implemented
 * (with drifting defaults) in every list route.
 */
export function parsePagination(
  url: URL,
  { defaultLimit = 20, maxLimit = 100 }: PaginationOptions = {}
): PaginationParams {
  const rawPage  = Number(url.searchParams.get('page'));
  const rawLimit = Number(url.searchParams.get('limit'));

  const page  = Math.max(1, Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit)
  );

  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the { total, page, limit, totalPages } shape apiPaginated() expects. */
export function toPaginationMeta(total: number, { page, limit }: PaginationParams): PaginationMeta {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
