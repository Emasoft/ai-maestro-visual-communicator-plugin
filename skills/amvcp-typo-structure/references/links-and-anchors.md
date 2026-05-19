# Link typography — anchors, underlines, focus, and the AAA contract

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why `text-underline-offset: 0.2em`](#why-text-underline-offset-02em)
- [Why `text-decoration-skip-ink: auto`](#why-text-decoration-skip-ink-auto)
- [Why `text-decoration-thickness: 1px` (not the default)](#why-text-decoration-thickness-1px-not-the-default)
- [Focus — `:focus-visible` not `:focus`](#focus--focus-visible-not-focus)
- [The visited-state colour — desaturated, not separate](#the-visited-state-colour--desaturated-not-separate)
- [The `.vc-link-quiet` modifier — underline only on hover](#the-vc-link-quiet-modifier--underline-only-on-hover)
- [The `.vc-link-button` modifier — button-shaped link](#the-vc-link-button-modifier--button-shaped-link)
- [The `.vc-link-external` modifier — small "↗" icon](#the-vc-link-external-modifier--small--icon)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Accessibility — the AAA contrast pair](#accessibility--the-aaa-contrast-pair)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to underline](#when-not-to-underline)
- [When the engine has no link token](#when-the-engine-has-no-link-token)
- [Verification](#verification)
- [Cross-references](#cross-references)

Links (`<a href>`) are the most-clicked typographic shape in any
document — they MUST be visually distinct, accessible, and themed
correctly. The typography skill ships an element-level default for
`<a>` plus the `.vc-link-quiet`, `.vc-link-button`, and
`.vc-link-external` modifier classes.

## What it is

An anchor link inside body prose has FIVE states the reader (and the
screen reader, and the keyboard navigator) needs distinct visual cues
for:

| State | Visual cue |
|---|---|
| Resting (unvisited / visited) | Coloured + underlined |
| Hover | Underline thickens / colour shifts |
| Focus (keyboard) | Outline (NOT the default thin browser ring) |
| Active (during click) | Slight colour shift |
| Visited | Slightly desaturated colour (the `:visited` pseudo) |

The typography skill defines all five states in a single
`amvcp-typography.css` block, using `--vc-color-link` and
`--vc-color-accent` from the engine. The contract is designed to
clear **WCAG 2.2 AAA** for both light and dark themes (the contrast
ratio of underline + colour against the body bg is verified by the
engine's contrast gate).

## The contract

```css
/* Resting link — coloured + underlined. */
a {
  color: var(--vc-color-link, var(--vc-color-accent, currentColor));
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;       /* lift the underline off the baseline */
  text-decoration-skip-ink: auto;     /* skip descenders (g, p, q, y) */
  font-weight: inherit;                /* inherits from surrounding context */
}

/* Hover — thicker underline. */
a:hover {
  text-decoration-thickness: 2px;
  /* Optional colour deepening — picks the engine's accent if link
     and accent are distinct, otherwise no visible change. */
  color: var(--vc-color-accent, var(--vc-color-link, currentColor));
}

/* Focus — visible outline for keyboard nav. */
a:focus-visible {
  outline: 2px solid var(--vc-color-accent, currentColor);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Active — during click. */
a:active {
  color: var(--vc-color-accent, currentColor);
}

/* Visited — slight desaturation, theme-correct. */
a:visited {
  color: color-mix(in srgb, var(--vc-color-link, currentColor) 70%, currentColor);
}
```

## Scaffold

```html
<!-- Bare link in body prose. -->
<p>See the <a href="/docs/typography">typography reference</a>.</p>

<!-- External link with hint. -->
<p>Source: <a href="https://example.com/paper" class="vc-link-external">Smith
   et al. 2024</a>.</p>

<!-- Quiet link — only underlined on hover. -->
<p>Tagged <a href="#archive" class="vc-link-quiet">archive</a>.</p>

<!-- Button-shaped link. -->
<a href="/start" class="vc-link-button">Start the tutorial</a>
```

## Tokens consumed / extended

- **Consumes:** `--vc-color-link`, `--vc-color-accent`.
- **Extends (added to engine schema by the integration pass):**
  `--vc-color-link` (string, hex). When the engine emits both
  `--vc-color-link` and `--vc-color-accent`, links use the link
  colour; when only accent is emitted, links fall back to accent.

The `--vc-color-link` is a NEW token. The engine's `design-tokens`
section is expected to grow this entry; the typography layer's
fallback to `--vc-color-accent` keeps every existing DESIGN.md
correct without the new key.

## Why `text-underline-offset: 0.2em`

The default underline sits *on* the text baseline — it crowds against
descenders (g, p, q, y), reads as visually heavy, and is the single
most common cause of "ugly link" complaints.

Offsetting the underline by `0.2em` lifts it just below the descender
zone. The link reads cleaner; descenders breathe.

This is a *recent* CSS feature (universal since 2022). Older browsers
ignore it — the underline reverts to the default position, which is
still correct (just slightly heavier).

## Why `text-decoration-skip-ink: auto`

When the underline crosses a descender (the `g` in "tag", the `p` in
"page") the browser can either:

- (`skip-ink: none`) — draw through the descender, producing a visible
  glyph-vs-underline collision.
- (`skip-ink: auto`) — interrupt the underline so it visually skips
  the descender.

`skip-ink: auto` is the cleaner choice. Universal in modern browsers.

## Why `text-decoration-thickness: 1px` (not the default)

The CSS default for `text-decoration-thickness` is "auto", which
means "the browser picks based on the font and size". Different
browsers pick differently — Firefox draws thicker, Safari thinner.
Locking to `1px` produces a consistent visual weight.

On hover, the thickness doubles to `2px` — the increased weight is
the affordance signal ("the underline is reacting to your hover").

## Focus — `:focus-visible` not `:focus`

`:focus` fires on ANY focus, including focus from a mouse click. The
mouse focus ring is visual noise — the user already knows where they
clicked.

`:focus-visible` fires only on **keyboard** focus (Tab navigation).
The keyboard user *needs* the visible ring; the mouse user doesn't.

This is the canonical accessibility pattern: visible focus ring for
keyboard navigation, no ring for mouse clicks. The typography skill
ships only `:focus-visible` — never `:focus` — for this reason.

## The visited-state colour — desaturated, not separate

The contract uses `color-mix(in srgb, var(--vc-color-link) 70%,
currentColor)` for `:visited` — a 70% blend of link colour with
inherited text colour, producing a slightly desaturated visited
state.

This is the only `color-mix` use in the typography contract. It is
fail-soft: a browser without `color-mix` ignores the rule and visited
links render at the resting colour (still correct, just no visited
distinction).

`color-mix` is universal in browsers from late 2023.

## The `.vc-link-quiet` modifier — underline only on hover

For lists of inline tags / chip-style links / sidebar TOC entries
where the prose density is high and underlined links would visually
saturate the page:

```css
.vc-link-quiet {
  text-decoration: none;
}
.vc-link-quiet:hover {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.vc-link-quiet:focus-visible {
  outline: 2px solid var(--vc-color-accent, currentColor);
  outline-offset: 2px;
}
```

Use `.vc-link-quiet` ONLY when:

- The link is clearly visually distinguished by surrounding context
  (e.g. a sidebar item where the surrounding background tints it).
- The link is decorative (a "see also" footer chip).

NEVER use `.vc-link-quiet` in body prose — the body's default link
underline is required for accessibility (a link in body prose must
be distinguishable from non-link text WITHOUT colour alone, per WCAG
1.4.1).

## The `.vc-link-button` modifier — button-shaped link

For call-to-action links that should look like buttons (typically
near the top or bottom of a deliverable):

```css
.vc-link-button {
  display: inline-block;
  padding: 0.5em 1em;
  background: var(--vc-color-accent, currentColor);
  color: var(--vc-color-on-accent, var(--vc-color-bg, white));
  text-decoration: none;
  border-radius: 6px;
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  font-family: var(--vc-font-body, inherit);
}
.vc-link-button:hover {
  /* Slightly darker — uses the engine's hover-state token if
     defined, else a darken via color-mix. */
  background: var(--vc-color-accent-hover,
    color-mix(in srgb, var(--vc-color-accent, currentColor) 90%, #000));
}
.vc-link-button:focus-visible {
  outline: 2px solid var(--vc-color-accent, currentColor);
  outline-offset: 4px;
}
```

The button-link has no underline (the button shape carries the
affordance). The text colour is `--vc-color-on-accent` — the
contrast pair against the accent background. The engine emits both
tokens together (the accent + on-accent pair).

## The `.vc-link-external` modifier — small "↗" icon

A *visual* hint that the link leaves the document. The trailing
`::after` glyph:

```css
.vc-link-external::after {
  content: "↗";
  font-size: 0.7em;
  vertical-align: super;
  margin-left: 0.15em;
  text-decoration: none;
  display: inline-block;
}
```

The agent applies `.vc-link-external` to outbound links manually —
the typography skill does not auto-detect "external" (that would
require a URL parse). The trailing arrow is the canonical visual
cue.

## Light + dark — fully covered

The contract uses ONLY `--vc-color-link` and `--vc-color-accent` (with
fall-through to `currentColor`). The engine emits per-theme values
for both; the contract is correct in both themes by construction.

The `:focus-visible` outline uses the engine's accent colour — themed
correctly. NEVER use `outline: 2px solid blue` or any hardcoded
outline colour.

The `:visited` `color-mix` blends with `currentColor` — themed correctly
(the visited link in light is light-desaturated; the visited link in
dark is dark-desaturated).

## Accessibility — the AAA contrast pair

The `--vc-color-link` token must produce a contrast ratio ≥7:1 against
the body background (WCAG AAA for body text size). The engine's
contrast gate verifies this per theme.

If the engine emits a link colour that produces <7:1 contrast, the
gate fails and the agent must pick a different accent. The typography
skill does not work around insufficient contrast — fail-fast.

The underline thickness and offset don't carry contrast (the underline
is the same colour as the text). The accessibility comes from colour
plus underline, both visible together.

## Selection-contract conformance

An `<a>` is NOT itself a typography atom — it is *inline* inside a
parent atom (a `<p>`, `<li>`, `<h2>`). The parent atom owns the
decision-mini-pill; the link is part of the parent's content.

Exception: a standalone `<a class="vc-link-button">` (a CTA outside
prose) IS an atom — the `markTypographyAtoms` walker stamps it as
`data-ve-type="type-link-button"`.

## When NOT to underline

- Inside a navigation menu — the menu items' container colour /
  background already signals "interactive". An underline adds visual
  noise.
- Inside a footer with many links — same reason.
- On a hover-only `.vc-link-quiet`.

In all those cases, the link MUST still have a *visible focus ring*
on keyboard focus (the `:focus-visible` outline is non-negotiable for
accessibility) — `.vc-link-quiet` preserves the focus ring.

## When the engine has no link token

If `--vc-color-link` is unset (the engine's `design-tokens` does NOT
emit a link colour), the contract falls back to `--vc-color-accent`.
If `--vc-color-accent` is also unset, the contract falls back to
`currentColor` (the inherited text colour) — which means the link is
NOT visually distinct from surrounding text by colour alone.

In this last case, the underline is the ONLY affordance — which is
WCAG-compliant (underline alone IS a sufficient visual distinction)
but reads as visually flat. Pick at least one of
`--vc-color-link` / `--vc-color-accent` in DESIGN.md.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with one default link, one
   `.vc-link-quiet`, one `.vc-link-button`, one `.vc-link-external`.
2. Confirm: the default link is underlined, the underline offsets
   below descenders, the colour comes from `--vc-color-link`.
3. Hover each link with the mouse. Confirm the underline thickens
   on hover.
4. Tab through the links with the keyboard. Confirm each gets a
   visible focus ring (the engine's accent colour, 2px offset).
5. Repeat the above in the dark theme. Confirm the colours adapt.
6. Run the engine's contrast gate. Confirm link colour vs body bg
   passes AAA.

## Cross-references

- [tri-font-stack-anthropic.md](../../amvcp-typo-foundation/references/tri-font-stack-anthropic.md) — the
  body face links inherit from.
- [semantic-hierarchy.md](../../amvcp-typo-foundation/references/semantic-hierarchy.md) — the body role
  the link sits inside.
- `design-tokens` skill — owns `--vc-color-link`, `--vc-color-accent`,
  `--vc-color-on-accent`, `--vc-color-accent-hover`. The contrast
  gate verifies AAA for each.
- `interactive-controls` skill — owns full button + form styling;
  this reference is the *typographic* button-link only.
