'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchResult } from '@/lib/types';

interface NutrientsPer100g {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg?: number;
  calcium_mg?: number;
  vitaminD_mcg?: number;
  vitaminC_mg?: number;
  zinc_mg?: number;
  magnesium_mg?: number;
  potassium_mg?: number;
}

interface AmountPickerProps {
  food: SearchResult;
  onConfirm: (food: SearchResult, amountG: number, nutrients: NutrientsPer100g) => void;
  onCancel: () => void;
}

const PRESETS = [50, 100, 150, 200, 300];

function scale(val: number | undefined, ratio: number): number {
  return Math.round(((val ?? 0) * ratio) * 10) / 10;
}

export default function AmountPicker({ food, onConfirm, onCancel }: AmountPickerProps) {
  const [amount, setAmount] = useState(100);
  const [inputVal, setInputVal] = useState('100');
  const [nutrients, setNutrients] = useState<NutrientsPer100g>({
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
  });
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();

    (async () => {
      try {
        const res = await fetch(`/api/food/${food.fdcId}`);
        const data = await res.json();
        if (data.nutrients) {
          setNutrients({
            calories: data.nutrients.calories ?? food.calories,
            protein_g: data.nutrients.protein_g ?? food.protein_g,
            carbs_g: data.nutrients.carbs_g ?? food.carbs_g,
            fat_g: data.nutrients.fat_g ?? food.fat_g,
            iron_mg: data.nutrients.iron_mg,
            calcium_mg: data.nutrients.calcium_mg,
            vitaminD_mcg: data.nutrients.vitaminD_mcg,
            vitaminC_mg: data.nutrients.vitaminC_mg,
            zinc_mg: data.nutrients.zinc_mg,
            magnesium_mg: data.nutrients.magnesium_mg,
            potassium_mg: data.nutrients.potassium_mg,
          });
        }
      } catch {
        // use search-result fallback
      } finally {
        setLoading(false);
      }
    })();
  }, [food]);

  const ratio = amount / 100;
  const scaledCal = scale(nutrients.calories, ratio);
  const scaledPro = scale(nutrients.protein_g, ratio);
  const scaledCarb = scale(nutrients.carbs_g, ratio);
  const scaledFat = scale(nutrients.fat_g, ratio);

  const handleInputChange = (v: string) => {
    setInputVal(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setAmount(Math.round(n));
  };

  const handlePreset = (g: number) => {
    setAmount(g);
    setInputVal(String(g));
  };

  const handleConfirm = () => {
    if (amount > 0) onConfirm(food, amount, nutrients);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-stone-900/15 backdrop-blur-[2px]" />

      <div
        className="relative bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-300/25 w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Food name */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-stone-800 leading-snug">{food.name}</h3>
              {food.brandOwner && (
                <p className="text-[11px] text-stone-400 mt-0.5">{food.brandOwner}</p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Nutrients shown per 100g</p>
        </div>

        {/* Amount input */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="number"
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                min={1}
                max={2000}
                className="w-full pl-4 pr-10 py-2.5 border border-stone-200 rounded-xl text-sm font-mono text-stone-800 outline-none focus:border-stone-400 transition-colors bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">g</span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => handlePreset(g)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                  amount === g
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {g}g
              </button>
            ))}
          </div>
        </div>

        {/* Live nutrition preview */}
        <div className="mx-6 mb-4 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-1">
              <div className="w-3.5 h-3.5 border border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-base font-semibold font-mono text-stone-800">{scaledCal}</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-0.5">kcal</div>
              </div>
              <div className="w-px h-7 bg-stone-200" />
              <div className="text-center">
                <div className="text-sm font-mono font-medium text-stone-700">{scaledPro}g</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-0.5">protein</div>
              </div>
              <div className="w-px h-7 bg-stone-200" />
              <div className="text-center">
                <div className="text-sm font-mono font-medium text-stone-700">{scaledCarb}g</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-0.5">carbs</div>
              </div>
              <div className="w-px h-7 bg-stone-200" />
              <div className="text-center">
                <div className="text-sm font-mono font-medium text-stone-700">{scaledFat}g</div>
                <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-0.5">fat</div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="px-6 pb-5">
          <button
            onClick={handleConfirm}
            disabled={amount <= 0}
            className="w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add {amount}g to graph
          </button>
        </div>
      </div>
    </div>
  );
}
