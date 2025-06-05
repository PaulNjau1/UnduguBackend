"use strict";
// src/routes/readingsRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const readings_controller_1 = require("../controllers/readings.controller");
const auth_1 = require("../middleware/auth");
const alert_controller_1 = require("../controllers/alert.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/batches/:batchId/readings", readings_controller_1.getSpindelReadingsByBatchId);
router.get("/readings/:id", readings_controller_1.getSpindelReadingById);
router.get('/batches/:batchId/alerts', alert_controller_1.getAlertsByBatchId);
exports.default = router;
