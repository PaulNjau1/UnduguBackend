import { pollSpindelForBatch } from '../controllers/spindel.controller';
import prisma from '../prisma/client';


export const pollAllActiveBatches = async () => {
  const activeBatches = await prisma.batch.findMany({
    where: { isActive: true },
    include: { tank: true },
  });

  for (const batch of activeBatches) {
    if (batch.tank.spindelApiUrl) {
      await pollSpindelForBatch(batch.id);
    }
  }
};
