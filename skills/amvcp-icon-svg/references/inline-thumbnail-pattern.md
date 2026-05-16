# Inline thumbnail SVGs — shared-class catalogue pattern

A density-maximizing pattern mined from the catalogue index of the
HTML-effectiveness mining reference (`10-svg-illustrations.html` /
`index.html`): every catalogue card has a tiny inline SVG thumbnail
(120 x 80 viewBox), and all thumbnails on the page share ONE
stylesheet of compact class names (`.st` / `.fl` / `.cl` / `.ol` /
`.oa` / `.sl` / `.wh` / `.ln` / `.lc` / `.da`). The result: 20+
visually varied thumbnails in a tiny CSS budget.

## The pattern

```html
<style>
  .thumb {
    inline-size: 120px;
    block-size: 80px;
    display: block;
  }
  /* 1-2 char class names — gold for SVG inline reuse */
  .thumb .st { stroke: var(--vc-color-content);
               stroke-width: 1.5; fill: none; }
  .thumb .fl { fill: var(--vc-color-accent); }
  .thumb .cl { fill: var(--vc-color-info); }
  .thumb .ol { fill: var(--vc-color-success); }
  .thumb .oa { fill: var(--vc-color-warning); }
  .thumb .sl { stroke: var(--vc-color-content-muted); }
  .thumb .wh { fill: var(--vc-color-surface); }
  .thumb .ln { stroke-linecap: round;
               stroke-linejoin: round; }
  .thumb .lc { font: 600 10px var(--vc-font-body); }
  .thumb .da { stroke-dasharray: 4 3; }
</style>

<div class="catalogue">
  <a class="card" href="/icon-svg/process">
    <svg class="thumb" viewBox="0 0 120 80">
      <rect class="st ln" x="20" y="20" width="80" height="40" rx="6"/>
    </svg>
    <span>Process</span>
  </a>
  <a class="card" href="/icon-svg/database">
    <svg class="thumb" viewBox="0 0 120 80">
      <path class="st cl ln" d="M20,30 A40,8 0 0,0 100,30
                                 A40,8 0 0,0 20,30 L20,55
                                 A40,8 0 0,0 100,55 L100,30"/>
    </svg>
    <span>Database</span>
  </a>
  <a class="card" href="/icon-svg/decision">
    <svg class="thumb" viewBox="0 0 120 80">
      <polygon class="st oa ln"
               points="60,15 105,40 60,65 15,40"/>
    </svg>
    <span>Decision</span>
  </a>
  <!-- ... 17 more thumbnails ... -->
</div>
```

The CSS is ~20 lines; the 20 thumbnails each use 1-3 SVG elements
referencing the shared classes. Total CSS+HTML for the catalogue:
~600 bytes per thumbnail (vs ~150 bytes of styling per thumbnail
without shared classes, or ~3KB if each had a full inline `<defs>
<style>`).

## Why short class names

Single-character class names (`.st`, `.fl`, `.cl`) are unusual in
production CSS — they conflict with utility class systems and obscure
meaning. But INSIDE a tightly-scoped `.thumb` selector, they're:

1. **Tiny** — `.st` is 3 bytes; `.stroke-content` is 16 bytes. 20
   thumbnails using `class="st cl"` save ~400 bytes vs
   `class="stroke-content cluster-fill"`.
2. **Scoped** — `.thumb .st` only matches inside `.thumb`; no
   collision with the rest of the page.
3. **Documented inline** — the short names live next to the long
   meaning in the same CSS file; reading the CSS is the docs.

Use this pattern ONLY for catalogue thumbnails or tight inline-SVG
groupings. For general purposes, prefer the meaningful class names
icon-svg uses (`.isvg-shape`, `.isvg-frame--ios`, etc.).

## Cross-skill seam — gallery indexes

A pattern useful for:

- An icon-svg primitive gallery page (showing every
  process/database/decision/external/network at a glance).
- A logo-block catalogue (showing all 6 logo kinds with thumbnails).
- A shape primitive gallery (the 6 shapes).
- A device-frame chooser (4 thumbnails: ios/android/mac/browser).

The visual-communicator runtime's auto-generated docs (if any) could
use this for the per-skill index page.

## DESIGN.md tokens consumed

- `--vc-color-content` — stroke base
- `--vc-color-accent` / `--vc-color-info` / `--vc-color-success` /
  `--vc-color-warning` / `--vc-color-content-muted` — fills
- `--vc-color-surface` — backgrounds
- `--vc-font-body` — labels

All themed; the catalogue restyles on theme toggle.

## When to use

- A "browse the icon system" page (gallery / catalogue).
- A picker UI (the user clicks a thumbnail to insert that primitive
  into their document).
- An admin panel showing every available primitive at once.
- A docs page with visual previews.

## When NOT to use

- For a single hero icon — use the full primitive directly.
- For a chart with many similar thumbnails — that's a `chart` skill
  small-multiples grid.
- For arbitrary user-uploaded SVGs — the shared-class pattern only
  works when YOU author every thumbnail.

## What NOT to do

- Do NOT use the short class names OUTSIDE the catalogue scope —
  collisions destroy meaning.
- Do NOT use the pattern for a single thumbnail — the budget savings
  are amortized over many thumbnails.
- Do NOT skip the scoping (`.thumb .st` not `.st`) — global
  one-char classes are an accessibility / maintenance nightmare.

## Visual verification

Render a 20-thumbnail catalogue. Confirm:

- All thumbnails appear with their primitives clearly readable at
  120x80 pixels.
- The shared classes apply consistently (an `.st` class always
  produces the same stroke).
- The catalogue restyles on theme toggle (every thumbnail uses
  `--vc-*` tokens).
- The page byte size is reasonable (the shared `<style>` block + 20
  small SVGs should total under ~10KB of HTML).
