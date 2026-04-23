import { Request, Response } from 'express';
import { Food } from '../models/Food';

const formatResponse = <T>(status: 'success' | 'error', message: string, data?: T) => ({
  status,
  message,
  data
});

// Barkod ile ürün sorgula (Scan akışı olmadan direkt veritabanı sorgusu)
export const getFoodByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const food = await Food.findOne({ barcode });

    if (!food) {
      return res.status(404).json(formatResponse('error', 'Ürün veritabanında bulunamadı.'));
    }

    // İçerik "Bilinmiyor" mu kontrol et
    const needsOcr = food.ingredients.length === 1 && 
      food.ingredients[0].includes('Bilinmiyor');

    res.status(200).json(formatResponse('success', 'Ürün bulundu.', {
      food,
      needsOcr
    }));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// İsme göre ürün arama (Arama çubuğu için)
export const searchFood = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(formatResponse('error', 'Arama terimi gereklidir. Örn: ?q=torku'));
    }

    const foods = await Food.find({
      productName: { $regex: q, $options: 'i' }
    }).limit(20).select('barcode productName calories ingredients');

    res.status(200).json(formatResponse('success', `${foods.length} ürün bulundu.`, foods));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};
