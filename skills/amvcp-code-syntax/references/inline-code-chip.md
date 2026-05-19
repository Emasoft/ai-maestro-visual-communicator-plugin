# Sub-technique C2 — Inline `<code class="inline">` chip

## Table of Contents

- [C2.1 What it does](#c21-what-it-does)
- [C2.2 The markup](#c22-the-markup)
- [C2.3 The CSS](#c23-the-css)
- [C2.4 The shrink-against-prose rule](#c24-the-shrink-against-prose-rule)
- [C2.5 The `white-space: nowrap` rule](#c25-the-white-space-nowrap-rule)
- [C2.6 When to use vs the inline 4-class hand-wrap vs a full block](#c26-when-to-use-vs-the-inline-4-class-hand-wrap-vs-a-full-block)
- [C2.7 Common chip contents](#c27-common-chip-contents)
- [C2.8 Accessibility](#c28-accessibility)
- [C2.9 Don't overuse](#c29-dont-overuse)
- [C2.10 Composition with the prose-pages skill](#c210-composition-with-the-prose-pages-skill)
- [C2.11 Tokens consumed](#c211-tokens-consumed)
- [C2.12 Don't override](#c212-dont-override)

The mono-bg-pill inline code mention pattern. Mined from `12-incident-
report` + every demo file — the standard for referring to a function,
filename, command, identifier, or short code fragment inside flowing
prose.

## C2.1 What it does

Renders a tight chip around mono-text in a paragraph:
`<code class="inline">useDebounce</code>` renders as a soft-bg
rounded rectangle with mono-font interior — visually distinct from
the surrounding sans-text without breaking the line height.

The most common code-highlighting need on any AMVCP page (PR review,
incident report, explainer, doc) is NOT a full code block — it's
inline mentions of identifiers and paths. This chip is the answer.

## C2.2 The markup

```html
<p>The <code class="inline">useDebounce</code> hook composes with
   <code class="inline">useQuery</code> to deduplicate calls.</p>

<p>Run <code class="inline">npm run build</code> first, then check
   <code class="inline">dist/index.js</code> exists.</p>
```

Notes:
- `<code>` is the semantically correct element — not `<span>`, not
  `<kbd>`, not `<samp>`. (Use `<kbd>` for KEYS the user presses;
  `<samp>` for SAMPLE OUTPUT only.)
- `class="inline"` selects the visual treatment. Without the class,
  `<code>` inherits whatever the runtime's plain `code` rule does
  (typically just `font-family: var(--vc-font-mono)`).

## C2.3 The CSS

```css
code.inline {
  font-family: var(--vc-font-mono);
  font-size: 0.92em;                   /* slight shrink against the sans surroundings */
  background: var(--vc-color-neutral-100, #f2efe7);
  color: var(--vc-color-neutral-800, #1f1a14);
  padding: 1.5px 5px;
  border-radius: 4px;
  white-space: nowrap;                 /* an identifier never breaks mid-word */
  border: 1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent);
}
```

Light + dark mirror:

```css
:root[data-ve-theme="light"] {
  /* no override — the defaults already work on light */
}
:root {
  --vc-color-neutral-100: #2a2620;
  --vc-color-neutral-800: #ede5dd;
}
```

The dark-theme bg is a slightly-warmer brown-black; the light-theme bg
is a slightly-warmer cream. Both ≥ AA contrast against the surrounding
prose color.

## C2.4 The shrink-against-prose rule

`font-size: 0.92em` (not `1em`, not a fixed `--vc-text-*`). Why:

- Sans body text at the surrounding paragraph's size visually OVERSIZES
  monospace at the same point size (mono characters are wider on
  average than sans). 0.92em matches optical density.
- It's `em`, not `rem`, so the chip scales with the surrounding text
  — if the paragraph is in a larger font (a callout), the chip scales
  too.

The 0.92 ratio is from the html-effectiveness catalog (verified across
all 21 demos that use the pattern). Don't tune per-page.

## C2.5 The `white-space: nowrap` rule

An identifier like `getUserPreferences` should NEVER wrap mid-word in
the middle of a paragraph. The chip's `nowrap` enforces this. If the
chip text is very long AND the paragraph is narrow, the chip pushes
the line break to its boundary (the next word wraps to a new line)
— acceptable.

If the chip content IS allowed to wrap (e.g. a long URL inside a chip
is a rare case), use `<code class="inline inline-wrap">` and a
matching CSS rule that drops `white-space: nowrap`. The discipline:
opt out explicitly, don't change the default.

## C2.6 When to use vs the inline 4-class hand-wrap vs a full block

| Need | Pattern |
|---|---|
| 1-3 words of code inside a paragraph | `code.inline` chip |
| 1 line of code (a single statement) | `code.inline` chip (acceptable) OR a single-line `<pre><code class="language-x">…</code></pre>` (when the line is the focus) |
| 2-10 lines of illustrative code | `pre[data-ve-no-gutter]` + hand-wrapped 4-class spans (see [inline-4class-handwrap.md](./inline-4class-handwrap.md)) |
| ≥ 10 lines of real code | Full `<pre><code class="language-x">` (the JS tokenizer takes over) |

The chip is the LIGHTEST option — use it whenever possible. Every full
code block is a visual rest-stop the reader has to context-switch
into; inline chips keep the reader's reading flow.

## C2.7 Common chip contents

| Content type | Example | Notes |
|---|---|---|
| Function / hook / class name | `useDebounce`, `Promise.all`, `HTMLElement` | Most common. |
| File path | `src/auth/middleware.ts`, `dist/index.js` | Use the chip for file mentions in prose; use [code-block-with-file-path.md](./code-block-with-file-path.md) for block-attached file labels. |
| Shell command | `npm run build`, `git status` | Use the chip; for full shell sessions, use a `<pre><code class="language-bash">` block. |
| Property / token name | `--vc-accent`, `data-ve-id` | The chip is fine. |
| Boolean / number value | `true`, `42`, `null` | The chip is fine for emphasis; bare text is fine if no emphasis is needed. |
| URL | `https://example.com/api/x` | Use `<a>` for actual links; use the chip when the URL is BEING DISCUSSED (not navigated to). |
| Keyboard key | `⌘ Shift Z` | Use `<kbd>`, NOT `<code class="inline">` — `<kbd>` is semantically right for keys. |
| Sample output | `Error: file not found` | Use `<samp>`, NOT `<code class="inline">` — `<samp>` is semantically right for output. |

## C2.8 Accessibility

`<code>` already conveys "this is code" to screen readers. The chip's
visual treatment is purely visual; no `aria-label` is needed.

Don't wrap the chip in an `<a>` unless the chip IS a link (rare). If
the chip mentions a file the reader can jump to, prefer prose +
explicit "see " + `<a>` rather than making the chip itself clickable
— ambiguous click semantics.

## C2.9 Don't overuse

A paragraph with 5+ inline chips reads as "fragmented" — every chip is
a visual rest-stop. If a paragraph genuinely needs 5+ mentions, refactor:
- Pull the list out into a `<ul>` (one chip per `<li>`).
- Or move the code into a full block where the identifiers are visible
  in context.

The chip is for OCCASIONAL mentions. A code-dense paragraph is a
formatting problem the chip can't solve.

## C2.10 Composition with the prose-pages skill

The chip is shared between this skill and `amvcp-prose-pages`. The
canonical CSS lives in `amvcp-typography` (which both skills depend
on). This reference documents the chip from the code-highlight
perspective; the prose-pages reference covers the chip from the prose-
authoring perspective.

A page that loads `amvcp-typography` automatically gets the chip CSS
— no per-page snippet needed.

## C2.11 Tokens consumed

- `--vc-font-mono` — the mono font
- `--vc-color-neutral-100` / `-800` — chip bg / chip fg
- `--ve-accent` — the soft border tint (via `color-mix(... 16% ...)`)

## C2.12 Don't override

Avoid:
- Per-page rules that change `code.inline` bg / fg / padding — the
  visual identity is shared.
- Removing `white-space: nowrap` for "consistency" — identifier wrap
  in mid-paragraph is the regression.
- Using `<span class="inline">` instead of `<code class="inline">` —
  the `<code>` semantic IS the point.
