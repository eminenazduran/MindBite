import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

const getGenAI = () => {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAIInstance;
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
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
Aşağıda bir kullanıcının bugünkü toplam beslenme verileri ve hedefleri var. 
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

Sadece JSON döndür.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Advice generation error:', error);
    return {
      summary: "Beslenme verilerin inceleniyor. Hedeflerine odaklanmaya devam et!",
      recommendations: ["Daha fazla su içmeyi unutma.", "Protein alımına dikkat et."],
      tips: ["Yürüyüş yapmayı ihmal etme."]
    };
  }
};
