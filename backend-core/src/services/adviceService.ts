import { GoogleGenerativeAI } from '@google/generative-ai';

const getGenAI = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey || '');
};

export interface NutritionalAdvice {
  summary: string;
  recommendations: string[];
  tips: string[];
}

export const generateNutritionalAdvice = async (
  totalNutrition: { calories: number; protein: number; carbohydrates: number; fat: number },
  goals: { calories: number; protein: number; carbohydrates: number; fat: number },
  foodHistory: string[]
): Promise<NutritionalAdvice> => {
  // Kota (429) hatalarını önlemek için alternatif API key'leri sırayla deneyelim
  const keys = [process.env.GEMINI_KEY_CHAT, process.env.GEMINI_KEY_SCAN, process.env.GEMINI_KEY_REPORT].filter(Boolean) as string[];
  
  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = getGenAI(keys[i]);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest', generationConfig: { responseMimeType: "application/json" } });
      
      const prompt = `Aşağıda bir kullanıcının bugünkü toplam beslenme verileri ve hedefleri var. 
Ayrıca bugün tükettiği ürünlerin listesi de aşağıdadır.

Bugünkü Tüketim:
- Kalori: ${totalNutrition.calories} / ${goals.calories} kcal
- Protein: ${totalNutrition.protein} / ${goals.protein} g
- Karbonhidrat: ${totalNutrition.carbohydrates} / ${goals.carbohydrates} g
- Yağ: ${totalNutrition.fat} / ${goals.fat} g

Tüketilen Ürünler:
${foodHistory.join(', ')}

Lütfen bu verileri analiz et ve kullanıcıya profesyonel, samimi ve yol gösterici bir geri bildirim hazırla. 
Şu formatta bir JSON döndür:
- summary: (Genel durum özeti, örn: "Bugün karbonhidrat ağırlıklı beslenmişsin.")
- recommendations: (Neyi azaltmalı veya arttırmalı? Örn: ["Protein alımını 20g arttırmalısın", "Daha fazla lifli gıda tüket"])
- tips: (Pratik tavsiyeler, örn: ["Akşam yemeğinde tavuk göğsü tercih edebilirsin.", "Şekerli içecekler yerine maden suyu iç."])

Sadece JSON döndür.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error: any) {
      console.error(`Advice generation error with key index ${i}:`, error.message);
      // Eğer son key değilse döngüye devam et (diğer key'i dene)
      if (i === keys.length - 1) {
        // Son key de hata verirse fallback döndür
        console.error('All API keys exhausted or failed.');
      }
    }
  }

  // Tüm denemeler başarısız olursa
  return {
    summary: "Beslenme verilerin inceleniyor. Hedeflerine odaklanmaya devam et!",
    recommendations: ["Daha fazla su içmeyi unutma.", "Protein alımına dikkat et."],
    tips: ["Yürüyüş yapmayı ihmal etme."]
  };
};
