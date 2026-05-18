# Animated link underline — `.va-link`

## Table of Contents

- [The contract](#the-contract)
- [The CSS](#the-css)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When to use](#when-to-use)
- [Why a left-grow (and not center-out)?](#why-a-left-grow-and-not-center-out)
- [Underline thickness](#underline-thickness)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Why standard easing, not decel?](#why-standard-easing-not-decel)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Mined pattern note: hover lift on cards (`index.html`, `06`)](#mined-pattern-note-hover-lift-on-cards-indexhtml-06)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)

A CSS-only underline that grows from the left on hover or focus.
Built from a `currentColor` gradient so it inherits the text's
color — themed by construction, no `--vc-color-*` reference
needed.

## The contract

```html
<a href="…" class="va-link">a link with an animated underline</a>
```

The underline is RENDERED via `background` — not via
`text-decoration: underline`. This lets the underline be a thin
2px solid line that animates its width without dragging the line-
height around (which `text-decoration` would do).

## The CSS

```css
.va-link {
  background: linear-gradient(currentColor, currentColor)
              no-repeat 0 100%;
  background-size: 0% 2px;
  transition: background-size var(--vc-duration-normal, 200ms)
              var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1));
}

.va-link:hover, .va-link:focus-visible {
  background-size: 100% 2px;
}

@media (prefers-reduced-motion: reduce) {
  .va-link { transition: none; }
}
```

Four implementation details:

1. **`linear-gradient(currentColor, currentColor)`** — a "fake
   solid color" via a gradient. CSS doesn't have a single-color
   background image primitive, so a gradient from a color to
   itself produces a solid block. Using `currentColor` means the
   block matches the text color — when the link's text is gold,
   the underline is gold; when the text is white, the underline is
   white. No per-theme override needed.

2. **`no-repeat 0 100%`** — positions the gradient at the
   BOTTOM-LEFT (0% horizontal, 100% vertical) and does not repeat
   it. This sits the underline at the BASELINE of the text.

3. **`background-size: 0% 2px`** — the underline starts at 0% width,
   2px tall. On hover, it animates to 100% width, 2px tall — a
   left-to-right grow.

4. **`:focus-visible` matches `:hover`** — keyboard users tabbing
   to the link see the same underline animation as mouse users
   hovering. Without `:focus-visible`, keyboard users would have
   no affordance that they had selected the link.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-normal` (200ms default) | transition duration |
| `--vc-easing-standard` (cubic-bezier ease-in-out) | the round-trip curve (hover-in / hover-out symmetric) |

The underline COLOR is NOT tokenized — it's `currentColor`. The
link is themed by inheriting the text color.

## When to use

- **Inline text links** — the canonical hover affordance for
  links inside prose. Replaces the default browser underline.
- **Navigation menu items** — for primary nav links that should
  emphasize on hover without a heavy treatment.
- **Footer / utility links** — subtle hover for low-emphasis
  links.

When NOT to use:
- **Buttons styled as links** — buttons have their own hover
  treatments (background change, lift); a button shouldn't have a
  bottom underline grow.
- **Links inside dense lists** (table cells, breadcrumbs) — the
  underline animation can feel busy if many links are close
  together; consider a single static treatment.
- **Decorative/icon links** — if the link's content is an icon,
  there's no text for the underline to underline.

## Why a left-grow (and not center-out)?

The default grow direction is LEFT-TO-RIGHT (matching the
reading direction). This is the natural "the underline is being
drawn" cue — feels like the eye is being led.

For RTL (right-to-left languages), the same code produces a
right-to-left grow naturally (the `background-position: 0 100%`
becomes the right edge in RTL contexts via the
`background-position-x` logical mapping in modern browsers). If
that doesn't work in your locale, override with:

```css
.va-link { background-position: right 0 bottom 0; }
[dir="rtl"] .va-link { background-position: left 0 bottom 0; }
```

A center-out grow is possible but unusual:

```css
.va-link-center {
  background-position: 50% 100%;
  background-size: 0% 2px;
}
.va-link-center:hover { background-size: 100% 2px; }
```

Center-out reads as "the underline is being SHOT outward from the
center". Slightly more playful but less natural — reserve for
playful contexts.

## Underline thickness

The default is 2px — visible on retina and standard displays. For a
heavier emphasis use 3px:

```css
.va-link--heavy { background-size: 0% 3px; }
.va-link--heavy:hover { background-size: 100% 3px; }
```

For a lighter touch use 1px (visible only on retina; standard
displays may render it as anti-aliased grey):

```css
.va-link--thin { background-size: 0% 1px; }
.va-link--thin:hover { background-size: 100% 1px; }
```

The skill ships only the 2px default — variants are author-extended.

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-link { transition: none; }
}
```

The substitute is `transition: none` — the underline APPEARS at
full width INSTANTLY on hover. No grow animation; the user gets
the same affordance (the underline appears) without the motion.

Meaning preserved (the link has an underline on hover) without
the motion (the grow). The `:hover` rule still applies the
`background-size: 100% 2px`; the `transition: none` just makes the
change instantaneous.

## Why standard easing, not decel?

The underline is a round-trip animation — on hover it grows in,
on un-hover it shrinks back. A standard ease-in-out curve is the
right pick for a round-trip (decel would feel right for the grow
but wrong for the shrink).

## Selection + comment + decision integration

The link itself is NOT stamped as a content atom — `.va-link` is a
text decoration, not a comment-target. The comment-able atom is
the SURROUNDING content (paragraph, card, section) that contains
the link.

If the link is meant to be its own comment-target (e.g. a single-
link card), wrap it in a `[data-va-reveal]` section and the
section becomes the atom.

## Mined pattern note: hover lift on cards (`index.html`, `06`)

The html-effectiveness mining catalog notes a "hover lift on
cards" pattern:

```css
.ve-card {
  transition: transform 150ms,
              box-shadow 150ms,
              border-color 150ms;
}
.ve-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(20, 20, 19, 0.10);
  border-color: var(--vc-color-slate);
}
```

This is a sister pattern to the link underline — a CSS-only hover
treatment. The skill does NOT ship a `.ve-card` class (that lives
in the layout skill); but the pattern is canonical for any
hoverable card. Reference here: the same `--vc-duration-normal`
token would feed both, keeping link and card hover timings in
sync.

## Diagnostics

- **Underline doesn't appear on hover** → check the gradient
  `background-size: 0% 2px` is not overridden by another rule.
  The `:hover` selector should fire and change the size to
  `100% 2px`.
- **Underline color doesn't match text** → `currentColor` should
  inherit the active text color. If the link is inside an element
  with a `color:` override, the underline matches that override
  (correct).
- **Focus has no underline** → `:focus-visible` is missing from the
  selector. Confirm the CSS rule lists both `:hover` and
  `:focus-visible`.
- **Underline drags the baseline up/down** → you're using
  `text-decoration` somewhere else; this rule uses `background`,
  which doesn't affect line-height.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-link` in the viewport.
2. Move the mouse to hover the link via `page.mouse.move(x, y)`
   with `{steps: 8}` to simulate a real mouse path. **Programmatic
   click bypasses the hover state and won't trigger the
   animation.**
3. Screenshot at t=0, 100ms, 200ms after hover-in. Should see
   the underline growing left-to-right.
4. Move the mouse off via `page.mouse.move(0, 0, {steps: 8})`.
5. Screenshot at t=200ms after hover-out. Should see the
   underline shrunk back to 0%.
6. Tab to the link via `page.keyboard.press('Tab')`. Confirm the
   underline appears (via `:focus-visible`).
7. With `prefers-reduced-motion: reduce`, repeat hover. Underline
   should snap to full width instantly (no grow visible).
