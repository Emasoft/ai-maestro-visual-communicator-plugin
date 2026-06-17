# Worked examples — request → category → scaffold

## Table of Contents

- [Example 1 — "chart Q1 revenue by region"](#example-1--chart-q1-revenue-by-region)
- [Example 2 — "compare three deployment plans, B is recommended"](#example-2--compare-three-deployment-plans-b-is-recommended)
- [Example 3 — "turn this implementation plan into slides"](#example-3--turn-this-implementation-plan-into-slides)

Worked examples — each shows how the agent matches a user request to one of the 13 categories, loads the right SKILL.md, and emits the canonical scaffold.


## Example 1 — "chart Q1 revenue by region"
1. Match the matrix: "quantitative comparison across categories" → **charts-and-dashboards (`bar`)**.
2. Read [amvcp-charts-and-dashboards](../../amvcp-charts-and-dashboards/SKILL.md) plus [chart-bar](../../amvcp-charts-bar/references/chart-bar.md).
  > When to choose `bar` · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens used · Selection / comments / decision-mini · Anti-patterns and pitfalls · Visual verification
3. Emit a fenced `chart:bar@1` block inside a `<figure class="ve-chart">`:
   ```html
   <figure class="ve-chart" data-ve-chart-type="bar"><pre><code class="language-chart:bar@1">
   {"title":"Q1 revenue by region","series":[{"label":"USD","data":[
     {"x":"NA","y":48200},{"x":"EU","y":32100},{"x":"APAC","y":18700},{"x":"LATAM","y":9400}
   ]}]}
   </code></pre></figure>
   ```
4. Load `amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-chart.js`. Open the file. Done.

## Example 2 — "compare three deployment plans, B is recommended"
1. Match the matrix: "comparison of N options" → **tables (`compare` mode)**.
2. Read [amvcp-tables](../../amvcp-tables/SKILL.md) plus [comparison-emphasis-column](../../amvcp-tables-matrix-compare/references/comparison-emphasis-column.md) and [icon-headers-unicode](../../amvcp-tables-cells-badges/references/icon-headers-unicode.md).
  > What the emphasis column communicates · The `data-ve-col-emphasis` attribute · Zero or one — never two · The two-column emphasis warning — fail-fast, console.warn · How the tint is applied — grid-walked column · The accent border-left + border-right · The 10% accent wash · Icon recoloring on the emphasis header · The 2-column anti-pattern → fix variant · Pairing emphasis with a deliberate row order · Sample HTML — 3-column recommendation · Sample HTML — 2-column before/after · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
  > The job an icon header does · The hard rule — Unicode geometric marks only · Pairing icons — open vs filled, the rank signal · The canonical 4-icon palette · Mode-specific icon idioms · The injection — span before the header text · Color is per emphasis state · Why no icons on the row-label column · Sample HTML · Choosing an icon set for a specific comparison · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
3. Emit `<table data-ve-table="compare">` with three option `<th>`s carrying `data-ve-col-icon` Unicode glyphs and `data-ve-col-emphasis="1"` on the B column.
4. Load `amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-tables.js`. Done.

## Example 3 — "turn this implementation plan into slides"
1. Match the matrix: "presentation / talk slides / pitch" → **slide-decks**.
2. Read [amvcp-slide-decks](../../amvcp-slide-decks/SKILL.md) plus 1–2 layout references for the layouts you'll pick.
3. Emit a single HTML file containing the deck JSON + `amvcp-slide.js`. The renderer auto-letterboxes every slide to a fixed aspect.
4. The same plan could ALSO be emitted as a process-flow diagram (route to **diagram**) if the user wants ONE picture instead of a deck. State the trade-off and let the user pick.
