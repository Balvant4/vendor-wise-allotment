import connectDB from '@/database/connection';
import VehicleRecord from '@/models/VehicleRecord';
import { escapeRegex, buildSearchMatch } from '@/lib/utils';
import type { DashboardFilters } from '@/types';

// Kept as its own service (rather than tacked onto dashboard.service.ts)
// because these aggregations only exist for the Current Month page's extra
// cards — everything else on that page reuses dashboard.service.ts /
// vehicle.queries.ts as-is via the shared date-range filters.
//
// NOTE ON "completed / pending / delivery status":
// The data model has no explicit delivery-status field — it tracks gate/
// loading/weighment timestamps and a >25h detention flag. We define:
//   completed = both WLL Weigh IN and Weigh OUT are recorded (weighment done)
//   pending   = hasIncompleteData === true (still missing a weighment date)
// This is the same interpretation the rest of the app already uses for
// `hasIncompleteData` (see models/VehicleRecord.ts, upload.service.ts).

const DATE_FIELDS = new Set([
  'wllWeighIn', 'wllWeighOut', 'loadingStartTime', 'loadingEndTime', 'gateInDate', 'exciseOutDate',
]);

const SEARCH_TEXT_FIELDS = ['vehicleNo', 'containerNo', 'documentNumber', 'transporter', 'division', 'customerName'];
const SEARCH_DATE_FIELDS = ['gateInDate', 'exciseOutDate', 'loadingStartTime', 'loadingEndTime', 'wllWeighIn', 'wllWeighOut'];

// Deliberately duplicated from dashboard.service.ts / vehicle.queries.ts
// rather than shared — those two already duplicate this same helper, so
// this keeps the existing (if imperfect) convention rather than introducing
// a third pattern.
function buildMatch(filters: DashboardFilters = {}): Record<string, unknown> {
  const match: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (filters.year)        match.year = Number(filters.year);
  if (filters.month)       match.month = Number(filters.month);
  if (filters.division)    match.division = filters.division.toUpperCase();
  if (filters.transporter) match.transporter = new RegExp(escapeRegex(filters.transporter), 'i');
  if (filters.isFix !== undefined && filters.isFix !== '') {
    match.isFix = filters.isFix === 'true';
  }
  if (filters.dateFrom || filters.dateTo) {
    const field = filters.dateField && DATE_FIELDS.has(filters.dateField) ? filters.dateField : 'wllWeighIn';
    const dateRange: Record<string, Date> = {};
    const hasTime = (s: string) => s.includes('T');
    if (filters.dateFrom) {
      dateRange.$gte = hasTime(filters.dateFrom) ? new Date(filters.dateFrom) : new Date(`${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      dateRange.$lte = hasTime(filters.dateTo) ? new Date(filters.dateTo) : new Date(`${filters.dateTo}T23:59:59`);
    }
    match[field] = dateRange;
  }
  const searchMatch = buildSearchMatch(filters.search, SEARCH_TEXT_FIELDS, SEARCH_DATE_FIELDS);
  if (searchMatch) Object.assign(match, searchMatch);
  return match;
}

export interface MonthInsights {
  totalContainers: number;
  totalDocuments: number;
  totalCustomers: number;
  completed: number;
  pending: number;
  completionRate: number;
  /** Average minutes between loadingStartTime and loadingEndTime, where both exist. */
  avgLoadingMinutes: number;
  topCustomers: { customerName: string; count: number }[];
  topDestinations: { endCustName: string; count: number }[];
}

class CurrentMonthService {
  // Single aggregation ($facet) — one DB round trip for every extra card
  // this page needs, rather than five separate queries.
  async getInsights(filters: DashboardFilters = {}): Promise<MonthInsights> {
    await connectDB();
    const match = buildMatch(filters);

    const [result] = await VehicleRecord.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total:      { $sum: 1 },
                completed:  { $sum: { $cond: ['$hasIncompleteData', 0, 1] } },
                pending:    { $sum: { $cond: ['$hasIncompleteData', 1, 0] } },
                containers: { $addToSet: '$containerNo' },
                documents:  { $addToSet: '$documentNumber' },
                customers:  { $addToSet: '$customerName' },
                avgLoadingMinutes: {
                  $avg: {
                    $cond: [
                      { $and: ['$loadingStartTime', '$loadingEndTime'] },
                      { $divide: [{ $subtract: ['$loadingEndTime', '$loadingStartTime'] }, 60000] },
                      null,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1, completed: 1, pending: 1,
                totalContainers: { $size: '$containers' },
                totalDocuments:  { $size: '$documents' },
                totalCustomers:  { $size: '$customers' },
                avgLoadingMinutes: { $round: [{ $ifNull: ['$avgLoadingMinutes', 0] }, 1] },
              },
            },
          ],
          topCustomers: [
            { $match: { customerName: { $nin: ['', null] } } },
            { $group: { _id: '$customerName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, customerName: '$_id', count: 1 } },
          ],
          topDestinations: [
            { $match: { endCustName: { $nin: ['', null] } } },
            { $group: { _id: '$endCustName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, endCustName: '$_id', count: 1 } },
          ],
        },
      },
    ]);

    const totals = result?.totals?.[0] ?? {
      total: 0, completed: 0, pending: 0,
      totalContainers: 0, totalDocuments: 0, totalCustomers: 0, avgLoadingMinutes: 0,
    };

    return {
      totalContainers: totals.totalContainers,
      totalDocuments:  totals.totalDocuments,
      totalCustomers:  totals.totalCustomers,
      completed:       totals.completed,
      pending:         totals.pending,
      completionRate:  totals.total > 0 ? Math.round((totals.completed / totals.total) * 10000) / 100 : 0,
      avgLoadingMinutes: totals.avgLoadingMinutes,
      topCustomers:    result?.topCustomers ?? [],
      topDestinations: result?.topDestinations ?? [],
    };
  }
}

export const currentMonthService = new CurrentMonthService();