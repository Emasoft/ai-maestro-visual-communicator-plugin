# Inline SVG illustration controls

Pattern for wrapping an inline `<svg>` in user controls that
manipulate one of its parameters live: a "perturb-and-see"
teaching diagram. Use cases: an interactive hashing ring, a
visual data-flow with adjustable load, a circular menu with
N-segment count picker.

## What it is

A static SVG diagram explains the concept once. An interactive
SVG diagram lets the reader **vary the parameters and see the
result** — far higher information density. The pattern:

1. The SVG renders from a `state` object: a JS function takes
   `state` and produces SVG markup (or mutates an existing SVG).
2. Form controls (sliders, buttons) mutate `state`.
3. On every mutation, the SVG re-renders with smooth 200-300 ms
   transitions to make the change perceptible.
4. A live "readout" panel beside the SVG reports the new
   numerical state ("3 nodes, 16 keys, 14% moved").

## Scaffold

```html
<figure class="ic-illus" data-ic-illus data-id="hashing-ring">
  <svg class="ic-illus-svg" viewBox="-110 -110 220 220"
       width="320" height="320" aria-labelledby="illus-1-title">
    <title id="illus-1-title">Hash ring with 4 nodes and 32 keys.</title>
    <!-- arcs, nodes, key dots — built by the JS render() function -->
  </svg>
  <div class="ic-illus-controls">
    <label>Nodes:
      <input type="range" min="2" max="8" value="4"
             data-ic-illus-param="nodes">
      <output>4</output>
    </label>
    <label>Keys:
      <input type="range" min="10" max="60" value="32"
             data-ic-illus-param="keys">
      <output>32</output>
    </label>
    <button type="button" data-ic-illus-cmd="add-node">+ node</button>
    <button type="button" data-ic-illus-cmd="rm-node">− node</button>
  </div>
  <figcaption class="ic-illus-readout">
    <strong data-ic-illus-readout>4 nodes · 32 keys · 0% moved</strong>
  </figcaption>
</figure>
```

CSS:

```css
.ic-illus {
  margin: var(--vc-space-3, 16px) 0;
  padding: var(--vc-space-3, 16px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--ve-control-bg, #ffffff);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--vc-space-4, 24px);
  align-items: center;
}
@media (max-width: 720px) {
  .ic-illus { grid-template-columns: 1fr; }
}
.ic-illus-svg {
  /* SVG arcs/nodes transition for smooth re-renders. */
}
.ic-illus-svg .ic-illus-arc {
  transition: d var(--vc-duration-base, 240ms) var(--vc-easing-standard, ease),
              fill var(--vc-duration-base, 240ms) var(--vc-easing-standard, ease);
}
.ic-illus-svg .ic-illus-node {
  transition: cx var(--vc-duration-base, 240ms) var(--vc-easing-standard, ease),
              cy var(--vc-duration-base, 240ms) var(--vc-easing-standard, ease);
}
.ic-illus-controls {
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-2, 12px);
}
.ic-illus-readout {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: var(--vc-space-2, 12px);
  border-top: 1px solid color-mix(in srgb,
              var(--ve-control-border, #e3dcc9) 60%, transparent);
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.4
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
  text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .ic-illus-svg .ic-illus-arc,
  .ic-illus-svg .ic-illus-node { transition: none; }
}
```

## JS engine — concept-explainer "ring"

