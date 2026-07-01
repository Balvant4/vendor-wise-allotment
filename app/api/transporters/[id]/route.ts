import { withErrorHandler, apiSuccess, AppError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import TransporterMaster from '@/models/TransporterMaster';
import { remapTransporter } from '@/features/uploads/services/upload.service';
import mongoose from 'mongoose';

// PATCH /api/transporters/:id — gated, edit + auto remap
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const decoded = requireAuth(req, 'VIEW_USERS');

  await connectDB();

  const body = await req.json();
  const { originalName, standardName, isFix, isActive } = body;

  // Check conflict
  if (originalName) {
    const conflict = await TransporterMaster.findOne({
      originalName: originalName.trim().toUpperCase(),
      _id: { $ne: new mongoose.Types.ObjectId(params.id) },
    });
    if (conflict) {
      throw new AppError(`"${originalName.toUpperCase()}" already exists in master`, 409, 'DUPLICATE');
    }
  }

  const updated = await TransporterMaster.findByIdAndUpdate(
    params.id,
    {
      ...(originalName  !== undefined && { originalName: originalName.trim().toUpperCase() }),
      ...(standardName  !== undefined && { standardName: standardName.trim().toUpperCase() }),
      ...(isFix         !== undefined && { isFix: isFix === true || isFix === 'true' }),
      ...(isActive      !== undefined && { isActive }),
      needsReview: false, // editing it = admin has reviewed it
      updatedBy: new mongoose.Types.ObjectId(decoded.id),
    },
    { new: true, runValidators: true }
  );

  if (!updated) throw new AppError('Transporter mapping not found', 404);

  // Auto remap all existing records with this original name
  const updatedCount = await remapTransporter(
    updated.originalName,
    updated.standardName,
    updated.isFix
  );

  return apiSuccess(
    { transporter: updated, updatedRecords: updatedCount },
    updatedCount > 0
      ? `Updated and ${updatedCount} records remapped automatically`
      : 'Updated successfully'
  );
});

// DELETE /api/transporters/:id — gated
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const decoded = requireAuth(req, 'VIEW_USERS');

  await connectDB();

  const record = await TransporterMaster.findById(params.id);
  if (!record) throw new AppError('Transporter mapping not found', 404);

  record.isDeleted = true;
  record.deletedAt = new Date();
  (record as unknown as Record<string, unknown>).updatedBy = new mongoose.Types.ObjectId(decoded.id);
  await record.save();

  return apiSuccess({}, 'Transporter mapping deleted');
});

// PUT /api/transporters/:id — gated, restore a soft-deleted mapping
export const PUT = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const decoded = requireAuth(req, 'VIEW_USERS');

  await connectDB();

  // The model has a pre-find filter that hides soft-deleted docs,
  // so we query the raw MongoDB collection directly to find it
  const raw = await TransporterMaster.collection.findOne({ _id: new mongoose.Types.ObjectId(params.id) });
  if (!raw) throw new AppError('Transporter mapping not found', 404);

  // Check no active mapping already uses this originalName
  const conflict = await TransporterMaster.findOne({
    originalName: raw.originalName,
    _id: { $ne: new mongoose.Types.ObjectId(params.id) },
  });
  if (conflict) {
    throw new AppError(`Cannot restore — "${raw.originalName}" is already mapped by another active entry`, 409, 'DUPLICATE');
  }

  await TransporterMaster.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(params.id) },
    {
      $set: {
        isDeleted: false,
        updatedBy: new mongoose.Types.ObjectId(decoded.id),
      },
      $unset: { deletedAt: '' },
    }
  );

  const restored = await TransporterMaster.findById(params.id);

  return apiSuccess(restored, 'Transporter mapping restored');
});
