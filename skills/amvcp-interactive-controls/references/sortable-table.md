# Sortable table — click-to-sort + numeric auto-detect

A pure-JS sortable `<table>` with three-state cycle (asc / desc /
unsorted-original-order), numeric-column auto-detection (right-align
+ numeric compare), and a sort indicator chevron in the header. Zero
dependency, works with any DOM-authored or runtime-rendered table.

## What it is

The runtime already ships table styling (`scripts/amvcp-runtime.js`
`.ve-table` class). This widget ADDS interactivity to any table that
opts in via `data-ic-sortable` on the `<table>`. The pattern goes:

- Click a `<th>` once → sort ascending.
- Click again → sort descending.
- Click a third time → return to authored DOM order.
- Cycling through columns clears prior sort.

The original DOM order is captured at boot via the rows' insertion
order, so "unsorted" is meaningful even after many sorts.

## Scaffold

```html
<table class="ic-table" data-ic-sortable data-id="findings"
       data-ic-persist>
  <thead>
    <tr>
      <th data-ic-sort>File</th>
      <th data-ic-sort>Line</th>           <!-- numeric -->
      <th data-ic-sort>Severity</th>
      <th data-ic-sort>Count</th>          <!-- numeric -->
    </tr>
  </thead>
  <tbody>
    <tr><td>src/auth.ts</td><td>42</td><td>high</td><td>1,283</td></tr>
    <tr><td>src/db.ts</td><td>117</td><td>low</td><td>4</td></tr>
    <tr><td>src/cache.ts</td><td>9</td><td>med</td><td>62</td></tr>
  </tbody>
</table>
```

CSS additions on top of the runtime's table chrome:

```css
.ic-table th[data-ic-sort] {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 1.6em;   /* room for the chevron */
}
.ic-table th[data-ic-sort]:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: -2px;
}
.ic-table th[data-ic-sort]::after {
  content: "";
  position: absolute;
  right: 0.6em;
  top: 50%;
  width: 0;
  height: 0;
  margin-top: -3px;
  border: 4px solid transparent;
  border-top-color: var(--ve-control-fg-dim, #5b5343);
  opacity: 0.35;
}
.ic-table th[data-ic-sort][data-ic-sort-dir="asc"]::after {
  margin-top: -5px;
  border-top-color: transparent;
  border-bottom-color: var(--vc-color-accent, #b8861f);
  opacity: 1;
}
.ic-table th[data-ic-sort][data-ic-sort-dir="desc"]::after {
  border-top-color: var(--vc-color-accent, #b8861f);
  opacity: 1;
}
.ic-table td[data-ic-numeric="1"] {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: var(--ve-control-mono, ui-monospace, Menlo, monospace);
}
```

## JS engine

```js
var NUM_RE = /^[\s$£€]*-?[0-9][0-9,]*\.?[0-9]*\s*[%]?$/;

function parseNumeric(s) {
  return Number(String(s).replace(/[\s,$£€%]/g, ''));
}

function detectNumericCols(table) {
  var ths   = table.querySelectorAll('thead th');
  var rows  = table.querySelectorAll('tbody tr');
  var isNum = new Array(ths.length).fill(true);
  rows.forEach(function (tr) {
    Array.prototype.forEach.call(tr.children, function (td, i) {
      if (!NUM_RE.test(td.textContent.trim())) { isNum[i] = false; }
    });
  });
  isNum.forEach(function (n, i) {
    if (!n) { return; }
    rows.forEach(function (tr) {
      var td = tr.children[i];
      if (td) { td.setAttribute('data-ic-numeric', '1'); }
    });
  });
  return isNum;
}

function initSortableTable(table) {
  var thead = table.tHead;
  var tbody = table.tBodies[0];
  if (!thead || !tbody) { return; }
  var ths       = Array.from(thead.querySelectorAll('th[data-ic-sort]'));
  var origOrder = Array.from(tbody.querySelectorAll('tr'));
  var isNum     = detectNumericCols(table);

  function applySort(colIdx, dir) {
    if (dir === null) {
      // restore original order
      origOrder.forEach(function (tr) { tbody.appendChild(tr); });
      return;
    }
    var copy = origOrder.slice();
    var num  = isNum[colIdx];
    copy.sort(function (a, b) {
      var av = a.children[colIdx].textContent.trim();
      var bv = b.children[colIdx].textContent.trim();
      var cmp = num
        ? (parseNumeric(av) - parseNumeric(bv))
        : av.localeCompare(bv);
      return dir === 'asc' ? cmp : -cmp;
    });
    copy.forEach(function (tr) { tbody.appendChild(tr); });
  }

  ths.forEach(function (th, idx) {
    th.setAttribute('tabindex', '0');
    th.setAttribute('role', 'button');
    th.setAttribute('aria-sort', 'none');

    var cycle = function () {
      var cur = th.getAttribute('data-ic-sort-dir') || null;
      var next = cur === null ? 'asc' : (cur === 'asc' ? 'desc' : null);
      // clear every other column
      ths.forEach(function (x) {
        x.removeAttribute('data-ic-sort-dir');
        x.setAttribute('aria-sort', 'none');
      });
      if (next) {
        th.setAttribute('data-ic-sort-dir', next);
        th.setAttribute('aria-sort', next === 'asc' ? 'ascending' : 'descending');
      }
      applySort(idx, next);
      if (table.hasAttribute('data-ic-persist')) {
        amvcpInteractive.saveState(table, { col: idx, dir: next });
      }
    };
    th.addEventListener('click', cycle);
    th.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault(); cycle();
      }
    });
  });

  if (table.hasAttribute('data-ic-persist')) {
    var saved = amvcpInteractive.loadState(table, null);
    if (saved && saved.dir) {
      var th = ths[saved.col];
      if (th) {
        th.setAttribute('data-ic-sort-dir', saved.dir);
        th.setAttribute('aria-sort',
          saved.dir === 'asc' ? 'ascending' : 'descending');
        applySort(saved.col, saved.dir);
      }
    }
  }
}
document.querySelectorAll('table[data-ic-sortable]').forEach(initSortableTable);
```

