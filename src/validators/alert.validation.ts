import { z } from 'zod';

export const createAlertSchema = z.object({
  batchId: z.string().uuid(),
  readingId: z.string().uuid(), // ✅ Required for valid Prisma insert
  message: z.string().min(1),
  level: z.enum(['INFO', 'WARNING', 'CRITICAL']),
});

export const updateAlertSchema = createAlertSchema.partial();
