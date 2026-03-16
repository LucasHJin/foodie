# Interface Design Reference

## Core Craft Principles

### Surface & Token Architecture

Every color traces back to primitives: foreground, background, border, brand, semantic. Build surface elevation (Level 0–4). Surfaces should be barely different but distinguishable. Borders: low opacity (0.05–0.12 alpha). Text hierarchy: primary, secondary, tertiary, muted. Border progression: default, subtle, strong, stronger.

### Spacing System

Base unit (4px or 8px) + multiples. Symmetrical padding. Border radius: sharper = technical, rounder = friendly. Pick a scale and use consistently.

### Depth Strategy

Choose ONE:
- **Borders-only** — Clean, technical. `border: 0.5px solid var(--border)`
- **Subtle shadows** — `0 1px 3px rgba(0,0,0,0.08)`
- **Layered shadows** — Multiple layers for premium feel
- **Surface color shifts** — Background tints establish hierarchy

### Controls

Never use native `<select>` or `<input type="date">` for styled UI — they render OS-native. Build custom: trigger + positioned dropdown, input + calendar popover.

### Typography

Headlines: weight + tight tracking. Body: comfortable weight. Labels: medium at small sizes. Data: monospace, tabular-nums. Animation: ~150ms micro, 200–250ms transitions. Deceleration easing, no spring/bounce.

---

## Memory Management (system.md)

**Add patterns when:** Component used 2+ times, reusable across project, specific measurements worth remembering.

**Don't document:** One-off components, temporary experiments, variations better handled with props.

**Format:**
```markdown
### Button Primary
- Height: 36px
- Padding: 12px 16px
- Radius: 6px
```

**Validation:** Spacing on grid? Depth strategy consistent? Colors from palette? Patterns reused?

---

## Critique Protocol

After building, review like a design lead:

**Composition:** Layout rhythm? Proportions doing work? Clear focal point?

**Craft:** Spacing grid (multiples of 4). Typography hierarchy (weight, tracking, opacity). Surfaces whisper hierarchy. Interactive elements have hover/press states.

**Content:** Does the screen tell one coherent story?

**Structure:** No negative margins, calc() workarounds, absolute positioning hacks.

**Again:** "If they said this lacks craft, what would they point to?" Fix that. Ask again.
