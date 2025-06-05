// src/routes/tank.routes.ts
import { Router } from 'express';
import { createTank, deleteTank, getMyTanks, getTankById } from '../controllers/tank.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createTankSchema } from '../validators/tank.validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); 

router.post('/',createTank);
router.get('/', getMyTanks);
router.get('/:id',getTankById);
router.delete('/:id',deleteTank);


export default router;
