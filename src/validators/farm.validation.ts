import { z } from 'zod';

export const createFarmSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  farmerId: z.string().uuid(),
});

export const updateFarmSchema = z
  .object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
  })
  .refine((data) => data.name || data.location || data.latitude || data.longitude, {
    message: 'At least one field must be provided for update.',
  });
