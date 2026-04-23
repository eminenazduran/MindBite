import { Router } from 'express';
import { scanProduct, logNaturalMeal } from '../controllers/scanController';
import { getScanHistory } from '../controllers/scanHistoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, scanProduct);
router.post('/natural', authMiddleware, logNaturalMeal);
router.get('/history/:userId', authMiddleware, getScanHistory);

export default router;
