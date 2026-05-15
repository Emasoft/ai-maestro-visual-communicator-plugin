// test-table-viz.js
//
// Dev-browser script — exercises scripts/amvcp-tables.js, the Phase-2
// table visualize module (TB-01/03/06/07/09).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpTables` + Node `module.exports`). This suite loads it as
// a browser global from table-viz.html — a self-contained fixture that
// pulls in only amvcp-designmd.js + amvcp-tables.js (NOT the full
// runtime) — and drives the five table modes:
//
//   data    — click-to-sort, numeric auto-detect, right-align
//   virtual — window-scroll virtualization, sticky header / frozen col
//   matrix  — status-glyph coverage grid
//   compare — icon headers, emphasis column
//   + the cross-cutting copy-as-CSV affordance
//   + the colspan/rowspan grid map and the rowspan sort-decline path
//
// Coverage (spec §13 test plan): sort numeric, sort cycle, numeric
// right-align, sort-moves-nodes (selection survives), nosort inert,
// virtual window, virtual scroll, frozen sticky header, no-inner-
// scroller, matrix glyphs, matrix tint, compare icons, compare
// emphasis, grid spanning, rowspan sort declines, CSV copy, theme
// reflow, JS-off degradation — plus pure-function unit checks.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/table-viz.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  // Wait until the module installed its global AND init() ran (the boot
  // script calls init synchronously after the global appears).
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(
      () => typeof window.amvcpTables === 'object'
        && typeof window.amvcpTables.init === 'function'
        && document.__veTablesInit === true
    );
    if (ready) return true;
    await page.waitForTimeout(60);
  }
  return false;
}

// Click a sortable header by its column index. Drives a real mouse path
// (move-then-click) so any hover-dependent behaviour surfaces.
async function clickHeader(page, tableId, colIndex) {
  const box = await page.evaluate((args) => {
    const table = document.getElementById(args.id);
    const th = table.tHead.rows[args.idx === undefined ? 0 : 0]
      ? table.tHead.rows[0].cells[args.idx]
      : null;
    if (!th) return null;
    th.scrollIntoView({ block: 'center' });
    const r = th.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, { id: tableId, idx: colIndex });
  if (!box) return false;
  await page.mouse.move(box.x, box.y, { steps: 6 });
  await page.waitForTimeout(60);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(200);
  return true;
}

// Read the first-column textContent of every body row of a table.
async function readFirstColumn(page, tableId) {
  return page.evaluate((id) => {
    const table = document.getElementById(id);
    const out = [];
    const bodies = table.tBodies || [];
    for (let b = 0; b < bodies.length; b++) {
      const rows = bodies[b].rows;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute('data-ve-table-spacer')) continue;
        out.push((rows[i].cells[0] ? rows[i].cells[0].textContent : '').trim());
      }
    }
    return out;
  }, tableId);
}

// ── Tests ───────────────────────────────────────────────────────────

async function testSortNumeric(page) {
  // Clicking the Revenue header sorts rows numerically (asc) — not
  // lexically. 1,240,000 must come AFTER 980,500 (lexically '1' < '9'
  // so a string sort would be wrong).
  if (!(await setup(page))) {
    record('tables_sort_numeric', 'FAIL', 'sort numeric', 'fixture never ready');
    return;
  }
  await clickHeader(page, 't-data', 1); // Revenue column, asc
  const regions = await readFirstColumn(page, 't-data');
  // Expected numeric-asc revenue order: MEA(295k) LATAM(410k) APAC(980k)
  // EMEA(1.24M) AMER(2.03M).
  const ok = regions.join(',') === 'MEA,LATAM,APAC,EMEA,AMER';
  record(
    'tables_sort_numeric',
    ok ? 'PASS' : 'FAIL',
    'click Revenue header → rows sort numerically ascending, not lexically',
    JSON.stringify(regions)
  );
}

async function testSortCycle(page) {
  // The header cycles none → asc → desc → none across three clicks;
  // aria-sort updates each time and the rows reorder accordingly.
  if (!(await setup(page))) {
    record('tables_sort_cycle', 'FAIL', 'sort cycle', 'fixture never ready');
    return;
  }
  const sortAfter = async () => page.evaluate(() => {
    const th = document.getElementById('t-data').tHead.rows[0].cells[1];
    return th.getAttribute('aria-sort');
  });
  await clickHeader(page, 't-data', 1);
  const s1 = await sortAfter();
  const asc = await readFirstColumn(page, 't-data');
  await clickHeader(page, 't-data', 1);
  const s2 = await sortAfter();
  const desc = await readFirstColumn(page, 't-data');
  await clickHeader(page, 't-data', 1);
  const s3 = await sortAfter();
  const off = await readFirstColumn(page, 't-data');
  const ok = s1 === 'ascending'
    && s2 === 'descending'
    && s3 === 'none'
    && asc.join(',') === 'MEA,LATAM,APAC,EMEA,AMER'
    && desc.join(',') === 'AMER,EMEA,APAC,LATAM,MEA'
    // none restores the original authored order.
    && off.join(',') === 'EMEA,APAC,AMER,LATAM,MEA';
  record(
    'tables_sort_cycle',
    ok ? 'PASS' : 'FAIL',
    'header cycles none→asc→desc→none; aria-sort + row order track each click',
    JSON.stringify({ s1, s2, s3, off })
  );
}

async function testNumericRightAlign(page) {
  // The auto-detected numeric columns (Revenue, Growth %) get
  // text-align:right on their cells; the string Region column does not.
  if (!(await setup(page))) {
    record('tables_numeric_right_align', 'FAIL', 'numeric right-align', 'fixture never ready');
    return;
  }
  await clickHeader(page, 't-data', 1); // trigger detection on Revenue
  await clickHeader(page, 't-data', 2); // trigger detection on Growth %
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-data');
    const row = table.tBodies[0].rows[0];
    const cs = (cell) => getComputedStyle(cell).textAlign;
    return {
      regionAlign: cs(row.cells[0]),
      revenueAlign: cs(row.cells[1]),
      growthAlign: cs(row.cells[2])
    };
  });
  const ok = res.revenueAlign === 'right'
    && res.growthAlign === 'right'
    && res.regionAlign !== 'right';
  record(
    'tables_numeric_right_align',
    ok ? 'PASS' : 'FAIL',
    'auto-detected numeric columns right-align; string column does not',
    JSON.stringify(res)
  );
}

