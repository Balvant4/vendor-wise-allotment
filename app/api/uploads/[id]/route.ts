import { withErrorHandler, apiSuccess, AppError } from '@/lib/api-response';
import { requireAuth, optionalAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import Upload from '@/models/Upload';
import VehicleRecord from '@/models/VehicleRecord';
import TransporterMaster from '@/models/TransporterMaster';

// DELETE /api/uploads/:id — gated: must be admin (permanently deletes data)
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  requireAuth(req, 'DELETE_UPLOADS');

  await connectDB();
  const upload = await Upload.findById(params.id);
  if (!upload) throw new AppError('Upload not found', 404);

  // Step 1 — Find which unique transporters exist in this upload BEFORE deleting
  // We need this list to check afterwards which ones became orphaned
  const transportersInUpload: string[] = await VehicleRecord.distinct(
    'transporterRaw',
    { uploadId: upload._id }
  );

  // Step 2 — Permanently delete all vehicle records from this upload
  const deleteResult = await VehicleRecord.deleteMany({ uploadId: upload._id });

  // Step 3 — Permanently delete the upload record itself
  await Upload.deleteOne({ _id: upload._id });

  // Step 4 — For each transporter that was in this upload,
  // check if any vehicle records still exist (from other uploads).
  // If zero records remain → delete the transporter mapping.
  let deletedMappings = 0;
  if (transportersInUpload.length > 0) {
    for (const rawName of transportersInUpload) {
      const remaining = await VehicleRecord.countDocuments({ transporterRaw: rawName });
      if (remaining === 0) {
        const deleted = await TransporterMaster.collection.deleteOne({
          originalName: rawName.trim().toUpperCase(),
        });
        if (deleted.deletedCount) deletedMappings++;
      }
    }
  }

  return apiSuccess(
    {
      deletedRecords:  deleteResult.deletedCount,
      deletedMappings,
    },
    `Upload deleted — ${deleteResult.deletedCount} vehicle records and ${deletedMappings} orphaned transporter mappings removed`
  );
});

// GET /api/uploads/:id — public read access
export const GET = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  optionalAuth(req);

  await connectDB();
  const upload = await Upload.findById(params.id).populate('createdBy', 'name email').lean();
  if (!upload) throw new AppError('Upload not found', 404);

  return apiSuccess(upload);
});