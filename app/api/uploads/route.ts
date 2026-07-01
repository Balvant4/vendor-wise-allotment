import { withErrorHandler, apiSuccess, apiPaginated, AppError } from '@/lib/api-response';
import { requireAuth, optionalAuth } from '@/lib/auth';
import connectDB from '@/database/connection';
import Upload from '@/models/Upload';
import { processUpload } from '@/features/uploads/services/upload.service';
import mongoose from 'mongoose';

const MAX_BYTES = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50) * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

// GET /api/uploads — public read access (upload history is non-sensitive metadata)
export const GET = withErrorHandler(async (req: Request) => {
  optionalAuth(req);
  await connectDB();

  const url   = new URL(req.url);
  const page  = Math.max(1, Number(url.searchParams.get('page'))  || 1);
  const limit = Math.min(50, Number(url.searchParams.get('limit')) || 20);
  const skip  = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Upload.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('createdBy', 'name email').lean(),
    Upload.countDocuments({}),
  ]);

  return apiPaginated(data, { total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/uploads — gated: must be logged in with UPLOAD_FILES permission
export const POST = withErrorHandler(async (req: Request) => {
  const decoded = requireAuth(req, 'UPLOAD_FILES');

  await connectDB();

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

  // Accept xlsx/xls/csv
  const isValidType = ALLOWED_TYPES.includes(file.type) ||
    file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

  if (!isValidType) {
    throw new AppError(`Invalid file type. Only Excel (.xlsx, .xls) or CSV allowed.`, 400, 'INVALID_TYPE');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    throw new AppError(`File too large. Maximum size is ${process.env.MAX_UPLOAD_SIZE_MB ?? 50}MB`, 413, 'FILE_TOO_LARGE');
  }

  const userId = new mongoose.Types.ObjectId(decoded.id);

  // Create upload record first
  const uploadDoc = await Upload.create({
    filename:     `upload_${Date.now()}_${file.name}`,
    originalName: file.name,
    fileSize:     buffer.byteLength,
    mimeType:     file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    createdBy:    userId,
  });

  // Process file — we await this so user gets real result back
  await processUpload(uploadDoc, buffer, userId);

  // Return updated upload doc
  const updated = await Upload.findById(uploadDoc._id).populate('createdBy', 'name email').lean();

  return apiSuccess({ upload: updated }, 'File processed successfully', 200);
});