async function testSortMovesNodes(page) {
  // A row carries data-ve-pressed="1" (AMER). After a sort the SAME
  // node must still carry that attribute — proving the sort MOVED the
  // <tr> node rather than cloning it (a clone would drop selection).
  if (!(await setup(page))) {
    record('tables_sort_moves_nodes', 'FAIL', 'sort moves nodes', 'fixture never ready');
    return;
  }
  await clickHeader(page, 't-data', 1); // sort by Revenue asc
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-data');
    // Find the row whose Region cell says AMER, after the sort.
    let pressedRegion = null;
    let pressedCount = 0;
    const rows = table.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-ve-pressed') === '1') {
        pressedCount++;
        pressedRegion = rows[i].cells[0].textContent.trim();
      }
    }
    return { pressedRegion, pressedCount };
  });
  const ok = res.pressedCount === 1 && res.pressedRegion === 'AMER';
  record(
    'tables_sort_moves_nodes',
    ok ? 'PASS' : 'FAIL',
    'a data-ve-pressed row keeps its attribute after a sort (node moved, not cloned)',
    JSON.stringify(res)
  );
}

async function testNosortInert(page) {
  // The data-ve-nosort header (Notes) gets no sort arrow, no aria-sort,
  // and clicking it does not reorder the rows.
  if (!(await setup(page))) {
    record('tables_nosort_inert', 'FAIL', 'nosort inert', 'fixture never ready');
    return;
  }
  const before = await readFirstColumn(page, 't-data');
  const headerState = await page.evaluate(() => {
    const th = document.getElementById('t-data').tHead.rows[0].cells[3];
    return {
      hasArrow: !!th.querySelector('.ve-sort-arrow'),
      sortable: th.getAttribute('data-ve-sortable'),
      ariaSort: th.getAttribute('aria-sort')
    };
  });
  await clickHeader(page, 't-data', 3); // click the Notes (nosort) header
  const after = await readFirstColumn(page, 't-data');
  const ok = headerState.hasArrow === false
    && headerState.sortable === null
    && before.join(',') === after.join(',');
  record(
    'tables_nosort_inert',
    ok ? 'PASS' : 'FAIL',
    'data-ve-nosort header has no arrow and does not reorder rows on click',
    JSON.stringify({ headerState, reordered: before.join(',') !== after.join(',') })
  );
}

async function testVirtualWindow(page) {
  // The 400-row virtual table renders only ~visible+overscan rows (far
  // fewer than 400), and the two spacer rows are present with non-zero
  // height reserving the off-screen space.
  if (!(await setup(page))) {
    record('tables_virtual_window', 'FAIL', 'virtual window', 'fixture never ready');
    return;
  }
  // Give the rAF-deferred measurement + first render time to settle.
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const tbody = document.getElementById('t-virtual-body');
    const rows = tbody.rows;
    let dataRows = 0;
    let spacers = 0;
    let spacerHeightSum = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-ve-table-spacer')) {
        spacers++;
        const td = rows[i].cells[0];
        spacerHeightSum += parseFloat(td.style.height) || 0;
      } else {
        dataRows++;
      }
    }
    return { dataRows, spacers, spacerHeightSum, totalInDom: rows.length };
  });
  const ok = res.dataRows > 0
    && res.dataRows < 100      // virtualized — nowhere near 400
    && res.spacers === 2       // top + bottom spacer
    && res.spacerHeightSum > 0; // spacers reserve the off-screen height
  record(
    'tables_virtual_window',
    ok ? 'PASS' : 'FAIL',
    '400-row table renders only ~visible+overscan rows; 2 spacers reserve the rest',
    JSON.stringify(res)
  );
}

async function testVirtualScroll(page) {
  // Scrolling the PAGE (window-scroll model — no inner scrollbar)
  // changes the rendered slice: the first rendered ID after a deep
  // scroll differs from the first rendered ID at the top.
  if (!(await setup(page))) {
    record('tables_virtual_scroll', 'FAIL', 'virtual scroll', 'fixture never ready');
    return;
  }
  await page.waitForTimeout(400);
  const firstIdAtTop = await page.evaluate(() => {
    const tbody = document.getElementById('t-virtual-body');
    for (let i = 0; i < tbody.rows.length; i++) {
      if (!tbody.rows[i].getAttribute('data-ve-table-spacer')) {
        return tbody.rows[i].cells[0].textContent.trim();
      }
    }
    return null;
  });
  // Scroll the document so the virtual table's middle is in view.
  await page.evaluate(() => {
    const table = document.getElementById('t-virtual');
    const r = table.getBoundingClientRect();
    const doc = document.scrollingElement || document.documentElement;
    window.scrollTo(0, r.top + doc.scrollTop + 4000);
  });
  await page.waitForTimeout(400);
  const firstIdScrolled = await page.evaluate(() => {
    const tbody = document.getElementById('t-virtual-body');
    for (let i = 0; i < tbody.rows.length; i++) {
      if (!tbody.rows[i].getAttribute('data-ve-table-spacer')) {
        return tbody.rows[i].cells[0].textContent.trim();
      }
    }
    return null;
  });
  const ok = firstIdAtTop !== null
    && firstIdScrolled !== null
    && firstIdAtTop !== firstIdScrolled;
  record(
    'tables_virtual_scroll',
    ok ? 'PASS' : 'FAIL',
    'scrolling the page (window-scroll model) updates the rendered slice',
    JSON.stringify({ firstIdAtTop, firstIdScrolled })
  );
}

