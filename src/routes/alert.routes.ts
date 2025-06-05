// src/routes/alert.routes.ts
import { Router } from 'express';
import { createAlert, updateAlert,deleteAlert, getAllAlerts, getAlertById } from '../controllers/alert.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createAlertSchema, updateAlertSchema } from '../validators/alert.validation';

const router = Router();

router.post('/', validateRequest(createAlertSchema), createAlert);
router.put('/:id', validateRequest(updateAlertSchema), updateAlert);
router.get('/', getAllAlerts);
router.get('/:id', getAlertById);
router.delete('/:id', deleteAlert);

export default router;
