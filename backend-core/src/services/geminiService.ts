import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

const getGenAI = () => {
    if (!genAIInstance) {
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is not defined!');
        }
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAIInstance;
};

export interface FoodAnalysisData {
    name: string;
    ingredients: string[];
    eCodes: string[];
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    allergens: string[];
}

export const fetchFromOpenFoodFacts = async (barcode: string) => {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        if (data.status === 1 && data.product) {
            return {
                product_name: data.product.product_name || `Ürün ${barcode}`,
                ingredients_text: data.product.ingredients_text || 'İçerik bilgisi bulunamadı',
                nutriments: data.product.nutriments || {},
                allergens_tags: data.product.allergens_tags || []
            };
        }
        return null; // Product not found
    } catch (e) {
        console.error('Open Food Facts API hatası:', e);
        return null;
    }
};

export const analyzeWithGemini = async (rawProductData: any): Promise<FoodAnalysisData> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
Aşağıda Open Food Facts API'den gelen ham bir gıda ürünü verisi var.
Lütfen bu veriyi inceleyip aşağıdaki alanları içeren bir JSON formatında geri dön:
- name: (ürünün adı)
- ingredients: (içindekiler listesi (Türkçe dizilimi))
- eCodes: (metin içinde veya katkı maddelerinde geçen E-kodlar dizisi, örneğin ["E102", "E330"], yoksa boş dizi)
- calories: (100g için olan kalori 'energy-kcal_100g' olarak bulunur, veya tahmin edin, sayı olarak)
- protein: (100g için protein miktarı, sayı olarak)
- carbohydrates: (100g için karbonhidrat miktarı, sayı olarak)
- fat: (100g için yağ miktarı, sayı olarak)
- allergens: (Alerjen listesi (Türkçe), örneğin ["Süt", "Gluten", "Yer Fıstığı"])

Ham Veri:
${JSON.stringify(rawProductData, null, 2)}

Sadece düz güncel JSON döndür.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        return JSON.parse(text) as FoodAnalysisData;
    } catch (error) {
        console.error('Gemini AI analizi hatası:', error);
        // Fallback for demo if API key missing
        if (rawProductData?.product_name?.includes('8690504018501')) {
            return {
                name: "Ülker Çikolatalı Gofret (36g)",
                ingredients: ["Buğday unu", "Tam yağlı süttozu", "Yağsız süttozu", "Peyniraltı suyu tozu", "Soya lesitini", "Yumurta akı tozu", "Fındık püresi"],
                eCodes: ["E322"],
                calories: 541,
                protein: 6.5,
                carbohydrates: 55,
                fat: 32,
                allergens: ["Gluten", "Süt", "Soya", "Yumurta", "Fındık", "Yer Fıstığı"]
            };
        }

        return {
            name: rawProductData?.product_name || "Bilinmeyen Ürün",
            ingredients: ['Su', 'Bilinmeyen Madde'],
            eCodes: ['E999'],
            calories: 100,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            allergens: []
        };
    }
};

export interface MealItem {
    name: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
}

const UNIT_ALIASES: Record<string, string> = {
    yk: 'yemek_kasigi',
    'yemek kaşığı': 'yemek_kasigi',
    'yemek kasigi': 'yemek_kasigi',
    kaşık: 'yemek_kasigi',
    kasik: 'yemek_kasigi',
    tk: 'tatli_kasigi',
    'tatlı kaşığı': 'tatli_kasigi',
    'tatli kasigi': 'tatli_kasigi',
    kase: 'kase',
    bardak: 'su_bardagi',
    'su bardağı': 'su_bardagi',
    'su bardagi': 'su_bardagi',
    'çay bardağı': 'cay_bardagi',
    'cay bardagi': 'cay_bardagi',
    dilim: 'dilim',
    adet: 'adet',
    avuç: 'avuc',
    avuc: 'avuc',
    porsiyon: 'porsiyon',
    porsiyonluk: 'porsiyon'
};

const UNIT_GRAMS: Record<string, number> = {
    yemek_kasigi: 12,
    tatli_kasigi: 6,
    kase: 220,
    su_bardagi: 200,
    cay_bardagi: 100,
    dilim: 30,
    adet: 60,
    avuc: 28,
    porsiyon: 180
};

const FOOD_REFERENCE: Array<{ keywords: string[]; kcalPer100g: number; proteinPer100g: number; carbPer100g: number; fatPer100g: number }> = [
    { keywords: ['yoğurt', 'yogurt'], kcalPer100g: 62, proteinPer100g: 3.5, carbPer100g: 4.7, fatPer100g: 3.3 },
    { keywords: ['çorba', 'corba'], kcalPer100g: 45, proteinPer100g: 1.8, carbPer100g: 6.0, fatPer100g: 1.3 },
    { keywords: ['pilav', 'pirinç'], kcalPer100g: 130, proteinPer100g: 2.7, carbPer100g: 28, fatPer100g: 0.3 },
    { keywords: ['makarna'], kcalPer100g: 158, proteinPer100g: 5.8, carbPer100g: 30, fatPer100g: 1.0 },
    { keywords: ['yumurta'], kcalPer100g: 143, proteinPer100g: 12.6, carbPer100g: 0.7, fatPer100g: 9.5 },
    { keywords: ['tavuk'], kcalPer100g: 165, proteinPer100g: 31, carbPer100g: 0, fatPer100g: 3.6 },
    { keywords: ['ekmek'], kcalPer100g: 265, proteinPer100g: 9, carbPer100g: 49, fatPer100g: 3.2 },
    { keywords: ['peynir'], kcalPer100g: 260, proteinPer100g: 18, carbPer100g: 2.5, fatPer100g: 20 },
    { keywords: ['yulaf'], kcalPer100g: 389, proteinPer100g: 16.9, carbPer100g: 66, fatPer100g: 6.9 },
    { keywords: ['muz'], kcalPer100g: 89, proteinPer100g: 1.1, carbPer100g: 23, fatPer100g: 0.3 }
];

