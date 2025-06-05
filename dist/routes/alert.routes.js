"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/alert.routes.ts
const express_1 = require("express");
const alert_controller_1 = require("../controllers/alert.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const alert_validation_1 = require("../validators/alert.validation");
const router = (0, express_1.Router)();
router.post('/', (0, validateRequest_1.validateRequest)(alert_validation_1.createAlertSchema), alert_controller_1.createAlert);
router.put('/:id', (0, validateRequest_1.validateRequest)(alert_validation_1.updateAlertSchema), alert_controller_1.updateAlert);
router.get('/', alert_controller_1.getAllAlerts);
router.get('/:id', alert_controller_1.getAlertById);
router.delete('/:id', alert_controller_1.deleteAlert);
exports.default = router;
