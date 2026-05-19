# Sub-technique C1 — Inline 4-class hand-wrapped highlighting

## Table of Contents

- [C1.1 What it does](#c11-what-it-does)
- [C1.2 When to choose this over the JS tokenizer](#c12-when-to-choose-this-over-the-js-tokenizer)
- [C1.3 The markup](#c13-the-markup)
- [C1.4 The CSS (page-stylesheet)](#c14-the-css-page-stylesheet)
- [C1.5 The 5-rule discipline](#c15-the-5-rule-discipline)
- [C1.6 Example: a debounced-search hook explanation](#c16-example-a-debounced-search-hook-explanation)
- [C1.7 Selection / copy / accessibility](#c17-selection--copy--accessibility)
- [C1.8 The fallback when DESIGN.md isn't loaded](#c18-the-fallback-when-designmd-isnt-loaded)
- [C1.9 Why this palette is "shared"](#c19-why-this-palette-is-shared)
- [C1.10 The migration path to the JS tokenizer](#c110-the-migration-path-to-the-js-tokenizer)
- [C1.11 Tokens consumed](#c111-tokens-consumed)

The minimal-CSS, JS-free pattern for syntax-colour without invoking
the full tokenizer. Mined from `01-exploration-code-approaches`,
`04-code-understanding`, `14-research-feature-explainer`, `16-
implementation-plan`, `17-pr-writeup` — the shared 4-class palette
used by every demo file in the html-effectiveness catalog.

## C1.1 What it does

Instead of running the JS tokenizer, the AUTHOR hand-wraps token
spans in 4 classes:

| Class | Role | Color | Token reference |
|---|---|---|---|
| `kw`  | Keyword | clay (accent) | `--ve-code-keyword` |
| `str` | String | olive | `--ve-code-string` |
| `cm`  | Comment | gray-500 | `--ve-code-comment` |
| `fn`  | Identifier / function name | warm tan `#C9B98A` | `--ve-code-function` (light variant) |

Optional fifth class for "the thing the reader should look at":

| Class | Role | Color (token) |
|---|---|---|
| `hl`  | Highlight | full accent gold (`--ve-accent`) |

**Five colors total.** No `number`, `type`, `operator`, `punctuation`,
`tag`, `attribute`. Inline highlighting is INTENTIONALLY less rich than
the JS tokenizer — its job is to give the reader a 30-second visual
breakdown, not a full syntax analysis.

## C1.2 When to choose this over the JS tokenizer

| Use hand-wrap when… | Use the JS tokenizer when… |
|---|---|
| The block is a short illustrative snippet (1-10 lines, often partial) | The block is full real source code (≥ 10 lines) |
| The block is INSIDE the prose layer (a paragraph quoting a few lines) | The block is a top-level `<pre>` |
| The "language" is fictional (a pseudo-code or DSL example) | The language is one of the 7 supported |
| The author wants to draw attention to ONE thing (use `hl`) | The author wants uniform colouring |
| The runtime isn't loaded (e.g. a generated email body) | The runtime is loaded normally |
| The author wants offline-only fidelity (no JS at all) | JS is available |

In all other cases, the JS tokenizer is better — same visual, less
authoring effort, integrity-probe safety.

## C1.3 The markup

```html
<pre data-ve-no-gutter><code><span class="cm">// Debounced search hook</span>
<span class="kw">export function</span> <span class="fn">useSearch</span>(query: <span class="kw">string</span>) {
  <span class="kw">const</span> <span class="fn">debounced</span> = <span class="fn">useDebounce</span>(query, <span class="str">300</span>);
  <span class="kw">return</span> <span class="fn">useQuery</span>(<span class="hl">[<span class="str">'search'</span>, debounced]</span>);
}</code></pre>
```

Key constraints:
- **`data-ve-no-gutter`** on the `<pre>` — opts out of the runtime's
  `initCodeGutter` (which would refuse to wrap a `<code>` with child
  elements anyway, but the opt-out is explicit).
- The wrapping `<pre><code>` is still present — preserves keyboard-
  focusability and copy semantics from the surrounding browser
  selection.
- **NO** language class — the JS tokenizer is bypassed; declaring a
  language would be misleading.

## C1.4 The CSS (page-stylesheet)

```css
pre[data-ve-no-gutter] {
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  line-height: 1.55;
  background: var(--ve-slate-panel, #141413);
  color: var(--ve-control-fg-on-slate, #E8E6DC);
  padding: 14px 18px;
  border-radius: var(--vc-radius-md, 12px);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: visible;       /* no-nested-scrollbars rule */
}
pre[data-ve-no-gutter] .kw  { color: var(--ve-code-keyword, var(--ve-accent, #b8861f)); }
pre[data-ve-no-gutter] .str { color: var(--ve-code-string, #9ece9e); }
pre[data-ve-no-gutter] .cm  { color: var(--ve-code-comment, #87867f); font-style: italic; }
pre[data-ve-no-gutter] .fn  { color: var(--ve-code-function, #C9B98A); }
pre[data-ve-no-gutter] .hl  { color: var(--ve-accent, #b8861f); font-weight: 600; }
```

Note the rules are SCOPED to `pre[data-ve-no-gutter]` — so the 4
classes (`kw`, `str`, `cm`, `fn`, `hl`) are ONLY active inside hand-
wrapped blocks. This prevents collisions with the JS tokenizer's
classes (`ve-tok-*`) and with project-wide class names.

## C1.5 The 5-rule discipline

When hand-wrapping, follow these rules:

1. **Wrap keywords with `<span class="kw">`** — `const`, `let`,
   `function`, `class`, `return`, `if`, `else`, `for`, `import`,
   `export`, `async`, `await`, `try`, `catch`. Language keywords ONLY,
   not user identifiers.
2. **Wrap strings with `<span class="str">`** — everything inside
   `'...'`, `"..."`, `` `...` ``. Include the quote characters; they
   are part of the string token.
3. **Wrap line comments with `<span class="cm">`** — `// ...`, `# ...`,
   `<!-- ... -->`. Including the leading `//` etc.
4. **Wrap function identifiers with `<span class="fn">`** — `useSearch`,
   `useDebounce`, `useQuery`. Bare identifier names. Type names too if
   relevant (`Promise`, `HTMLElement`).
5. **Wrap the focal point with `<span class="hl">`** — at most ONCE per
   block, the single line / token the surrounding prose is talking
   about.

Rules NOT to follow:
- Don't wrap numbers (the catalog's 4-class palette intentionally
  omits a number class — numbers stay default text colour).
- Don't wrap operators / punctuation (`+`, `=`, `(`, etc.) — leave
  them default; the 4-class scheme is for reading-clarity, not for
  visual richness.
- Don't nest classes (`<span class="hl"><span class="kw">return</span></span>`
  is over-engineered — pick one, prefer `hl` for the focal point).

## C1.6 Example: a debounced-search hook explanation

```html
<p>The hook composes <code class="inline">useDebounce</code> with
   <code class="inline">useQuery</code>:</p>

<pre data-ve-no-gutter><code><span class="kw">export function</span> <span class="fn">useSearch</span>(query: <span class="kw">string</span>) {
  <span class="kw">const</span> <span class="fn">debounced</span> = <span class="fn">useDebounce</span>(query, <span class="str">300</span>);
  <span class="hl"><span class="kw">return</span> <span class="fn">useQuery</span>([<span class="str">'search'</span>, <span class="fn">debounced</span>])</span>;
}</code></pre>

<p>The <code class="inline">300</code>ms debounce + the
<code class="inline">useQuery</code> key composition is why this hook
deduplicates queries during fast typing.</p>
```

The `hl` highlight on the final `return` line draws the reader's eye
to the line the surrounding prose is talking about.

## C1.7 Selection / copy / accessibility

A `data-ve-no-gutter` block:
- Does NOT participate in the per-line selection model (no
  `.ve-code-line` atoms).
- Is still text-selectable via native browser drag-select (the
  reader can drag, copy via Ctrl+C, paste into their editor — they
  get the text content WITH the inline spans stripped by the browser's
  copy machinery).
- Has no copy button (the runtime doesn't inject one without a
  gutter).
- The 4-class `<span>`s are NOT focusable (they're decorative).

Authors who need a copy button on a hand-wrapped block can add one
manually using the same SVG glyphs and clipboard API as the runtime —
see [copy-button.md](./copy-button.md) §A5.5 for the transport code.

## C1.8 The fallback when DESIGN.md isn't loaded

The 5 token references all have hardcoded fallback colors in the
`var()` chain:

```css
pre[data-ve-no-gutter] .kw { color: var(--ve-code-keyword, var(--ve-accent, #b8861f)); }
```

Three-level fallback: `--ve-code-keyword` (bridge) → `--ve-accent`
(generic accent) → `#b8861f` (hardcoded). Even with NO theming engine
loaded, the visual works.

## C1.9 Why this palette is "shared"

The catalog mining found all 21 demo files use the SAME 4 (5) classes.
The shared palette is a deliberate visual-identity choice: every
hand-wrapped block on every page reads as "an AMVCP code example",
regardless of file. The reader builds one mental model and reuses it.

Other authors should NOT invent custom classes (`.tag`, `.tk-keyword`,
`.code-fn`, etc.) — use the shared 4-class palette. If a 5th colour is
genuinely needed, use `hl` for it (the highlight role).

## C1.10 The migration path to the JS tokenizer

If a hand-wrapped block grows beyond 10 lines, refactor:

1. Remove the inline spans (the runtime can't handle a `<code>` with
   children).
2. Remove `data-ve-no-gutter`.
3. Add `class="language-X"` to the `<code>`.
4. The runtime + JS tokenizer take over — gutter, copy button,
   selection, per-token highlighting all light up.

Don't try to migrate IN PLACE (incremental partial-tokenization). The
tokenizer's integrity probe doesn't handle hand-wrapped + JS-
tokenized mixed input.

## C1.11 Tokens consumed

- `--ve-slate-panel` / `--ve-control-fg-on-slate` — the slate-bg
  variant (the default visual)
- `--ve-code-keyword` / `string` / `comment` / `function` — token roles
- `--ve-accent` — the `hl` focal highlight
- `--vc-font-mono` / `--vc-text-small` / `--vc-radius-md` — typography
  and shape
