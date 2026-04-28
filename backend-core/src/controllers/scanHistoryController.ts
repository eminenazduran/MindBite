import { Request, Response } from 'express';
import { ScanHistory } from '../models/ScanHistory';
import { detectRiskyAdditives } from '../services/riskyAdditives';

const formatResponse = <T>(status: 'success' | 'error', message: string, data?: T) => ({
  status,
  message,
  data
});

// Kullanıcının tarama geçmişini getir
export const getScanHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.params.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await ScanHistory.find({ userId })
      .populate('foodId', 'barcode productName calories protein carbohydrates fat ingredients eCodes allergens isGeneric')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Her kayıt için zararlı/şüpheli madde listesi (cache değil, her zaman güncel)
    const enriched = history.map((scan: any) => {
      const food = scan.foodId;
      const riskyAdditives = food
        ? detectRiskyAdditives(food.eCodes || [], food.ingredients || [])
        : [];
      return { ...scan, riskyAdditives };
    });

    res.status(200).json(formatResponse('success', `${enriched.length} tarama kaydı bulundu.`, enriched));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};
