import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['FARMER', 'UNDUGU', 'ADMIN']).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['FARMER', 'UNDUGU', 'ADMIN']).optional(),
});
