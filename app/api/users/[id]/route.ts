import { withErrorHandler, apiSuccess, apiError, AppError } from '@/lib/api-response';
import { verifyAccessToken, getTokenFromRequest, can } from '@/lib/auth';
import connectDB from '@/database/connection';
import User from '@/models/User';
import { updateUserSchema } from '@/server/validations/auth.validation';
import mongoose from 'mongoose';

// PATCH /api/users/:id
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  const decoded = verifyAccessToken(token);
  if (!can('MANAGE_USERS', decoded.role)) throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');

  await connectDB();
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR');

  const user = await User.findByIdAndUpdate(
    params.id,
    { ...parsed.data, updatedBy: new mongoose.Types.ObjectId(decoded.id) },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  if (!user) throw new AppError('User not found', 404);
  return apiSuccess(user, 'User updated');
});

// DELETE /api/users/:id — soft delete
export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const token = getTokenFromRequest(req);
  if (!token) return apiError('Authentication required', 401, 'NO_TOKEN');
  const decoded = verifyAccessToken(token);
  if (!can('MANAGE_USERS', decoded.role)) throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  if (decoded.id === params.id) throw new AppError('You cannot delete your own account', 400);

  await connectDB();
  const user = await User.findById(params.id);
  if (!user) throw new AppError('User not found', 404);

  (user as unknown as Record<string, unknown>).isDeleted = true;
  (user as unknown as Record<string, unknown>).deletedAt = new Date();
  (user as unknown as Record<string, unknown>).updatedBy = new mongoose.Types.ObjectId(decoded.id);
  await user.save({ validateBeforeSave: false });

  return apiSuccess({}, 'User deleted');
});
