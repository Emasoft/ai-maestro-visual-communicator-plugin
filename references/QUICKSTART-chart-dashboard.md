# QUICKSTART — chart / KPI dashboard (one read, then build)

The condensed load-bearing contract for generating a chart or KPI-dashboard
page **fast**. Read THIS first; open the deep references only for what this
doesn't cover. Target: data → pixels in under 60 seconds.

## 0. Fast path (default)

1. **Copy the template** `templates/chart-dashboard.html` into
   `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/charts/<name>.html`.
2. Fill every `<!-- FILL: … -->` slot — replace the sample JSON inside each
   fenced `chart:<type>@1` block with your real data (same envelope shape).
   Content transplant, no re-authoring of boilerplate.
3. `cp scripts/amvcp-designmd.js scripts/amvcp-runtime.js scripts/amvcp-chart.js <same dir>/`
4. Open: `python3 scripts/amvcp-select.py <file>.html` (background it; the
   submit/exit POST comes back on stdout as `{kind, count, selections:[…]}`).
5. Verify BOTH themes in one pass (flip `data-ve-theme` on `<html>`,
   screenshot light + dark). Single-theme is a correctness defect.

**Batch your reads.** If you must open references, read them ALL in one
parallel tool-call message — never serially.

## 1. Chart-type routing (one line each)

| Reader needs to … | Fence type |
|---|---|
| Headline numbers at a glance (KPI grid) | `chart:metric-cards@1` |
| Compare magnitudes across categories | `chart:bar@1` (low ink: `lollipop` / `dot-plot`) |
| Trend over time, shape only | `chart:line@1` |
| Trend over time, magnitude matters | `chart:area@1` |
| Discrete jumps over time | `chart:step-area@1` |
| Parts of a whole | `chart:donut@1` (or `segmented-bar`, `mekko`) |
| Single value vs max / target | `chart:gauge@1` / `chart:bullet@1` |
| Stage drop-off | `chart:funnel@1` |
| Cumulative bridge | `chart:waterfall@1` |
| 2-D intensity surface | `chart:heatmap@1` (numbers: `matrix`) |
| Multi-criterion comparison | `chart:radar@1` |
| **Never a pie** | `chart:pie@1` is auto-remapped to a sorted `bar` |

## 2. The traps (each cost a real debug round-trip once)

0. **No-new-elements highlight rule** — selection/hover only re-paints the
   EXISTING mark. The runtime stamps `data-ve-selected="1"` and applies the
   brightness delta + accent stroke + hover glow; the figure gets an outer
   ring via `:has([data-ve-selected="1"])`. Never add page-side
   frames/rings/fill-tints/outlines on marks — a fill-tint stacks with the
   runtime brightness into mud, and an SVG outline draws the mark's
   bounding-box rectangle. Re-theme via DESIGN.md `--vc-*` tokens only.
1. **DESIGN.md fences** — the embedded `<script type="text/design-md">`
   payload MUST open with `---` on line 1 and close with `---`. `parseDesignMd`
   is fail-fast; without fences the engine **silently** falls back to the
   built-in palette (only symptom is a `console.error`). Page CSS var()
   fallbacks mask it.
2. **One fence = one chart; `title` is REQUIRED.** The title is the INSIGHT
   ("Q4 was the strongest in 3 years"), not a label ("Revenue chart"). A
   spec missing `title` or `series` degrades to a VISIBLE error block (the
   original JSON kept verbatim) — never a silent blank box.
3. **Data lives in the fenced block as JSON** — never hand-roll SVG. The
   exact fence shape (per `chart-fence-protocol.md`):

   ````markdown
   ```chart:bar@1
   { "title": "Revenue by quarter",
     "series": [{ "label": "2025", "data": [
       {"x":"Q1","y":2.4}, {"x":"Q2","y":3.1}
     ] }],
     "options": { "sortDescending": true, "valueLabels": true } }
   ```
   ````

   In an HTML page the block is `<pre><code class="language-chart:bar@1">…JSON…</code></pre>`.
   Envelope: `{ title, subtitle?, series:[{label,data:[…]}], options?, source? }`.
   The `data[]` item shape is per-type (`{x,y}` for bar/line/area;
   `{label,value,delta?,trend?,unit?}` for metric-cards).

## 3. Page contract (already satisfied by the template)

- Load order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`,
  copied next to the page, referenced relatively. `amvcp-chart.js` finds each
  fenced block on `DOMContentLoaded`, validates the JSON, and REPLACES the
  `<pre>` with a `<figure class="ve-chart">` of rendered SVG/CSS/HTML.
- `:root { --ve-accent: var(--vc-color-accent, …) }` — the hover-glow color.
- **Atoms are auto-stamped by the chart lib.** Every mark inside the figure
  (`<rect>` bar, `<circle>` line point, `<div>` KPI card) carries
  `data-ve-id` / `data-ve-type="chart-point"` / `tabindex="0"` /
  `role="button"` plus the selection payload — click-to-select, tooltip,
  group comment-handle, and the 3-radio decision pill all wire with zero new
  code. A click toggles the mark into `window.veSelection`.
- **Every color reads a `--vc-*` token** (the chart renderer reads them at
  paint time), so a live theme flip re-paints every SVG mark with no
  re-render. Canvas-backed charts (>100 marks) need `amvcpChart.scan(document)`
  after a theme swap to redraw.
- No nested scrollbars: `html,body{overflow-x:auto}`, every `.ve-chart` /
  `.ve-chart-svg` / `.ve-chart-canvas` is `overflow:visible`, **no
  `max-height`** — wide charts extend the page.

## 4. Deep references (only when needed)

- `skills/amvcp-charts-and-dashboards/SKILL.md` — the chart router (data
  shape → sibling skill).
- `skills/amvcp-dashboards/references/chart-fence-protocol.md` — the full
  fence grammar, JSON envelope, validation gates, boot order. **The spine.**
- `skills/amvcp-dashboards/references/chart-metric-cards.md` — KPI tiles.
- `skills/amvcp-charts-bar/references/chart-bar.md` +
  `skills/amvcp-charts-line-area/references/chart-area.md` — per-type shapes.
- `skills/amvcp-dashboards/references/chart-dashboard-recipes.md` — 6
  multi-chart compositions; `chart-palette-engine.md` + `chart-guardrails.md`.
- `references/interactive-selection-base.md` — the selection/runner contract.
