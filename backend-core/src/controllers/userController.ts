import { Request, Response } from 'express';
import { User } from '../models/User';
import { ScanHistory } from '../models/ScanHistory';
import { calculateHealthScore, calculateDailyScores } from '../services/healthScore';
import { calculateNutritionTargets } from '../services/nutritionTargets';

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
    const {
      name, allergies, calorieGoal,
      age, gender, height, weight, activityLevel, goal,
      autoCalculate, avatar
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    // Basit alanları güncelle
    if (typeof name === 'string') user.name = name;
    if (Array.isArray(allergies)) user.allergies = allergies;
    if (typeof avatar === 'string') user.avatar = avatar;

    // Beslenme profili alanları
    if (typeof age === 'number') user.age = age;
    if (gender) user.gender = gender;
    if (typeof height === 'number') user.height = height;
    if (typeof weight === 'number') user.weight = weight;
    if (activityLevel) user.activityLevel = activityLevel;
    if (goal) user.goal = goal;

    // Profil tamamsa hedefleri otomatik hesapla (autoCalculate flag false değilse)
    const shouldRecalculate =
      autoCalculate !== false &&
      typeof user.age === 'number' && typeof user.height === 'number' &&
      typeof user.weight === 'number' && user.gender && user.activityLevel && user.goal;

    if (shouldRecalculate) {
      const targets = calculateNutritionTargets({
        age: user.age!,
        gender: user.gender!,
        height: user.height!,
        weight: user.weight!,
        activityLevel: user.activityLevel!,
        goal: user.goal!
      });
      user.bmi = targets.bmi;
      user.bmr = targets.bmr;
      user.tdee = targets.tdee;
      user.calorieGoal = targets.calorieGoal;
      user.proteinGoal = targets.proteinGoal;
      user.carbGoal = targets.carbGoal;
      user.fatGoal = targets.fatGoal;
    } else if (typeof calorieGoal === 'number') {
      // Kullanıcı manuel kalori girdiyse onu kabul et
      user.calorieGoal = calorieGoal;
    }

    await user.save();

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

    // Sadece kullanıcının "Tükettim" onayı verdiği kayıtları skora dahil et
    const scans = await ScanHistory.find({
      userId,
      consumed: true,
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
