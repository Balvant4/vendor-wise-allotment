import { z } from 'zod';

// Original/standard names are stored uppercased and trimmed by the model,
// but that happens *after* this validation runs — so the length/emptiness
// checks here still need to account for surrounding whitespace.
export const createTransporterSchema = z.object({
  originalName: z.string().trim().min(1, 'Original name is required').max(200),
  standardName: z.string().trim().min(1, 'Standard name is required').max(200),
  isFix: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
});

export const updateTransporterSchema = z.object({
  originalName: z.string().trim().min(1).max(200).optional(),
  standardName: z.string().trim().min(1).max(200).optional(),
  isFix: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTransporterInput = z.infer<typeof createTransporterSchema>;
export type UpdateTransporterInput = z.infer<typeof updateTransporterSchema>;
