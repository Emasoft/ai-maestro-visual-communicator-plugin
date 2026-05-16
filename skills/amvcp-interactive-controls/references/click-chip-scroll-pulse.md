# Click chip → smooth scroll + outline-pulse target

A chip / badge / mini-tag in a report header that, when clicked,
smooth-scrolls the viewport to a section deep in the document AND
briefly outlines the destination so the eye can "land" without losing
context. Reusable for risk-map chips, error chips, "X findings"
breadcrumbs, any "click a summary token → jump to the deep block"
flow.

## What it is

Two coupled affordances:

1. **A chip the reader recognises as navigation** — a small inline pill
   with a color-coded dot or numeric badge that hints what it points to
   (e.g. `.ic-chip--bug 3`, `.ic-chip--security 1`).
2. **A 1.2-1.6 s outline pulse** on the target — when the smooth-scroll
   lands, the destination block briefly shows a 3 px accent-color
   shadow ring, then fades. Without the pulse, the reader's eye drifts
   away mid-scroll and they can't find what was matched.

## Scaffold

```html
<div class="ic-chip-bar" role="navigation"
     aria-label="Risk map">
  <a class="ic-chip ic-chip--security" href="#sec-auth"
     data-ic-chip-target="sec-auth">
    <span class="ic-chip-dot" aria-hidden="true"></span>
    <span class="ic-chip-label">Auth</span>
    <span class="ic-chip-count">3</span>
  </a>
  <a class="ic-chip ic-chip--perf" href="#sec-perf"
     data-ic-chip-target="sec-perf">
    <span class="ic-chip-dot" aria-hidden="true"></span>
    <span class="ic-chip-label">Perf</span>
    <span class="ic-chip-count">1</span>
  </a>
</div>

<!-- … document body … -->

<section id="sec-auth" class="ic-chip-target">
  <h2>Authentication risks</h2>
  …
</section>
<section id="sec-perf" class="ic-chip-target">
  <h2>Performance risks</h2>
  …
</section>
```

CSS:

```css
.ic-chip-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-1, 8px);
  margin: var(--vc-space-2, 12px) 0;
}
.ic-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-0, 4px);
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-full, 9999px);
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg, #14110b);
  background: var(--ve-control-bg, #ffffff);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease);
}
.ic-chip:hover {
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 5%, transparent);
}
.ic-chip-dot {
  width: 9px;
  height: 9px;
  border-radius: var(--vc-radius-full, 9999px);
  flex: none;
}
.ic-chip--security .ic-chip-dot { background: var(--vc-color-danger, #a84a32); }
.ic-chip--perf     .ic-chip-dot { background: var(--vc-color-warning, #c78a26); }
.ic-chip--bug      .ic-chip-dot { background: var(--vc-color-accent, #b8861f); }
.ic-chip--info     .ic-chip-dot { background: var(--vc-color-info, #4a6da8); }
.ic-chip-count {
  min-width: 1.4em;
  padding: 0 var(--vc-space-0, 4px);
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 12%, transparent);
  font-size: 0.85em;
  text-align: center;
}

/* Outline pulse. Class applied by JS on click; the @keyframes runs
   once because animation-iteration-count defaults to 1. */
@keyframes ic-chip-pulse {
  0%   { box-shadow: 0 0 0 0   color-mix(in srgb, var(--vc-color-accent, #b8861f) 60%, transparent); }
  20%  { box-shadow: 0 0 0 3px color-mix(in srgb, var(--vc-color-accent, #b8861f) 50%, transparent); }
  100% { box-shadow: 0 0 0 0   transparent; }
}
.ic-chip-target.ic-chip-target--pulse {
  animation: ic-chip-pulse 1.4s var(--vc-easing-standard, ease) 1;
}
@media (prefers-reduced-motion: reduce) {
  .ic-chip-target.ic-chip-target--pulse {
    /* Substitute, not bare animation:none on a still element — a brief
       static outline ring stands in for the pulse so the eye still
       lands on the destination. */
    animation: none;
    outline: 3px solid color-mix(in srgb,
             var(--vc-color-accent, #b8861f) 60%, transparent);
    outline-offset: 4px;
  }
}
```

