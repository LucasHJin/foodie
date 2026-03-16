'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResult } from '@/lib/types';

interface FoodSearchBarProps {
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}

export default function FoodSearchBar({ onSelect, onClose }: FoodSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.foods ?? []);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
      onSelect(results[activeIdx]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[480px] max-w-[calc(100vw-2rem)]">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/60 overflow-hidden">
          <div className="flex items-center px-4 border-b border-stone-100">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              className="text-stone-400 shrink-0"
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search foods…"
              className="flex-1 py-4 px-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none bg-transparent"
            />
            {loading && (
              <div className="w-4 h-4 border border-stone-300 border-t-stone-600 rounded-full animate-spin shrink-0" />
            )}
            {!loading && query && (
              <button
                onClick={() => setQuery('')}
                className="text-stone-300 hover:text-stone-500 transition-colors shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {results.length > 0 && (
            <ul className="max-h-[320px] overflow-y-auto py-1">
              {results.map((food, idx) => (
                <li key={food.fdcId}>
                  <button
                    onClick={() => onSelect(food)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                      idx === activeIdx ? 'bg-stone-50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-stone-800 truncate">{food.name}</div>
                      {food.brandOwner && (
                        <div className="text-[10px] text-stone-400 truncate mt-0.5">{food.brandOwner}</div>
                      )}
                    </div>
                    <div className="text-xs font-mono text-stone-400 shrink-0">
                      <span className="text-stone-600 font-medium">{Math.round(food.calories)}</span> kcal
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query && !loading && results.length === 0 && (
            <div className="px-4 py-5 text-sm text-stone-400 text-center">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div className="text-center mt-2">
          <span className="text-[10px] text-stone-400">esc to close · ↑↓ to navigate · enter to select</span>
        </div>
      </div>
    </div>
  );
}
