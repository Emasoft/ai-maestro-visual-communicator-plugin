# Sub-technique A1 — Tokenizer contract (`amvcp-code-highlight.js`)

## Table of Contents

- [A1.1 What it does](#a11-what-it-does)
- [A1.2 Why it lives outside `amvcp-runtime.js`](#a12-why-it-lives-outside-amvcp-runtimejs)
- [A1.3 Dual export](#a13-dual-export)
- [A1.4 Public API](#a14-public-api)
- [A1.5 The 12 token roles](#a15-the-12-token-roles)
- [A1.6 The seven registered languages](#a16-the-seven-registered-languages)
- [A1.7 The stash-and-restore precedence model](#a17-the-stash-and-restore-precedence-model)
- [A1.8 The integrity probe — non-negotiable](#a18-the-integrity-probe--non-negotiable)
- [A1.9 Carry state (multi-line constructs)](#a19-carry-state-multi-line-constructs)
- [A1.10 Authoring rules consumers MUST follow](#a110-authoring-rules-consumers-must-follow)
- [A1.11 The runtime wiring contract](#a111-the-runtime-wiring-contract)
- [A1.12 Failure modes (all fail-soft)](#a112-failure-modes-all-fail-soft)
- [A1.13 Tokens consumed / extended](#a113-tokens-consumed--extended)

The dependency-free, ES5-safe, Node-require-able syntax-highlight
engine the runtime calls from inside `initCodeGutter`. This reference
documents the model, the API, and the **non-negotiable source-fidelity
contract** every consumer must respect.

Implements CB-03 (the lightweight tokenizer for the `--ve-code-*`
palette, no Shiki / no WASM / no Prism / no npm dep — CB-03 catalog
entry, PHASE2 backlog §12 P1).

## A1.1 What it does

Given the plain-text content of ONE source line (or a whole block, line
by line) plus a language id, returns an HTML string of inline
`<span class="ve-tok-<role>">` token spans — already HTML-escaped, safe
to drop straight into the gutter builder's per-line `.ve-code-content`
element. Returns plain-but-correct text on any failure path. **Never
throws. Never loses a character.**

## A1.2 Why it lives outside `amvcp-runtime.js`

The gutter builder (`initCodeGutter` in `scripts/amvcp-runtime.js`)
rebuilds each `<pre><code>` into per-line `<span>` elements **only**
when the `<code>` has no child elements. If a highlighter injects token
spans as a separate post-pass, that guard turns false, the gutter is
skipped, and soft-wrap + drag-paint selection break. So highlighting
MUST happen INSIDE the gutter builder, operating on one plain-text line
at a time and returning token-span HTML for that line. This module is
exactly that — a clean, testable, Node-require-able unit the runtime
calls per line.

## A1.3 Dual export

- Browser: `window.amvcpCodeHighlight = { … }`
- Node:    `module.exports = { … }` (for the test harness)

Same guard pattern as `amvcp-designmd.js`. ES5-safe — `var`, function
declarations, no arrow functions, no template literals, no classes, no
build step, no npm deps.

## A1.4 Public API

| Function | Returns | Use |
|---|---|---|
| `highlightLine(text, lang)` | token-span HTML for ONE line | Most common entry — the gutter builder calls this per line. |
| `highlightBlock(lines, lang)` | array of per-line HTML strings | Threads the inside-block-comment / inside-triple-string carry state line to line. |
| `scan(root)` | count of blocks highlighted | Walks every `.ve-code-block` under `root` (default `document`), tokenises each `.ve-code-content` in place. Idempotent — marks each `<pre>` so a re-scan skips it. Called from the runtime boot + theme-rescan. |
| `detectLanguage(preEl)` | language id, or `null` | Resolves a language from `data-ve-lang` or `class="language-*"`. |
| `normalizeLang(idOrAlias)` | canonical language id, or `null` | Resolves any alias (`py` → `python`, `ts` → `js`, …). |
| `languages` | the registered language descriptor map | Read-only; integration tests use it to enumerate registered langs. |
| `tokenRoles` | array of role names | The 12 `ve-tok-<role>` class names. |
| `escapeHtml(text)` | escaped HTML string | The module's own escaper (NOT borrowed from the runtime — self-contained). |

## A1.5 The 12 token roles

```
keyword · string · number · comment · type · variable ·
function · constant · operator · punctuation · tag · attribute
```

Each becomes a CSS class `.ve-tok-<role>` whose color is a
`--ve-code-<role>` custom property (see
[token-roles-palette.md](./token-roles-palette.md)).

Note: `variable` is in the list for completeness, but the tokenizer
**never emits a `variable` span**: bare identifiers stay as escaped
plain text and inherit the `.ve-code-content` color (which the runtime
CSS binds to `--ve-code-variable`). That keeps the tokenizer cheap — no
pass has to enumerate every identifier.

## A1.6 The seven registered languages

| Language | Aliases | Notable features |
|---|---|---|
| `js` | `javascript`, `ts`, `typescript`, `jsx`, `tsx`, `mjs`, `cjs` | One combined table — TS is a JS superset. Triple quote ` ` ` ` for template literals. |
| `python` | `py`, `python3` | Triple-quoted strings carry multi-line state; `match` + `case` keywords. |
| `json` | `json5`, `jsonc` | Strings, numbers, constants, punctuation only — no keywords. |
| `bash` | `sh`, `shell`, `zsh`, `console` | Builtin names (`echo`, `cd`, `printf`) live in `builtinTypes` so they render as the type color. |
| `html` | `xml`, `svg`, `htm` | Tag-aware sub-pass via `tagAware: 'html'`. |
| `css` | `scss`, `less` | Selector-aware sub-pass via `tagAware: 'css'`. |
| `diff` | `patch`, `udiff` | Whole-line role from leading `+` / `-` / `@@`. |

An undeclared block stays plain. The tokenizer **never guesses a
language from content** — explicit declaration only. This is the same
discipline as the runtime's "never decorate something you weren't told
to decorate" invariant.

## A1.7 The stash-and-restore precedence model

A line is tokenized in a FIXED PRECEDENCE ORDER. Each match is replaced
by an opaque placeholder (`<SOH>VCTOK<n><STX>` where SOH/STX are
U+0001 / U+0002 control chars that NEVER appear in source code) and the
rendered token-span HTML is pushed onto a `stash[]`. Because the
rendered span is gone from the working string, a later pass can never
match INSIDE it — the keyword `for` inside a string `"for loop"` is
immune once the string is stashed. A final restore pass expands every
placeholder.

**Precedence (highest first):**
1. comments — keywords inside comments are immune
2. triple-string — Python `"""…"""` before single strings
3. strings — keywords inside strings are immune
4. *(HTML / CSS structural sub-pass — tag names + attributes, or CSS
   selectors → property names)*
5. keywords
6. builtin types
7. constants
8. function calls — bare identifiers followed by `(`
9. numbers
10. operators
11. punctuation

The placeholder bytes are built from `String.fromCharCode(1)` /
`String.fromCharCode(2)` so this source file itself contains no literal
control bytes (which would be invisible / fragile to edit).

## A1.8 The integrity probe — non-negotiable

Highlighting is **decorative**. Source fidelity is **mandatory**.

Every highlighted line is run through an integrity probe that:
1. strips all HTML tags from the rendered string;
2. decodes the three entities the escaper produces (`&amp;` LAST so
   `"&amp;lt;"` decodes to `"&lt;"` not `"<"`);
3. asserts the result byte-matches the original source line.

If the probe fails (a buggy language table, a regex edge case), the
highlight is **discarded** and `escapeHtml(originalLine)` — the plain
but correct line — is returned. A broken language table can never
corrupt or lose source.

The probe uses the DOM (`div.textContent` after `div.innerHTML = html`)
in the browser and a pure-string fallback under Node (the test
harness), so the module needs no DOM to be `require()`-able.

See [integrity-probe.md](./integrity-probe.md) for the full failure-
mode catalog.

## A1.9 Carry state (multi-line constructs)

`highlightBlock(lines, lang)` threads `carry = { inBlock: false,
inTriple: false }` across the loop:

- `carry.inBlock` — a block comment (`/* … */`) opened on line N but not
  closed; line N+1's tokenizer treats everything up to the close
  marker as one comment span and resets the flag.
- `carry.inTriple` — same for Python `"""…"""` strings.

A failed line **still** updates carry (the tokenizer ran), so multi-
line constructs stay consistent even when one line in the middle
plain-fell-back.

## A1.10 Authoring rules consumers MUST follow

| Rule | Why |
|---|---|
| **Author plain-text `<pre><code>`** — no inner spans, no `<br>`, no `&nbsp;` | `initCodeGutter` skips a `<code>` whose children > 0. The runtime + tokenizer own the markup. |
| **Declare the language ONCE** on `<pre>` or `<code>` | `detectLanguage` reads `data-ve-lang` first, then `language-*` / `lang-*` class. Both is fine; conflicting values resolve to the explicit `data-ve-lang`. |
| **Never hand-inject `<span class="ve-tok-*">`** | Defeats the integrity probe; corrupts source. Use the language table, or file a bug. |
| **Trust the fail-soft** | An unknown language → plain text. A failed probe → plain text. NEVER work around it — that path exists for a reason. |
| **Do not set `overflow-x:auto` on a `<pre>`** | Violates the no-nested-scrollbars rule; the page MUST expand. |

## A1.11 The runtime wiring contract

The integration point is `initCodeGutter` (in `scripts/amvcp-
runtime.js`). After it splits the raw source into
`lineSrc[]`, it calls `amvcpCodeHighlight.highlightBlock(lineSrc, lang)`
to get an array of per-line HTML; each line's `.ve-code-content` is
populated with the returned HTML instead of `escapeHtml(lineSrc[li])`.
The language id comes from `amvcpCodeHighlight.detectLanguage(pre)`.

This is **per-line**, not per-block, so:
- the per-line `<span class="ve-code-line">` atoms remain selectable;
- the per-line `--ve-code-indent` hanging-indent var still binds;
- the wrap-marker stripe still paints at the right column;
- drag-paint per-line selection still works;
- the copy button still writes the byte-exact `wrapper.__veSourceText`
  (stashed before the highlighter ran).

## A1.12 Failure modes (all fail-soft)

| Failure | Recovery |
|---|---|
| `text == null` | treated as `''` — empty line, no crash |
| `lang == null` or unknown | `escapeHtml(text)` — plain text |
| Tokenizer throws (regex bug) | caught; `escapeHtml(text)` |
| Probe fails (text mismatch) | `escapeHtml(text)` |
| Block has 0 children → re-wrappable | normal path |
| Block already has children (e.g. authored highlighter spans) | `initCodeGutter` skips it; no gutter, no highlighter |

Every failure path returns a string. NEVER throws. NEVER returns
`undefined`. NEVER loses a character.

## A1.13 Tokens consumed / extended

- **Consumes:** every `--ve-code-<role>` (12 tokens) +
  `--ve-code-diff-*` (4 tints). See
  [token-roles-palette.md](./token-roles-palette.md).
- **Extends (optional engine keys, added by the integration pass):**
  none — this module is a *consumer* of the palette, not a contributor.
  The 12-token palette itself is owned by `amvcp-design-tokens`.
