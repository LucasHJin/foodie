import { NextRequest, NextResponse } from 'next/server';

/**
 * Detail endpoint returns one of BrandedFoodItem | FoundationFoodItem | SRLegacyFoodItem etc.
 * All types have foodNutrients: FoodNutrient[] where each entry is:
 *   { id, amount, nutrient: { id, number, name, unitName } }
 *
 * `amount` is per 100g for all food types.
 *
 * BrandedFoodItem also has:
 *   - servingSize / servingSizeUnit / householdServingFullText
 *   - labelNutrients: per-serving values straight from the food label
 *
 * Foundation/SR Legacy also have:
 *   - foodPortions: common serving sizes (e.g. "1 cup" = 91g)
 */
const NUTRIENT_ID_MAP: Record<number, string> = {
  1008: 'calories',
  1003: 'protein_g',
  1005: 'carbs_g',
  1004: 'fat_g',
  1089: 'iron_mg',
  1087: 'calcium_mg',
  1114: 'vitaminD_mcg',
  1162: 'vitaminC_mg',
  1095: 'zinc_mg',
  1090: 'magnesium_mg',
  1092: 'potassium_mg',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFoodNutrients(foodNutrients: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of foodNutrients ?? []) {
    // FoodNutrient: nutrientId is nested at n.nutrient.id
    const nutrientId = n.nutrient?.id;
    if (nutrientId != null) {
      const key = NUTRIENT_ID_MAP[nutrientId];
      if (key !== undefined) out[key] = n.amount ?? 0;
    }
  }
  return out;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fdcId: string }> }
) {
  const { fdcId } = await params;
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'USDA_API_KEY not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
    const data = await res.json();

    // Per-100g nutrients from foodNutrients (all food types)
    const nutrients = extractFoodNutrients(data.foodNutrients ?? []);

    // Serving info — only present on BrandedFoodItem
    const servingSize: number | null = data.servingSize ?? null;
    const servingSizeUnit: string | null = data.servingSizeUnit ?? null;
    const householdServing: string | null = data.householdServingFullText ?? null;

    // labelNutrients — per-serving values from the food label (Branded only)
    // Exposed as-is so the client can show "per serving" numbers if desired
    const label = data.labelNutrients ?? null;
    const labelNutrients = label
      ? {
          calories: label.calories?.value ?? null,
          protein_g: label.protein?.value ?? null,
          carbs_g: label.carbohydrates?.value ?? null,
          fat_g: label.fat?.value ?? null,
          iron_mg: label.iron?.value ?? null,
          calcium_mg: label.calcium?.value ?? null,
          potassium_mg: label.potassium?.value ?? null,
        }
      : null;

    // First common portion for Foundation / SR Legacy (e.g. "1 cup, 91g")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const portions = (data.foodPortions ?? []).map((p: any) => ({
      description: p.portionDescription ?? p.modifier ?? null,
      gramWeight: p.gramWeight ?? null,
    })).filter((p: { gramWeight: number | null }) => p.gramWeight != null);

    return NextResponse.json({
      fdcId: data.fdcId,
      dataType: data.dataType,
      name: data.description,
      // Per-100g values (reliable for all food types)
      nutrients,
      // Serving metadata
      servingSize,
      servingSizeUnit,
      householdServing,
      // Per-serving label values (Branded only, null otherwise)
      labelNutrients,
      // Common portions (Foundation/SR Legacy)
      portions,
    });
  } catch (err) {
    console.error('Food detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch food detail' }, { status: 502 });
  }
}
