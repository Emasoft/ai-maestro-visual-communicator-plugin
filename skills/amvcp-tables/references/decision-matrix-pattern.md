# Decision matrix — rules → outcomes table

A table where the rows enumerate conditions and the columns
enumerate outcomes — a compact decision matrix the reader walks
top-to-bottom to find their case. Common in error-handling docs,
chart-type pickers, "which option do I choose" decision aids.

## Table of contents

- [The shape](#the-shape)
- [Distinct from a coverage matrix](#distinct-from-a-coverage-matrix)
- [Distinct from a compare table](#distinct-from-a-compare-table)
- [Rows are conditions; columns are properties of the outcome](#rows-are-conditions-columns-are-properties-of-the-outcome)
- [The "default fallback" row](#the-default-fallback-row)
- [Inline `<code>` for technical conditions](#inline-code-for-technical-conditions)
- [Sample — chart-type decision matrix](#sample--chart-type-decision-matrix)
- [Sample — HTTP status response matrix](#sample--http-status-response-matrix)
- [Sample — sort tie-break decision matrix](#sample--sort-tie-break-decision-matrix)
- [Sample — error handling matrix](#sample--error-handling-matrix)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌────────────────────────┬──────────────┬─────────────────────────┐
│ If the data shape is…  │ Use a chart  │ Why                     │
├────────────────────────┼──────────────┼─────────────────────────┤
│ Comparison (categories)│ Sorted bar   │ Most accurate for rank  │
│ Composition (parts)    │ Stacked bar  │ Sum + per-part visible  │
│ Distribution           │ Histogram    │ Shape of the spread     │
│ Trend over time        │ Line         │ Direction + slope       │
│ Correlation            │ Scatter      │ Two-variable shape      │
│ Ranking                │ Sorted bar   │ Same as comparison      │
└────────────────────────┴──────────────┴─────────────────────────┘
```

A decision matrix is a `data` table with N rows and 2–4 columns.
The first column is the **condition** (what's true about the
situation); the remaining columns are the **outcome properties**
(what to do, why, what to avoid).

The reader walks down the first column to find their condition,
then reads across the row to get the answer.

## Distinct from a coverage matrix

A coverage matrix (`data-ve-table="matrix"`) is a 2-D grid where
the cells are STATUS (pass/fail/partial/na). A decision matrix is
a structured table where the cells are TEXT (the answer for that
condition).

| | Coverage matrix | Decision matrix |
|---|---|---|
| Module mode | `data-ve-table="matrix"` | `data-ve-table="data"` (or plain) |
| Row meaning | Items being audited | Conditions / cases |
| Column meaning | Criteria | Outcome properties (action / why / anti-pattern) |
| Cell content | Status glyph | Free text |
| Sortable | No (sort by glyph rarely meaningful) | Yes (by condition or by action) |

A decision matrix benefits from the `data` mode's sort: clicking
the action column groups conditions by "same answer".

## Distinct from a compare table

A compare table (`data-ve-table="compare"`) has 2–N option columns,
each a separate option being compared. A decision matrix has ONE
outcome column (the chosen action), plus context columns (why,
when not to).

| | Compare table | Decision matrix |
|---|---|---|
| Option columns | 2–N parallel options | 1 outcome (the action) |
| Emphasis | Optional accent on recommended | None |
| Reading flow | Pick a column (which option) | Find a row (which condition) |
| When to use | "Which of these N options?" | "For my situation, what's the action?" |

A "buy vs build" comparison is a `compare` table — the columns are
the options. A "which chart should I use?" picker is a decision
matrix — the columns are the answer's properties.

## Rows are conditions; columns are properties of the outcome

The canonical 3-column layout:

| Condition | Action | Why |
|---|---|---|
| (the case) | (what to do) | (why this action) |

A 4-column variant adds an anti-pattern:

| Condition | Action | Why | Anti-pattern (avoid) |
|---|---|---|---|

The anti-pattern column captures the trap — "don't use a pie chart
for >5 slices" / "don't use try/catch for control flow". This is
the SAFETY information the matrix exists to surface.

A 5-column variant adds an example:

| Condition | Action | Why | Anti-pattern | Example |

Optional — the example column doubles the row's vertical space and
the reader can usually mentally construct an example from the
condition.

## The "default fallback" row

Most decision matrices have a row that captures "if none of the
above match". Pattern:

```html
<tr>
  <th scope="row">(everything else / fallback)</th>
  <td>Use the safe default</td>
  <td>Avoids surprise; least-bad option</td>
</tr>
```

The fallback should be the SAFEST option — not the trendiest, not
the most performant. The matrix is a decision aid for someone who
doesn't already know the answer; their default-case answer should
not require justifying a bold choice.

## Inline `<code>` for technical conditions

```html
<tr>
  <th scope="row"><code>error.code === 'ECONNREFUSED'</code></th>
  <td>Retry with backoff</td>
  <td>The remote is down; transient</td>
</tr>
```

The condition cell often carries code: a specific error code, a
JSON schema fragment, a CSS property name. Use `<code>` inline so
the snippet is visually distinct. The module's CSV export
preserves `<code>` content as plain text.

For longer conditions, prefer a separate `<pre>` block above or
beside the table — the matrix cells should hold 1-line conditions.

## Sample — chart-type decision matrix

```html
<table data-ve-table="data" data-ve-table-csv="1"
       data-ve-label="Chart-type picker">
  <thead>
    <tr>
      <th scope="col">If your data is…</th>
      <th scope="col">Use a…</th>
      <th scope="col">Avoid</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Comparison (N categories, one metric each)</th>
      <td>Sorted bar chart</td>
      <td>Pie (hard to compare angles)</td>
    </tr>
    <tr>
      <th scope="row">Composition (parts of a whole)</th>
      <td>Stacked bar or treemap</td>
      <td>Pie with > 5 slices; 3D anything</td>
    </tr>
    <tr>
      <th scope="row">Distribution (shape of values)</th>
      <td>Histogram or boxplot</td>
      <td>Line chart (implies trend)</td>
    </tr>
    <tr>
      <th scope="row">Trend over time</th>
      <td>Line or area chart</td>
      <td>Bar (loses continuity)</td>
    </tr>
    <tr>
      <th scope="row">Correlation between 2 variables</th>
      <td>Scatter plot</td>
      <td>Two superimposed line charts</td>
    </tr>
    <tr>
      <th scope="row">Ranking (top-N or sorted list)</th>
      <td>Sorted horizontal bar</td>
      <td>Pie, treemap (rank not visible)</td>
    </tr>
    <tr>
      <th scope="row">Geographic distribution</th>
      <td>Choropleth or bubble map</td>
      <td>3D globe; chart with state labels</td>
    </tr>
    <tr>
      <th scope="row">(fallback) when unsure</th>
      <td>Sorted bar with annotations</td>
      <td>Anything fancy</td>
    </tr>
  </tbody>
</table>
```

A 7-condition + 1-fallback matrix. The reader picks the condition
that matches their data, reads the action and the anti-pattern.
This is the canonical "chart-type decision table" — the visual
form of the catalog's TB-08.

## Sample — HTTP status response matrix

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">If the response is…</th>
      <th scope="col">Action</th>
      <th scope="col">Retry?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row"><code>200 OK</code></th>
      <td>Parse and use the body</td>
      <td>N/A</td>
    </tr>
    <tr>
      <th scope="row"><code>4xx</code> (any)</th>
      <td>Surface the error to the user; don't retry</td>
      <td>No</td>
    </tr>
    <tr>
      <th scope="row"><code>429 Too Many Requests</code></th>
      <td>Wait <code>Retry-After</code>; back off</td>
      <td>Yes — bounded</td>
    </tr>
    <tr>
      <th scope="row"><code>500-503</code></th>
      <td>Retry with exponential backoff + jitter</td>
      <td>Yes — bounded</td>
    </tr>
    <tr>
      <th scope="row"><code>504 Gateway Timeout</code></th>
      <td>Same as 5xx — retry with backoff</td>
      <td>Yes — bounded</td>
    </tr>
    <tr>
      <th scope="row">Network error (no response)</th>
      <td>Retry with backoff; surface after N attempts</td>
      <td>Yes — bounded</td>
    </tr>
  </tbody>
</table>
```

The "Retry?" column is the visual binary — the reader scans it
column-by-column to identify retriable cases. The text format
("Yes — bounded" / "No" / "N/A") sorts naturally (`localeCompare`).

## Sample — sort tie-break decision matrix

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">When two cells compare equal…</th>
      <th scope="col">Tie-break</th>
      <th scope="col">Why</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Numeric column, both NaN</th>
      <td>Treat both as <code>+Infinity</code>; original order wins</td>
      <td>Non-numeric strays sort last; stable</td>
    </tr>
    <tr>
      <th scope="row">Numeric column, both 0</th>
      <td>Original DOM order</td>
      <td>Stable sort property — see [sort-cycle-3-state.md](./sort-cycle-3-state.md) |</td>
    </tr>
    <tr>
      <th scope="row">String column, both equal under <code>localeCompare</code> base sensitivity</th>
      <td>Original DOM order (case-preserved within the equal group)</td>
      <td>Stable sort property |</td>
    </tr>
    <tr>
      <th scope="row">Tie-break NOT negated by sort direction</th>
      <td>Equal keys keep DOM order in BOTH <code>asc</code> and <code>desc</code></td>
      <td>Stability is direction-independent |</td>
    </tr>
  </tbody>
</table>
```

A reference matrix for the sort algorithm's behaviour. The reader
hits a tie-break case and finds the explanation.

## Sample — error handling matrix

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Error type</th>
      <th scope="col">Catch where</th>
      <th scope="col">Action</th>
      <th scope="col">Anti-pattern</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">User input invalid</th>
      <td>Form handler</td>
      <td>Show inline validation; do not submit</td>
      <td>Server-side reject; no client feedback</td>
    </tr>
    <tr>
      <th scope="row">Network transient</th>
      <td>HTTP layer</td>
      <td>Retry with backoff</td>
      <td>Catch in every UI component</td>
    </tr>
    <tr>
      <th scope="row">Programmer error (bug)</th>
      <td>Top-level error boundary</td>
      <td>Log to monitoring; show generic UI</td>
      <td>Swallow + return null</td>
    </tr>
    <tr>
      <th scope="row">Unrecoverable (DB corruption)</th>
      <td>Process-level handler</td>
      <td>Crash the process; alert ops</td>
      <td>Keep running in broken state</td>
    </tr>
  </tbody>
</table>
```

A 4-column matrix — error type / where to catch / what to do /
what NOT to do. The 4-column shape is the upper limit of comfort
for a decision matrix; beyond it the reader's eye loses the
row-level alignment.

## DESIGN.md tokens consumed

A decision matrix is a `data` table — it inherits the runtime
baseline (border, zebra, header divider) and the module's sort +
CSV affordances. No matrix-specific tokens consumed.

Inline `<code>` spans in cells consume the runtime's code styling
(`--vc-font-mono`, `--vc-color-surface-2` for the inline-code
background).

## Selection / comment / decision-mini notes

Each row is a row-atom — the reader can comment on a specific
condition ("does this also apply to case X?") or attach a
decision-mini pill ("approve / deny this recommendation").

For a fully-cross-referenced decision aid where the reader might
want to comment on a SPECIFIC cell (not the whole row), switch to
`compare` mode for the dual-stamping (each body cell becomes its
own atom).

## CSV-export contract

A decision matrix exports cleanly:

```csv
If your data is…,Use a…,Avoid
"Comparison (N categories, one metric each)","Sorted bar chart","Pie (hard to compare angles)"
"Composition (parts of a whole)","Stacked bar or treemap","Pie with > 5 slices; 3D anything"
...
```

The receiving spreadsheet sees a 3-column reference table — useful
for filtering ("show me only the rows where I should avoid pie
charts").

A 4-column variant with the anti-pattern column adds one more
field per row. The CSV is a perfect format for an LLM to ingest
the matrix as guidance.
