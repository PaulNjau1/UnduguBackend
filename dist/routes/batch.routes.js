"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/batch.routes.ts
const express_1 = require("express");
const batch_controller_1 = require("../controllers/batch.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', batch_controller_1.createBatch);
router.put('/:id', batch_controller_1.updateBatch);
router.get('/', batch_controller_1.getMyBatches);
router.get('/:id', batch_controller_1.getBatchById);
router.delete('/:id', batch_controller_1.deleteBatch);
exports.default = router;
