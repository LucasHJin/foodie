'use client';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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
  const displayValue = value < 1 && value > 0 ? value.toFixed(2) : value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <span className="text-xs text-stone-500 truncate min-w-0 shrink">{label}</span>
        <span className="text-xs font-mono shrink-0 tabular-nums">
          <span className={over ? 'text-stone-800 font-semibold' : 'text-stone-600'}>{displayValue}</span>
          <span className="text-stone-300 mx-0.5">/</span>
          <span className="text-stone-400">{target}{unit}</span>
        </span>
      </div>
      <div className="h-[3px] bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${over ? 'bg-stone-700' : 'bg-stone-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export default function NutrientDetailPanel({ totals, targets, onClose }: NutrientDetailPanelProps) {
  const microKeys = Object.keys(MICRO_LABELS) as (keyof FoodMicros)[];

  const content = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-stone-900/25 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-2xl border border-stone-200/60 shadow-2xl shadow-stone-400/20 flex flex-col"
        style={{ width: '82vw', height: '75vh' }}
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-5 border-b border-stone-100 shrink-0">
          <h2 className="text-base font-medium text-stone-800 tracking-tight">Nutrition today</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body — two even columns */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          <div className="grid grid-cols-2 gap-x-12">
            {/* Macros */}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-stone-400 mb-5">Macros</p>
              <div className="space-y-5">
                <ProgressBar label="Calories" value={totals.calories} target={targets.calories} unit=" kcal" />
                <ProgressBar label="Protein" value={totals.protein_g} target={targets.protein_g} unit="g" />
                <ProgressBar label="Carbohydrates" value={totals.carbs_g} target={targets.carbs_g} unit="g" />
                <ProgressBar label="Fat" value={totals.fat_g} target={targets.fat_g} unit="g" />
              </div>
            </div>

            {/* Divider */}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-stone-400 mb-5">Micronutrients</p>
              <div className="space-y-5">
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
        </div>
      </motion.div>
    </motion.div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
}
