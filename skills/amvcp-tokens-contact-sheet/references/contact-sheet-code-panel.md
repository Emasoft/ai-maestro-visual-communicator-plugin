# Contact-sheet code panel — syntax highlighting + 12-color legend

## Table of Contents

- [What it does](#what-it-does)
- [Why a tiny built-in tokenizer](#why-a-tiny-built-in-tokenizer)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The `code` panel of the token contact sheet renders a syntax-
highlighted sample using a tiny built-in tokenizer + a 12-color
legend (one chip per `--vc-code-*` token). The visual proof that the
artifact's syntax highlighting belongs to the artifact's design
system, not to VS Code Dark+.

## What it does

`buildCodePanel(designmd)`:

1. emits a `<pre class="vc-sheet-code">` with a sample code snippet
   (typically a small TypeScript function or similar polyglot-ish
   sample);
2. tokenizes the sample with a built-in regex-based tokenizer
   (`highlightInto` in `amvcp-token-sheet.js`) — produces
   `<span class="vc-tok-keyword">…</span>` / `vc-tok-string` /
   `vc-tok-comment` / etc. wrappers;
3. emits a 12-chip legend below — one chip per code token, each chip
   click-to-copies the `--vc-code-<token>` variable name and shows
   the literal color value.

The tokenizer is INTENTIONALLY tiny — it covers the common cases
(strings, numbers, comments, keywords, identifiers, types) for
TypeScript / JavaScript / Python / similar. For full-fidelity
syntax highlighting on arbitrary source, the `code-highlight` skill
ships a more capable tokenizer that produces the same span shape.

## Why a tiny built-in tokenizer

Bundling Prism or highlight.js for the contact sheet would:

- add 30–80kb of JS to the page;
- impose a tokenizer's own theme conventions;
- introduce a dependency that the contact sheet is supposed to
  obviate.

The 12-token vocabulary (see `references/code-syntax-tokens.md`)
maps onto the artifact's design system. The tokenizer just sorts
strings into those 12 categories — a few regex passes, no AST.

## Scaffold to emit

The panel template:

```html
<section data-vc-panel="code" class="vc-sheet-panel">
  <h2>Syntax highlighting</h2>

  <pre class="vc-sheet-code">
<span class="vc-tok-keyword">function</span> <span class="vc-tok-function">getUser</span>(<span class="vc-tok-variable">id</span>: <span class="vc-tok-type">string</span>) {
  <span class="vc-tok-comment">// Resolve the user from the cache, or fetch.</span>
  <span class="vc-tok-keyword">return</span> <span class="vc-tok-variable">cache</span>.<span class="vc-tok-function">get</span>(<span class="vc-tok-string">"user:"</span> + <span class="vc-tok-variable">id</span>) ?? <span class="vc-tok-function">fetchUser</span>(<span class="vc-tok-variable">id</span>);
}
</pre>

  <h3>Token legend</h3>
  <div class="vc-sheet-code-legend">
    <button class="vc-sheet-code-chip" data-vc-copy="var(--vc-code-keyword)">
      <span class="vc-sheet-code-dot" style="background: var(--vc-code-keyword)"></span>
      keyword
      <span class="vc-sheet-code-chip-meta">var(--vc-code-keyword)</span>
    </button>
    <!-- … 11 more chips, one per --vc-code-* token … -->
  </div>
</section>
```

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the code
  panel
- (internal) `buildCodePanel(designmd)`, `highlightInto(target, src)`,
  `highlightLine(target, line)`, `appendTok(target, klass, str)` —
  the tiny tokenizer + the panel builder; not exported

## DESIGN.md tokens used

- reads: `code.{keyword, string, number, comment, type, variable,
  function, constant, operator, punctuation, tag, attribute}` (the
  12-token group)
- emits (via the engine): `--vc-code-keyword` …
  `--vc-code-attribute` (12 vars)
- falls back (when the group is absent): each `--vc-code-*` falls
  back via `var(... fallback)` to the closest semantic role —
  `--vc-color-accent` for keyword/function, `--vc-color-success`
  for string, etc.

## Anti-slop interaction

A code panel that ships VS Code Dark+ palette literals
(`#9CDCFE` / `#CE9178` / `#B5CEA8`) fails the slop gate's
banned-color check via `lintHtml`. The panel's structural fix:
every token color is a `var(--vc-code-*)` reference, never a
literal. The legend chips show the LIVE resolved value so a designer
can see the colors WITHOUT inspecting `getComputedStyle`.

## Selection / comment / decision-mini contract

Selection across the code block paints `--vc-selection-bg` over the
syntax-highlighted spans. The syntax colors are visible THROUGH the
alpha selection mark (proof the tokens compose correctly with the
selection layer).

Each legend chip is click-to-copy.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the code panel in **both
themes** (R1) and verify:

1. each of the 12 tokens shows in its own color (the sample snippet
   must exercise all 12 for the visual to be complete — if the
   shipped sample doesn't, file an issue against the panel author);
2. NO VS-Code-Dark-Plus literals (`#9CDCFE`, `#CE9178`, `#B5CEA8`)
   appear anywhere in the rendered DOM — grep with
   `page.content().includes('#9CDCFE')` and assert false;
3. legend chips' dots show the CURRENT theme's code colors
   (different in light vs dark);
4. the `<pre>` has `overflow: visible` (NOT `overflow-x: auto`) —
   wide code extends the document's single scroll axis per the
   no-nested-scrollbars rule.
