export type Goal = 'bulk' | 'cut' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female';

export interface MicroTargets {
  iron_mg: number;
  calcium_mg: number;
  vitaminD_mcg: number;
  vitaminC_mg: number;
  zinc_mg: number;
  magnesium_mg: number;
  potassium_mg: number;
  vitaminA_mcg: number;
  vitaminB6_mg: number;
  vitaminB12_mcg: number;
  folate_mcg: number;
  phosphorus_mg: number;
}

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type NutritionTargets = MacroTargets & MicroTargets;

export interface UserConfig {
  goal: Goal;
  weight: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  targets: NutritionTargets;
}

export interface FoodMicros {
  iron_mg?: number;
  calcium_mg?: number;
  vitaminD_mcg?: number;
  vitaminC_mg?: number;
  zinc_mg?: number;
  magnesium_mg?: number;
  potassium_mg?: number;
  vitaminA_mcg?: number;
  vitaminB6_mg?: number;
  vitaminB12_mcg?: number;
  folate_mcg?: number;
  phosphorus_mg?: number;
}

export interface FoodEntry {
  id: string;
  fdcId: number;
  name: string;
  amount: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros: FoodMicros;
  addedAt: string;
}

export interface GhostNodeData {
  id: string;
  isGhost: true;
  deficientNutrient: keyof FoodMicros;
  name: string;
  calories: number;
  x?: number;
  y?: number;
}

export interface FoodGraphNode extends FoodEntry {
  isGhost?: false;
  x?: number;
  y?: number;
}

export type AnyGraphNode = FoodGraphNode | GhostNodeData;

export interface GraphEdge {
  source: string;
  target: string;
  score: number;
  sharedMicros: (keyof FoodMicros)[];
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros: FoodMicros;
}

export interface SearchResult {
  fdcId: number;
  dataType?: string;   // "Foundation" | "SR Legacy" | "Branded"
  name: string;
  brandOwner?: string;
  // All values are per 100g — AbridgedFoodNutrient.amount from the search endpoint
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  // Note: servingSize is NOT returned by the search endpoint; comes from detail fetch only
}

export const MICRO_LABELS: Record<keyof FoodMicros, string> = {
  iron_mg: 'Iron',
  calcium_mg: 'Calcium',
  vitaminD_mcg: 'Vitamin D',
  vitaminC_mg: 'Vitamin C',
  zinc_mg: 'Zinc',
  magnesium_mg: 'Magnesium',
  potassium_mg: 'Potassium',
  vitaminA_mcg: 'Vitamin A',
  vitaminB6_mg: 'Vitamin B6',
  vitaminB12_mcg: 'Vitamin B12',
  folate_mcg: 'Folate',
  phosphorus_mg: 'Phosphorus',
};

export const MICRO_UNITS: Record<keyof FoodMicros, string> = {
  iron_mg: 'mg',
  calcium_mg: 'mg',
  vitaminD_mcg: 'mcg',
  vitaminC_mg: 'mg',
  zinc_mg: 'mg',
  magnesium_mg: 'mg',
  potassium_mg: 'mg',
  vitaminA_mcg: 'mcg',
  vitaminB6_mg: 'mg',
  vitaminB12_mcg: 'mcg',
  folate_mcg: 'mcg',
  phosphorus_mg: 'mg',
};
