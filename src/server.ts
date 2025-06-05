import app from './app';
import { env } from './config/env';
import { PrismaClient } from '@prisma/client';
import startCronJobs from './services/cron';

const prisma = new PrismaClient();

const startServer = async () => {
  try {
    await prisma.$connect();
    
    startCronJobs();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
