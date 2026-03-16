'use client';

import { DailyTotals, NutritionTargets, FoodMicros, MICRO_LABELS, MICRO_UNITS } from '@/lib/types';

interface NutrientDetailPanelProps {
  totals: DailyTotals;
  targets: NutritionTargets;
  onClose: () => void;
}

interface ProgressBarProps {
  label: string;
  value: number;
  target: number;
  unit: string;
}

function ProgressBar({ label, value, target, unit }: ProgressBarProps) {
  const pct = Math.min((value / target) * 100, 100);
  const over = value > target;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500">{label}</span>
        <span className="font-mono text-stone-700">
          <span className={over ? 'text-stone-800 font-medium' : ''}>{value.toFixed(1)}</span>
          <span className="text-stone-400"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-stone-700' : 'bg-stone-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutrientDetailPanel({ totals, targets, onClose }: NutrientDetailPanelProps) {
  const microKeys = Object.keys(MICRO_LABELS) as (keyof FoodMicros)[];

  return (
    <div
      className="fixed inset-0 z-40 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white border-t border-stone-200 rounded-t-2xl shadow-2xl shadow-stone-200/60 p-6 pb-8 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-stone-800 tracking-tight">Today&apos;s nutrition</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Macros</div>
          <ProgressBar label="Calories" value={totals.calories} target={targets.calories} unit=" kcal" />
          <ProgressBar label="Protein" value={totals.protein_g} target={targets.protein_g} unit="g" />
          <ProgressBar label="Carbohydrates" value={totals.carbs_g} target={targets.carbs_g} unit="g" />
          <ProgressBar label="Fat" value={totals.fat_g} target={targets.fat_g} unit="g" />
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Micronutrients</div>
          {microKeys.map((key) => (
            <ProgressBar
              key={key}
              label={MICRO_LABELS[key]}
              value={totals.micros[key] ?? 0}
              target={targets[key] as number}
              unit={MICRO_UNITS[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
