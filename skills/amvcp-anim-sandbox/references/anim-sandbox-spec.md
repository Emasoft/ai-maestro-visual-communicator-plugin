# Animation sandbox — spec, atom contract, and export wire format

## Table of contents

- [API](#api)
- [The declarative spec](#the-declarative-spec)
- [The fenced `anim-sandbox` block](#the-fenced-anim-sandbox-block)
- [Easing presets](#easing-presets)
- [The selection atom contract](#the-selection-atom-contract)
- [The export contract (window.veSelection)](#the-export-contract-windowveselection)
- [Reduced-motion behaviour](#reduced-motion-behaviour)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [No nested scrollbars](#no-nested-scrollbars)
- [Self-contained output](#self-contained-output)

## API

`amvcp-anim-sandbox.js` is a dependency-free dual-export (browser global
`window.amvcpAnimSandbox` + Node `module.exports`). ES5-safe `var` /
function declarations — no arrow functions, no template literals, no
classes, no build step, no npm deps (style matches
`scripts/amvcp-component-variants.js`).

| Function | Returns | Purpose |
|---|---|---|
| `parseSandboxSpec(text)` | `{ ok, spec, errors }` | Parse a fenced (or bare) `anim-sandbox` block into a spec object. Always `ok:true` unless the input is empty (sane defaults fill every optional field); `errors[]` collects soft warnings (unknown keys, unknown easing names). |
| `renderSandbox(spec, opts)` | `HTMLElement` | Build the sandbox root (caption + stage atom + duration slider + easing `<select>` + Replay + Export). Throws only if `spec` is not an object. |
| `mountSandbox(spec, container, opts)` | `HTMLElement` | `renderSandbox` then append to `container`. |
| `mountAll(root)` | `number` | Scan `root` (default `document`) for every `[data-ve-anim-sandbox]` carrying a fenced spec, render each in place, return the count. Idempotent — a host already rendered is skipped. |
| `EASING_PRESETS` | object | The preset table (read-only reference). |

The module **auto-inits** on `DOMContentLoaded` (or immediately if the
DOM is already parsed), calling `mountAll(document)`. A page that wants
manual control sets `window.__veAnimSandboxManual = true` before loading
the script and calls `mountAll` itself.

## The declarative spec

The author writes ONE container with a fenced spec; `mountAll` renders it
in place:

```html
<div class="ve-anim-sandbox" data-ve-anim-sandbox id="sandbox-card">
```anim-sandbox
demo: A card sliding up and fading in (transform + opacity)
property: transform, opacity
from: translateY(28px); opacity:0
to: translateY(0); opacity:1
duration: 420
easings: standard, decel, accel, spring, linear, ease-in-out
```
</div>
```

The `id` on the container becomes the atom id suffix
(`anim-sandbox:<id>`) and the export id; omit it and a stable
auto-incrementing id is minted.

## The fenced `anim-sandbox` block

A tiny `key: value` list (one per line). It is **not** YAML — the value
side may contain its own colons (`opacity:0`), so the parser splits on
the FIRST colon only and takes the value verbatim.

| Key | Meaning | Default |
|---|---|---|
| `demo` | Caption describing the transition (shown above the stage). | `""` |
| `property` | The `transition-property` value to animate. | `transform, opacity` |
| `from` | CSS-declaration fragment for the START state (snapped to with no transition before each run). | `translateY(24px); opacity:0` |
| `to` | CSS-declaration fragment for the END state (tweened to with the tuned transition). | `translateY(0); opacity:1` |
| `duration` | Initial duration in ms (seeds the slider; clamped 0–2000). | `420` |
| `easings` | Comma list of preset names offered in the `<select>` (first becomes the default). | `standard, decel, accel, spring, linear` |
| `id` | Override the atom/export id. | container's `id` attr |

`from` / `to` accept either `prop: value` declarations (`opacity:0`) or a
bare transform function list (`translateY(0)` → applied as
`transform`). Multiple declarations are `;`-separated.

## Easing presets

The picker offers the **five canonical DESIGN.md curves** (see
[`amvcp-anim-foundation/references/easing-curves.md`](../../amvcp-anim-foundation/references/easing-curves.md))
plus the stock CSS keywords. Each preset resolves its timing-function
through a `--vc-easing-*` token FIRST (so a DESIGN.md re-tune flows
through live), falling back to the literal cubic-bezier when no engine /
token is present. The EXPORTED `easingValue` is the resolved concrete
timing-function (paste-ready), not a `var()` wrapper.

| name | `--vc-easing-*` token | fallback cubic-bezier | semantic |
|---|---|---|---|
| `standard` | `--vc-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | symmetric state change |
| `decel` | `--vc-easing-decel` | `cubic-bezier(0, 0, 0, 1)` | arrival / entrance |
| `accel` | `--vc-easing-accel` | `cubic-bezier(0.3, 0, 1, 1)` | departure / exit |
| `spring` | `--vc-easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | playful overshoot |
| `linear` | `--vc-easing-linear` | `linear` | continuous loops |
| `ease` / `ease-in` / `ease-out` / `ease-in-out` | — | the keyword itself | stock CSS keywords |

## The selection atom contract

The **stage** (`.ve-anim-sandbox__stage`) is the ONE selection atom:

```html
<div class="ve-anim-sandbox__stage"
     data-ve-id="anim-sandbox:<id>"
     data-ve-type="anim-tuning"
     data-ve-label="Animation sandbox — <demo>"> … </div>
```

The runtime (`amvcp-runtime.js`) supplies selection · highlight ·
triple-state feedback (normal / hover / selected) · the comment-box with
**zero code** in this module — it injects NO selection / hover /
highlight CSS, and adds NO foreign selection / drag / export paradigm
(FIXED Interaction-Design Mode, project CLAUDE.md §4). The CONTROLS
(`<input type=range>`, `<select>`, the two `<button>`s) are interactive
controls the runtime explicitly skips, so they never become atoms and
never fight the browser's defaults.

## The export contract (window.veSelection)

"Export values" rides the EXISTING selection channel — it calls
`window.veToggle(payload)` (exposed by the runtime), which appends one
`kind:"element"` entry to `window.veSelection` (the same array the agent
reads back on submit). No bespoke export wire is invented.

```json
{
  "kind": "element",
  "id": "anim-sandbox:<id>",
  "type": "anim-tuning",
  "label": "Animation tuning — 640ms / decel",
  "data": {
    "kind": "anim-tuning",
    "duration": 640,
    "durationCss": "640ms",
    "easing": "decel",
    "easingValue": "cubic-bezier(0, 0, 0, 1)",
    "property": "transform, opacity",
    "from": "translateY(28px); opacity:0",
    "to": "translateY(0); opacity:1"
  }
}
```

Re-exporting toggles the entry (the runtime's `veToggle` is a toggle on
the entry id), so the agent reads the LATEST tuned values from the submit
payload. When the runtime is absent (a `file://` page with no runner),
the export still stamps `data-ve-exported="1"` on the stage and records
`stage.__lastExport`, so a standalone harness can observe it.

The agent receiving an `anim-tuning` entry applies the tuned
`transition-duration` / `transition-timing-function` to the real element
the user was tuning (or pastes the `easingValue` + `durationCss` into the
relevant `amvcp-anim-*` skill's CSS).

## Reduced-motion behaviour

The controls ALWAYS render under `prefers-reduced-motion: reduce` — the
author can still dial in and EXPORT values without a single preview. The
substitute (per
[`amvcp-anim-foundation/references/reduced-motion-gate.md`](../../amvcp-anim-foundation/references/reduced-motion-gate.md):
substitute, never silently disable) for "auto-preview the transition on
every slider keystroke" is "preview only on an EXPLICIT Replay". Under
`reduce`:

- slider `input` and easing `change` update the tuned values + read-out
  but do NOT auto-run the transition;
- the Replay button DOES run it (the user explicitly asked);
- the root carries `data-ve-reduced="1"` so a page that wants a hard gate
  can target it (the module never sets `transition: none` itself).

## DESIGN.md tokens used

Every colour, radius, and font is read via `var(--vc-…, fallback)`:
`--vc-color-canvas` / `surface` / `surface-raised` / `surface-sunken` /
`content` / `content-muted` / `content-subtle` / `border` /
`border-strong` / `accent` / `on-accent`; `--vc-radius-sm` / `md` / `lg`;
`--vc-font-body` / `heading` / `mono`; and the `--vc-easing-*` motion
tokens for the presets. A `data-ve-theme` flip (or DESIGN.md hot-swap)
re-themes the whole sandbox live — light + dark both, no hardcoded
palette.

## No nested scrollbars

The stage and read-outs use `overflow: visible`; no element gets
`max-height` + `overflow: auto`. The controls are a wrapping flexbox.
Wide content extends the document's single scroll axis (the
no-nested-scrollbars rule).

## Self-contained output

The output is one `<div class="ve-anim-sandbox" data-ve-type="…">` plus
the module's single scoped stylesheet (`#vc-anim-sandbox-style`, injected
once). Inline the runtime + module for true single-file portability when
sharing via `/amvcp-share-page`.
