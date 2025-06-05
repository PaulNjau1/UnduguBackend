import { z } from 'zod';

export const createSpindelReadingSchema = z.object({
  batchId: z.string().uuid(),
  temperature: z.number(),
  angleTilt: z.number(),
  battery: z.number(),
  gravity: z.number(),
  interval: z.number(),
  rssi: z.number(),
  unit: z.string(),
  ssid: z.string().optional(),
});

