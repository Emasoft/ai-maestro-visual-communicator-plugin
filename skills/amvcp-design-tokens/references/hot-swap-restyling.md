# Hot-swap restyling — `window.__veDesignMd.hotSwap` (DM-25)

## Table of Contents

- [What it does](#what-it-does)
- [When to use](#when-to-use)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)
- [Overview](#overview)

## Overview

The runtime exposes `window.__veDesignMd.hotSwap(designMdText)` —
swap a different DESIGN.md text and the WHOLE page re-themes live: no
reload, no new mechanism. The mechanism is the engine's `parseDesignMd
→ resolveTokens → applyTokens` pipeline driven from a fresh source.
This document covers what `hotSwap` does, when to use it, and how to
combine it with presets and personality deltas.

## What it does

`window.__veDesignMd.hotSwap(text)` (provided by `amvcp-runtime.js`):

1. parses `text` via `parseDesignMd` (fail-fast — throws on a bad
   DESIGN.md);
2. resolves both light AND dark theme maps;
3. applies the active-theme map via `applyTokens` to
   `document.documentElement` (the engine's default `rootEl`);
4. fires a `ve-designmd-hotswapped` event so listening components
   re-render any DOM caches keyed off token values (chart svg paths,
   pre-baked sparklines, etc.).

The whole page re-themes instantly because every `--vc-*` token is
inheritable CSS custom property — changing them on `:root` updates
every descendant's `getComputedStyle` synchronously.

## When to use

- **Preset switching** — let the reader pick `factory-dark` /
  `parchment` / `editorial-crimson` from a dropdown; each pick is a
  one-line `hotSwap(amvcpTokens.PRESETS[name])`.
- **Personality tuning** — apply a delta and feed the result to
  `hotSwap` for a live preview before serializing back to a file.
- **Token-playground UI** — a slider that mutates one property of the
  parsed token tree, re-serializes, and `hotSwap`s — the entire
  artifact re-skins as the user drags.
- **Brand A/B testing** — toggle between two candidate DESIGN.mds for
  visual comparison without round-tripping through a save / reload.

DO NOT use to flip light↔dark — that's `window.__veDesignMd.toggleTheme()`
(which doesn't re-parse, just re-applies the OTHER theme of the
already-loaded DESIGN.md).

## Scaffold to emit

A live preset picker:

```html
<select id="preset-picker">
  <option value="heritage">Heritage</option>
  <option value="factory-dark">Factory Dark</option>
  <option value="parchment">Parchment</option>
  <option value="editorial-crimson">Editorial Crimson</option>
  <option value="trust-indigo">Trust Indigo</option>
  <!-- … other PRESETS keys -->
</select>

<script>
  document.getElementById('preset-picker').addEventListener('change', function (ev) {
    var preset = amvcpTokens.PRESETS[ev.target.value];
    if (preset) {
      window.__veDesignMd.hotSwap(preset);
    }
  });
</script>
```

A live-token playground (DM-22-related): a slider that mutates
accent chroma in real time:

```html
<input type="range" id="chroma" min="0.05" max="0.30" step="0.01" value="0.16">

<script>
  document.getElementById('chroma').addEventListener('input', function (ev) {
    // (illustrative — the actual playground would expose a debug-only
    // accent-chroma mutator; for production prefer applyPersonalityDelta)
    var base = amvcpTokens.PRESETS['heritage'];
    var parsed = amvcpDesignMd.parseDesignMd(base);
    // … mutate chroma via OKLCh shift on accent of both themes …
    var serialized = amvcpDesignMd.serializeDesignMd(parsed.designmd);
    window.__veDesignMd.hotSwap(serialized);
  });
</script>
```

## Lib functions used

- `window.__veDesignMd.hotSwap(text)` — runtime entry point (lives in
  `amvcp-runtime.js`, not `amvcp-tokens.js`)
- `window.__veDesignMd.toggleTheme()` — the light/dark flip companion
- `amvcpDesignMd.parseDesignMd` / `resolveTokens` / `applyTokens` —
  used internally; explicit calls reproduce the pipeline without the
  event dispatch
- `amvcpTokens.PRESETS` / `amvcpTokens.applyPersonalityDelta` — typical
  inputs to `hotSwap`

## DESIGN.md tokens used

- writes (via the engine's `applyTokens`): ALL `--vc-*` inline-style
  declarations on `document.documentElement`
- reads (from the input text): EVERY DESIGN.md group the engine knows

## Anti-slop interaction

`hotSwap` re-runs the parse → resolve → apply pipeline; the slop lint
is NOT automatically invoked. The agent should run
`amvcpTokens.lintTokenSet(text)` BEFORE feeding text to `hotSwap` to
catch banned accents / fonts:

```js
var candidate = amvcpTokens.applyPersonalityDelta(presetText, 'cooler');
var report = amvcpTokens.lintTokenSet(candidate);
if (!report.ok) {
  throw new Error('candidate flagged before hot-swap: ' +
    report.violations.map(v => v.reason).join('; '));
}
window.__veDesignMd.hotSwap(candidate);
```

Running the lint POST-swap (with `lintLiveDocument`) is also valid —
it walks the rendered DOM and flags computed colors / fonts that
slipped through.

## Selection / comment / decision-mini contract

A hot-swap fires WHILE the reader may be mid-selection / mid-comment.
The runtime's event (`ve-designmd-hotswapped`) lets comment-thread and
decision-mini components re-key their state — see
`scripts/amvcp-runtime.js` for the listener wiring. The selection
itself uses `--vc-selection-bg`, which simply re-resolves to the new
accent — visually the selection mark recolors mid-drag, which is the
correct behaviour (matches the new theme), not a glitch.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the page under
`dev-browser`, fire `hotSwap` with a contrasting preset, and confirm
**every visible element** re-theme'd in the same render frame:

```js
await page.evaluate((text) => {
  window.__veDesignMd.hotSwap(text);
}, alternatePresetText);
await page.waitForTimeout(50);   // a single frame; no extra delay needed
var screenshot = await page.screenshot({ fullPage: true });
```

Compare the before/after screenshots — they should look like two
different artifacts. If the body bg / accent / type pairing all
flipped but the contact-sheet swatches did NOT, the panel internals
are caching a hex value and need the `ve-designmd-hotswapped` listener
to re-render. That's an artifact bug — the design-tokens lib itself
re-themes correctly.
