'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { UserConfig, FoodEntry, SearchResult, GhostNodeData, DailyTotals, FoodMicros } from '@/lib/types';
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter';
import OnboardingFlow from './_components/OnboardingFlow';
import GraphCanvas from './_components/GraphCanvas';
import DayNavigator from './_components/DayNavigator';
import CalorieBar from './_components/CalorieBar';
import FoodSearchBar from './_components/FoodSearchBar';

const storage = new IndexedDBAdapter();

function computeTotals(entries: FoodEntry[]): DailyTotals {
  const totals: DailyTotals = {
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
    micros: {},
  };
  const microKeys: (keyof FoodMicros)[] = [
    'iron_mg', 'calcium_mg', 'vitaminD_mcg', 'vitaminC_mg',
    'zinc_mg', 'magnesium_mg', 'potassium_mg',
  ];
  for (const entry of entries) {
    totals.calories += entry.calories;
    totals.protein_g += entry.protein_g;
    totals.carbs_g += entry.carbs_g;
    totals.fat_g += entry.fat_g;
    for (const key of microKeys) {
      totals.micros[key] = (totals.micros[key] ?? 0) + (entry.micros[key] ?? 0);
    }
  }
  return totals;
}

type AppState = 'loading' | 'onboarding' | 'app';

export default function FoodiePage() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const update = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await storage.loadConfig();
      if (saved) {
        setConfig(saved);
        setAppState('app');
      } else {
        setAppState('onboarding');
      }
    })();
  }, []);

  useEffect(() => {
    if (appState !== 'app') return;
    (async () => {
      const day = await storage.loadDay(currentDate);
      setEntries(day);
    })();
  }, [currentDate, appState]);

  const handleOnboardingComplete = useCallback(async (cfg: UserConfig) => {
    await storage.saveConfig(cfg);
    setConfig(cfg);
    setAppState('app');
  }, []);

  const handleFoodConfirm = useCallback(async (
    result: SearchResult,
    amountG: number,
    per100g: Record<string, number>
  ) => {
    setSearchOpen(false);
    const ratio = amountG / 100;
    const s = (v: number | undefined) => Math.round(((v ?? 0) * ratio) * 10) / 10;

    const entry: FoodEntry = {
      id: `${result.fdcId}-${Date.now()}`,
      fdcId: result.fdcId,
      name: result.name,
      amount: amountG,
      calories: s(per100g.calories ?? result.calories),
      protein_g: s(per100g.protein_g ?? result.protein_g),
      carbs_g: s(per100g.carbs_g ?? result.carbs_g),
      fat_g: s(per100g.fat_g ?? result.fat_g),
      micros: {
        iron_mg: s(per100g.iron_mg),
        calcium_mg: s(per100g.calcium_mg),
        vitaminD_mcg: s(per100g.vitaminD_mcg),
        vitaminC_mg: s(per100g.vitaminC_mg),
        zinc_mg: s(per100g.zinc_mg),
        magnesium_mg: s(per100g.magnesium_mg),
        potassium_mg: s(per100g.potassium_mg),
        vitaminA_mcg: s(per100g.vitaminA_mcg),
        vitaminB6_mg: s(per100g.vitaminB6_mg),
        vitaminB12_mcg: s(per100g.vitaminB12_mcg),
        folate_mcg: s(per100g.folate_mcg),
        phosphorus_mg: s(per100g.phosphorus_mg),
      },
      addedAt: new Date().toISOString(),
    };

    const updated = [...entries, entry];
    setEntries(updated);
    await storage.saveDay(currentDate, updated);
  }, [entries, currentDate]);

  const handleGhostClick = useCallback((ghost: GhostNodeData) => {
    setSearchOpen(true);
    // Pre-fill with the ghost's suggested food name (FoodSearchBar opens clean; user can type)
    void ghost;
  }, []);

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-6 h-6 border border-stone-200 border-t-stone-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  const totals = computeTotals(entries);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#F5F4F0' }}
    >
      {/* Graph fills full screen */}
      <div className="flex-1 relative overflow-hidden">
        <GraphCanvas
          entries={entries}
          targets={config!.targets}
          onAddFood={() => setSearchOpen(true)}
          onGhostClick={handleGhostClick}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* Floating date navigator — top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-white/85 backdrop-blur-sm border border-stone-200/70 rounded-full px-4 py-2 shadow-sm shadow-stone-200/40">
            <DayNavigator date={currentDate} onDateChange={setCurrentDate} />
          </div>
        </div>

        {/* Calorie pill — bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <CalorieBar totals={totals} targets={config!.targets} />
        </div>

        {/* Add food button — bottom right */}
        <button
          onClick={() => setSearchOpen(true)}
          className="absolute bottom-6 right-6 z-20 w-11 h-11 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors shadow-lg shadow-stone-300/40 hover:shadow-stone-400/40 hover:scale-105 active:scale-95"
          aria-label="Add food"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Floating search + inline amount confirm */}
      {searchOpen && (
        <FoodSearchBar
          onConfirm={handleFoodConfirm}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
