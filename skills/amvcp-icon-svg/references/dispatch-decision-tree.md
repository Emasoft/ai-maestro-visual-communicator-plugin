# Dispatch decision tree — which skill renders what

## Table of Contents

- [The 60-second routing answer](#the-60-second-routing-answer)
- [The boundary contracts (cross-skill seams)](#the-boundary-contracts-cross-skill-seams)
- [Negative routing — what icon-svg is NOT](#negative-routing--what-icon-svg-is-not)
- [Choosing a sub-technique inside icon-svg](#choosing-a-sub-technique-inside-icon-svg)
- [Selection / comment / decision-pill integration](#selection--comment--decision-pill-integration)
- [When in doubt](#when-in-doubt)

The visual-communicator plugin ships multiple complementary SVG / HTML
visualization skills. Pick the wrong one and you waste a render: a
chart in icon-svg looks like a static decoration, a node primitive
exported as a Mermaid graph loses every selection atom. This document
is the routing contract for the agent before any visual is emitted.

## The 60-second routing answer

```
Is the visual data-driven (axis, values, time series, percentages)?
  YES -> chart skill (line / bar / area / sparkline / radar / donut)
  NO  -> continue

Does the visual have multiple nodes connected by edges (a graph)?
  YES, with explicit coordinates / fixed shape vocabulary
       (process-flow lane, layered architecture, phase plan)?
       -> diagram skill (SVG scene-graph)
  YES, with automatic layout / 9+ nodes / no coordinates?
       -> diagram skill, Graphviz/DOT path
  YES, expressible in Mermaid's terse syntax
       (flowchart / sequence / ER / state / class / mindmap)?
       -> graph-diagrams skill (Mermaid)
  NO -> continue

Is the visual a UI / app layout sketch?
  YES, low-fidelity / wireframe-quality?
       -> wireframe skill (grayscale 15-class kit)
  YES, a device mockup wrapper around content
       (iPhone / Android phone / Mac window / browser tab)?
       -> THIS skill: deviceFrame({kind, content, ...})
  NO -> continue

Is the visual a standalone authored asset?
  An icon / mark / logo / decorative geometric shape /
  network cylinder / decision diamond / cloud / annotated image?
  -> THIS skill (icon-svg)
```

## The boundary contracts (cross-skill seams)

### Boundary with `diagram`

The five **node primitive builders** in icon-svg's `builders` export
(`nodeProcess`, `nodeDatabase`, `nodeDecision`, `nodeExternal`,
`nodeNetwork`) are CONSUMED BY the `diagram` skill. Diagram's
scene-graph emits a process-flow / architecture-canvas / phase-graph
that arranges multiple icon-svg nodes plus edges, labels, groups, and
automatic layout. The split:

- icon-svg = ONE SHAPE (the rounded rect, the cylinder, the diamond).
  Authored as a `scene-graph` of `primitives`, no automatic layout,
  no edges, no groups.
- diagram = MANY shapes connected by edges, with automatic layout,
  edge routing, animated flow, group rectangles, scroll-reveal.

A single-node visual ("a database cylinder labelled `users`") is
icon-svg, not diagram. A two-node visual with a labelled arrow
between them is diagram, not icon-svg.

### Boundary with `wireframe`

The four **device frames** (`deviceFrame({kind: ios|android|mac|
browser})`) are SHARED. The icon-svg module is the canonical owner;
the wireframe module re-exposes them via `wf-frame--<kind>` class
aliases (defined in the injected CSS) so a wireframe page can place a
device mockup without importing icon-svg's JS API. The split:

- icon-svg = the implementation (JS, CSS, glyphs, traffic lights).
- wireframe = pulls in the same CSS classes and uses them as one of
  the layout archetypes.

A device frame WITH realistic content (real text, real buttons, a
real screenshot) is icon-svg. A device frame WITH placeholder boxes
(no shadows, no color, fidelity-locked) is wireframe — but the
wrapper class is the same.

### Boundary with `chart`

icon-svg is allowed to emit decorative shapes (`shape-arrow-right`,
`shape-star`, `shape-hexagon`) that LOOK like single-bar mini-charts.
They are NOT chart-skill output — they have no data binding, no
axis, no value labels, no tooltip. Any visual that says "X% Y" or
"N over time" or "rank by Z" is chart skill output. If the user's
brief is `"a star icon"` it is icon-svg; if it is `"a 4-star rating
out of 5"` that's a chart-style display, route to chart.

### Boundary with `interactive-control`

Hotspot click / select behavior is provided by the
`interactive-control` runtime (the `data-ve-id` click handler in
`amvcp-runtime.js`). icon-svg only emits the markers and the
`data-ve-id` hooks. A hotspot WITHOUT interactive selection is still
icon-svg (the hotspot's tooltip / aria-label is a passive
annotation). The moment a hotspot does anything on click — opens a
modal, swaps content, toggles a class — that behavior lives in
interactive-control, NOT in icon-svg.

### Boundary with `report-doc`

A standalone authored asset is icon-svg. A multi-section document
(summary band + milestone timeline + data-flow svg + paired mockups +
risk table + open questions — the `16-implementation-plan` archetype)
is report-doc, which COMPOSES icon-svg figures as one of its sections.

## Negative routing — what icon-svg is NOT

- NOT chart: no axis, no data binding, no time series.
- NOT diagram: no edges, no automatic layout, no scene with multiple
  connected nodes.
- NOT wireframe: a device frame's content is REAL (real prose, real
  UI controls); a wireframe is FIDELITY-LOCKED placeholder boxes.
- NOT interactive: hotspots are markers, not buttons. The runtime's
  click handler adds the behavior; icon-svg is structural.
- NOT a renderer: icon-svg authors the JSON scene-graph and trusts the
  module to emit the SVG. The author NEVER writes raw SVG by hand.
- NOT pixel art: no canvas, no 8x8 bitmap font, no sprite blitter
  (IS-05 explicitly excluded — see
  `references/canvas-pixel-art-exclusion.md`).
- NOT a Playwright font-to-path embed: no fontkit, no headless browser
  (IS-08 explicitly excluded — see
  `references/fontkit-glyph-exclusion.md`).

## Choosing a sub-technique inside icon-svg

Once you've routed to icon-svg, pick the sub-technique:

```
A SINGLE shape (icon / decoration)?
  Structural node (process / database / decision / external / network)?
    -> node primitive (see references/node-*.md)
  Editorial mark (composition primitive)?
    -> logo primitive (see references/logo-*.md)
  Pure decorative geometric shape (chevron / hexagon / star)?
    -> shape primitive (see references/shape-*.md)
    OR a CSS-only .isvg-shape-* class (no SVG at all)

A DEVICE WRAPPER around content?
  iOS / Android / Mac / browser?
    -> deviceFrame({kind: ..., content: ...}) (see references/device-frame-*.md)

An ANNOTATED IMAGE?
  Image + N markers at known coordinates?
    -> .isvg-annotated + .isvg-hotspot markup (see references/hotspot-annotation.md)
```

## Selection / comment / decision-pill integration

Every primitive icon-svg emits is a `data-ve-id` selection atom.
That happens regardless of which sub-technique you picked. So:
authoring an icon = authoring a selectable atom. The runtime's
selection state, comment threads, and per-atom decision pill all
work automatically on every icon-svg output. You do NOT add a
click handler. You do NOT wire selection state. See
`references/data-ve-id-selection.md` and
`references/decision-mini-pill.md` for the integration contract.

## When in doubt

When the brief is ambiguous (the user wants "a small icon next to the
team header"), default to icon-svg. The boundary cases are all about
escaping icon-svg's narrow scope; the default is the lowest-friction
authored asset. If the user reacts with "no, that's too plain, I
wanted real data" you're in chart skill; "no, that's too small, I
wanted a flowchart" you're in diagram skill. The wrong-default cost
is one re-roll.
