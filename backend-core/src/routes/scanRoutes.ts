import { Router } from 'express';
import {
  scanProduct,
  logNaturalMeal,
  markScanConsumed,
  unmarkScanConsumed,
  dismissScan,
  restoreScan,
  deleteScan,
} from '../controllers/scanController';
import { getScanHistory } from '../controllers/scanHistoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, scanProduct);
router.post('/natural', authMiddleware, logNaturalMeal);
router.get('/history/:userId', authMiddleware, getScanHistory);
router.patch('/:id/consume', authMiddleware, markScanConsumed);
router.patch('/:id/unconsume', authMiddleware, unmarkScanConsumed);
router.patch('/:id/dismiss', authMiddleware, dismissScan);
router.patch('/:id/restore', authMiddleware, restoreScan);
router.delete('/:id', authMiddleware, deleteScan);

export default router;
