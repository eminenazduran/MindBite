import { Request, Response } from 'express';
import { ScanHistory } from '../models/ScanHistory';

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
      .populate('foodId', 'barcode productName calories protein carbohydrates fat ingredients')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(formatResponse('success', `${history.length} tarama kaydı bulundu.`, history));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};