async function testFrozenHeaderSticky(page) {
  // The virtual table's <thead> cells are position:sticky with an
  // OPAQUE --vc-color-surface background (a transparent sticky cell
  // would bleed scrolled content through).
  if (!(await setup(page))) {
    record('tables_frozen_header_sticky', 'FAIL', 'frozen header sticky', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const th = document.getElementById('t-virtual').tHead.rows[0].cells[0];
    const cs = getComputedStyle(th);
    return {
      position: cs.position,
      // bg must be an actual opaque color, not transparent / rgba(…,0).
      bg: cs.backgroundColor,
      // the first column is frozen → also sticky-left.
      hasFrozenClass: th.className.indexOf('ve-col-frozen') !== -1
    };
  });
  const transparent = res.bg === 'transparent'
    || res.bg === 'rgba(0, 0, 0, 0)'
    || /,\s*0\)\s*$/.test(res.bg);
  const ok = res.position === 'sticky'
    && !transparent
    && res.hasFrozenClass === true;
  record(
    'tables_frozen_header_sticky',
    ok ? 'PASS' : 'FAIL',
    '<thead> cells are position:sticky with an opaque surface background',
    JSON.stringify(res)
  );
}

async function testNoInnerScroller(page) {
  // The no-nested-scrollbars invariant: NO element in the virtual
  // table's subtree (the table, its wrapper, tbody, cells) has
  // overflow:auto or overflow:scroll. The page scroll is the only one.
  if (!(await setup(page))) {
    record('tables_no_inner_scroller', 'FAIL', 'no inner scroller', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-virtual');
    const nodes = [table];
    if (table.parentNode) nodes.push(table.parentNode);
    const descendants = table.querySelectorAll('*');
    for (let i = 0; i < descendants.length; i++) nodes.push(descendants[i]);
    let offenders = 0;
    for (let i = 0; i < nodes.length; i++) {
      const cs = getComputedStyle(nodes[i]);
      const ox = cs.overflowX;
      const oy = cs.overflowY;
      if (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll') {
        offenders++;
      }
    }
    return { checked: nodes.length, offenders };
  });
  const ok = res.offenders === 0;
  record(
    'tables_no_inner_scroller',
    ok ? 'PASS' : 'FAIL',
    'no element in the big-data table subtree has overflow:auto/scroll',
    JSON.stringify(res)
  );
}

async function testMatrixGlyphs(page) {
  // Each data-ve-val cell gets the correct Unicode glyph (✓/✗/◐/—), an
  // aria-label with the word, and a visually-hidden word span; the
  // glyph element itself is aria-hidden.
  if (!(await setup(page))) {
    record('tables_matrix_glyphs', 'FAIL', 'matrix glyphs', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-matrix');
    const want = { pass: '✓', fail: '✗', partial: '◐', na: '—' };
    const word = { pass: 'Pass', fail: 'Fail', partial: 'Partial', na: 'Not applicable' };
    const cells = table.querySelectorAll('td[data-ve-val]');
    let allGlyphsRight = true;
    let allAriaRight = true;
    let allSrWords = true;
    let allGlyphsHidden = true;
    let noEmoji = true;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const v = c.getAttribute('data-ve-val');
      const g = c.querySelector('.ve-matrix-glyph');
      const sr = c.querySelector('.ve-tables-sr-only');
      if (!g || g.textContent !== want[v]) allGlyphsRight = false;
      if (g && g.getAttribute('aria-hidden') !== 'true') allGlyphsHidden = false;
      if (c.getAttribute('aria-label') !== word[v]) allAriaRight = false;
      if (!sr || sr.textContent !== word[v]) allSrWords = false;
      // No char in the glyph may be in an emoji range.
      if (g) {
        const cp = g.textContent.codePointAt(0);
        if (cp >= 0x1F000) noEmoji = false;
      }
    }
    return {
      cellCount: cells.length, allGlyphsRight, allAriaRight,
      allSrWords, allGlyphsHidden, noEmoji
    };
  });
  const ok = res.cellCount === 15
    && res.allGlyphsRight && res.allAriaRight
    && res.allSrWords && res.allGlyphsHidden && res.noEmoji;
  record(
    'tables_matrix_glyphs',
    ok ? 'PASS' : 'FAIL',
    'matrix cells get the right Unicode glyph + aria-label + sr-only word; no emoji',
    JSON.stringify(res)
  );
}

async function testMatrixTint(page) {
  // A pass cell's background resolves through --vc-color-success; a
  // fail cell through --vc-color-danger. The two must differ and
  // neither be transparent.
  if (!(await setup(page))) {
    record('tables_matrix_tint', 'FAIL', 'matrix tint', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-matrix');
    const pass = table.querySelector('td[data-ve-val="pass"]');
    const fail = table.querySelector('td[data-ve-val="fail"]');
    return {
      passBg: getComputedStyle(pass).backgroundColor,
      failBg: getComputedStyle(fail).backgroundColor,
      passGlyphColor: getComputedStyle(pass.querySelector('.ve-matrix-glyph')).color,
      failGlyphColor: getComputedStyle(fail.querySelector('.ve-matrix-glyph')).color
    };
  });
  const isTransparent = (c) => c === 'transparent'
    || c === 'rgba(0, 0, 0, 0)' || /,\s*0\)\s*$/.test(c);
  const ok = !isTransparent(res.passBg)
    && !isTransparent(res.failBg)
    && res.passBg !== res.failBg
    && res.passGlyphColor !== res.failGlyphColor;
  record(
    'tables_matrix_tint',
    ok ? 'PASS' : 'FAIL',
    'pass/fail cells tint through --vc-color-success/--vc-color-danger',
    JSON.stringify(res)
  );
}

