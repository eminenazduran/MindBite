import { Request, Response } from 'express';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { ScanHistory } from '../models/ScanHistory';
import { analyzeRisk } from '../services/analyzerService';
import { analyzeWithGemini } from '../services/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── POST /scan/label-analyze ─────────────────────────────────────────────────
// Barkodsuz, sadece içindekiler metni (OCR veya manuel) ile ürün analizi.
// Gemini yapay zekasını kullanarak ürün bilgilerini çıkarır, risk analizi yapar
// ve isteğe bağlı olarak kullanıcının profiline göre kişiselleştirilmiş öneri üretir.
export const analyzeLabelOnly = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ingredientsText, servingSize = 100 } = req.body;

    if (!ingredientsText?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'İçindekiler metni gereklidir.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });
    }

    // Gemini ile içerik metnini yapılandırılmış veriye çevir
    const rawData = {
      product_name: 'OCR ile Taranan Ürün',
      ingredients_text: ingredientsText,
      nutriments: {},
      allergens_tags: []
    };

    const geminiAnalysis = await analyzeWithGemini(rawData);

    // Sanal barkod oluştur (veritabanında kayıt için)
    const virtualBarcode = `L-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const food = new Food({
      barcode: virtualBarcode,
      productName: geminiAnalysis.name || 'Etiket Taraması ile Eklenen Ürün',
      ingredients: geminiAnalysis.ingredients || [],
      eCodes: geminiAnalysis.eCodes || [],
      calories: geminiAnalysis.calories || 0,
      protein: geminiAnalysis.protein || 0,
      carbohydrates: geminiAnalysis.carbohydrates || 0,
      fat: geminiAnalysis.fat || 0,
      allergens: geminiAnalysis.allergens || [],
      isGeneric: false,
    });

    await food.save();

    // Risk analizi
    const analysisResult = analyzeRisk(user, food);

    // Geçmişe kaydet
    const scanRecord = new ScanHistory({
      userId: user._id,
      foodId: food._id,
      barcode: virtualBarcode,
      servingSize,
      consumed: false,
      consumedAt: null,
      analysisResult: {
        riskLevel: analysisResult.riskLevel,
        warnings: analysisResult.warnings,
        safeToConsume: analysisResult.safeToConsume
      }
    });

    await scanRecord.save();

    res.status(200).json({
      status: 'success',
      message: 'Etiket analizi tamamlandı.',
      data: {
        food,
        analysisResult,
        scanId: scanRecord._id,
        servingSize,
        consumed: false,
        source: 'label_ocr'
      }
    });

  } catch (error: any) {
    console.error('Label analyze error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ─── POST /scan/ai-recommend ─────────────────────────────────────────────────
// Taranan ürün için kullanıcının profiline göre kişiselleştirilmiş AI önerisi üretir.
// Kalori hedefi, alerjenler ve makro hedefleri göz önüne alınır.
export const getAIRecommendation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { foodId, servingSize = 100 } = req.body;

    if (!foodId) {
      return res.status(400).json({ status: 'error', message: 'foodId gereklidir.' });
    }

    const [user, food] = await Promise.all([
      User.findById(userId),
      Food.findById(foodId)
    ]);

    if (!user || !food) {
      return res.status(404).json({ status: 'error', message: 'Kullanıcı veya ürün bulunamadı.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_REPORT || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const calorieGoal = user.calorieGoal || 2000;
    const totalServingCalories = Math.round((food.calories * servingSize) / 100);
    const totalServingProtein = ((food.protein * servingSize) / 100).toFixed(1);
    const totalServingCarbs = ((food.carbohydrates * servingSize) / 100).toFixed(1);
    const totalServingFat = ((food.fat * servingSize) / 100).toFixed(1);

    const prompt = `
Sen bir diyetisyen yapay zekasısın. Aşağıdaki ürün ve kullanıcı bilgisine göre kısa, dostane ve pratik öneriler ver.

Ürün: ${food.productName}
Porsiyon: ${servingSize}g
Kalori (porsiyon): ${totalServingCalories} kcal
Protein: ${totalServingProtein}g, Karbonhidrat: ${totalServingCarbs}g, Yağ: ${totalServingFat}g
İçindekiler: ${food.ingredients.slice(0, 15).join(', ')}

Kullanıcı:
- Günlük kalori hedefi: ${calorieGoal} kcal
- Alerjiler: ${user.allergies?.length ? user.allergies.join(', ') : 'Yok'}
- Hedef: ${user.goal || 'healthy'} (lose: kilo vermek, maintain: korumak, gain: almak, healthy: sağlıklı)
- Aktivite: ${user.activityLevel || 'moderate'}

Lütfen şu alanları içeren bir JSON döndür (Türkçe yaz):
{
  "dailyLimit": "Bu üründen günde kaç kere veya kaç porsiyon yenebilir (örn: \"Günde 1 porsiyon idealdir\")",
  "calorieContext": "Bu porsiyonun günlük kalori hedefinin yüzde kaçını karşıladığı ve bu bağlamda değerlendirme (örn: \"Hedefinizin %18'i — makul bir atıştırmalık\")",
  "goalFit": "Kullanıcının hedefine (kilo verme/alma/koruma) uygunluk değerlendirmesi",
  "bestTimeToEat": "Bu ürünü hangi öğünde veya ne zaman yemek daha uygun (sabah, öğle, akşam, egzersiz öncesi/sonrası vb.)",
  "healthySwap": "Varsa daha sağlıklı bir alternatif önerisi veya ürünü daha sağlıklı tüketme yolu",
  "tipEmoji": "Kısa ve pozitif bir beslenme ipucu (1-2 cümle, emoji kullanabilirsin)",
  "overallScore": "1-10 arası bu ürünün genel sağlık skoru (sayı olarak)",
  "scoreLabel": "Skora göre kısa etiket (Mükemmel / İyi / Kabul Edilebilir / Dikkatli Tüket / Kaçın)"
}

Sadece JSON döndür.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const recommendation = JSON.parse(text);

    res.status(200).json({
      status: 'success',
      data: recommendation
    });

  } catch (error: any) {
    console.error('AI recommendation error:', error);
    // Fallback öneri
    res.status(200).json({
      status: 'success',
      data: {
        dailyLimit: 'Günde 1-2 porsiyon tüketebilirsiniz.',
        calorieContext: 'Kalori hedefine uygun tüketim yapın.',
        goalFit: 'Dengeli beslenme programınıza dahil edebilirsiniz.',
        bestTimeToEat: 'Öğün aralarında atıştırmalık olarak tüketilebilir.',
        healthySwap: 'Daha doğal alternatiflerini tercih etmeye çalışın.',
        tipEmoji: '💪 Her öğünde çeşitliliği korumak sağlıklı beslenmenin temelidir.',
        overallScore: 5,
        scoreLabel: 'Kabul Edilebilir'
      }
    });
  }
};
