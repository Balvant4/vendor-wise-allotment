import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(['admin', 'manager', 'associate', 'user']),
});

export const updateUserSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  email:    z.string().email().optional(),
  role:     z.enum(['admin', 'manager', 'associate', 'user']).optional(),
  isActive: z.boolean().optional(),
});

export type LoginInput          = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput     = z.infer<typeof createUserSchema>;
export type UpdateUserInput     = z.infer<typeof updateUserSchema>;
