// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { login, logout, refreshToken, signup } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createUserSchema } from '../validators/user.validation';

const router = Router();

router.post('/signup', validateRequest(createUserSchema), signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
