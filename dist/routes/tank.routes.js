"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/tank.routes.ts
const express_1 = require("express");
const tank_controller_1 = require("../controllers/tank.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', tank_controller_1.createTank);
router.get('/', tank_controller_1.getMyTanks);
router.get('/:id', tank_controller_1.getTankById);
router.delete('/:id', tank_controller_1.deleteTank);
exports.default = router;
