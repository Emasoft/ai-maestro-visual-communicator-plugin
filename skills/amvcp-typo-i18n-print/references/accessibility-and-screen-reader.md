# Accessibility and screen readers — semantic HTML, contrast, motion

## Table of Contents

- [What it is](#what-it-is)
- [Contract — semantic HTML](#contract--semantic-html)
- [The contrast gates](#the-contrast-gates)
- [`prefers-reduced-motion`](#prefers-reduced-motion)
- [`prefers-contrast`](#prefers-contrast)
- [`prefers-color-scheme`](#prefers-color-scheme)
- [Focus rings — the keyboard contract](#focus-rings--the-keyboard-contract)
- [Skip links — the navigation contract](#skip-links--the-navigation-contract)
- [Alt text — typography's role](#alt-text--typographys-role)
- [Semantic landmarks](#semantic-landmarks)
- [The `aria-label` / `aria-labelledby` contract](#the-aria-label--aria-labelledby-contract)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [When the agent should override](#when-the-agent-should-override)
- [When NOT to override](#when-not-to-override)
- [Verification](#verification)
- [Cross-references](#cross-references)

The typography skill's most important rule is *use semantic HTML*.
Every visual decision (size, weight, leading) is theme-correct and
high-contrast; the screen-reader correctness comes from the *element
choice*. An `<h1>` is announced as a level-1 heading; a `<p>` is
announced as a paragraph; a `<button>` is announced as a button. A
`<div>` is announced as nothing.

This reference describes the typography skill's accessibility
contract — the semantic element ownership, the WCAG contrast gates,
the `prefers-reduced-motion` honour, and the `prefers-contrast` /
`prefers-color-scheme` integration.

## What it is

Web accessibility has FIVE primary readers:

| Reader | Needs |
|---|---|
| **Sighted user without disability** | Visual hierarchy, readable contrast, sensible defaults |
| **Sighted user with low vision** | High contrast, scalable text, no inner scrollers |
| **Sighted user with motion sensitivity** | Honour `prefers-reduced-motion` |
| **Screen-reader user** | Semantic HTML, language declarations, alt text |
| **Keyboard-only user** | Visible focus rings, sensible tab order |

The typography skill addresses ALL FIVE in the contract.

## Contract — semantic HTML

The contract relies on the agent using semantic elements correctly:

| Use | Element | NOT |
|---|---|---|
| Document heading | `<h1>` | `<div class="heading">` |
| Subheading | `<h2>` through `<h6>` | `<div class="subheading">` |
| Paragraph | `<p>` | `<div>` |
| List | `<ul>` / `<ol>` / `<dl>` | `<div>` with bullets |
| Block quote | `<blockquote>` | `<p class="quote">` |
| Pull quote | `<aside class="vc-pullquote">` or `<p class="vc-pullquote">` | (no semantic for pull quotes; both forms are correct) |
| Article | `<article>` | `<div class="article">` |
| Navigation | `<nav>` | `<div class="nav">` |
| Section | `<section>` | `<div class="section">` |
| Code | `<code>` / `<pre>` | `<span class="code">` |
| Caption | `<small>` (in body) / `<figcaption>` (in figure) | `<p class="caption">` |
| Emphasis | `<em>` | `<i>` |
| Importance | `<strong>` | `<b>` |
| Time / date | `<time datetime="…">` | `<span>` |
| Address | `<address>` | `<p>` |

If the agent picks the right semantic element, the typography skill
styles it correctly automatically (the element-level defaults).
If the agent picks a `<div>`, the typography skill cannot help —
the `<div>` has no element-level default.

## The contrast gates

Every text colour must produce sufficient contrast against its
background:

| Text | WCAG 2.2 minimum | WCAG 2.2 enhanced (AAA) |
|---|---|---|
| Body text (`--vc-text-2` and smaller) | 4.5:1 | 7:1 |
| Large text (`--vc-text-4` and larger) | 3:1 | 4.5:1 |
| UI components / focus rings | 3:1 | n/a |

The engine's `--vc-color-*` tokens are designed so EACH theme
(light, dark, and any custom theme) passes the AAA contrast gates.
The engine runs a contrast-check at theme-resolve time; a theme that
fails the gate is REJECTED (fail-fast).

The typography skill does NOT add `color` rules — every `color`
inherits from the engine's `--ve-control-fg` ← `--vc-color-content`
chain. So the typography skill's contract is theme-correct trivially:
the engine's verified contrast carries through every typography
element.

The hint: NEVER add a `color` declaration to typography CSS. The
moment you do, you've opened a contrast-gate exemption that may fail
silently.

## `prefers-reduced-motion`

Users with vestibular sensitivity, ADHD, or motion sensitivity set
`prefers-reduced-motion: reduce` in their OS or browser. The
typography skill's animation contract honours this:

```css
@media (prefers-reduced-motion: reduce) {
  /* No animation, no transition. */
  *, *::before, *::after {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01s !important;
  }
}
```

This is a *blanket* override — every animation is reduced to 10ms
(effectively instant). The animation skill (`amvcp-animation`) is
the owner of detailed motion design; the typography contract just
ensures typography itself doesn't animate when the user opted out.

The typography contract has FEW animations in the first place
(weight changes don't animate, font swaps don't animate). The
`@media (prefers-reduced-motion: reduce)` is *belt-and-braces* — if
a future addition introduces an animation, the override catches it.

## `prefers-contrast`

Users with low vision often set `prefers-contrast: more` to request
high-contrast rendering. The engine emits a separate "high-contrast"
theme variant when the media query matches:

```css
@media (prefers-contrast: more) {
  :root {
    /* Engine emits a higher-contrast --vc-color-* set. */
    /* Typography typically wants slightly heavier weights. */
    --vc-weight-body: 500;        /* push body from 400 to 500 */
    --vc-weight-display: 700;     /* heavier headings */
  }
}
```

The typography skill ships the `--vc-weight-*` overrides; the engine
ships the `--vc-color-*` overrides. Both compose: high-contrast theme
plus heavier weights equals maximum-readability rendering.

The user's `prefers-contrast` setting flows through the engine's
theme resolver — the runtime detects the media query and asks the
engine for the high-contrast variant.

## `prefers-color-scheme`

Users with dark-mode preference set `prefers-color-scheme: dark`. The
engine auto-switches to the dark theme when this matches; the
typography skill is theme-orthogonal (sets no colour), so it inherits
the engine's swap automatically.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Engine emits the dark theme's --vc-color-* set. */
  }
}
```

NO typography rule is inside this media query — the typography
contract is correct in both themes by construction.

## Focus rings — the keyboard contract

Every interactive typography element (`<a>`, button-like elements
with `tabindex`, the decision-mini-pill's radio inputs) MUST have a
visible focus ring on keyboard focus. The contract:

```css
:focus-visible {
  outline: 2px solid var(--vc-color-accent, currentColor);
  outline-offset: 2px;
  border-radius: 2px;
}
```

The `:focus-visible` pseudo-class fires ONLY on keyboard focus, not
on mouse focus. Mouse users don't see the ring (visual noise); keyboard
users always do.

The ring's colour is the engine's accent (themed) with `currentColor`
fail-soft. The 2px outline at 2px offset is the WCAG-recommended
minimum focus-indicator visibility.

NEVER use `outline: none` without a replacement focus indicator —
that breaks keyboard accessibility.

## Skip links — the navigation contract

A "Skip to content" link at the top of every page lets keyboard
users bypass the navigation chrome. The pattern:

```html
<a href="#main-content" class="vc-skip-link">Skip to content</a>
…
<main id="main-content">…</main>
```

```css
.vc-skip-link {
  /* Visually hidden until focused. */
  position: absolute;
  left: -9999px;
  top: 0;
}
.vc-skip-link:focus,
.vc-skip-link:focus-visible {
  /* Become visible on focus. */
  position: fixed;
  left: 1em;
  top: 1em;
  z-index: 1000;
  background: var(--vc-color-bg, white);
  color: var(--vc-color-content, currentColor);
  padding: 0.5em 1em;
  border: 2px solid var(--vc-color-accent, currentColor);
  border-radius: 4px;
}
```

The skip-link is invisible to mouse users (positioned off-screen);
when a keyboard user Tabs from the start of the page, the first focus
brings the skip-link visible, the user presses Enter, and focus jumps
to the main content. Standard accessibility pattern.

## Alt text — typography's role

`<img alt="…">` is the alt-text mechanism for images. The typography
skill does NOT directly handle images, but typography elements
sometimes WRAP images (a `<figure>` with `<img>` and `<figcaption>`).
The contract for `<figure>`:

```css
figure {
  margin: 1.5em 0;
}
figcaption {
  font-size: var(--vc-text-1);
  font-style: italic;
  margin-top: 0.5em;
  /* No color — inherits from --ve-control-fg via theme. */
}
```

The agent MUST set `alt="…"` on every `<img>`. A decorative image
with no semantic value uses `alt=""` (an empty alt — tells the
screen reader "skip this"); a meaningful image uses descriptive alt
text.

The typography skill provides the `<figcaption>` styling, not the
`<img alt>` enforcement (the agent enforces; the engine's audit can
detect missing alt).

## Semantic landmarks

The page should use ARIA landmark elements:

| Element | ARIA role | Use |
|---|---|---|
| `<header>` | banner (if at body root) | Page header |
| `<nav>` | navigation | Navigation menu |
| `<main>` | main | Primary content |
| `<aside>` | complementary | Sidebar |
| `<footer>` | contentinfo (if at body root) | Page footer |
| `<article>` | article | A complete piece of content |
| `<section>` | region (only if `aria-label` set) | A section |

Screen readers announce these landmarks. A page with `<header>`,
`<nav>`, `<main>`, `<footer>` gives the user a navigable structure
("skip to navigation", "skip to main").

The typography skill styles none of these landmarks specifically —
they are layout / structural elements. But the typography skill's
typography contract works correctly inside any of them (semantic
HTML inheritance is uniform).

## The `aria-label` / `aria-labelledby` contract

For elements that lack visible text but need a screen-reader label
(an icon-only button, a decorative chip), use `aria-label`:

```html
<button aria-label="Close dialog">×</button>
```

The screen reader reads "Close dialog button"; the visible glyph is
just "×".

The typography skill doesn't directly involve `aria-*` (those are
accessibility, not typography), but the contract assumes the agent
follows the right ARIA practices.

## Tokens consumed / extended

- **Consumes:** all theme-emitted colour tokens via inheritance.
- **Extends:** nothing.

## Light + dark — orthogonal

Accessibility is theme-orthogonal — the same WCAG gates apply to both
themes. The engine verifies both per-theme.

## When the agent should override

The typography contract is the *baseline*. The agent may add
page-specific overrides:

- A custom focus ring colour (per design language).
- A custom skip-link position.
- Per-element `aria-label` annotations.

Overrides should preserve accessibility — never remove the focus
ring; never set `outline: none` without a visual replacement.

## When NOT to override

- Don't override `prefers-reduced-motion` handling — every animation
  must honour it.
- Don't override the contrast gates — every theme must pass AAA.
- Don't override the language declaration — every page MUST set
  `<html lang>`.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page.
2. Run an accessibility audit (Lighthouse, axe, WAVE) — confirm no
   contrast failures, no missing alt text, no missing labels.
3. Test with a screen reader (VoiceOver / NVDA / JAWS) — confirm
   each landmark is announced, headings have a sensible hierarchy
   (h1 → h2 → h3, no skips).
4. Test with keyboard only (no mouse) — Tab through every interactive
   element; confirm visible focus rings; confirm a skip-link works.
5. Test with `prefers-reduced-motion: reduce` enabled — confirm no
   animations.
6. Test with `prefers-contrast: more` enabled — confirm the page is
   higher-contrast.
7. Test with `prefers-color-scheme: dark` — confirm dark theme
   applies.

## Cross-references

- [language-and-locale.md](./language-and-locale.md) — `<html lang>`,
  the prerequisite for many accessibility features.
- [links-and-anchors.md](../../amvcp-typo-structure/references/links-and-anchors.md) — link focus
  contract.
- [print-and-paged-media.md](./print-and-paged-media.md) — print
  motion disabling parallels reduced-motion.
- `design-tokens` skill — owns the WCAG contrast gates per theme.
- `animation` skill — owns the detailed reduced-motion contract.
