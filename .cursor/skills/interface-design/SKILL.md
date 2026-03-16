---
name: interface-design
description: >-
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use when building dashboards, admin panels, SaaS apps, tools, settings pages,
  data interfaces, or knowledge graph visualizations. Maintains design decisions
  in .interface-design/system.md across sessions. Not for marketing sites or landing pages.
---

# Interface Design

Build interface design with craft and consistency. Craft · Memory · Consistency.

## Scope

**Use for:** Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces, knowledge graph UIs.

**Not for:** Landing pages, marketing sites, campaigns — use a different design approach for those.

---

# The Problem

You will generate generic output. The patterns are strong. You can follow the entire process and still produce a template. Warm colors on cold structures. Friendly fonts on generic layouts.

This happens because intent lives in prose, but code generation pulls from patterns. The gap between them is where defaults win. **Process alone doesn't guarantee craft. You have to catch yourself.**

---

# Where Defaults Hide

Defaults disguise themselves as infrastructure. Typography, navigation, data presentation, token names — these aren't containers. They ARE your design. The moment you stop asking "why this?" is the moment defaults take over.

---

# Intent First

Before touching code, answer these out loud:

**Who is this human?** The actual person. Where are they? What's on their mind?

**What must they accomplish?** The verb. Grade submissions. Find the deployment. Approve the payment.

**What should this feel like?** Say it in words that mean something. "Clean and modern" means nothing. Warm like a notebook? Cold like a terminal? Dense like a trading floor?

If you cannot answer with specifics, stop. Ask the user. Do not guess.

## Every Choice Must Be A Choice

For every decision, explain WHY. If your answer is "it's common" or "it's clean" — you've defaulted.

**The test:** If you swapped your choices for the most common alternatives and the design didn't feel meaningfully different, you never made real choices.

## Sameness Is Failure

If another AI would produce substantially the same output — you have failed. Intent must be systemic: if you say "warm," surfaces, text, borders, accents, typography — all warm.

---

# Product Domain Exploration

**Do not propose any direction until you produce all four:**

**Domain:** Concepts, metaphors, vocabulary from this product's world. Minimum 5.

**Color world:** What colors exist naturally in this domain? List 5+.

**Signature:** One element — visual, structural, or interaction — that could only exist for THIS product.

**Defaults:** 3 obvious choices for this interface type. You can't avoid patterns you haven't named.

Your direction must explicitly reference domain, color world, signature, and what replaces each default.

---

# The Mandate

**Before showing the user, look at what you made.** Ask: "If they said this lacks craft, what would they mean?" Fix that first.

**The Checks:**
- **Swap test:** Would swapping typeface/layout matter? Where it wouldn't, you defaulted.
- **Squint test:** Blur your eyes. Can you still perceive hierarchy? Craft whispers.
- **Signature test:** Can you point to five specific elements where your signature appears?
- **Token test:** Do your CSS variables sound like they belong to this product's world?

---

# Craft Foundations

## Subtle Layering

Surfaces stack. Build a numbered system — base, then increasing elevation. Each jump should be only a few percentage points of lightness. Borders should disappear when you're not looking but be findable when you need structure. Low opacity rgba, not solid hex.

**Key decisions:** Sidebars same background as canvas with subtle border. Dropdowns one level above parent. Inputs slightly darker (inset) than surroundings.

## Infinite Expression

No interface should look the same. A metric display could be hero number, sparkline, gauge, progress bar, trend badge. Before building: What's the ONE thing users do most? Study similar products. NEVER produce identical output.

## Color Lives Somewhere

Every product exists in a world. Your palette should feel like it came FROM somewhere. Color carries meaning — gray builds structure, color communicates status/action/identity.

---

# Before Writing Each Component

**Every time** you write UI code, state:

```
Intent: [who, what they do, how it should feel]
Palette: [colors and WHY they fit]
Depth: [borders / shadows / layered — and WHY]
Surfaces: [elevation scale — and WHY]
Typography: [typeface — and WHY]
Spacing: [base unit]
```

This checkpoint is mandatory. If you can't explain WHY for each choice, you're defaulting.

---

# Design Principles

- **Token architecture:** Foreground, background, border, brand, semantic — map everything to primitives
- **Text hierarchy:** Primary, secondary, tertiary, muted — use all four
- **Spacing:** Base unit + multiples. No random values
- **Depth:** Choose ONE — borders-only, subtle shadows, layered shadows, surface shifts
- **Controls:** Build custom components; native select/input render unstyled
- **States:** Default, hover, active, focus, disabled. Loading, empty, error
- **Navigation context:** Screens need grounding — nav, location, user context

For detailed principles and code examples, see [reference.md](reference.md).

---

# Avoid

- Harsh borders, dramatic surface jumps, inconsistent spacing
- Mixed depth strategies, missing interaction states
- Large radius on small elements, pure white cards on colored backgrounds
- Gradients for decoration, multiple accent colors

---

# Workflow

## If Project Has system.md

Read `.interface-design/system.md` and apply. Decisions are made.

## If No system.md

1. Explore domain — Produce all four required outputs
2. Propose — Direction must reference all four
3. Confirm — Get user buy-in
4. Build — Apply principles
5. **Evaluate** — Run the mandate checks before showing
6. Offer to save

## After Completing a Task

**Always offer to save:** "Want me to save these patterns for future sessions?"

If yes, write to `.interface-design/system.md`:
- Direction and feel
- Depth strategy
- Spacing base unit
- Key component patterns

See [reference.md](reference.md) for validation rules and when to add patterns.

---

# Design Directions

| Direction | Feel | Best For |
|-----------|------|----------|
| **Precision & Density** | Tight, technical, monochrome | Developer tools, admin dashboards |
| **Warmth & Approachability** | Generous spacing, soft shadows | Collaborative tools, consumer apps |
| **Sophistication & Trust** | Cool tones, layered depth | Finance, enterprise B2B |
| **Boldness & Clarity** | High contrast, dramatic space | Modern dashboards, data-heavy apps |
| **Utility & Function** | Muted, functional density | GitHub-style tools |
| **Data & Analysis** | Chart-optimized, numbers-first | Analytics, BI tools |
| **Knowledge Graph Minimalist** | Graph-first, minimal chrome, focus on nodes/edges | Graph explorers, ontology viewers, relationship UIs |

---

# Additional Resources

- [reference.md](reference.md) — Principles, validation, critique protocol
- [examples.md](examples.md) — System file templates (precision, warmth)
- [knowledge-graph.md](knowledge-graph.md) — Knowledge graph minimalist interface guidance
