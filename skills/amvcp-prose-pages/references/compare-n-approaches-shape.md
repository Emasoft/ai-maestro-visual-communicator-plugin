# Compare-N-approaches shape — prompt + N columns + Pro/Con + recommendation

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The N-column grid](#the-n-column-grid)
- [The Pro/Con sub-grid](#the-procon-sub-grid)
- [The metric-chip strip](#the-metric-chip-strip)
- [The recommendation card (clay left-border)](#the-recommendation-card-clay-left-border)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The document that compares 2-4 ways of solving the same problem.
Canonical reference: `html-effectiveness` demo #01,
"exploration-code-approaches" — compares three implementations of
"debounced search" side-by-side. Use this shape for technology
selection, library evaluation, design trade-off studies, or any
"which one should we pick" decision that benefits from a structured
side-by-side.

The shape's strength is **forcing symmetric analysis**: each approach
gets exactly the same sections (title → code → pro/con → metric chips)
so the reader can compare apples-to-apples. The asymmetric
recommendation card at the bottom is the reward for fair-minded
analysis — it lands harder because the author has earned the verdict.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| 2-4 approaches to the same well-defined problem | Single approach with discussion → `pr-writeup-author-side-shape` |
| Each approach has a working code sample / config / proof-of-concept | Theoretical comparison without code → `concept-explainer-shape` |
| You want symmetric Pro/Con + measurable metrics | Open exploration without verdict → `visual-design-exploration-shape` |
| The decision will become a single chosen path | Multi-path decision (e.g. "use both") → `architecture-explainer-shape` |
| You will recommend ONE approach at the end | All-options-are-equal "appendix" → `feature-explainer-shape` |

## Section order (fixed)

```
1. PROMPT BOX          — the exact framing of the question being answered
2. N-COLUMN GRID       — one column per approach, symmetric structure
3. RECOMMENDATION CARD — clay-left-border verdict at the bottom
4. PROVENANCE FOOTER   — author + sources + generated-at
```

Each column in section 2 has a fixed sub-structure:

```
[numbered badge]
[approach title (h3)]
[1-line description]
[code panel — same depth across columns]
[Pro/Con sub-grid — same count of pros/cons across columns]
[metric chip strip — same metrics across columns]
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--proposal" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">Comparison · debounced search</p>
  <h1>Three ways to debounce a search input</h1>
</header>

<!-- 1. Prompt box -->
<aside class="vc-prompt">
  <p class="vc-prompt-label">PROMPT</p>
  <p>Pick a debounce strategy for the global search input. Constraints:
     no new runtime deps, must work under React 18, must be testable
     without faking timers, must support cancel-on-unmount.</p>
</aside>

<!-- 2. N-column grid -->
<section id="approaches">
  <div class="vc-approaches">

    <article class="vc-approach">
      <span class="vc-approach-num">01</span>
      <h3>Inline useEffect</h3>
      <p class="vc-approach-desc">A setTimeout in a useEffect; clear on
        re-render or unmount.</p>
      <pre><code class="ts">useEffect(() => {
  const t = setTimeout(() => onSearch(query), 200);
  return () => clearTimeout(t);
}, [query]);</code></pre>
      <dl class="vc-procon">
        <dt class="vc-procon-pro">Pro</dt>
          <dd>Zero deps; reads top-to-bottom in one place.</dd>
        <dt class="vc-procon-pro">Pro</dt>
          <dd>Cancel-on-unmount is automatic.</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Re-creates the timer on every render of the parent.</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Hard to share the debounced value across components.</dd>
      </dl>
      <ul class="vc-chip-strip">
        <li class="vc-chip">Bundle: <strong>+0kb</strong></li>
        <li class="vc-chip">Testability: <strong>high</strong></li>
        <li class="vc-chip">Reusable: <strong>low</strong></li>
        <li class="vc-chip">SSR-safe: <strong>yes</strong></li>
      </ul>
    </article>

    <article class="vc-approach">
      <span class="vc-approach-num">02</span>
      <h3>Custom hook</h3>
      <p class="vc-approach-desc">Encapsulate the timer + cancel into
        a useDebounce(value, delay) hook.</p>
      <pre><code class="ts">function useDebounce&lt;T&gt;(v: T, ms = 200) {
  const [out, setOut] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setOut(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return out;
}</code></pre>
      <dl class="vc-procon">
        <dt class="vc-procon-pro">Pro</dt>
          <dd>Reusable across components; one shape to learn.</dd>
        <dt class="vc-procon-pro">Pro</dt>
          <dd>~12 lines; can live in any project utility folder.</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Generic — does not surface intent (`useDebounce(query)`
              vs `useDebouncedSearch(query)`).</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Easy to misuse with a changing `ms` argument.</dd>
      </dl>
      <ul class="vc-chip-strip">
        <li class="vc-chip">Bundle: <strong>+0.4kb</strong></li>
        <li class="vc-chip">Testability: <strong>high</strong></li>
        <li class="vc-chip">Reusable: <strong>high</strong></li>
        <li class="vc-chip">SSR-safe: <strong>yes</strong></li>
      </ul>
    </article>

    <article class="vc-approach">
      <span class="vc-approach-num">03</span>
      <h3>use-debounce library</h3>
      <p class="vc-approach-desc">Third-party hook from npm; battle-
        tested in many React codebases.</p>
      <pre><code class="ts">import { useDebounce } from 'use-debounce';
const [debounced] = useDebounce(query, 200);</code></pre>
      <dl class="vc-procon">
        <dt class="vc-procon-pro">Pro</dt>
          <dd>Battle-tested; handles edge cases (leading edge, max wait).</dd>
        <dt class="vc-procon-pro">Pro</dt>
          <dd>3-line consumer code.</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Violates the "no new deps" constraint.</dd>
        <dt class="vc-procon-con">Con</dt>
          <dd>Requires Jest fake-timers for tests, breaking another
              constraint.</dd>
      </dl>
      <ul class="vc-chip-strip">
        <li class="vc-chip">Bundle: <strong>+1.6kb</strong></li>
        <li class="vc-chip">Testability: <strong>medium</strong></li>
        <li class="vc-chip">Reusable: <strong>high</strong></li>
        <li class="vc-chip">SSR-safe: <strong>yes</strong></li>
      </ul>
    </article>

  </div>
</section>

<!-- 3. Recommendation card -->
<aside class="vc-recommendation">
  <p class="vc-recommendation-eyebrow">RECOMMENDATION</p>
  <h2>Custom hook (02)</h2>
  <p>02 satisfies all four constraints (no new deps, React 18, testable
     without fake timers, cancel-on-unmount) while keeping reusable
     callsite shape. 01 is correct but bloats every consumer; 03 fails
     two hard constraints. Promote 02 to <code>src/util/useDebounce.ts</code>;
     migrate the existing search input as the first consumer.</p>
</aside>

<footer class="vc-doc-footer">
  <span class="vc-auto-pill">auto-generated</span>
  Sources: <code>src/search/SearchBox.tsx</code> ·
  <code>package.json</code> · React 18 release notes
  <span class="vc-generated">generated 2026-05-16 12:08</span>
</footer>

</article>
```

## The N-column grid

```css
.vc-approaches {
  display: grid;
  grid-template-columns: repeat(var(--vc-approach-count, 3), minmax(0, 1fr));
  gap: var(--vc-space-5, 32px);
}
@media (max-width: 1100px) {
  .vc-approaches { grid-template-columns: 1fr; }
}
.vc-approach {
  padding: var(--vc-space-4, 16px);
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
.vc-approach-num {
  display: inline-block;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  margin-block-end: var(--vc-space-2, 8px);
}
```

Set `--vc-approach-count` on the parent at render time to match N
(default 3). Below 1100px the columns stack — symmetric structure is
preserved vertically.

## The Pro/Con sub-grid

A `<dl>` with `<dt class="vc-procon-pro|--con">` rows. Olive bullet
dot for Pro, clay dot for Con.

```css
.vc-procon { margin-block: var(--vc-space-4, 16px); }
.vc-procon dt {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-1, 4px);
  font-size: var(--vc-text-0, 11px);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-block-start: var(--vc-space-2, 8px);
}
.vc-procon-pro::before,
.vc-procon-con::before {
  content: "";
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
}
.vc-procon-pro { color: var(--vc-color-success, #3a6b5c); }
.vc-procon-pro::before { background: var(--vc-color-success, #3a6b5c); }
.vc-procon-con { color: var(--vc-color-danger, #a84a32); }
.vc-procon-con::before { background: var(--vc-color-danger, #a84a32); }
.vc-procon dd { margin-inline-start: var(--vc-space-3, 12px); }
```

**Symmetry rule**: same Pro count and same Con count across all N
columns. Imbalance (2 Pros / 5 Cons in one column, 4 Pros / 1 Con in
another) telegraphs your verdict and undermines the analysis.

## The metric-chip strip

A horizontal row of small `<li class="vc-chip">` chips, each carrying
one label/value pair. Cleaner than a row of stat cards when you have
4+ short metrics per approach.

```css
.vc-chip-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin-block: var(--vc-space-3, 12px) 0;
}
.vc-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
}
.vc-chip strong {
  color: var(--vc-color-content, #1f1a14);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-weight: var(--vc-weight-bold, 700);
}
```

**Same metric names across all columns** — a chip in column 01 called
"Bundle" MUST appear in columns 02 and 03 (even if the value is "+0kb"
or "n/a"). Missing a chip in one column tells the reader the metric
does not apply, which is rarely the truth.

## The recommendation card (clay left-border)

```css
.vc-recommendation {
  margin-block: var(--vc-space-6, 48px);
  padding: var(--vc-space-4, 16px) var(--vc-space-5, 32px);
  border-inline-start: 4px solid var(--vc-color-accent, #b8861f);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 6%, transparent);
  border-radius: 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0;
}
.vc-recommendation-eyebrow {
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-accent, #b8861f);
  margin: 0;
}
.vc-recommendation h2 { margin-block: var(--vc-space-2, 8px); }
.vc-recommendation p { margin: 0; }
```

The recommendation MUST name the winning approach by its number AND
title (`Custom hook (02)`), not by number alone. Numbers shift when
columns are reordered; the title does not.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Recommendation card border + eyebrow + tint |
| `--vc-color-success` | Pro dt color + bullet, "good" chip variant if any |
| `--vc-color-danger` | Con dt color + bullet |
| `--vc-color-surface` | Approach card background |
| `--vc-color-surface-sunken` | Chip background, approach-num bg |
| `--vc-color-content-muted` | Eyebrow, secondary text |
| `--vc-font-mono` | Approach numbers, chip values, file paths |
| `--vc-radius-md` | Approach cards, recommendation card |

## Composition with other skills

| Section | Embed from |
|---|---|
| Prompt box | `amvcp-prose-pages` (this skill) — `provenance-footer-and-autopill` covers the convention |
| Approach columns | `amvcp-layout` (CSS grid) |
| Code panels | `amvcp-code-highlight` |
| Pro/Con `<dl>` | `amvcp-prose-pages` (this skill) |
| Chip strip | `amvcp-tables` (chip primitive) |
| Recommendation card | `amvcp-prose-pages` (this skill) — variant of TL;DR |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "compare-debounce");
```

## Selection / comment notes

- The prompt box is selectable as a unit so a reader can comment
  "the framing missed constraint X".
- Each approach card is selectable
  (`{type:"approach", approachNum:"02"}`) so a reader can comment on
  the whole approach.
- Each code block is selectable per-line (paragraph numbering via
  `data-ve-prose` continues inside the code).
- Pro/Con `<dt>` + `<dd>` pairs are selectable per pair.
- Chip values are selectable individually — readers can comment "this
  bundle size measurement is stale".
- The recommendation card is selectable as a unit so a reader can
  disagree with the verdict without highlighting it.

## Decision-mini hook

The recommendation card is the natural host of a decision-mini:

```html
<aside class="vc-recommendation">
  <p class="vc-recommendation-eyebrow">RECOMMENDATION</p>
  <h2>Custom hook (02)</h2>
  <p>… verdict prose …</p>
  <div class="ve-decision" data-decision-id="debounce-strategy">
    <p>Accept this recommendation?</p>
    <button data-choice="accept-02">Adopt 02</button>
    <button data-choice="accept-01">Override — go with 01 (inline)</button>
    <button data-choice="defer">Defer — need more data</button>
  </div>
</aside>
```

## Anti-patterns

- **Asymmetric structure across columns** — see above. Same Pro
  count, Con count, chip names.
- **Recommendation card before the columns** — the verdict belongs at
  the bottom AFTER the analysis. Leading with the verdict eliminates
  the reason for the columns.
- **No prompt box** — without the prompt, the reader cannot judge
  whether your constraints were the right ones.
- **More than 4 columns** — beyond 4 the columns become narrow,
  unreadable, and stack on every viewport. Split into 2-3 + an
  "honorable mentions" section.
- **A "winner" badge on the recommended column** — the recommendation
  is the verdict; double-marking is redundant and prejudices the
  scan.
- **Chips with units the reader has to convert** — pick a single unit
  (kb / ms / lines) and use it consistently. "Bundle: 1638 bytes"
  next to "Bundle: 0.4kb" forces mental arithmetic.
- **"All three are good" recommendation** — defeats the point. If
  you truly cannot pick, the comparison criteria are wrong; rewrite
  them.
