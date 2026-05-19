# Diagram skill handoff — flow edges, scroll-reveal, and SVG animation

## Table of Contents

- [Scroll-reveal for numbered flow walks](#scroll-reveal-for-numbered-flow-walks)
- [SVG flow-edge animations](#svg-flow-edge-animations)
- [Token contract for diagram animations](#token-contract-for-diagram-animations)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Interactive flowcharts (click-step → side-panel pattern)](#interactive-flowcharts-click-step--side-panel-pattern)
- [Scroll-reveal trigger on diagrams](#scroll-reveal-trigger-on-diagrams)
- [Hot-swap with DESIGN.md](#hot-swap-with-designmd)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Future diagram-skill extensions](#future-diagram-skill-extensions)

The diagram skill consumes three animation primitives from this
skill: the scroll-reveal mechanism (for numbered flow walks),
the motion-token contract (for SVG flow-edge animations), and
the reduced-motion gate (for accessibility).

## Scroll-reveal for numbered flow walks

A diagram-skill numbered flow (e.g. "1. Auth → 2. Token → 3.
Resource → 4. Response") often pairs with descriptive prose for
each step. The animation skill's `data-va-reveal="stagger"`
pattern composes the cascade:

```html
<ol class="dg-flow" data-va-reveal="stagger">
  <li class="va-stagger-item dg-step">
    <span class="dg-step-num">1</span>
    <div class="dg-step-body">
      <h3>Authenticate</h3>
      <p>The user provides credentials.</p>
    </div>
  </li>
  <li class="va-stagger-item dg-step">
    <span class="dg-step-num">2</span>
    <!-- ... -->
  </li>
</ol>
```

The reveal triggers when the flow scrolls into view; the steps
cascade. The diagram skill's own CSS handles the visual styling
(badge, step number, body layout); the animation skill handles
the cascade.

The composition is the canonical "use the animation skill's
primitives for entrance" pattern.

## SVG flow-edge animations

Three SMIL/CSS techniques for SVG flow edges (lines connecting
boxes in a flowchart):

### Flowing dashes

```svg
<svg width="200" height="50">
  <line x1="10" y1="25" x2="190" y2="25" stroke="var(--vc-color-accent)"
        stroke-width="2" stroke-dasharray="5 5"
        style="animation: vaDashFlow 1.5s linear infinite;">
  </line>
</svg>
<style>
  @keyframes vaDashFlow {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -10; }
  }
  @media (prefers-reduced-motion: reduce) {
    line { animation: none; }
  }
</style>
```

The dashes appear to flow along the line direction. Used in
flowcharts to indicate "this is the active path" or "data is
flowing through here".

### animateMotion (SMIL)

```svg
<svg>
  <path id="flow-path" d="M10,25 L190,25" stroke="none" fill="none"/>
  <circle r="5" fill="var(--vc-color-accent)">
    <animateMotion dur="2s" repeatCount="indefinite">
      <mpath xlink:href="#flow-path"/>
    </animateMotion>
  </circle>
</svg>
```

A small circle traces along the path. Used for "watch the data
flow from A to B" visualizations.

SMIL is the legacy SVG animation API — supported by all modern
browsers but slated for replacement. Use CSS animation alternatives
where possible.

### Blur-glow pulse

```svg
<svg>
  <filter id="glow">
    <feGaussianBlur stdDeviation="2"/>
    <feMerge><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <line x1="10" y1="25" x2="190" y2="25"
        stroke="var(--vc-color-accent)" stroke-width="2"
        filter="url(#glow)"
        style="animation: vaGlowPulse 2s ease-in-out infinite;">
  </line>
</svg>
<style>
  @keyframes vaGlowPulse {
    0%, 100% { stroke-opacity: 0.6; }
    50%      { stroke-opacity: 1; }
  }
</style>
```

The line "glows" by pulsing its opacity. The filter blurs
slightly to enhance the glow effect.

## Token contract for diagram animations

All diagram animations use the animation skill's tokens:

| token | role in diagram skill |
|---|---|
| `--vc-duration-entrance` | scroll-reveal duration |
| `--vc-duration-stagger-step` | per-step delay in numbered flows |
| `--vc-easing-decel` | step entrance curve |
| `--vc-color-accent` | active flow line color |
| `--vc-motion-scale` | (custom) damp flow-line animation speed |

The diagram skill MAY define its own additional tokens (e.g.
`--dg-edge-flow-duration` for the dash-flow speed), but the
shared tokens above are the contract.

## Reduced-motion substitute

The diagram skill's animated edges should follow the same
substitute pattern:

```css
@media (prefers-reduced-motion: reduce) {
  .dg-flow-edge {
    animation: none !important;
    stroke-dashoffset: 0 !important;
  }
  .dg-flow-particle {
    /* animateMotion can be paused via JS at init: */
    /* document.querySelectorAll('animateMotion').forEach(a => a.pauseAnimations()); */
  }
}
```

The substitute: drop the motion; show the lines/particles in
their static states. The flow edges still convey direction (via
arrows, color) — meaning preserved without motion.

## Selection + comment + decision integration

Diagram atoms (each node, each edge, each step) should be
stamped with `data-ve-id` + `data-ve-type` per the diagram
skill's contract:

```js
var SEL = '.dg-node, .dg-edge, .dg-step';
var nodes = d.querySelectorAll(SEL);
// ... stamp with diagram-specific types ...
```

The diagram skill's atom types (`node`, `edge`, `step`) are
distinct from the animation skill's (`card`, `counter`). No
conflicts.

## Interactive flowcharts (click-step → side-panel pattern)

The html-effectiveness mining catalog notes "click SVG node →
detail panel + code snippet" pattern. A flowchart with clickable
nodes that populate a sticky side panel:

```html
<div class="dg-flowchart-layout">
  <svg class="dg-flow">
    <g class="dg-node" data-ve-id="step-1" tabindex="0">
      <rect width="120" height="40" rx="6"/>
      <text>Authenticate</text>
    </g>
  </svg>
  <aside class="dg-detail-panel" data-ve-detail-target>
    <h3 class="dg-detail-title">Click a node for details</h3>
    <div class="dg-detail-body"></div>
  </aside>
</div>
```

```js
document.querySelectorAll('.dg-node').forEach(function (node) {
  node.addEventListener('click', function () {
    var id = node.getAttribute('data-ve-id');
    populateDetailPanel(id);
  });
});
```

The detail panel's mount animation is the animation skill's
domain:

```css
.dg-detail-body {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity var(--vc-duration-normal) var(--vc-easing-decel),
              transform var(--vc-duration-normal) var(--vc-easing-decel);
}
.dg-detail-body.dg-loaded {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .dg-detail-body {
    transition: opacity 200ms ease;
    transform: none;
  }
}
```

Clicking a node:
1. Fetches the detail content for the node ID.
2. Replaces the `.dg-detail-body` content.
3. Toggles `.dg-loaded` (via removing then re-adding) to retrigger
   the fade-in animation.

The diagram skill owns the click handler and the content swap;
the animation skill provides the entrance transition pattern.

## Scroll-reveal trigger on diagrams

For diagrams that should reveal on scroll, wrap in
`[data-va-reveal]`:

```html
<figure data-va-reveal="scale">
  <svg class="dg-flowchart">…</svg>
  <figcaption>Auth flow</figcaption>
</figure>
```

The scale variant is well-suited for diagrams (they have a focal
center). The diagram fades-and-scales-in on scroll-into-view.

## Hot-swap with DESIGN.md

When the user changes a `motion.duration-entrance` value in the
DESIGN.md controller pad, the diagram skill's animations re-pick
up the new value on the next paint (CSS variable inheritance).
No diagram-skill JS needed.

For SVG/SMIL animations (the `animateMotion` particle), the
duration is hardcoded in the `dur` attribute — those don't
respond to token changes. The diagram skill could read the
token and update the `dur` attribute manually on tokens-change.

## Diagnostics

- **Scroll-reveal doesn't fire on a flowchart** → confirm the
  outer element has `[data-va-reveal]` and the animation skill's
  init ran.
- **Flow-line dashes don't animate** → confirm the keyframe is
  in the runtime stylesheet (the diagram skill ships its own
  CSS; the dash keyframe lives there, not in the animation
  skill).
- **Edge glow flickers** → the filter is computationally expensive;
  test on lower-end devices and consider removing the glow on
  small-mobile breakpoints.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a flowchart below the fold.
2. Scroll into view. Confirm the flowchart fades and scales in.
3. For animated edges, capture screenshots at intervals
   matching the loop duration. Confirm the dashes / particles
   move.
4. With `prefers-reduced-motion: reduce`, confirm:
   - Scroll-reveal fades to 200ms.
   - Flow edges are static (no dash flow, no particle).
   - Diagrams sit at their final state.

## Future diagram-skill extensions

When the diagram skill adds:
- **Concept-explainer interactive demos** (slider → recompute
  → re-render with smooth 300ms transitions): use
  `--vc-duration-slow` for the transitions.
- **Hot-path tinting** on flow boxes: use `--vc-color-accent`
  for the tint color.
- **Mermaid runtime** with animated layout: use the
  animation-skill's tokens for entrance.
- **Data-flow with solid + dashed paths**: see the flow-edge
  patterns above.

In all cases, theme via the animation skill's tokens; substitute
via the reduced-motion gate.
