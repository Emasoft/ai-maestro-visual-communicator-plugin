# CJK typography bridge — what this skill defers to `design-tokens` DT-25

## Table of Contents

- [What it is](#what-it-is)
- [What the typography skill emits](#what-the-typography-skill-emits)
- [What the typography skill DEFERS to DT-25](#what-the-typography-skill-defers-to-dt-25)
- [Scaffold — a CJK-tagged page](#scaffold--a-cjk-tagged-page)
- [Scaffold — mixed Latin / CJK content](#scaffold--mixed-latin--cjk-content)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why this skill doesn't OWN the CJK contract](#why-this-skill-doesnt-own-the-cjk-contract)
- [The bouten / kenten dot pattern](#the-bouten--kenten-dot-pattern)
- [Why `#ff6600` (Claude orange)](#why-ff6600-claude-orange)
- [CJK with `<html lang="zh-Hans">` vs `"zh-Hant">`](#cjk-with-html-langzh-hans-vs-zh-hant)
- [Light + dark — correct for both](#light--dark--correct-for-both)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to use the CJK contract](#when-not-to-use-the-cjk-contract)
- [Verification](#verification)
- [Cross-references](#cross-references)

CJK typography (Chinese, Japanese, Korean) is owned by the
`design-tokens` skill's DT-25 entry — it is a *cross-cutting token
concern* that lives in the engine's token tree, not in the typography
skill's CSS layer. The typography skill's responsibility is to (a)
NOT block CJK content from rendering correctly, (b) emit
language-aware CSS that honours CJK conventions when the page is
tagged with a CJK `lang`, and (c) cross-reference DT-25 from the
typography surface so the agent knows where to look.

This reference documents the CJK *bridge* — what the typography
skill DOES emit for CJK pages, what it DEFERS to DT-25, and how the
two skills compose.

## What it is

CJK scripts (Han characters, Hiragana, Katakana, Hangul) differ from
Latin in ways that affect typography:

| Property | Latin | CJK |
|---|---|---|
| Inter-word spaces | Yes (used for word boundaries) | No (each character is its own "word") |
| Line-break opportunities | At spaces and hyphens | Between any two characters |
| Optimal leading | ~1.55 (Latin) | ~1.8 (CJK, more visual breathing room) |
| Character tracking | 0 (Latin) | ~0.05em (CJK, slight visual padding) |
| Italic | Available for emphasis | Not available; emphasis via *bouten* or *kenten* dots |
| Small caps | Available | Not applicable (no case distinction) |
| Ligatures | Common | Different — Hangul has component ligation, Han has none |
| Font fallback | Generic `serif`, `sans-serif` | Generic `serif` MUST be paired with CJK-aware fallback |

The DT-25 contract in `design-tokens` defines:

- `--cjk-leading` — the leading for CJK content (default 1.8).
- `--cjk-tracking` — the tracking (default 0.05em).
- `--cjk-font-stack` — the font-family stack for CJK (default
  `"Hiragino Sans", "Noto Sans CJK JP", "Source Han Sans", system-ui`).
- `--cjk-emphasis-color` — the colour of bouten dots
  (default `#ff6600`, the Anthropic-Claude orange).

## What the typography skill emits

The typography skill ships a SINGLE CJK-aware rule (extending
`amvcp-typography.css`):

```css
/* For any element tagged with a CJK language. The `:lang()` pseudo
   matches any element whose `lang` attribute or inherited language
   is one of zh, ja, ko (with or without script subtags). */
:lang(zh),
:lang(ja),
:lang(ko) {
  /* DT-25 tokens — read from the engine if emitted, else use
     hardcoded fallbacks matching DT-25's defaults. */
  font-family: var(--cjk-font-stack,
    "Hiragino Sans", "Noto Sans CJK JP", "Source Han Sans", system-ui, sans-serif);
  line-height: var(--cjk-leading, 1.8);
  letter-spacing: var(--cjk-tracking, 0.05em);
}

/* Bouten dots for CJK emphasis — used INSTEAD of italic for
   emphasis in CJK contexts. */
:lang(zh) em,
:lang(ja) em,
:lang(ko) em {
  font-style: normal;                  /* override the Latin italic */
  /* The bouten dot pattern — uses CSS text-emphasis (universal in
     modern browsers since 2019). */
  -webkit-text-emphasis: dot var(--cjk-emphasis-color, #ff6600);
  text-emphasis: dot var(--cjk-emphasis-color, #ff6600);
  text-emphasis-position: over right;
}
```

This is the FULL CJK CSS contract the typography skill ships. Three
properties on `:lang(zh/ja/ko)`, three more on `:lang(zh/ja/ko) em`.

## What the typography skill DEFERS to DT-25

- The actual TOKEN definitions (`--cjk-leading`, `--cjk-tracking`,
  `--cjk-font-stack`, `--cjk-emphasis-color`) — DT-25's engine schema
  extension owns the keys.
- The token VALUES — DT-25 picks them per the catalog (1.8, 0.05em,
  the font stack).
- The runtime's CJK detection and per-language style switching.
- CJK-specific UI affordances (e.g. the *furigana* — small Hiragana
  above kanji for pronunciation; the *ruby* element styling).
- Vertical-writing-mode for traditional CJK (`writing-mode:
  vertical-rl`).

## Scaffold — a CJK-tagged page

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <title>サンプルページ</title>
  <!-- The typography skill's CSS layer (with the :lang() rules)
       takes care of font-family, leading, and tracking for the
       whole page. -->
</head>
<body>
  <h1>サンプルページ</h1>
  <p>これは日本語の本文です。<em>強調</em>はボーテンで表現されます。</p>
</body>
</html>
```

The `<html lang="ja">` triggers the `:lang(ja)` rule. The whole page
gets the CJK font stack, leading, and tracking. The `<em>` inside the
paragraph gets the bouten dot decoration instead of italic.

## Scaffold — mixed Latin / CJK content

```html
<html lang="en">
<body>
  <p>The Japanese phrase <span lang="ja">物の哀れ</span> (mono no aware)
     describes the bittersweet awareness of impermanence.</p>
</body>
</html>
```

The document language is English; the `<span lang="ja">` overrides for
that span. The CJK font and leading apply only inside the span; the
surrounding English prose uses the Latin typography contract.

The transition is visible: the CJK characters render in the CJK font;
the English prose continues in the body face on either side.

## Tokens consumed / extended

- **Consumes:** `--cjk-leading`, `--cjk-tracking`, `--cjk-font-stack`,
  `--cjk-emphasis-color` (all from DT-25).
- **Extends:** nothing.

The DT-25 tokens are added to the engine schema by the `design-tokens`
skill's integration pass; the typography skill's `:lang()` rule uses
them with fail-soft fallbacks (the hardcoded DT-25 defaults inline
in the `var(…, fallback)`).

## Why this skill doesn't OWN the CJK contract

CJK typography is a **horizontal concern** — it touches:
- Fonts (typography).
- Colour (the orange bouten dot).
- Leading and tracking (typography).
- Token system (engine schema).
- Per-language style switching (runtime).

If the typography skill owned the CJK contract end-to-end, the
`--cjk-*` tokens would live in the typography schema, the colour
would be hardcoded here, the runtime would have to know about a
typography-private CJK API, etc.

By owning the CJK contract in `design-tokens` (DT-25), the system
keeps:
- Token definitions in one place (the engine schema).
- Colour token (`--cjk-emphasis-color`) alongside other engine
  colours.
- Typography skill scope-limited (it only emits CSS that READS the
  DT-25 tokens).

This is the canonical multi-skill collaboration pattern.

## The bouten / kenten dot pattern

In CJK typography, emphasis is marked NOT with italic (italic forms
don't exist for Han / Hangul) but with small dots over (or under)
each emphasised character:

```
強調
....         (dots above each character)
```

The CSS `text-emphasis` property (universal since 2019) draws these:

```css
em { text-emphasis: dot; text-emphasis-position: over right; }
```

The typography skill's `:lang(zh/ja/ko) em` rule applies this. For
horizontal writing, `position: over right` (above each character).
For vertical writing (CJK traditional), `position: right` (to the
right of each character).

## Why `#ff6600` (Claude orange)

DT-25's default colour for the bouten dot is `#ff6600` — Anthropic's
Claude orange. The choice is conventional: a *strong* emphasis colour
that doesn't conflict with most page accent colours.

The agent can override per page by setting `--cjk-emphasis-color` in
the DESIGN.md frontmatter or via a `:lang()` overriding rule.

## CJK with `<html lang="zh-Hans">` vs `"zh-Hant">`

The script subtag distinguishes simplified vs traditional Chinese:

- `zh-Hans` → simplified Chinese (mainland, Singapore).
- `zh-Hant` → traditional Chinese (Taiwan, Hong Kong, Macau).

The typography skill's `:lang(zh)` matches BOTH. The browser's CJK
font picker uses the subtag to pick the right glyph variant — Simplified
forms vs Traditional forms — automatically from the same font (e.g.
Noto Sans CJK has both).

For traditional Chinese with vertical writing:

```css
:lang(zh-Hant) {
  writing-mode: vertical-rl;           /* top-down, right-to-left */
  text-orientation: mixed;
}
```

The typography skill does NOT ship `writing-mode: vertical-rl` by
default — it's a per-page editorial decision. The DT-25 contract may
ship it conditionally; consult DT-25.

## Light + dark — correct for both

The CJK `:lang()` rules set `line-height`, `letter-spacing`, and
`font-family` (theme-orthogonal properties). The `text-emphasis`
colour is `--cjk-emphasis-color` — themed in both light and dark
themes by the engine (if DT-25 emits per-theme overrides; otherwise
the default `#ff6600` is used).

## Selection-contract conformance

A CJK-tagged paragraph is the same typography atom as a Latin
paragraph — the `markTypographyAtoms` walker stamps `data-ve-type="type-body"`
regardless of language. The decision-mini-pill works identically.

A `<span lang="ja">` inline does NOT create a separate atom (it's
inline inside the parent paragraph).

## When NOT to use the CJK contract

- A page with only ONE CJK glyph in an otherwise-English context —
  just inline-tag the character: `<span lang="ja">…</span>`. Don't
  set the whole page to CJK.
- A page rendered for export to a non-CJK format (PDF, image) where
  the CJK font may not embed — verify the CJK font is in the output
  format's embedded fonts.
- A page in mixed-CJK content where the languages have differing
  preferences — pick the dominant language and per-element override
  the others.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a CJK page with `<html lang="ja">`.
2. Confirm the font is `Hiragino Sans` (macOS) or the next available
   CJK fallback.
3. Confirm `line-height` is 1.8 (looser than Latin's 1.55).
4. Confirm `letter-spacing` is 0.05em.
5. Confirm an `<em>` inside CJK content renders with bouten dots
   above the characters (orange, `#ff6600` or per DT-25's themed
   value).
6. Render a mixed page (`<html lang="en">` + `<span lang="ja">`);
   confirm only the span gets CJK treatment.
7. Repeat in light + dark themes; confirm rendering correct in both.

## Cross-references

- [language-and-locale.md](./language-and-locale.md) — `<html lang>`
  declaration is the prerequisite.
- `design-tokens` skill DT-25 — the OWNING skill for CJK token
  definitions and runtime integration.
- [font-loading-pairings.md](./font-loading-pairings.md) — the System
  pairing's font-body includes CJK fallbacks implicitly via
  `system-ui` on CJK platforms.
- [emphasis-and-strong.md](./emphasis-and-strong.md) — the Latin
  `<em>` contract; the CJK bouten override is documented here.
