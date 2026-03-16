import { FoodEntry, FoodMicros, NutritionTargets, GhostNodeData } from '../types';

const GHOST_SUGGESTIONS: Record<keyof FoodMicros, { name: string; calories: number }> = {
  iron_mg: { name: 'Spinach', calories: 23 },
  calcium_mg: { name: 'Greek Yogurt', calories: 97 },
  vitaminD_mcg: { name: 'Salmon', calories: 208 },
  vitaminC_mg: { name: 'Orange', calories: 62 },
  zinc_mg: { name: 'Pumpkin Seeds', calories: 151 },
  magnesium_mg: { name: 'Almonds', calories: 164 },
  potassium_mg: { name: 'Banana', calories: 89 },
};

const MICRO_KEYS: (keyof FoodMicros)[] = [
  'iron_mg',
  'calcium_mg',
  'vitaminD_mcg',
  'vitaminC_mg',
  'zinc_mg',
  'magnesium_mg',
  'potassium_mg',
];

export function computeGhostNodes(
  entries: FoodEntry[],
  targets: NutritionTargets
): GhostNodeData[] {
  const consumed: FoodMicros = {};

  for (const entry of entries) {
    for (const key of MICRO_KEYS) {
      consumed[key] = (consumed[key] ?? 0) + (entry.micros[key] ?? 0);
    }
  }

  return MICRO_KEYS
    .filter((key) => {
      const target = targets[key] as number;
      const cons = consumed[key] ?? 0;
      return target > 0 && cons / target < 0.5;
    })
    .sort((a, b) => {
      const targetA = targets[a] as number;
      const targetB = targets[b] as number;
      const consA = consumed[a] ?? 0;
      const consB = consumed[b] ?? 0;
      return consA / targetA - consB / targetB;
    })
    .slice(0, 3)
    .filter((key) => GHOST_SUGGESTIONS[key])
    .map((key) => ({
      id: `ghost-${key}`,
      isGhost: true as const,
      deficientNutrient: key,
      name: GHOST_SUGGESTIONS[key].name,
      calories: GHOST_SUGGESTIONS[key].calories,
    }));
}
