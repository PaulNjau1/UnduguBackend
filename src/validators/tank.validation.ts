import { z } from 'zod';

export const createTankSchema = z.object({
  farmId: z.string().uuid(),
  name: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  spindelApiUrl:z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export const updateTankSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});
