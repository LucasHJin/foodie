'use client';

import { motion } from 'framer-motion';
import { FoodEntry, FoodMicros, MICRO_LABELS, MICRO_UNITS } from '@/lib/types';

interface MacroRingCardProps {
  entry: FoodEntry;
  x: number;
  y: number;
}

const RING_SIZE = 72;
const STROKE = 8;
const R = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function polarToArc(ratio: number, offset: number): string {
  const length = ratio * CIRCUMFERENCE;
  return `${length} ${CIRCUMFERENCE}`;
}

export default function MacroRingCard({ entry, x, y }: MacroRingCardProps) {
  const totalMacroCals =
    entry.protein_g * 4 + entry.carbs_g * 4 + entry.fat_g * 9;

  const proteinRatio = totalMacroCals > 0 ? (entry.protein_g * 4) / totalMacroCals : 0;
  const carbsRatio = totalMacroCals > 0 ? (entry.carbs_g * 4) / totalMacroCals : 0;
  const fatRatio = totalMacroCals > 0 ? (entry.fat_g * 9) / totalMacroCals : 0;

  const proteinDash = polarToArc(proteinRatio, 0);
  const carbsDash = polarToArc(carbsRatio, 0);
  const fatDash = polarToArc(fatRatio, 0);

  const proteinOffset = 0;
  const carbsOffset = -(proteinRatio * CIRCUMFERENCE);
  const fatOffset = -((proteinRatio + carbsRatio) * CIRCUMFERENCE);

  const significantMicros = (Object.keys(entry.micros) as (keyof FoodMicros)[]).filter(
    (k) => (entry.micros[k] ?? 0) > 0
  );

  const cardWidth = 200;
  const cardHeight = 160 + significantMicros.length * 18;

  let cardX = x + 16;
  let cardY = y - cardHeight / 2;

  if (typeof window !== 'undefined') {
    if (cardX + cardWidth > window.innerWidth - 16) cardX = x - cardWidth - 16;
    if (cardY < 8) cardY = 8;
    if (cardY + cardHeight > window.innerHeight - 8) cardY = window.innerHeight - cardHeight - 8;
  }

  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      style={{ left: cardX, top: cardY }}
      initial={{ opacity: 0, scale: 0.93, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 4 }}
      transition={{ duration: 0.13, ease: 'easeOut' }}
    >
      <div className="bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-100/80 p-4 w-[200px]">
        <div className="text-xs font-medium text-stone-800 mb-3 leading-tight truncate">
          {entry.name}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <svg width={RING_SIZE} height={RING_SIZE} className="shrink-0 -rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              fill="none"
              stroke="hsl(12, 42%, 58%)"
              strokeWidth={STROKE}
              strokeDasharray={proteinDash}
              strokeDashoffset={proteinOffset}
              strokeLinecap="butt"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              fill="none"
              stroke="hsl(38, 52%, 58%)"
              strokeWidth={STROKE}
              strokeDasharray={carbsDash}
              strokeDashoffset={carbsOffset}
              strokeLinecap="butt"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              fill="none"
              stroke="hsl(85, 28%, 55%)"
              strokeWidth={STROKE}
              strokeDasharray={fatDash}
              strokeDashoffset={fatOffset}
              strokeLinecap="butt"
            />
          </svg>

          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(12, 42%, 58%)' }} />
              <span className="text-stone-500">P</span>
              <span className="font-mono text-stone-700 ml-auto">{entry.protein_g.toFixed(1)}g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(38, 52%, 58%)' }} />
              <span className="text-stone-500">C</span>
              <span className="font-mono text-stone-700 ml-auto">{entry.carbs_g.toFixed(1)}g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(85, 28%, 55%)' }} />
              <span className="text-stone-500">F</span>
              <span className="font-mono text-stone-700 ml-auto">{entry.fat_g.toFixed(1)}g</span>
            </div>
            <div className="mt-1 pt-1 border-t border-stone-100">
              <span className="font-mono font-medium text-stone-800">{Math.round(entry.calories)}</span>
              <span className="text-stone-400"> kcal</span>
            </div>
          </div>
        </div>

        {significantMicros.length > 0 && (
          <div className="border-t border-stone-100 pt-2 space-y-1">
            {significantMicros.map((key) => (
              <div key={key} className="flex items-center justify-between text-[10px]">
                <span className="text-stone-400">{MICRO_LABELS[key]}</span>
                <span className="font-mono text-stone-600">
                  {(entry.micros[key] ?? 0).toFixed(1)}{MICRO_UNITS[key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
