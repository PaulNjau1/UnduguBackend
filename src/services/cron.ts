import cron from 'node-cron';
import { pollSpindelForBatch } from '../controllers/spindel.controller';
import prisma from '../prisma/client';

const startCronJobs = () => {
  // Schedule a cron job to run every minute (adjust the schedule as needed)
  cron.schedule('* * * * *', async () => {
    const batches = await prisma.batch.findMany({ where: { isActive: true } });
    for (const batch of batches) {
      await pollSpindelForBatch(batch.id); // Call the function to poll data for each active batch
    }
    console.log('✅ Polled iSpindel data for active batches.');
  });
};

export default startCronJobs;
