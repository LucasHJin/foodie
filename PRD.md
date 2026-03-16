# Foodie — Product Requirements Document

## 1. Product Vision & Goals

**Vision:** Foodie transforms nutrition tracking from tedious list-making into an intuitive visual experience. The graph is the interface — users see their day's eating as a living map where relationships between foods and nutrient gaps become visible at a glance.

**Goals:**

- **Primary:** Enable users to log food and visualize daily nutrition as an interactive force-directed graph
- **Secondary:** Surface nutrient gaps via ghost nodes (suggested foods) and micronutrient-based edges
- **Differentiator:** Local-first storage — data stays on the user's machine; built with a storage abstraction so Obsidian vault integration can be dropped in post-hackathon

---

## 2. User Flows

**Flow 1 — First Launch (one-time)**

1. User opens app → sees profile setup
2. Profile setup: goal (bulk/cut/maintain), weight (kg), age, sex, activity level
3. App calls Gemini 2.5 Flash (or heuristic fallback) to infer TDEE and macro/micro targets → saved to IndexedDB
4. Redirect to today's graph (empty)

**Flow 2 — Add Food**

1. User clicks bottom-center plus button
2. A floating search bar appears centered on screen (no modal backdrop, minimal chrome)
3. Nothing shown until user begins typing
4. User types → debounced API call to USDA; suggestions appear inline as a short list (food name + calories)
5. User clicks a suggestion → bar dismisses, node animates onto graph
6. Food data written to IndexedDB for current day

**Flow 3 — Navigate & Explore**

1. Prev/Next arrows change date → load that day's data from IndexedDB
2. Graph re-renders with nodes for that day
3. Hover node → floating macro ring card
4. Ghost nodes (pale) suggest foods to fill nutrient gaps

---

## 3. Component Breakdown

| Component               | Responsibility                                                                                                               | Key Dependencies      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **App Shell**           | Layout, day navigation chrome, calorie bar                                                                                   | —                     |
| **OnboardingFlow**      | First-launch profile setup: goal, weight, activity; save to storage                                                          | StorageAdapter        |
| **GraphCanvas**         | Force-directed graph, node sizing, micro-based edges, ghost nodes                                                            | react-force-graph, D3 |
| **FoodNode**            | Single node: size (calories), monochrome shade, hover state                                                                  | —                     |
| **GhostNode**           | Pale/dashed node for nutrient-gap suggestions                                                                                | —                     |
| **MacroRingCard**       | Floating hover card: macro donut ring, top micros                                                                            | —                     |
| **FoodSearchBar**       | Floating search bar (shown on plus press); inline suggestions as you type; no backdrop                                       | Food API client       |
| **CalorieBar**          | Minimal bar: today's cals vs goal; click → NutrientDetailPanel                                                               | —                     |
| **NutrientDetailPanel** | Expanded panel with macro + micro progress bars vs daily targets                                                             | —                     |
| **DayNavigator**        | Prev/Next arrows, date display                                                                                               | —                     |
| **StorageAdapter**      | Abstract interface: `loadDay()`, `saveDay()`, `loadConfig()`, `saveConfig()` — backed by IndexedDB now, Obsidian vault later | idb-keyval            |

---

## 4. Data Model

### 4.1 In-Memory Types

```typescript
interface FoodEntry {
  id: string;           // FDC ID as string
  fdcId: number;
  name: string;
  amount: number;       // grams
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros: FoodMicros;
  addedAt: string;      // ISO timestamp
}

interface UserConfig {
  goal: 'bulk' | 'cut' | 'maintain';
  weight: number;       // kg
  age: number;
  sex: 'male' | 'female';
  activityLevel: ActivityLevel;
  targets: NutritionTargets;
}
```

---

## 5. API Integration

### 5.1 Food Data API — USDA FoodData Central

**Endpoints:**
- `GET /api/food/search?query={term}` → proxies to USDA, returns top 8 results
- `GET /api/food/{fdcId}` → proxies to USDA, returns full nutrient detail

**Debounce:** 300ms. Rate limit: 1,000/hr (more than sufficient).

