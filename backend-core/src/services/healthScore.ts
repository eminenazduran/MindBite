// Sağlık puanı hesaplama servisi.
//
// Girdi: bir zaman aralığı içindeki scan kayıtları (populate edilmiş foodId) +
// kullanıcının günlük kalori hedefi.
// Çıktı: 0-100 arası kompozit puan + bileşen kırılımı.
//
// Formül (toplam 100 + alerjen cezası):
//   - 25 pt: Kalori dengesi (hedefe yakınlık)
//   - 25 pt: Makro dağılımı (TÜBER 2022 önerilen oran)
//   - 25 pt: Gıda kalitesi (kcal-ağırlıklı quality ortalaması)
//   - 15 pt: Çeşitlilik (farklı gıda grubu sayısı)
//   - 10 pt: Risk güvenliği (HIGH risk yoksa tam puan)
//
// Kayıt yoksa 0 değil "null" döner; UI ayrı göstersin.

import { IScanHistory } from '../models/ScanHistory';
import { IFood } from '../models/Food';

export interface HealthScoreBreakdown {
    calories: { value: number; weight: number; actual: number; target: number };
    macros: { value: number; weight: number; protein_pct: number; carb_pct: number; fat_pct: number };
    quality: { value: number; weight: number; average: number };
    variety: { value: number; weight: number; categoryCount: number; categories: string[] };
    safety: { value: number; weight: number; highRiskCount: number };
}

export interface HealthScoreResult {
    score: number; // 0 - 100
    breakdown: HealthScoreBreakdown;
    totals: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        itemCount: number;
    };
}

type PopulatedScan = IScanHistory & { foodId: IFood | null };

const clamp = (n: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, n));

// 1) Kalori dengesi — hedefin ±%15 bandında tam puan, uzaklaştıkça düşer.
// %50 altında veya %150 üstünde 0 puan.
const calorieBalanceScore = (actual: number, target: number): number => {
    if (target <= 0) return 0;
    const ratio = actual / target;
    if (ratio < 0.5 || ratio > 1.5) return 0;

    // İdeal aralık %85-115 → 1.0 katsayısı
    if (ratio >= 0.85 && ratio <= 1.15) return 1;

    // Dışında lineer düşüş
    if (ratio < 0.85) return clamp((ratio - 0.5) / (0.85 - 0.5), 0, 1);
    return clamp((1.5 - ratio) / (1.5 - 1.15), 0, 1);
};

// 2) Makro dağılımı — TÜBER 2022 önerilen aralıkları.
//    Protein %15-25 (ideal 20), Karb %45-60 (ideal 52), Yağ %20-35 (ideal 28)
const macroDistributionScore = (
    calories: number,
    protein: number,
    carbs: number,
    fat: number
): { score: number; proteinPct: number; carbPct: number; fatPct: number } => {
    if (calories <= 0) return { score: 0, proteinPct: 0, carbPct: 0, fatPct: 0 };

    // Kalori → makro kalori (1g protein=4, karb=4, yağ=9)
    const pKcal = protein * 4;
    const cKcal = carbs * 4;
    const fKcal = fat * 9;
    const totalMacroKcal = pKcal + cKcal + fKcal || calories;

    const pPct = (pKcal / totalMacroKcal) * 100;
    const cPct = (cKcal / totalMacroKcal) * 100;
    const fPct = (fKcal / totalMacroKcal) * 100;

    // Her makro için ideal noktaya yakınlık (0-1)
    const proximity = (actual: number, ideal: number, tolerance: number): number => {
        const diff = Math.abs(actual - ideal);
        return clamp(1 - diff / tolerance, 0, 1);
    };

    const pScore = proximity(pPct, 20, 15); // ±15 puan tolerans
    const cScore = proximity(cPct, 52, 20);
    const fScore = proximity(fPct, 28, 18);

    return {
        score: (pScore + cScore + fScore) / 3,
        proteinPct: Math.round(pPct),
        carbPct: Math.round(cPct),
        fatPct: Math.round(fPct)
    };
};

