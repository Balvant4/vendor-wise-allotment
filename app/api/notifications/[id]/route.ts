import { withErrorHandler, apiSuccess, AppError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// PATCH /api/notifications/:id — mark a single notification as read for the current user
export const PATCH = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const decoded = requireAuth(req);
  await connectDB();

  if (!mongoose.isValidObjectId(ctx.params.id)) {
    throw new AppError('Invalid notification id', 400, 'INVALID_ID');
  }

  const userId = new mongoose.Types.ObjectId(decoded.id);

  const notification = await Notification.findOneAndUpdate(
    {
      _id: ctx.params.id,
      audienceRoles: decoded.role,
      readBy: { $not: { $elemMatch: { userId } } },
    },
    { $push: { readBy: { userId, readAt: new Date() } } },
    { new: true }
  ).lean();

  if (!notification) {
    // Either it doesn't exist, isn't for this role, or was already read —
    // treat all as a harmless no-op success rather than a 404, since the
    // end state the client wants (marked as read) is already true.
    return apiSuccess(null, 'Notification already read or not found');
  }

  return apiSuccess(notification, 'Notification marked as read');
});
