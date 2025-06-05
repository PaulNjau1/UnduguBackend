"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const user_validation_1 = require("../validators/user.validation");
const router = (0, express_1.Router)();
router.post('/signup', (0, validateRequest_1.validateRequest)(user_validation_1.createUserSchema), auth_controller_1.signup);
router.post('/login', auth_controller_1.login);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.post('/logout', auth_controller_1.logout);
exports.default = router;
