import { FoodEntry, FoodMicros, MicroTargets, GraphEdge } from '../types';

const EDGE_THRESHOLD = 0.25;
const MICRO_SIGNIFICANCE = 0.10;

const MICRO_KEYS: (keyof FoodMicros)[] = [
  'iron_mg',
  'calcium_mg',
  'vitaminD_mcg',
  'vitaminC_mg',
  'zinc_mg',
  'magnesium_mg',
  'potassium_mg',
];

export function computeEdgeScore(
  a: FoodEntry,
  b: FoodEntry,
  targets: MicroTargets
): { score: number; significantCount: number } {
  let score = 0;
  let significantCount = 0;

  for (const micro of MICRO_KEYS) {
    const target = targets[micro];
    if (!target) continue;

    const aVal = a.micros[micro] ?? 0;
    const bVal = b.micros[micro] ?? 0;

    const aRatio = aVal / target;
    const bRatio = bVal / target;

    if (aRatio >= MICRO_SIGNIFICANCE || bRatio >= MICRO_SIGNIFICANCE) {
      score += aRatio + bRatio;
      significantCount++;
    }
  }

  return { score, significantCount };
}

export function buildEdges(nodes: FoodEntry[], targets: MicroTargets): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const { score, significantCount } = computeEdgeScore(nodes[i], nodes[j], targets);
      if (score >= EDGE_THRESHOLD && significantCount >= 2) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          score,
        });
      }
    }
  }

  return edges;
}
