"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/spindel.routes.ts
const express_1 = require("express");
const spindel_controller_1 = require("../controllers/spindel.controller");
const router = (0, express_1.Router)();
// Start fermentation and begin polling readings from the iSpindel API
router.post('/fermentation/start', spindel_controller_1.startFermentation);
// Stop fermentation (stop polling)
router.post('/fermentation/stop', spindel_controller_1.stopFermentation);
exports.default = router;
