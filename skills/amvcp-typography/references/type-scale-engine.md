# Sub-technique A — Fluid type-scale engine

The fluid `clamp()` type scale + the four named modular-scale systems +
the display-tier optical correction. Merges TY-01 (canonical `clamp()`
scale), TY-02 (4 modular-scale systems) and TY-08 (extreme negative
tracking at large sizes).

## A.1 What it does

The DESIGN.md engine ships a **static** `--vc-text-<i>` px scale (the
`typography.scale` array). This skill's CSS layer (`amvcp-typography.css`)
*re-defines* `--vc-text-<i>` on `:root[data-ve-type-scale]` as a
`clamp()` expression whose preferred term tracks the viewport and whose
upper bound is anchored to the engine's px value. Net effect: the
DESIGN.md `typography.scale` array stays the source of truth for the
**anchor** sizes; the fluid layer makes them **responsive**.

The fluid layer is **opt-in**: absent the `data-ve-type-scale` attribute
on `<html>`, the engine's static px scale is used unchanged. Fail-soft.

## A.2 The clamp() machinery

Each step is `clamp(min, preferred, max)`:

- **max** — `var(--vc-text-<i>-max, <literal>)`. The JS calculator
  (`amvcp-typography.js` → `applyScaleSystem`) mirrors every resolved
  `--vc-text-<i>` into a sibling `--vc-text-<i>-max`, so the upper bound
  exactly equals the DESIGN.md anchor. When the calculator is absent,
  the `<literal>` fallback — the engine's DEFAULT scale
  (`12/14/16/20/24/32/48`) — is used. **Never a broken `var()`.**
- **min** — the readability floor for that step (smallest is 11px, the
  legibility floor — a documented constant, not a magic number).
- **preferred** — a `rem + vw` term. These constants are the TY-01
  canonical viewport curve; they are the *scale shape*, not hardcoded
  sizes, and are themselves overridable by switching the
  `data-ve-type-scale` system.

A `--vc-text-hero` display tier sits one step above the engine's last
scale step. Height breakpoints (`max-height: 700px` / `500px`) shrink
the hero tier on compact viewports so a 1920×1080-fit slide or dashboard
header never overflows vertically.

## A.3 The HTML it scaffolds

Inside the page's existing `<script type="text/design-md">` frontmatter,
the agent embeds a `typography.scale` array (pre-computed — see A.5), and
— to enable the fluid behaviour — a single attribute on `<html>`:

```html
<html data-ve-type-scale="perfect-fourth">
```

`data-ve-type-scale` ∈ `{ minor-third, major-third, perfect-fourth,
golden }`. Absent attribute → the static engine px scale is used.

## A.4 The four modular-scale systems

`size = base × ratio^exp`, rounded to whole px. The base sits at scale
index 2 (the body size), so the array has 2 steps below the body and 4
above.

| System | Ratio | Use-case |
|---|---|---|
| Minor Third | 1.200 | body-heavy, minimal contrast |
| Major Third | 1.250 | editorial, balanced |
| **Perfect Fourth** | **1.333** | **strong hierarchy, UI/dashboards — DEFAULT** |
| Golden | 1.618 | dramatic — landing pages / decks only |

The calculator lives in `amvcp-typography.js`:

```
generateScale(baseSizePx, ratio, stepCount, baseIndex)
  -> for i in [0 .. stepCount-1]:
       exp     = i - baseIndex
       size[i] = round(baseSizePx * ratio^exp)   // floored at 11px,
                                                 // bumped +1px if a
                                                 // floored neighbour collides
  -> returns an ascending px array (what the engine's
     checkAscendingNumArray validator accepts)
```

`generateScaleForSystem(name, base)` resolves a system NAME to its ratio
then calls `generateScale`. An unknown name is a **hard error** — the
calculator throws, it never guesses a ratio (fail-fast).

### Recalculation path — one source of truth

When `data-ve-type-scale` changes, `applyScaleSystem(name, opts)`:

1. computes the new px anchor array via `generateScale`,
2. writes it into the DESIGN.md token tree's `typography.scale`,
3. re-runs the **engine's** `resolveTokens` + `applyTokens` so
   `--vc-text-<i>` is re-emitted **by the engine**,
4. sets `--vc-text-<i>-max` from the freshly resolved tokens.

The skill **never** calls `setProperty('--vc-text-<i>')` directly — that
would fork the source of truth. It mutates the DESIGN.md token tree and
lets the engine re-emit (the One-Source-of-Truth rule).

## A.5 Pre-computed scales for base 16px

For the static common case the agent does not even run the calculator —
paste the right array straight into the DESIGN.md frontmatter:

| System | `typography.scale` (7 steps, base 16px @ index 2) |
|---|---|
| Minor Third (1.200) | `[11, 13, 16, 19, 23, 28, 33]` |
| Major Third (1.250) | `[11, 13, 16, 20, 25, 31, 39]` |
| Perfect Fourth (1.333) | `[11, 12, 16, 21, 28, 38, 51]` |
| Golden (1.618) | `[11, 12, 16, 26, 42, 68, 110]` |

> These are what `generateScale(16, ratio, 7, 2)` returns. The smallest
> step is the 11px legibility floor; for Golden the two lowest steps are
> floored and bumped to stay strictly ascending.

## A.6 Display-tier optical correction (TY-08)

At sizes ≥ ~96px browsers render type optically too loose; negative
tracking corrects it. Baked into `.vc-type-hero` in
`amvcp-typography.css`:

```css
.vc-type-hero {
  font-size: var(--vc-text-hero);
  letter-spacing: -0.04em;   /* TY-08 optical correction >=96px */
  line-height: 1.05;         /* display leading band */
  font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700));
}
```

One CSS rule, no JS.

## A.7 The type-specimen page (sub-technique E)

The skill's concrete scaffoldable artifact — a single self-contained
`.html` page that visualises the whole active type scale: every semantic
role rendered once with a sample string + its token name + the resolved
value; a weight ladder; the `data-ve-vfont` status badge; (with the JS
path) a live `data-ve-type-scale` `<select>`.

It embeds the DESIGN.md engine + `amvcp-typography.css` inline and
carries an embedded `<script type="text/design-md">`, so a theme swap or
scale-system switch restyles it live — it is a *living* specimen. It
doubles as the dev-browser test fixture
(`tests/fixtures/typography-specimen.html`).

## Tokens consumed / extended

- **Consumes:** `--vc-text-0…6`, `--vc-line-height` (engine).
- **Extends (optional engine key):** `typography.scale-hero` (px) →
  `--vc-text-hero`. Optional — absent → the CSS `clamp(48px,…,96px)`
  fallback is used. This optional key is added to the engine schema by
  the integration pass; the CSS layer works with or without it.

## No nested scrollbars

The fluid layer introduces **no `overflow` rule**. Headings that are
too wide extend the page — never an inner scroller. Do **not** put
`white-space:nowrap` on a heading. Compliant with `no-nested-scrollbars.md`.