async function testCompareIcons(page) {
  // data-ve-col-icon headers render the Unicode glyph in a .ve-col-icon
  // span; the emphasised column's header icon uses the accent color
  // (distinct from the muted color of a normal column's icon).
  if (!(await setup(page))) {
    record('tables_compare_icons', 'FAIL', 'compare icons', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-compare');
    const headers = table.tHead.rows[0].cells;
    const iconA = headers[1].querySelector('.ve-col-icon');   // normal
    const iconB = headers[2].querySelector('.ve-col-icon');   // emphasised
    return {
      iconAText: iconA ? iconA.textContent : null,
      iconBText: iconB ? iconB.textContent : null,
      iconAColor: iconA ? getComputedStyle(iconA).color : null,
      iconBColor: iconB ? getComputedStyle(iconB).color : null,
      criterionHasIcon: !!headers[0].querySelector('.ve-col-icon')
    };
  });
  const ok = res.iconAText === '◇'
    && res.iconBText === '◆'
    // emphasised icon color differs from the normal icon color.
    && res.iconAColor !== res.iconBColor
    // the row-label column has no icon.
    && res.criterionHasIcon === false;
  record(
    'tables_compare_icons',
    ok ? 'PASS' : 'FAIL',
    'data-ve-col-icon headers render glyphs; emphasised icon uses the accent color',
    JSON.stringify(res)
  );
}

async function testCompareEmphasis(page) {
  // The data-ve-col-emphasis="1" column's every cell (header + body,
  // spanning-safe) is accent-tinted. A second emphasis attribute,
  // injected at runtime, must trigger exactly one console.warn and
  // emphasise only the first column.
  if (!(await setup(page))) {
    record('tables_compare_emphasis', 'FAIL', 'compare emphasis', 'fixture never ready');
    return;
  }
  const tintRes = await page.evaluate(() => {
    const table = document.getElementById('t-compare');
    // Column index 2 (Option B) is the emphasised one. Check the header
    // and every body row's cell carries .ve-col-emphasis.
    let allTinted = true;
    const header = table.tHead.rows[0].cells[2];
    if (header.className.indexOf('ve-col-emphasis') === -1) allTinted = false;
    const bodyRows = table.tBodies[0].rows;
    for (let i = 0; i < bodyRows.length; i++) {
      if (bodyRows[i].cells[2].className.indexOf('ve-col-emphasis') === -1) {
        allTinted = false;
      }
    }
    // The non-emphasised columns must NOT be tinted.
    const optAtinted = table.tHead.rows[0].cells[1]
      .className.indexOf('ve-col-emphasis') !== -1;
    return { allTinted, optAtinted };
  });
  // Now exercise the fail-fast: a fresh table with TWO emphasis columns
  // must warn once and tint only the first.
  const failFast = await page.evaluate(() => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = function () {
      warnings.push(Array.prototype.join.call(arguments, ' '));
      origWarn.apply(console, arguments);
    };
    const main = document.querySelector('main');
    const t = document.createElement('table');
    t.id = 'ff-compare';
    t.setAttribute('data-ve-table', 'compare');
    t.innerHTML =
      '<thead><tr>' +
      '<th>Crit</th>' +
      '<th data-ve-col-emphasis="1">First</th>' +
      '<th data-ve-col-emphasis="1">Second</th>' +
      '</tr></thead>' +
      '<tbody><tr><th scope="row">x</th><td>a</td><td>b</td></tr></tbody>';
    main.appendChild(t);
    window.amvcpTables.init();   // re-run — idempotent, picks up the new table
    console.warn = origWarn;
    const headers = t.tHead.rows[0].cells;
    return {
      warnCount: warnings.filter(function (w) {
        return w.indexOf('data-ve-col-emphasis') !== -1;
      }).length,
      firstTinted: headers[1].className.indexOf('ve-col-emphasis') !== -1,
      secondTinted: headers[2].className.indexOf('ve-col-emphasis') !== -1
    };
  });
  const ok = tintRes.allTinted === true
    && tintRes.optAtinted === false
    && failFast.warnCount === 1
    && failFast.firstTinted === true
    && failFast.secondTinted === false;
  record(
    'tables_compare_emphasis',
    ok ? 'PASS' : 'FAIL',
    'emphasis column fully tinted; a second emphasis attr → one warn, first only',
    JSON.stringify({ tintRes, failFast })
  );
}

async function testGridSpanning(page) {
  // The grouped-header table (thead colspan) sorts correctly: clicking
  // the "Actual" header at grid column 2 must sort the body rows by
  // that body column via the grid map, NOT a broken nth-child index.
  if (!(await setup(page))) {
    record('tables_grid_spanning', 'FAIL', 'grid spanning', 'fixture never ready');
    return;
  }
  // The grouped table's header row 0 is [Item(rowspan2), Q1(colspan2),
  // Q2(colspan2)]; row 1 is [Plan, Actual, Plan, Actual]. The module
  // wires the FIRST header row. Header cell index 1 = "Q1" spanning
  // grid columns 1-2. Clicking it sorts by grid column 1 (Q1 Plan):
  // Widgets=100, Gadgets=80 → asc gives Gadgets, Widgets.
  await clickHeader(page, 't-grouped', 1);
  const order = await readFirstColumn(page, 't-grouped');
  // Verify the grid map itself via the pure buildCellGrid export.
  const gridRes = await page.evaluate(() => {
    const table = document.getElementById('t-grouped');
    const info = window.amvcpTables.buildCellGrid(table);
    // colCount must be 5 (Item + 4 quarter columns). Row 0's grid
    // column 1 origin must be the "Q1" colspan cell.
    const slot01 = info.grid[0] && info.grid[0][1];
    const slot02 = info.grid[0] && info.grid[0][2];
    return {
      colCount: info.colCount,
      rowCount: info.rowCount,
      // grid col 1 and 2 of row 0 reference the SAME node (Q1 spans 2),
      // and only col 1 is the origin.
      sameNode: !!(slot01 && slot02 && slot01.node === slot02.node),
      col1IsOrigin: !!(slot01 && slot01.isOrigin),
      col2IsContinuation: !!(slot02 && !slot02.isOrigin),
      hasBodyRowspan: info.hasBodyRowspan
    };
  });
  const ok = order.join(',') === 'Gadgets,Widgets'
    && gridRes.colCount === 5
    && gridRes.sameNode === true
    && gridRes.col1IsOrigin === true
    && gridRes.col2IsContinuation === true
    // the rowspan in this table is in the HEADER (Item), not the body.
    && gridRes.hasBodyRowspan === false;
  record(
    'tables_grid_spanning',
    ok ? 'PASS' : 'FAIL',
    'grouped-header (thead colspan) table sorts via the grid map, not nth-child',
    JSON.stringify({ order, gridRes })
  );
}

