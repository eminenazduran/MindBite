import { Router } from 'express';
import { createUser, getUser, updateUser, getHealthScore } from '../controllers/userController';
import { getDailyAdvice } from '../controllers/adviceController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', createUser);
router.get('/advice', authMiddleware, getDailyAdvice);
router.get('/:id/health-score', authMiddleware, getHealthScore);
router.get('/:id', authMiddleware, getUser);
router.put('/:id', authMiddleware, updateUser);

export default router;
