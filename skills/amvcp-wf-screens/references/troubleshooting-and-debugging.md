# Troubleshooting & debugging — common wireframe bugs and fixes

## Table of Contents

- [Symptom: brand color leaks at fidelity=wireframe](#symptom-brand-color-leaks-at-fidelitywireframe)
- [Symptom: the fidelity slider does nothing](#symptom-the-fidelity-slider-does-nothing)
- [Symptom: the wireframe looks broken on dark theme](#symptom-the-wireframe-looks-broken-on-dark-theme)
- [Symptom: an inner scrollbar appears in a device frame](#symptom-an-inner-scrollbar-appears-in-a-device-frame)
- [Symptom: clicking a wireframe block does nothing (no selection)](#symptom-clicking-a-wireframe-block-does-nothing-no-selection)
- [Symptom: nested wireframes paint wrong (undefined behavior)](#symptom-nested-wireframes-paint-wrong-undefined-behavior)
- [Symptom: amvcpWireframe.init() throws](#symptom-amvcpwireframeinit-throws)
- [Symptom: layout collapses unexpectedly on mobile](#symptom-layout-collapses-unexpectedly-on-mobile)
- [Symptom: a chip / button paints in the wrong color](#symptom-a-chip--button-paints-in-the-wrong-color)
- [Symptom: ramp's last column looks identical to the third](#symptom-ramps-last-column-looks-identical-to-the-third)
- [Symptom: anchor click does nothing in paged mode](#symptom-anchor-click-does-nothing-in-paged-mode)
- [Symptom: theme flip doesn't update the wireframe](#symptom-theme-flip-doesnt-update-the-wireframe)
- [Visual verification — the screenshot-test rule](#visual-verification--the-screenshot-test-rule)
- [Sanity checks before shipping a wireframe](#sanity-checks-before-shipping-a-wireframe)

A guide to the most common wireframe authoring bugs, how to detect
them, and the fix. Organized by symptom. Each section gives the
SYMPTOM, the LIKELY CAUSE, and the FIX.

## Table of contents

- [Symptom: brand color leaks at fidelity=wireframe](#symptom-brand-color-leaks-at-fidelitywireframe)
- [Symptom: the fidelity slider does nothing](#symptom-the-fidelity-slider-does-nothing)
- [Symptom: the wireframe looks broken on dark theme](#symptom-the-wireframe-looks-broken-on-dark-theme)
- [Symptom: an inner scrollbar appears in a device frame](#symptom-an-inner-scrollbar-appears-in-a-device-frame)
- [Symptom: clicking a wireframe block does nothing (no selection)](#symptom-clicking-a-wireframe-block-does-nothing-no-selection)
- [Symptom: nested wireframes paint wrong (undefined behavior)](#symptom-nested-wireframes-paint-wrong-undefined-behavior)
- [Symptom: amvcpWireframe.init() throws](#symptom-amvcpwireframeinit-throws)
- [Symptom: layout collapses unexpectedly on mobile](#symptom-layout-collapses-unexpectedly-on-mobile)
- [Symptom: a chip / button paints in the wrong color](#symptom-a-chip--button-paints-in-the-wrong-color)
- [Symptom: ramp's last column looks identical to the third](#symptom-ramps-last-column-looks-identical-to-the-third)
- [Symptom: anchor click does nothing in paged mode](#symptom-anchor-click-does-nothing-in-paged-mode)
- [Symptom: theme flip doesn't update the wireframe](#symptom-theme-flip-doesnt-update-the-wireframe)
- [Visual verification — the screenshot-test rule](#visual-verification--the-screenshot-test-rule)
- [Sanity checks before shipping a wireframe](#sanity-checks-before-shipping-a-wireframe)

---

## Symptom: brand color leaks at fidelity=wireframe

**Symptom**: A button / chip / border paints in the brand accent
color (e.g. gold) even though the wireframe is at
`data-wf-fidelity="wireframe"`. Should be grey.

**Likely cause**: A hardcoded hex value (instead of a `--vc-color-*`
token) in an inline `style` attribute or in a CSS rule. The
desaturation engine rewrites `--vc-color-*` custom properties, not
literal hex.

**Fix**: Grep for the leaking color:

```bash
# In your wireframe HTML / CSS:
grep -E '#[0-9a-fA-F]{3,6}' your-wireframe.html | \
  grep -v 'var(--vc-color' | \
  grep -v 'wf-frame'
```

Replace any hits with `var(--vc-color-…, <fallback-hex>)`:

```html
<!-- BEFORE -->
<button style="background:#b8861f;">Save</button>

<!-- AFTER -->
<button style="background:var(--vc-color-accent, #b8861f);">Save</button>
```

The comma-fallback (`#b8861f`) is the engine-absent path; with the
engine present, the variable resolves to the desaturated grey.

---

## Symptom: the fidelity slider does nothing

**Symptom**: Moving the slider doesn't change the wireframe's
appearance.

**Likely cause** (in order of probability):

1. JS isn't loaded — the wireframe engine never ran.
2. The slider's `data-wf-target` ID doesn't match any wireframe
   root's `id`.
3. The wireframe engine wasn't initialized — auto-init was opted
   out via `window.__wfManualInit = true` but no manual `init()`
   call was made.

**Fix**:

```html
<!-- 1. ensure the script tag is present and BEFORE </body> -->
<script src="amvcp-wireframe.js"></script>

<!-- 2. make sure target IDs match -->
<div class="wf-root" id="my-ramp-target" data-wf-root data-wf-fidelity="wireframe">…</div>
<input class="wf-fidelity-slider" data-wf-target="my-ramp-target">
                                                <!-- ^ matches the id above -->

<!-- 3. if you set __wfManualInit, you must call init() yourself -->
<script>
  window.__wfManualInit = true;
  // … later, after DOMContentLoaded:
  amvcpWireframe.init(document);
</script>
```

If all three are correct and it still doesn't work, check the
browser console for errors. The engine throws loud on bad
fidelity values (`data-wf-fidelity="medium"` → throws "expected
wireframe|low|mid|hi").

---

## Symptom: the wireframe looks broken on dark theme

**Symptom**: On dark theme, the wireframe is hard to read — text
disappears, contrast is wrong, colors are washed out.

**Likely causes**:

1. A hardcoded `#fff` / `#000` / `rgba(0,0,0,…)` somewhere — these
   don't theme.
2. A modal overlay using `rgba(0,0,0,0.5)` instead of
   `color-mix(in srgb, var(--vc-color-content) 45%, transparent)`.
3. An SVG glyph using `fill="#1f1a14"` instead of
   `fill="currentColor"`.

**Fix**: See [`theme-and-dark-mode.md`](../../amvcp-wf-fidelity/references/theme-and-dark-mode.md) §
"Common theme bugs and fixes" for the full list.

Quick check — flip the theme in DevTools console:

```js
document.documentElement.dataset.veTheme = 'dark';
amvcpWireframe.refresh(document);
```

Then visually inspect for legibility. Repeat with `'light'`.

---

## Symptom: an inner scrollbar appears in a device frame

**Symptom**: A long screen inside `wf-frame--ios` (or any frame)
shows its own scrollbar inside the frame, instead of extending
the page.

**Likely cause**: A wrapping element inside the frame has
`overflow: auto` or `overflow: hidden` — typically a div the
author added for layout.

**Fix**: The wireframe CSS forces `overflow: visible` on
`wf-frame__content` and many other containers. Make sure your
inner markup doesn't override:

```css
/* WRONG */
.my-custom-wrapper {
  overflow: auto;     /* forbidden */
  max-height: 600px;  /* with overflow:auto, creates a scrollbox */
}

/* RIGHT */
.my-custom-wrapper {
  overflow: visible;   /* page extends; no scrollbar */
}
```

Verify with the global no-nested-scrollbars rule:

```bash
# Search for forbidden patterns in your wireframe:
grep -E '(overflow.*:.*auto|overflow.*:.*scroll)' your-wireframe.html
```

Anything other than the documented exceptions (textarea, code
editor) is a bug.

---

## Symptom: clicking a wireframe block does nothing (no selection)

**Symptom**: Clicking a `wf-card` or `wf-button` should make it
"selected" (outlined in accent), but nothing happens.

**Likely causes**:

1. The runtime (`amvcp-runtime.js`) isn't loaded — selection state
   is the runtime's job, not the wireframe engine's.
2. The atom lacks `data-ve-id` — the engine can't track an
   unidentified element.
3. The atom is inside a different runtime root (some runtimes scope
   selection to a single subtree).

**Fix**: Verify the runtime is loaded:

```js
console.log(window.amvcpRuntime);   // should be an object
```

Verify the atom has `data-ve-id`:

```html
<article class="wf-card"
         data-ve-id="card-stats"     <!-- required -->
         data-ve-type="wireframe-block">
```

Verify the auto-stamp ran (the engine's `stampSelectionAtoms()`):

```js
console.log(document.querySelector('.wf-card').getAttribute('data-ve-comment-id'));
// should be "wireframe-block:card-stats" (auto-stamped)
```

If `data-ve-comment-id` is null, the engine didn't run. Re-run
`amvcpWireframe.refresh(document)`.

---

## Symptom: nested wireframes paint wrong (undefined behavior)

**Symptom**: A `.wf-root` inside another `.wf-root` paints with
the OUTER root's fidelity, ignoring its own attribute.

**Likely cause**: Nesting `.wf-root` is FORBIDDEN — undefined
behavior.

**Fix**: NEVER nest. If you need multiple wireframes on a page
(e.g. a ramp), make them SIBLINGS:

```html
<!-- WRONG -->
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
  <section class="wf-screen">
    <div class="wf-root" data-wf-root data-wf-fidelity="hi"> <!-- forbidden -->
      …
    </div>
  </section>
</div>

<!-- RIGHT -->
<div class="wf-ramp">
  <figure class="wf-ramp__stage">
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">…</div>
  </figure>
  <figure class="wf-ramp__stage">
    <div class="wf-root" data-wf-root data-wf-fidelity="hi">…</div>
  </figure>
</div>
```

The `.wf-ramp` flex container is the SIBLING context; each `.wf-root`
inside is independent.

---

## Symptom: amvcpWireframe.init() throws

**Symptom**: Browser console shows:

```
Error: wireframe: invalid data-wf-fidelity "medium" — expected wireframe|low|mid|hi
```

**Likely cause**: A typo in the `data-wf-fidelity` attribute. The
engine is fail-fast — it validates EVERY wireframe's fidelity
BEFORE any desaturation runs.

**Fix**: Find the bad value:

```bash
grep -E 'data-wf-fidelity="[^"]*"' your-wireframe.html
```

Verify each value is exactly one of `wireframe`, `low`, `mid`, `hi`.
NO synonyms (no `medium`, `high`, `lofi`, `hifi`, `full`, etc.).

The fail-fast contract is intentional — silent coercion would hide
typos and lead to wrong fidelity at runtime. The throw points at
the line of the offending element.

---

## Symptom: layout collapses unexpectedly on mobile

**Symptom**: A 4-column dashboard grid renders as 4 ROWS on
narrow viewports — way too tall.

**Likely cause**: A `grid-template-columns: repeat(4, 1fr)` doesn't
wrap; it FORCES 4 columns regardless of width. On narrow
viewports, each column gets ~80px and content overflows.

**Fix**: Use auto-fill / auto-fit grids that wrap:

```css
/* BEFORE — forces 4 columns always */
.grid {
  grid-template-columns: repeat(4, 1fr);
}

/* AFTER — fits as many as possible at minimum 200px */
.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
```

`auto-fill` keeps empty cells at the end; `auto-fit` collapses
them (use `auto-fit` if you have just a few items).

For media-query-based collapse:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;   /* 2 columns on narrow */
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;       /* 1 column on tiny */
  }
}
```

---

## Symptom: a chip / button paints in the wrong color

**Symptom**: A semantic chip (success / warning / danger) renders
without its expected color even at hi fidelity.

**Likely cause**: The `--vc-color-success` / `--vc-color-warning` /
`--vc-color-danger` token isn't defined in the page's DESIGN.md,
so it falls back to the engine-absent fallback hex.

**Fix**: Verify the token exists:

```js
getComputedStyle(document.documentElement)
  .getPropertyValue('--vc-color-success').trim();
// should be a hex like "#3a6b5c"
```

If empty, the DESIGN.md engine isn't loaded OR the token isn't in
the active theme set. Check the DESIGN.md block in the page header:

```markdown
# Colors
- success: #3a6b5c
- warning: #a8791f
- danger:  #a84a32
```

The 4 semantic colors (`success`, `warning`, `danger`, `info`) are
PART OF the standard token set; their absence is the engine being
not-fully-configured.

For wireframes WITHOUT the engine, the canonical fallback hexes
fire — see the `FALLBACK_HEX` table in `amvcp-wireframe.js`.

---

## Symptom: ramp's last column looks identical to the third

**Symptom**: In a 4-fidelity ramp, the `mid` and `hi` columns
look identical.

**Likely cause**: The wireframe screen doesn't contain elements
that differentiate between `mid` and `hi`. The two fidelities
differ in:

- Radius (`--vc-radius-md` vs `--vc-radius-lg`)
- Shadow (`--vc-shadow-sm` vs `--vc-shadow-md`)

The accent fill is identical (both use full chroma).

**Fix**: Add elements with VISIBLE radius/shadow — `wf-card`,
`wf-image`, `wf-table`, `wf-modal`. Plain text and buttons don't
show the difference.

```html
<!-- Add a wf-card to make mid vs hi visible -->
<article class="wf-card">
  <p class="wf-text" data-wf-lines="3"></p>
</article>
```

At wireframe: no radius, no shadow. At low: small radius. At mid:
medium radius + small shadow. At hi: large radius + larger shadow.

---

## Symptom: anchor click does nothing in paged mode

**Symptom**: In `data-wf-nav="paged"` mode, clicking an
`<a href="#screen-x">` doesn't change the visible screen.

**Likely causes**:

1. The target `<section>` doesn't have the matching `id`.
2. The page uses `<base href>` which interferes with fragment
   resolution.
3. JavaScript intercepted the click (some frameworks do this).

**Fix**:

```html
<!-- 1. verify id matches -->
<a href="#screen-payment">Continue</a>

<section class="wf-screen" id="screen-payment">   <!-- id matches -->
  …
</section>

<!-- 2. remove <base href> if present -->

<!-- 3. check console for event.preventDefault() calls -->
```

If you're in `paged` mode and the FIRST screen doesn't show on
load (no URL fragment), check that your browser supports `:has()`
— the no-fragment fallback uses `:has()` (see
[`multi-screen-navigation.md`](multi-screen-navigation.md)).

---

## Symptom: theme flip doesn't update the wireframe

**Symptom**: Toggling the theme (light → dark) doesn't re-desaturate
the wireframe — it stays in the old theme's grey palette.

**Likely cause**: The runtime isn't dispatching `ve:themechange`
on theme flip, so the wireframe engine's listener never fires.

**Fix**: Either configure the runtime, or manually trigger
desaturation after the flip:

```js
// option 1: dispatch the event manually
document.documentElement.dataset.veTheme = 'dark';
document.dispatchEvent(new CustomEvent('ve:themechange'));

// option 2: call refresh directly
document.documentElement.dataset.veTheme = 'dark';
amvcpWireframe.refresh(document);
```

For long-term, ask the runtime to emit `ve:themechange` from its
theme-apply path.

---

## Visual verification — the screenshot-test rule

The user MEMORY rule (`feedback_visual_screenshot_testing.md`) is
explicit: every visual change MUST be verified with a screenshot.
For wireframes:

1. Render the wireframe with the dev-browser plugin.
2. Capture screenshots at:
   - Light theme + wireframe fidelity
   - Light theme + low fidelity
   - Light theme + mid fidelity
   - Light theme + hi fidelity
   - Dark theme + wireframe fidelity
   - Dark theme + low fidelity
   - Dark theme + mid fidelity
   - Dark theme + hi fidelity
3. Compare side-by-side.

For automation:

```js
// pseudocode using dev-browser
for (const theme of ['light', 'dark']) {
  document.documentElement.dataset.veTheme = theme;
  for (const fid of ['wireframe', 'low', 'mid', 'hi']) {
    amvcpWireframe.applyFidelity(document.querySelector('.wf-root'), fid);
    await page.screenshot(`wireframe-${theme}-${fid}.png`);
  }
}
```

For deeper guidance, see `skills/amvcp-self-debug-rules/SKILL.md`.

---

## Sanity checks before shipping a wireframe

A checklist before considering a wireframe done:

### Markup hygiene

- [ ] Every `.wf-root` has `data-wf-root`.
- [ ] Every `.wf-root` has `data-wf-fidelity` OR defaults to wireframe.
- [ ] No `.wf-root` is nested inside another `.wf-root`.
- [ ] Every `.wf-screen` has a unique `id`.
- [ ] Every selectable atom has `data-ve-id` + `data-ve-type`.

### Token hygiene

- [ ] No hardcoded hex outside `wf-frame` and comma-fallback.
- [ ] No `rgba(0,0,0,…)` or `rgba(255,255,255,…)` outside
  comma-fallbacks.
- [ ] No `font-size`, `padding`, `margin` hardcoded in px outside
  `--wf-*` and `--vc-*` reads.

### Layout hygiene

- [ ] No `overflow: auto` or `overflow: scroll` (outside textareas).
- [ ] No `max-height` + `overflow: auto` combinations.
- [ ] Grid columns use `auto-fill` / `auto-fit` OR have responsive
  media queries.

### Navigation hygiene

- [ ] Every clickable element is an `<a>` or `<button>`.
- [ ] Every flow has a back-link.
- [ ] Every flow has at least one error path documented.

### Accessibility hygiene

- [ ] Every form input has a `<label>`.
- [ ] Every image has `alt` text (or `alt=""` for decorative).
- [ ] Every button has a discernible name.
- [ ] Heading levels are in order (h1 → h2 → h3).
- [ ] Lists use `<ul>` / `<ol>`.

### Theme hygiene

- [ ] Verified in both light and dark themes (screenshot test).
- [ ] Verified at all 4 fidelities.
- [ ] No leaks of brand color at wireframe fidelity.

### Behavior hygiene

- [ ] `amvcpWireframe.init()` runs without throwing.
- [ ] Slider (if present) updates the target wireframe.
- [ ] Selection works (click an atom → outline appears).
- [ ] Comment thread opens (Ctrl-+ on a selected atom).

Once all boxes are checked, the wireframe is ready to share.
