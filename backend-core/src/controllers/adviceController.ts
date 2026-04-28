import { Request, Response } from 'express';
import { User } from '../models/User';
import { ScanHistory } from '../models/ScanHistory';
import { generateNutritionalAdvice } from '../services/adviceService';

export const getDailyAdvice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Yetkisiz erişim.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });

    const todayStart = new Date().setHours(0, 0, 0, 0);
    // Sadece tüketim onaylı kayıtlar günlük tavsiyeyi etkiler
    const history = await ScanHistory.find({
      userId,
      consumed: true,
      createdAt: { $gte: new Date(todayStart) }
    }).populate('foodId');

    const totals = history.reduce((acc, h: any) => {
      const food = h.foodId;
      const factor = (h.servingSize || 100) / 100;
      if (food) {
        acc.calories += (food.calories || 0) * factor;
        acc.protein += (food.protein || 0) * factor;
        acc.carbohydrates += (food.carbohydrates || 0) * factor;
        acc.fat += (food.fat || 0) * factor;
      }
      return acc;
    }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });

    const calorieGoal = user.calorieGoal || 2000;
    const goals = {
      calories: calorieGoal,
      protein: Math.round(calorieGoal * 0.15 / 4),
      carbohydrates: Math.round(calorieGoal * 0.55 / 4),
      fat: Math.round(calorieGoal * 0.30 / 9),
    };

    const foodNames = history.map((h: any) => h.foodId?.productName).filter(Boolean);

    const advice = await generateNutritionalAdvice(totals, goals, foodNames);

    res.status(200).json({
      status: 'success',
      data: advice
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