### 5.2 Macro/Micro Target Inference — Gemini 2.5 Flash

Single call on profile save. Falls back to Mifflin-St Jeor heuristic if key missing or call fails.

**Route:** `POST /api/ai/targets`

---

## 6. Storage Strategy

IndexedDB via `idb-keyval` during hackathon. `StorageAdapter` interface allows drop-in swap to Obsidian vault adapter later.

---

## 7. Graph Behavior

### Node Appearance
- **Size:** `radius = sqrt(calories) * 0.8` — larger = more caloric
- **Color:** Monochrome — darker shades for more calorie-dense foods. Range: `rgb(30,30,30)` to `rgb(180,175,168)`.
- **Ghost nodes:** Very pale `rgb(220,217,212)` with dashed ring — suggest foods for nutrient gaps

### Edge Logic — Micro-based Complementarity

For each food pair (A, B):
1. Find micros where either food contributes ≥10% of daily target
2. Sum their combined % of daily goal across those micros
3. Draw edge only if score ≥ 0.25 AND at least 2 significant micros

```typescript
function computeEdgeScore(a, b, targets): number {
  // For each micro hitting 10% threshold in either food,
  // score += (a_micro + b_micro) / target
}
```

### Ghost Nodes
- Top 3 nutrients where consumed < 50% of target
- Static food suggestions per nutrient (spinach→iron, salmon→vitD, etc.)

### Calorie Bar
- Bottom strip: `1450 / 2200 kcal`
- Click → NutrientDetailPanel with progress bars for all macros + micros

---

## 8. Phased Build Plan (4-Hour Hackathon)

### Phase 1 — Foundation (55 min)
- Scaffold: `npx create-next-app@latest . --typescript --tailwind --app`
- `StorageAdapter` interface + `IndexedDBAdapter`
- Onboarding flow → Gemini targets → save config
- Day navigator shell

### Phase 2 — Graph Core (75 min)
- `react-force-graph-2d` with dynamic import
- Node sizing, monochrome shading, edge computation
- Ghost nodes (static suggestions)

### Phase 3 — Add Food Flow (55 min)
- USDA API routes + FoodSearchBar component
- Save to storage, re-render graph

### Phase 4 — Polish (35 min)
- CalorieBar + NutrientDetailPanel
- MacroRingCard (hover)
- UI cleanup

---

## 9. Tech Stack

| Layer     | Choice                                    | Rationale                                                                   |
| --------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript      | API routes proxy USDA + Gemini keys server-side; single `"use client"` page |
| Graph     | react-force-graph-2d                      | Force-directed, canvas-based, handles large node counts                     |
| Styling   | Tailwind CSS v4                           | Rapid, consistent; enforce monochrome via custom palette                    |
| Storage   | idb-keyval (IndexedDB)                    | Simple KV, async, behind `StorageAdapter` interface                         |
| Food API  | USDA FoodData Central (via Route Handler) | Key stays server-side; 1000 req/hr, full micro data for edge logic          |
| AI        | Gemini 2.5 Flash (via Route Handler)      | Key stays server-side; structured JSON output, model: `gemini-2.5-flash`    |
| State     | React Context + useReducer                | Sufficient for this app scope                                               |

### Next.js Architecture Notes

- `app/page.tsx` — single page, `"use client"`, renders the full graph UI
- `app/api/food/search/route.ts` — proxies to USDA, injects `USDA_API_KEY` server-side
- `app/api/food/[fdcId]/route.ts` — proxies food detail to USDA
- `app/api/ai/targets/route.ts` — calls Gemini with user profile, returns targets JSON
- `USDA_API_KEY` and `GEMINI_API_KEY` in `.env.local` — never sent to client

---

## 10. Out of Scope (Post-Hackathon)

- Obsidian vault integration (StorageAdapter abstraction makes this a clean add-on, ~2–3hr)
- Ghost node API calls (real USDA nutrient lookup for suggestions; uses static presets for now)
- Multi-day trends or analytics view
- Mobile responsiveness (desktop-first)
- Authentication / cloud sync
- Barcode scanning
