import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../models/User';
import { ScanHistory } from '../models/ScanHistory';
import { Food } from '../models/Food';

const getGenAI = () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const AI_MODEL = 'gemini-2.5-flash';

// 503/429 hatalarında otomatik retry
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 3000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message || '';
      
      // Kota aşımı durumu (çok fazla istek)
      if (msg.includes('429')) {
        const match = msg.match(/retry in (\d+)/i);
        const waitTime = match ? match[1] : 'biraz';
        throw new Error(`Çok hızlı işlem yapıyorsunuz. Lütfen ${waitTime} saniye bekleyip tekrar deneyin. ⏳`);
      }

      const isRetryable = msg.includes('503') || msg.includes('overloaded');
      if (isRetryable && i < retries - 1) {
        console.log(`AI model busy, retrying in ${delayMs}ms... (attempt ${i + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries reached');
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// Kullanıcının profilini ve son tarama geçmişini context olarak alır,
// Gemini ile beslenme asistanı sohbeti yürütür.
export const chat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { message, history: chatHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Mesaj boş olamaz.' });
    }

    // Kullanıcı profilini ve son 10 taramayı paralel çek
    const [user, recentScans] = await Promise.all([
      User.findById(userId).lean(),
      ScanHistory.find({ userId, consumed: true })
        .sort({ consumedAt: -1 })
        .limit(10)
        .populate('foodId', 'productName calories protein carbohydrates fat eCodes allergens')
        .lean()
    ]);

    if (!user) return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });

    // Kullanıcı bağlamını oluştur
    const scansContext = recentScans.map((s: any) => {
      const f = s.foodId;
      if (!f) return null;
      return `- ${f.productName} (${s.servingSize}g → ${Math.round((f.calories * s.servingSize) / 100)} kcal, P:${((f.protein * s.servingSize) / 100).toFixed(1)}g, K:${((f.carbohydrates * s.servingSize) / 100).toFixed(1)}g, Y:${((f.fat * s.servingSize) / 100).toFixed(1)}g)`;
    }).filter(Boolean).join('\n') || 'Henüz tüketim kaydı yok.';

    const systemPrompt = `Sen MindBite'ın kişisel beslenme asistanısın. Türkçe konuş, samimi ve destekleyici ol.

KULLANICI PROFİLİ:
- Ad: ${(user as any).name || 'Kullanıcı'}
- Yaş: ${(user as any).age || 'Bilinmiyor'}, Cinsiyet: ${(user as any).gender || 'Bilinmiyor'}
- Boy: ${(user as any).height || '?'} cm, Kilo: ${(user as any).weight || '?'} kg
- Hedef: ${(user as any).goal === 'lose' ? 'Kilo vermek' : (user as any).goal === 'gain' ? 'Kilo almak' : (user as any).goal === 'maintain' ? 'Kilosunu korumak' : 'Sağlıklı beslenmek'}
- Günlük kalori hedefi: ${(user as any).calorieGoal || 2000} kcal
- Aktivite seviyesi: ${(user as any).activityLevel || 'moderate'}
- Alerjiler: ${(user as any).allergies?.length ? (user as any).allergies.join(', ') : 'Yok'}

SON TÜKETİLEN ÜRÜNLER:
${scansContext}

KURALLAR:
- Sağlık/beslenme dışı konularda kibarca reddet.
- Kısa, net, uygulanabilir öneriler ver.
- Emoji kullanabilirsin ama abartma.
- Tıbbi teşhis koyma, gerektiğinde uzmana yönlendir.`;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // Geçmiş mesajları Gemini formatına çevir
    const formattedHistory = (chatHistory as any[]).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Anlaşıldı! MindBite beslenme asistanın olarak sana yardımcı olmaya hazırım. 🥗' }] },
        ...formattedHistory
      ]
    });

    const result = await withRetry(() => chatSession.sendMessage(message));
    const response = result.response.text();

    res.status(200).json({ status: 'success', data: { reply: response } });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({ status: 'error', message: 'Asistan şu an yanıt veremiyor, lütfen tekrar dene.', debug: error.message });
  }
};

// ─── GET /api/ai/weekly-report/:userId ───────────────────────────────────────
// Son 7 günlük tüketim verilerini analiz eder ve Gemini ile kişiselleştirilmiş
// haftalık beslenme raporu oluşturur.
export const weeklyReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [user, weekScans] = await Promise.all([
      User.findById(userId).lean(),
      ScanHistory.find({
        userId,
        consumed: true,
        consumedAt: { $gte: sevenDaysAgo }
      })
        .populate('foodId', 'productName calories protein carbohydrates fat eCodes allergens ingredients')
        .sort({ consumedAt: 1 })
        .lean()
    ]);

    if (!user) return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });

    if (weekScans.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          hasData: false,
          message: 'Haftalık rapor için en az 1 tüketim kaydı gerekiyor. Ürün tarayıp "Tükettim" butonuna basarak başlayabilirsin!'
        }
      });
    }

    // Günlük besin toplamlarını hesapla
    const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number; products: string[] }> = {};

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    let riskyCnt = 0;
    const allECodes = new Set<string>();
    const allAllergens = new Set<string>();

    weekScans.forEach((scan: any) => {
      const food = scan.foodId;
      if (!food) return;

      const day = new Date(scan.consumedAt).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });
      const ratio = scan.servingSize / 100;
      const cal = Math.round(food.calories * ratio);
      const prot = food.protein * ratio;
      const carb = food.carbohydrates * ratio;
      const fat = food.fat * ratio;

      if (!dailyTotals[day]) dailyTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0, products: [] };
      dailyTotals[day].calories += cal;
      dailyTotals[day].protein += prot;
      dailyTotals[day].carbs += carb;
      dailyTotals[day].fat += fat;
      dailyTotals[day].products.push(food.productName);

      totalCalories += cal;
      totalProtein += prot;
      totalCarbs += carb;
      totalFat += fat;

      if (scan.analysisResult?.riskLevel === 'HIGH' || scan.analysisResult?.riskLevel === 'MEDIUM') riskyCnt++;
      (food.eCodes || []).forEach((e: string) => allECodes.add(e));
      (food.allergens || []).forEach((a: string) => allAllergens.add(a));
    });

    const dayCount = Object.keys(dailyTotals).length;
    const avgCalories = Math.round(totalCalories / dayCount);
    const avgProtein = (totalProtein / dayCount).toFixed(1);
    const avgCarbs = (totalCarbs / dayCount).toFixed(1);
    const avgFat = (totalFat / dayCount).toFixed(1);
    const calorieGoal = (user as any).calorieGoal || 2000;

    // Günlük özet tablosu
    const dailySummary = Object.entries(dailyTotals).map(([day, data]) => ({
      day,
      calories: Math.round(data.calories),
      protein: data.protein.toFixed(1),
      carbs: data.carbs.toFixed(1),
      fat: data.fat.toFixed(1),
      products: data.products
    }));

    // Gemini ile rapor oluştur
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Sen MindBite beslenme asistanısın. Kullanıcının haftalık beslenme verilerini analiz et.

KULLANICI:
- Hedef: ${(user as any).goal || 'healthy'}
- Günlük kalori hedefi: ${calorieGoal} kcal
- Alerjiler: ${(user as any).allergies?.join(', ') || 'Yok'}

HAFTALIK ÖZET (${dayCount} gün):
- Toplam kalori: ${totalCalories} kcal (günlük ort: ${avgCalories} kcal, hedef: ${calorieGoal} kcal)
- Ort. Protein: ${avgProtein}g/gün
- Ort. Karbonhidrat: ${avgCarbs}g/gün
- Ort. Yağ: ${avgFat}g/gün
- Orta/Yüksek riskli ürün sayısı: ${riskyCnt}
- Tespit edilen E-kodları: ${allECodes.size > 0 ? [...allECodes].slice(0, 10).join(', ') : 'Yok'}
- Ürün alerjenleri: ${allAllergens.size > 0 ? [...allAllergens].join(', ') : 'Yok'}

Aşağıdaki JSON formatında kısa, kişisel ve samimi Türkçe rapor oluştur:
{
  "headline": "Bu haftayı özetleyen 1 cümle başlık (motive edici)",
  "overallScore": 1-10 arası genel puan (sayı),
  "scoreLabel": "Mükemmel / İyi / Geliştirilmeli / Dikkat Gerektiriyor",
  "highlights": [
    { "type": "positive", "text": "Bu hafta iyi yaptığın bir şey" },
    { "type": "positive", "text": "Başka iyi bir şey" },
    { "type": "warning", "text": "Dikkat edilmesi gereken bir nokta" },
    { "type": "warning", "text": "Başka bir dikkat noktası" }
  ],
  "calorieInsight": "Kalori ortalamasına göre yorum (kısa, rakamla)",
  "macroInsight": "Protein/Karb/Yağ dağılımına göre yorum",
  "riskInsight": "Riskli ürün maruziyeti hakkında yorum (varsa)",
  "nextWeekTips": [
    "Gelecek hafta için somut, uygulanabilir ipucu 1",
    "İpucu 2",
    "İpucu 3"
  ],
  "motivationMessage": "Kısa motivasyon cümlesi (emoji ile)"
}

Sadece JSON döndür.`;

    const result = await withRetry(() => model.generateContent(prompt));
    const aiInsights = JSON.parse(result.response.text());

    res.status(200).json({
      status: 'success',
      data: {
        hasData: true,
        period: { days: dayCount, from: sevenDaysAgo.toISOString(), to: new Date().toISOString() },
        totals: {
          calories: totalCalories,
          protein: totalProtein.toFixed(1),
          carbs: totalCarbs.toFixed(1),
          fat: totalFat.toFixed(1),
          scanCount: weekScans.length
        },
        averages: { calories: avgCalories, protein: avgProtein, carbs: avgCarbs, fat: avgFat },
        calorieGoal,
        dailySummary,
        riskCount: riskyCnt,
        ai: aiInsights
      }
    });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
