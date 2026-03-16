'use client';

import { DailyTotals, NutritionTargets } from '@/lib/types';
import NutrientDetailPanel from './NutrientDetailPanel';
import { useState } from 'react';

interface CalorieBarProps {
  totals: DailyTotals;
  targets: NutritionTargets;
}

export default function CalorieBar({ totals, targets }: CalorieBarProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min((totals.calories / targets.calories) * 100, 100);
  const over = totals.calories > targets.calories;

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors group"
        aria-label="View nutrition details"
      >
        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-stone-700' : 'bg-stone-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs font-mono text-stone-500 shrink-0 group-hover:text-stone-700 transition-colors">
          <span className={`font-medium ${over ? 'text-stone-800' : 'text-stone-600'}`}>
            {Math.round(totals.calories)}
          </span>
          <span className="text-stone-300 mx-1">/</span>
          <span>{targets.calories}</span>
          <span className="text-stone-400 ml-1">kcal</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-stone-300 group-hover:text-stone-500 transition-colors shrink-0"
        >
          <path d="M2 4.5l4-3 4 3M2 7.5l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <NutrientDetailPanel
          totals={totals}
          targets={targets}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}
