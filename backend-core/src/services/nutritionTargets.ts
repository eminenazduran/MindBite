/**
 * Beslenme hedef hesaplayıcısı
 * - BMI (Body Mass Index): kilo / boy² (m)
 * - BMR (Basal Metabolic Rate): Mifflin-St Jeor formülü (Harris-Benedict revize)
 *     Kadın: 10*kilo + 6.25*boy(cm) - 5*yaş - 161
 *     Erkek: 10*kilo + 6.25*boy(cm) - 5*yaş + 5
 * - TDEE (Total Daily Energy Expenditure): BMR * aktivite katsayısı
 * - Hedef Kalori: TDEE +/- 400 (kilo ver/al) veya = TDEE (koru/sağlıklı beslen)
 * - Makro dağılımı: protein 25%, carb 45%, fat 30% (sağlıklı default)
 *   Kilo verme: protein 30%, carb 40%, fat 30%
 *   Kilo alma:  protein 25%, carb 50%, fat 25%
 */

import type { Gender, ActivityLevel, NutritionGoal } from '../models/User';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export interface NutritionInput {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
}

export interface NutritionTargets {
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  bmr: number;
  tdee: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

const round = (n: number) => Math.round(n);

const categorizeBMI = (bmi: number): NutritionTargets['bmiCategory'] => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

export const calculateNutritionTargets = (input: NutritionInput): NutritionTargets => {
  const { age, gender, height, weight, activityLevel, goal } = input;

  // 1. BMI
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  // 2. BMR (Mifflin-St Jeor)
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // 'female' veya 'other' için kadın formülü (daha güvenli/düşük tahmin)
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // 3. TDEE
  const factor = ACTIVITY_FACTOR[activityLevel] ?? 1.375;
  const tdee = bmr * factor;

  // 4. Hedef kaloriye göre düzeltme
  let calorieGoal: number;
  let proteinPct: number, carbPct: number, fatPct: number;

  switch (goal) {
    case 'lose':
      calorieGoal = tdee - 400; // ~3000 kcal/hafta = ~0.4 kg
      proteinPct = 0.30;
      carbPct = 0.40;
      fatPct = 0.30;
      break;
    case 'gain':
      calorieGoal = tdee + 400;
      proteinPct = 0.25;
      carbPct = 0.50;
      fatPct = 0.25;
      break;
    case 'maintain':
      calorieGoal = tdee;
      proteinPct = 0.25;
      carbPct = 0.50;
      fatPct = 0.25;
      break;
    case 'healthy':
    default:
      calorieGoal = tdee;
      proteinPct = 0.25;
      carbPct = 0.45;
      fatPct = 0.30;
      break;
  }

  // Güvenli aralık: 1200 kcal altı kadın, 1500 kcal altı erkek olmaz
  const minCalories = gender === 'male' ? 1500 : 1200;
  if (calorieGoal < minCalories) calorieGoal = minCalories;

  // 5. Makro hedefleri (1g protein=4kcal, 1g carb=4kcal, 1g fat=9kcal)
  const proteinGoal = (calorieGoal * proteinPct) / 4;
  const carbGoal = (calorieGoal * carbPct) / 4;
  const fatGoal = (calorieGoal * fatPct) / 9;

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    bmiCategory: categorizeBMI(bmi),
    bmr: round(bmr),
    tdee: round(tdee),
    calorieGoal: round(calorieGoal),
    proteinGoal: round(proteinGoal),
    carbGoal: round(carbGoal),
    fatGoal: round(fatGoal)
  };
};
