import { Router } from 'express';
import { createFarm, updateFarm,deleteFarm, getFarmById, getFarms } from '../controllers/farm.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createFarmSchema, updateFarmSchema } from '../validators/farm.validation';
import { authenticate } from '../middleware/auth';
import { getTanksByFarmId } from '../controllers/tank.controller';

const router = Router();

router.use(authenticate); 

router.post('/', createFarm);
router.put('/:id', updateFarm);
router.get('/',getFarms);
router.get('/:id',getFarmById);
router.get('/:farmId/tanks',getTanksByFarmId);
router.delete('/:id',deleteFarm);


export default router;

