'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FoodEntry, NutritionTargets, AnyGraphNode, GraphEdge, FoodGraphNode, GhostNodeData } from '@/lib/types';
import { buildEdges } from '@/lib/graph/edgeLogic';
import { computeGhostNodes } from '@/lib/graph/ghostNodes';
import MacroRingCard from './MacroRingCard';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => null,
});

interface GraphCanvasProps {
  entries: FoodEntry[];
  targets: NutritionTargets;
  onAddFood: () => void;
  onGhostClick: (ghost: GhostNodeData) => void;
  width: number;
  height: number;
}

interface GraphLink {
  source: string;
  target: string;
  score: number;
}

interface GraphData {
  nodes: AnyGraphNode[];
  links: GraphLink[];
}

function getNodeShade(calories: number, isGhost: boolean): string {
  if (isGhost) return 'rgba(212, 209, 204, 0.7)';
  const intensity = Math.min(calories / 700, 1);
  const shade = Math.round(175 - intensity * 145);
  return `rgb(${shade}, ${Math.round(shade * 0.98)}, ${Math.round(shade * 0.96)})`;
}

function getNodeRadius(calories: number, isGhost: boolean): number {
  if (isGhost) return 14;
  return Math.max(8, Math.sqrt(Math.max(calories, 10)) * 0.85);
}

export default function GraphCanvas({
  entries,
  targets,
  onAddFood,
  onGhostClick,
  width,
  height,
}: GraphCanvasProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<FoodGraphNode | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const graphRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const foodNodes: FoodGraphNode[] = entries.map((e) => ({ ...e, isGhost: undefined }));
    const ghostNodes: GhostNodeData[] = computeGhostNodes(entries, targets);
    const edges = buildEdges(entries, targets);

    setGraphData({
      nodes: [...foodNodes, ...ghostNodes],
      links: edges.map((e: GraphEdge) => ({ source: e.source, target: e.target, score: e.score })),
    });
  }, [entries, targets]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isGhost = (node as GhostNodeData).isGhost === true;
      const calories = node.calories ?? 0;
      const radius = getNodeRadius(calories, isGhost);
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;

      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, 2 * Math.PI);

      if (isGhost) {
        ctx.fillStyle = 'rgba(220, 218, 214, 0.5)';
        ctx.fill();
        ctx.setLineDash([2 / globalScale, 2 / globalScale]);
        ctx.strokeStyle = 'rgba(180, 176, 170, 0.8)';
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = getNodeShade(calories, false);
        ctx.fill();
      }

      const minScaleForLabel = isGhost ? 0.3 : 0.5;
      if (globalScale >= minScaleForLabel) {
        const label = node.name.length > 14 ? node.name.slice(0, 14) + '…' : node.name;
        const fontSize = Math.max(9, 11 / globalScale);
        ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isGhost ? 'rgba(160, 155, 148, 0.9)' : 'rgba(55, 50, 45, 0.85)';
        ctx.fillText(label, nx, ny + radius + fontSize * 1.2);
      }
    },
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const isGhost = (node as GhostNodeData).isGhost === true;
      const radius = getNodeRadius(node.calories ?? 0, isGhost);
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      ctx.beginPath();
      ctx.arc(nx, ny, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const handleNodeHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any | null) => {
      if (!node || node.isGhost) {
        setHoveredNode(null);
        return;
      }
      setHoveredNode(node as FoodGraphNode);
    },
    []
  );

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (node.isGhost) {
        onGhostClick(node as GhostNodeData);
      }
    },
    [onGhostClick]
  );

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setHoverPos({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkColor = useCallback((link: any) => {
    const score = (link as GraphLink).score ?? 0;
    const alpha = Math.min(0.15 + score * 0.12, 0.55);
    return `rgba(100, 95, 88, ${alpha})`;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkWidth = useCallback((link: any) => {
    const score = (link as GraphLink).score ?? 0;
    return Math.min(0.5 + score * 0.4, 2.5);
  }, []);

  return (
    <div className="relative w-full h-full">
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-stone-300 text-sm font-medium mb-1">Nothing logged yet</div>
          <div className="text-stone-300 text-xs">Add your first food to begin</div>
        </div>
      )}

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="#F5F4F0"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeLabel={() => ''}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={0}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        minZoom={0.3}
        maxZoom={5}
      />

      {hoveredNode && (
        <MacroRingCard
          entry={hoveredNode}
          x={hoverPos.x}
          y={hoverPos.y}
        />
      )}

      <button
        onClick={onAddFood}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-11 h-11 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors shadow-lg shadow-stone-300/40 hover:shadow-stone-400/40 hover:scale-105 active:scale-95"
        aria-label="Add food"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
