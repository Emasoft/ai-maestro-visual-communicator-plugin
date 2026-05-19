# Pod, UX, and accessibility rules (R26-R41)

## Table of Contents

- [R27 — DESIGN.md style controller pod always MOUNTED (but hidden by default)](#r27--designmd-style-controller-pod-always-mounted-but-hidden-by-default)
- [R28 — Pod library: save / rename / delete user presets](#r28--pod-library-save--rename--delete-user-presets)
- [R29 — 3-state selection ALWAYS overrides DESIGN.md palette](#r29--3-state-selection-always-overrides-designmd-palette)
- [R30 — Touch parity on mobile](#r30--touch-parity-on-mobile)
- [R31 — Responsive at all common viewport widths](#r31--responsive-at-all-common-viewport-widths)
- [R32 — Retina (2× / 3×) bitmap density](#r32--retina-2--3-bitmap-density)
- [R33 — Corner action buttons always present (even in slides / animations / video)](#r33--corner-action-buttons-always-present-even-in-slides--animations--video)
- [R34 — No overlap between scaffolded elements](#r34--no-overlap-between-scaffolded-elements)
- [R35 — No text hidden or truncated at the viewport edge](#r35--no-text-hidden-or-truncated-at-the-viewport-edge)
- [R36 — Diagrams: zoom / pan + draggable mini-map](#r36--diagrams-zoom--pan--draggable-mini-map)
- [R37 — Font size readable (≥ 14 px body, ≥ 12 px chips)](#r37--font-size-readable--14-px-body--12-px-chips)
- [R38 — Live-page overlay: select TRUE HTML elements](#r38--live-page-overlay-select-true-html-elements)
- [R39 — Pod summon gesture (desktop key combo + mobile 3-finger tap)](#r39--pod-summon-gesture-desktop-key-combo--mobile-3-finger-tap)
- [R26 — Skill discoverability — SKILL.md declares modes + composability](#r26--skill-discoverability--skillmd-declares-modes--composability)
- [R40 — Accessibility primitives + clean print export](#r40--accessibility-primitives--clean-print-export)
- [R41 — dev-browser NEVER runs in headless mode](#r41--dev-browser-never-runs-in-headless-mode)

## Rules

R26-R41 cover the DESIGN.md pod contract (always-mounted, save/rename/delete user presets, summon gesture), the universal-UX baseline (touch parity, responsive viewport matrix, retina density, corner buttons always-on-top, no overlap, no truncation, diagram zoom/pan, font-size minimums, live-page overlay), R26 skill-discoverability, R40 accessibility primitives + print export, and R41 dev-browser-never-headless. Each rule includes a dev-browser verify snippet.

### R27 — DESIGN.md style controller pod always MOUNTED (but hidden by default)

The pod (the floating DESIGN.md style controller — `#ve-designmd-handle` for the wake button, `.ve-designmd-pad` for the panel) MUST be present in the DOM on EVERY page the runtime renders, so the activation gesture (R39) can summon it. On pages whose HTML does not explicitly load `amvcp-designmd.js`, the runtime MUST auto-inject it via dynamic `<script>` injection and then call `_ensureDesignMdHandle()` unconditionally.

The pod chrome is INVISIBLE by default — both the panel AND the wake handle are `visibility:hidden` and not reachable by pointer until the user invokes the summoning gesture defined in R39. The handle is just the visible drag-and-collapse affordance of the pod ITSELF once summoned; it is not a permanent always-visible button.

Verify:
```js
const r = await page.evaluate(() => {
  const handle = document.getElementById('ve-designmd-handle');
  const pad = document.querySelector(
    '.ve-designmd-pad, [data-ve-designmd-pad]');
  const handleCs = handle ? getComputedStyle(handle) : null;
  const padCs = pad ? getComputedStyle(pad) : null;
  return {
    handleMounted: !!handle,
    padMounted: !!pad,
    hasEngine: typeof window.amvcpDesignMd === 'object',
    handleHiddenByDefault: handleCs
      ? handleCs.visibility === 'hidden'
        || handleCs.display === 'none' : null,
    padHiddenByDefault: padCs
      ? padCs.visibility === 'hidden'
        || padCs.display === 'none' : null
  };
});
// handleMounted AND padMounted AND hasEngine MUST be true.
// handleHiddenByDefault AND padHiddenByDefault MUST be true.
```

### R28 — Pod library: save / rename / delete user presets

The pod's library drawer MUST expose three actions on top of the import / export / hot-swap already shipped:

- **Save as…** — a name input + Save button that snapshots the CURRENT tokens (via `serializeDesignMd`) into a localStorage-backed user preset bucket and appends a new row to the library list with a "user" badge.
- **Rename** (per user-preset row) — built-in presets are read-only; user presets accept a new name without losing their content or position in the list.
- **Delete** (per user-preset row) — irreversible local-only removal; built-in presets cannot be deleted.

Persistence key: `localStorage["ve-designmd-pad-user-presets"]` = JSON map `{ name: designMdText }`. A future Python helper will mirror this to `$CLAUDE_PLUGIN_DATA/design-md-presets/<name>.md` for cross-page + cross-version persistence (see the [Claude Code persistent-data-directory docs](https://code.claude.com/docs/en/plugins-reference#persistent-data-directory)).

Verify:
```js
const r = await page.evaluate(() => {
  const api = window.amvcpDesignMd;
  if (!api?.saveUserPreset) return { applicable: false };
  api.saveUserPreset('test-preset-r28');
  const after = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const hasIt = !!after['test-preset-r28'];
  api.renameUserPreset('test-preset-r28', 'renamed');
  const renamed = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const wasRenamed = !renamed['test-preset-r28']
    && !!renamed['renamed'];
  api.deleteUserPreset('renamed');
  const final = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const wasDeleted = !final['renamed'];
  return { applicable: true, hasIt, wasRenamed, wasDeleted };
});
// when applicable: hasIt AND wasRenamed AND wasDeleted MUST be true.
```

### R29 — 3-state selection ALWAYS overrides DESIGN.md palette

The user must see a clear visual delta on every selectable atom **regardless** of which DESIGN.md preset is active:

| State                | Light theme                              | Dark theme                                 |
|----------------------|------------------------------------------|--------------------------------------------|
| Normal               | base                                     | base                                       |
| Hover                | slight darker bg + soft warm glow        | slight brighter bg + soft warm glow        |
| Selected             | clear darker bg + outline                | clear brighter bg + outline                |
| Hover + Selected     | strongest darker + outline + glow        | strongest brighter + outline + glow        |

The palette can be swapped (R3 / DESIGN.md), but the brightness DIRECTION (darker in light theme, brighter in dark theme) and the glow on hover are non-negotiable. The runtime CSS for `[data-ve-comment-id]:hover` and `[data-ve-comment-id][data-ve-selected="1"]` MUST use a specificity high enough that no DESIGN.md preset can mask the delta. The SVG side already enforces this with `!important` (runtime.js:660); the HTML-atom side MUST do the same.

Verify (per preset):
```js
const r = await page.evaluate(() => {
  const atom = document.querySelector('p[data-ve-comment-id]')
    || document.querySelector('li[data-ve-comment-id]');
  if (!atom) return { applicable: false };
  function lightnessOf(rgb) {
    const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
    if (!m) return 0;
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  }
  const base = lightnessOf(getComputedStyle(atom).backgroundColor);
  atom.setAttribute('data-ve-selected', '1');
  const sel = lightnessOf(getComputedStyle(atom).backgroundColor);
  atom.removeAttribute('data-ve-selected');
  return { applicable: true, base, sel,
           deltaPct: Math.abs(sel - base) * 100,
           changes: Math.abs(sel - base) > 0.02 };
});
// when applicable: changes MUST be true (≥ 2 percentage points
// lightness delta) for EVERY built-in preset.
```

### R30 — Touch parity on mobile

Every interaction that works with mouse MUST also work with touch on a mobile browser. Specifically:
- Bubble handle hover-bridge: `touchstart` on the atom shows the handle; `touchstart` on the handle opens the modal.
- Drag-paint (code-line / row range): touch-drag works.
- Modal close: tap on the backdrop closes.
- Diagram pan / zoom: drag-pan works on touch; pinch works for zoom.
- Pod: drag-to-move works with touch.

Verify (under mobile UA emulation):
```js
const r = await page.evaluate(() => {
  // The runtime should have registered touch listeners on the
  // document or on the relevant atom containers.
  const hasTouch = 'ontouchstart' in window;
  // Quick sanity probe: synthetic touchstart on a bubble handle.
  const handle = document.querySelector('.ve-comment-handle')
    || document.getElementById('ve-designmd-handle');
  if (!handle) return { hasTouch, modalOpenedByTouch: 'n/a' };
  const t = new TouchEvent('touchstart',
    { bubbles: true, cancelable: true });
  handle.dispatchEvent(t);
  // Whether modal opens is checked elsewhere (real touch path
  // required); this snippet just confirms the listener exists.
  return { hasTouch };
});
```

### R31 — Responsive at all common viewport widths

Pages MUST render correctly at the canonical widths: 320, 375, 414, 768, 1024, 1280, 1920, 2560. "Correctly" =
- no horizontal scroll on the document (R2 still holds for chrome; intentional wide-content scroll is fine).
- no text clipped at the right edge (R35).
- no selectable atom unreachable (clipped past the viewport edge).
- no overlap between page-level surfaces (R34).
- corner buttons (R33) remain visible.

Verify by sweeping viewport widths and re-running the audit at each.

### R32 — Retina (2× / 3×) bitmap density

Bitmap images (PNG / JPEG via `<img>` or `background-image`) MUST be authored at 2× the display size (3× where possible) so they stay crisp on Retina / high-DPI screens. The renderer MUST emit `srcset="… 2x, … 3x"` when the higher-density assets exist; for inline embedded images set `width` / `height` equal to half the natural pixel size.

Verify:
```js
const r = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const offenders = imgs.filter(img => {
    if (img.hasAttribute('srcset')) return false;
    return img.naturalWidth < img.width * 2;
  });
  return { total: imgs.length, offenders: offenders.length };
});
// offenders MUST be 0. Pure-vector (SVG, canvas) is exempt.
```

### R33 — Corner action buttons always present (even in slides / animations / video)

The runtime's corner ACTION buttons (`.ve-action-btn--top`, `.ve-action-btn--bottom`, e.g. Submit / Done) MUST be visible regardless of what surface fills the page. Slide decks, fullscreen animations, embedded video, scene-graphs in full-viewport mode MUST NOT mask them. They live on a fixed-position layer with the highest z-index (`2147483646` — one below INT32_MAX).

NOTE — the DESIGN.md pod wake handle (`#ve-designmd-handle`) is explicitly NOT covered by this rule; per R27 + R39 the pod is hidden by default and only revealed via the summon gesture. R33 applies only to action buttons that the user must always be able to reach (commit a decision, close, etc.).

Verify:
```js
const r = await page.evaluate(() => {
  const probes = ['.ve-action-btn--top', '.ve-action-btn--bottom'];
  return probes.map(sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, applicable: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const elAtPoint = document.elementFromPoint(
      r.x + r.width / 2, r.y + r.height / 2);
    return { sel, applicable: true,
             visible: r.width > 0 && r.height > 0
                      && cs.visibility !== 'hidden'
                      && cs.display !== 'none',
             zIndex: cs.zIndex,
             topMost: el === elAtPoint || el.contains(elAtPoint) };
  });
});
// every applicable probe MUST have visible: true AND topMost: true.
// (Probes are applicable only when the rendered page intentionally
// mounted the corner action button — e.g. interactive reports,
// choice-tables, form-input pages. A pure read-only typography
// specimen has no action button and that's fine.)
```

### R34 — No overlap between scaffolded elements

Scaffolded surfaces (multiple skills composed on one page) MUST NOT overlap. The page is a single-document scroll (R2). Each surface is a block-level container laid out below the previous one. The only exception is the floating-overlay z-layer (pod, corner buttons, modal, snippet popup, decision modal) — these have known small footprints and live on z > 100.

Verify:
```js
const r = await page.evaluate(() => {
  const surfaces = Array.from(document.querySelectorAll(
    '.ve-scene-graph, .ve-chart, .ve-table-wrap, .ve-code-block, '
    + '.ve-finding, .ve-wf-screen, .ve-icon-svg, '
    + '.ve-layout-grid, .ve-slide-block, .ve-form-input, '
    + '.ve-gallery, .ve-dirtree'));
  const overlaps = [];
  for (let i = 0; i < surfaces.length; i++) {
    for (let j = i + 1; j < surfaces.length; j++) {
      const a = surfaces[i].getBoundingClientRect();
      const b = surfaces[j].getBoundingClientRect();
      // Skip ancestor / descendant pairs (intentional containment).
      if (surfaces[i].contains(surfaces[j])
          || surfaces[j].contains(surfaces[i])) continue;
      const overlap = !(a.right <= b.left || b.right <= a.left
        || a.bottom <= b.top || b.bottom <= a.top);
      if (overlap) overlaps.push({
        i, j, a: surfaces[i].className.toString().slice(0, 30),
        b: surfaces[j].className.toString().slice(0, 30) });
    }
  }
  return overlaps;
});
// overlaps MUST be empty.
```

### R35 — No text hidden or truncated at the viewport edge

Every paragraph / list-item / code-line / heading MUST be fully readable. Specifically:
- No `text-overflow: ellipsis` on prose (only on intentionally narrow chips / badges).
- No prose `<p>` is masked by a floating overlay (the overlays have small footprints in known corners).
- No prose extends past the body's `padding-right` (i.e. the viewport's right edge minus the body's right padding).
- No prose is positioned at `position: fixed` with off-screen coordinates.

Verify:
```js
const r = await page.evaluate(() => {
  const viewportW = window.innerWidth;
  const bodyPadR = parseFloat(
    getComputedStyle(document.body).paddingRight);
  const proseTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4'];
  const offenders = [];
  document.querySelectorAll(proseTags.join(','))
    .forEach(el => {
      const r = el.getBoundingClientRect();
      // Skip elements inside floating overlays (intentional).
      if (el.closest('[data-ve-overlay]')) return;
      if (r.right > viewportW - bodyPadR + 1) {
        offenders.push({
          tag: el.tagName,
          right: r.right,
          textPreview: el.textContent.trim().slice(0, 30)
        });
      }
      // Ellipsis-on-prose check.
      const cs = getComputedStyle(el);
      if (cs.textOverflow === 'ellipsis'
          && (cs.overflow === 'hidden')
          && /^(P|LI|H[1-6])$/.test(el.tagName)) {
        offenders.push({
          tag: el.tagName, reason: 'ellipsis on prose',
          textPreview: el.textContent.trim().slice(0, 30)
        });
      }
    });
  return offenders;
});
// offenders MUST be empty.
```

### R36 — Diagrams: zoom / pan + draggable mini-map

Every `.ve-scene-graph` whose intrinsic size exceeds the viewport MUST mount:
- a zoom toolbar (zoom-in / zoom-out / fit-all / 1:1) — already shipped via `diagram.js:_buildToolbar`.
- a mini-map at bottom-right showing the full diagram with a draggable rectangle representing the current viewport — already shipped via `diagram.js:_buildMinimap`.
- drag-to-pan on the stage; wheel-to-zoom; pinch-to-zoom on touch (R30).

Verify:
```js
const r = await page.evaluate(() => {
  const hosts = document.querySelectorAll('.ve-scene-graph');
  return Array.from(hosts).map(h => ({
    hasToolbar: !!h.querySelector('.ve-scene-toolbar'),
    hasMinimap: !!h.querySelector('.ve-scene-minimap'),
    hasFrame: !!h.querySelector(
      '.ve-scene-minimap .ve-scene-minimap-frame'),
    hasStage: !!h.querySelector('.ve-scene-stage')
  }));
});
// each host MUST report all four true (when the diagram is in
// viewport mode; small inline diagrams are exempt).
```

### R37 — Font size readable (≥ 14 px body, ≥ 12 px chips)

**Body prose** MUST resolve to a computed `font-size` ≥ 14 px on the default viewport (1280 px width). **Mini chips** (decision-mini segments, badges, tag pills) MUST be ≥ 12 px. Fluid scales (`clamp(...)`) MUST clamp ≥ 14 px at the smallest defined viewport (320 px).

**Exemptions** — these classes are intentionally compact and NOT counted as body prose: `.vc-type-body-sm` (type-specimen example), `.ve-chart-legend-item` (chart legend labels), `.ve-badge`, `.ve-chip`, `.ve-footnote`, `.ve-caption`, `.ve-pnum`, plus any element with `data-ve-allow-small="1"`. Skills that need a sub-14 px UI label MUST use one of these classes (and document the intent) — never set `font-size: 12px` on a bare `<p>` or `<li>`.

Verify:
```js
const r = await page.evaluate(() => {
  const exemptSel =
    '.vc-type-body-sm, .ve-chart-legend-item, .ve-badge, '
    + '.ve-chip, .ve-footnote, .ve-caption, .ve-pnum, '
    + '[data-ve-allow-small="1"]';
  const proseSizes = [];
  document.querySelectorAll('p, li').forEach(el => {
    if (el.matches(exemptSel) || el.closest(exemptSel)) return;
    proseSizes.push(parseFloat(getComputedStyle(el).fontSize));
  });
  const minProse = proseSizes.length ? Math.min(...proseSizes) : 14;
  const chipSizes = [];
  document.querySelectorAll(
    '.ve-decision-mini-seg, .ve-badge, .ve-chip').forEach(el => {
    chipSizes.push(parseFloat(getComputedStyle(el).fontSize));
  });
  const minChip = chipSizes.length ? Math.min(...chipSizes) : 12;
  return { minProse, minChip,
           proseOk: minProse >= 14, chipOk: minChip >= 12 };
});
// proseOk AND chipOk MUST both be true.
```

### R38 — Live-page overlay: select TRUE HTML elements

When the runtime is loaded in overlay mode on a user's deployed website (per R24), the selection target MUST be the **actual HTML elements** of the page — every `<div>`, `<button>`, `<input>`, `<a>`, `<img>`, React/Vue component root, form control — NOT the plugin's `[data-ve-comment-id]` atoms (which don't exist on a third-party page). The overlay treats the whole DOM tree as a giant selectable surface and lets the user click any visible element to comment on it.

Specifically the overlay layer MUST:
- Highlight the element under the cursor with a dashed outline overlay (separate DOM, not mutating the host element).
- On click: add the element to the selection set (multi-click = multiple selections).
- The same comment-modal opens; same Done / Submit contract as report mode.
- The submission payload identifies each selected element by a stable best-effort selector that `document.querySelector(selector)` can round-trip back to the SAME element: tag + id + classes + nth-of-type + textContent prefix.

Verify (gated on `armOverlay` being shipped):
```js
const r = await page.evaluate(async () => {
  if (typeof window.amvcpOverlay?.armOverlay !== 'function') {
    return { applicable: false };
  }
  await window.amvcpOverlay.armOverlay();
  // Pick an arbitrary <div> on the host page.
  const target = document.querySelector('main div')
    || document.querySelector('body > div')
    || document.body.firstElementChild;
  if (!target) return { applicable: true, error: 'no target' };
  // Simulate hover → click via the overlay's API.
  window.amvcpOverlay._addSelectionForTest(target);
  const payload = window.amvcpOverlay.collectSubmission();
  await window.amvcpOverlay.disarmOverlay();
  // Round-trip the selector back to the same element.
  const roundTrip = payload.selections[0]
    && document.querySelector(payload.selections[0].selector);
  return {
    applicable: true,
    payloadCount: payload.selections.length,
    roundTripsToSameNode: roundTrip === target
  };
});
// when applicable: payloadCount >= 1 AND roundTripsToSameNode true.
```

### R39 — Pod summon gesture (desktop key combo + mobile 3-finger tap)

The pod (R27) is HIDDEN by default and MUST only become visible when the user invokes the summoning gesture. Invoking the gesture again hides it. The gesture MUST satisfy two constraints:

1. **Universal** — works on every supported platform: desktop (macOS + Windows + Linux), iOS mobile browsers (Safari, Chrome), Android mobile browsers (Chrome, Firefox).
2. **Non-conflicting** — never fires while the user is typing prose or code in any focusable input (`<input>`, `<textarea>`, `contenteditable`), and is not bound to any common browser shortcut.

**The chosen gesture** (cross-platform, non-conflicting):

- **Desktop keyboard**: `Ctrl+Shift+\` (or `Cmd+Shift+\` on macOS).
  - All three modifiers required → impossible to trigger by accident while typing.
  - Backslash is unbound in standard browser shortcut tables (Chrome / Firefox / Safari) and is rarely typed mid-prose.
  - Gated on `event.target` NOT being inside an `<input>` / `<textarea>` / `contenteditable` element, so the combo never preempts a code editor's own binding.
- **Mobile / tablet (no physical keyboard)**: **3-finger tap** on any non-input area of the viewport.
  - `touchstart` with `touches.length === 3` and `touchend` within 250 ms → toggle.
  - 1-finger = normal interaction, 2-finger = scroll / pinch, 3-finger = pod summon. No platform reserves 3-finger tap for typing or system gestures inside the viewport.
  - Gated on `event.target` NOT being inside any input / textarea / contenteditable.

The runtime exposes this gesture via a single handler `bindPodSummonGesture()` registered once on `window`. The handler is the SOLE way the pod becomes visible — there is no permanent always-visible UI affordance for it.

Verify:
```js
const r = await page.evaluate(() => {
  const handle = document.getElementById('ve-designmd-handle');
  if (!handle) return { error: 'pod not mounted' };
  // Pod starts hidden.
  const before = getComputedStyle(handle).visibility;
  // Synthesize the desktop combo (Ctrl+Shift+Backslash).
  const ev = new KeyboardEvent('keydown', { key: '\\',
    code: 'Backslash', ctrlKey: true, shiftKey: true,
    bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
  // Re-check visibility.
  const after = getComputedStyle(handle).visibility;
  // Re-dispatch to hide.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\',
    code: 'Backslash', ctrlKey: true, shiftKey: true,
    bubbles: true, cancelable: true }));
  const final = getComputedStyle(handle).visibility;
  return { before, after, final,
           summonedShown: before === 'hidden' && after === 'visible',
           toggledHidden: after === 'visible' && final === 'hidden' };
});
// summonedShown AND toggledHidden MUST be true.
```

For mobile: the same `bindPodSummonGesture` handler registers `touchstart`/`touchend` listeners. Verification under mobile UA emulation dispatches a synthetic `TouchEvent` with 3 touches.

### R26 — Skill discoverability — SKILL.md declares modes + composability

Every `skills/<skill>/SKILL.md` MUST declare in its body:

- `description` (frontmatter) — the agent-facing trigger string
  (already required by the Anthropic plugin spec).
- A `## Modes` section listing which `data-ve-mode` values the
  skill supports. Example: the table skill supports `readonly` /
  `single` / `multi`; the gallery skill supports `readonly` /
  `single` / `multi` / `max-N`; an explanatory-diagram skill
  supports `readonly` only.
- A `## Composability` section noting whether the skill can
  coexist on a page with other skills (almost always YES; the
  one exception is the `overlay` runtime, which is exclusive
  because it owns the click layer).

These two sections let the agent (and a future planner skill)
discover what each skill is capable of WITHOUT reading every
runtime file. Missing either section = R26 violation.

Verify:
```bash
for f in skills/amvcp-*/SKILL.md; do
  grep -q '^## Modes' "$f" || echo "R26 missing Modes in $f"
  grep -q '^## Composability' "$f" \
    || echo "R26 missing Composability in $f"
done
```

### R40 — Accessibility primitives + clean print export

Every page the runtime renders MUST ship the universal accessibility
primitives needed for keyboard navigation, screen readers, and the
"prefers-reduced-motion" / "@media print" branches that mainstream
browser users (and tooling such as Reader Mode / PDF export) rely
on. Distilled from the visualize competitor's checklist
(TRDD-6fdf6ad2 Tier 2):

1. **Skip-to-content link.** A visually-hidden-until-focused
   `<a href="#main">Skip to content</a>` so a keyboard user can
   skip past every floating control + the pod row + nav region
   in one Tab. Becomes visible on focus.
2. **Landmark roles / semantic regions.** The page's primary
   container MUST be `<main id="main">` (or carry `role="main"`)
   and the top-level chrome MUST be `<header role="banner">`.
   Without these, AT users have no way to jump between regions.
3. **`@media (prefers-reduced-motion: reduce)` branch.** Disable
   all animations + transitions for users who opt out of motion:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
     .reveal, [data-reveal] {
       opacity: 1 !important;
       transform: none !important;
     }
   }
   ```
4. **`role="img"` + descriptive `aria-label` on every non-decorative
   `<canvas>` and every standalone `<svg>` that conveys information
   (charts, diagrams, icons WITH semantic meaning). Decorative SVG
   (icon backdrops, ornaments) gets `aria-hidden="true"`.
5. **`@media print` clean export.** Hide the floating chrome row
   so PDF exports don't show buttons:
   ```css
   @media print {
     body { background: white !important; color: black !important; }
     .ve-corner-control,
     #ve-designmd-handle,
     #ve-designmd-pad,
     .ve-action-btn { display: none !important; }
     .reveal { opacity: 1 !important; transform: none !important; }
     * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
   }
   @page {
     margin: 1in;
     @bottom-center { content: "Page " counter(page); font-size: 9pt; color: #666; }
   }
   ```

Verify (run in the dev-browser against every fixture):
```js
const a11y = await page.evaluate(() => {
  return {
    skipLink: !!document.querySelector('a[href="#main"], a.ve-skip, a.skip-to-content'),
    hasMain: !!document.querySelector('main, [role="main"]'),
    hasReducedMotion: Array.from(document.styleSheets).some(ss => {
      try {
        return Array.from(ss.cssRules || []).some(r =>
          r.cssText && r.cssText.indexOf('prefers-reduced-motion') !== -1);
      } catch (e) { return false; }
    }),
    hasPrintMedia: Array.from(document.styleSheets).some(ss => {
      try {
        return Array.from(ss.cssRules || []).some(r =>
          r.media && Array.from(r.media).indexOf('print') !== -1);
      } catch (e) { return false; }
    }),
    chartsLabeled: Array.from(document.querySelectorAll('canvas')).every(c =>
      c.getAttribute('aria-label') || c.getAttribute('role') === 'img'
        || c.hasAttribute('aria-hidden'))
  };
});
// All four must be true.
```

R40 violations are CRITICAL because they affect users who can't
work around them: keyboard-only users, screen-reader users,
vestibular-disorder users, and anyone trying to print or PDF the
page. Unlike R37 (font size) which has a workaround (zoom), R40's
absence has no workaround.

### R41 — dev-browser NEVER runs in headless mode

When the test suite, a scenario runner, a screenshot script, or
ANY plugin tooling launches `dev-browser` (Chromium / Puppeteer
via the dev-browser plugin), it MUST run in **visible / windowed**
mode. Headless mode is forbidden because:

1. **Human-in-the-loop oversight.** The user is watching the test
   run — visible mode lets them catch UX regressions that
   automated assertions miss (a layout that looks right in the
   DOM but feels wrong on screen, an animation that lands at the
   wrong moment, a hover state that flashes instead of holding).
2. **Debugging signal.** When a test fails, the visible window is
   already showing the state right before the failure — no need
   to re-run with a screenshot harness to see what happened.
3. **Trust gradient.** Headless runs feel opaque — the agent says
   "tests passed" and the user has to take it on faith. Visible
   runs put the proof in front of the user as it happens.

Specifically forbidden:

- Passing `--headless`, `--headless=true`, `--headless=new`, or
  `headless: true` to puppeteer.launch / chrome / chromium CLIs.
- Setting env vars: `HEADLESS=1`, `HEADLESS=true`,
  `PUPPETEER_HEADLESS=true`, `CHROMIUM_HEADLESS=1`, or any
  equivalent.
- Invoking the dev-browser skill / agent with a "headless" flag.
- Running scenarios under any wrapper that silently switches to
  headless (some CI harnesses do this; the local plugin runs MUST
  stay visible).

Verify in any new tooling:
```bash
# Snapshot the test runner / scenario script for headless flags.
grep -nE 'headless|HEADLESS|--no-sandbox.*--headless' \
    tests/run-tests.py scripts/*.py
# Expected: zero matches OR explicit `headless: false` / `--no-headless`.
```

If a downstream tool defaults to headless, override it to visible
before invocation. If a tool only supports headless, do not use it
for this plugin — find a visible alternative.

This rule applies to every dev-browser invocation in the project:
the main test runner (`tests/run-tests.py`), per-skill smoke tests,
the scenarios runner, screenshot capture scripts, and any agent
that delegates to dev-browser (run-scenario-test, the plugin-fixer
when re-running tests, etc.).

