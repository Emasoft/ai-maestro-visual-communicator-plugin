# TRDD-6fdf6ad2-8070-4bc2-82bd-de8a2e6a8e20 — Visualize-plugin absorption plan

**TRDD ID:** `6fdf6ad2-8070-4bc2-82bd-de8a2e6a8e20`
**Filename:** `design/tasks/TRDD-6fdf6ad2-8070-4bc2-82bd-de8a2e6a8e20-visualize-absorption.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)
**Status:** In progress (Tier 0 starting)
**Created:** 2026-05-17
**Owner:** Emasoft

## Context

During the 2026-05-17 session the user invoked the competitor `visualize:visualize`
skill on `examples_dev/report-symphony-vs-amoa-comparison.md` and compared the
output against the visual-comunicator (amvcp) plugin's own render of the same
document (`tests_dev/symphony-vs-amoa.html`).

The competitor's output (`~/Downloads/symphony-vs-amoa-comparison.html`, 1593
LOC) demonstrates 10 capabilities the amvcp plugin currently lacks. The user
identified these as lessons worth absorbing:

1. Responsive breakpoints
2. Chart.js
3. Dark/light user toggle (currently amvcp only follows OS via `prefers-color-scheme`)
4. Hero with gradient title + lede + meta row
5. Accessibility primitives (landmarks, skip-link, reduced-motion)
6. PDF export (`@media print` + `@page` margin boxes)
7. PNG export (full page via `html-to-image` library)
8. Additional visual components (KPI cards, tier pills, side-by-side VS, stack diagrams, timeline)
9. Beautiful gradient background (radial-gradient + dot-grid overlay)
10. Beautiful theme/style absorbed as a DESIGN.md preset

The user gave explicit spec for the Tier 0 corner-button row (items 3, 6, 7):

> "just add the following square buttons to the left of the corner button
> (same height and style): `[🌙][📸][🖨️][CORNER-BUTTON]`. the button for
> dark/night will switch to `[☀️]` for day. Of course it would be better
> to recreate those emojis in svg so to change their color to adapt to
> the theme/DESIGN.md and palette of the page."

## Goals

- Absorb the 10 capabilities while preserving amvcp's categorical
  differences from `visualize`: per-atom `data-ve-comment-id` addressing,
  per-finding `<textarea data-ve-finding-reply>` round-trip, externalised
  `ve-runtime.js` shared runtime, DESIGN.md token engine.
- Land in 6 tiers (0–5) with measurable per-tier verification.
- Each tier ends with: tests green, audit clean, atomic commit.

## Non-goals

- Do NOT replace amvcp's interactive-review model with the
  poster-artist model. The new capabilities are additive, never
  substitutive.
- Do NOT bundle Chart.js / html-to-image into the runtime
  unconditionally — lazy-load only when a page declares it needs them.

## Tiers

### Tier 0 — Three corner buttons (items 3, 6, 7) — **THIS SPRINT**

Three 36×36 fixed-position buttons placed to the LEFT of the existing
bottom-right action button (Submit / Done). Order, right-to-left:

```
[🌙/☀️] [📸] [🖨️] [CORNER-BUTTON]
```

Specs:

- All 36×36, same border-radius/shadow as the existing pod handle.
- Inline SVG icons (24×24 viewBox), `stroke="currentColor"` so the
  icon adopts the DESIGN.md text color via `--vc-text`.
- **Theme-toggle button**: shows moon SVG when in light mode (click →
  dark), sun SVG when in dark mode (click → light). Flips
  `document.documentElement.setAttribute('data-ve-theme', t)` →
  observer at `bindThemeAttributeObserver()` re-emits tokens
  automatically.
- Persists choice to `localStorage["ve-user-theme"]`.
- **PNG button**: lazy-loads `html-to-image@1.11.11` from
  `cdn.jsdelivr.net`, captures `document.body` at `pixelRatio: 2`,
  excludes `.ve-action-btn` + `#ve-designmd-handle` from the capture,
  downloads as `<title-slug>.png`.
- **Print button**: `window.print()` — paired with print CSS landing
  in Tier 2.

Positions (always visible, even if `.ve-action-btn--bottom` is absent):

- Submit/Done (existing): `bottom: 36px; right: 36px;`
- Print: `bottom: 36px; right: 84px;`   (= 36 + 36 + 12 gap)
- PNG: `bottom: 36px; right: 132px;`
- Theme: `bottom: 36px; right: 180px;`

Hidden via `@media print` and via the future R40 cleanup rules.

**Verification**:
- All 3 buttons render at startup in `runtime-init-fixture.html`.
- Theme button cycle: click → `<html data-ve-theme="dark">` → click
  again → `<html data-ve-theme="light">`; tokens re-applied each time.
- PNG button: click triggers download of `<title>.png` ≥ 100 KB.
- Print button: `window.print()` invoked (assert via mock).

**Files modified**:
- `scripts/amvcp-runtime.js` — add `_ensureCornerButtons()`, SVG
  helpers, theme toggle handler, PNG export handler, print handler.

