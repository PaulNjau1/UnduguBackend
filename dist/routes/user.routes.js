"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
//import { authenticate } from '../middleware/auth';
const validateRequest_1 = require("../middleware/validateRequest");
const user_validation_1 = require("../validators/user.validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes protected by authentication middleware
router.use(auth_1.authenticate);
// Optional: Create user (only admins/undugu?)
router.post('/', (0, validateRequest_1.validateRequest)(user_validation_1.createUserSchema), user_controller_1.createUser);
router.get('/', user_controller_1.getAllUsers);
router.get('/:id', user_controller_1.getUserById);
// Validate update request body
router.put('/:id', (0, validateRequest_1.validateRequest)(user_validation_1.updateUserSchema), user_controller_1.updateUser);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