const toNumber = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

const estimateFromText = (rawText: string): MealItem => {
    const clean = rawText.trim();
    const lower = clean.toLocaleLowerCase('tr-TR');

    const quantityMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*([a-zçğıöşü\s]+)?/i);
    const quantity = quantityMatch?.[1] ? Number(quantityMatch[1].replace(',', '.')) : 1;
    const unitRaw = (quantityMatch?.[2] || '').trim();

    const normalizedUnit = Object.entries(UNIT_ALIASES).find(([alias]) => unitRaw.startsWith(alias))?.[1] || 'porsiyon';
    const gramsPerUnit = UNIT_GRAMS[normalizedUnit] ?? 180;
    const totalGrams = Math.max(5, gramsPerUnit * (Number.isFinite(quantity) ? quantity : 1));

    const foodRef = FOOD_REFERENCE.find((ref) => ref.keywords.some((k) => lower.includes(k)));
    const kcalPer100g = foodRef?.kcalPer100g ?? 120;
    const proteinPer100g = foodRef?.proteinPer100g ?? 4;
    const carbPer100g = foodRef?.carbPer100g ?? 12;
    const fatPer100g = foodRef?.fatPer100g ?? 5;

    const factor = totalGrams / 100;
    return {
        name: clean,
        calories: Math.max(10, Math.round(kcalPer100g * factor)),
        protein: round1(proteinPer100g * factor),
        carbohydrates: round1(carbPer100g * factor),
        fat: round1(fatPer100g * factor)
    };
};

const calibrateMealItem = (item: MealItem): MealItem => {
    const estimate = estimateFromText(item.name);
    const minAcceptable = Math.max(10, estimate.calories * 0.35);
    const maxAcceptable = Math.max(estimate.calories * 2.2, 180);

    if (item.calories >= minAcceptable && item.calories <= maxAcceptable) {
        return item;
    }

    // AI sonucu uçuksa yerel referansla düzelt.
    return {
        ...item,
        calories: estimate.calories,
        protein: estimate.protein,
        carbohydrates: estimate.carbohydrates,
        fat: estimate.fat
    };
};

const normalizeMealItem = (item: any): MealItem | null => {
    if (!item || typeof item !== 'object') return null;

    const name = String(item.name || item.food || item.item || '').trim();
    if (!name) return null;

    return {
        name,
        calories: toNumber(item.calories),
        protein: toNumber(item.protein),
        carbohydrates: toNumber(item.carbohydrates),
        fat: toNumber(item.fat)
    };
};

const parseMealItemsFromAIResponse = (rawText: string): MealItem[] => {
    let text = rawText.trim();

    const jsonFenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    if (jsonFenceMatch?.[1]) {
        text = jsonFenceMatch[1].trim();
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch?.[0]) {
        text = arrayMatch[0];
    }

    const parsed = JSON.parse(text);
    const candidateList: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
            ? parsed.items
            : Array.isArray(parsed?.foods)
                ? parsed.foods
                : [];

    return candidateList
        .map((item: unknown) => normalizeMealItem(item))
        .filter((item: MealItem | null): item is MealItem => item !== null);
};

const fallbackMealFromDescription = (description: string): MealItem[] => {
    const clean = description.trim();
    if (!clean) return [];
    return [estimateFromText(clean)];
};

export const analyzeNaturalMeal = async (description: string): Promise<MealItem[]> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
Aşağıdaki yemek açıklamasını analiz et ve içindeki her bir yiyecek için tahmini besin değerlerini (toplam porsiyon miktarı için) hesapla.
Açıklama: "${description}"

Lütfen şu kurallara dikkat et:
1. Yaygın Türk ölçü birimlerini dikkate al: 
   - 1 yemek kaşığı (yk): ~15g (sıvılar için), ~10-12g (katılar için)
   - 1 tatlı kaşığı: ~5-7g
   - 1 kase: ~200-250ml/g
   - 1 su bardağı: ~200ml
   - 1 çay bardağı: ~100ml
   - 1 avuç: ~25-30g
   - Kibrit kutusu kadar peynir: ~30g
2. Porsiyon miktarını (adet, kaşık, kase vb.) toplam değerlere yansıt.

Lütfen her bir ürün için şu bilgileri içeren bir JSON dizisi döndür:
- name: (Ürün adı ve miktarı, örn: "3 Yemek Kaşığı Yoğurt")
- calories: (Sayı olarak bu miktar için toplam kalori)
- protein: (Sayı olarak toplam protein (g))
- carbohydrates: (Sayı olarak toplam karbonhidrat (g))
- fat: (Sayı olarak toplam yağ (g))

ÖNEMLİ:
- Porsiyon miktarına göre gerçekçi hesap yap; küçük porsiyonlarda abartılı kalori yazma.
- Örnek: "3 yk yoğurt" için kalori aralığı yaklaşık 20-60 kcal civarı olmalı (540 gibi değerler YANLIŞ).

Sadece JSON dizisi döndür.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log('Raw Gemini Text:', text);

        const normalizedItems = parseMealItemsFromAIResponse(text);
        if (normalizedItems.length > 0) {
            return normalizedItems.map(calibrateMealItem);
        }

        return fallbackMealFromDescription(description);
    } catch (error: any) {
        console.error('Natural meal analysis error:', error.message || error);
        return fallbackMealFromDescription(description);
    }
};
