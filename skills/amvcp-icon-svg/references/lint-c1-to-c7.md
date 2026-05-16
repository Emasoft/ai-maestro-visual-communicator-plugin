# The C1..C7 lint contract (lintSvg)

`lintSvg(svgString)` is the icon-svg style-contract checker enforced
on every compiled SVG. It's a pure function (Node-testable, no DOM),
returns `{ ok, violations: [{rule, detail, at}], autofixed: [{rule,
detail}] }`. The compiler runs it as a hard precondition before
emitting; a non-auto-fixable violation throws. Authored fenced blocks
get the same lint at runtime as a dev-console warning (never a throw
— a runtime throw would break the page).

## The 7 constraints

| ID | Rule | Auto-fix? | What it enforces |
|---|---|---|---|
| C1 | hairline stroke | NO | `stroke-width <= 2` in 1000-space (≈hairline at any rendered size) |
| C2 | radius cap | YES — clamp | `rx` / `ry` ≤ 36 in 1000-space (≈12px CSS at typical sizes — "no bubble shapes") |
| C3 | 4-unit grid | YES — snap | every coordinate snapped to a multiple of 4 |
| C4 | ≤ 4 token colors | NO | at most 4 DISTINCT token colors per scene (ink / paper / muted / accent budget) |
| C5 | no shadow / no blur | NO | no `<filter>` with `feDropShadow` / `feGaussianBlur`, no `filter: drop-shadow(…)` |
| C6 | no raw hex / named color | NO | every `fill` / `stroke` is a `var(--vc-*)` token, `currentColor`, or `none` |
| C7 | no mixed theming | NO | one scene is all-`currentColor` OR all-explicit-token, never both |

## Auto-fix vs throw — the boundary

The compiler does C2 (clamp) and C3 (snap) BEFORE emitting, so its own
output never trips them. These two are "auto-fixed silently" — a
`report.autofixed[]` entry records what was changed for dev-mode
introspection, but the build continues.

C1, C4, C5, C6, C7 are flag-only. A violation is a HARD throw — the
compiled SVG never ships. The author's scene-graph is invalid; the
build error tells them precisely what to fix.

## The `<mask>` exemption

A `<mask>` legitimately uses `#fff` / `#000` — those are the mask's
ALPHA-CHANNEL keying values (white = keep, black = cut), NOT theme
colors. So C4 / C6 / C7 SKIP any `fill` / `stroke` attribute that sits
inside a `<mask>...</mask>` span. C1 / C2 / C3 / C5 still apply
globally — a mask cannot smuggle a heavy stroke or a drop-shadow past
the linter.

The exemption is implemented via a `maskSpans(src)` pre-scan that
computes the `[start, end)` character offsets of every `<mask>` block;
attribute parses inside those offsets are tagged `colorExempt = true`
for the color checks. The icon-svg-spec records this carve-out
verbatim — see source comment block "C4 / C6 / C7 MUST skip fill /
stroke attributes inside a mask".

## The C4 semantic-role collapse

C4 caps the count of distinct token colors at 4 (`ink`, `paper`,
`muted`, `accent` — the four-color editorial budget). Two collapses
prevent legitimate-and-explicit color use from tripping the cap:

1. **color-mix derivatives** of `--vc-color-accent` collapse to the
   key `"accent"`. The three `--isvg-tint-*` custom properties are
   accent derivatives; they count as one color.
2. **The four semantic roles** (`success`, `warning`, `danger`,
   `info`) collapse to the SINGLE key `"semantic"`. A multi-variant
   scene that uses success + warning + danger + info is
   INFORMATION-BEARING (status colors), not a rainbow palette — the
   spec's C4 nuance says "related colors derived from one role count
   once". Without this, the explicitly-supported `variant` feature
   would self-trip C4.

C4 still catches a careless rainbow of ARBITRARY colors; it just no
longer punishes the semantic palette. The implementation is the
`colorKey(v)` helper in `amvcp-icon-svg.js`.

## The C7 mixed-theming check

A single SCENE must NOT mix `currentColor` and explicit `var(--vc-*)`
tokens. Either every fill / stroke is `currentColor` (the wrapper's
`color` drives the ink) OR every fill / stroke is an explicit token
(the DESIGN.md palette drives the ink) — never both in the same scene.

Why: the two coloring modes are mutually exclusive. `currentColor`
inherits from a CSS cascade chain ending at the wrapper's `color`
property; explicit tokens read from `:root` custom properties. Mixing
them in one mark means part of the mark re-tints on a wrapper `color`
change and part doesn't — visually broken, semantically confusing.

