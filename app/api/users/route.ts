import { withErrorHandler, apiSuccess, apiPaginated, AppError } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import User from '@/models/User';
import { createUserSchema } from '@/server/validations/auth.validation';
import { buildSearchMatch } from '@/lib/utils';
import { parsePagination, toPaginationMeta } from '@/lib/pagination';
import mongoose from 'mongoose';

// GET /api/users — gated: only admin and manager
export const GET = withErrorHandler(async (req: Request) => {
  requireAuth(req, 'VIEW_USERS');

  await connectDB();
  const url = new URL(req.url);
  const pagination = parsePagination(url, { defaultLimit: 20, maxLimit: 100 });
  const { limit, skip } = pagination;
  const search = url.searchParams.get('search') ?? '';

  const match: Record<string, unknown> = {};
  const searchMatch = buildSearchMatch(search, ['name', 'email'], []);
  if (searchMatch) match.$or = searchMatch.$or;

  const [data, total] = await Promise.all([
    User.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshTokens'),
    User.countDocuments(match),
  ]);

  return apiPaginated(data, toPaginationMeta(total, pagination));
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
