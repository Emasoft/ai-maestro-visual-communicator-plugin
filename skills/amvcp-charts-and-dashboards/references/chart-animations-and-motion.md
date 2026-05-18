# Entry animations & motion

The chart module ships ONE animation per chart type — an entry animation
fired once when the chart enters the viewport. There are NO ongoing /
looping / data-morphing animations (those are out of scope; this is a
report rendering skill, not a data-exploration tool). Every animation
gates on `prefers-reduced-motion: reduce`.

## Table of contents

- [The fire-once IntersectionObserver](#the-fire-once-intersectionobserver)
- [The motion gate — `prefers-reduced-motion`](#the-motion-gate--prefers-reduced-motion)
- [Per-type entry animations](#per-type-entry-animations)
  - [Bar growUp (CSS keyframe)](#bar-growup-css-keyframe)
  - [Line / area draw-on (stroke-dashoffset)](#line--area-draw-on-stroke-dashoffset)
  - [Donut arc sweep (RAF)](#donut-arc-sweep-raf)
  - [Gauge arc sweep (RAF)](#gauge-arc-sweep-raf)
  - [Radar polygon inflate (RAF)](#radar-polygon-inflate-raf)
- [Cross-cutting tokens](#cross-cutting-tokens)
- [Test hooks](#test-hooks)
- [Overview](#overview)

## Overview

---

## The fire-once IntersectionObserver

Every renderer calls `animateOnView(host, fireFn)` after the static SVG
has been appended:

```js
function animateOnView(host, fireFn) {
  if (typeof fireFn !== 'function') { return; }
  if (REDUCED || typeof IntersectionObserver === 'undefined') {
    fireFn();         // skip the entry — jump to final state
    return;
  }
  var fired = false;
  var io = new IntersectionObserver(function (entries, obs) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting && !fired) {
        fired = true;
        fireFn();
        obs.disconnect();
      }
    }
  }, { threshold: 0.3 });
  io.observe(host);
}
```

- Threshold = 0.3 — the chart must be at least 30% visible before the
  animation fires. This avoids triggering on a tiny sliver crossing the
  viewport edge.
- `obs.disconnect()` after the first intersection — the animation fires
  EXACTLY ONCE per page load (re-scrolling does not re-animate).
- IO unavailable (old browser, headless test) → fires immediately.
- Reduced motion → fires immediately (with the animation skipped — see
  per-type sections).

## The motion gate — `prefers-reduced-motion`

A page-level constant read at boot:

```js
var REDUCED = false;
if (typeof window !== 'undefined' && window.matchMedia) {
  _mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  REDUCED = !!_mql.matches;
}
```

And re-read on OS toggle:

```js
function _watchReducedMotion() {
  if (!_mql) { return; }
  function onChange(ev) {
    REDUCED = !!(ev.matches || _mql.matches);
  }
  _mql.addEventListener('change', onChange);  // (or .addListener on older Safari)
}
```

`REDUCED === true` means EVERY entry animation skips to its final state
immediately. This is enforced inside each per-type RAF loop AND by the
CSS:

```css
@media (prefers-reduced-motion: no-preference) {
  .ve-chart-bar { transform: scaleY(0); transform-box: fill-box; }
  .ve-chart-animate .ve-chart-bar {
    animation: veChartGrowUp var(--vc-duration-slow, 600ms)
               var(--vc-easing-decel, cubic-bezier(0,0,0,1)) both;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ve-chart-bar { transform: none; }
}
```

In CSS, the keyframe only runs under `(no-preference)`; in `(reduce)`,
the bar starts at full height immediately.

In JS (RAF-based animations for donut / gauge / radar), the
`if (REDUCED) { return; }` guard inside `animateOnView`'s `fireFn` skips
the RAF loop entirely.

## Per-type entry animations

### Bar growUp (CSS keyframe)

Used by: `bar`, `stacked-bar`, `diverging-bar`, `bullet`, `lollipop` (head
only — stem is decorative), `dot-plot` / `connected-dot-plot` (dots), all
the SVG bar family.

The animation:

```css
@keyframes veChartGrowUp {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
.ve-chart-animate .ve-chart-bar {
  animation: veChartGrowUp var(--vc-duration-slow, 600ms)
             var(--vc-easing-decel, cubic-bezier(0,0,0,1)) both;
}
```

Per-bar `animation-delay` for stagger:

```js
bar.style.transformOrigin = rx + 'px ' + yBase + 'px';
bar.style.animationDelay = (k * STAGGER_MS) + 'ms';
```

`STAGGER_MS = 60` — the k-th bar starts 60·k ms after the first. The
animation FIRES when `_wireMarks`'s parent renderer adds the
`ve-chart-animate` class to the figure (which `animateOnView` does on
intersection).

Transform-origin is set to the BASELINE (`yBase`), so the bar grows
UP from the floor (not from the center).

### Line / area draw-on (stroke-dashoffset)

Used by: `line`, `area`, `step-area`, `slope`, `bump`.

The line path's stroke is dashed at its full length, then transitioned to
0 offset:

```js
animateOnView(fig, function () {
  var lines = svgEl.querySelectorAll('.ve-chart-line');
  for (var i = 0; i < lines.length; i++) {
    (function (ln, ord) {
      if (REDUCED) { return; }
      var len = ln.getTotalLength();
      if (!len) { return; }
      ln.style.strokeDasharray = len;
      ln.style.strokeDashoffset = len;
      void ln.getBoundingClientRect();  // force reflow
      ln.style.transition = 'stroke-dashoffset '
        + 'var(--vc-duration-slow, 600ms) '
        + 'var(--vc-easing-decel, cubic-bezier(0,0,0,1)) '
        + (ord * 0.12) + 's';
      ln.style.strokeDashoffset = '0';
    })(lines[i], i);
  }
  fig.classList.add('ve-chart-animate');
});
```

Per-line stagger via `(ord * 0.12) + 's'` — series 0 starts at 0s, series
1 at 0.12s, etc. The `getBoundingClientRect()` call forces a layout flush
so the transition starts from the dashed state (not from the natural 0
offset).

`getTotalLength()` is the SVG API call that returns the path's total
stroke length in user units — the value to use as `strokeDasharray`.

### Donut arc sweep (RAF)

Used by: `donut`.

Each arc animates its END ANGLE from `a0` to `a1` via
`requestAnimationFrame`. Stagger between slices:

```js
animateOnView(fig, function () {
  if (REDUCED) { return; }
  var startT = null, dur = 480;
  function frame(now) {
    if (startT === null) { startT = now; }
    var t = (now - startT) / dur;
    if (t > 1) { t = 1; }
    var eased = 1 - Math.pow(1 - t, 3);    // cubic ease-out
    for (var i = 0; i < arcs.length; i++) {
      var a = arcs[i].__veArc;
      var stagger = i / Math.max(1, arcs.length);
      var local = (eased - stagger * 0.3) / (1 - stagger * 0.3);
      if (local < 0) local = 0;
      if (local > 1) local = 1;
      arcs[i].setAttribute('d',
        describeArc(a.cx, a.cy, a.rO, a.rI, a.a0, a.a0 + (a.a1 - a.a0) * local));
    }
    if (t < 1) requestAnimationFrame(frame);
  }
  // Start every arc collapsed.
  for (var j = 0; j < arcs.length; j++) {
    var aj = arcs[j].__veArc;
    arcs[j].setAttribute('d',
      describeArc(aj.cx, aj.cy, aj.rO, aj.rI, aj.a0, aj.a0));
  }
  requestAnimationFrame(frame);
});
```

The cubic ease-out (`1 - (1-t)³`) lands softly. Stagger smears the start
times across slices so the "wipe" reads as sequential, not all at once.

### Gauge arc sweep (RAF)

Used by: `gauge`.

Same shape as donut sweep but one arc, longer duration (520ms):

```js
animateOnView(fig, function () {
  if (REDUCED) return;
  var gz = valArc.__veGauge;
  var startT = null, dur = 520;
  function frame(now) {
    if (startT === null) startT = now;
    var t = (now - startT) / dur;
    if (t > 1) t = 1;
    var eased = 1 - Math.pow(1 - t, 3);
    valArc.setAttribute('d', describeArc(gz.cx, gz.cy, gz.rO, gz.rI,
      gz.startA, gz.startA + gz.span * gz.frac * eased));
    if (t < 1) requestAnimationFrame(frame);
  }
  // Start collapsed.
  valArc.setAttribute('d', describeArc(gz.cx, gz.cy, gz.rO, gz.rI,
    gz.startA, gz.startA));
  requestAnimationFrame(frame);
});
```

### Radar polygon inflate (RAF)

Used by: `radar`.

Each polygon's vertices animate from the CENTER outward. Stagger between
polygons (multi-series):

```js
animateOnView(fig, function () {
  if (REDUCED) return;
  var startT = null, dur = 560;
  function frame(now) {
    if (startT === null) startT = now;
    var t = (now - startT) / dur;
    if (t > 1) t = 1;
    var eased = 1 - Math.pow(1 - t, 3);
    for (var i = 0; i < polys.length; i++) {
      var rd = polys[i].__veRadar;
      var stagger = i / Math.max(1, polys.length);
      var local = (eased - stagger * 0.3) / (1 - stagger * 0.3);
      if (local < 0) local = 0;
      if (local > 1) local = 1;
      var pstr = rd.verts.map(function (p) {
        var px = rd.cx + (p.x - rd.cx) * local;
        var py = rd.cy + (p.y - rd.cy) * local;
        return px.toFixed(2) + ',' + py.toFixed(2);
      }).join(' ');
      polys[i].setAttribute('points', pstr);
    }
    if (t < 1) requestAnimationFrame(frame);
  }
  // Start every polygon collapsed to the center.
  for (var j = 0; j < polys.length; j++) {
    var rdj = polys[j].__veRadar;
    var collapsed = [];
    for (var v = 0; v < rdj.verts.length; v++) {
      collapsed.push(rdj.cx + ',' + rdj.cy);
    }
    polys[j].setAttribute('points', collapsed.join(' '));
  }
  requestAnimationFrame(frame);
});
```

The inflate gives a strong "appearing" feel — the polygon grows from a
point at the center to its full size. With multi-series, each polygon
fans out staggered.

## Cross-cutting tokens

Every animation reads its duration / easing from `--vc-*` tokens:

| Token | Default | Used by |
|---|---|---|
| `--vc-duration-fast` | `120ms` | Hover transitions, focus rings. |
| `--vc-duration-slow` | `600ms` | Bar growUp, line draw-on. |
| `--vc-duration-stagger-step` | `60ms` (via `STAGGER_MS`) | Bar entry stagger between bars. |
| `--vc-easing-decel` | `cubic-bezier(0,0,0,1)` | Decelerating ease-out used everywhere. |

Override these in DESIGN.md to slow / speed up motion globally. E.g. for
a "slower, more deliberate" feel:

```yaml
motion:
  duration-slow: 900ms
  duration-stagger-step: 100ms
```

Reduced-motion ALWAYS wins — no token override can force animation when
the OS preference is `reduce`.

## Test hooks

The chart module exposes a test hook on `window.__veChart`:

```js
window.__veChart.REDUCED          // current REDUCED flag (read)
window.__veChart.REDUCED = true;  // force REDUCED (write — for tests)
```

This lets a dev-browser test deterministically check both code paths
(animated vs reduced) without rebooting the page.

## See also

- [chart-guardrails.md](./chart-guardrails.md) — Guardrail 9 (motion respects `prefers-reduced-motion`).
- [chart-design-tokens.md](./chart-design-tokens.md) — full token list.
- The animation skill (`skills/amvcp-animation`) — orthogonal motion primitives that pages may also load. The chart skill's animations are SELF-CONTAINED; loading `amvcp-animation.js` is OPTIONAL but enables count-up animation on `metric-cards` values.
