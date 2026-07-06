import { withErrorHandler, apiSuccess, apiPaginated, AppError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import TransporterMaster from '@/models/TransporterMaster';
import { remapTransporter } from '@/features/uploads/services/upload.service';
import { buildSearchMatch } from '@/lib/utils';
import { parsePagination, toPaginationMeta } from '@/lib/pagination';
import { createTransporterSchema } from '@/server/validations/transporter.validation';
import mongoose from 'mongoose';

// GET /api/transporters — gated: this is admin/manager configuration data,
// and the page that calls it (/settings/transporters) is already protected
// at the route level in middleware.ts. Keeping the API gated too means a
// guest can never see this even via a direct API call.
export const GET = withErrorHandler(async (req: Request) => {
  requireAuth(req, 'VIEW_USERS');

  await connectDB();

  const url = new URL(req.url);
  const pagination = parsePagination(url, { defaultLimit: 50, maxLimit: 100 });
  const { page, limit, skip } = pagination;

  const search = url.searchParams.get('search') ?? '';
  const isFix  = url.searchParams.get('isFix');
  const needsReview = url.searchParams.get('needsReview');
  const deletedOnly  = url.searchParams.get('deletedOnly') === 'true';

  const filter: Record<string, unknown> = {};
  const searchMatch = buildSearchMatch(search, ['originalName', 'standardName'], []);
  if (searchMatch) filter.$or = searchMatch.$or;
  if (isFix === 'true')  filter.isFix = true;
  if (isFix === 'false') filter.isFix = false;
  if (needsReview === 'true') filter.needsReview = true;

  // Deleted items view — bypass the model's soft-delete pre-find filter
  // by querying the raw collection directly
  if (deletedOnly) {
    const rawFilter = { ...filter, isDeleted: true };
    const [data, total] = await Promise.all([
      TransporterMaster.collection
        .find(rawFilter)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      TransporterMaster.collection.countDocuments(rawFilter),
    ]);
    return apiPaginated(data, toPaginationMeta(total, pagination));
  }

  const [data, total] = await Promise.all([
    TransporterMaster.find(filter).sort({ needsReview: -1, standardName: 1, originalName: 1 }).skip(skip).limit(limit).lean(),
    TransporterMaster.countDocuments(filter),
  ]);

  return apiPaginated(data, toPaginationMeta(total, pagination));
});

// POST /api/transporters — gated, add new mapping + auto remap existing records
export const POST = withErrorHandler(async (req: Request) => {
  const decoded = requireAuth(req, 'VIEW_USERS');

  await connectDB();

  const body = await req.json();
  const parsed = createTransporterSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR');
  }
  const { originalName, standardName, isFix } = parsed.data;

  // Check duplicate
  const exists = await TransporterMaster.findOne({
    originalName: originalName.trim().toUpperCase(),
  });
  if (exists) {
    throw new AppError(`"${originalName.toUpperCase()}" already exists in master`, 409, 'DUPLICATE');
  }

  // Save to master
  const transporter = await TransporterMaster.create({
    originalName: originalName.trim().toUpperCase(),
    standardName: standardName.trim().toUpperCase(),
    isFix:        isFix === true || isFix === 'true',
    createdBy:    new mongoose.Types.ObjectId(decoded.id),
  });

  // Auto remap all existing vehicle records with this raw name
  const updatedCount = await remapTransporter(
    originalName,
    standardName,
    isFix === true || isFix === 'true'
  );

  return apiSuccess(
    { transporter, updatedRecords: updatedCount },
    updatedCount > 0
      ? `Mapping added and ${updatedCount} existing records updated automatically`
      : 'Mapping added successfully',
    201
  );
});