// 3) Kalite — her kalemin quality değerini kcal ağırlığı ile ortala.
// quality yoksa 0.5 (nötr) varsay.
const qualityScore = (scans: PopulatedScan[]): { score: number; average: number } => {
    let weightedSum = 0;
    let weightTotal = 0;

    for (const scan of scans) {
        const food = scan.foodId;
        if (!food) continue;

        const servingFactor = (scan.servingSize || 100) / 100;
        const kcal = (food.calories || 0) * servingFactor;
        if (kcal <= 0) continue;

        const q = typeof food.quality === 'number' ? food.quality : 0.5;
        weightedSum += q * kcal;
        weightTotal += kcal;
    }

    const avg = weightTotal > 0 ? weightedSum / weightTotal : 0;
    return { score: avg, average: avg };
};

// 4) Çeşitlilik — farklı gıda grubu sayısı.
const varietyScore = (scans: PopulatedScan[]): { score: number; count: number; cats: string[] } => {
    const categories = new Set<string>();
    for (const scan of scans) {
        const cat = scan.foodId?.category;
        if (cat) categories.add(cat);
    }
    const count = categories.size;

    // 5+ grup → tam puan, lineer düşüş
    const score = clamp(count / 5, 0, 1);
    return { score, count, cats: Array.from(categories) };
};

// 5) Güvenlik — HIGH risk tarama sayısı cezası.
const safetyScore = (scans: PopulatedScan[]): { score: number; highCount: number } => {
    const highCount = scans.filter((s) => s.analysisResult?.riskLevel === 'HIGH').length;
    // 0 HIGH → 1.0, her HIGH -0.3, minimum 0
    const score = clamp(1 - highCount * 0.3, 0, 1);
    return { score, highCount };
};

export const calculateHealthScore = (
    scans: PopulatedScan[],
    calorieGoal: number
): HealthScoreResult | null => {
    if (!scans || scans.length === 0) return null;

    // Toplamları çıkar
    let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
    for (const scan of scans) {
        const food = scan.foodId;
        if (!food) continue;
        const factor = (scan.servingSize || 100) / 100;
        totalKcal += (food.calories || 0) * factor;
        totalP += (food.protein || 0) * factor;
        totalC += (food.carbohydrates || 0) * factor;
        totalF += (food.fat || 0) * factor;
    }

    const calScore = calorieBalanceScore(totalKcal, calorieGoal);
    const macroRes = macroDistributionScore(totalKcal, totalP, totalC, totalF);
    const qRes = qualityScore(scans);
    const vRes = varietyScore(scans);
    const sRes = safetyScore(scans);

    // Ağırlıklı toplam (toplam 100)
    const rawScore =
        calScore * 25 +
        macroRes.score * 25 +
        qRes.score * 25 +
        vRes.score * 15 +
        sRes.score * 10;

    const score = Math.round(clamp(rawScore, 0, 100));

    return {
        score,
        breakdown: {
            calories: {
                value: Math.round(calScore * 25),
                weight: 25,
                actual: Math.round(totalKcal),
                target: calorieGoal
            },
            macros: {
                value: Math.round(macroRes.score * 25),
                weight: 25,
                protein_pct: macroRes.proteinPct,
                carb_pct: macroRes.carbPct,
                fat_pct: macroRes.fatPct
            },
            quality: {
                value: Math.round(qRes.score * 25),
                weight: 25,
                average: Math.round(qRes.average * 100) / 100
            },
            variety: {
                value: Math.round(vRes.score * 15),
                weight: 15,
                categoryCount: vRes.count,
                categories: vRes.cats
            },
            safety: {
                value: Math.round(sRes.score * 10),
                weight: 10,
                highRiskCount: sRes.highCount
            }
        },
        totals: {
            calories: Math.round(totalKcal),
            protein: Math.round(totalP * 10) / 10,
            carbohydrates: Math.round(totalC * 10) / 10,
            fat: Math.round(totalF * 10) / 10,
            itemCount: scans.length
        }
    };
};

// Gün gün grupla — 7 günlük hareketli ortalama için.
export const calculateDailyScores = (
    scans: PopulatedScan[],
    calorieGoal: number,
    days: number = 7
): Array<{ date: string; score: number | null; calories: number }> => {
    const results: Array<{ date: string; score: number | null; calories: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        const dayScans = scans.filter((s) => {
            const t = new Date((s as any).createdAt).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime();
        });

        const result = calculateHealthScore(dayScans, calorieGoal);
        results.push({
            date: dayStart.toISOString().slice(0, 10),
            score: result?.score ?? null,
            calories: result?.totals.calories ?? 0
        });
    }

    return results;
};