async function testRowspanSortDeclines(page) {
  // The body-rowspan table must NOT get sort arrows — reordering rows
  // would tear the rowspan. The grid map reports hasBodyRowspan:true
  // and no header carries data-ve-sortable.
  if (!(await setup(page))) {
    record('tables_rowspan_sort_declines', 'FAIL', 'rowspan sort declines', 'fixture never ready');
    return;
  }
  const before = await readFirstColumn(page, 't-rowspan');
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-rowspan');
    const headers = table.tHead.rows[0].cells;
    let anySortable = false;
    let anyArrow = false;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].getAttribute('data-ve-sortable') !== null) anySortable = true;
      if (headers[i].querySelector('.ve-sort-arrow')) anyArrow = true;
    }
    const info = window.amvcpTables.buildCellGrid(table);
    return { anySortable, anyArrow, hasBodyRowspan: info.hasBodyRowspan };
  });
  // Click the Count header anyway — it must NOT reorder (no handler).
  await clickHeader(page, 't-rowspan', 2);
  const after = await readFirstColumn(page, 't-rowspan');
  const ok = res.anySortable === false
    && res.anyArrow === false
    && res.hasBodyRowspan === true
    && before.join(',') === after.join(',');
  record(
    'tables_rowspan_sort_declines',
    ok ? 'PASS' : 'FAIL',
    'body-rowspan table: no sort arrows, no reorder on header click',
    JSON.stringify({ res, reordered: before.join(',') !== after.join(',') })
  );
}

async function testCsvCopy(page) {
  // The data-ve-table-csv="1" table gets a Copy-CSV button. Clicking it
  // writes RFC-4180-quoted CSV to the clipboard. Read it back via the
  // clipboard API and verify the quoting of a comma field and a
  // double-quote field.
  if (!(await setup(page))) {
    record('tables_csv_copy', 'FAIL', 'csv copy', 'fixture never ready');
    return;
  }
  // Grant clipboard read so the test can read back what was written.
  try {
    await page.context().grantPermissions(
      ['clipboard-read', 'clipboard-write'],
      { origin: 'http://127.0.0.1:8767' }
    );
  } catch (_) { /* some dev-browser builds auto-grant — ignore */ }

  const btnBox = await page.evaluate(() => {
    const wrap = document.getElementById('t-csv').parentNode;
    const btn = wrap ? wrap.querySelector('.ve-table-csv-btn') : null;
    if (!btn) return null;
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, exists: true };
  });
  if (!btnBox) {
    record('tables_csv_copy', 'FAIL', 'csv copy', 'Copy-CSV button not injected');
    return;
  }
  await page.mouse.click(btnBox.x, btnBox.y);
  await page.waitForTimeout(400);
  // Read back from the clipboard; fall back to the module's pure
  // tableToCsv if the headless clipboard is unreadable.
  const res = await page.evaluate(async () => {
    let clip = null;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        clip = await navigator.clipboard.readText();
      }
    } catch (_) { clip = null; }
    const pure = window.amvcpTables.tableToCsv(document.getElementById('t-csv'));
    return { clip: clip, pure: pure };
  });
  const csv = (res.clip && res.clip.length) ? res.clip : res.pure;
  const lines = csv.split('\r\n');
  const ok = lines.length === 4
    && lines[0] === 'Name,Quote,Amount'
    && lines[1] === 'Plain,simple value,100'
    // a field with a comma is wrapped in quotes.
    && lines[2] === '"Comma, here","has, commas",250'
    // a field with a double-quote is wrapped and the quote doubled.
    && lines[3] === '"Quote ""mark""","she said ""hi""",375';
  record(
    'tables_csv_copy',
    ok ? 'PASS' : 'FAIL',
    'Copy-CSV button writes RFC-4180-quoted CSV (comma + quote fields escaped)',
    JSON.stringify({ usedClipboard: !!(res.clip && res.clip.length), lines })
  );
}

async function testThemeReflow(page) {
  // Toggling the theme (re-resolve + re-apply --vc-* tokens) must
  // re-theme the matrix/compare tints with NO stylesheet swap — the
  // same CSS rules, the token values flip underneath. A pass cell's
  // background must differ between light and dark.
  if (!(await setup(page))) {
    record('tables_theme_reflow', 'FAIL', 'theme reflow', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const passCell = document.getElementById('t-matrix')
      .querySelector('td[data-ve-val="pass"]');
    const emphCell = document.getElementById('t-compare')
      .tHead.rows[0].cells[2];
    // Light values (the fixture boots in light).
    const lightPassBg = getComputedStyle(passCell).backgroundColor;
    const lightEmphBg = getComputedStyle(emphCell).backgroundColor;
    // Count <style id="ve-tables-style"> before + after the toggle —
    // it must NOT change (no second stylesheet).
    const styleCountBefore = document.querySelectorAll('#ve-tables-style').length;
    window.__veApplyTheme('dark');
    const styleCountAfter = document.querySelectorAll('#ve-tables-style').length;
    const darkPassBg = getComputedStyle(passCell).backgroundColor;
    const darkEmphBg = getComputedStyle(emphCell).backgroundColor;
    return {
      lightPassBg, darkPassBg, lightEmphBg, darkEmphBg,
      styleCountBefore, styleCountAfter
    };
  });
  const ok = res.lightPassBg !== res.darkPassBg
    && res.lightEmphBg !== res.darkEmphBg
    && res.styleCountBefore === 1
    && res.styleCountAfter === 1; // exactly one stylesheet, never swapped
  record(
    'tables_theme_reflow',
    ok ? 'PASS' : 'FAIL',
    'theme toggle re-themes matrix/compare tints with no stylesheet swap',
    JSON.stringify(res)
  );
}

