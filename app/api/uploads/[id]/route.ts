import { withErrorHandler, apiSuccess, AppError } from '@/lib/api-response';
import { requireAuth, optionalAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import Upload from '@/models/Upload';
import VehicleRecord from '@/models/VehicleRecord';

// DELETE /api/uploads/:id — gated: must be admin (permanently deletes data)
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  requireAuth(req, 'DELETE_UPLOADS');

  await connectDB();
  const upload = await Upload.findById(params.id);
  if (!upload) throw new AppError('Upload not found', 404);

  // Permanently delete all vehicle records from this upload
  const deleteResult = await VehicleRecord.deleteMany({ uploadId: upload._id });

  // Permanently delete the upload record itself
  await Upload.deleteOne({ _id: upload._id });

  return apiSuccess(
    { deletedRecords: deleteResult.deletedCount },
    `Upload and ${deleteResult.deletedCount} vehicle records permanently deleted`
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