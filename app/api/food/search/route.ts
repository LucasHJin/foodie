import { NextRequest, NextResponse } from 'next/server';

/**
 * Search endpoint returns SearchResultFood[], where each food's foodNutrients
 * is AbridgedFoodNutrient[]:
 *   { number: integer, name: string, amount: float, unitName: string }
 *
 * All amounts are per 100g (USDA normalises to per-100g in search results).
 */
const NUTRIENT_NUMBER_MAP: Record<number, string> = {
  208: 'calories',     // Energy
  203: 'protein_g',    // Protein
  205: 'carbs_g',      // Carbohydrate, by difference
  204: 'fat_g',        // Total lipid (fat)
  303: 'iron_mg',      // Iron, Fe
  301: 'calcium_mg',   // Calcium, Ca
  328: 'vitaminD_mcg', // Vitamin D (D2+D3), mcg
  401: 'vitaminC_mg',  // Vitamin C, total ascorbic acid
  309: 'zinc_mg',      // Zinc, Zn
  304: 'magnesium_mg', // Magnesium, Mg
  306: 'potassium_mg', // Potassium, K
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAbridgedNutrients(foodNutrients: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of foodNutrients ?? []) {
    // AbridgedFoodNutrient uses `number` (int) as the nutrient identifier
    const key = NUTRIENT_NUMBER_MAP[Number(n.number)];
    if (key !== undefined) out[key] = n.amount ?? 0;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query?.trim()) return NextResponse.json({ foods: [] });

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'USDA_API_KEY not configured' }, { status: 500 });
  }

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', query);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('pageSize', '8');
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foods = (data.foods ?? []).map((f: any) => {
      const nutrients = extractAbridgedNutrients(f.foodNutrients ?? []);
      return {
        fdcId: f.fdcId,
        dataType: f.dataType,            // "Foundation" | "SR Legacy" | "Branded"
        name: f.description,
        brandOwner: f.brandOwner ?? null,
        calories: nutrients.calories ?? 0,
        protein_g: nutrients.protein_g ?? 0,
        carbs_g: nutrients.carbs_g ?? 0,
        fat_g: nutrients.fat_g ?? 0,
        // Note: SearchResultFood does NOT include servingSize — that comes from the detail endpoint
      };
    });

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('Food search error:', err);
    return NextResponse.json({ error: 'Failed to fetch food data' }, { status: 502 });
  }
}
