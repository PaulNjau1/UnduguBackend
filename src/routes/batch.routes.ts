// src/routes/batch.routes.ts
import { Router } from 'express';
import { createBatch, updateBatch, getMyBatches, getBatchById, deleteBatch } from '../controllers/batch.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createBatchSchema, updateBatchSchema } from '../validators/batch.validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); 

router.post('/',createBatch);
router.put('/:id',updateBatch);
router.get('/',getMyBatches);
router.get('/:id',getBatchById);
router.delete('/:id',deleteBatch);

export default router;
