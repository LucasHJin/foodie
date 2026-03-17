import { Goal, ActivityLevel, Sex, NutritionTargets } from './types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const MACRO_SPLITS: Record<Goal, [number, number, number]> = {
  bulk: [0.30, 0.45, 0.25],
  cut: [0.35, 0.40, 0.25],
  maintain: [0.25, 0.45, 0.30],
};

const CALORIE_ADJUSTMENTS: Record<Goal, number> = {
  bulk: 300,
  cut: -400,
  maintain: 0,
};

export function computeTargets(
  goal: Goal,
  weight: number,
  activityLevel: ActivityLevel,
  sex: Sex,
  age: number
): NutritionTargets {
  const height = 170;
  const bmr =
    sex === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const calories = Math.round(tdee + CALORIE_ADJUSTMENTS[goal]);

  const [proteinRatio, carbsRatio, fatRatio] = MACRO_SPLITS[goal];

  return {
    calories,
    protein_g: Math.round((calories * proteinRatio) / 4),
    carbs_g: Math.round((calories * carbsRatio) / 4),
    fat_g: Math.round((calories * fatRatio) / 9),
    iron_mg: sex === 'female' ? 18 : 8,
    calcium_mg: 1000,
    vitaminD_mcg: 20,
    vitaminC_mg: sex === 'male' ? 90 : 75,
    zinc_mg: sex === 'male' ? 11 : 8,
    magnesium_mg: sex === 'male' ? 420 : 320,
    potassium_mg: 3400,
    vitaminA_mcg: sex === 'male' ? 900 : 700,
    vitaminB6_mg: sex === 'male' ? 1.7 : 1.5,
    vitaminB12_mcg: 2.4,
    folate_mcg: 400,
    phosphorus_mg: 700,
  };
}
