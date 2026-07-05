import { withErrorHandler, apiSuccess } from '@/lib/api-response';
import { optionalAuth } from '@/lib/auth';
import { currentMonthService } from '@/server/services/current-month.service';
import type { DashboardFilters } from '@/types';

function parseFilters(url: URL): DashboardFilters {
  const f: DashboardFilters = {};
  const p = url.searchParams;
  if (p.get('year'))        f.year        = p.get('year')!;
  if (p.get('month'))       f.month       = p.get('month')!;
  if (p.get('division'))    f.division    = p.get('division')!;
  if (p.get('transporter')) f.transporter = p.get('transporter')!;
  if (p.get('isFix'))       f.isFix       = p.get('isFix')!;
  if (p.get('dateFrom'))    f.dateFrom    = p.get('dateFrom')!;
  if (p.get('dateTo'))      f.dateTo      = p.get('dateTo')!;
  if (p.get('dateField'))   f.dateField   = p.get('dateField') as DashboardFilters['dateField'];
  if (p.get('search'))      f.search      = p.get('search')!;
  return f;
}

// GET /api/current-month?type=insights
// Public read access — same reasoning as /api/dashboard: this only ever
// exposes aggregate counts/top-N lists, never individual records.
export const GET = withErrorHandler(async (req: Request) => {
  optionalAuth(req);

  const url    = new URL(req.url);
  const type   = url.searchParams.get('type') ?? 'insights';
  const filters = parseFilters(url);

  switch (type) {
    case 'insights':
    default:
      return apiSuccess(await currentMonthService.getInsights(filters));
  }
});