import { Router } from 'express';
import { chat, weeklyReport } from '../controllers/aiController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, chat);
router.get('/weekly-report', authMiddleware, weeklyReport);

export default router;
