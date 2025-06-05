import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  //createUser, // optional, if you have create user
} from '../controllers/user.controller';
//import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createUserSchema, updateUserSchema } from '../validators/user.validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes protected by authentication middleware
router.use(authenticate);

// Optional: Create user (only admins/undugu?)
router.post('/', validateRequest(createUserSchema), createUser);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Validate update request body
router.put('/:id', validateRequest(updateUserSchema), updateUser);

router.delete('/:id', deleteUser);

export default router;