```js
function initIllus(rootEl) {
  var svg     = rootEl.querySelector('.ic-illus-svg');
  var readout = rootEl.querySelector('[data-ic-illus-readout]');
  var state   = { nodes: 4, keys: 32, prevMap: null };

  function pt(r, t) {
    // polar → cartesian, angle t in degrees, 0 deg = north
    var rad = (t - 90) * Math.PI / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  }
  function arcPath(r, t0, t1) {
    var p0 = pt(r, t0);
    var p1 = pt(r, t1);
    var large = (t1 - t0) > 180 ? 1 : 0;
    return 'M0,0 L' + p0.x + ',' + p0.y +
           ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + p1.x + ',' + p1.y +
           ' Z';
  }
  function fnv1a(s) {   // tiny deterministic hash for stable key positions
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
  function ringPos(key) {
    return (fnv1a(key) % 360);
  }
  function nodeOfKey(keyAngle, nodeAngles) {
    // first node whose angle is >= keyAngle
    for (var i = 0; i < nodeAngles.length; i++) {
      if (nodeAngles[i] >= keyAngle) { return i; }
    }
    return 0;   // wrap
  }

  function render() {
    var nodeAngles = [];
    for (var i = 0; i < state.nodes; i++) {
      nodeAngles.push(Math.round(360 * i / state.nodes));
    }
    var newMap = {};
    var moved = 0, total = state.keys;
    svg.textContent = '';
    // Arcs — one per node, colored
    for (var n = 0; n < state.nodes; n++) {
      var t0 = nodeAngles[n];
      var t1 = nodeAngles[(n + 1) % state.nodes] || 360;
      if (t1 <= t0) { t1 = 360; }
      var arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arc.setAttribute('d', arcPath(100, t0, t1));
      arc.setAttribute('class', 'ic-illus-arc');
      arc.setAttribute('fill', 'hsl(' + (n * 360 / state.nodes) + ' 50% 80%)');
      svg.appendChild(arc);
    }
    // Key dots
    for (var k = 0; k < state.keys; k++) {
      var key = 'key-' + k;
      var ang = ringPos(key);
      var owner = nodeOfKey(ang, nodeAngles);
      newMap[key] = owner;
      if (state.prevMap && state.prevMap[key] !== undefined &&
          state.prevMap[key] !== owner) { moved++; }
      var p = pt(102, ang);
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
      dot.setAttribute('r', '3');
      dot.setAttribute('class', 'ic-illus-node');
      dot.setAttribute('fill', 'hsl(' + (owner * 360 / state.nodes) + ' 50% 30%)');
      svg.appendChild(dot);
    }
    state.prevMap = newMap;
    var movedPct = state.prevMap ? Math.round(100 * moved / total) : 0;
    readout.textContent = state.nodes + ' nodes · ' +
                          state.keys + ' keys · ' +
                          movedPct + '% moved';
  }

  // Wire inputs.
  rootEl.querySelectorAll('[data-ic-illus-param]').forEach(function (input) {
    input.addEventListener('input', function () {
      var name = input.getAttribute('data-ic-illus-param');
      state[name] = parseInt(input.value, 10);
      input.parentNode.querySelector('output').value = input.value;
      render();
    });
  });
  rootEl.querySelectorAll('[data-ic-illus-cmd]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cmd = btn.getAttribute('data-ic-illus-cmd');
      if (cmd === 'add-node' && state.nodes < 8) { state.nodes++; }
      if (cmd === 'rm-node'  && state.nodes > 2) { state.nodes--; }
      render();
    });
  });
  render();
}
document.querySelectorAll('[data-ic-illus]').forEach(initIllus);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` / `--ve-control-border` | figure chrome |
| `--ve-control-mono` | readout font |
| `--vc-duration-base` + `--vc-easing-standard` | SVG transitions |
| (no `--vc-color-*` direct) | arcs use generated HSL for distinguishable categories |

The arcs use `hsl(n*360/N, 50%, 80%)` so N=2..8 nodes always get
distinguishable hues without consuming the design palette — the
ring is teaching, not branding.

## Selection / comment / decision-mini

- **The `<figure class="ic-illus">` IS a selectable atom** so a
  reviewer can comment "explain this differently" or "use 8 nodes
  in the example".
- **Decision-mini.** A teaching illustration is binary — Approve /
  Deny. Attach the pill on the figure.

## JS-off degradation

**Static SVG shown; controls inert.** With JS off:

- The initial SVG (empty in the scaffold) stays empty.
- Author a **server-side rendered** initial state directly in the
  SVG markup so the JS-off audience sees the default 4-node, 32-key
  configuration:

```html
<svg ...>
  <!-- Pre-rendered 4-node, 32-key ring -->
  <path d="..." fill="hsl(0 50% 80%)" class="ic-illus-arc"/>
  ...
</svg>
```

- Controls (sliders, buttons) render but do nothing on input.
- The readout shows the static default value (e.g. "4 nodes · 32
  keys · 0% moved").

The diagram still teaches the concept; only the perturb capability
is lost.

## Anti-patterns

- A `<canvas>` instead of SVG. Canvas is a raster — every shape is
  pixel-baked. SVG is a tree of nodes — each arc and dot is
  selectable, comment-able, and transitions smoothly via CSS.
- Re-rendering on `change` instead of `input`. Sliders should
  update live.
- Forgetting `prefers-reduced-motion` — the transition is the
  delight; without the gate, motion-sensitive users get a jarring
  experience.
- A non-deterministic key placement (using `Math.random()` instead
  of a hash). Reloads show different rings; the user can't
  reproduce a finding ("show me a 5-node ring with the keys I saw
  last time").

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Move the nodes slider to 5 — SVG has 5 arcs; readout updates.
const nodesInput = document.querySelector('[data-ic-illus-param="nodes"]');
nodesInput.value = 5;
nodesInput.dispatchEvent(new Event('input', { bubbles: true }));
const arcs = document.querySelectorAll('.ic-illus-arc');
console.assert(arcs.length === 5);
console.assert(document.querySelector('[data-ic-illus-readout]').textContent
               .indexOf('5 nodes') !== -1);
```

Screenshot light + dark with N=2, N=5, N=8. Verify arc colors
remain distinguishable in both themes.
