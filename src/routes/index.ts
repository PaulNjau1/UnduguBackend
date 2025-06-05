import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import farmRoutes from './farm.routes';
import tankRoutes from './tank.routes';
import batchRoutes from './batch.routes';
import readingRoutes from './readings.routes';
import alertRoutes from './alert.routes';
//import mediaRoutes from './media.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farms', farmRoutes);
router.use('/tanks', tankRoutes);
router.use('/batches', batchRoutes);
router.use('/', readingRoutes);
router.use('/alerts', alertRoutes);
//router.use('/media', mediaRoutes);

export default router;

