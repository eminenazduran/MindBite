import { Router } from 'express';
import { getFoodByBarcode, searchFood } from '../controllers/foodController';

const router = Router();

// GET /api/food/search?q=torku  → İsme göre arama
router.get('/search', searchFood);

// GET /api/food/:barcode        → Barkodla direkt sorgulama
router.get('/:barcode', getFoodByBarcode);

export default router;
