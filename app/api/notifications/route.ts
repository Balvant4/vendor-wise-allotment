import { withErrorHandler, apiSuccess } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// GET /api/notifications — list notifications for the current user's role,
// with an isRead flag computed per-user, and an unread count.
// GET /api/notifications?unreadOnly=true — only unread
// GET /api/notifications?countOnly=true  — just { unreadCount } (cheap poll)
export const GET = withErrorHandler(async (req: Request) => {
  const decoded = requireAuth(req);
  await connectDB();

  const userId = new mongoose.Types.ObjectId(decoded.id);
  const url = new URL(req.url);
  const baseMatch = { audienceRoles: decoded.role };

  if (url.searchParams.get('countOnly') === 'true') {
    const unreadCount = await Notification.countDocuments({
      ...baseMatch,
      readBy: { $not: { $elemMatch: { userId } } },
    });
    return apiSuccess({ unreadCount });
  }

  const page  = Math.max(1, Number(url.searchParams.get('page'))  || 1);
  const limit = Math.min(50, Number(url.searchParams.get('limit')) || 20);
  const skip  = (page - 1) * limit;
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

  const match: Record<string, unknown> = { ...baseMatch };
  if (unreadOnly) {
    match.readBy = { $not: { $elemMatch: { userId } } };
  }

  const [docs, total, unreadCount] = await Promise.all([
    Notification.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(match),
    Notification.countDocuments({
      ...baseMatch,
      readBy: { $not: { $elemMatch: { userId } } },
    }),
  ]);

  const data = docs.map((n) => ({
    ...n,
    isRead: n.readBy?.some((r) => String(r.userId) === decoded.id) ?? false,
  }));

  return apiSuccess({
    items: data,
    unreadCount,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// PATCH /api/notifications?action=mark-all-read
export const PATCH = withErrorHandler(async (req: Request) => {
  const decoded = requireAuth(req);
  await connectDB();

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action !== 'mark-all-read') {
    return apiSuccess(null, 'No action specified', 400);
  }

  const userId = new mongoose.Types.ObjectId(decoded.id);

  await Notification.updateMany(
    { audienceRoles: decoded.role, readBy: { $not: { $elemMatch: { userId } } } },
    { $push: { readBy: { userId, readAt: new Date() } } }
  );

  return apiSuccess(null, 'All notifications marked as read');
});
