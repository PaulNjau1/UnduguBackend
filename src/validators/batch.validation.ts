import { z } from 'zod';

export const createBatchSchema = z.object({
  tankId: z.string().uuid(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  notes: z.string().optional(),
});

export const updateBatchSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
  notes: z.string().optional(),
});
