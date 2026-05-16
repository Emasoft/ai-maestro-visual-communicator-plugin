# Integration with other AMVCP skills

The wireframe doesn't live alone — it composes with the design-
tokens engine, the runtime's selection/comment system, the layout
skill's grid primitives, the interactive-controls slider, and more.
This file documents the seams.

## Table of contents

- [The plugin architecture (which skill does what)](#the-plugin-architecture-which-skill-does-what)
- [Integration 1 — DESIGN.md engine (`amvcp-design-tokens`)](#integration-1--designmd-engine-amvcp-design-tokens)
- [Integration 2 — Runtime selection + comments (`amvcp-runtime` / `amvcp-modal-comments`)](#integration-2--runtime-selection--comments-amvcp-runtime--amvcp-modal-comments)
- [Integration 3 — Layout grid primitives (`amvcp-layout`)](#integration-3--layout-grid-primitives-amvcp-layout)
- [Integration 4 — Interactive controls (`amvcp-interactive-controls`)](#integration-4--interactive-controls-amvcp-interactive-controls)
- [Integration 5 — Charts inside wireframes (`amvcp-charts-and-dashboards`)](#integration-5--charts-inside-wireframes-amvcp-charts-and-dashboards)
- [Integration 6 — Diagrams inside wireframes (`amvcp-diagram`)](#integration-6--diagrams-inside-wireframes-amvcp-diagram)
- [Integration 7 — Tables inside wireframes (`amvcp-tables`)](#integration-7--tables-inside-wireframes-amvcp-tables)
- [Integration 8 — Animation (`amvcp-animation`)](#integration-8--animation-amvcp-animation)
- [Integration 9 — Slide decks (`amvcp-slide-decks`)](#integration-9--slide-decks-amvcp-slide-decks)
- [Loading order — what must be initialized first](#loading-order--what-must-be-initialized-first)

---

## The plugin architecture (which skill does what)

The AMVCP plugin ships ~14 skills, each focused on one visual
discipline:

| Skill | Provides |
|---|---|
| `amvcp-design-tokens` | DESIGN.md engine: `--vc-color-*`, `--vc-space-*`, `--vc-text-*` tokens |
| `amvcp-runtime` | Page-level chrome: selection state, comment modal, theme toggle |
| `amvcp-layout` | `wf-grid`-like primitives, container queries, responsive helpers |
| `amvcp-typography` | Type scale, fluid type, heading hierarchy |
| `amvcp-tables` | Sortable tables, matrix views, virtualized big-data |
| `amvcp-charts-and-dashboards` | Bar/line/pie charts, KPI bands |
| `amvcp-diagram` | Mermaid/d2 diagrams, flowcharts |
| `amvcp-interactive-controls` | Sliders, toggles, expand/collapse |
| `amvcp-animation` | Stagger reveals, scroll triggers, motion tokens |
| `amvcp-modal-comments` | Per-atom comment threads |
| `amvcp-wireframe` | THIS skill — fidelity-locked UI mockups |
| `amvcp-slide-decks` | Slide deck container |
| `amvcp-prose-pages` | Long-form text pages |
| `amvcp-self-debug-rules` | Screenshot verification workflow |

The wireframe consumes MANY of these. The seams below describe
each integration.

---

## Integration 1 — DESIGN.md engine (`amvcp-design-tokens`)

The wireframe is a pure CONSUMER of the DESIGN.md engine. Every
color, every size reads through a `--vc-*` token.

### What the wireframe reads

| Token | Used by |
|---|---|
| `--vc-color-canvas` | screen background |
| `--vc-color-surface` | cards, buttons, inputs |
| `--vc-color-surface-raised` | modals, popovers |
| `--vc-color-surface-sunken` | sidebars, statusbars, table heads |
| `--vc-color-content` | primary text |
| `--vc-color-content-muted` | secondary text |
| `--vc-color-content-subtle` | tertiary text, placeholders |
| `--vc-color-border` | 1px borders |
| `--vc-color-border-strong` | avatar fill, traffic-light dots |
| `--vc-color-accent` | primary CTA fill at mid+ |
| `--vc-color-on-accent` | primary CTA text |
| `--vc-color-success/warning/danger/info` | status chips |
| `--vc-space-0` through `--vc-space-7` | all gaps and paddings |
| `--vc-text-0` through `--vc-text-7` | all type sizes |
| `--vc-radius-sm/md/lg` | per-fidelity rounding |
| `--vc-shadow-sm/md` | per-fidelity elevation |
| `--vc-font-body/display/mono` | font family stack |

### What the wireframe DOESN'T do

- **Doesn't define `--vc-*` tokens.** It consumes only.
- **Doesn't extend the engine.** No `--vc-color-wireframe-*`
  scope.
- **Doesn't override `:root`.** Scoped overrides on
  `[data-wf-root]` only (for the desaturation publishing).

### Hot-swap path

When the DESIGN.md hot-swaps (a new token set is published), the
engine fires `ve:themechange` on `document`. The wireframe engine
subscribes and re-runs desaturation. The wireframe RE-PAINTS live
with the new theme's tokens.

If you author a DESIGN.md change, the wireframe should update
without a reload. If it doesn't, the runtime isn't dispatching the
event — verify with:

```js
document.dispatchEvent(new CustomEvent('ve:themechange'));
```

---

## Integration 2 — Runtime selection + comments (`amvcp-runtime` / `amvcp-modal-comments`)

The wireframe blocks BECOME selectable atoms via the runtime's
selection contract. See
[`selection-and-comments.md`](selection-and-comments.md) for the
deep dive.

### What the wireframe provides

- `data-ve-id` + `data-ve-type` on each block (author).
- `data-ve-comment-id` + `tabindex` + `role` (auto-stamped by the
  wireframe engine).
- A scoped `--ve-accent` re-declaration on `[data-wf-root]` so
  the runtime's selection outline desaturates with the wireframe.

### What the runtime provides

- The 4 visual states (normal / hover / selected / focused).
- The Ctrl-+ keyboard shortcut to open a comment thread.
- The localStorage-backed comment persistence.
- The decision mini-pill (Skip / Approve / Deny).

### Loading order

The runtime should initialize BEFORE the wireframe — the wireframe
engine calls `window.amvcpRuntime.attachDecisionMini(...)` for
every atom. If the runtime isn't loaded, the wireframe engine
silently skips this call (defensive — fixtures without the runtime
still work).

In a typical page:

```html
<head>
  <link rel="stylesheet" href="amvcp-runtime.css">
  <link rel="stylesheet" href="amvcp-wireframe.css">
  <link rel="stylesheet" href="amvcp-modal-comments.css">
  <script src="amvcp-designmd.js"></script>
  <script src="amvcp-runtime.js"></script>
  <script src="amvcp-wireframe.js"></script>
  <script src="amvcp-modal-comments.js"></script>
</head>
```

The script load order: designmd → runtime → wireframe → modal-
comments. Each script self-initializes on `DOMContentLoaded`.

---

## Integration 3 — Layout grid primitives (`amvcp-layout`)

The `amvcp-layout` skill provides reusable grid primitives. The
wireframe USES these for complex multi-column layouts.

### Wireframe-native layouts (self-contained)

For wireframe-only layouts, use the kit's 4 archetypes:
`wf-archetype--app`, `--web`, `--mobile`, `--modal`. These are
self-contained — no dependency on `amvcp-layout`.

### When to reach for `amvcp-layout`

For PRODUCTION-quality layouts (full hi-fi grids, container
queries, sophisticated responsive behavior), use `amvcp-layout`
primitives:

```html
<div class="lo-grid lo-grid--cols-3 lo-grid--gap-md">
  <article class="wf-card">…</article>
  <article class="wf-card">…</article>
  <article class="wf-card">…</article>
</div>
```

The `lo-grid` class handles the responsive collapse; the cards
inside are wireframe blocks. Mix freely.

For wireframe-fidelity work, the inline `style="display:grid;..."`
patterns shown in this skill's references are fine — keeps the
wireframe self-sufficient.

---

## Integration 4 — Interactive controls (`amvcp-interactive-controls`)

The fidelity slider in the wireframe ramp IS an interactive
control. Currently the wireframe ships its OWN slider
implementation (`wf-fidelity-slider`) — see
[`fidelity-ramp.md`](fidelity-ramp.md).

### What the wireframe slider does

```html
<input class="wf-fidelity-slider" type="range"
       min="0" max="3" step="1" value="0"
       data-wf-target="ramp-target">
```

The engine auto-wires every `input.wf-fidelity-slider` with a
`data-wf-target`. On `input`/`change` events, the slider value
(0..3) is mapped to a fidelity stage and applied via
`applyFidelity()`.

### When to use `amvcp-interactive-controls` instead

For sliders / toggles / etc. that aren't fidelity controls, use
the sibling skill's components:

```html
<div class="ic-toggle" data-ic-target="my-target">
  <button class="ic-toggle-on">On</button>
  <button class="ic-toggle-off">Off</button>
</div>
```

The wireframe can include these — they live in the wireframe like
any other markup. The wireframe engine doesn't manage them.

---

## Integration 5 — Charts inside wireframes (`amvcp-charts-and-dashboards`)

A wireframe dashboard often shows CHARTS. At wireframe fidelity,
charts are placeholder `wf-image` blocks. At mid+ fidelity, real
charts can render.

### Wireframe-fidelity chart placeholder

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Revenue, last 30 days</span>
  </header>
  <figure class="wf-image" style="min-height:280px;"></figure>
</article>
```

At wireframe fidelity, the diagonal-X reads as "chart goes here".

### Hi-fidelity chart (real render)

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Revenue, last 30 days</span>
  </header>

  <!-- the chart skill's markup -->
  <div class="ch-chart" data-ch-type="line" data-ch-data="…">
    <!-- the chart skill renders the SVG here -->
  </div>
</article>
```

The chart skill consumes the same `--vc-color-*` tokens — so at
fidelity `wireframe` the chart desaturates correctly. The chart's
own desaturation logic mirrors the wireframe's.

### Pattern: per-fidelity content

For a SINGLE wireframe that should show placeholder at low fi but
real chart at hi fi, use CSS attribute selectors:

```css
[data-wf-fidelity="wireframe"] .my-chart-real { display: none; }
[data-wf-fidelity="wireframe"] .my-chart-placeholder { display: block; }

[data-wf-fidelity="low"] .my-chart-real { display: none; }
[data-wf-fidelity="low"] .my-chart-placeholder { display: block; }

[data-wf-fidelity="mid"] .my-chart-real { display: block; }
[data-wf-fidelity="mid"] .my-chart-placeholder { display: none; }

[data-wf-fidelity="hi"] .my-chart-real { display: block; }
[data-wf-fidelity="hi"] .my-chart-placeholder { display: none; }
```

The wireframe / low / mid / hi columns of a ramp can show
DIFFERENT visualizations of the same chart.

---

## Integration 6 — Diagrams inside wireframes (`amvcp-diagram`)

Similar to charts — wireframe shows placeholder, hi-fi shows the
real diagram.

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Data flow</span>
  </header>

  <!-- placeholder for low fi -->
  <figure class="wf-image" style="min-height:320px;"></figure>

  <!-- real diagram (hidden at wireframe, shown at mid+) -->
  <div class="dg-diagram" data-dg-source="…">
    <!-- diagram skill renders here -->
  </div>
</article>
```

Toggle visibility per fidelity using the pattern from the previous
section.

---

## Integration 7 — Tables inside wireframes (`amvcp-tables`)

Wireframe tables (`wf-table` flex-row structure) are good for
showing structure. For REAL sortable tables in higher fidelities,
use `amvcp-tables`.

### Wireframe table

```html
<div class="wf-table">
  <div class="wf-table-row wf-table-row--head">…</div>
  <div class="wf-table-row">…</div>
</div>
```

### Real sortable table

```html
<table data-ve-table="data">
  <thead><tr><th>Name</th><th>Email</th></tr></thead>
  <tbody>
    <tr data-ve-id="row-1"><td>Anna</td><td>anna@…</td></tr>
    <tr data-ve-id="row-2"><td>Ben</td><td>ben@…</td></tr>
  </tbody>
</table>
```

The `amvcp-tables` skill processes `[data-ve-table]` elements and
injects sort arrows, click handlers, etc.

Both can coexist in the same document — wireframe table for
demonstration of shape, real table for the actual data.

---

## Integration 8 — Animation (`amvcp-animation`)

The wireframe is mostly STATIC. For animations (skeleton shimmer,
modal slide-in, toast fade), use inline keyframes (small) or the
`amvcp-animation` skill (for sophisticated motion).

### Inline animation (small, self-contained)

```css
@keyframes wf-shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.85; }
  100% { opacity: 0.5; }
}

.skeleton {
  animation: wf-shimmer 1.5s infinite linear;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

### `amvcp-animation` motion tokens (sophisticated)

```html
<article class="wf-card an-stagger-reveal" style="--index: 0;">…</article>
<article class="wf-card an-stagger-reveal" style="--index: 1;">…</article>
<article class="wf-card an-stagger-reveal" style="--index: 2;">…</article>
```

The animation skill orchestrates the stagger reveal — cards
appear one by one as they enter the viewport. The wireframe
provides the CONTENT; the animation skill provides the MOTION.

---

## Integration 9 — Slide decks (`amvcp-slide-decks`)

A wireframe ramp can be embedded in a slide deck — each slide
shows one fidelity stage:

```html
<div class="sl-deck">

  <section class="sl-slide" data-sl-title="Wireframe">
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <!-- the wireframe screen -->
    </div>
  </section>

  <section class="sl-slide" data-sl-title="Low fidelity">
    <div class="wf-root" data-wf-root data-wf-fidelity="low">
      <!-- same screen -->
    </div>
  </section>

  <section class="sl-slide" data-sl-title="Mid fidelity">
    <div class="wf-root" data-wf-root data-wf-fidelity="mid">
      <!-- same screen -->
    </div>
  </section>

  <section class="sl-slide" data-sl-title="Hi fidelity">
    <div class="wf-root" data-wf-root data-wf-fidelity="hi">
      <!-- same screen -->
    </div>
  </section>

</div>
```

The slide deck handles navigation (arrow keys, scroll snap); the
wireframe handles the per-slide rendering.

For a deck about design EVOLUTION (showing how a screen progressed
through fidelities), this is the canonical shape.

---

## Loading order — what must be initialized first

The full AMVCP boot order (a page using all skills):

1. **DESIGN.md engine** (`amvcp-designmd.js`) — publishes
   `--vc-color-*` tokens to `:root`.
2. **Runtime** (`amvcp-runtime.js`) — sets up selection contract,
   theme toggle, comment infrastructure.
3. **Wireframe** (`amvcp-wireframe.js`) — reads `--vc-color-*`,
   desaturates, publishes scoped tokens to `[data-wf-root]`.
4. **Modal comments** (`amvcp-modal-comments.js`) — wires up
   per-atom comment threads.
5. **Charts / diagrams / tables / animation** (any
   `amvcp-*.js` not yet listed) — these are downstream consumers.

Each script self-inits on `DOMContentLoaded`. The order matters
because:

- The wireframe READS `--vc-color-*` — the engine must have
  published them first.
- The runtime stamps `data-ve-selected` — the wireframe re-declares
  `--ve-accent` from it, so the runtime should run first.
- Modal comments hook into the runtime's selection state — runtime
  first.

For TEST FIXTURES with manual control:

```html
<script>
  window.__designMdManualInit = true;
  window.__wfManualInit = true;
</script>
<script src="amvcp-designmd.js"></script>
<script src="amvcp-runtime.js"></script>
<script src="amvcp-wireframe.js"></script>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    amvcpDesignMd.init(document);
    amvcpRuntime.init(document);
    amvcpWireframe.init(document);
  });
</script>
```

This gives you deterministic initialization order — useful for
tests that need to assert state at specific points.
