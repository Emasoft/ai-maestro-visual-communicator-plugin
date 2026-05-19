# Sub-technique E9 — Compare N approaches: side-by-side code + Pro/Con + chips

## Table of Contents

- [E9.1 The shape](#e91-the-shape)
- [E9.2 The page-level grid](#e92-the-page-level-grid)
- [E9.3 Per-column markup](#e93-per-column-markup)
- [E9.4 The Pro/Con sub-grid](#e94-the-procon-sub-grid)
- [E9.5 The metric chips strip](#e95-the-metric-chips-strip)
- [E9.6 The recommendation card](#e96-the-recommendation-card)
- [E9.7 The "code panel per column" discipline](#e97-the-code-panel-per-column-discipline)
- [E9.8 Selection / commenting per column](#e98-selection--commenting-per-column)
- [E9.9 Cross-references](#e99-cross-references)
- [E9.10 When to use](#e910-when-to-use)
- [E9.11 Light + dark verification](#e911-light--dark-verification)
- [E9.12 Tokens consumed](#e912-tokens-consumed)
- [E9.13 Mined source attribution](#e913-mined-source-attribution)

The 3-column "debounced search × 3 implementations" composition. Code
block + Pro/Con tradeoff table + metric chips + recommendation card
per column. Mined from `01-exploration-code-approaches.html` (html-
effectiveness catalog #1).

## E9.1 The shape

A page (or section) comparing N (typically 3) implementations of the
same FUNCTIONAL goal. Each column shows:

1. **Numbered badge** + serif title + 1-line description
2. **Dark monospace code block** (the implementation)
3. **2-column "Pro / Con" tradeoff table**
4. **Strip of "metric pills"** (`Bundle: +0kb`, `Testability: high`)
5. **Recommendation card** with a clay-left-border accent

At the bottom (full-width across columns): a final recommendation card
that picks the winner.

## E9.2 The page-level grid

```html
<section class="ve-compare-approaches">
  <h2>Three ways to implement debounced search</h2>
  <p>Each implementation trades off bundle size, testability, and
     reusability differently. Pick based on YOUR constraints.</p>

  <div class="ve-compare-approaches__grid">
    <article class="ve-compare-approaches__col">…approach 1…</article>
    <article class="ve-compare-approaches__col">…approach 2…</article>
    <article class="ve-compare-approaches__col">…approach 3…</article>
  </div>

  <aside class="ve-compare-approaches__recommendation">
    <h3>Recommendation</h3>
    <p>For most projects, the <strong>custom hook</strong> (approach 2)
       is the right choice — 0kb bundle, high testability, clean API.
       Reach for the library only if you need its advanced features
       (cancel, lead/trail config).</p>
  </aside>
</section>
```

The grid:

```css
.ve-compare-approaches__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.ve-compare-approaches__col {
  min-width: 0;            /* code wraps; never an inner scrollbar */
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (max-width: 1100px) {
  .ve-compare-approaches__grid { grid-template-columns: 1fr; }
}
```

Below 1100px the grid collapses to 1 column (the columns stack
vertically). Three side-by-side code blocks on a < 1100px viewport
would be unreadable.

## E9.3 Per-column markup

```html
<article class="ve-compare-approaches__col">
  <header class="ve-compare-approaches__col-head">
    <span class="ve-compare-approaches__num">01</span>
    <h3>Inline useEffect</h3>
    <p>Direct setTimeout in a useEffect, manually clear on dependency
       change. Zero deps, zero abstraction.</p>
  </header>

  <div class="ve-code-block ve-code-panel-slate">
    <pre><code class="language-typescript">function SearchBox () {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}</code></pre>
  </div>

  <table class="ve-compare-approaches__procon">
    <tbody>
      <tr>
        <td class="ve-procon__pro"><span class="ve-procon__dot ve-procon__dot--pro"></span> No dependencies</td>
        <td class="ve-procon__con"><span class="ve-procon__dot ve-procon__dot--con"></span> Repeated 5+ places</td>
      </tr>
      <tr>
        <td class="ve-procon__pro"><span class="ve-procon__dot ve-procon__dot--pro"></span> Easy to understand</td>
        <td class="ve-procon__con"><span class="ve-procon__dot ve-procon__dot--con"></span> Hard to test (effect timing)</td>
      </tr>
    </tbody>
  </table>

  <div class="ve-compare-approaches__chips">
    <span class="ve-chip">Bundle: <strong>+0kb</strong></span>
    <span class="ve-chip">Testability: <strong>low</strong></span>
    <span class="ve-chip">Reusability: <strong>none</strong></span>
  </div>
</article>
```

## E9.4 The Pro/Con sub-grid

```css
.ve-compare-approaches__procon {
  width: 100%;
  border-collapse: collapse;
}
.ve-compare-approaches__procon td {
  width: 50%;
  padding: 6px 8px;
  font-size: var(--vc-text-small);
  vertical-align: top;
}
.ve-procon__dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.ve-procon__dot--pro { background: var(--vc-color-success); }
.ve-procon__dot--con { background: var(--ve-accent); }
.ve-procon__pro { color: var(--vc-color-neutral-700); }
.ve-procon__con { color: var(--vc-color-neutral-700); }
```

Mined catalog quote: *"Tradeoff table is a sub-grid of
`.row{grid-template-columns:1fr 1fr}` rows. … Olive dot for 'Pro',
clay dot for 'Con'."*

## E9.5 The metric chips strip

```css
.ve-compare-approaches__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ve-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--vc-color-neutral-100);
  border-radius: 12px;
  font-family: var(--vc-font-mono);
  font-size: calc(var(--vc-text-small) - 1px);
  color: var(--vc-color-neutral-700);
}
.ve-chip strong {
  color: var(--vc-color-neutral-900);
}
```

Mined catalog quote: *"strip of `chip` 'metric pills' (`Bundle: +0kb`,
`Testability: high`, etc.)"*. The chips are the COMPACT alternative to
a row of stat cards — they fit in a 1/3-width column without dominating.

## E9.6 The recommendation card

The full-width recommendation card sits below the 3-column grid:

```css
.ve-compare-approaches__recommendation {
  border-left: 4px solid var(--ve-accent);
  background: color-mix(in srgb, var(--ve-accent) 4%, transparent);
  border-radius: 0 8px 8px 0;
  padding: 16px 20px;
  margin-top: 24px;
}
.ve-compare-approaches__recommendation h3 {
  margin: 0 0 8px;
  color: var(--ve-accent);
}
```

Same visual as the TL;DR card pattern — clay-left-border + faint
clay-tinted interior. The reader who only reads ONE thing should read
the recommendation.

## E9.7 The "code panel per column" discipline

Each column uses the SLATE-BG code panel (see [slate-bg-code-panel.md](../../amvcp-code-syntax/references/slate-bg-code-panel.md)). The dark panels read as load-bearing
content; the prose / chips around them are supporting.

The 3 code blocks should be ROUGHLY SAME-HEIGHT — pick implementations
that are ~similar line counts. A 5-line block next to a 25-line block
makes the columns visually unbalanced. If one approach is naturally
much shorter, pad it with comments OR show only the "essential"
fragment with `<span class="ve-code-path__lines">…</span>` indicating
the omission.

## E9.8 Selection / commenting per column

Reader can select lines in any column independently. Comment payload
carries:
- Column number (1, 2, or 3)
- Approach name (`Inline useEffect`)
- File path (if present)
- Line range
- Content

Agent receiving the comment knows the reader is asking about
"approach 2 specifically" vs "this line in approach 2" — varying levels
of context.

## E9.9 Cross-references

- [slate-bg-code-panel.md](../../amvcp-code-syntax/references/slate-bg-code-panel.md) — the code-panel
  visual
- `amvcp-tables` `compare` mode — the Pro/Con sub-table is a small-
  scale compare-mode table
- `amvcp-prose-pages` chip patterns — the metric chips share styling
  with prose chips

## E9.10 When to use

| Use this composition when… | Use something else when… |
|---|---|
| Comparing 2-4 implementations of the SAME goal | More than 4 → use a tables `compare` mode (more efficient) |
| Each approach has CODE that needs to be visible | The approaches differ in CONFIGURATION → tables `compare` mode |
| The reader needs to UNDERSTAND each approach (not just compare metrics) | The reader needs to PICK based on numbers → tables `compare` mode with metric rows |
| The recommendation is going to argue for one approach | Approaches are equivalent → don't recommend, just compare |

## E9.11 Light + dark verification

- [ ] 3 columns visible side-by-side on both themes at > 1100px
- [ ] Stacks to 1 column below 1100px on both themes
- [ ] Slate code panels readable on both themes
- [ ] Pro/Con dots (olive/clay) read on both themes
- [ ] Metric chips' bg/text contrast OK on both themes
- [ ] Recommendation card's clay border read on both themes

## E9.12 Tokens consumed

- All from [slate-bg-code-panel.md](../../amvcp-code-syntax/references/slate-bg-code-panel.md)
- `--vc-color-success` (Pro dot) / `--ve-accent` (Con dot,
  recommendation)
- `--vc-color-neutral-100` / `-700` / `-900` (chip neutrals)
- `--vc-font-mono` (chip font)
- `--vc-radius-md` (chip radius)

## E9.13 Mined source attribution

Catalog quote from §3 prose-mining + §3.7 code-highlight, source
`01-exploration-code-approaches.html`:

> *"Three-way side-by-side comparison. Compares three implementations
> of 'debounced search' (inline useEffect / custom hook / `use-debounce`
> lib) side-by-side. Each column has: numbered badge → serif title +
> 1-line desc → dark monospace code block → a 2-column 'Pro / Con'
> tradeoff table → a strip of `chip` 'metric pills' → bottom
> recommendation card with clay left-border accent."*

Plus the catalog's §3.13 listing: *"Compare-N-approaches shape — Prompt
box + 3 columns (each with numbered title + code panel + Pro/Con table
plus metric chips) + clay-left-border recommendation card."*

Adopted as the canonical "compare N implementations" composition.
