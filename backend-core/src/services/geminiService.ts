import dotenv from "dotenv";
dotenv.config();

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export interface FoodAnalysisData {
    isFoodProduct?: boolean;
    name: string;
    ingredients: string[];
    eCodes: string[];
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    allergens: string[];
}

export interface MealItem {
    name: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
}

// ─── Gemini REST API Yardımcısı ───────────────────────────────────────────────

const callGeminiREST = async (prompt: string): Promise<string> => {
    const apiKey = process.env.GEMINI_KEY_SCAN;
    if (!apiKey) throw new Error("GEMINI_KEY_SCAN .env dosyasında bulunamadı!");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
        }
    };

    console.log(`[Gemini REST] İstek gönderiliyor: ${url.split('?')[0]}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const responseText = await res.text();
    console.log(`[Gemini REST] HTTP Durumu: ${res.status} ${res.statusText}`);

    if (!res.ok) {
        console.error(`[Gemini REST] HAM HATA CEVABI:`, responseText.slice(0, 500));
        const errData = JSON.parse(responseText);
        const errMsg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        const errCode = errData?.error?.code || res.status;
        throw new Error(`[${errCode}] ${errMsg}`);
    }

    const data = JSON.parse(responseText);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ─── Open Food Facts ──────────────────────────────────────────────────────────

export const fetchFromOpenFoodFacts = async (barcode: string) => {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const data = await response.json() as any;
        return data.product || null;
    } catch (e) {
        console.error('Open Food Facts API hatası:', e);
        return null;
    }
};

// ─── Etiket / İçindekiler Analizi ─────────────────────────────────────────────

export const analyzeWithGemini = async (rawProductData: any): Promise<FoodAnalysisData> => {
    const prompt = `
Aşağıdaki metni (içindekiler veya OCR sonucu) analiz et.
Öncelikle metnin gerçekten bir gıda ürününe ait bir içerik listesi, besin tablosu veya etiket olup olmadığını kontrol et. 
Eğer gönderilen metin gıda ile tamamen alakasızsa (örn. manzara fotoğrafı metni, rastgele kelimeler, kitap sayfası) veya hiçbir besin/içindekiler bilgisi içermiyorsa, "isFoodProduct" alanını "false" yap ve diğer alanları boş bırak.
Eğer bir gıda ürünüyse "isFoodProduct" alanını "true" yap.

SADECE ve SADECE aşağıdaki JSON formatında cevap ver. Markdown kullanma, sadece JSON yaz.

{
  "isFoodProduct": true,
  "name": "Ürün Adı",
  "ingredients": ["Madde 1", "Madde 2"],
  "eCodes": ["E102", "E385"],
  "calories": 0,
  "protein": 0,
  "carbohydrates": 0,
  "fat": 0,
  "allergens": ["Alerjen 1"]
}

E-kodları metinden çıkarırken Ksantan Gam (E415), Kalsiyum Disodyum EDTA (E385) gibi maddeleri de ekle.

Ham Veri:
${JSON.stringify(rawProductData, null, 2)}
`;

    try {
        const text = await callGeminiREST(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI geçerli JSON üretemedi.");
        const parsed = JSON.parse(jsonMatch[0]) as FoodAnalysisData;
        
        if (parsed.isFoodProduct === false) {
            throw new Error('NOT_FOOD_PRODUCT');
        }
        
        return parsed;
    } catch (error: any) {
        const msg = error?.message || String(error);
        console.error('[analyzeWithGemini] HATA:', msg);

        if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many')) {
            throw new Error('Yapay zeka limiti doldu. Lütfen 1-2 dakika bekleyip tekrar deneyin.');
        }
        if (msg.includes('403') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('permission')) {
            throw new Error('API anahtarı geçersiz veya yetkisiz. .env dosyasını kontrol edin.');
        }
        if (msg.includes('404')) {
            throw new Error('Gemini modeli bulunamadı. Model adı hatalı olabilir.');
        }
        throw new Error(`Gemini Hatası: ${msg.slice(0, 200)}`);
    }
};

// ─── Doğal Öğün Analizi ───────────────────────────────────────────────────────

export const parseNaturalMeal = async (description: string): Promise<MealItem[]> => {
    const prompt = `
Aşağıdaki doğal dille yazılmış öğün açıklamasını analiz et.
ÖNEMLİ: Türkiye standartlarını kullan (1 kase yoğurt=200g/130kcal, 1 tabak makarna=200g/320kcal). Mutlaka PİŞMİŞ değerleri baz al.
Sadece JSON dizisi döndür, başka hiçbir şey yazma:
[{ "name": "Yiyecek Adı", "calories": 0, "protein": 0, "carbohydrates": 0, "fat": 0 }]

Öğün: "${description}"
`;

    try {
        const text = await callGeminiREST(prompt);
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error('parseNaturalMeal hatası:', e);
        return [];
    }
};
