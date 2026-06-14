---
name: architecture
description: "how does amvcp (the ai-maestro-visual-communicator-plugin) work — overview, the one-skill-per-thing palette, the runtime + selection round-trip, DESIGN.md theming, where the key pieces live"
ocd: 2026-06-14
lmd: 2026-06-14
metadata:
  node_type: memory
  type: project
  tier: hub
  functionality: architecture
  globs: ["skills/**", "scripts/**", "commands/**", "agents/**"]
---
amvcp gives an agent a palette of **visual-element skills**; each generates a
self-contained, interactive HTML artifact. The axis of uniqueness is THE THING a
skill visualizes (a report, a diff, a chart, a kanban, a slide deck, …) — exactly
one skill per thing, never a mode-variant ("editor"/"viewer"/"exporter" are
facets every element already has, not separate skills). Every element is — by
design — Editable · Commentable · Compilable · Stylizable · Pickable · Exportable.
Composition is by nesting HTML+SVG primitives (SVG is a superset of HTML via
`<foreignObject>`), never a bespoke combined component per request.

## Parts map
- **Runtime** — `scripts/amvcp-runtime.js` (one DOM scan inits every element type
  on the page; exempt from the CPV LOC cap). 
- **Selection round-trip** (the universal edit channel) — `scripts/amvcp-select.py`
  → `{selections:[…]}` JSON → Claude re-emits. Reuse it; never reinvent per-skill.
- **Theming** — DESIGN.md tokens drive the *Graphic Style Mode* (palette, scale,
  spacing, motion); always ship light + dark.
- **Two modes** — *Interaction Design Mode* is FIXED (select → triple-state
  feedback → comment/edit → re-emit, uniform across every element); *Graphic
  Style Mode* is VARIABLE (DESIGN.md-driven).

## Applies to
- (radiates down to component/aspect pages as they are written — e.g. a
  per-element page, the publish pipeline page; wire the reciprocal `## Governed by`)

## See also
- (lateral links to other functionality hubs, once they exist)

## Notes and lessons learned
