// src/routes/readingsRoutes.ts

import { Router } from "express";
import {
  getSpindelReadingById,
  getSpindelReadingsByBatchId,
} from "../controllers/readings.controller";
import { authenticate } from "../middleware/auth";
import { getAlertsByBatchId } from "../controllers/alert.controller";

const router = Router();

router.use(authenticate);

router.get("/batches/:batchId/readings", getSpindelReadingsByBatchId);

router.get("/readings/:id", getSpindelReadingById);

router.get('/batches/:batchId/alerts', getAlertsByBatchId);

export default router;
