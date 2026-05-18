# Output QA pipeline — the 7 gates of `runGates`

## Table of Contents

- [When to run the QA pipeline](#when-to-run-the-qa-pipeline)
- [The 7 gates](#the-7-gates)
- [Calling the pipeline](#calling-the-pipeline)
- [Gate output shape](#gate-output-shape)
- [The loop-detection (failedTwice)](#the-loop-detection-failedtwice)
- [DESIGN.md tokens consumed (by Gate 2)](#designmd-tokens-consumed-by-gate-2)
- [Banned lists (Gates 6 + 7)](#banned-lists-gates-6--7)
- [Lib API surface](#lib-api-surface)
- [Visual verification](#visual-verification)
- [Anti-patterns](#anti-patterns)

The non-element capability that closes the plugin's "rules stated but
never verified" loop. `amvcpReportDoc.runGates(document, pageId)`
runs 7 checks against any rendered HTML page and returns a structured
report. Originally derived from master catalog OT-02 (10-gate quality
pipeline) + OT-06 (AI-slop verifier), trimmed to the 7 actually-
implementable gates.

This is **the only QA infrastructure the plugin ships**. Every other
visual-correctness rule (no nested scrollbars, WCAG AA contrast,
prefers-reduced-motion, print CSS, semantic HTML, banned-color,
banned-font) is reduced to a gate that this pipeline runs.

## When to run the QA pipeline

| Run it | Skip it |
|---|---|
| Before handing a generated page back to the user | Per-keystroke during authoring (too noisy) |
| Before publishing a page to a wider audience | Pure scratch / never-shared output |
| As part of a CI / pre-commit step on saved HTML | Live edit cycles |
| Whenever the DESIGN.md changes (re-validate consumers) | Read-only consumer of someone else's HTML |
| When the page produces unexpected output | When the page works fine and you're done |

The pipeline is fast (≤200ms on a typical 30-section document); there
is no reason to skip it on a finished output.

## The 7 gates

| # | ID | Priority | Checks |
|---|---|---|---|
| 1 | `no-nested-scrollbars` | P1 | No inner `overflow: auto` / `overflow: scroll` boxes — the document expands |
| 2 | `wcag-contrast` | P1 | Every active foreground/background pair against WCAG AA (4.5:1 normal, 3.0:1 large) |
| 3 | `reduced-motion` | P1 | Page has at least one `@media (prefers-reduced-motion: reduce)` rule if any animation or transition is present |
| 4 | `print-css` | P1 | Page has at least one `@media print` rule (the print stylesheet ships in `vc-doc`'s injected CSS by default) |
| 5 | `semantic-html` | P2 | Page uses real `<article>`, `<section>`, `<header>`, `<aside>`, `<nav>`, etc. — not div-soup |
| 6 | `banned-color` | P1 | No banned colors (purple/violet/indigo family, pure `#000000` / `#ffffff` as DESIGN colors) |
| 7 | `banned-font` | P1 | No banned fonts as the FIRST family of `--vc-font-heading` / `--vc-font-body` (Inter, Roboto, Open Sans, Lato, Nunito) |

P1 gates can flip `report.ok` to `false`. P2 gates emit FAIL/WARN but
do not flip `ok`.

## Calling the pipeline

### DOM mode (browser, definitive)

```js
const report = window.amvcpReportDoc.runGates(document, "page-id-2026-05-16");
// report = {
//   ok: true,             // false if any P1 gate FAILed
//   mode: "dom",
//   pageId: "page-id-...",
//   gates: [
//     { id: "no-nested-scrollbars", priority: "P1", status: "PASS",
//       detail: "...", fixHint: null },
//     { id: "wcag-contrast",       priority: "P1", status: "PASS", ... },
//     ...
//   ],
//   loop: { gate: null, failedTwice: false }
// }
```

DOM mode reads computed styles via `getComputedStyle`. Verdicts are
definitive — what the gate sees is what the user sees.

### Static mode (Node CLI, advisory)

```js
const fs = require('fs');
const reportDoc = require('./scripts/amvcp-report-doc.js');
const html = fs.readFileSync('output.html', 'utf-8');
const report = reportDoc.runGatesOnHtml(html, "build-1234");
```

Static mode parses the HTML string. Verdicts are advisory — some
gates degrade to WARN because computed-style information is not
available.

| Gate | DOM mode | Static mode |
|---|---|---|
| `no-nested-scrollbars` | Definitive | Advisory (regex over `<style>` tags) |
| `wcag-contrast` | Definitive | Advisory (parses embedded DESIGN.md if present) |
| `reduced-motion` | Definitive | Definitive (textual search of CSS rules) |
| `print-css` | Definitive | Definitive (textual search) |
| `semantic-html` | Definitive | Advisory (counts `<div>` vs semantic tags) |
| `banned-color` | Definitive | Advisory (parses DESIGN.md tokens) |
| `banned-font` | Definitive | Advisory (parses DESIGN.md tokens) |

Use static mode in CI on saved HTML; use DOM mode in the browser
before serving.

## Gate output shape

Each gate returns:

```js
{
  id: "wcag-contrast",
  priority: "P1",
  status: "PASS" | "FAIL" | "WARN" | "SKIP",
  detail: "Checked 8 active text/bg pairs; all >= 4.5:1.",
  fixHint: null | "Increase --vc-color-content-muted brightness from #5b5343 to at least #4a4438 to meet WCAG normal-text 4.5:1 against --vc-color-canvas (#faf6ee)."
}
```

`fixHint` is the single most useful field — it tells the agent
exactly what to change.

| Status | Meaning |
|---|---|
| `PASS` | Gate passed; nothing to do |
| `FAIL` | Gate failed; `fixHint` describes the fix |
| `WARN` | Static-mode degradation; re-run in DOM mode for definitive |
| `SKIP` | Gate didn't apply (e.g. no animation present so reduced-motion doesn't apply) |

## The loop-detection (failedTwice)

`report.loop.failedTwice` becomes `true` on the *second consecutive
fail* of the same gate for the same `pageId`. When `failedTwice` is
`true`, do NOT auto-retry — escalate to a human.

```js
const report = window.amvcpReportDoc.runGates(document, "report-2026-05-16");
if (!report.ok && report.loop.failedTwice) {
  // The agent has already tried to fix this once and failed again.
  // Stop, write a report, hand back to the user.
  console.error("QA gate failed twice; escalating");
  return;
}
if (!report.ok) {
  applyFixHints(report.gates.filter(g => g.status === "FAIL"));
  // …re-render the page…
  // …call runGates again with the SAME pageId…
}
```

The `pageId` is the loop key — passing different `pageId`s defeats
the loop detection. Every QA session for the same conceptual page
must use the same `pageId`.

To clear loop state (for example, between unrelated runs):

```js
window.amvcpReportDoc.resetLoopState();
```

## DESIGN.md tokens consumed (by Gate 2)

Gate 2 (`wcag-contrast`) reads the `--vc-color-*` token surface and
checks every pairing the document actually uses. The canonical
pairings:

| Foreground role | Background role | Min ratio |
|---|---|---|
| `--vc-color-content` | `--vc-color-canvas` | 4.5:1 |
| `--vc-color-content` | `--vc-color-surface` | 4.5:1 |
| `--vc-color-content` | `--vc-color-surface-raised` | 4.5:1 |
| `--vc-color-content-muted` | `--vc-color-canvas` | 4.5:1 |
| `--vc-color-content-muted` | `--vc-color-surface` | 4.5:1 |
| `--vc-color-content-subtle` | `--vc-color-canvas` | 3.0:1 (large text only) |
| `--vc-color-on-accent` | `--vc-color-accent` | 4.5:1 |
| `--vc-color-accent` | `--vc-color-canvas` | 3.0:1 (large text only) |
| `--vc-color-success` | `--vc-color-canvas` | 3.0:1 (large text only) |
| `--vc-color-warning` | `--vc-color-canvas` | 3.0:1 (large text only) |
| `--vc-color-danger` | `--vc-color-canvas` | 3.0:1 (large text only) |
| `--vc-color-info` | `--vc-color-canvas` | 3.0:1 (large text only) |

In DOM mode, only pairings the document actually uses are checked. In
static mode, all pairings are checked unconditionally.

## Banned lists (Gates 6 + 7)

The runtime delegates to `window.amvcpTokens` (the `design-tokens`
skill) when present. When unavailable, fallback constants are used
and a `console.warn` is emitted.

### Banned colors (Gate 6)

- Hue range 255-320° on the HSL hue circle (purple / violet / indigo
  family) — but only when the color has meaningful saturation. A
  near-grey of any hue is fine.
- Pure black `#000000` / `#000` and pure white `#ffffff` / `#fff` as
  DESIGN colors. Print-block hardcoded `#000000` / `#ffffff` are
  exempt — Gate 6 only checks `--vc-color-*` role values.

### Banned fonts (Gate 7)

- Inter
- Roboto
- Open Sans
- Lato
- Nunito

A font is banned ONLY when it appears as the FIRST family in a
`--vc-font-heading` / `--vc-font-body` stack. Inter as a fallback
later in the stack is fine.

## Lib API surface

```js
window.amvcpReportDoc.runGates(documentOrRoot, pageId)
window.amvcpReportDoc.runGatesOnHtml(htmlText, pageId)
window.amvcpReportDoc.resetLoopState()
window.amvcpReportDoc.contrastRatio(colorA, colorB)
```

`contrastRatio()` is exposed for ad-hoc use:

```js
const ratio = window.amvcpReportDoc.contrastRatio('#1f1a14', '#faf6ee');
// 14.62
```

## Visual verification

QA gate output is JSON; for the *visual* verification of a page
(does it actually look right in light + dark?), see
`skills/amvcp-self-debug-rules/SKILL.md` — that skill describes the
dev-browser screenshot workflow.

## Anti-patterns

- **Calling `runGates` with no `pageId`** — loop detection is
  defeated; the same gate can fail forever without escalation.
- **Calling `runGates` with a different `pageId` on every retry** —
  same problem; you've reset the loop counter.
- **Treating `ok: true` as "the page is correct"** — `ok` only
  covers P1 gates. P2 gates can FAIL while `ok` is `true`. Read
  `report.gates` directly.
- **Silently swallowing `failedTwice`** — the whole point is
  escalation. Logging without acting on it makes the loop worse.
- **Running QA in static mode and treating results as definitive**
  — static mode is advisory. Re-run in DOM mode before publishing.
- **Disabling Gate 6 / Gate 7 because "the project uses Inter
  intentionally"** — the gates exist because Inter / Roboto /
  Open Sans are AI-slop fingerprints. If you really want Inter, set
  it as the SECOND family in the stack (`var(--vc-font-body, Inter,
  sans-serif)`); Gate 7 only flags first-position banned fonts.
- **Running QA after auto-fix without re-rendering** — fixes need
  to apply to the rendered DOM. Apply the fix, regenerate the
  page, then call `runGates` again.
- **Custom gates inside the runtime** — extend by writing a sibling
  helper that takes the same shape `{ id, priority, status, detail,
  fixHint }`. Do not modify `amvcp-report-doc.js`'s gate set
  directly.
- **Treating WARN as FAIL** — WARNs are static-mode degradations;
  re-run in DOM mode. Treating WARN as a hard failure causes false
  positives.
- **No QA at all** — every page handed back to the user MUST go
  through the pipeline. The pipeline is the difference between "I
  hope it works" and "I verified it works".
