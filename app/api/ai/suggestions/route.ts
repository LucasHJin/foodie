import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodMicros, MICRO_LABELS } from '@/lib/types';
import { GHOST_FALLBACKS } from '@/lib/graph/ghostNodes';

export async function POST(request: NextRequest) {
  const { deficientNutrients, currentFoods } = (await request.json()) as {
    deficientNutrients: (keyof FoodMicros)[];
    currentFoods: string[];
  };

  if (deficientNutrients.length === 0) {
    return NextResponse.json({ suggestions: [], source: 'empty' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const suggestions = deficientNutrients
      .filter((n) => GHOST_FALLBACKS[n])
      .map((n) => ({ nutrient: n, ...GHOST_FALLBACKS[n] }));
    return NextResponse.json({ suggestions, source: 'fallback' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const nutrientList = deficientNutrients.map((n) => MICRO_LABELS[n]).join(', ');
    const currentList = currentFoods.length > 0 ? currentFoods.join(', ') : 'none yet';

    const prompt = `You are a nutrition expert. A user is deficient in: ${nutrientList}.
They have already eaten today: ${currentList}.

For each deficient nutrient, suggest ONE common whole food that is rich in it and complements their existing meals. Avoid foods they already ate.

Return ONLY a JSON array with exactly ${deficientNutrients.length} objects:
[
  ${deficientNutrients.map((n) => `{ "nutrient": "${n}", "name": "<food name, max 20 chars>", "calories": <kcal per typical serving, integer> }`).join(',\n  ')}
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const suggestions = JSON.parse(text);

    return NextResponse.json({ suggestions, source: 'gemini' });
  } catch (err) {
    console.error('Gemini suggestions error:', err);
    const suggestions = deficientNutrients
      .filter((n) => GHOST_FALLBACKS[n])
      .map((n) => ({ nutrient: n, ...GHOST_FALLBACKS[n] }));
    return NextResponse.json({ suggestions, source: 'fallback' });
  }
}
