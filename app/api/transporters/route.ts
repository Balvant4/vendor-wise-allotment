import { withErrorHandler, apiSuccess, apiError, apiPaginated, AppError } from '@/lib/api-response';
import { verifyAccessToken, getTokenFromRequest, can } from '@/lib/auth';
import connectDB from '@/database/connection';
import TransporterMaster from '@/models/TransporterMaster';
import { remapTransporter } from '@/features/uploads/services/upload.service';
import mongoose from 'mongoose';

// GET /api/transporters
export const GET = withErrorHandler(async (req: Request) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  verifyAccessToken(token);

  await connectDB();

  const url    = new URL(req.url);
  const page   = Math.max(1, Number(url.searchParams.get('page'))  || 1);
  const limit  = Math.min(100, Number(url.searchParams.get('limit')) || 50);
  const skip   = (page - 1) * limit;
  const search = url.searchParams.get('search') ?? '';
  const isFix  = url.searchParams.get('isFix');
  const needsReview = url.searchParams.get('needsReview');
  const deletedOnly  = url.searchParams.get('deletedOnly') === 'true';

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { originalName: new RegExp(search, 'i') },
      { standardName: new RegExp(search, 'i') },
    ];
  }
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
    return apiPaginated(data, { total, page, limit, totalPages: Math.ceil(total / limit) });
  }

  const [data, total] = await Promise.all([
    TransporterMaster.find(filter).sort({ needsReview: -1, standardName: 1, originalName: 1 }).skip(skip).limit(limit).lean(),
    TransporterMaster.countDocuments(filter),
  ]);

  return apiPaginated(data, { total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/transporters — add new mapping + auto remap existing records
export const POST = withErrorHandler(async (req: Request) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  const decoded = verifyAccessToken(token);

  if (!can('VIEW_USERS', decoded.role)) {
    throw new AppError('Only admin and manager can manage transporters', 403, 'FORBIDDEN');
  }

  await connectDB();

  const body = await req.json();
  const { originalName, standardName, isFix } = body;

  if (!originalName || !standardName) {
    throw new AppError('Original name and standard name are required', 400, 'VALIDATION_ERROR');
  }

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