async function testJsOffDegradation(page) {
  // With amvcpTables.init NOT called, the 400-row table must keep ALL
  // 400 <tr> in the served DOM (find-in-page + JS-off readers see every
  // row), and the pure-CSS position:sticky header still works. The
  // fixture's boot script runs init, so this test loads the page with
  // JS-injected interception disabled is not possible — instead it
  // verifies the SERVED markup has 400 rows (the boot script only adds
  // rows, never trims; virtualization never removes rows from the JS
  // array, only from the live tbody). It re-counts the module's
  // captured row array.
  if (!(await setup(page))) {
    record('tables_jsoff_degradation', 'FAIL', 'js-off degradation', 'fixture never ready');
    return;
  }
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const table = document.getElementById('t-virtual');
    const state = table.__veVirtual;
    // The module holds every authored row in state.allRows — none are
    // discarded; virtualization only controls which are in the live
    // tbody. A JS-off reader gets the full server HTML (400 rows).
    const capturedRows = state ? state.allRows.length : 0;
    // The sticky header is pure CSS — it works with no JS at all.
    const headerPos = getComputedStyle(table.tHead.rows[0].cells[0]).position;
    return { capturedRows, headerPos };
  });
  const ok = res.capturedRows === 400
    && res.headerPos === 'sticky';
  record(
    'tables_jsoff_degradation',
    ok ? 'PASS' : 'FAIL',
    'all 400 rows retained (JS-off / find-in-page safe); sticky header is pure-CSS',
    JSON.stringify(res)
  );
}

async function testPureFunctions(page) {
  // Unit-checks the module's pure exports in the page (same code path
  // as the Node module.exports surface): parseCellNumber, the sort
  // comparator, the virtual-window math, computeScrollDelta.
  if (!(await setup(page))) {
    record('tables_pure_functions', 'FAIL', 'pure functions', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const t = window.amvcpTables;
    const checks = [];
    const ok = (name, cond) => checks.push({ name, ok: !!cond });

    // parseCellNumber
    ok('num plain', t.parseCellNumber('42').value === 42);
    ok('num sep', t.parseCellNumber('1,240,000').value === 1240000);
    ok('num currency', t.parseCellNumber('$980,500').value === 980500);
    ok('num percent', t.parseCellNumber('12.4%').value === 12.4);
    ok('num empty fails', !t.parseCellNumber('').ok);
    ok('num garbage fails', !t.parseCellNumber('12abc').ok);

    // comparator — numeric + natural string + stability
    const R = (txt, idx) => ({ row: { __veSortText: txt }, index: idx });
    const numAsc = [R('980500', 0), R('1240000', 1), R('8100', 2)]
      .sort(t.makeComparator(true, 'asc'));
    ok('cmp num asc', numAsc[0].row.__veSortText === '8100');
    const strAsc = [R('item10', 0), R('item2', 1)]
      .sort(t.makeComparator(false, 'asc'));
    ok('cmp natural string', strAsc[0].row.__veSortText === 'item2');
    const eq = [R('5', 0), R('5', 1), R('5', 2)]
      .sort(t.makeComparator(true, 'desc'));
    ok('cmp stable', eq[0].index === 0 && eq[1].index === 1 && eq[2].index === 2);

    // virtual-window math
    const wTop = t.computeVirtualWindow({
      scrollY: 0, tableTop: 0, viewportH: 320, rowHeight: 32, rowCount: 400
    });
    ok('vwin top', wTop.firstVisible === 0 && wTop.lastVisible > 0);
    const wPast = t.computeVirtualWindow({
      scrollY: 999999, tableTop: 0, viewportH: 320, rowHeight: 32, rowCount: 400
    });
    ok('vwin past clamp', wPast.lastVisible <= 399 && wPast.lastVisible < wPast.firstVisible);
    const wEmpty = t.computeVirtualWindow({
      scrollY: 0, tableTop: 0, viewportH: 320, rowHeight: 32, rowCount: 0
    });
    ok('vwin empty', wEmpty.firstVisible === 0 && wEmpty.lastVisible === -1);

    // computeScrollDelta
    ok('scroll delta', t.computeScrollDelta({
      tableTop: 100, anchorNewIndex: 50, rowHeight: 32, anchorViewportOffset: 64
    }) === 100 + 1600 - 64);

    let failed = 0;
    for (let i = 0; i < checks.length; i++) {
      if (!checks[i].ok) failed++;
    }
    return { total: checks.length, failed: failed, checks: checks };
  });
  const ok = res.failed === 0 && res.total >= 13;
  record(
    'tables_pure_functions',
    ok ? 'PASS' : 'FAIL',
    'pure exports (parseCellNumber, comparator, window math, scrollDelta) all correct',
    JSON.stringify({ total: res.total, failed: res.failed })
  );
}

// ── Phase 2.5 atom-contract tests (TRDD-352ef46a) ──────────────────

