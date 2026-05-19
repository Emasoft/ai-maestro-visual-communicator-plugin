# Chart.js Integration — the legacy bridge

## Table of contents

- [When to use `veWireChart`](#when-to-use-vewirechart)
- [Wiring Chart.js datapoint clicks](#wiring-chartjs-datapoint-clicks)
- [The selection payload — identical to native charts](#the-selection-payload--identical-to-native-charts)
- [Why prefer the fence protocol](#why-prefer-the-fence-protocol)
- [Migration path: Chart.js → fence protocol](#migration-path-chartjs--fence-protocol)
- [Hybrid pages](#hybrid-pages)

---

## When to use `veWireChart`

`veWireChart(chart, { id })` is the LEGACY bridge for pages that ALREADY
use hand-built Chart.js charts. It does NOT render a chart — it chains
an `onClick` handler onto an existing Chart.js instance so its datapoints
join the page's multi-select set as `type:"chart-point"`.

Use `veWireChart` ONLY when:
- A pre-existing page already loads Chart.js + has hand-built charts.
- Migrating that page to the fence protocol is too costly right now.
- You need the SELECTION/COMMENT contract to work on the Chart.js charts.

For NEW work, ALWAYS use the fence protocol (`chart:<type>@1`) — it has
no CDN dependency, ships full theming, and supports every type natively.

## Wiring Chart.js datapoint clicks

After constructing a `Chart`, hand it to `veWireChart`:

```html
<canvas id="revenue-chart" width="800" height="320"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script>
  var chart = new Chart(document.getElementById('revenue-chart'), {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr'],
      datasets: [{ label:'Revenue', data:[42000, 38000, 45200, 49000] }]
    },
    options: { responsive: true }
  });
  veWireChart(chart, { id: 'revenue' });
</script>
```

The wiring:
1. `veWireChart` reads the Chart.js instance's `options.onClick`.
2. Wraps it (or installs one if missing) so that on a datapoint click,
   the runtime gets called with the chart-point payload.
3. The original `onClick` (if any) still runs first.

Clicks on a datapoint then route through `window.toggleElementSelection`
exactly the same as a native chart-point atom click.

## The selection payload — identical to native charts

```json
{
  "id": "ve-chart-revenue-d0-i2",
  "type": "chart-point",
  "label": "Revenue · Mar",
  "data": {
    "chartId": "revenue",
    "datasetIndex": 0,
    "datasetLabel": "Revenue",
    "index": 2,
    "xLabel": "Mar",
    "value": 45200
  }
}
```

This is EXACTLY the same shape that `markPoint` stamps on a native
chart-point atom (see `chart-selection-and-comments.md`). The downstream
multi-select, comment-modal, decision-pill machinery does not know (or
care) whether the click came from a native SVG `<rect>` or from a
Chart.js Canvas hit. Same payload, same routing, same UI.

## Why prefer the fence protocol

The fence protocol (`chart:<type>@1`) wins over Chart.js for every metric
that matters in this plugin:

| Aspect | Chart.js + veWireChart | Native fence protocol |
|---|---|---|
| Dependencies | Chart.js v4 (~80 KB minified, CDN) | None (~120 KB inline, no CDN) |
| Offline | Breaks if CDN unreachable | Works always |
| Theming | Manual via Chart.js options | Auto via `--vc-*` tokens |
| Light + dark | Hand-write both color sets | Single DESIGN.md, auto-swaps |
| Selection wire | Via `veWireChart` chain | Native; no wrapper |
| Comment handle | Via `veWireChart` chain | Native; auto-mounts on selection |
| Decision pill | Via `veWireChart` chain | Native; attached by `markPoint` |
| Type breadth | Chart.js core + plugins | 25 types built in |
| Print fidelity | Canvas rasterises | SVG print-perfect |
| Accessibility | Manual | Native (tabindex, `<title>`, a11y list) |

The legacy bridge exists for migration timelines; new code should not
choose it.

## Migration path: Chart.js → fence protocol

To migrate a Chart.js chart to the fence protocol:

1. **Identify the chart type.** Map Chart.js types to fence types:
   - `bar` → `chart:bar@1`
   - `line` → `chart:line@1`
   - `doughnut` → `chart:donut@1`
   - `pie` → `chart:donut@1` (you should never have been using a pie!)
   - `radar` → `chart:radar@1`
   - `polarArea` → `chart:radar@1` (closest equivalent)
   - `scatter` → `chart:dot-plot@1` (categorical x only)
   - `bubble` → (no native equivalent; use a scatter-like rendering)

2. **Convert the dataset shape:**

   ```js
   // Chart.js
   { labels: ['Jan','Feb','Mar'],
     datasets: [{ label: 'Revenue', data: [42000, 38000, 45200] }] }

   // Fence protocol
   { title: "Revenue by month",
     series: [{ label: "Revenue", data: [
       {x:"Jan", y:42000}, {x:"Feb", y:38000}, {x:"Mar", y:45200}
     ]}] }
   ```

3. **Add a `title`** (required in the fence protocol; optional in
   Chart.js).

4. **Drop the per-spec colors** — let the DESIGN.md theme handle them.

5. **Remove the `<script>` import for Chart.js** + the `veWireChart`
   call.

6. **Verify the chart renders + selection still works** via
   `skills/amvcp-self-debug-rules/SKILL.md`.

## Hybrid pages

A page can mix native fenced charts AND Chart.js charts wired via
`veWireChart`. The selection routes through the same multi-select set
either way — clicking a fenced bar adds it; clicking a Chart.js
datapoint adds it; both appear in the same comment modal.

The fence protocol auto-themes; the Chart.js charts do NOT (unless you
wire DESIGN.md tokens into Chart.js options manually). For a uniform
look across hybrid pages, migrate the Chart.js charts to the fence
protocol when time permits.

> **Future:** range/interval selection (drag x1→x2) is on the roadmap.
> For now, single-point selection only; if the user wants an interval,
> they click one endpoint and tell the agent about the other in their
> reply.

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md) — the native authoring contract.
- [chart-selection-and-comments.md](./chart-selection-and-comments.md) — the selection wire format, identical for both surfaces.
- [chart-public-api.md](./chart-public-api.md) — `window.amvcpChart` surface (no `veWireChart` — that lives on the runtime).