The `NUM_RE` tolerates thousands separators (`1,283`), trailing
`%`, and currency prefixes; whatever the renderer emits as a
"number-shaped string" is recognised.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | active sort chevron + focus ring |
| `--ve-control-fg-dim` | resting chevron |
| `--ve-control-mono` | numeric column font |
| `--vc-radius-sm` (optional) | sort indicator pill if you swap arrow → pill |

## Selection / comment / decision-mini

- **Each row carries `data-ve-id="row:<table-id>:<row-key>"`** so a
  comment pinned to "the row about src/auth.ts" follows the row
  through sorts. The row-key must be intrinsic (e.g. a file path),
  NOT positional — sorting would scramble positional ids.
- **Header cells are NOT atoms** — they're verbs.
- **Decision-mini.** Per-row Skip / Approve / Deny (e.g. the
  reviewer marks one finding as a false positive).

## JS-off degradation

**Table renders in its authored DOM order; sorting is unavailable.**
With JS off:

- The table is fully readable.
- No sort indicator chevrons appear (the CSS `::after` only shows
  on `[data-ic-sort]`-marked headers — that attribute is in the
  HTML, so the chevron IS visible, but at 35% opacity to look
  "inactive").
- Headers are not clickable affordances.

The default DOM order should be a sensible reading order (severity
desc, or alphabetical) so the table is useful without sort.

## Anti-patterns

- Storing the sort order in a parallel array. The DOM IS the
  order. `tbody.appendChild(tr)` re-orders by moving the node.
- Re-detecting numeric columns on every sort. Detect once at boot.
- Hardcoding the sort cycle as "asc → desc → asc → desc forever".
  The third click MUST restore original order — that's the
  difference between a sortable table and one the user can never
  reset.
- Forgetting `aria-sort` updates. AT users rely on it; without it
  the sort is invisible.
- Sorting strings with `<` / `>` instead of `localeCompare()` —
  breaks for accented characters and non-Latin scripts.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Click the "Line" header — rows sort ascending numeric.
const lineTh = Array.from(document.querySelectorAll('th[data-ic-sort]'))
  .find(t => t.textContent.trim() === 'Line');
lineTh.click();
let rows = Array.from(document.querySelectorAll('tbody tr'));
console.assert(rows[0].children[1].textContent === '9',
               'asc sort failed');

// Click again — desc.
lineTh.click();
rows = Array.from(document.querySelectorAll('tbody tr'));
console.assert(rows[0].children[1].textContent === '117',
               'desc sort failed');

// Click a third time — restored original order.
lineTh.click();
rows = Array.from(document.querySelectorAll('tbody tr'));
console.assert(rows[0].children[0].textContent === 'src/auth.ts',
               'restore failed');
```

Screenshot light + dark themes with the chevron in each state.
Verify numeric columns are right-aligned with tabular-nums (the
digit columns line up).
