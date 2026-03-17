'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '@/lib/types';

interface FoodSearchBarProps {
  onConfirm: (result: SearchResult, amountG: number, nutrients: Record<string, number>) => void;
  onClose: () => void;
}

export default function FoodSearchBar({ onConfirm, onClose }: FoodSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [ratio, setRatio] = useState(1.0);
  const [ratioInput, setRatioInput] = useState('1');
  // per-100g nutrient values from the detail endpoint
  const [per100g, setPer100g] = useState<Record<string, number>>({});
  // base serving size info — ratio 1.0 = 1× this base
  const [baseGrams, setBaseGrams] = useState(100);
  const [baseLabel, setBaseLabel] = useState('100g');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const ratioInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { searchInputRef.current?.focus(); }, []);

  // Auto-focus ratio input when a row gets selected
  useEffect(() => {
    if (selected) {
      setTimeout(() => {
        ratioInputRef.current?.focus();
        ratioInputRef.current?.select();
      }, 50);
    }
  }, [selected?.fdcId]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.foods ?? []);
      setActiveIdx(-1);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const handleSelect = useCallback(async (food: SearchResult) => {
    setSelected(food);
    setRatio(1.0);
    setRatioInput('1');
    // Seed with abridged values (per-100g) while detail loads
    setPer100g({
      calories: food.calories, protein_g: food.protein_g,
      carbs_g: food.carbs_g, fat_g: food.fat_g,
    });
    setBaseGrams(100);
    setBaseLabel('100g');

    try {
      const res = await fetch(`/api/food/${food.fdcId}`);
      const data = await res.json();

      if (data.nutrients) setPer100g(data.nutrients);

      // Determine base serving label + gram weight.
      // Ratio 1.0 = 1× this base; nutrients scale as per100g × ratio × baseGrams / 100.
      if (data.servingSize) {
        const grams = data.servingSize as number;
        const unit = (data.servingSizeUnit as string | null) ?? '';
        // Prefer household text (e.g. "1 oz") when unit isn't already grams
        const label = unit.toLowerCase() === 'g'
          ? `${grams}g`
          : (data.householdServing ?? `${grams} ${unit}`);
        setBaseGrams(grams);
        setBaseLabel(label);
      } else if (data.portions?.length > 0) {
        const p = data.portions[0];
        const label = p.description ? String(p.description) : `${p.gramWeight}g`;
        setBaseGrams(p.gramWeight as number);
        setBaseLabel(label);
      }
    } catch { /* keep 100g fallback */ }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected || ratio <= 0) return;
    // amountG = ratio × baseGrams; page.tsx divides by 100 to get the per-100g multiplier
    onConfirm(selected, Math.round(ratio * baseGrams), per100g);
  }, [selected, ratio, baseGrams, per100g, onConfirm]);

  const handleRatioChange = (v: string) => {
    setRatioInput(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setRatio(n);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) handleSelect(results[activeIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur backdrop — click to close */}
      <motion.div
        className="absolute inset-0 bg-stone-900/25 backdrop-blur-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        className="relative w-[520px] max-w-[calc(100vw-2rem)]"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/60 overflow-hidden">

          {/* Search input — always visible */}
          <div className="flex items-center px-4 border-b border-stone-100">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-stone-400 shrink-0">
              <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.5 9.5l2.8 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              onKeyDown={handleSearchKey}
              placeholder="Search foods…"
              className="flex-1 py-4 px-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none bg-transparent"
            />
            {loading
              ? <div className="w-3.5 h-3.5 border border-stone-300 border-t-stone-600 rounded-full animate-spin shrink-0" />
              : query
                ? <button onClick={() => { setQuery(''); setSelected(null); setResults([]); }} className="text-stone-300 hover:text-stone-500 transition-colors shrink-0">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                : null
            }
          </div>

          {/* Results list */}
          <AnimatePresence initial={false}>
          {results.length > 0 && (
            <motion.ul
              className="max-h-[340px] overflow-y-auto py-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {results.map((food, idx) => {
                const isSelected = selected?.fdcId === food.fdcId;
                const rawCal = Math.round(food.calories);
                const displayCal = rawCal > 0 ? rawCal : null;

                return (
                  <motion.li
                    key={`${food.fdcId}-${idx}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.035, 0.25) }}
                  >
                    <div
                      onClick={() => !isSelected && handleSelect(food)}
                      className={`px-4 flex items-center gap-0 transition-all duration-200 ${
                        isSelected
                          ? 'bg-stone-50 py-3 cursor-default'
                          : `py-2.5 cursor-pointer hover:bg-stone-50 ${idx === activeIdx ? 'bg-stone-50' : ''}`
                      }`}
                      onMouseEnter={() => !isSelected && setActiveIdx(idx)}
                    >
                      {/* Food name */}
                      <div className="flex-1 min-w-0 mr-3">
                        <div className={`text-sm truncate transition-colors ${isSelected ? 'text-stone-700' : 'text-stone-800'}`}>
                          {food.name}
                        </div>
                        {food.brandOwner ? (
                          <div className="text-[10px] text-stone-400 truncate mt-0.5">{food.brandOwner}</div>
                        ) : (food.dataType === 'Foundation' || food.dataType === 'SR Legacy') ? (
                          <div className="text-[10px] text-emerald-600/70 mt-0.5">whole food</div>
                        ) : null}
                      </div>

                      {/* Kcal — only shown when NOT selected */}
                      {!isSelected && (
                        <div className="text-xs font-mono shrink-0 text-stone-400">
                          {displayCal !== null ? (
                            <>
                              <span className="font-medium text-stone-600">{displayCal}</span>
                              <span className="ml-0.5">kcal</span>
                            </>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </div>
                      )}

                      {/* Divider + ratio × base + kcal — only when selected */}
                      {isSelected && (
                        <>
                          <div className="w-px self-stretch bg-stone-200 shrink-0 mx-3" />

                          <div
                            className="flex items-center gap-2.5 shrink-0 mr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-sm font-mono font-semibold text-stone-700 tabular-nums">
                              {Math.round((per100g.calories ?? 0) * ratio * baseGrams / 100)}
                              <span className="text-stone-400 font-normal ml-0.5 text-[11px]">kcal</span>
                            </span>

                            <div className="w-px self-stretch bg-stone-200 shrink-0" />

                            <input
                              ref={ratioInputRef}
                              type="number"
                              value={ratioInput}
                              onChange={(e) => handleRatioChange(e.target.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') handleConfirm();
                                if (e.key === 'Escape') setSelected(null);
                              }}
                              step={0.1}
                              min={0.1}
                              className="w-10 text-center text-base font-mono font-semibold text-stone-800 outline-none bg-transparent leading-tight"
                            />
                            <span className="text-[11px] text-stone-500 tabular-nums">× {baseLabel}</span>
                          </div>

                          {/* Confirm */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                            className="w-7 h-7 flex items-center justify-center bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors shrink-0"
                          >
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
          </AnimatePresence>

          {query && !loading && results.length === 0 && (
            <div className="px-4 py-5 text-sm text-stone-400 text-center">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <motion.div
          className="text-center mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.2 }}
        >
          <span className="text-[10px] text-stone-400">
            {selected ? 'enter to add · esc to deselect' : 'esc to close · ↑↓ navigate'}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