## JS layer (enhancement)

The `<a href="#sec-auth">` is functional with JS off — the browser
jumps to the anchor and `scroll-behavior: smooth` (on `<html>`)
handles the easing for free. The JS layer adds the pulse:

```js
document.addEventListener('click', function (ev) {
  var chip = ev.target.closest('.ic-chip[data-ic-chip-target]');
  if (!chip) { return; }
  // The browser's own anchor jump still runs — we just attach the
  // pulse class after the next frame so it animates on the target.
  var targetId = chip.getAttribute('data-ic-chip-target');
  requestAnimationFrame(function () {
    var t = document.getElementById(targetId);
    if (!t) { return; }
    t.classList.remove('ic-chip-target--pulse');
    // Force reflow so re-adding the class restarts the animation when
    // the same chip is clicked twice in a row.
    void t.offsetWidth;
    t.classList.add('ic-chip-target--pulse');
    setTimeout(function () {
      t.classList.remove('ic-chip-target--pulse');
    }, 1500);
  });
});
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-danger` / `--vc-color-warning` / `--vc-color-accent` / `--vc-color-info` | severity-coded dot |
| `--ve-control-bg` / `--ve-control-border` | chip resting style |
| `--vc-radius-full` | pill shape + dot + count badge |
| `--vc-color-accent` | pulse ring color |
| `--vc-duration-fast` + `--vc-easing-standard` | hover feedback |

Add `html { scroll-behavior: smooth; }` once in the foundation CSS so
the anchor jump is itself buttery; under `prefers-reduced-motion` the
browser flips it to instant automatically.

## Selection / comment / decision-mini

- **Selection.** Each `.ic-chip` carries `data-ve-id` (e.g.
  `chip:sec-auth`) so a reader can "comment on this chip" — useful
  for "the count is wrong", "this category should be ignored".
- **Decision-mini.** A chip is binary (this risk category matters or
  not). Attach the S/A/D pill so the reader can Skip / Approve /
  Deny the whole category in one gesture.
- **Comments.** The destination block (`.ic-chip-target`) is its own
  selectable atom; comments on the chip are summary-level; comments
  on the section are detailed.

## JS-off degradation

**Fully functional.** With JS off:

- Clicking a chip jumps to the anchor (standard `<a href="#…">`).
- The browser's own `scroll-behavior: smooth` provides easing.
- The pulse does NOT fire — `ic-chip-target--pulse` is never added —
  so the reader lands on the destination without the visual flourish.
  The destination is still anchored at the top of the viewport.

No content is hidden when JS is off; the pulse is purely an
attention-cue enhancement.

## Anti-patterns

- Implementing the chip as a `<div>` with a JS click handler — loses
  the JS-off jump, the keyboard activation, AT navigation, and
  "right-click → open in new tab".
- Using a JS-only `scrollIntoView({behavior:'smooth'})` instead of
  letting the anchor navigation drive it — same loss as above.
- Adding the pulse class WITHOUT the `void t.offsetWidth` reflow —
  the second click on the same chip silently does nothing because
  the animation has not been restarted.
- Hardcoding the pulse color — must be `var(--vc-color-accent, …)`
  so theme hot-swap recolors it.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Anchor jump works with the JS handler.
document.querySelector('.ic-chip').click();
await new Promise(r => setTimeout(r, 100));
console.assert(window.location.hash === '#sec-auth', 'anchor not navigated');

// Pulse class was added and removed.
const target = document.getElementById('sec-auth');
console.assert(target.classList.contains('ic-chip-target--pulse'),
               'pulse class not added');
await new Promise(r => setTimeout(r, 1700));
console.assert(!target.classList.contains('ic-chip-target--pulse'),
               'pulse class not removed');
```

Capture before/after screenshots showing the pulse ring at 0.6 s
post-click; verify the pulse is visible in both light and dark themes.
