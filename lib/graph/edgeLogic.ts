import { FoodEntry, FoodMicros, MicroTargets, GraphEdge } from '../types';

const EDGE_THRESHOLD = 0.35;
const MICRO_SIGNIFICANCE = 0.15;

const MICRO_KEYS: (keyof FoodMicros)[] = [
  'iron_mg',
  'calcium_mg',
  'vitaminD_mcg',
  'vitaminC_mg',
  'zinc_mg',
  'magnesium_mg',
  'potassium_mg',
  'vitaminA_mcg',
  'vitaminB6_mg',
  'vitaminB12_mcg',
  'folate_mcg',
  'phosphorus_mg',
];

export function computeEdgeScore(
  a: FoodEntry,
  b: FoodEntry,
  targets: MicroTargets
): { score: number; sharedMicros: (keyof FoodMicros)[] } {
  let score = 0;
  const sharedMicros: (keyof FoodMicros)[] = [];

  for (const micro of MICRO_KEYS) {
    const target = targets[micro];
    if (!target) continue;

    const aVal = a.micros[micro] ?? 0;
    const bVal = b.micros[micro] ?? 0;

    const aRatio = aVal / target;
    const bRatio = bVal / target;

    if (aRatio >= MICRO_SIGNIFICANCE || bRatio >= MICRO_SIGNIFICANCE) {
      score += aRatio + bRatio;
      sharedMicros.push(micro);
    }
  }

  return { score, sharedMicros };
}

export function buildEdges(nodes: FoodEntry[], targets: MicroTargets): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const { score, sharedMicros } = computeEdgeScore(nodes[i], nodes[j], targets);
      if (score >= EDGE_THRESHOLD && sharedMicros.length >= 2) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          score,
          sharedMicros,
        });
      }
    }
  }

  return edges;
}