The fix: put a `current-color` logo in its OWN `<script type=
"application/icon-svg+json">` block, separate from the explicit-token
logos. The test fixture (`tests/fixtures/icon-svg-runtime.html`) does
exactly this — `scene-logo-c` is a dedicated figure for the
`current-color` mark, separate from `scene-logo-a` / `scene-logo-b`
that use explicit tokens.

## The 13-diagram-types NON-clause

The original IS-04 source listed "13 approved diagram types" (floor
plan, network rack, circuit, org chart, ER, data flow, sequence,
state machine, component, deployment, class, mind map, timeline) as
part of the editorial SVG rules. **icon-svg deliberately does NOT
enforce this clause**. Diagram-TYPE governance belongs to the
`diagram` skill, which owns the renderer dispatch. `lintSvg` has no
type allow-list — adding one would artificially cap diagram coverage.

This is recorded in the source as a `[CRITICAL SAFETY FLAG]` — a build
agent must NOT "helpfully" add a 13-type allow-list to `lintSvg`. The
spec is explicit: icon-svg owns the shape primitive lint; diagram
owns the diagram-type dispatch.

## Return shape

```js
var report = lintSvg(svgString);
report.ok           // boolean — true when violations[] is empty
report.violations   // Array<{rule, detail, at}>
report.autofixed    // Array<{rule, detail}>
```

Example failing report:

```js
{
  ok: false,
  violations: [
    { rule: 'C6', detail: 'raw color "#fff" on fill — every fill/stroke
      must be a var(--vc-…) token, currentColor, or none',
      at: 'fill="#fff"' },
    { rule: 'C1', detail: 'stroke-width 8 exceeds hairline cap 2',
      at: 'stroke-width="8"' }
  ],
  autofixed: []
}
```

Example passing report with one auto-fix:

```js
{
  ok: true,
  violations: [],
  autofixed: [
    { rule: 'C2', detail: 'clamped rx 64→36' }
  ]
}
```

## Calling lintSvg directly (Node / test harness)

The pure function is exposed via the dual export:

```js
// Browser
var report = window.amvcpIconSvg.lintSvg(svgString);

// Node
var amvcpIconSvg = require('/path/to/amvcp-icon-svg.js');
var report = amvcpIconSvg.lintSvg(svgString);
```

The same function backs the compiler precondition AND the runtime
dev-lint pass. Both paths consume the same `{ok, violations,
autofixed}` shape.

## Dev-mode lint

`devLint(root)` is called at the end of `init()`. It runs `lintSvg()`
against every `.isvg-scene` on the page (both compiler-emitted AND
author-pasted raw SVG) and emits a `console.warn('[icon-svg] lint
C6: …')` for each violation. Never throws (a runtime throw would
break the page). Skipped silently when `console` is absent.

So an author who hand-writes an `<svg class="isvg-scene">` with a
raw `#fff` fill gets a visible warning in the browser devtools, even
though they bypassed `buildSceneSvg()`. The compiler-only path is
fail-fast; the page-wide path is fail-soft.

## A worked example — every rule in one bad scene

```html
<svg viewBox="0 0 1000 1000" class="isvg-scene">
  <rect x="123" y="234" width="500" height="200"
        rx="80"
        fill="#fff"
        stroke="red"
        stroke-width="8"
        filter="drop-shadow(0 2px 4px black)"/>
  <circle cx="500" cy="500" r="100"
          fill="var(--vc-color-success)"
          stroke="currentColor"/>
</svg>
```

Lint report:

- C1 — `stroke-width 8 exceeds hairline cap 2`
- C2 — `clamped rx 80→36` (auto-fixed)
- C3 — `coordinate 123 snapped to 124, 234 snapped to 236` (auto-
  fixed — silent on the source)
- C4 — passes (only 2 distinct color keys: `"#fff"` plus the
  semantic-collapsed `success`)
- C5 — `drop shadow / blur filter present`
- C6 — `raw color "#fff" on fill`, `raw color "red" on stroke`
- C7 — `mark mixes currentColor and explicit --vc- tokens` (because
  the circle has both `var(--vc-color-success)` and `currentColor`)

The compiler would throw on the first non-auto-fixable rule.
`buildSceneSvg()` never EMITS this SVG (it builds clean output), so
this scenario is for an author-pasted `.isvg-scene` only.