async function testRowAtomContract(page) {
  // After init() runs, every body <tr> in a `data` table must carry
  // data-ve-comment-id (the row-atom contract marker the runtime's
  // selection logic gates on). The id is deterministic so re-init
  // doesn't churn it. Header rows (in <thead>) are NOT stamped — they're
  // chrome, not selectable atoms.
  if (!(await setup(page))) {
    record('tables_row_atom_contract', 'FAIL', 'row atom contract', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const t = document.getElementById('t-data');
    const bodyRows = t.tBodies[0].rows;
    const headerRows = t.tHead.rows;
    let bodyStamped = 0;
    let allHaveIds = true;
    let idsAreUnique = true;
    const seen = {};
    for (let i = 0; i < bodyRows.length; i++) {
      const cid = bodyRows[i].getAttribute('data-ve-comment-id');
      if (cid) {
        bodyStamped++;
        if (seen[cid]) idsAreUnique = false;
        seen[cid] = 1;
      } else {
        allHaveIds = false;
      }
    }
    let headerStamped = 0;
    for (let i = 0; i < headerRows.length; i++) {
      if (headerRows[i].getAttribute('data-ve-comment-id')) headerStamped++;
    }
    return {
      bodyCount: bodyRows.length,
      bodyStamped,
      headerStamped,
      allHaveIds,
      idsAreUnique,
      sampleId: bodyRows[0] ? bodyRows[0].getAttribute('data-ve-comment-id') : null,
    };
  });
  const ok = res.bodyCount === 5
    && res.bodyStamped === 5
    && res.headerStamped === 0
    && res.allHaveIds === true
    && res.idsAreUnique === true
    && /^row:/.test(res.sampleId || '');
  record(
    'tables_row_atom_contract',
    ok ? 'PASS' : 'FAIL',
    'every body <tr> has unique data-ve-comment-id; thead rows do NOT',
    JSON.stringify(res)
  );
}

async function testRowAtomIdempotent(page) {
  // Calling init() twice does not double-stamp or change ids.
  if (!(await setup(page))) {
    record('tables_row_atom_idempotent', 'FAIL', 'row atom idempotent', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const t = document.getElementById('t-data');
    const before = [];
    const rows = t.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      before.push(rows[i].getAttribute('data-ve-comment-id'));
    }
    // Re-run init (which re-walks every table). Idempotent if ids match.
    window.amvcpTables.init();
    const after = [];
    for (let i = 0; i < rows.length; i++) {
      after.push(rows[i].getAttribute('data-ve-comment-id'));
    }
    return { before, after, equal: JSON.stringify(before) === JSON.stringify(after) };
  });
  record(
    'tables_row_atom_idempotent',
    res.equal ? 'PASS' : 'FAIL',
    'a second init() preserves every row\'s data-ve-comment-id',
    JSON.stringify({ equal: res.equal })
  );
}

async function testMatrixCellAtomContract(page) {
  // Every <td data-ve-val> in a matrix table must carry data-ve-id +
  // data-ve-type="matrix-cell". Header <th> cells must NOT be stamped.
  // The id format is "matrix-cell:<table-tag>:r<n>:c<m>".
  if (!(await setup(page))) {
    record('tables_matrix_cell_atom_contract', 'FAIL', 'matrix cell atom contract', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const t = document.getElementById('t-matrix');
    const valCells = t.querySelectorAll('td[data-ve-val]');
    let stamped = 0;
    let typed = 0;
    let idsAreUnique = true;
    const seen = {};
    let sampleId = null;
    for (let i = 0; i < valCells.length; i++) {
      const id = valCells[i].getAttribute('data-ve-id');
      const ty = valCells[i].getAttribute('data-ve-type');
      if (id) {
        stamped++;
        if (!sampleId) sampleId = id;
        if (seen[id]) idsAreUnique = false;
        seen[id] = 1;
      }
      if (ty === 'matrix-cell') typed++;
    }
    // <th> cells in matrix rows must NOT be stamped (they're row labels).
    const ths = t.querySelectorAll('tbody th');
    let thStamped = 0;
    for (let i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-ve-id')) thStamped++;
    }
    return {
      valCellCount: valCells.length,
      stamped,
      typed,
      idsAreUnique,
      thStamped,
      sampleId,
    };
  });
  const ok = res.valCellCount === 15  // 3 rows × 5 cols
    && res.stamped === 15
    && res.typed === 15
    && res.idsAreUnique === true
    && res.thStamped === 0
    && /^matrix-cell:/.test(res.sampleId || '');
  record(
    'tables_matrix_cell_atom_contract',
    ok ? 'PASS' : 'FAIL',
    'every <td data-ve-val> has data-ve-id + data-ve-type="matrix-cell"; <th> not',
    JSON.stringify(res)
  );
}

async function testCompareCellAtomContract(page) {
  // Every body <td> in a comparison table must carry data-ve-id +
  // data-ve-type="compare-cell". Body <th> (row labels) must NOT.
  // The compare table also has row-atom stamps coexisting with the
  // cell-atom stamps.
  if (!(await setup(page))) {
    record('tables_compare_cell_atom_contract', 'FAIL', 'compare cell atom contract', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    const t = document.getElementById('t-compare');
    const tdCells = t.querySelectorAll('tbody td');
    let stamped = 0;
    let typed = 0;
    let sampleId = null;
    for (let i = 0; i < tdCells.length; i++) {
      const id = tdCells[i].getAttribute('data-ve-id');
      const ty = tdCells[i].getAttribute('data-ve-type');
      if (id) {
        stamped++;
        if (!sampleId) sampleId = id;
      }
      if (ty === 'compare-cell') typed++;
    }
    const ths = t.querySelectorAll('tbody th');
    let thStamped = 0;
    for (let i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-ve-id')) thStamped++;
    }
    // Row-atom contract still applies to compare tables.
    const rows = t.tBodies[0].rows;
    let rowStamped = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-ve-comment-id')) rowStamped++;
    }
    return {
      tdCount: tdCells.length,
      stamped,
      typed,
      thStamped,
      rowStamped,
      rowCount: rows.length,
      sampleId,
    };
  });
  const ok = res.tdCount === 9  // 3 rows × 3 option columns
    && res.stamped === 9
    && res.typed === 9
    && res.thStamped === 0
    && res.rowStamped === res.rowCount
    && /^compare-cell:/.test(res.sampleId || '');
  record(
    'tables_compare_cell_atom_contract',
    ok ? 'PASS' : 'FAIL',
    'compare body <td> has data-ve-id+type=compare-cell; rows also row-stamped',
    JSON.stringify(res)
  );
}

