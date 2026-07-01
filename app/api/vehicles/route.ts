import { withErrorHandler, apiPaginated } from '@/lib/api-response';
import { optionalAuth } from '@/lib/auth';
import { queryVehicles } from '@/server/queries/vehicle.queries';

// GET /api/vehicles — public read access, same reasoning as /api/dashboard
export const GET = withErrorHandler(async (req: Request) => {
  optionalAuth(req);

  const url = new URL(req.url);
  const p   = url.searchParams;

  const filters = {
    year:        p.get('year')        ?? undefined,
    month:       p.get('month')       ?? undefined,
    division:    p.get('division')    ?? undefined,
    transporter: p.get('transporter') ?? undefined,
    isFix:       p.get('isFix')       ?? undefined,
    isOver25h:   p.get('isOver25h')   ?? undefined,
    search:      p.get('search')      ?? undefined,
    page:        Number(p.get('page'))  || 1,
    limit:       Number(p.get('limit')) || 50,
    sortKey:     p.get('sortKey')     ?? undefined,
    sortDir:     (p.get('sortDir') as 'asc' | 'desc') ?? 'desc',
  };

  const { data, pagination } = await queryVehicles(filters);
  return apiPaginated(data, pagination);
});
