# Empty-state spot illustration

A pattern mined from `02-exploration-visual-designs.html` (variant
B): a small (~120-200px) geometric SVG that anchors the eye and
explains the object model in an empty-state placeholder. Typically
3-8 SVG elements — overlapping rounded rects + a few lines + maybe
a circular "+" button affordance. The opposite of a stock
illustration: minimalist, themable, instantly readable.

## The canonical anatomy

```html
<svg class="empty-state-spot"
     viewBox="0 0 200 160"
     aria-hidden="true">
  <!-- 3 overlapping rounded rects suggesting "stacked cards" -->
  <rect x="50" y="40" width="100" height="60" rx="8"
        fill="none"
        stroke="var(--vc-color-border, #e3dcc9)"
        stroke-width="2"/>
  <rect x="40" y="50" width="100" height="60" rx="8"
        fill="var(--vc-color-surface-sunken, #f1ece0)"
        stroke="var(--vc-color-border-strong, #c9bfa3)"
        stroke-width="2"/>
  <rect x="30" y="60" width="100" height="60" rx="8"
        fill="var(--vc-color-surface, #ffffff)"
        stroke="var(--vc-color-content, #1f1a14)"
        stroke-width="2"/>

  <!-- A circular "+" affordance, suggesting "add another" -->
  <circle cx="155" cy="105" r="14"
          fill="var(--vc-color-accent, #b8861f)"/>
  <line x1="155" y1="98" x2="155" y2="112"
        stroke="var(--vc-color-on-accent, #ffffff)"
        stroke-width="2"
        stroke-linecap="round"/>
  <line x1="148" y1="105" x2="162" y2="105"
        stroke="var(--vc-color-on-accent, #ffffff)"
        stroke-width="2"
        stroke-linecap="round"/>
</svg>
```

3 cards in a stack (depth illusion via offset overlap) + 1 floating
circular "+" button to the right. Total: 6 SVG elements, ~600 bytes
of markup, no images, no fonts, no asset pipeline.

## The visual grammar

Empty-state spots usually combine:

1. **Stacked objects** — multiple rectangles offset by 10-20px each,
   suggesting a collection (cards, items, files).
2. **A "+" or "→" affordance** — implies "you can create / add /
   navigate here".
3. **No text label inside the SVG** — the surrounding HTML provides
   the headline + body text. The SVG is purely the visual anchor.
4. **Hairline strokes** — match the icon-svg's editorial style.
5. **3-4 colors max** — same as the C4 budget (ink, surface, accent,
   maybe one tint).

## When to use

- Empty list state ("No items yet — add one to get started").
- Empty inbox / queue / pipeline ("No tasks").
- First-run experience ("Welcome — let's create your first X").
- Zero-results-found state ("No matches — try a different search").
- Cleared / archived state ("All done — nothing to review").

## When NOT to use

- For a real "loading" state — use a skeleton placeholder or a
  spinner (animation skill).
- For an error state — that's the icon-svg `errorPlaceholder` or a
  custom error illustration (different visual grammar — "broken" vs
  "empty").
- For a hero illustration on a marketing page — use a photographic
  hero or a more elaborate custom SVG.

## How icon-svg can help (or not)

The icon-svg primitive engine doesn't have a "stacked cards spot"
primitive — those compositions are too specific. The HOW for empty-
state spots is HAND-AUTHORED SVG using `--vc-*` tokens, following
the rules above.

For the "+" button affordance specifically, icon-svg's
`shape: hexagon` at small size + a `<text>+</text>` overlay would
work, but a hand-authored `<circle>` + 2 `<line>` (as in the
canonical anatomy) is simpler.

## DESIGN.md tokens to use

- `--vc-color-content` — the foreground card's stroke
- `--vc-color-border` / `--vc-color-border-strong` — background
  cards' strokes (creating depth via stroke darkness ladder)
- `--vc-color-surface` / `--vc-color-surface-sunken` — card fills
  (the foreground card is brightest)
- `--vc-color-accent` — the "+" affordance background
- `--vc-color-on-accent` — the "+" glyph fill

## CSS sizing

```css
.empty-state-spot {
  inline-size: 200px;
  block-size: 160px;
  display: block;
  margin: 0 auto 24px;
}
```

Sized to sit above an empty-state headline + body, centered.

## Common variants

### Single-document spot

```html
<svg class="empty-state-spot" viewBox="0 0 200 160" aria-hidden="true">
  <rect x="70" y="40" width="60" height="80" rx="6"
        fill="var(--vc-color-surface)"
        stroke="var(--vc-color-content)" stroke-width="2"/>
  <line x1="80" y1="60" x2="120" y2="60"
        stroke="var(--vc-color-content-subtle)" stroke-width="2"/>
  <line x1="80" y1="75" x2="115" y2="75"
        stroke="var(--vc-color-content-subtle)" stroke-width="2"/>
  <line x1="80" y1="90" x2="105" y2="90"
        stroke="var(--vc-color-content-subtle)" stroke-width="2"/>
</svg>
```

A single document outline with 3 horizontal "text" lines inside —
the "no items" placeholder.

### Empty inbox

```html
<svg class="empty-state-spot" viewBox="0 0 200 160" aria-hidden="true">
  <!-- Inbox tray -->
  <path d="M30,90 L60,60 L140,60 L170,90 L170,130 L30,130 Z"
        fill="var(--vc-color-surface-sunken)"
        stroke="var(--vc-color-content)" stroke-width="2"/>
  <!-- Tray opening (no items inside) -->
  <line x1="60" y1="90" x2="140" y2="90"
        stroke="var(--vc-color-content-muted)" stroke-width="2"/>
</svg>
```

## What NOT to do

- Do NOT use a photographic image as an empty-state — defeats the
  themable + lightweight goal.
- Do NOT use animated empty-state spots — distracting; let the
  empty state be calm.
- Do NOT include text inside the SVG — text is HTML; SVG is the
  visual anchor.

## Visual verification

In both light AND dark:

- The 3-4 elements compose into a single visual shape (not floating
  fragments).
- The depth illusion reads (the foreground card is clearly
  "closer" than the background cards).
- The accent affordance (if present) is clearly the focal point.
- The whole spot is themable — every fill and stroke uses
  `--vc-*` tokens.
