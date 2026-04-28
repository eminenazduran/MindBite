import { IUser } from '../models/User';
import { IFood } from '../models/Food';
import { detectRiskyAdditives, escalateRiskLevel, DetectedRisk } from './riskyAdditives';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AnalysisResult {
  riskLevel: RiskLevel;
  warnings: string[];
  safeToConsume: boolean;
  // Yeni: kullanıcı alerjenlerinden bağımsız, genel sağlık riski taşıyan maddeler
  riskyAdditives: DetectedRisk[];
  // Kullanıcı profilinden eşleşen alerjenler (ayrıca tutuyoruz, frontend ayrı render)
  matchedAllergens: string[];
}

// Alerjen anahtar kelimeleri (İçindekiler listesinde aramak için)
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'Süt Ürünleri': ['süt', 'peynir', 'yoğurt', 'kaymak', 'tereyağ', 'laktoz', 'kazein', 'peyniraltı', 'süttozu', 'milk', 'dairy'],
  'Gluten': ['buğday', 'arpa', 'çavdar', 'yulaf', 'gluten', 'un', 'wheat', 'barley'],
  'Yer Fıstığı': ['fıstık', 'yerfıstığı', 'peanut'],
  'Yumurta': ['yumurta', 'albümin', 'egg', 'albumin'],
  'Deniz Ürünleri': ['balık', 'karides', 'midye', 'ıstakoz', 'deniz', 'fish', 'seafood'],
  'Soya': ['soya', 'soy', 'lecithin'],
  'Kuruyemiş': ['fındık', 'ceviz', 'badem', 'antep', 'kaju', 'nut', 'hazelnut', 'walnut'],
};

// Saf Fonksiyon 1: Alerjen Eşleşmesini Kontrol Et (kullanıcının kendi profili)
const findMatchingAllergens = (userAllergies: string[], food: IFood): string[] => {
  const detectedAllergens: Set<string> = new Set();
  const ingredientsLower = food.ingredients.map(i => i.toLowerCase()).join(' ');
  const allergensLower = food.allergens.map(a => a.toLowerCase());

  userAllergies.forEach(userAllergy => {
    const userAllergyLower = userAllergy.toLowerCase();

    // 1. Direkt Alerjen Listesi Kontrolü
    const directMatch = allergensLower.some(a =>
      a.includes(userAllergyLower) || userAllergyLower.includes(a)
    );

    if (directMatch) {
      detectedAllergens.add(userAllergy);
      return;
    }

    // 2. Anahtar Kelime Üzerinden İçindekiler Kontrolü
    const keywords = ALLERGEN_KEYWORDS[userAllergy] || [userAllergyLower];
    const ingredientMatch = keywords.some(keyword =>
      ingredientsLower.includes(keyword.toLowerCase())
    );

    if (ingredientMatch) {
      detectedAllergens.add(userAllergy);
    }
  });

  return Array.from(detectedAllergens);
};

// Saf Fonksiyon 2: Risk Hesaplama
//   - Kullanıcı alerjenleri  → en kritik (HIGH, safeToConsume=false)
//   - Genel zararlı maddeler  → severity'ye göre seviyeyi yükseltir
export const analyzeRisk = (user: IUser, food: IFood): AnalysisResult => {
  const matchedAllergens = findMatchingAllergens(user.allergies, food);

  // Genel zararlı/şüpheli madde taraması (kullanıcı profilinden bağımsız)
  const riskyAdditives = detectRiskyAdditives(food.eCodes || [], food.ingredients || []);

  // Kullanıcıya gösterilecek uyarı satırlarını derle
  const warnings: string[] = [];

  // Önce alerjenler — kullanıcıya özel ve en kritik
  for (const a of matchedAllergens) {
    warnings.push(`DİKKAT: Alerjiniz olan "${a}" tespit edildi.`);
  }

  // Sonra genel zararlı maddeler — sadece bilgilendirme metni
  for (const r of riskyAdditives) {
    warnings.push(`${r.name}: ${r.shortLabel}`);
  }

  // Risk seviyesi belirleme
  let riskLevel: RiskLevel = 'LOW';
  let safeToConsume = true;

  if (matchedAllergens.length > 0) {
    riskLevel = 'HIGH';
    safeToConsume = false;
  } else {
    // Genel maddelere göre yükselt
    riskLevel = escalateRiskLevel('LOW', riskyAdditives);
    // HIGH zararlı madde varsa "kesinlikle güvenli" diyemeyiz, ama yasaklanmadığı için
    // tüketim engeli koymuyoruz — UI sadece güçlü uyarı verir.
    // safeToConsume sadece kullanıcının alerjeni varsa false olur.
  }

  return {
    riskLevel,
    warnings,
    safeToConsume,
    riskyAdditives,
    matchedAllergens
  };
};
