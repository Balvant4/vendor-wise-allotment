import type { z } from 'zod';
import type { UserRole } from '@/types';
import type { createUserSchema } from '@/server/validations/auth.validation';

export const ROLE_COLOR: Record<UserRole, 'red' | 'gold' | 'blue' | 'gray'> = {
  admin:     'red',
  manager:   'gold',
  associate: 'blue',
  user:      'gray',
};

export type CreateUserForm = z.infer<typeof createUserSchema>;
