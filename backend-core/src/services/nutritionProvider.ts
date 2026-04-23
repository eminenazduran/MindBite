import { Food } from '../models/Food';
import { TR_FOOD_SEED, FoodCategory } from './trFoodSeed';
import type { UnitKey } from './unitParser';

// Bir gıdanın 100g başına besin değerleri.
export interface Nutrition100g {
    kcal: number;
    protein: number;
    carbohydrates: number;
    fat: number;
}

export interface NutritionLookupResult {
    source: 'cache' | 'seed' | 'off' | 'default';
    matchedName: string;
    per100g: Nutrition100g;
    // Gıdaya özgü porsiyon gramajları (varsa parser'ın generic değerini ezer).
    portions?: Partial<Record<UnitKey, number>>;
    // Sağlık puanı için sınıflama
    category?: FoodCategory | string;
    quality?: number; // 0.0 - 1.0
}

const DEFAULT_FOOD: Nutrition100g = { kcal: 120, protein: 4, carbohydrates: 12, fat: 5 };

// Türkçe karakter duyarsız normalize (arama için)
const normalize = (text: string): string =>
    text
        .toLocaleLowerCase('tr-TR')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/[^a-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const genericBarcodeFor = (query: string): string =>
    `GENERIC:${normalize(query).replace(/\s+/g, '-') || 'unknown'}`;

// 1) MongoDB cache: daha önce kaydedilmiş generic food kayıtlarını kullan.
const lookupInCache = async (query: string): Promise<NutritionLookupResult | null> => {
    const barcode = genericBarcodeFor(query);
    const cached = await Food.findOne({ barcode, isGeneric: true });
    if (!cached) return null;

    return {
        source: 'cache',
        matchedName: cached.productName,
        per100g: {
            kcal: cached.calories || 0,
            protein: cached.protein || 0,
            carbohydrates: cached.carbohydrates || 0,
            fat: cached.fat || 0
        },
        category: cached.category,
        quality: typeof cached.quality === 'number' ? cached.quality : undefined
    };
};

// 2) Seed (yerel TR gıda referans tablosu)
const lookupInSeed = (query: string): NutritionLookupResult | null => {
    const needle = normalize(query);
    if (!needle) return null;

    // Önce tam sözcük eşleşmesi, sonra kısmi içerme
    const direct = TR_FOOD_SEED.find((row) =>
        row.keywords.some((k) => {
            const kk = normalize(k);
            return needle === kk || needle.split(' ').includes(kk);
        })
    );
    const partial =
        direct ||
        TR_FOOD_SEED.find((row) => row.keywords.some((k) => needle.includes(normalize(k))));

    if (!partial) return null;

    return {
        source: 'seed',
        matchedName: partial.name,
        per100g: {
            kcal: partial.kcal,
            protein: partial.protein,
            carbohydrates: partial.carbohydrates,
            fat: partial.fat
        },
        portions: partial.portions,
        category: partial.category,
        quality: partial.quality
    };
};

// 3) Open Food Facts text search (ücretsiz, API key istemez)
const lookupInOpenFoodFacts = async (query: string): Promise<NutritionLookupResult | null> => {
    try {
        const url =
            `https://world.openfoodfacts.org/cgi/search.pl` +
            `?search_terms=${encodeURIComponent(query)}` +
            `&search_simple=1&action=process&json=1&page_size=10` +
            `&sort_by=unique_scans_n`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data: any = await response.json();
        const products: any[] = Array.isArray(data?.products) ? data.products : [];

        // 100g başına kcal bilgisi olan ilk sağlam ürünü seç
        const candidate = products.find((p) => {
            const kcal = Number(p?.nutriments?.['energy-kcal_100g']);
            return Number.isFinite(kcal) && kcal > 0 && kcal < 900;
        });

        if (!candidate) return null;

        const n = candidate.nutriments || {};
        const kcal = Number(n['energy-kcal_100g']) || 0;
        const sugar = Number(n['sugars_100g']) || 0;
        const satFat = Number(n['saturated-fat_100g']) || 0;
        const salt = Number(n['salt_100g']) || 0;
        const fiber = Number(n['fiber_100g']) || 0;

        // OFF'ta kategori bilgisi yok; "işlenmiş" kabul edip Nutri-Score-benzeri
        // basit bir kalite tahmini yap. Yüksek şeker/doymuş yağ düşürür.
        let quality = 0.5;
        if (sugar >= 15) quality -= 0.2;
        if (satFat >= 5) quality -= 0.15;
        if (salt >= 1.5) quality -= 0.1;
        if (fiber >= 5) quality += 0.15;
        if (kcal >= 400) quality -= 0.1;
        quality = Math.max(0.1, Math.min(0.8, quality));

        return {
            source: 'off',
            matchedName: candidate.product_name || query,
            per100g: {
                kcal,
                protein: Number(n['proteins_100g']) || 0,
                carbohydrates: Number(n['carbohydrates_100g']) || 0,
                fat: Number(n['fat_100g']) || 0
            },
            category: 'katki',
            quality
        };
    } catch (error) {
        console.error('OpenFoodFacts text search error:', error);
        return null;
    }
};

// Sonucu Mongo cache'ine yaz (bir dahaki seferde hızlı olsun).
const saveToCache = async (query: string, result: NutritionLookupResult): Promise<void> => {
    try {
        const barcode = genericBarcodeFor(query);
        const existing = await Food.findOne({ barcode });
        if (existing) return;

        await Food.create({
            barcode,
            productName: result.matchedName || query,
            ingredients: [query],
            calories: result.per100g.kcal,
            protein: result.per100g.protein,
            carbohydrates: result.per100g.carbohydrates,
            fat: result.per100g.fat,
            eCodes: [],
            allergens: [],
            isGeneric: true,
            category: result.category,
            quality: result.quality,
            analysisResult: {
                isSafe: true,
                riskLevel: 'LOW',
                aiComment: `Otomatik oluşturuldu (${result.source}).`
            }
        });
    } catch (error) {
        console.error('Nutrition cache save error:', error);
    }
};

// Ana arama fonksiyonu: seed → cache → OFF → default
// Seed'i cache'den önce kontrol ediyoruz; böylece TR gıda tablosundaki
// gıdaya-özgü porsiyon gramajları (yoğurt 1 yk = 45g gibi) her zaman kullanılır.
export const getNutritionPer100g = async (query: string): Promise<NutritionLookupResult> => {
    if (!query?.trim()) {
        return {
            source: 'default',
            matchedName: 'Bilinmeyen gıda',
            per100g: { ...DEFAULT_FOOD }
        };
    }

    const seedHit = lookupInSeed(query);
    if (seedHit) return seedHit;

    const cacheHit = await lookupInCache(query);
    if (cacheHit) return cacheHit;

    const offHit = await lookupInOpenFoodFacts(query);
    if (offHit) {
        await saveToCache(query, offHit);
        return offHit;
    }

    return {
        source: 'default',
        matchedName: query,
        per100g: { ...DEFAULT_FOOD }
    };
};
