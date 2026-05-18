# Quality rubric (`vc-rubric`) — scored matrix block

## Table of Contents

- [When to use](#when-to-use)
- [Scaffold (canonical /20 rubric)](#scaffold-canonical-20-rubric)
- [CSS (already injected by the runtime)](#css-already-injected-by-the-runtime)
- [Custom rubric scales](#custom-rubric-scales)
- [Runtime auto-sum (optional)](#runtime-auto-sum-optional)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

A generic N-row × scored-cells table for evaluating something against a
set of criteria. Each row is a dimension; each cell is a score in a
fixed range (typically 0-4); the footer auto-sums to a total. Lifted
from master catalog RD-05 (5-Dimension Quality Rubric scored /20) but
generalized — the same primitive works for design reviews, code
reviews, vendor evaluations, candidate scorecards, and any other
multi-dimension scoring exercise.

The rubric block has no JavaScript dependency — totals can be
hardcoded by the author, OR the runtime can compute them client-side
from `data-vc-score` attributes (the runtime's `vc-rubric-sum` helper
walks the table and updates the `<tfoot>`).

## When to use

| Use a rubric | Use something else |
|---|---|
| You are scoring something against ≥3 dimensions | Single-dimension score → a callout |
| Each dimension has a clear 0-N descriptor for each level | Subjective "vibes" rating → a prose paragraph |
| You want the total visible at the bottom | You don't want to commit to a total → a comparison table |
| The dimensions are independent (orthogonal) | Dimensions interact → a 2-axis chart |
| The reader will scan dimension rows in order | Random-access reference → a `<dl>` |

## Scaffold (canonical /20 rubric)

```html
<table class="vc-rubric">
  <caption>Design review — onboarding hero, variant A</caption>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>Score</th>
      <th>What good looks like</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Visual hierarchy</strong>
        <small>(does the eye land on the right thing first?)</small></td>
      <td class="vc-rubric-score" data-vc-score="3">3 / 4</td>
      <td>The hero number anchors the eye; the CTA is the next stop.
        Loses 1 because the eyebrow competes with the hero.</td>
    </tr>
    <tr>
      <td><strong>Color &amp; contrast</strong>
        <small>(WCAG AA / palette discipline)</small></td>
      <td class="vc-rubric-score" data-vc-score="4">4 / 4</td>
      <td>WCAG AA passes for every text/bg pairing; only 2 accent
        colors used.</td>
    </tr>
    <tr>
      <td><strong>Typography</strong>
        <small>(scale, rhythm, ≤3 typefaces)</small></td>
      <td class="vc-rubric-score" data-vc-score="3">3 / 4</td>
      <td>Heading scale jumps two steps in one place; consider an
        intermediate step.</td>
    </tr>
    <tr>
      <td><strong>Interaction</strong>
        <small>(hover / focus / reduced-motion)</small></td>
      <td class="vc-rubric-score" data-vc-score="3">3 / 4</td>
      <td>Hover states present; focus-visible needs more contrast.
        Reduced-motion respected.</td>
    </tr>
    <tr>
      <td><strong>Information architecture</strong>
        <small>(progressive disclosure, no orphans)</small></td>
      <td class="vc-rubric-score" data-vc-score="4">4 / 4</td>
      <td>Three-step flow with no dead ends.</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th>Total</th>
      <td class="vc-rubric-total" data-vc-total>17 / 20</td>
      <td><em>Strong; ship after addressing the eyebrow-vs-hero balance
          and focus contrast.</em></td>
    </tr>
  </tfoot>
</table>
```

## CSS (already injected by the runtime)

```css
.vc-rubric {
  width: 100%;
  border-collapse: collapse;
  margin-block: var(--vc-space-5, 32px);
}
.vc-rubric caption {
  caption-side: top;
  text-align: start;
  font-weight: var(--vc-weight-bold, 700);
  margin-block-end: var(--vc-space-2, 8px);
}
.vc-rubric th, .vc-rubric td {
  border: 1px solid var(--vc-color-border, #e3dcc9);
  padding: var(--vc-space-2, 8px) var(--vc-space-3, 12px);
  text-align: start;
}
.vc-rubric thead th {
  background: var(--vc-color-surface-sunken, #f1ece0);
}
.vc-rubric-score, .vc-rubric-total {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-feature-settings: "tnum";
  text-align: end;
}
.vc-rubric tfoot th, .vc-rubric tfoot td {
  font-weight: var(--vc-weight-bold, 700);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 10%, transparent);
}
```

The total cell gets a tinted background using the accent role; the
tint stays subtle (10%) so it does not compete with the body.

## Custom rubric scales

The default scaffold uses 0-4 scoring; the primitive supports any
scale. Common variants:

| Scale | When | Total cell |
|---|---|---|
| `/4` per row → total `/N×4` | General quality rubric | "17 / 20" |
| `/10` per row → total `/N×10` | High-resolution scoring (vendor eval) | "82 / 100" |
| `pass/fail` per row → "N passed of M" | Binary acceptance criteria | "4 of 5 passed" |
| `low/med/high` per row | Risk assessment | "2 high, 1 med, 0 low" |

For non-numeric scales, omit `data-vc-score` and write the cell text
directly. The runtime's auto-sum helper only fires when scores are
numeric.

## Runtime auto-sum (optional)

If the author wants the total computed automatically:

```js
// Walk every .vc-rubric, sum data-vc-score values, fill [data-vc-total]
document.querySelectorAll('.vc-rubric').forEach(table => {
  const scores = Array.from(table.querySelectorAll('[data-vc-score]'))
                       .map(el => Number(el.dataset.vcScore))
                       .filter(n => isFinite(n));
  const total = scores.reduce((a, b) => a + b, 0);
  const max   = scores.length * 4;  // assumes /4 scale; override per page
  const out   = table.querySelector('[data-vc-total]');
  if (out) out.textContent = `${total} / ${max}`;
});
```

When the score range varies (e.g. one rubric is /4 and another is
/10 on the same page), set `data-vc-max` per `data-vc-score` cell:

```html
<td class="vc-rubric-score" data-vc-score="8" data-vc-max="10">8 / 10</td>
```

The helper then sums `data-vc-max` for the total denominator.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-border` | Cell borders |
| `--vc-color-surface-sunken` | thead background |
| `--vc-color-accent` | Footer total background tint (10%) |
| `--vc-font-mono` | Score + total cells (with tabular-nums feature) |
| `--vc-space-2` / `--vc-space-3` / `--vc-space-5` | Padding + margin |
| `--vc-weight-bold` | Footer weight |

The mono font + tabular-nums (`font-feature-settings: "tnum"`) keeps
score columns aligned when scores have different digit counts.

## Composition with other skills

The rubric is a stand-alone primitive — embed it inside any document
shape:

| Containing shape | Typical placement |
|---|---|
| `pr-review-reviewer-side-shape` | After the risk-map chips, before the per-file diffs |
| `visual-design-exploration-shape` | At the end, as the cross-cutting tradeoff table |
| `feature-explainer-shape` | In a Gotchas section as "compliance against acceptance criteria" |
| `whitepaper-shape` | As an Appendix / Compliance section |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);   // ships the .vc-rubric CSS
// Auto-sum (not built into the lib; bring your own 10-line helper above)
const report = window.amvcpReportDoc.runGates(document, "rubric-design-review-01");
```

The lib does not currently expose a `sumRubric()` helper; this is a
known gap. For now author scripts wire the sum themselves.

## Selection / comment notes

- Each rubric row is selectable
  (`{type:"rubric-row", dimension:"Visual hierarchy"}`) so a reviewer
  can comment "the score is too low".
- The rubric caption is selectable as a unit — useful for "rename
  this rubric" comments.
- Each score cell is selectable independently —
  `{type:"rubric-score", dimension:"Typography", score:"3"}`.
- The total cell is selectable — readers can comment on the bottom
  line directly.

## Decision-mini hook

The total cell is a natural host for a ship/no-ship decision-mini:

```html
<tfoot>
  <tr>
    <th>Total</th>
    <td class="vc-rubric-total">17 / 20</td>
    <td>
      <div class="ve-decision" data-decision-id="rubric-ship-onboarding">
        <button data-choice="ship">Ship at 17/20</button>
        <button data-choice="iterate">Iterate to 19+</button>
        <button data-choice="reject">Reject — rework</button>
      </div>
    </td>
  </tr>
</tfoot>
```

## Anti-patterns

- **Rubric with 1-2 rows** — at that count, a callout is clearer. The
  rubric primitive pays off at 3+ dimensions.
- **Rubric with 10+ rows** — the reader stops scoring after row 5.
  Split into multiple rubrics with different totals.
- **A "Weighted total" row** — readers misread weighted totals. If
  dimensions deserve different weights, write the weights in the
  per-dimension row description, not as a footer trick.
- **Score cells without descriptive text** — a bare "3 / 4" gives the
  reader no way to argue. Always include the *why* in the third
  column.
- **Identical score across all rows** — if every row is "4 / 4", the
  rubric has no information content; either the criteria are wrong
  or you are inflating. Push back.
- **Subjective dimensions ("Vibes")** — every dimension MUST have a
  clear "what good looks like" descriptor. If you cannot describe
  what 4/4 looks like, the dimension is wrong.
- **Total with no max** — "17" alone is meaningless; always write
  "17 / 20".
- **Hardcoded total that drifts from the row sum** — use the auto-sum
  or audit before publishing. A summed-wrong rubric undermines the
  whole document.