### Tier 1 — `product-dashboard` DESIGN.md preset (item 10)

Zero structural change. Append one entry to `PRESETS` array in
`scripts/amvcp-tokens.js`:

```js
{
  name: 'product-dashboard',
  text: `# DESIGN.md — product-dashboard
... (Inter + JetBrains Mono, indigo→pink gradient, refined surfaces)
`
}
```

Inherits R28 (save/rename/delete) automatically. Selectable from the
pod library drawer.

**Files modified**:
- `scripts/amvcp-tokens.js` — one new preset entry.

### Tier 1B — Per-theme DESIGN.md assignment (user-added 2026-05-17)

**Requirement (user, verbatim):** *"the user (via the draggable pod)
should be able to assign to the light/dark style two different
DESIGN.md files independently."*

Today the pod tracks ONE active preset (`activePresetName`) and the
engine derives both light + dark token blocks from that preset's own
internal sections. This new requirement decouples the two:

- **Active preset is theme-aware.** Two localStorage keys replace the
  single `ve-designmd-pad-active`:
  - `ve-designmd-pad-active-light` → preset name applied when
    `<html data-ve-theme="light">`
  - `ve-designmd-pad-active-dark` → preset name applied when
    `<html data-ve-theme="dark">`
- **Theme toggle button (Tier 0) MUST honour this.** When the user
  flips `data-ve-theme` from light → dark, the runtime re-applies
  whichever preset is assigned to the dark slot (not just re-derives
  from the current preset).
- **Pod library UI gains two affordances.** Per row in the library
  drawer (built-in + user presets), two pill-style toggles:
  `[ Use for Light ]   [ Use for Dark ]`. Each pill is a radio
  scoped to its column (only one preset can be the active light;
  only one can be the active dark). Active state shown as filled.
- **Defaults.** First-run / no-prior-selection:
  - Light slot → `parchment` (or whichever the current default light
    preset is; verify from `amvcpTokens.DEFAULT_PRESET_LIGHT`).
  - Dark slot → `midnight` (likewise verify default).
  Subsequent runs read both keys from localStorage.
- **Mix-and-match works.** e.g. user can select `blueprint` for light
  and `product-dashboard` for dark. Toggling theme switches both the
  `data-ve-theme` attribute AND the active preset.
- **Hot-swap discipline preserved.** Existing `veDesignMdHotSwap()`
  still fires `vc:themechange`; every skill re-themes from `--vc-*`
  tokens (R1) — no skill-side change required.
- **R28 unaffected.** Save / rename / delete user presets continue
  to work; the only change is the *active* selection is now a tuple
  `{ light, dark }` instead of a single name.

**Files modified**:
- `scripts/amvcp-designmd.js` — replace `getActivePresetName()` /
  `setActivePresetName()` with `getActivePresetForTheme(theme)` /
  `setActivePresetForTheme(theme, name)`. Update library renderer
  in `runtime.js:10377+` to show the two pills per row.
- `scripts/amvcp-runtime.js` — theme-toggle handler from Tier 0
  reads/writes `data-ve-theme` AND triggers preset re-apply.
- `scripts/amvcp-tokens.js` — expose
  `DEFAULT_PRESET_LIGHT` / `DEFAULT_PRESET_DARK` constants if not
  already present.

**Verification**:
- `window.amvcpDesignMd.setActivePresetForTheme('light', 'blueprint')`
  and `setActivePresetForTheme('dark', 'product-dashboard')` → toggling
  theme button alternates the two presets visually.
- Library pills render correctly: exactly one filled per column.
- localStorage round-trips both keys across page reload.
- `vc:themechange` fires once per toggle.

This tier blocks completion of Tier 0 because the theme button's
click handler depends on per-theme preset resolution.

### Tier 2 — R40 + print CSS (items 5, 6)

Add **R40** to `skills/amvcp-self-debug-rules/SKILL.md`:

> R40 — every rendered page MUST include:
> (a) skip-to-content link (`<a class="ve-skip" href="#main">Skip to content</a>`),
> (b) `role="banner"` on `<header>` and `role="main"` on the primary
> `<main>` element,
> (c) `@media (prefers-reduced-motion: reduce) { *, *::before, *::after
> { animation: none !important; transition: none !important; } }`,
> (d) `role="img"` + descriptive `aria-label` on every `<canvas>` and
> non-decorative `<svg>`.

Add print CSS to runtime:

```css
@media print {
  body { background: white !important; color: black !important; }
  .ve-action-btn,
  #ve-designmd-handle,
  .ve-pod-panel { display: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
@page {
  margin: 1in;
  @bottom-center { content: "Page " counter(page); font-size: 9pt; color: #666; }
}
```

**Files modified**:
- `skills/amvcp-self-debug-rules/SKILL.md` — append R40.
- `scripts/amvcp-runtime.js` — append print CSS to runtime stylesheet.

### Tier 3 — Responsive + hero + gradient (items 1, 4, 9)

Runtime CSS responsive breakpoints at **1024 / 768 / 375** with
mobile-first grid pattern: `grid-template-columns: repeat(auto-fit,
minmax(320px, 1fr));`. Audit existing layouts.

