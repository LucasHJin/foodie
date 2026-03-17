import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { computeTargets } from '@/lib/heuristics';
import { Goal, ActivityLevel, Sex } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { goal, weight, activityLevel, sex, age } = body as {
    goal: Goal;
    weight: number;
    activityLevel: ActivityLevel;
    sex: Sex;
    age: number;
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const targets = computeTargets(goal, weight, activityLevel, sex, age);
    return NextResponse.json({ targets, source: 'heuristic' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a nutrition expert. Given the following user profile, calculate precise daily nutrition targets.

Profile:
- Goal: ${goal} (bulk = muscle gain +300 cal, cut = fat loss -400 cal, maintain = maintain weight)
- Weight: ${weight} kg
- Age: ${age} years
- Sex: ${sex}
- Activity level: ${activityLevel} (sedentary=desk job, light=light exercise 1-3/week, moderate=moderate exercise 3-5/week, active=hard exercise 6-7/week, very_active=very hard exercise + physical job)

Return ONLY valid JSON with these exact keys and numeric values:
{
  "calories": <total daily calories as integer>,
  "protein_g": <protein in grams as integer>,
  "carbs_g": <carbohydrates in grams as integer>,
  "fat_g": <fat in grams as integer>,
  "iron_mg": <iron in mg as decimal>,
  "calcium_mg": <calcium in mg as integer>,
  "vitaminD_mcg": <vitamin D in micrograms as integer>,
  "vitaminC_mg": <vitamin C in mg as integer>,
  "zinc_mg": <zinc in mg as decimal>,
  "magnesium_mg": <magnesium in mg as integer>,
  "potassium_mg": <potassium in mg as integer>,
  "vitaminA_mcg": <vitamin A as RAE in micrograms as integer>,
  "vitaminB6_mg": <vitamin B6 in mg as decimal>,
  "vitaminB12_mcg": <vitamin B12 in micrograms as decimal>,
  "folate_mcg": <folate in micrograms as integer>,
  "phosphorus_mg": <phosphorus in mg as integer>
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const targets = JSON.parse(text);

    return NextResponse.json({ targets, source: 'gemini' });
  } catch (err) {
    console.error('Gemini error, falling back to heuristic:', err);
    const targets = computeTargets(goal, weight, activityLevel, sex, age);
    return NextResponse.json({ targets, source: 'heuristic' });
  }
}
