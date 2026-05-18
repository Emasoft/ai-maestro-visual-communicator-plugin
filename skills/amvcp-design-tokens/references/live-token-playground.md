# Live-token playground — sliders & radios writing to CSS vars

## Table of Contents

- [What it does](#what-it-does)
- [When to ship a playground](#when-to-ship-a-playground)
- [Scaffold to emit](#scaffold-to-emit)
- [The hover→snippet preview pattern (DM-22 reference)](#the-hoversnippet-preview-pattern-dm-22-reference)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The Anthropic-Claude `06-component-variants.html` pattern: a sticky
toolbar with sliders / radios / checkboxes that mutate CSS custom
properties on `:root` in real time, with downstream blocks reskinning
instantly. The cleanest "design tuner" pattern — pure CSS-vars, no
React, no template engine.

## What it does

The minimal mechanism:

```html
<input type="range" id="card-pad" min="12" max="32" value="20">

<script>
  document.getElementById('card-pad').addEventListener('input', function (ev) {
    document.documentElement.style.setProperty('--card-pad', ev.target.value + 'px');
  });
</script>

<style>
  .card { padding: var(--card-pad, 16px); }
</style>
```

A single `--card-pad` property mutated via `style.setProperty` —
every `.card` on the page reflows instantly. Zero template engine,
zero diff, zero React.

For DESIGN.md tokens: the playground writes to `--vc-*` properties
directly. A "live accent picker" is:

```html
<input type="color" id="accent-picker" value="#b8861f">

<script>
  document.getElementById('accent-picker').addEventListener('input', function (ev) {
    document.documentElement.style.setProperty('--vc-color-accent', ev.target.value);
  });
</script>
```

Click the picker, drag the hue, watch the page's accent recolor in
real time — selection mark, focus ring, all category-ramp variables,
all `var(--vc-color-accent)` declarations. The engine's `applyTokens`
already established this is how live-restyle works; the playground
just exposes it to the reader.

## When to ship a playground

- as a "tune this design system" sandbox in design system docs;
- as a "preview before you commit" affordance before saving a tuned
  DESIGN.md;
- as a debugging tool for the author (does this color look right at
  +5% chroma?).

DON'T ship to end-readers of a reading-focused artifact (a report,
a slide deck) — the playground is for AUTHORING, not reading. The
contact sheet (which has the click-to-copy affordance but no
sliders) is the right read-only deliverable.

## Scaffold to emit

A full playground (illustrative — the toolbar may be sticky-top, on
a sticky right rail, or in a separate panel):

```html
<aside id="playground" class="vc-bg-surface-raised vc-p-3 vc-rounded-lg vc-shadow-2">
  <h3>Tune</h3>

  <label>
    Accent
    <input type="color" id="accent-picker" value="#b8861f">
  </label>

  <label>
    Card padding
    <input type="range" id="card-pad" min="12" max="32" value="20">
    <span id="card-pad-val">20px</span>
  </label>

  <label>
    Radius
    <select id="radius-style">
      <option value="0">none</option>
      <option value="4">sm</option>
      <option value="8" selected>md</option>
      <option value="12">lg</option>
      <option value="16">xl</option>
    </select>
  </label>
</aside>

<script>
  var root = document.documentElement;

  document.getElementById('accent-picker').addEventListener('input', function (ev) {
    root.style.setProperty('--vc-color-accent', ev.target.value);
  });

  document.getElementById('card-pad').addEventListener('input', function (ev) {
    root.style.setProperty('--card-pad', ev.target.value + 'px');
    document.getElementById('card-pad-val').textContent = ev.target.value + 'px';
  });

  document.getElementById('radius-style').addEventListener('change', function (ev) {
    root.style.setProperty('--vc-radius-md', ev.target.value + 'px');
  });
</script>
```

## The hover→snippet preview pattern (DM-22 reference)

The Anthropic `06-component-variants.html` demo goes further: hovering
any variant card copies its props into a JSX-shaped snippet panel
below. To replicate, encode the snippet template as a `data-snippet`
attribute:

```html
<div class="card" data-snippet='<Card padding="PAD" radius="RADIUS" />'>
  …
</div>

<pre id="snippet-preview"></pre>

<script>
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      var pad = document.getElementById('card-pad').value;
      var radius = document.getElementById('radius-style').value;
      var snippet = card.dataset.snippet
        .replace(/PAD/g, pad)
        .replace(/RADIUS/g, radius);
      document.getElementById('snippet-preview').textContent = snippet;
    });
  });
</script>
```

## Lib functions used

- (no JS function in the design-tokens lib — the playground is a
  pure DOM pattern)
- `window.__veDesignMd.hotSwap(text)` — the alternative when the
  playground writes to enough tokens that re-serializing the full
  DESIGN.md is cleaner than per-property mutations

## DESIGN.md tokens used

- writes (via `style.setProperty`): any `--vc-*` token the playground
  exposes — typically `--vc-color-accent`, `--vc-color-canvas`, one
  or two radii, occasionally a spacing token
- reads: the playground itself reads its own chrome from the page's
  loaded DESIGN.md, so the playground UI re-themes when the user
  swaps presets

## Anti-slop interaction

`style.setProperty('--vc-color-accent', userInput)` can introduce a
BANNED color if the user picks one. The playground SHOULD lint
post-mutation:

```js
document.getElementById('accent-picker').addEventListener('change', function (ev) {
  var report = amvcpTokens.lintTokenSet({ '--vc-color-accent': ev.target.value });
  if (!report.ok) {
    alert('That accent is on the anti-slop banned list: ' +
          report.violations[0].reason);
    ev.target.value = '#b8861f';  // revert
    root.style.setProperty('--vc-color-accent', '#b8861f');
  }
});
```

— or warn without reverting, depending on UX intent.

## Selection / comment / decision-mini contract

The playground's sliders / pickers / selects are standard form
controls — they participate in keyboard tab order. The reader can
tab through, adjust with arrow keys / number keys, and the live
preview updates per-input.

Selection inside the playground UI works normally; the playground
doesn't override `--vc-selection-bg`.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a playground
under `dev-browser`. Drive the controls:

```js
// Drive the accent picker:
await page.fill('#accent-picker', '#ff6600');
await page.waitForTimeout(50);
const accent = await page.evaluate(
  () => getComputedStyle(document.documentElement).getPropertyValue('--vc-color-accent').trim());
console.assert(accent === '#ff6600');

// Drive the radius select:
await page.selectOption('#radius-style', '0');
await page.waitForTimeout(50);
const radius = await page.evaluate(
  () => getComputedStyle(document.documentElement).getPropertyValue('--vc-radius-md').trim());
console.assert(radius === '0px');
```

Screenshot in **both themes** (R1) — the playground chrome re-themes
correctly, AND the artifact under tuning re-themes correctly when
the user mutates a token.
