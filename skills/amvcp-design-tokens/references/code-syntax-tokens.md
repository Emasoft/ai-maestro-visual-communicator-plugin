# Syntax-highlight code-theme tokens (DM-26 + DT-27 indirect)

A 12-token vocabulary for syntax-highlighted code blocks: every
DESIGN.md preset ships a `code:` group with one color per syntactic
category. The contact-sheet's code panel uses these tokens; the
`code-highlight` skill's tokenizer consumes them; the runtime defaults
them all to `--vc-color-*` semantic roles if a preset omits the group.

## The 12 tokens

| Token | Maps to (typical) | Use |
|---|---|---|
| `keyword` | accent | `if`, `for`, `function`, `return` |
| `string` | success | string literals — quoted text |
| `number` | danger | numeric literals — `42`, `3.14` |
| `comment` | content-subtle | `//`, `/* */`, `#` |
| `type` | info | type / class names — `User`, `string`, `Promise<T>` |
| `variable` | content | variable / identifier references |
| `function` | accent | function CALL sites — `getUser(...)` |
| `constant` | warning | `const` declarations, `UPPER_SNAKE_CASE` |
| `operator` | content-muted | `+`, `-`, `=`, `=>`, `<` |
| `punctuation` | content-subtle | `{`, `}`, `[`, `]`, `,`, `;` |
| `tag` | danger | HTML/JSX tags — `<div>`, `<MyComponent>` |
| `attribute` | success | HTML attributes / JSX props — `class=`, `onClick=` |

These mappings are the DEFAULTS shipped by every PRESETS entry; an
author can override per-preset (the `cjk-claude` preset uses
`ff6600` for `keyword` to match the brand accent specifically).

## What it does

The DESIGN.md `code:` group:

```yaml
code:
  keyword:     "#a8791f"
  string:      "#3a6b5c"
  number:      "#a84a32"
  comment:     "#8a8170"
  type:        "#3464a8"
  variable:    "#1f1a14"
  function:    "#7a5c9e"
  constant:    "#b8861f"
  operator:    "#5b5343"
  punctuation: "#8a8170"
  tag:         "#a84a32"
  attribute:   "#3a6b5c"
```

Mints `--vc-code-keyword`, `--vc-code-string`, etc. — 12 inheritable
CSS custom properties on `:root`.

`amvcp-tokens.css` ships fallback rules: `.vc-tok-keyword { color:
var(--vc-code-keyword, var(--vc-color-accent)); }`. So even if a
preset omits the `code:` group, the page still renders with
semantically-sensible colors (keywords = accent, strings = success,
etc.).

## When to use

Always — the moment an artifact contains a `<pre>` or `<code>` block.
Slop is `Prism.css` / `highlight.js` styles dropped in with
hard-coded `#9CDCFE` / `#CE9178` / `#B5CEA8` — the famous "VS Code
Dark+" palette every AI artifact ships. Using the DESIGN.md `code:`
tokens makes the code block theme WITH the rest of the artifact,
not against it.

## Scaffold to emit

The agent's HTML emits per-token spans:

```html
<pre class="vc-sheet-code">
<span class="vc-tok-keyword">function</span>
<span class="vc-tok-function">getUser</span>(<span class="vc-tok-variable">id</span>: <span class="vc-tok-type">string</span>) {
  <span class="vc-tok-keyword">return</span> <span class="vc-tok-variable">db</span>.<span class="vc-tok-function">find</span>(<span class="vc-tok-string">"user"</span>, <span class="vc-tok-variable">id</span>);
}
</pre>
```

The contact-sheet's code panel uses a tiny built-in tokenizer (no
Prism dependency); the `code-highlight` skill's tokenizer produces
the same span structure for arbitrary source languages.

## Lib functions used

- (no JS function in `amvcp-tokens.js` — the tokens are pure CSS)
- the contact-sheet's `buildCodePanel` (in `amvcp-token-sheet.js`)
  invokes a small `highlightInto` function — see code panel reference
- `--vc-code-*` tokens are emitted by the engine when a DESIGN.md
  declares the `code:` group

## DESIGN.md tokens used

- writes: `code.{keyword, string, number, comment, type, variable,
  function, constant, operator, punctuation, tag, attribute}`
- emits: `--vc-code-keyword` … `--vc-code-attribute` (12 vars)
- fallback (when group is absent): each `--vc-code-*` falls back to
  the closest `--vc-color-*` semantic role via the CSS `var(--…,
  fallback)` chain in `amvcp-tokens.css`

## Anti-slop interaction

The 12-token vocabulary catches the most common slop signature in
emitted artifacts: a VS Code Dark+ palette baked into a `<pre>` even
when the rest of the artifact uses a Heritage warm-tone theme. The
agent's pre-delivery lint should run `lintHtml` over the final
artifact; any literal hex inside a `<pre>` block triggers the
banned-color check (the page-theme accent is `var(...)` referenced,
not literal).

## Selection / comment / decision-mini contract

Inside a code block, selection works normally — `::selection { bg:
var(--vc-selection-bg); }` overlays the syntax-highlighted spans
without breaking the colors (the selection overlay is alpha-blended,
not opaque). Selecting a `function` call site shows the function
name still in its accent color UNDER the selection mark — proof the
tokens compose correctly.

The code panel in the contact-sheet is `<pre overflow:visible>` per
the no-nested-scrollbars rule — wide code extends the document's
single scroll axis, never an inner scrollbar.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render the contact-
sheet's code panel under `dev-browser`. Screenshot in **both themes**
(R1) and verify:

1. each of the 12 categories appears in its own color (a sample
   snippet that exercises all 12 makes this visible);
2. NO literal VS-Code-Dark-Plus palette hex (`#9CDCFE`, `#CE9178`,
   `#B5CEA8`) appears anywhere in the emitted HTML — grep the page
   source;
3. on dark theme, all 12 colors remain readable against the dark code
   panel bg (`amvcpTokens.contrastRatio(tokenHex, codePanelBgHex) >=
   4.5` for the more important tokens — comments and punctuation can
   relax to 3.0:1 since they're secondary);
4. selecting a code span paints the standard `--vc-selection-bg` over
   the span; the syntax color shows THROUGH the alpha selection (it
   doesn't replace it).
