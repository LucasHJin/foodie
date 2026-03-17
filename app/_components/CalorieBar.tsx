'use client';

import { useState } from 'react';
import { DailyTotals, NutritionTargets } from '@/lib/types';
import NutrientDetailPanel from './NutrientDetailPanel';

interface CalorieBarProps {
  totals: DailyTotals;
  targets: NutritionTargets;
}

export default function CalorieBar({ totals, targets }: CalorieBarProps) {
  const [open, setOpen] = useState(false);
  const pct = Math.min((totals.calories / targets.calories) * 100, 100);
  const over = totals.calories > targets.calories;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="View nutrition details"
        className="group flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-full px-4 py-2 shadow-sm shadow-stone-200/50 hover:shadow-md hover:border-stone-300 transition-all"
      >
        {/* Mini arc-progress pill track */}
        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-stone-700' : 'bg-stone-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="text-xs font-mono text-stone-500 group-hover:text-stone-700 transition-colors whitespace-nowrap">
          <span className={`font-semibold ${over ? 'text-stone-800' : 'text-stone-600'}`}>
            {Math.round(totals.calories)}
          </span>
          <span className="text-stone-300 mx-0.5">/</span>
          <span className="text-stone-400">{targets.calories} kcal</span>
        </span>
      </button>

      {open && (
        <NutrientDetailPanel
          totals={totals}
          targets={targets}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
