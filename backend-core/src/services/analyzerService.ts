import { IUser } from '../models/User';
import { IFood } from '../models/Food';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AnalysisResult {
  riskLevel: RiskLevel;
  warnings: string[];
  safeToConsume: boolean;
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

// Saf Fonksiyon 1: Alerjen Eşleşmesini Kontrol Et
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

// Saf Fonksiyon 2: E-kodlarına Yönelik Temel Uyarılar (Pattern Matching simülasyonu)
const analyzeECodes = (eCodes: string[]): string[] => {
  return eCodes.reduce((warnings: string[], code) => {
    switch (true) {
      case /^E1[0-9]{2}/i.test(code):
        warnings.push(`${code}: Gıda Boyası içerebilir, alerjik reaksiyon riski göz önünde bulundurulmalıdır.`);
        break;
      case /^E2[0-9]{2}/i.test(code):
        warnings.push(`${code}: Koruyucu madde.`);
        break;
      case /^E95[0-9]/i.test(code):
        warnings.push(`${code}: Yapay Tatlandırıcı.`);
        break;
      default:
        break;
    }
    return warnings;
  }, []);
};

// Saf Fonksiyon 3: Risk Hesaplama (Higher-Order ve Composition benzeri)
export const analyzeRisk = (user: IUser, food: IFood): AnalysisResult => {
  const matchingAllergens = findMatchingAllergens(user.allergies, food);
  const eCodeWarnings = analyzeECodes(food.eCodes);
  
  const allWarnings = [
    ...matchingAllergens.map(a => `DİKKAT: Alerjiniz olan "${a}" tespit edildi!`),
    ...eCodeWarnings
  ];

  if (matchingAllergens.length > 0) {
    return {
      riskLevel: 'HIGH',
      warnings: allWarnings,
      safeToConsume: false
    };
  }

  if (eCodeWarnings.length > 2) {
    return {
      riskLevel: 'MEDIUM',
      warnings: allWarnings,
      safeToConsume: true
    };
  }

  return {
    riskLevel: 'LOW',
    warnings: allWarnings,
    safeToConsume: true
  };
};
