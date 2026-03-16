import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query?.trim()) {
    return NextResponse.json({ foods: [] });
  }

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
    const foods = (data.foods ?? []).map((f: any) => ({
      fdcId: f.fdcId,
      name: f.description,
      brandOwner: f.brandOwner ?? null,
      calories: f.foodNutrients?.find((n: any) => n.nutrientId === 1008)?.value ?? 0,
      protein_g: f.foodNutrients?.find((n: any) => n.nutrientId === 1003)?.value ?? 0,
      carbs_g: f.foodNutrients?.find((n: any) => n.nutrientId === 1005)?.value ?? 0,
      fat_g: f.foodNutrients?.find((n: any) => n.nutrientId === 1004)?.value ?? 0,
    }));

    return NextResponse.json({ foods });
  } catch (err) {
    console.error('Food search error:', err);
    return NextResponse.json({ error: 'Failed to fetch food data' }, { status: 502 });
  }
}
