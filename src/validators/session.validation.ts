import { z } from 'zod';

export const createSessionSchema = z.object({
  userId: z.string().uuid(),
  refreshToken: z.string(),
  userAgent: z.string().optional(),
});
