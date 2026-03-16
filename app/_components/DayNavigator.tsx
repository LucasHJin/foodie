'use client';

import { format, parseISO, addDays, subDays } from 'date-fns';

interface DayNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
}

function formatDateDisplay(dateStr: string): string {
  const today = new Date();
  const d = parseISO(dateStr);
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export default function DayNavigator({ date, onDateChange }: DayNavigatorProps) {
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-5">
      <button
        onClick={() => onDateChange(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700"
        aria-label="Previous day"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="text-center min-w-[120px]">
        <span className="text-sm font-medium text-stone-700 tracking-tight">
          {formatDateDisplay(date)}
        </span>
        <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
          {format(parseISO(date), 'yyyy.MM.dd')}
        </div>
      </div>

      <button
        onClick={() => onDateChange(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
        disabled={isToday}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
