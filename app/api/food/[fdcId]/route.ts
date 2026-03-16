import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fdcId: string }> }
) {
  const { fdcId } = await params;
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'USDA_API_KEY not configured' }, { status: 500 });
  }

  const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`USDA API error: ${res.status}`);

    const data = await res.json();
    const nutrients: Record<string, number> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const n of data.foodNutrients ?? [] as any[]) {
      const nutrientId = n.nutrient?.id ?? n.nutrientId;
      const key = NUTRIENT_ID_MAP[nutrientId];
      if (key) {
        nutrients[key] = n.amount ?? n.value ?? 0;
      }
    }

    return NextResponse.json({
      fdcId: data.fdcId,
      name: data.description,
      nutrients,
    });
  } catch (err) {
    console.error('Food detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch food detail' }, { status: 502 });
  }
}
