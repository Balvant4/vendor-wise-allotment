import connectDB from '@/database/connection';
import VehicleRecord from '@/models/VehicleRecord';
import type {
  DashboardFilters,
  DashboardKPIs,
  MonthlyTrend,
  DailyTrend,
  DivisionStats,
  TransporterStats,
  DashboardOverview,
  VehicleRecord as VehicleRecordType,
} from '@/types';

function buildMatch(filters: DashboardFilters = {}): Record<string, unknown> {
  const match: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (filters.year)        match.year = Number(filters.year);
  if (filters.month)       match.month = Number(filters.month);
  if (filters.division)    match.division = filters.division.toUpperCase();
  if (filters.transporter) match.transporter = new RegExp(filters.transporter, 'i');
  if (filters.isFix !== undefined && filters.isFix !== '') {
    match.isFix = filters.isFix === 'true';
  }
  if (filters.dateFrom || filters.dateTo) {
    const dateRange: Record<string, Date> = {};
    if (filters.dateFrom) dateRange.$gte = new Date(filters.dateFrom);
    if (filters.dateTo)   dateRange.$lte = new Date(filters.dateTo + 'T23:59:59');
    match.reportingDate = dateRange;
  }
  return match;
}

class DashboardService {
  async getKPIs(filters: DashboardFilters = {}): Promise<DashboardKPIs> {
    await connectDB();
    const match = buildMatch(filters);

    const [result] = await VehicleRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total:          { $sum: 1 },
          over25:         { $sum: { $cond: ['$isOver25h', 1, 0] } },
          fixLoads:       { $sum: { $cond: ['$isFix', 1, 0] } },
          avgHours:       { $avg: '$diffHours' },
          maxHours:       { $max: '$diffHours' },
          uniqueVehicles: { $addToSet: '$vehicleNo' },
          uniqueTrans:    { $addToSet: '$transporter' },
          uniqueDivs:     { $addToSet: '$division' },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1, over25: 1, fixLoads: 1,
          nonFixLoads: { $subtract: ['$total', '$fixLoads'] },
          avgHours:    { $round: ['$avgHours', 2] },
          maxHours:    { $round: ['$maxHours', 2] },
          uniqueVehicles:     { $size: '$uniqueVehicles' },
          uniqueTransporters: { $size: '$uniqueTrans' },
          uniqueDivisions:    { $size: '$uniqueDivs' },
          violationRate: {
            $cond: [
              { $eq: ['$total', 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ['$over25', '$total'] }, 100] }, 2] },
            ],
          },
        },
      },
    ]);

    return result ?? {
      total: 0, over25: 0, fixLoads: 0, nonFixLoads: 0,
      avgHours: 0, maxHours: 0, uniqueVehicles: 0,
      uniqueTransporters: 0, uniqueDivisions: 0, violationRate: 0,
    };
  }

  async getMonthlyTrend(filters: DashboardFilters = {}): Promise<MonthlyTrend[]> {
    await connectDB();
    return VehicleRecord.aggregate([
      { $match: buildMatch(filters) },
      { $group: { _id: { year: '$year', month: '$month' }, count: { $sum: 1 }, over25: { $sum: { $cond: ['$isOver25h', 1, 0] } } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', count: 1, over25: 1 } },
    ]);
  }

  async getDailyTrend(filters: DashboardFilters = {}, days = 30): Promise<DailyTrend[]> {
    await connectDB();
    const match = buildMatch(filters);
    const since = new Date();
    since.setDate(since.getDate() - days);
    match.reportingDate = { ...(match.reportingDate as object ?? {}), $gte: since };

    return VehicleRecord.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportingDate' } }, count: { $sum: 1 }, over25: { $sum: { $cond: ['$isOver25h', 1, 0] } } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1, over25: 1 } },
    ]);
  }

  async getByDivision(filters: DashboardFilters = {}): Promise<DivisionStats[]> {
    await connectDB();
    return VehicleRecord.aggregate([
      { $match: buildMatch(filters) },
      { $group: { _id: '$division', total: { $sum: 1 }, fix: { $sum: { $cond: ['$isFix', 1, 0] } }, over25: { $sum: { $cond: ['$isOver25h', 1, 0] } }, avgHours: { $avg: '$diffHours' } } },
      { $project: { _id: 0, division: '$_id', total: 1, fix: 1, nonFix: { $subtract: ['$total', '$fix'] }, over25: 1, avgHours: { $round: ['$avgHours', 2] }, violationRate: { $round: [{ $multiply: [{ $divide: ['$over25', { $max: ['$total', 1] }] }, 100] }, 2] } } },
      { $sort: { total: -1 } },
    ]);
  }

  async getByTransporter(filters: DashboardFilters = {}): Promise<TransporterStats[]> {
    await connectDB();
    return VehicleRecord.aggregate([
      { $match: buildMatch(filters) },
      { $group: { _id: '$transporter', total: { $sum: 1 }, fix: { $sum: { $cond: ['$isFix', 1, 0] } }, over25: { $sum: { $cond: ['$isOver25h', 1, 0] } }, avgHours: { $avg: '$diffHours' }, maxHours: { $max: '$diffHours' } } },
      { $project: { _id: 0, transporter: '$_id', total: 1, fix: 1, over25: 1, avgHours: { $round: ['$avgHours', 2] }, maxHours: { $round: ['$maxHours', 2] }, violationRate: { $round: [{ $multiply: [{ $divide: ['$over25', { $max: ['$total', 1] }] }, 100] }, 2] } } },
      { $sort: { total: -1 } },
    ]);
  }

  async getAlerts(filters: DashboardFilters = {}): Promise<VehicleRecordType[]> {
    await connectDB();
    const match = { ...buildMatch(filters), isOver25h: true };
    return VehicleRecord.find(match).sort({ diffHours: -1 }).limit(500).lean() as unknown as VehicleRecordType[];
  }

  async getFullOverview(filters: DashboardFilters = {}): Promise<DashboardOverview> {
    await connectDB();
    const [kpis, monthly, daily, byDivision, byTransporter, byDayOfWeek] = await Promise.all([
      this.getKPIs(filters),
      this.getMonthlyTrend(filters),
      this.getDailyTrend(filters),
      this.getByDivision(filters),
      this.getByTransporter(filters),
      VehicleRecord.aggregate([
        { $match: buildMatch(filters) },
        { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, dayOfWeek: '$_id', count: 1 } },
      ]),
    ]);
    return { kpis, monthly, daily, byDivision, byTransporter, byDayOfWeek };
  }

  async getFilterOptions(): Promise<Record<string, unknown[]>> {
    await connectDB();
    const [years, months, divisions, transporters] = await Promise.all([
      VehicleRecord.distinct('year', { isDeleted: { $ne: true } }),
      VehicleRecord.distinct('month', { isDeleted: { $ne: true } }),
      VehicleRecord.distinct('division', { isDeleted: { $ne: true } }),
      VehicleRecord.distinct('transporter', { isDeleted: { $ne: true } }),
    ]);
    return {
      years: (years as number[]).sort((a, b) => a - b),
      months: (months as number[]).sort((a, b) => a - b),
      divisions: (divisions as string[]).sort(),
      transporters: (transporters as string[]).sort(),
    };
  }
}

export const dashboardService = new DashboardService();
