import connectDB from '@/database/connection';
import VehicleRecord, { IVehicleRecord } from '@/models/VehicleRecord';
import type { DashboardFilters } from '@/types';
import { escapeRegex } from '@/lib/utils';
import mongoose from 'mongoose';

const DATE_FIELDS = new Set([
  'wllWeighIn', 'wllWeighOut', 'loadingStartTime', 'loadingEndTime', 'gateInDate', 'exciseOutDate',
]);

function buildMatch(filters: DashboardFilters & { isOver25h?: string } = {}): Record<string, unknown> {
  const match: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (filters.year)        match.year = Number(filters.year);
  if (filters.month)       match.month = Number(filters.month);
  if (filters.division)    match.division = filters.division.toUpperCase();
  if (filters.transporter) match.transporter = new RegExp(escapeRegex(filters.transporter), 'i');
  if (filters.isFix)       match.isFix = filters.isFix === 'true';
  if (filters.isOver25h)   match.isOver25h = filters.isOver25h === 'true';
  if (filters.dateFrom || filters.dateTo) {
    const field = filters.dateField && DATE_FIELDS.has(filters.dateField) ? filters.dateField : 'wllWeighIn';
    const dateRange: Record<string, Date> = {};
    // Accept both date-only ('YYYY-MM-DD', from the old single-day picker)
    // and full datetime ('YYYY-MM-DDTHH:mm', from the new range+time picker).
    // Date-only strings have no time component, so we widen them to cover
    // the whole day; a value that already carries a time is used exactly
    // as given — this is what makes time-based filtering precise rather
    // than just date-bucketed.
    const hasTime = (s: string) => s.includes('T');
    if (filters.dateFrom) {
      dateRange.$gte = hasTime(filters.dateFrom) ? new Date(filters.dateFrom) : new Date(`${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      dateRange.$lte = hasTime(filters.dateTo) ? new Date(filters.dateTo) : new Date(`${filters.dateTo}T23:59:59`);
    }
    match[field] = dateRange;
  }
  if (filters.search) {
    const safe = escapeRegex(filters.search);
    match.$or = [
      { vehicleNo: new RegExp(safe, 'i') },
      { containerNo: new RegExp(safe, 'i') },
      { documentNumber: new RegExp(safe, 'i') },
    ];
  }
  return match;
}

export interface VehicleQueryFilters extends DashboardFilters {
  isOver25h?: string;
  page?: number;
  limit?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

export async function queryVehicles(filters: VehicleQueryFilters = {}) {
  await connectDB();

  const match  = buildMatch(filters);
  const page   = Math.max(1, Number(filters.page) || 1);
  const limit  = Math.min(100, Number(filters.limit) || 50);
  const skip   = (page - 1) * limit;

  const allowedSort = ['vehicleNo', 'transporter', 'division', 'diffHours', 'wllWeighIn', 'wllWeighOut', 'loadingStartTime', 'loadingEndTime', 'gateInDate', 'createdAt'];
  const sortKey = allowedSort.includes(filters.sortKey ?? '') ? filters.sortKey! : 'wllWeighIn';
  const sortDir = filters.sortDir === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    VehicleRecord.find(match)
      .sort({ [sortKey]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    VehicleRecord.countDocuments(match),
  ]);

  return {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// Used for Excel export — no pagination, but capped so a runaway filter
// (e.g. no filters at all on a huge collection) can't take down the server.
const EXPORT_ROW_CAP = 20000;

export async function queryVehiclesForExport(filters: VehicleQueryFilters = {}) {
  await connectDB();
  const match = buildMatch(filters);

  const allowedSort = ['vehicleNo', 'transporter', 'division', 'diffHours', 'wllWeighIn', 'wllWeighOut', 'loadingStartTime', 'loadingEndTime', 'gateInDate', 'createdAt'];
  const sortKey = allowedSort.includes(filters.sortKey ?? '') ? filters.sortKey! : 'wllWeighIn';
  const sortDir = filters.sortDir === 'asc' ? 1 : -1;

  return VehicleRecord.find(match)
    .sort({ [sortKey]: sortDir })
    .limit(EXPORT_ROW_CAP)
    .lean();
}

export async function bulkUpsertVehicles(
  records: Partial<IVehicleRecord>[]
): Promise<{ inserted: number; duplicates: number }> {
  await connectDB();
  if (!records.length) return { inserted: 0, duplicates: 0 };

  const ops = records.map((r) => ({
    updateOne: {
      filter: { uniqueId: r.uniqueId },
      update: { $setOnInsert: r },
      upsert: true,
    },
  }));

  const result = await VehicleRecord.bulkWrite(ops, { ordered: false });
  const inserted = result.upsertedCount ?? 0;
  const duplicates = records.length - inserted;

  return { inserted, duplicates };
}

export async function softDeleteByUpload(
  uploadId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  await connectDB();
  await VehicleRecord.updateMany(
    { uploadId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } }
  );
}
