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

  const handleAddFood = useCallback(async (result: SearchResult) => {
    setSearchOpen(false);

    let nutrientData: Record<string, number> = {
      calories: result.calories,
      protein_g: result.protein_g,
      carbs_g: result.carbs_g,
      fat_g: result.fat_g,
    };

    try {
      const res = await fetch(`/api/food/${result.fdcId}`);
      const data = await res.json();
      if (data.nutrients) nutrientData = { ...nutrientData, ...data.nutrients };
    } catch {
      // proceed with search-result data
    }

    const entry: FoodEntry = {
      id: `${result.fdcId}-${Date.now()}`,
      fdcId: result.fdcId,
      name: result.name,
      amount: 100,
      calories: nutrientData.calories ?? result.calories,
      protein_g: nutrientData.protein_g ?? result.protein_g,
      carbs_g: nutrientData.carbs_g ?? result.carbs_g,
      fat_g: nutrientData.fat_g ?? result.fat_g,
      micros: {
        iron_mg: nutrientData.iron_mg,
        calcium_mg: nutrientData.calcium_mg,
        vitaminD_mcg: nutrientData.vitaminD_mcg,
        vitaminC_mg: nutrientData.vitaminC_mg,
        zinc_mg: nutrientData.zinc_mg,
        magnesium_mg: nutrientData.magnesium_mg,
        potassium_mg: nutrientData.potassium_mg,
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/60 z-10 bg-[#F5F4F0]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-tight text-stone-800">foodie</span>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <span className="text-xs text-stone-400">knowledge graph</span>
        </div>

        <DayNavigator date={currentDate} onDateChange={setCurrentDate} />

        <button
          onClick={async () => {
            await storage.saveConfig(null as unknown as UserConfig);
            setAppState('onboarding');
          }}
          className="text-[10px] text-stone-300 hover:text-stone-500 transition-colors"
          title="Reset profile"
        >
          {config?.goal && (
            <span className="px-2 py-1 bg-stone-100 rounded-full text-stone-500 font-medium capitalize">
              {config.goal}
            </span>
          )}
        </button>
      </div>

      {/* Graph fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <GraphCanvas
          entries={entries}
          targets={config!.targets}
          onAddFood={() => setSearchOpen(true)}
          onGhostClick={handleGhostClick}
          width={dimensions.width}
          height={dimensions.height - 100}
        />
      </div>

      {/* Bottom calorie bar */}
      <div className="border-t border-stone-200/60 bg-[#F5F4F0]/90 backdrop-blur-sm">
        <CalorieBar totals={totals} targets={config!.targets} />
      </div>

      {/* Floating search */}
      {searchOpen && (
        <FoodSearchBar
          onSelect={handleAddFood}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
