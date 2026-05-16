# Fidelity ramp — the 4-stage wireframe→hi pipeline

The same screen, four fidelities, one DESIGN.md theme. The fidelity
engine in `amvcp-wireframe.js` desaturates the theme tokens to drive
the ramp; rising fidelity re-introduces the real accent.

## Table of contents

- [The 4 stages — definitions](#the-4-stages--definitions)
- [The desaturation algorithm — `k`-factor + lightness preservation](#the-desaturation-algorithm--k-factor--lightness-preservation)
- [Per-stage chroma table](#per-stage-chroma-table)
- [Why accent gets its own `k` ramp](#why-accent-gets-its-own-k-ramp)
- [Authoring a side-by-side `.wf-ramp`](#authoring-a-side-by-side-wf-ramp)
- [Authoring a `.wf-fidelity-slider`](#authoring-a-wf-fidelity-slider)
- [Programmatic fidelity changes — `applyFidelity(rootEl, fidelity)`](#programmatic-fidelity-changes--applyfidelityrootel-fidelity)
- [Theme-flip re-desaturation](#theme-flip-re-desaturation)
- [The fail-fast contract — invalid fidelity throws](#the-fail-fast-contract--invalid-fidelity-throws)
- [Common ramp pitfalls](#common-ramp-pitfalls)

---

## The 4 stages — definitions

| Stage | What it looks like | When to ship |
|---|---|---|
| `wireframe` | Pure grayscale, radius 0, no shadow | The default — every initial mockup |
| `low` | Faint hint of color (accent slightly visible), small radius, no shadow | "Lo-fi" presentations, early stakeholder review |
| `mid` | Real accent visible, medium radius, soft shadow | Design exploration, before final visual polish |
| `hi` | Production-ready — the real DESIGN.md, full radius + shadow | Final hand-off, marketing materials |

The four stages are ORDINAL — the slider treats them as 0/1/2/3 and
interpolates by INDEX (not by chroma). A fidelity ramp jumps in
discrete steps; there is no `low.5` stage.

---

## The desaturation algorithm — `k`-factor + lightness preservation

The engine's core idea: convert each `--vc-color-*` token to HSL,
multiply the saturation by a per-stage factor `k`, preserve the
lightness exactly, convert back to RGB, publish as an inline
`--vc-color-*` on the wireframe root.

```js
function desaturateToken(cssColor, fidelity, isAccent) {
  var k = fidelityFactor(fidelity, isAccent);
  if (k >= 1) { return cssColor; }       // hi — real token, no work
  var rgb = parseColor(cssColor);
  if (!rgb) { return cssColor; }         // unparseable -> leave as-is
  var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = hsl.s * k;                     // scale chroma, keep lightness
  return _rgbToHex(hslToRgb(hsl.h, hsl.s, hsl.l));
}
```

### Why HSL not HSV

HSL's "L" (lightness) maps the original color to a perceptually-fair
midpoint between black and white. A color converted to HSL at
`s = 0` is the grey of the SAME visual brightness. The original
goldenrod `#b8861f` (light theme accent) becomes a grey of about
60% lightness — the same lightness as the goldenrod, just with no
hue.

HSV's "V" (value) would instead keep the BRIGHTEST CHANNEL, not the
perceived brightness. A `#b8861f → V=0` would yield a much darker
grey than expected. HSL is the right model for "fade the chroma
without changing how bright it looks".

### Why preserve lightness — theme correctness

A light DESIGN.md theme has `--vc-color-content` near black (`#1f1a14`)
and `--vc-color-canvas` near cream (`#faf6ee`). Desaturating both at
`k=0` yields: content → near-black-grey, canvas → near-white-grey.
The wireframe stays light.

A dark DESIGN.md theme has the reverse: content near white, canvas
near black. Desaturating yields: content → near-white-grey, canvas
→ near-black-grey. The wireframe stays dark.

**Lightness preservation is what makes the ramp theme-correct.**
A light theme stays light-grey at wireframe-fi; a dark theme stays
dark-grey. The wireframe respects the user's theme choice; the user
doesn't get a jarring light wireframe in their dark UI.

---

## Per-stage chroma table

Two `k` ramps — one for the accent role, one for all other roles:

```js
var CHROMA_K = { wireframe: 0,    low: 0.15, mid: 0.6, hi: 1.0 };
var ACCENT_K = { wireframe: 0,    low: 0.35, mid: 0.6, hi: 1.0 };
```

| Stage | Non-accent `k` | Accent `k` | What it does |
|---|---|---|---|
| `wireframe` | 0 | 0 | Pure grayscale, no hue at all |
| `low` | 0.15 | 0.35 | Almost-grey overall; accent twice as visible |
| `mid` | 0.6 | 0.6 | Clearly colored, slightly muted; same as accent |
| `hi` | 1.0 | 1.0 | Real tokens, untouched |

At `k=0` (wireframe) every saturation is zero — pure grey of the
correct lightness. At `k=1` (hi) the original token is returned
verbatim (early-exit in `desaturateToken` — no math, no parsing
round-trip).

The `low` stage's split — accent at 0.35, everything else at 0.15 —
is the deliberate "the primary action is the first thing to
re-emerge" pattern. As you slide from wireframe to low, the SAVE
button starts to glow faintly while the rest of the screen stays
near-grey. The reader's eye is led to the primary action.

---

## Why accent gets its own `k` ramp

In a real design pipeline, the FIRST thing a designer commits to is
"this is the primary action color". Brand colors come early — way
before secondary text colors, before muted greys, before borders.

The accent ramp mirrors that workflow. As fidelity rises:

- `wireframe → low`: the accent goes from grey to FAINTLY visible
  (a hint of gold/blue/whatever).
- `low → mid`: the accent fully saturates; other colors catch up.
- `mid → hi`: no visible accent change; muted shadows and radii
  catch up.

A wireframe at `low` fidelity often has just ONE colored element —
the primary CTA. That's the most useful intermediate stage for
stakeholder reviews: "this is the screen, and this is where we're
asking the user to act."

---

## Authoring a side-by-side `.wf-ramp`

The static ramp — render the same screen FOUR TIMES at the four
fidelities. Authored as four sibling `.wf-root` elements, each with a
different `data-wf-fidelity`. No slider, no JS interaction.

```html
<div class="wf-ramp">
  <figure class="wf-ramp__stage">
    <figcaption>WIREFRAME</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <section class="wf-screen">…the screen…</section>
    </div>
  </figure>

  <figure class="wf-ramp__stage">
    <figcaption>LOW</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="low">
      <section class="wf-screen">…the same screen…</section>
    </div>
  </figure>

  <figure class="wf-ramp__stage">
    <figcaption>MID</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="mid">
      <section class="wf-screen">…the same screen…</section>
    </div>
  </figure>

  <figure class="wf-ramp__stage">
    <figcaption>HI</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="hi">
      <section class="wf-screen">…the same screen…</section>
    </div>
  </figure>
</div>
```

### Layout

```css
.wf-ramp {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-5, 32px);
  align-items: flex-start;
}
.wf-ramp__stage {
  flex: 1 1 280px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-2, 12px);
}
```

- `flex-wrap: wrap` — four stages fit side-by-side on a wide screen,
  reflow to two-by-two on a narrow one. No horizontal scrollbar.
- `flex: 1 1 280px` — each stage tries for 280px but flexes; the
  `min-width: 240px` is the hard floor.
- The `<figcaption>` paints an uppercase stage label above each
  ramp column.

### When to use

- A design review where you want to show the same screen at
  multiple fidelities side-by-side.
- A documentation page explaining the fidelity model itself.
- A stakeholder presentation: "here's the same flow, look at how it
  evolves from sketch to ship."

### When NOT to use

- A real user-facing report — four columns of the same screen
  quadruple the visual noise. Use the slider instead.
- A mobile-first page — four columns wrap to four ROWS, which
  becomes a very long page.

---

## Authoring a `.wf-fidelity-slider`

The interactive ramp — ONE screen plus a slider that flips its
fidelity in place. Driven by a native `<input type="range">` with
four values (0..3); the engine maps the integer index to a
fidelity stage and applies it.

```html
<div class="wf-fidelity-control">
  <div class="wf-root" id="ramp-target"
       data-wf-root data-wf-fidelity="wireframe">
    <section class="wf-screen">…the screen…</section>
  </div>

  <input class="wf-fidelity-slider" type="range"
         min="0" max="3" step="1" value="0"
         data-wf-target="ramp-target">
  <div class="wf-fidelity-ticks">
    <span>wireframe</span>
    <span>low</span>
    <span>mid</span>
    <span>hi</span>
  </div>
</div>
```

### Wiring

The engine auto-wires every `input.wf-fidelity-slider[data-wf-target]`
during `init()`. On the `input` event the slider's value 0|1|2|3 is
indexed into `FIDELITY_STAGES = ['wireframe', 'low', 'mid', 'hi']`
and the result is applied to the target root.

```js
function onInput() {
  var target = document.getElementById(targetId);
  var idx = parseInt(slider.value, 10);
  applyFidelity(target, FIDELITY_STAGES[idx]);
}
slider.addEventListener('input', onInput);
slider.addEventListener('change', onInput);
onInput();   // prime: apply the initial value on load
```

- The `input` event fires DURING drag (live preview).
- The `change` event fires AFTER release (covers the keyboard arrow
  pattern).
- `onInput()` is called once on wire so an authored
  `<input value="2">` correctly primes the screen to `mid` fidelity
  on load (not just on the first slider drag).

A `data-wf-wired="1"` guard on the slider makes re-running `wireSliders`
(via `refresh()`) idempotent — the listener attaches at most once.

### Layout

```css
.wf-fidelity-control {
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-3, 16px);
  max-inline-size: var(--wf-measure);
}
.wf-fidelity-slider {
  width: 100%;
  accent-color: var(--vc-color-accent, #b8861f);
}
.wf-fidelity-ticks {
  display: flex;
  justify-content: space-between;
  font-size: var(--vc-text-0, 12px);
  color: var(--vc-color-content-subtle, #8a8170);
}
```

- The slider uses native `accent-color` so its thumb + track flip
  with the theme.
- The tick labels are evenly spaced (`justify-content: space-between`)
  to match the slider's stop positions.

### When to use

- An interactive report a stakeholder will explore.
- A documentation page where the reader can self-pace through
  fidelity levels.
- A pitch deck where you want to "reveal" the final design by
  dragging the slider from wireframe to hi during the presentation.

### Graceful degradation

With JS off, the slider does nothing — the screen stays at
`data-wf-fidelity="wireframe"` (whatever value was authored on the
root). The slider is still keyboard-focusable (it's a native
`<input>`), but moving it has no effect. This is the SAFE default
— the wireframe fidelity is the lowest-risk default appearance.

---

## Programmatic fidelity changes — `applyFidelity(rootEl, fidelity)`

The public per-subtree entry point. Useful for keyboard shortcuts,
tab key handlers, or animation engines that need to step through
fidelity stages:

```js
var root = document.getElementById('ramp-target');

// Step to the next fidelity stage
var idx = amvcpWireframe.FIDELITY_STAGES.indexOf(
  root.getAttribute('data-wf-fidelity') || 'wireframe'
);
var next = (idx + 1) % amvcpWireframe.FIDELITY_STAGES.length;
amvcpWireframe.applyFidelity(root, amvcpWireframe.FIDELITY_STAGES[next]);
```

`applyFidelity`:

1. Validates the fidelity value (throws on invalid).
2. Writes `data-wf-fidelity` on the root.
3. Re-publishes the scoped `--vc-color-*` set on the root.

It does NOT touch any other roots — multiple wireframes on the same
page each cycle independently.

For wholesale re-render after dynamic DOM insert (e.g. an SPA
mounts a new wireframe), call `amvcpWireframe.refresh(document)` —
that re-runs the engine across every `[data-wf-root]` in the
subtree.

---

## Theme-flip re-desaturation

When the active theme flips (a manual toggle, or a DESIGN.md
hot-swap), the engine re-resolves `--vc-color-*` on `:root`. Every
wireframe must re-desaturate off the NEW theme so the grayscale
tracks (light theme → light-grey, dark theme → dark-grey) and the
hi-fi column shows the new palette.

The runtime is REQUESTED (spec §9) to dispatch a `ve:themechange`
DOM event on `document` from its theme-apply path. The wireframe
engine subscribes:

```js
document.addEventListener('ve:themechange', function () {
  _redesaturateAll(document);
});
```

A host that never fires the event simply never triggers the
re-render (the initial desaturation at `init()` still happened).
The wireframe is defensive; cross-file wiring is a later
integration pass.

---

## The fail-fast contract — invalid fidelity throws

`amvcpWireframe.init()` validates EVERY wireframe root's fidelity
BEFORE any desaturation runs. A single bad value aborts the whole
init pass with a loud error:

```js
function resolveFidelity(el) {
  var raw = el.getAttribute('data-wf-fidelity');
  if (raw === null || raw === undefined || raw === '') {
    return 'wireframe';   // safe default
  }
  var v = String(raw).trim();
  for (var i = 0; i < FIDELITY_STAGES.length; i++) {
    if (FIDELITY_STAGES[i] === v) { return v; }
  }
  throw new Error(
    'wireframe: invalid data-wf-fidelity "' + v + '" — expected ' +
    FIDELITY_STAGES.join('|')
  );
}
```

`applyFidelity` does the same check. A typo like `data-wf-fidelity="medium"`
(should be `mid`) throws — there is no silent coercion.

The ONE permissive path is the absent / empty attribute, which
defaults to `wireframe`. A bare `.wf-root` IS a wireframe.

---

## Common ramp pitfalls

### "My wireframe leaks brand color at fidelity=wireframe"

A class somewhere is using a hardcoded hex instead of a `--vc-color-*`
token. The desaturation rewrites CUSTOM PROPERTIES, not literal
colors in rule bodies. Grep your stylesheet:

```bash
grep -E '#[0-9a-fA-F]{3,6}' your-stylesheet.css | \
  grep -v 'var(--vc-color' | grep -v 'wf-frame'
```

Anything other than the documented bezel gradient or a comma-fallback
is a leak. Replace with `var(--vc-color-*, <fallback>)`.

### "The slider does nothing"

Three causes:

1. JS isn't loaded. Check the `<script>` tag.
2. The `data-wf-target` ID doesn't match the wireframe root's
   `id`. The slider needs to find its target by ID, not by name.
3. The wireframe engine wasn't initialised yet. Either auto-init
   (default — fires on `DOMContentLoaded`) or call
   `amvcpWireframe.init(document)` manually after the DOM is ready.

### "My ramp's last stage looks identical to the third"

`mid` and `hi` differ only in radius and shadow (both use the real
accent at full chroma). On a wireframe with only `wf-button` and
`wf-text` elements (no `wf-card`, no `wf-image`), there's no
visible difference. Add a `wf-card` or `wf-image` to surface the
radius/shadow distinction.

### "The desaturation isn't running on a dynamically-inserted wireframe"

`init()` ran once on `DOMContentLoaded`. New wireframes added to
the DOM after that need an explicit `amvcpWireframe.refresh(parent)`
call. The runtime calls this from its own mount hooks; an SPA's
router needs to call it on every route change.

### "I want a 5th fidelity stage between mid and hi"

The model is intentionally 4-stage. Five stages adds a fourth-decimal
chroma factor that designers can't reliably distinguish ("is this
`mid+` or `mid`?"). The 4-stage ramp is the
production-tested model.

If you genuinely need a 5th, add a stage in `FIDELITY_STAGES` and a
matching entry in `CHROMA_K` + `ACCENT_K`. The CSS attribute
selectors auto-cascade for stages they recognize; unknown stages get
default styling. But this is a fork point — the canonical engine
ships with 4.
