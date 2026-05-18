# 25 — Blocks: `metric` + `callout` (the impact family)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [When to pick metric vs callout](#when-to-pick-metric-vs-callout)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

`metric` is the KPI card block — a big number + a small label +
optional delta. `callout` is the bordered annotation block in one of
four severity tints — info / tip / warning / danger.

Together they're the "look at THIS number" + "look out for THIS"
family. Metrics carry impact numbers; callouts carry warnings,
exceptions, and one-line "by the way" notes.

## What this is

### `metric` block

```jsonc
{ "type": "metric",
  "value": "38%",
  "label": "p99 cut",
  "delta": "−128 ms" }
```

Required: `value` (string or number), `label` (string).
Optional: `delta` (string).

Renders as:
```html
<div class="vsd-metric">
  <span class="vsd-metric-value">38%</span>
  <span class="vsd-metric-label">p99 cut</span>
  <span class="vsd-metric-delta">−128 ms</span>
</div>
```

The value is rendered as the big number (hero tier); the label below
it in mono uppercase; the optional delta as a trend annotation
(positive/negative coloured by direction).

### `callout` block

```jsonc
{ "type": "callout",
  "variant": "tip",
  "text": "All three rolled out behind a single feature flag." }
```

Required: `variant` (one of `info`, `tip`, `warning`, `danger`),
`text` (string).

Renders as:
```html
<div class="vsd-callout" data-vsd-variant="tip">
  All three rolled out behind a single feature flag.
</div>
```

The four variants:

| `variant` | Border + accent colour | When to use |
|---|---|---|
| `info` | Neutral blue (`--vc-color-info`) | Side note, FYI, context. |
| `tip` | Green (`--vc-color-success`) | Best practice, helpful tip, success. |
| `warning` | Amber (`--vc-color-warning`) | Caveat, "watch out for…", non-blocking risk. |
| `danger` | Red (`--vc-color-danger`) | Blocking risk, error, "if you do this, X breaks". |

The `CALLOUT_VARIANTS` map in the source confirms `tip` aliases to
the `success` semantic role; the other three map directly.

## Scaffold to emit

### Metric examples

Simple metric (value + label):

```jsonc
{ "type": "metric", "value": "247", "label": "PRs merged" }
```

Metric with delta:

```jsonc
{ "type": "metric", "value": "38%", "label": "p99 cut", "delta": "−128 ms" }
```

Multiple metrics for a `metrics` slide:

```jsonc
{ "type": "metric", "value": "38%", "label": "p99 cut",       "delta": "−128 ms" },
{ "type": "metric", "value": "78%", "label": "hit rate",      "delta": "+37 pp" },
{ "type": "metric", "value": "14",  "label": "features" },
{ "type": "metric", "value": "247", "label": "PRs merged" }
```

### Callout examples

Info (side note):

```jsonc
{ "type": "callout", "variant": "info",
  "text": "Numbers reflect the new tracing pipeline as of May 13." }
```

Tip (best practice):

```jsonc
{ "type": "callout", "variant": "tip",
  "text": "Set TTL via the per-key config — the global TTL is the fallback." }
```

Warning (caveat):

```jsonc
{ "type": "callout", "variant": "warning",
  "text": "The eviction loop fix requires a rolling restart of the cache pods." }
```

Danger (blocking risk):

```jsonc
{ "type": "callout", "variant": "danger",
  "text": "Do NOT enable per-key TTL on the legacy v1 cache — it has a known eviction bug." }
```

## Lib functions called

- `renderBlock(doc, block, ctx)` — dispatches.
- For `metric`: builds `.vsd-metric` with `.vsd-metric-value`,
  `.vsd-metric-label`, optional `.vsd-metric-delta` spans.
- For `callout`: builds `.vsd-callout` with `data-vsd-variant`
  attribute and the text as a child text node.
- `validateBlock(block, path)` rejects `metric` blocks missing
  `value` or `label`; rejects `callout` blocks with unknown
  `variant` or missing `text`.

