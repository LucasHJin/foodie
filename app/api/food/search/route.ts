import { NextRequest, NextResponse } from 'next/server';

/**
 * Search endpoint returns SearchResultFood[], where each food's foodNutrients
 * is AbridgedFoodNutrient[]:
 *   { number: integer, name: string, amount: float, unitName: string }
 *
 * All amounts are per 100g (USDA normalises to per-100g in search results).
 */
const NUTRIENT_NUMBER_MAP: Record<number, string> = {
  208: 'calories',       // Energy, kcal
  268: 'calories_kj',   // Energy, kJ (some Foundation foods only report kJ)
  203: 'protein_g',      // Protein
  205: 'carbs_g',        // Carbohydrate, by difference
  204: 'fat_g',          // Total lipid (fat)
  303: 'iron_mg',        // Iron, Fe
  301: 'calcium_mg',     // Calcium, Ca
  328: 'vitaminD_mcg',   // Vitamin D (D2+D3), mcg
  401: 'vitaminC_mg',    // Vitamin C, total ascorbic acid
  309: 'zinc_mg',        // Zinc, Zn
  304: 'magnesium_mg',   // Magnesium, Mg
  306: 'potassium_mg',   // Potassium, K
  320: 'vitaminA_mcg',   // Vitamin A, RAE
  415: 'vitaminB6_mg',   // Vitamin B6
  418: 'vitaminB12_mcg', // Vitamin B12
  417: 'folate_mcg',     // Folate, total
  305: 'phosphorus_mg',  // Phosphorus, P
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAbridgedNutrients(foodNutrients: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of foodNutrients ?? []) {
    const key = NUTRIENT_NUMBER_MAP[Number(n.number)];
    if (key !== undefined) out[key] = n.amount ?? 0;
  }

  // Convert kJ → kcal when only kJ is reported
  if (!out.calories && out.calories_kj) {
    out.calories = Math.round(out.calories_kj / 4.184);
  }
  delete out.calories_kj;

  // 4-4-9 fallback: estimate kcal from macros when energy is still missing/zero
  if (!out.calories && (out.protein_g || out.carbs_g || out.fat_g)) {
    out.calories = Math.round(
      (out.protein_g ?? 0) * 4 + (out.carbs_g ?? 0) * 4 + (out.fat_g ?? 0) * 9
    );
  }

  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFoods(raw: any[]): Record<string, unknown>[] {
  return raw.map((f) => {
    const nutrients = extractAbridgedNutrients(f.foodNutrients ?? []);
    return {
      fdcId: f.fdcId,
      dataType: f.dataType,
      name: f.description,
      brandOwner: f.brandOwner ?? null,
      calories: nutrients.calories ?? 0,
      protein_g: nutrients.protein_g ?? 0,
      carbs_g: nutrients.carbs_g ?? 0,
      fat_g: nutrients.fat_g ?? 0,
    };
  });
}

function buildUrl(query: string, apiKey: string, dataType: string, pageSize: number): string {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', query);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('dataType', dataType);
  url.searchParams.set('sortBy', 'score');
  url.searchParams.set('sortOrder', 'desc');
  return url.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query?.trim()) return NextResponse.json({ foods: [] });

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'USDA_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Fetch generic foods (Foundation + SR Legacy) and branded foods in parallel.
    // Generic foods always appear first so e.g. "beef" shows raw/cooked cuts before brands.
    const [genericRes, brandedRes] = await Promise.all([
      fetch(buildUrl(query, apiKey, 'Foundation,SR Legacy', 8), { next: { revalidate: 3600 } }),
      fetch(buildUrl(query, apiKey, 'Branded', 6), { next: { revalidate: 3600 } }),
    ]);

    if (!genericRes.ok && !brandedRes.ok) {
      throw new Error(`USDA API error: ${genericRes.status}`);
    }

    const [genericData, brandedData] = await Promise.all([
      genericRes.ok ? genericRes.json() : { foods: [] },
      brandedRes.ok ? brandedRes.json() : { foods: [] },
    ]);

    const genericFoods = mapFoods(genericData.foods ?? []);
    const brandedFoods = mapFoods(brandedData.foods ?? []);

    // Deduplicate by fdcId (generic takes precedence), then cap total at 12
    const seen = new Set<number>();
    const foods: Record<string, unknown>[] = [];
    for (const f of [...genericFoods, ...brandedFoods]) {
      if (!seen.has(f.fdcId as number)) {
        seen.add(f.fdcId as number);
        foods.push(f);
      }
      if (foods.length >= 12) break;
    }

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('Food search error:', err);
    return NextResponse.json({ error: 'Failed to fetch food data' }, { status: 502 });
  }
}
