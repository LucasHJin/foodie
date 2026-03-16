# Knowledge Graph Minimalist Interface

Guidance for building knowledge graph UIs that put the graph first and keep chrome minimal.

---

## Intent

**Who:** Someone exploring relationships, tracing connections, or understanding structure. Researcher, analyst, or power user.

**What they do:** Navigate the graph, select nodes/edges, inspect properties, search, filter. The graph is the primary object — everything else supports it.

**Feel:** Calm, focused, technical. Like a map or blueprint — the structure speaks, the UI recedes.

---

## Design Direction: Knowledge Graph Minimalist

| Aspect | Recommendation | Rationale |
|--------|----------------|-----------|
| **Depth** | Borders-only or surface shifts | Shadows compete with graph edges; flat surfaces let the graph breathe |
| **Chrome** | Minimal — search, maybe a small filter bar | Every pixel of UI steals from the graph canvas |
| **Colors** | Muted base, single accent for selection/highlight | Graph nodes/edges need to carry meaning; UI should not compete |
| **Typography** | Monospace or technical sans for labels | Data feels like data; labels should feel precise |
| **Spacing** | Tight (4px base) | Density supports exploration; generous padding wastes graph real estate |

---

## Graph-Specific Principles

### The Graph Is the Hero

The canvas dominates. Sidebars, panels, toolbars — all secondary. If a control can be hidden, collapsed, or shown on demand, prefer that. Full-screen graph with overlay panels beats split layouts.

### Node & Edge Styling

- **Nodes:** Minimal fill, subtle border. Size/color by meaning (type, importance), not decoration
- **Edges:** Thin, low-opacity. Direction matters — arrows or asymmetry. Avoid thick, colorful edges that dominate
- **Selection:** One clear accent. Selected state must be obvious; hover state subtle
- **Labels:** Readable at zoom levels users will use. Consider truncation + tooltip for long labels

### Interaction Patterns

- **Zoom/pan:** Smooth, responsive. The graph should feel like a surface you're moving through
- **Click:** Select node/edge. Secondary action (e.g., double-click) for drill-down or detail
- **Hover:** Light highlight. Don't obscure the graph with heavy overlays
- **Search/filter:** Inline or compact. Results should integrate (highlight matches, focus subgraph) rather than replace

### Property Panels

When showing node/edge details:
- **Position:** Overlay (bottom, side) or slide-out. Not a permanent split that shrinks the graph
- **Style:** Borders-only, minimal padding. Same token system as rest of UI
- **Content:** Scannable — labels, key-value pairs. Monospace for IDs, codes, URIs

### Empty & Loading States

- **Empty:** "No nodes" or "Add your first entity" — minimal, centered
- **Loading:** Skeleton graph (placeholder nodes) or subtle spinner. Don't block the whole canvas with a modal

---

## What to Avoid

- Heavy shadows or gradients on the graph canvas
- Dense toolbars with many icons
- Multiple accent colors (pick one for selection/emphasis)
- Decorative node shapes (circles and rounded rects are enough)
- Cluttered legends — integrate into the graph or collapse
- Full-width sidebars that permanently reduce graph space

---

## Suggested Tokens (Minimalist)

```css
/* Base */
--canvas: #0a0a0a;           /* or light equivalent */
--node-fill: rgba(255,255,255,0.06);
--node-border: rgba(255,255,255,0.12);
--edge: rgba(255,255,255,0.2);
--edge-hover: rgba(255,255,255,0.4);
--accent: #3b82f6;           /* selection, focus */

/* Chrome (minimal) */
--chrome-bg: transparent or same as canvas;
--chrome-border: rgba(255,255,255,0.06);
--chrome-text: rgba(255,255,255,0.6);
```

---

## Example Flow

1. **Load:** Full-screen graph, no sidebar. Maybe a small search in corner
2. **Explore:** Zoom, pan, hover for light highlight
3. **Select:** Click node → accent outline, maybe compact property strip at bottom
4. **Drill:** Double-click or "Expand" → subgraph or detail panel overlays
5. **Filter:** Compact filter bar appears on demand, collapses when done
