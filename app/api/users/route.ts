import { withErrorHandler, apiSuccess, apiPaginated, AppError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import User from '@/models/User';
import { createUserSchema } from '@/server/validations/auth.validation';
import { escapeRegex } from '@/lib/utils';
import mongoose from 'mongoose';

// GET /api/users — gated: only admin and manager
export const GET = withErrorHandler(async (req: Request) => {
  requireAuth(req, 'VIEW_USERS');

  await connectDB();
  const url   = new URL(req.url);
  const page  = Math.max(1, Number(url.searchParams.get('page'))  || 1);
  const limit = Math.min(100, Number(url.searchParams.get('limit')) || 20);
  const skip  = (page - 1) * limit;
  const search = url.searchParams.get('search');

  const match: Record<string, unknown> = {};
  if (search) {
    const safe = escapeRegex(search);
    match.$or = [
      { name: new RegExp(safe, 'i') },
      { email: new RegExp(safe, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    User.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshTokens'),
    User.countDocuments(match),
  ]);

  return apiPaginated(data, { total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/users — gated: admin only
export const POST = withErrorHandler(async (req: Request) => {
  const decoded = requireAuth(req, 'MANAGE_USERS');

  await connectDB();
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR');

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

  const user = await User.create({ ...parsed.data, createdBy: new mongoose.Types.ObjectId(decoded.id) });
  return apiSuccess(user.toSafeObject(), 'User created successfully', 201);
});