## DESIGN.md tokens used

### `metric`

| Token | Default | What |
|---|---|---|
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Value text colour. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Label text colour. |
| `--vc-color-success` | `#788C5D` / `#3fb950` | Positive delta. |
| `--vc-color-danger` | `#b04a3f` / `#f85149` | Negative delta. |
| `--vc-font-heading` | `Georgia, serif` | Value typeface. |
| `--vc-font-mono` | `ui-monospace, monospace` | Label typeface. |
| `--vc-text-6` | `128 px` | Value size. |
| `--vc-text-1` | `20 px` | Label size. |
| `--vc-space-1` | `8 px` | Value-to-label gap. |

### `callout`

| Token | Default | What |
|---|---|---|
| `--vc-color-info` | `#3b82f6` / `#60a5fa` | Info variant. |
| `--vc-color-success` | `#788C5D` / `#3fb950` | Tip variant (aliased from `success`). |
| `--vc-color-warning` | `#f59e0b` / `#fb923c` | Warning variant. |
| `--vc-color-danger` | `#b04a3f` / `#f85149` | Danger variant. |
| `--vc-radius-card` | `12 px` | Border radius. |
| `--vc-space-3` | `24 px` | Padding. |
| `--vc-border-width-callout` | `4 px` | Left border thickness. |

Each variant uses `border-left: 4px solid var(--vc-color-${variant})`
for the colour stripe; the background uses `color-mix(in srgb,
var(--vc-color-${variant}) 8%, var(--vc-color-canvas))` for a tinted
surface.

## Selection / comment / decision-mini contract notes

Neither block carries its own `data-ve-id`. Both are part of the
slide's selectable atom.

## When to use this reference

Open this ref when:

- Authoring a `metrics` or `bento + stats` slide — metrics are the
  card type.
- Adding a one-line annotation to ANY slide — callouts work
  alongside any layout.
- Highlighting an exception, warning, or special-case note.

## When to pick metric vs callout

| Need | Pick |
|---|---|
| Numeric impact | `metric` |
| One-line note / annotation / caveat | `callout` |
| Multi-line explanation | (use `text` or split into a new slide) |
| Critical warning that must not be missed | `callout` with `variant: "danger"` |
| Success / best-practice tip | `callout` with `variant: "tip"` |
| FYI side note | `callout` with `variant: "info"` |

## Don'ts

- Don't put long values in `metric.value`. ≤ 6 characters fits at
  hero tier; longer overflows. The `autoFit()` safety net scales
  long values down, but the scaled-down reading breaks at
  projection distance.
- Don't omit `metric.label`. The big number alone is ambiguous;
  `38%` could be anything.
- Don't put more than one callout on a slide. Two callouts compete
  for attention; the second one reads as "and another thing", which
  signals the slide is overpacked.
- Don't pick `danger` casually. The danger variant is loud (red,
  attention-grabbing); reserve it for actually-dangerous warnings.
  Casual `danger` callouts dilute the signal.
- Don't author markdown / HTML in `metric.value`, `metric.label`,
  `metric.delta`, or `callout.text`. The renderer escapes
  everything; markdown shows as literal.

## Visual verification

After authoring metric / callout blocks, capture light + dark at
1280×720 via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. Metric values are at hero tier (128 px); no value overflows.
2. Metric labels are mono / uppercase / small / muted.
3. Metric deltas (if present) are coloured by direction (green for
   positive / red for negative).
4. Callout has a coloured left border in the variant's colour.
5. Callout text reads at projection distance.

## Source provenance

- The metric value + label structure is the converged "KPI hero
  card" pattern from `slide-patterns.md` lines 822-875.
- The 4-variant callout palette (info / tip / warning / danger) is
  the slide-spec's `CALLOUT_VARIANTS` map, lifted from the
  consolidated design-tokens semantic-color set (DT-19).
- The delta direction colouring (success / danger) is the same
  semantic mapping used by `amvcp-tables`'s up/down delta cells.