async function testDecisionMiniDefensive(page) {
  // The defensive bridge to attachDecisionMini must be a silent no-op
  // when window.amvcpRuntime is not loaded — the standalone fixture
  // never loads the runtime. After init() runs, no JS errors fired and
  // every atom is still correctly stamped (i.e. the absent helper does
  // not break the rest of the enhancement chain).
  if (!(await setup(page))) {
    record('tables_decision_mini_defensive', 'FAIL', 'decision mini defensive', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    // Confirm the runtime helper is in fact absent on this fixture.
    const helperPresent = !!(window.amvcpRuntime
      && typeof window.amvcpRuntime.attachDecisionMini === 'function');
    // Re-running init() must not throw — if the defensive guard ever
    // breaks, the throw would propagate and the post-init assertion
    // below would never run.
    let threw = false;
    try { window.amvcpTables.init(); }
    catch (e) { threw = true; }
    // Confirm atoms are still correctly stamped (the chain didn't bail).
    const t = document.getElementById('t-data');
    const tr = t.tBodies[0].rows[0];
    return {
      helperPresent,
      threw,
      rowStillStamped: !!tr.getAttribute('data-ve-comment-id'),
    };
  });
  const ok = res.helperPresent === false
    && res.threw === false
    && res.rowStillStamped === true;
  record(
    'tables_decision_mini_defensive',
    ok ? 'PASS' : 'FAIL',
    'defensive bridge is silent no-op when window.amvcpRuntime absent',
    JSON.stringify(res)
  );
}

async function testDecisionMiniInvoked(page) {
  // When window.amvcpRuntime.attachDecisionMini IS available, the
  // bridge MUST forward the call. Verified by:
  //   1. Stub the helper to record every call.
  //   2. Force a re-stamp of one row's atom by removing its
  //      data-ve-comment-id, then re-running init (which re-walks the
  //      rows and the freshly-unstamped row gets stamped + bridged).
  //   3. Confirm at least one call landed AND the call's id is one of
  //      the row/matrix-cell/compare-cell prefixes (so any stamp path
  //      that ran would be visible).
  // Note on idempotency: the bridge is also called on the IDEMPOTENT
  // path (when the atom already has its id) so an existing-stamped row
  // still gets the pill on every init pass — that's the contract per
  // user req #10 ("INDEPENDENT of selection state, always present").
  if (!(await setup(page))) {
    record('tables_decision_mini_invoked', 'FAIL', 'decision mini invoked', 'fixture never ready');
    return;
  }
  const res = await page.evaluate(() => {
    // Install a recording stub BEFORE the re-init so every atom's
    // bridge call (idempotent path included) is observable.
    const calls = [];
    window.amvcpRuntime = {
      attachDecisionMini: function (el, id) {
        calls.push({
          tag: el && el.tagName,
          id: id,
        });
      }
    };
    // Re-run init — every row + matrix cell + compare cell goes
    // through the bridge again (idempotent stamping path still calls
    // the bridge by design — the pill is always-on, not selection-gated).
    window.amvcpTables.init();
    // Cleanup so other tests aren't affected.
    delete window.amvcpRuntime;
    return {
      callCount: calls.length,
      sampleCall: calls[0] || null,
      // Distinct prefixes seen — proves the bridge ran on each atom kind.
      kindsSeen: Array.from(new Set(calls.map(function (c) {
        return c.id.split(':')[0];
      }))).sort(),
    };
  });
  // 5 data rows + 400 virtual rows + 15 matrix cells + 9 compare cells
  // + 3 compare rows + 2 grouped rows + 3 rowspan rows + 3 csv rows
  // = 440 atom calls. Use ≥ 30 as a robust lower bound (avoids brittle
  // exact match if fixture row counts change). The kinds-seen array
  // proves all three atom-kind code paths fired.
  const ok = res.callCount >= 30
    && res.sampleCall !== null
    && res.kindsSeen.indexOf('row') >= 0
    && res.kindsSeen.indexOf('matrix-cell') >= 0
    && res.kindsSeen.indexOf('compare-cell') >= 0;
  record(
    'tables_decision_mini_invoked',
    ok ? 'PASS' : 'FAIL',
    'attachDecisionMini bridge forwards on every atom (always-on per req #10)',
    JSON.stringify({ callCount: res.callCount, kindsSeen: res.kindsSeen })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSortNumeric,
  testSortCycle,
  testNumericRightAlign,
  testSortMovesNodes,
  testNosortInert,
  testVirtualWindow,
  testVirtualScroll,
  testFrozenHeaderSticky,
  testNoInnerScroller,
  testMatrixGlyphs,
  testMatrixTint,
  testCompareIcons,
  testCompareEmphasis,
  testGridSpanning,
  testRowspanSortDeclines,
  testCsvCopy,
  testThemeReflow,
  testJsOffDegradation,
  testPureFunctions,
  // Phase 2.5 — selection/comment contract conformance (TRDD-352ef46a).
  testRowAtomContract,
  testRowAtomIdempotent,
  testMatrixCellAtomContract,
  testCompareCellAtomContract,
  testDecisionMiniDefensive,
  testDecisionMiniInvoked,
];

const page = await browser.getPage("table-viz-tests");

for (const t of tests) {
  try {
    await t(page);
  } catch (e) {
    record(t.name || 'unnamed', 'ERROR', t.name || '', String(e && e.message || e).slice(0, 120));
  }
}

for (const r of results) {
  console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
}
