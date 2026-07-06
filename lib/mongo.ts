import mongoose from 'mongoose';
import { AppError } from '@/lib/api-response';

/**
 * Validates a route param is a well-formed Mongo ObjectId before it's used
 * in a query. Without this, an id like "abc" reaches findById()/ObjectId()
 * and throws a raw CastError, which withErrorHandler catches as an
 * *unexpected* error and turns into a generic 500 — hiding what is actually
 * a normal, predictable 400 (bad input). Some routes in this codebase
 * already did this check (notifications/[id]); this makes it consistent
 * everywhere a Mongo id comes from the URL.
 */
export function requireValidObjectId(id: string, label = 'id'): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid ${label}`, 400, 'INVALID_ID');
  }
}
