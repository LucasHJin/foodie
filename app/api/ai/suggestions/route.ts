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

    const prompt = `You are a nutrition expert. A user is deficient in these nutrients: ${nutrientList}.
They have already eaten today: ${currentList}.

For each deficient nutrient below, suggest ONE common whole food rich in it that complements their existing meals. Avoid repeating foods they already ate.

Respond with a JSON array of exactly ${deficientNutrients.length} objects. Each object must have:
- "nutrient": the nutrient key (use exactly the key provided below, unchanged)
- "name": a short food name (max 20 characters)
- "calories": an integer estimate of kcal in a typical serving

Nutrient keys to cover (one object per key, in this order): ${deficientNutrients.map((n) => `"${n}"`).join(', ')}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    // Strip markdown code fences if Gemini wraps the response
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const suggestions = JSON.parse(jsonText);

    return NextResponse.json({ suggestions, source: 'gemini' });
  } catch (err) {
    console.error('Gemini suggestions error:', err);
    const suggestions = deficientNutrients
      .filter((n) => GHOST_FALLBACKS[n])
      .map((n) => ({ nutrient: n, ...GHOST_FALLBACKS[n] }));
    return NextResponse.json({ suggestions, source: 'fallback' });
  }
}
