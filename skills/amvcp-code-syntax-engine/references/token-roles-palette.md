# Sub-technique A2 — The 12-token `--ve-code-*` palette

## Table of Contents

- [A2.1 The 12 token roles](#a21-the-12-token-roles)
- [A2.2 The dark-theme defaults](#a22-the-dark-theme-defaults)
- [A2.3 The light-theme mirror — MANDATORY](#a23-the-light-theme-mirror--mandatory)
- [A2.4 The diff tints](#a24-the-diff-tints)
- [A2.5 The 12 class rules](#a25-the-12-class-rules)
- [A2.6 The selection-yield rule (CRITICAL)](#a26-the-selection-yield-rule-critical)
- [A2.7 JetBrains Mono pairing (CB-03 family rule)](#a27-jetbrains-mono-pairing-cb-03-family-rule)
- [A2.8 The verification checklist](#a28-the-verification-checklist)
- [A2.9 Tokens consumed / extended](#a29-tokens-consumed--extended)

The 12 `ve-tok-<role>` CSS classes the tokenizer emits, their
`--ve-code-<role>` token bindings, the light + dark theme mirrors, and
the JetBrains Mono pairing. Implements CB-03 (12 syntax-token CSS
variables + JetBrains Mono dark — PHASE2 backlog §12 P1, classified
IMPROVES because the runtime has gutter+wrap+selection but **no** color
palette today).

## A2.1 The 12 token roles

```
keyword · string · number · comment · type · variable ·
function · constant · operator · punctuation · tag · attribute
```

Each role:
- has a CSS class `.ve-tok-<role>` set by the tokenizer
- consumes a CSS variable `--ve-code-<role>` (the "bridge" var)
- which itself consumes a DESIGN.md engine token `--vc-code-<role>` (the
  "design" var) with a hardcoded fallback

The two-layer indirection (`--ve-code-*` → `--vc-code-*` → fallback)
means: a DESIGN.md with NO `code` group renders fine (fallbacks), AND a
DESIGN.md WITH a `code` group re-themes live without touching the
fallback constants.

## A2.2 The dark-theme defaults

From `scripts/amvcp-code-highlight.css` (the standalone fixture
stylesheet folded into the runtime's `injectStyles()` by the
integration pass):

```css
:root {
  --ve-code-keyword:     var(--vc-code-keyword,     #c98ec0);
  --ve-code-string:      var(--vc-code-string,      #9ece9e);
  --ve-code-number:      var(--vc-code-number,      #d8b46a);
  --ve-code-comment:     var(--vc-code-comment,     #8d8576);
  --ve-code-type:        var(--vc-code-type,        #6ab0cf);
  --ve-code-variable:    var(--vc-code-variable,    var(--ve-control-fg, #ede5dd));
  --ve-code-function:    var(--vc-code-function,    #d8c98a);
  --ve-code-constant:    var(--vc-code-constant,    #c98ec0);
  --ve-code-operator:    var(--vc-code-operator,    #b9b1a3);
  --ve-code-punctuation: var(--vc-code-punctuation, #948c7e);
  --ve-code-tag:         var(--vc-code-tag,         #c98ec0);
  --ve-code-attribute:   var(--vc-code-attribute,   #6ab0cf);
}
```

These are **not** VS Code's defaults — they are calibrated to the
visual-communicator's warm-gold accent + brown body palette so a code
block reads as part of the page, not a foreign island. `keyword` and
`tag` share a hue (purple) because both denote "structural" tokens;
`type` and `attribute` share blue because both denote "what kind of
thing"; `string` is the warmer green that contrasts cleanly with the
accent gold; `number` and `function` share a warm-gold family because
both denote "data values".

## A2.3 The light-theme mirror — MANDATORY

A single-theme visual is a correctness defect (project memory rule).
Every `--ve-code-*` MUST have a `:root[data-ve-theme="light"]` mirror:

```css
:root[data-ve-theme="light"] {
  --ve-code-keyword:     var(--vc-code-keyword,     #9a3e74);
  --ve-code-string:      var(--vc-code-string,      #3f7d4e);
  --ve-code-number:      var(--vc-code-number,      #9a6a1f);
  --ve-code-comment:     var(--vc-code-comment,     #8a8170);
  --ve-code-type:        var(--vc-code-type,        #2c6f8f);
  --ve-code-variable:    var(--vc-code-variable,    var(--ve-control-fg, #1f1a14));
  --ve-code-function:    var(--vc-code-function,    #7a5a14);
  --ve-code-constant:    var(--vc-code-constant,    #9a3e74);
  --ve-code-operator:    var(--vc-code-operator,    #5b5343);
  --ve-code-punctuation: var(--vc-code-punctuation, #7a7363);
  --ve-code-tag:         var(--vc-code-tag,         #9a3e74);
  --ve-code-attribute:   var(--vc-code-attribute,   #2c6f8f);
}
```

The hues are **the same families** as dark — just inverted lightness:
purple-keyword stays purple, green-string stays green, etc. This keeps
syntax meaning consistent across themes (a reader who learns "purple =
keyword" on dark transfers that knowledge to light).

## A2.4 The diff tints

Four tint vars, all built from the semantic color tokens — NEVER
hardcoded red/green:

```css
:root {
  --ve-code-diff-add-bg: var(--vc-code-diff-add-bg,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 22%, transparent));
  --ve-code-diff-del-bg: var(--vc-code-diff-del-bg,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 22%, transparent));
  --ve-code-diff-add-gutter: var(--vc-code-diff-add-gutter,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 60%, transparent));
  --ve-code-diff-del-gutter: var(--vc-code-diff-del-gutter,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 60%, transparent));
}
```

The light-theme mirror lowers the bg tint percent (22% → 16%) and
raises the gutter tint percent (60% → 70%) — the gutter cell needs more
opacity on a bright background to read.

## A2.5 The 12 class rules

```css
.ve-tok-keyword     { color: var(--ve-code-keyword); }
.ve-tok-string      { color: var(--ve-code-string); }
.ve-tok-number      { color: var(--ve-code-number); }
.ve-tok-comment     { color: var(--ve-code-comment); font-style: italic; }
.ve-tok-type        { color: var(--ve-code-type); }
.ve-tok-variable    { color: var(--ve-code-variable); }
.ve-tok-function    { color: var(--ve-code-function); }
.ve-tok-constant    { color: var(--ve-code-constant); }
.ve-tok-operator    { color: var(--ve-code-operator); }
.ve-tok-punctuation { color: var(--ve-code-punctuation); }
.ve-tok-tag         { color: var(--ve-code-tag); }
.ve-tok-attribute   { color: var(--ve-code-attribute); }
```

Only `.ve-tok-comment` carries a `font-style: italic` — a typographic
cue that survives screenshot-comparison even if the user is colour-
blind. Every other role is colour-only (no italic, no underline, no
weight change — those carry semantic meaning in the prose layer).

## A2.6 The selection-yield rule (CRITICAL)

When a code line / block is selected, descendant token spans MUST yield
to the selection's foreground colour so the selection reads clearly:

```css
[data-ve-code-sel]       .ve-tok-keyword,
[data-ve-code-sel-block] .ve-tok-keyword,
.ve-code-line[data-ve-pressed="1"] .ve-tok-keyword,
/* … all 12 roles × all 3 selection markers = 36 selectors … */
{ color: inherit; }
```

The runtime ships the first two markers; Phase 2.5 added
`data-ve-pressed="1"` as the runtime's canonical line-select marker
(`scripts/amvcp-runtime.js → repaintCodeGutters`). The standalone CSS
declares all three so the fixture stays correct regardless of which
marker the runtime version is using.

Without this rule, selected lines look "muddy" — the tokens fight the
selection background tint.

## A2.7 JetBrains Mono pairing (CB-03 family rule)

The runtime's `--ve-mono` family resolves to a JetBrains-Mono-leading
stack via DESIGN.md:

```yaml
typography:
  font-mono: "JetBrains Mono"
```

with the engine emitting `--vc-font-mono: "JetBrains Mono",
ui-monospace, "SF Mono", Menlo, Consolas, monospace`. The runtime's
`--ve-mono` reads from this. JetBrains Mono is the **preferred** code
font (CB-03 entry) because:

- Designed for code reading — wider 0/O distinction, slashed 0
- Variable axis support (`wght` 100-800) — pairs with the variable-
  font tokens
- Ligatures available (`=>`, `===`, `!==`) but disabled by default
  (code-block consumers can opt in via `font-feature-settings: "calt"
  1`)
- Open License — safe to bundle, ship offline, and embed via @font-
  face

Authors who can't ship JetBrains Mono fall through to `ui-monospace`
(macOS Mojave+, iOS 13+, modern Linux), then `SF Mono` (macOS), then
`Menlo` / `Consolas` / `monospace` — every modern reader gets a
high-quality monospace.

## A2.8 The verification checklist

For every new code-display fixture:

- [ ] Open in dark theme — every token role visible (12 roles × 1 sample = 12 colors should differentiate)
- [ ] Toggle to light theme — every token role visible again (12 colors, same families, inverted lightness)
- [ ] Toggle back — no token "lost"
- [ ] Click a line to select it — tokens yield to the selection bg colour (none invisible against the selection tint)
- [ ] Hover a `.ve-code-block` — the 3-state hover ring appears WITHOUT changing token colours
- [ ] Copy the block — the clipboard payload is byte-exact source (no extra characters from token-span text content)
- [ ] On a DESIGN.md without a `code` group — the fallbacks render (page still readable)

See [light-dark-mirror-discipline.md](../../amvcp-code-syntax-chrome/references/light-dark-mirror-discipline.md)
for the full theming verification loop and
[../amvcp-self-debug-rules/SKILL.md](../../amvcp-self-debug-rules/SKILL.md)
for the dev-browser screenshot procedure.

## A2.9 Tokens consumed / extended

- **Consumes (engine — emitted by `amvcp-designmd.js` when a DESIGN.md
  declares a `code` group):** `--vc-code-keyword`, `--vc-code-string`,
  `--vc-code-number`, `--vc-code-comment`, `--vc-code-type`,
  `--vc-code-variable`, `--vc-code-function`, `--vc-code-constant`,
  `--vc-code-operator`, `--vc-code-punctuation`, `--vc-code-tag`,
  `--vc-code-attribute` (12 keys) + `--vc-code-diff-add-bg`,
  `--vc-code-diff-del-bg`, `--vc-code-diff-add-gutter`,
  `--vc-code-diff-del-gutter` (4 keys) = **16 tokens**.
- **Bridge layer (this skill):** `--ve-code-*` (the 12 +  4 diff vars).
  Every other code-display reference reads ONLY the `--ve-code-*` vars,
  never the `--vc-code-*` directly — that indirection is what makes the
  fallback path work.
- **Pairs with:** `--vc-font-mono` (typography family); `--vc-color-
  success` / `--vc-color-danger` (the diff tints' source).
