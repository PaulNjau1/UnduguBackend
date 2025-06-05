// src/routes/spindel.routes.ts
import { Router } from 'express';
import { startFermentation, stopFermentation } from '../controllers/spindel.controller';

const router = Router();

// Start fermentation and begin polling readings from the iSpindel API
router.post('/fermentation/start', startFermentation);

// Stop fermentation (stop polling)
router.post('/fermentation/stop', stopFermentation);

export default router;
