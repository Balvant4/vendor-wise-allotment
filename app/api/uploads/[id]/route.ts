import { withErrorHandler, apiSuccess, apiError, AppError } from '@/lib/api-response';
import { verifyAccessToken, getTokenFromRequest, can } from '@/lib/auth';
import connectDB from '@/database/connection';
import Upload from '@/models/Upload';
import VehicleRecord from '@/models/VehicleRecord';

// DELETE /api/uploads/:id — permanently delete upload + all its vehicle records
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  const decoded = verifyAccessToken(token);

  if (!can('DELETE_UPLOADS', decoded.role)) {
    throw new AppError('Only admins can delete uploads', 403, 'FORBIDDEN');
  }

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

// GET /api/uploads/:id — fetch single upload status
export const GET = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  verifyAccessToken(token);

  await connectDB();
  const upload = await Upload.findById(params.id).populate('createdBy', 'name email').lean();
  if (!upload) throw new AppError('Upload not found', 404);

  return apiSuccess(upload);
});