import { Request, Response } from 'express';
import { User } from '../models/User';
import { ScanHistory } from '../models/ScanHistory';
import { calculateHealthScore, calculateDailyScores } from '../services/healthScore';

// Saf fonksiyonel yaklaşım (Pure Function) ile sonuç formatlama
const formatResponse = <T>(status: 'success' | 'error', message: string, data?: T) => ({
  status,
  message,
  data
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, allergies, calorieGoal } = req.body;
    
    // Veri doğrulama
    if (!name || !email) {
      return res.status(400).json(formatResponse('error', 'Ad ve e-posta gereklidir.'));
    }

    const newUser = new User({ name, email, allergies, calorieGoal });
    await newUser.save();
    
    res.status(201).json(formatResponse('success', 'Kullanıcı oluşturuldu.', newUser));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    res.status(200).json(formatResponse('success', 'Kullanıcı getirildi.', user));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.params.id;
    const { name, allergies, calorieGoal } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, allergies, calorieGoal },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    res.status(200).json(formatResponse('success', 'Profil güncellendi.', user));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Sağlık puanı — bugün + son N gün trendi
export const getHealthScore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.params.id;
    const days = Math.max(1, Math.min(30, Number(req.query.days) || 7));

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    const calorieGoal = (user as any).calorieGoal || 2000;

    // Son N günün scan'lerini çek (foodId populate edilmeli).
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const scans = await ScanHistory.find({
      userId,
      createdAt: { $gte: since }
    })
      .populate('foodId')
      .lean();

    // Bugüne ait olanları filtrele
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayScans = (scans as any[]).filter(
      (s) => new Date(s.createdAt).getTime() >= todayStart.getTime()
    );

    const today = calculateHealthScore(todayScans as any, calorieGoal);
    const daily = calculateDailyScores(scans as any, calorieGoal, days);

    // 7 günlük hareketli ortalama (null olanları dahil etme)
    const valid = daily.filter((d) => d.score !== null);
    const avg =
      valid.length > 0
        ? Math.round(valid.reduce((a, b) => a + (b.score as number), 0) / valid.length)
        : null;

    res.status(200).json(
      formatResponse('success', 'Sağlık puanı hesaplandı.', {
        today,
        weekly: {
          average: avg,
          daily
        },
        calorieGoal
      })
    );
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};
