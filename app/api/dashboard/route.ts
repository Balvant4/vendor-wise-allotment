import { withErrorHandler, apiSuccess, apiError } from '@/lib/api-response';
import { dashboardService } from '@/server/services/dashboard.service';
import { verifyAccessToken, getTokenFromRequest } from '@/lib/auth';
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
  if (p.get('search'))      f.search      = p.get('search')!;
  return f;
}

// GET /api/dashboard?type=overview|kpis|alerts|filter-options
export const GET = withErrorHandler(async (req: Request) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  verifyAccessToken(token); // throws on invalid

  const url    = new URL(req.url);
  const type   = url.searchParams.get('type') ?? 'overview';
  const filters = parseFilters(url);

  switch (type) {
    case 'kpis':
      return apiSuccess(await dashboardService.getKPIs(filters));
    case 'monthly':
      return apiSuccess(await dashboardService.getMonthlyTrend(filters));
    case 'daily':
      return apiSuccess(await dashboardService.getDailyTrend(filters, Number(url.searchParams.get('days')) || 30));
    case 'division':
      return apiSuccess(await dashboardService.getByDivision(filters));
    case 'transporter':
      return apiSuccess(await dashboardService.getByTransporter(filters));
    case 'alerts':
      return apiSuccess(await dashboardService.getAlerts(filters));
    case 'filter-options':
      return apiSuccess(await dashboardService.getFilterOptions());
    default:
      return apiSuccess(await dashboardService.getFullOverview(filters));
  }
});
