'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { forceCollide, forceManyBody } = require('d3-force-3d');
import { FoodEntry, FoodMicros, NutritionTargets, AnyGraphNode, GraphEdge, FoodGraphNode, GhostNodeData, MICRO_LABELS } from '@/lib/types';
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
  onAddFood?: () => void;
  onGhostClick: (ghost: GhostNodeData) => void;
  width: number;
  height: number;
}

interface GraphLink {
  source: string;
  target: string;
  score: number;
  sharedMicros: (keyof FoodMicros)[];
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
      links: edges.map((e: GraphEdge) => ({ source: e.source, target: e.target, score: e.score, sharedMicros: e.sharedMicros })),
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

  useEffect(() => {
    const configure = () => {
      const fg = graphRef.current;
      if (!fg || typeof fg.d3Force !== 'function') return false;

      fg.d3Force('charge', forceManyBody().strength(-90));

      const linkForce = fg.d3Force('link');
      if (linkForce) linkForce.distance(180).strength(0.012);

      fg.d3Force('collision', forceCollide((node: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const isGhost = node.isGhost === true;
        return getNodeRadius(node.calories ?? 0, isGhost) + 20;
      }).strength(1));

      fg.d3ReheatSimulation();
      return true;
    };

    if (configure()) return;

    const interval = setInterval(() => {
      if (configure()) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [graphData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkColor = useCallback((link: any) => {
    const score = (link as GraphLink).score ?? 0;
    const alpha = Math.min(0.35 + score * 0.3, 0.8);
    return `rgba(100, 95, 88, ${alpha})`;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkWidth = useCallback((link: any) => {
    const score = (link as GraphLink).score ?? 0;
    return Math.min(1.2 + score * 0.8, 4);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkLabel = useCallback((link: any) => {
    const micros = (link as GraphLink).sharedMicros ?? [];
    return micros.map((m) => MICRO_LABELS[m]).join(' · ');
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
        linkLabel={linkLabel}
        linkDirectionalArrowLength={0}
        cooldownTicks={150}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
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
    </div>
  );
}