New `.ve-hero` CSS class library:
- Gradient title via `background: linear-gradient(...);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;`.
- Eyebrow tag (`.ve-eyebrow`), lede paragraph (`.ve-lede`), meta row
  (`.ve-meta-row`).
- `::before` dot-grid background overlay:
  `background-image: radial-gradient(circle at 1px 1px,
  var(--vc-border) 1px, transparent 0); background-size: 32px 32px;`.

Opt-in via `data-ve-hero="1"` on `<header>` — auto-applies in
`amvcp-share-page` renderer when the document has H1+lede+meta
detected.

New token `--vc-hero-gradient` defaulting to
`radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%,
rgba(168,85,247,0.10) 30%, transparent 60%)`.

**Files modified**:
- `scripts/amvcp-runtime.js` — responsive CSS + `.ve-hero` styles.
- `scripts/amvcp-tokens.js` — new token `--vc-hero-gradient`.
- `scripts/amvcp-prose-pages.js` / share-page renderer — auto-apply
  `data-ve-hero` when structure matches.

### Tier 4 — `amvcp-visual-components` skill (item 8)

New skill `skills/amvcp-visual-components/SKILL.md` shipping declarative
atoms:

| Atom | HTML | What it renders |
|---|---|---|
| `data-ve-stat` | `<div data-ve-stat data-ve-value="33" data-ve-label="Features">` | KPI card with animated counter |
| `data-ve-tier` | `<span data-ve-tier="t1">Tier 1</span>` | Priority pill (t1=green, t2=amber, t3=indigo, t4=red) |
| `data-ve-vs-row` | `<div data-ve-vs-row>...<div>A</div><div>B</div>...</div>` | Side-by-side comparison with center "VS" divider |
| `data-ve-stack` | `<div data-ve-stack>...<div data-ve-layer>Policy</div>...</div>` | Layered architecture diagram (5–7 layers max) |
| `data-ve-timeline` | `<div data-ve-timeline>...<div data-ve-day="Day 1">...</div>...</div>` | Day-by-day timeline |

Each atom auto-stamped with `data-ve-comment-id` so per-atom replies
still work (R5 / R20 / R23 selection contract).

**Files modified**:
- `skills/amvcp-visual-components/SKILL.md` (new).
- `scripts/amvcp-visual-components.js` (new, ~600 LOC) — atom
  scanners + CSS templates.
- 1 new fixture per atom in `tests/fixtures/`.

### Tier 5 — Chart.js opt-in atom (item 2)

`<div data-ve-chart data-ve-chart-type="radar|bar|line|pie|doughnut"
data-ve-chart-data="...">` atom in runtime. Lazy-loads
`chart.js@4.4.7` from `cdn.jsdelivr.net` **only when at least one
chart atom is present on the page** — avoids the ~60 KB CDN cost on
chart-free pages.

Theme-aware colors read from `--vc-*` tokens; re-render on
`data-ve-theme` MutationObserver fire (already wired via
`bindThemeAttributeObserver`).

Folds into the existing `amvcp-charts-and-dashboards` skill which
currently describes the intent but doesn't wire Chart.js.

**Files modified**:
- `scripts/amvcp-runtime.js` — chart scanner + lazy loader + theme
  re-render hook.
- `skills/amvcp-charts-and-dashboards/SKILL.md` — document the
  `data-ve-chart` atom contract.

## Out of scope (explicit defer)

- Reveal.js / Slide deck full integration (item not in user list).
- Mermaid / D3.js integration (item not in user list).
- Carousel-card / event-poster / quote-card / resume formats from
  visualize's `types.md` (would shift amvcp toward poster-artist
  territory; user explicitly chose to keep amvcp as
  collaborative-whiteboard).

## Verification

Per tier:

1. **Tests**: `cd tests && python3 run-tests.py` — full suite must
   stay green (current baseline 358/358).
2. **Audit**: re-run the R1–R39 (and R40 once it lands) audit against
   all 31 fixtures.
3. **Screenshot**: one representative fixture per tier, light +
   dark, before/after.

## Commit strategy

One commit per tier:

1. `feat(runtime): corner buttons — theme/PNG/print 36×36 SVG icons` (Tier 0)
2. `feat(designmd): product-dashboard preset (item 10)` (Tier 1)
3. `feat(designmd): per-theme active preset assignment in pod library` (Tier 1B)
4. `feat(runtime+debug): R40 accessibility + @media print` (Tier 2)
5. `feat(runtime+prose): responsive breakpoints + .ve-hero component` (Tier 3)
6. `feat(plugin): amvcp-visual-components skill (KPI/tier/VS/stack/timeline)` (Tier 4)
7. `feat(charts): data-ve-chart opt-in atom with lazy Chart.js` (Tier 5)

Tier 0 + Tier 1 + Tier 1B may ship as a single combined commit
because the theme-toggle button (Tier 0) depends on Tier 1B's
per-theme preset resolution to actually do anything visible.

Each commit stages only the files listed in its tier section above.
