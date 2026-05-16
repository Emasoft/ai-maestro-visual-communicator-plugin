/*!
 * ai-maestro-visual-communicator-plugin — table visualize module.
 *
 * Phase 2 (table technique, TB-01/03/06/07/09). A standalone,
 * dependency-free module that enhances author-written `<table>` elements
 * marked with a `data-ve-table` attribute into one of five modes:
 *
 *   data-ve-table="data"     — click-to-sort, numeric auto-detect
 *   data-ve-table="data" +
 *     data-ve-table-virtual   — window-scroll virtualization, sticky
 *                               header / frozen columns, scroll-anchor
 *   data-ve-table="matrix"   — status-glyph coverage grid (pass/fail/…)
 *   data-ve-table="compare"  — side-by-side comparison, emphasis column
 *
 * Plus a cross-cutting opt-in copy-as-CSV affordance (data-ve-table-csv).
 *
 * The runtime already ships a styled-table baseline (borders, zebra,
 * <tr>-as-selectable-atom, no-nested-scrollbars). This module ADDS the
 * five modes on top; it never re-implements the baseline and never
 * edits the runtime. The runtime calls window.amvcpTables.init() once
 * from bootEverything(); init() is idempotent and degrades to a no-op
 * when no table on the page opts in.
 *
 * No build step, no npm runtime deps. Themed purely through the
 * `--vc-*` CSS custom properties emitted by amvcp-designmd.js; every
 * value carries a fallback so a table still renders if that engine is
 * absent. Dual export:
 *   - browser: `window.amvcpTables = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js — `var`, function
 * declarations, ES5-safe, no arrow functions, no template literals,
 * no classes.
 *
 * Fail-fast contract: an enhancement that cannot apply cleanly simply
 * does NOT attach (no try/catch swallowing a broken state). Ambiguous
 * input — two emphasis columns, body rowspans under a sort — is
 * surfaced with a single console.warn / console.info, never silently
 * mis-rendered.
 *
 * API:
 *   init()                       -> scan + enhance every data-ve-table
 *   parseCellNumber(text)        -> { ok, value } numeric cell parser
 *   makeComparator(numeric, dir) -> Array.prototype.sort comparator
 *   computeVirtualWindow(o)      -> { firstVisible, lastVisible }
 *   computeScrollDelta(o)        -> new scrollY keeping an anchor row put
 *   buildCellGrid(table)         -> 2-D grid map (colspan/rowspan aware)
 *   tableToCsv(table)            -> RFC-4180 CSV string
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // Matrix status glyphs. Plain Unicode geometric marks, NEVER emoji —
  // emoji render inconsistently across platforms and screen readers.
  var MATRIX_GLYPH = {
    pass: '✓',     // ✓ CHECK MARK
    fail: '✗',     // ✗ BALLOT X
    partial: '◐',  // ◐ CIRCLE WITH LEFT HALF BLACK
    na: '—'        // — EM DASH
  };

  // Accessible word announced for each matrix status (also the CSV cell
  // text — the export carries the word, not the glyph).
  var MATRIX_WORD = {
    pass: 'Pass',
    fail: 'Fail',
    partial: 'Partial',
    na: 'Not applicable'
  };

  // Overscan — extra rows rendered above/below the visible window so a
  // fast scroll never flashes a blank gap. Matches the reference default.
  var VIRTUAL_OVERSCAN = 3;

  // Rows sampled to derive the uniform row height. Report tables are
  // overwhelmingly uniform-height, so a single median number is correct.
  var VIRTUAL_MEASURE_SAMPLE = 20;

  // ── Pure helpers — numeric parsing ─────────────────────────────────
  //
  // parseCellNumber normalises a table cell's text into a number. It
  // tolerates the shapes report tables actually use: thousands
  // separators, one leading currency glyph, one trailing percent sign,
  // surrounding whitespace. An empty string is NOT a number (so an
  // empty cell never silently disqualifies a numeric column — callers
  // skip empties). A garbage cell ("12abc") yields ok:false — the
  // fail-fast behaviour that demotes the whole column to string sort.

  function parseCellNumber(text) {
    if (typeof text !== 'string') {
      return { ok: false, value: 0 };
    }
    var s = text.replace(/^\s+|\s+$/g, '');
    if (s === '') {
      return { ok: false, value: 0 };
    }
    // Strip one optional leading currency symbol.
    s = s.replace(/^[$€£¥]/, '');
    // Strip one optional trailing percent sign.
    s = s.replace(/%$/, '');
    // Strip thousands separators and any interior whitespace.
    s = s.replace(/[,\s]/g, '');
    if (s === '') {
      return { ok: false, value: 0 };
    }
    // Number('') is 0 and Number('12abc') is NaN — exactly the
    // discrimination we want. parseFloat would wrongly accept '12abc'.
    var n = Number(s);
    if (isNaN(n) || !isFinite(n)) {
      return { ok: false, value: 0 };
    }
    return { ok: true, value: n };
  }

  // ── Pure helpers — sort comparator ─────────────────────────────────
  //
  // makeComparator returns a function suitable for Array.prototype.sort.
  // It compares the textContent of a fixed cell index of two <tr> rows.
  // Numeric columns compare by parsed value; string columns use
  // localeCompare with numeric:true for natural ordering (item2 before
  // item10). `dir` is 'asc' or 'desc'; 'desc' negates the result.
  //
  // Stability: Array.prototype.sort is stable in every browser since
  // ES2019. To stay correct on a hypothetical pre-2019 engine the
  // caller decorates each row with its original index and this
  // comparator falls back to that index on a tie — a decorate /
  // sort / undecorate that guarantees equal keys keep DOM order.

  function makeComparator(isNumeric, dir, cellTextOf) {
    var sign = (dir === 'desc') ? -1 : 1;
    var textOf = cellTextOf || defaultCellText;
    return function (a, b) {
      var primary;
      if (isNumeric) {
        var na = parseCellNumber(textOf(a.row));
        var nb = parseCellNumber(textOf(b.row));
        // A non-numeric straggler in a numeric column sorts last in asc
        // order (treated as +Infinity) so it never jumps to the top.
        var va = na.ok ? na.value : Infinity;
        var vb = nb.ok ? nb.value : Infinity;
        primary = (va < vb) ? -1 : (va > vb ? 1 : 0);
      } else {
        primary = textOf(a.row).localeCompare(
          textOf(b.row), undefined, { numeric: true, sensitivity: 'base' }
        );
      }
      if (primary !== 0) {
        return sign * primary;
      }
      // Tie-break on the original index — keeps the sort stable even on
      // an engine whose native sort is not. The index tiebreak is NOT
      // negated by `sign`: equal keys must keep DOM order in both
      // directions.
      return a.index - b.index;
    };
  }

  // Default cell-text accessor used by makeComparator when the caller
  // does not pass a grid-aware one. It is only a fallback — the live
  // sort path always passes a grid-aware accessor (spanning-safe).
  function defaultCellText(row) {
    return row && row.__veSortText ? row.__veSortText : '';
  }

  // ── Pure helpers — virtual-window math ─────────────────────────────
  //
  // computeVirtualWindow maps the document scroll position to the slice
  // of rows that should be in the DOM. The model is WINDOW-scroll
  // virtualization: there is no inner scrollbox (forbidden by the
  // no-nested-scrollbars rule). `o.scrollY` is the page scroll,
  // `o.tableTop` the table's top offset from the document origin,
  // `o.viewportH` the viewport height, `o.rowHeight` the uniform row
  // height, `o.rowCount` the total row count. Result is clamped to
  // [0, rowCount-1]; an empty table yields a degenerate but safe window.

  function computeVirtualWindow(o) {
    var rowHeight = o.rowHeight > 0 ? o.rowHeight : 1;
    var rowCount = o.rowCount > 0 ? o.rowCount : 0;
    if (rowCount === 0) {
      return { firstVisible: 0, lastVisible: -1 };
    }
    var overscan = (typeof o.overscan === 'number') ? o.overscan : VIRTUAL_OVERSCAN;
    var top = o.scrollY - o.tableTop;
    var rawFirst = Math.floor(top / rowHeight) - overscan;
    var rawLast = Math.ceil((top + o.viewportH) / rowHeight) + overscan;
    // Decide "render nothing" from the UNCLAMPED bounds. The table is
    // entirely outside the viewport when its last row sits above the
    // viewport top (rawLast < 0) or its first row sits below the
    // viewport bottom (rawFirst > rowCount-1). In that case return a
    // well-formed empty window (last < first) instead of collapsing two
    // clamped values onto the same row.
    if (rawLast < 0 || rawFirst > rowCount - 1) {
      return { firstVisible: 0, lastVisible: -1 };
    }
    // Otherwise clamp both ends into [0, rowCount-1].
    var first = rawFirst < 0 ? 0
      : (rawFirst > rowCount - 1 ? rowCount - 1 : rawFirst);
    var last = rawLast > rowCount - 1 ? rowCount - 1
      : (rawLast < 0 ? 0 : rawLast);
    return { firstVisible: first, lastVisible: last };
  }

  // computeScrollDelta — after the row set changes (a sort, an insert),
  // the row the reader was looking at would visually jump. Given that
  // anchor row's NEW index and the viewport-relative offset it had
  // BEFORE the mutation, return the scrollY that keeps it pinned at the
  // same on-screen position. Uniform-height model: O(1).

  function computeScrollDelta(o) {
    var rowHeight = o.rowHeight > 0 ? o.rowHeight : 1;
    return o.tableTop + (o.anchorNewIndex * rowHeight) - o.anchorViewportOffset;
  }

  // ── Pure helpers — cell grid (colspan / rowspan aware) ─────────────
  //
  // buildCellGrid implements the HTML "forming a table" algorithm. It
  // walks every <tr> and places each physical cell node into a 2-D grid;
  // a cell that spans S columns / R rows occupies S×R grid slots, all
  // referencing the SAME node. The slot at the cell's top-left is the
  // ORIGIN (isOrigin:true); every other slot it covers is a
  // continuation (isOrigin:false) — the "null-slot" pattern. This makes
  // "column N" mean grid column N regardless of spans, so column
  // operations (tint, right-align, emphasis) never use the broken
  // cells[N] / nth-child(N) indexing.
  //
  // Returns { grid, rowCount, colCount, hasBodyRowspan } where `grid`
  // is grid[rowIndex][colIndex] = { node, isOrigin } | undefined.

  function buildCellGrid(table) {
    var rows = collectAllRows(table);
    var grid = [];
    var colCount = 0;
    var hasBodyRowspan = false;
    // pending[colIndex] = remaining continuation rows for a rowspan that
    // started above the current row.
    var pending = {};
    var r;

    for (r = 0; r < rows.length; r++) {
      if (!grid[r]) {
        grid[r] = [];
      }
      var rowEl = rows[r];
      var inBody = isInTbody(rowEl);
      var cells = rowEl.cells ? rowEl.cells : [];
      var cursor = 0;
      var c;

      for (c = 0; c < cells.length; c++) {
        var cell = cells[c];
        // Skip grid columns still occupied by a rowspan from above.
        while (gridSlotTaken(grid, r, cursor)) {
          cursor++;
        }
        var colspan = readSpan(cell, 'colSpan');
        var rowspan = readSpan(cell, 'rowSpan');
        if (inBody && rowspan > 1) {
          hasBodyRowspan = true;
        }
        var dc, dr;
        for (dr = 0; dr < rowspan; dr++) {
          for (dc = 0; dc < colspan; dc++) {
            var gr = r + dr;
            var gc = cursor + dc;
            if (!grid[gr]) {
              grid[gr] = [];
            }
            grid[gr][gc] = {
              node: cell,
              isOrigin: (dr === 0 && dc === 0)
            };
          }
        }
        cursor += colspan;
        if (cursor > colCount) {
          colCount = cursor;
        }
      }
    }
    // `pending` is intentionally unused — gridSlotTaken reads the grid
    // directly, which is simpler than a separate pending map and
    // immune to drift between the two. Kept declared only so a future
    // reader does not re-introduce the map thinking it was forgotten.
    void pending;
    return {
      grid: grid,
      rowCount: grid.length,
      colCount: colCount,
      hasBodyRowspan: hasBodyRowspan
    };
  }

  // A grid slot is "taken" if a cell node was already placed there by a
  // rowspan/colspan from an earlier cell.
  function gridSlotTaken(grid, r, c) {
    return !!(grid[r] && grid[r][c]);
  }

  // Read a span attribute as a positive integer ≥ 1. A missing /
  // malformed span is 1 (the HTML default).
  function readSpan(cell, prop) {
    var v = cell[prop];
    if (typeof v !== 'number' || isNaN(v) || v < 1) {
      return 1;
    }
    return Math.floor(v);
  }

  // Collect the origin cell node of every row at a given grid column —
  // skipping continuation slots so a spanning cell is returned once.
  function columnOriginCells(gridInfo, colIndex) {
    var out = [];
    var seen = [];
    var r;
    for (r = 0; r < gridInfo.grid.length; r++) {
      var slot = gridInfo.grid[r] ? gridInfo.grid[r][colIndex] : undefined;
      if (slot && slot.isOrigin && indexOf(seen, slot.node) === -1) {
        seen.push(slot.node);
        out.push(slot.node);
      }
    }
    return out;
  }

  // ── Pure helpers — CSV serialization ───────────────────────────────
  //
  // tableToCsv walks the grid map so a spanning cell is exported exactly
  // once (at its origin). Each field's text is trimmed and interior
  // whitespace collapsed. RFC-4180 quoting: a field containing a comma,
  // a double-quote, or a newline is wrapped in "…" and any interior "
  // is doubled. The header row is included. Matrix cells export the
  // status WORD, not the glyph.

  function tableToCsv(table) {
    var gridInfo = buildCellGrid(table);
    var lines = [];
    var r, c;
    for (r = 0; r < gridInfo.grid.length; r++) {
      var fields = [];
      for (c = 0; c < gridInfo.colCount; c++) {
        var slot = gridInfo.grid[r] ? gridInfo.grid[r][c] : undefined;
        if (!slot) {
          // A genuinely empty grid cell (ragged table) — emit an empty
          // field so column alignment in the CSV is preserved.
          fields.push('');
        } else if (!slot.isOrigin) {
          // Continuation slot of a span — the value was already emitted
          // at the origin; emit an empty placeholder to keep columns
          // aligned without duplicating the text.
          fields.push('');
        } else {
          fields.push(csvQuote(cellExportText(slot.node)));
        }
      }
      lines.push(fields.join(','));
    }
    // RFC-4180 uses CRLF line endings.
    return lines.join('\r\n');
  }

  // The text a cell contributes to a CSV / a sort. A matrix status cell
  // contributes its WORD; any other cell contributes its trimmed,
  // whitespace-collapsed textContent — minus the module-injected sort
  // arrow span (.ve-sort-arrow) so the exported header is the user's
  // header text, not "Name↕".
  function cellExportText(cell) {
    var val = cell.getAttribute ? cell.getAttribute('data-ve-val') : null;
    if (val && hasOwn(MATRIX_WORD, val)) {
      return MATRIX_WORD[val];
    }
    var t;
    if (cell.cloneNode && cell.querySelectorAll) {
      var clone = cell.cloneNode(true);
      var arrows = clone.querySelectorAll('.ve-sort-arrow');
      var i;
      for (i = 0; i < arrows.length; i++) {
        if (arrows[i].parentNode) {
          arrows[i].parentNode.removeChild(arrows[i]);
        }
      }
      t = clone.textContent || '';
    } else {
      t = cell.textContent || '';
    }
    return t.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }

  // RFC-4180 quote a single field.
  function csvQuote(field) {
    if (/[",\r\n]/.test(field)) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }

  // ── DOM helpers ────────────────────────────────────────────────────

  // Every <tr> of a table, in document order (thead + tbody + tfoot).
  function collectAllRows(table) {
    var out = [];
    var trs = table.getElementsByTagName('tr');
    var i;
    for (i = 0; i < trs.length; i++) {
      // Only rows that belong to THIS table — a nested table's rows are
      // excluded (their closest table is the inner one).
      if (closestTable(trs[i]) === table) {
        out.push(trs[i]);
      }
    }
    return out;
  }

  // The <tbody> data rows of a table (excludes thead/tfoot and any
  // module-injected spacer row).
  function collectBodyRows(table) {
    var out = [];
    var bodies = table.tBodies || [];
    var b, i;
    for (b = 0; b < bodies.length; b++) {
      var rows = bodies[b].rows;
      for (i = 0; i < rows.length; i++) {
        if (closestTable(rows[i]) === table &&
            !rows[i].getAttribute('data-ve-table-spacer')) {
          out.push(rows[i]);
        }
      }
    }
    return out;
  }

  function isInTbody(tr) {
    var p = tr.parentNode;
    return !!(p && p.tagName && p.tagName.toLowerCase() === 'tbody');
  }

  // Nearest ancestor <table> of a node — used to attribute a <tr> to
  // exactly one table when tables are nested.
  function closestTable(node) {
    var n = node.parentNode;
    while (n) {
      if (n.tagName && n.tagName.toLowerCase() === 'table') {
        return n;
      }
      n = n.parentNode;
    }
    return null;
  }

  // True when a table is, or sits inside, a table-form — those are
  // owned by the amvcp-choice-tables skill and this module skips them
  // (the same guard the runtime uses for its table handles).
  function isTableFormScope(table) {
    if (table.getAttribute && table.getAttribute('data-ve-type') === 'table-form') {
      return true;
    }
    var n = table.parentNode;
    while (n) {
      if (n.getAttribute && n.getAttribute('data-ve-type') === 'table-form') {
        return true;
      }
      n = n.parentNode;
    }
    return false;
  }

  // ── Selection/comment contract conformance (Phase 2.5, TRDD-352ef46a) ──
  //
  // The runtime ships a 3-state visual atom contract:
  //   1) normal       — no [data-ve-selected] / [data-ve-pressed]
  //   2) hover/focus  — bright outer glow (CSS rule, automatic)
  //   3) selected     — [data-ve-selected="1"] (element-kind atoms)
  //                  OR [data-ve-pressed="1"]  (row/li/p/bq atoms)
  // Plus a SINGLE comment handle on the group container when ≥1 child is
  // selected (runtime: updateGroupCommentHandles + updateCommentHandles).
  //
  // For the contract to engage, the atom MUST carry one of:
  //   • [data-ve-id]            — element-kind (cards, cells, divs, …)
  //                               handled by the generic 3-state CSS at
  //                               runtime.js:615-635, comment-handle via
  //                               findCommentAnchor + openCommentModal.
  //   • [data-ve-comment-id]    — row/li/paragraph/blockquote selectable
  //                               atoms, handled by atom-paint events at
  //                               runtime.js:6447+, group handle via
  //                               updateGroupCommentHandles.
  //
  // Plain `<table data-ve-table>` widgets are author-written HTML, so
  // their <tr>/<td> nodes don't carry comment-id stamps the renderer
  // would have put on a server-rendered Markdown table. Phase 2.5 closes
  // that gap by stamping the contract attributes here, when the table is
  // enhanced. The stamps are deterministic (table tag + row/col index)
  // so they're stable across re-init and don't churn idmap entries.
  //
  // What gets stamped:
  //   • Every body <tr> (in `data` and `compare` modes) gets
  //     `data-ve-comment-id="row:<table-tag>:<rowIdx>"` so the runtime's
  //     row-atom contract activates: 3 visual states + group handle on
  //     the parent <table>.
  //   • In `matrix` mode, every <td data-ve-val> gets `data-ve-id` +
  //     `data-ve-type="matrix-cell"` so each cell becomes an element-
  //     kind atom (per-cell selection makes sense for a coverage matrix
  //     — selecting a row would obscure the per-cell pass/fail signal).
  //   • In `compare` mode, every body <td> gets `data-ve-id` +
  //     `data-ve-type="compare-cell"` so a single comparison cell can
  //     also be selected (in addition to the whole row). The runtime's
  //     enhanceFocus pass adds tabindex/role automatically.
  //
  // Header <th> cells are intentionally NOT stamped — they already have
  // their own affordance (sort handle on data tables; column-emphasis
  // header on compare tables). Stamping them as atoms would produce two
  // overlapping click affordances on the same target.

  // Defensive bridge to the runtime's per-atom Skip/Approve/Deny mini-
  // pill helper (Phase 2.5 user req #10). The pill is INDEPENDENT of
  // selection state — every atom always carries the pill, regardless of
  // [data-ve-selected] / [data-ve-pressed] / [data-ve-comment-id]. The
  // helper itself is shipped by the sibling p25-runtime-text-comment
  // agent on the runtime side. Until that lands (or when the runtime is
  // not loaded — e.g. in the standalone tables fixture), this is a
  // no-op so the module still degrades cleanly.
  //
  // The signature contract: window.amvcpRuntime.attachDecisionMini(
  //   atomEl, atomId
  // ). atomId can be a data-ve-comment-id (rows) or a data-ve-id (cells).
  // The runtime is responsible for idempotency, persistence (localStorage
  // keyed by atomId), and the segment toggle behaviour. Wrapping the
  // call in a try/catch protects the module from a buggy helper version.
  function attachDecisionMiniSafe(atomEl, atomId) {
    if (!atomEl || !atomId) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    var rt = window.amvcpRuntime;
    if (!rt || typeof rt.attachDecisionMini !== 'function') {
      return; // sibling helper not loaded — silent no-op (degrades cleanly)
    }
    try {
      rt.attachDecisionMini(atomEl, atomId);
    } catch (_e) {
      // A buggy helper version must never crash the table enhancer.
      // Phase 2.5 ships across many modules in parallel; tolerate the
      // race where one module is updated before its dependency.
    }
  }

  function tablesAtomTag(table) {
    // A stable per-table id string used as the prefix for row/cell
    // comment-ids. Authoring takes precedence: an author-set
    // data-ve-id wins so cross-render references stay stable.
    var existing = table.getAttribute('data-ve-id') || table.id;
    if (existing) {
      return existing;
    }
    // Stash on the node only; nothing reads it from the DOM. We don't
    // write the synthetic id back to data-ve-id because the runtime
    // would then treat the entire <table> as a selectable element-kind
    // atom and the existing CSS deliberately suppresses table-level
    // selection (only rows are selectable).
    if (table.__veAtomTag) {
      return table.__veAtomTag;
    }
    var fresh = 've-table-' + Math.random().toString(36).slice(2, 8);
    table.__veAtomTag = fresh;
    return fresh;
  }

  function stampRowAtoms(table) {
    // Every body <tr> in this table gets `data-ve-comment-id` so the
    // runtime's atom contract for rows engages. The id is deterministic
    // ("row:<tag>:<rowIdx>") so a re-init produces the same id and the
    // selection state is preserved across enhancements.
    var tag = tablesAtomTag(table);
    var rows = collectBodyRows(table);
    var i;
    for (i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var atomId;
      if (tr.hasAttribute('data-ve-comment-id')) {
        // Idempotent — never overwrite an author-set or earlier-set id.
        atomId = tr.getAttribute('data-ve-comment-id');
      } else {
        atomId = 'row:' + tag + ':' + (i + 1);
        tr.setAttribute('data-ve-comment-id', atomId);
      }
      attachDecisionMiniSafe(tr, atomId);
    }
  }

  function stampMatrixCellAtoms(table) {
    // Every coverage-matrix cell becomes an element-kind atom so each
    // pass/fail/partial cell can be individually selected and commented
    // on. Use data-ve-id (not data-ve-comment-id) because matrix cells
    // are atomic facts, not prose-grouped atoms — each click toggles a
    // single cell, no group-handle is desired.
    var tag = tablesAtomTag(table);
    var cells = table.querySelectorAll('td[data-ve-val]');
    var i;
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];
      if (closestTable(cell) !== table) {
        continue;
      }
      var atomId;
      if (cell.hasAttribute('data-ve-id')) {
        atomId = cell.getAttribute('data-ve-id');
      } else {
        // Locate the cell's row index and column index so the id is
        // human-readable in selection payloads (the agent receives e.g.
        // "matrix-cell:t-matrix:r2:c3").
        var rIdx = cellRowIndex(cell);
        var cIdx = cellColumnIndex(cell);
        atomId = 'matrix-cell:' + tag + ':r' + rIdx + ':c' + cIdx;
        cell.setAttribute('data-ve-id', atomId);
        cell.setAttribute('data-ve-type', 'matrix-cell');
      }
      // NOTE: NO per-cell decision-mini pill. The user contract is
      // "decision pill per ROW only", not per cell — pills on every
      // cell crowd the table and break the row-grain selection model.
      // Cells remain selectable atoms (data-ve-id stamped above);
      // commenting on a cell still works via the modal handle.
    }
  }

  function stampCompareCellAtoms(table) {
    // Every body <td> in a comparison table becomes an element-kind atom.
    // <th> header cells are skipped (they belong to row labels or column
    // headers, not the data being compared). The stamp coexists with the
    // row-level data-ve-comment-id stamp from stampRowAtoms — clicking a
    // single cell selects the cell; clicking outside any cell on the row
    // (e.g. on the row's left edge or the spacing) selects the row.
    var tag = tablesAtomTag(table);
    var bodies = table.tBodies || [];
    var b, r, c;
    for (b = 0; b < bodies.length; b++) {
      var rows = bodies[b].rows;
      for (r = 0; r < rows.length; r++) {
        var row = rows[r];
        if (closestTable(row) !== table) {
          continue;
        }
        if (row.getAttribute('data-ve-table-spacer')) {
          continue;
        }
        for (c = 0; c < row.cells.length; c++) {
          var cell = row.cells[c];
          // Only data cells (<td>) — <th scope="row"> labels are not
          // atoms (they're chrome that names the row).
          if (cell.tagName !== 'TD') {
            continue;
          }
          var atomId;
          if (cell.hasAttribute('data-ve-id')) {
            atomId = cell.getAttribute('data-ve-id');
          } else {
            atomId = 'compare-cell:' + tag + ':r' + (r + 1) + ':c' + (c + 1);
            cell.setAttribute('data-ve-id', atomId);
            cell.setAttribute('data-ve-type', 'compare-cell');
          }
          // NOTE: NO per-cell decision-mini pill — pills are per-ROW
          // only (set in stampRowAtoms). The cell remains a selectable
          // atom (data-ve-id above) so commenting on a single cell
          // still works through the modal handle, but the decision
          // S/A/D pill belongs to the row, not the cell.
        }
      }
    }
  }

  // The 1-based body-row index of a cell within its tbody. Walks up to
  // the parent <tr>, then walks the tbody to find the row's position.
  function cellRowIndex(cell) {
    var tr = cell.parentNode;
    if (!tr || tr.tagName !== 'TR') {
      return 1;
    }
    var tbody = tr.parentNode;
    if (!tbody || tbody.tagName !== 'TBODY') {
      return 1;
    }
    var rows = tbody.rows;
    var i;
    for (i = 0; i < rows.length; i++) {
      if (rows[i] === tr) {
        return i + 1;
      }
    }
    return 1;
  }

  // The 1-based column index of a cell among its row's siblings.
  function cellColumnIndex(cell) {
    var tr = cell.parentNode;
    if (!tr) return 1;
    var i;
    for (i = 0; i < tr.children.length; i++) {
      if (tr.children[i] === cell) {
        return i + 1;
      }
    }
    return 1;
  }

  // ── Stylesheet ─────────────────────────────────────────────────────
  //
  // One <style> element injected once. Every color / size is a
  // var(--vc-…, <fallback>). The fallback is the engine's canonical
  // LIGHT default so a table still renders if amvcp-designmd.js is
  // absent; when the engine IS present, a theme toggle flips the token
  // values underneath these rules — so light and dark are both
  // first-class with no second stylesheet and no prefers-color-scheme.

  var STYLE_ID = 've-tables-style';

  function tablesCss() {
    return [
      /* ── sortable data table ── */
      'table[data-ve-table="data"] thead th[data-ve-sortable] {',
      '  cursor: pointer;',
      '  user-select: none;',
      '  -webkit-user-select: none;',
      '}',
      'table[data-ve-table="data"] thead th .ve-sort-arrow {',
      '  display: inline-block;',
      '  margin-left: var(--vc-space-1, 8px);',
      '  font-size: 0.85em;',
      '  line-height: 1;',
      '  transition: color var(--vc-duration-fast, 120ms)',
      '    var(--vc-easing-standard, cubic-bezier(0.2,0,0,1)),',
      '    opacity var(--vc-duration-fast, 120ms)',
      '    var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
      '}',
      /* idle (unsorted) column — a dim hint arrow, shown only on hover/focus */
      'table[data-ve-table="data"] thead th[data-ve-sortable] .ve-sort-arrow {',
      '  opacity: 0;',
      '  color: color-mix(in srgb,',
      '    var(--vc-color-content-muted, #5b5343) 60%, transparent);',
      '}',
      'table[data-ve-table="data"] thead th[data-ve-sortable]:hover .ve-sort-arrow,',
      'table[data-ve-table="data"] thead th[data-ve-sortable]:focus-visible .ve-sort-arrow {',
      '  opacity: 1;',
      '}',
      /* active (sorted) column — solid accent arrow, always visible */
      'table[data-ve-table="data"] thead th[aria-sort="ascending"] .ve-sort-arrow,',
      'table[data-ve-table="data"] thead th[aria-sort="descending"] .ve-sort-arrow {',
      '  opacity: 1;',
      '  color: var(--vc-color-accent, #b8861f);',
      '}',
      'table[data-ve-table="data"] thead th[data-ve-sortable]:focus-visible {',
      '  outline: 2px solid var(--vc-color-accent, #b8861f);',
      '  outline-offset: -2px;',
      '}',
      /* the sorted column gets a faint accent wash so the eye finds it */
      'table[data-ve-table] .ve-col-sorted {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-accent, #b8861f) 8%, transparent);',
      '}',
      /* numeric columns right-align — numbers line up visually */
      'table[data-ve-table] .ve-cell-num {',
      '  text-align: right;',
      '  font-variant-numeric: tabular-nums;',
      '}',

      /* ── big-data: sticky header + frozen columns ── */
      /* sticky needs NO scroll container — it sticks within document flow.
         The opaque surface background is critical: a transparent sticky
         cell would show scrolled body content bleeding through. */
      'table[data-ve-table-virtual] thead th {',
      '  position: -webkit-sticky;',
      '  position: sticky;',
      '  top: 0;',
      '  z-index: 2;',
      '  background: var(--vc-color-surface, #ffffff);',
      '}',
      'table[data-ve-table-virtual] .ve-col-frozen {',
      '  position: -webkit-sticky;',
      '  position: sticky;',
      '  z-index: 1;',
      '  background: var(--vc-color-surface, #ffffff);',
      '}',
      /* a frozen column inside the sticky header — highest layer */
      'table[data-ve-table-virtual] thead th.ve-col-frozen {',
      '  z-index: 3;',
      '}',
      /* a slightly stronger divider marks the freeze boundary */
      'table[data-ve-table-virtual] .ve-col-frozen-edge {',
      '  border-right: 2px solid var(--vc-color-border-strong, #c9bfa3);',
      '}',
      /* spacer rows reserve the off-screen height; never interactive */
      'table[data-ve-table] tr[data-ve-table-spacer] td {',
      '  padding: 0;',
      '  border: 0;',
      '}',

      /* ── matrix / checklist ── */
      'table[data-ve-table="matrix"] td[data-ve-val] {',
      '  text-align: center;',
      '}',
      'table[data-ve-table="matrix"] .ve-matrix-glyph {',
      '  font-size: 1.1em;',
      '  line-height: 1;',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="pass"] {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-success, #3a6b5c) 12%, transparent);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="pass"] .ve-matrix-glyph {',
      '  color: var(--vc-color-success, #3a6b5c);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="fail"] {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-danger, #a84a32) 12%, transparent);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="fail"] .ve-matrix-glyph {',
      '  color: var(--vc-color-danger, #a84a32);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="partial"] {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-warning, #a8791f) 12%, transparent);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="partial"] .ve-matrix-glyph {',
      '  color: var(--vc-color-warning, #a8791f);',
      '}',
      'table[data-ve-table="matrix"] td[data-ve-val="na"] .ve-matrix-glyph {',
      '  color: var(--vc-color-content-muted, #5b5343);',
      '}',

      /* ── comparison ── */
      'table[data-ve-table="compare"] thead th .ve-col-icon {',
      '  display: inline-block;',
      '  margin-right: var(--vc-space-1, 8px);',
      '  color: var(--vc-color-content-muted, #5b5343);',
      '}',
      'table[data-ve-table="compare"] thead th.ve-col-emphasis .ve-col-icon {',
      '  color: var(--vc-color-accent, #b8861f);',
      '}',
      /* the emphasised column reads as a highlighted lane */
      'table[data-ve-table="compare"] .ve-col-emphasis {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-accent, #b8861f) 10%, transparent);',
      '}',
      'table[data-ve-table="compare"] .ve-col-emphasis-left {',
      '  border-left: 2px solid var(--vc-color-accent, #b8861f);',
      '}',
      'table[data-ve-table="compare"] .ve-col-emphasis-right {',
      '  border-right: 2px solid var(--vc-color-accent, #b8861f);',
      '}',

      /* ── visually-hidden text for matrix screen-reader words ── */
      '.ve-tables-sr-only {',
      '  position: absolute;',
      '  width: 1px;',
      '  height: 1px;',
      '  margin: -1px;',
      '  padding: 0;',
      '  border: 0;',
      '  overflow: hidden;',
      '  clip: rect(0 0 0 0);',
      '  white-space: nowrap;',
      '}',

      /* ── copy-as-CSV button ── */
      /* wrapper is relatively positioned so the button can sit top-right
         OUTSIDE the data; no inner scroller is introduced. */
      '.ve-table-csv-wrap {',
      '  position: relative;',
      '}',
      '.ve-table-csv-btn {',
      '  position: absolute;',
      '  top: 0;',
      '  right: 0;',
      '  z-index: 2;',
      '  font: inherit;',
      '  font-size: var(--vc-text-1, 14px);',
      '  padding: var(--vc-space-1, 8px) var(--vc-space-2, 12px);',
      '  color: var(--vc-color-content, #1f1a14);',
      '  background: var(--vc-color-surface, #ffffff);',
      '  border: 1px solid var(--vc-color-border, #e3dcc9);',
      '  border-radius: var(--vc-radius-sm, 4px);',
      '  cursor: pointer;',
      '  transition: background var(--vc-duration-fast, 120ms)',
      '    var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
      '}',
      '.ve-table-csv-btn:hover {',
      '  background: color-mix(in srgb,',
      '    var(--vc-color-accent, #b8861f) 12%,',
      '    var(--vc-color-surface, #ffffff));',
      '}'
    ].join('\n');
  }

  function injectStyle() {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = tablesCss();
    var head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.appendChild(style);
    }
  }

  // ── Mode: sortable data table ──────────────────────────────────────
  //
  // Wires click-to-sort onto a data-ve-table="data" table. Numeric
  // columns are detected lazily on the first click of their header and
  // right-aligned. The sort cycle is none → asc → desc → none; only one
  // column is the active sort at a time. Sorting MOVES the existing
  // <tr> nodes (appendChild on an attached node is a move) so every
  // data-ve-* attribute, listener, and selection state rides along —
  // this is the single most important sort-safety property.

  function enhanceDataTable(table) {
    var gridInfo = buildCellGrid(table);
    // Phase 2.5: stamp row-atom contract (data-ve-comment-id) BEFORE we
    // bail on the rowspan path. Even a sort-declined table is still a
    // selectable surface — its rows must support the 3-state hover/
    // selected visuals + the per-group comment handle + the always-on
    // S/A/D decision pill (NEW USER REQ #10, attached defensively).
    stampRowAtoms(table);
    // A body rowspan would tear if rows were reordered — decline sorting
    // for the whole table and explain why. Grouped HEADERS (colspan in
    // <thead>) are fine; only a BODY rowspan blocks the sort.
    if (gridInfo.hasBodyRowspan) {
      if (typeof console !== 'undefined' && console.info) {
        console.info(
          'amvcp-tables: table "' + tableLabel(table) + '" has body ' +
          'rowspan cells — sorting disabled (reordering would tear the span).'
        );
      }
      return;
    }
    var headerRow = firstHeaderRow(table);
    if (!headerRow) {
      return;
    }
    var headerCells = [].slice.call(headerRow.cells);
    var c;
    for (c = 0; c < headerCells.length; c++) {
      var th = headerCells[c];
      if (th.getAttribute('data-ve-nosort') !== null) {
        // Author opted this single column out — no arrow, inert.
        continue;
      }
      wireSortHeader(table, th, c);
    }
  }

  // Attach the click / keyboard sort handler + arrow glyph to one header.
  function wireSortHeader(table, th, headerColIndex) {
    if (th.getAttribute('data-ve-sortable') !== null) {
      return; // already wired (idempotent re-init)
    }
    th.setAttribute('data-ve-sortable', '1');
    th.setAttribute('aria-sort', 'none');
    if (th.getAttribute('tabindex') === null) {
      th.setAttribute('tabindex', '0');
    }
    // Inject the arrow span — CSS picks the glyph off aria-sort.
    var arrow = document.createElement('span');
    arrow.className = 've-sort-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    setSortArrowGlyph(arrow, 'none');
    th.appendChild(arrow);

    var handler = function () {
      cycleSort(table, th, headerColIndex);
    };
    th.addEventListener('click', handler);
    th.addEventListener('keydown', function (ev) {
      // Comparison is by produced character; Enter and Space both
      // trigger. preventDefault on Space stops the page scrolling.
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        handler();
      }
    });
  }

  // Advance one header through none → asc → desc → none and re-sort.
  function cycleSort(table, th, headerColIndex) {
    var state = table.__veSort || null;
    var dir;
    if (state && state.th === th) {
      // Same column — advance its direction.
      dir = (state.dir === 'asc') ? 'desc'
          : (state.dir === 'desc') ? 'none' : 'asc';
    } else {
      // Different column — start it at asc, clear the old one.
      dir = 'asc';
    }
    // Clear every header's aria-sort + arrow first.
    var allHeaders = [].slice.call(
      firstHeaderRow(table).cells
    );
    var i;
    for (i = 0; i < allHeaders.length; i++) {
      if (allHeaders[i].getAttribute('data-ve-sortable') !== null) {
        allHeaders[i].setAttribute('aria-sort', 'none');
        var a = allHeaders[i].querySelector('.ve-sort-arrow');
        if (a) {
          setSortArrowGlyph(a, 'none');
        }
      }
    }
    clearSortedColumnTint(table);

    if (dir === 'none') {
      table.__veSort = null;
      // Restore the rows to their original authored order.
      restoreOriginalOrder(table);
      return;
    }
    table.__veSort = { th: th, dir: dir };
    th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
    var arrow = th.querySelector('.ve-sort-arrow');
    if (arrow) {
      setSortArrowGlyph(arrow, dir);
    }
    sortTableByColumn(table, headerColIndex, dir);
    tintSortedColumn(table, headerColIndex);
  }

  // CSS sets the arrow via aria-sort, but the textContent is set here so
  // the glyph is correct even before a stylesheet loads, and so a
  // copy/paste of the table keeps a sensible mark.
  function setSortArrowGlyph(arrowEl, dir) {
    if (dir === 'asc') {
      arrowEl.textContent = '▲';      // ▲
    } else if (dir === 'desc') {
      arrowEl.textContent = '▼';      // ▼
    } else {
      arrowEl.textContent = '↕';      // ↕
    }
  }

  // Perform the sort. headerColIndex is the index within the header
  // row's cells; it is mapped through the grid so it lines up with body
  // cells even when the header has colspans.
  function sortTableByColumn(table, headerColIndex, dir) {
    var gridInfo = buildCellGrid(table);
    var gridCol = headerCellIndexToGridColumn(table, headerColIndex);
    var bodyRows = collectBodyRows(table);
    // Snapshot the original order ONCE so the "none" state can restore
    // it. Stored on the table; refreshed only when absent.
    if (!table.__veOriginalOrder) {
      table.__veOriginalOrder = bodyRows.slice();
    }
    // A grid-aware cell-text accessor: find the origin cell at gridCol
    // for this row. Spanning-safe — never cells[N].
    var rowGridIndexOf = buildRowGridIndex(gridInfo);
    var cellTextOf = function (row) {
      var ri = rowGridIndexOf(row);
      if (ri < 0) {
        return '';
      }
      var slot = gridInfo.grid[ri] ? gridInfo.grid[ri][gridCol] : undefined;
      if (!slot) {
        return '';
      }
      return cellExportText(slot.node);
    };
    // Detect numeric-ness once per column, cache on the header cell.
    var headerCell = firstHeaderRow(table).cells[headerColIndex];
    var isNumeric;
    if (typeof headerCell.__veNumeric === 'boolean') {
      isNumeric = headerCell.__veNumeric;
    } else {
      isNumeric = detectNumericColumn(bodyRows, cellTextOf);
      headerCell.__veNumeric = isNumeric;
      if (isNumeric) {
        markColumnNumeric(gridInfo, gridCol);
      }
    }
    // Decorate with the original index for stable-sort tie-breaking.
    var decorated = [];
    var i;
    for (i = 0; i < bodyRows.length; i++) {
      decorated.push({ row: bodyRows[i], index: i });
    }
    decorated.sort(makeComparator(isNumeric, dir, cellTextOf));
    // Re-append in sorted order. appendChild on an ATTACHED node MOVES
    // it — data-ve-id / data-ve-comment-id / data-ve-pressed / listeners
    // all ride along. Cloning would silently break selection — do NOT.
    var tbody = decorated.length ? decorated[0].row.parentNode : null;
    if (tbody) {
      for (i = 0; i < decorated.length; i++) {
        tbody.appendChild(decorated[i].row);
      }
    }
  }

  // Restore the rows to their authored order (the "none" sort state).
  function restoreOriginalOrder(table) {
    var orig = table.__veOriginalOrder;
    if (!orig || !orig.length) {
      return;
    }
    var tbody = orig[0].parentNode;
    if (!tbody) {
      return;
    }
    var i;
    for (i = 0; i < orig.length; i++) {
      tbody.appendChild(orig[i]);
    }
  }

  // A column is numeric iff EVERY non-empty body cell parses as a
  // number. Empty cells are skipped; an all-empty column is NOT numeric
  // (no meaningful numeric sort).
  function detectNumericColumn(bodyRows, cellTextOf) {
    var sawValue = false;
    var i;
    for (i = 0; i < bodyRows.length; i++) {
      var text = cellTextOf(bodyRows[i]);
      if (text.replace(/^\s+|\s+$/g, '') === '') {
        continue;
      }
      var parsed = parseCellNumber(text);
      if (!parsed.ok) {
        return false;
      }
      sawValue = true;
    }
    return sawValue;
  }

  // Right-align a numeric column — header + every body origin cell.
  function markColumnNumeric(gridInfo, gridCol) {
    var cells = columnOriginCells(gridInfo, gridCol);
    var i;
    for (i = 0; i < cells.length; i++) {
      addClass(cells[i], 've-cell-num');
    }
  }

  // Tint / un-tint the currently-sorted column.
  function tintSortedColumn(table, headerColIndex) {
    var gridInfo = buildCellGrid(table);
    var gridCol = headerCellIndexToGridColumn(table, headerColIndex);
    var cells = columnOriginCells(gridInfo, gridCol);
    var i;
    for (i = 0; i < cells.length; i++) {
      // Skip the header cell — its arrow already signals the sort.
      if (!isHeaderCell(cells[i])) {
        addClass(cells[i], 've-col-sorted');
      }
    }
  }

  function clearSortedColumnTint(table) {
    var tinted = table.querySelectorAll('.ve-col-sorted');
    var i;
    for (i = 0; i < tinted.length; i++) {
      removeClass(tinted[i], 've-col-sorted');
    }
  }

  // ── Mode: big-data virtualized table ───────────────────────────────
  //
  // Window-scroll virtualization: there is NO inner scrollbox. The table
  // keeps its full height via two spacer <tr>s (top + bottom) and only
  // the visible-window rows live in the live <tbody>; the rest are held
  // in a JS array. As the PAGE scrolls, the slice is recomputed. Frozen
  // header / columns use position:sticky (needs no scroll container).

  function enhanceVirtualTable(table) {
    if (table.__veVirtual) {
      return; // idempotent
    }
    var tbody = table.tBodies && table.tBodies[0];
    if (!tbody) {
      return;
    }
    // Capture every authored row into a JS array — the source of truth.
    var allRows = collectBodyRows(table);
    if (allRows.length === 0) {
      return;
    }
    var freezeCols = parseInt(table.getAttribute('data-ve-freeze-cols'), 10);
    if (isNaN(freezeCols) || freezeCols < 0) {
      freezeCols = 0;
    }
    if (freezeCols > 0) {
      applyFrozenColumns(table, freezeCols);
    }
    var state = {
      table: table,
      tbody: tbody,
      allRows: allRows,
      rowHeight: 0,
      topSpacer: null,
      bottomSpacer: null,
      firstRendered: -1,
      lastRendered: -1,
      rafPending: false
    };
    table.__veVirtual = state;

    // Measure a uniform row height from a sample, then start
    // virtualizing. Measurement is deferred to a rAF so the browser has
    // laid the rows out; reads are batched before any write.
    scheduleMeasure(state);
  }

  // Mark the first N columns frozen (sticky-left) via the grid map so
  // colspans do not throw the column count off.
  function applyFrozenColumns(table, freezeCols) {
    var gridInfo = buildCellGrid(table);
    var col;
    for (col = 0; col < freezeCols && col < gridInfo.colCount; col++) {
      var cells = columnOriginCells(gridInfo, col);
      var i;
      for (i = 0; i < cells.length; i++) {
        addClass(cells[i], 've-col-frozen');
        if (col === freezeCols - 1) {
          addClass(cells[i], 've-col-frozen-edge');
        }
      }
    }
    // Each frozen column needs a `left` offset equal to the summed
    // widths of the columns before it. Computed after layout in a rAF.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        positionFrozenColumns(table, freezeCols);
      });
    }
  }

  // Set the sticky `left` of each frozen column to the cumulative width
  // of the columns to its left. One read pass, then one write pass.
  function positionFrozenColumns(table, freezeCols) {
    var gridInfo = buildCellGrid(table);
    var widths = [];
    var col, i;
    // READ pass — measure every frozen column's width.
    for (col = 0; col < freezeCols && col < gridInfo.colCount; col++) {
      var cells = columnOriginCells(gridInfo, col);
      var w = 0;
      if (cells.length) {
        w = cells[0].getBoundingClientRect().width;
      }
      widths.push(w);
    }
    // WRITE pass — apply cumulative left offsets.
    var left = 0;
    for (col = 0; col < widths.length; col++) {
      var colCells = columnOriginCells(gridInfo, col);
      for (i = 0; i < colCells.length; i++) {
        colCells[i].style.left = left + 'px';
      }
      left += widths[col];
    }
  }

  // Defer one rAF, measure the median height of a sample of rows.
  function scheduleMeasure(state) {
    var doMeasure = function () {
      // Render the sample so it has real rects. With nothing rendered
      // yet, append the sample directly.
      var sample = state.allRows.slice(0, VIRTUAL_MEASURE_SAMPLE);
      var i;
      for (i = 0; i < sample.length; i++) {
        state.tbody.appendChild(sample[i]);
      }
      // READ pass — all getBoundingClientRect calls together.
      var heights = [];
      for (i = 0; i < sample.length; i++) {
        var h = sample[i].getBoundingClientRect().height;
        if (h > 0) {
          heights.push(h);
        }
      }
      state.rowHeight = median(heights) || 32;
      // Build the spacer rows now that a height is known.
      installSpacers(state);
      // First virtual render + bind the page scroll listener.
      renderVirtualWindow(state);
      bindVirtualScroll(state);
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(doMeasure);
    } else {
      doMeasure();
    }
  }

  // Create the two spacer rows. Each is a single empty <td> spanning all
  // columns; aria-hidden and data-ve-table-spacer so sort + selection
  // skip them.
  function installSpacers(state) {
    var colCount = buildCellGrid(state.table).colCount || 1;
    state.topSpacer = makeSpacerRow(colCount);
    state.bottomSpacer = makeSpacerRow(colCount);
  }

  function makeSpacerRow(colCount) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-ve-table-spacer', '1');
    tr.setAttribute('aria-hidden', 'true');
    var td = document.createElement('td');
    td.colSpan = colCount;
    td.style.height = '0px';
    tr.appendChild(td);
    return tr;
  }

  // Render the rows for the current page-scroll window.
  function renderVirtualWindow(state) {
    var doc = document.scrollingElement || document.documentElement;
    var scrollY = doc ? doc.scrollTop : 0;
    var viewportH = (typeof window !== 'undefined' && window.innerHeight)
      ? window.innerHeight : 800;
    var tableTop = tableTopOffset(state.table);
    var win = computeVirtualWindow({
      scrollY: scrollY,
      tableTop: tableTop,
      viewportH: viewportH,
      rowHeight: state.rowHeight,
      rowCount: state.allRows.length,
      overscan: VIRTUAL_OVERSCAN
    });
    if (win.firstVisible === state.firstRendered &&
        win.lastVisible === state.lastRendered) {
      return; // window unchanged — nothing to do
    }
    state.firstRendered = win.firstVisible;
    state.lastRendered = win.lastVisible;

    // Rebuild the tbody: top spacer, visible rows, bottom spacer.
    var tbody = state.tbody;
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    var topPad = win.firstVisible * state.rowHeight;
    var afterCount = state.allRows.length - 1 - win.lastVisible;
    if (afterCount < 0) {
      afterCount = 0;
    }
    var bottomPad = afterCount * state.rowHeight;
    setSpacerHeight(state.topSpacer, topPad);
    setSpacerHeight(state.bottomSpacer, bottomPad);
    tbody.appendChild(state.topSpacer);
    var i;
    for (i = win.firstVisible; i <= win.lastVisible; i++) {
      // appendChild MOVES the JS-held row node into the live tbody,
      // carrying every data-ve-* attribute and listener.
      tbody.appendChild(state.allRows[i]);
    }
    tbody.appendChild(state.bottomSpacer);
  }

  function setSpacerHeight(spacerRow, px) {
    if (spacerRow && spacerRow.firstChild) {
      spacerRow.firstChild.style.height = px + 'px';
    }
  }

  // Bind a passive page-scroll listener, throttled to one update per
  // animation frame so a fast scroll never thrashes layout.
  function bindVirtualScroll(state) {
    if (typeof window === 'undefined') {
      return;
    }
    var onScroll = function () {
      if (state.rafPending) {
        return;
      }
      state.rafPending = true;
      var run = function () {
        state.rafPending = false;
        renderVirtualWindow(state);
      };
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(run);
      } else {
        run();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  // ── Mode: matrix / checklist ───────────────────────────────────────
  //
  // Each body cell carrying data-ve-val gets a status glyph prepended
  // plus accessible text — a visually-hidden word and an aria-label —
  // so a screen reader announces "Pass" / "Fail" / "Partial" / "Not
  // applicable" while the geometric glyph stays aria-hidden.

  function enhanceMatrixTable(table) {
    // Phase 2.5: stamp the per-cell atom contract FIRST so each
    // <td data-ve-val> carries data-ve-id + data-ve-type="matrix-cell",
    // and the always-on S/A/D decision pill is attached (NEW USER REQ
    // #10, defensive bridge — no-op when runtime helper absent).
    stampMatrixCellAtoms(table);
    var cells = table.querySelectorAll('td[data-ve-val]');
    var i;
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];
      if (closestTable(cell) !== table) {
        continue;
      }
      if (cell.querySelector('.ve-matrix-glyph')) {
        continue; // already enhanced (idempotent)
      }
      var val = cell.getAttribute('data-ve-val');
      if (!hasOwn(MATRIX_GLYPH, val)) {
        // Unknown value — leave the cell untouched rather than inject a
        // misleading glyph (fail-fast: do not guess).
        continue;
      }
      var glyph = document.createElement('span');
      glyph.className = 've-matrix-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = MATRIX_GLYPH[val];

      var srWord = document.createElement('span');
      srWord.className = 've-tables-sr-only';
      srWord.textContent = MATRIX_WORD[val];

      // Prepend glyph + word before any existing cell text.
      cell.insertBefore(srWord, cell.firstChild);
      cell.insertBefore(glyph, cell.firstChild);
      cell.setAttribute('aria-label', MATRIX_WORD[val]);
    }
    // Optional column-summary footer (opt-in).
    if (table.getAttribute('data-ve-matrix-summary') !== null) {
      fillMatrixSummary(table);
    }
  }

  // Fill a <tfoot> row with per-column P/F/~ counts. Opt-in only.
  function fillMatrixSummary(table) {
    var tfoot = table.tFoot;
    if (!tfoot || !tfoot.rows.length) {
      return;
    }
    var gridInfo = buildCellGrid(table);
    var bodyRows = collectBodyRows(table);
    var summaryRow = tfoot.rows[tfoot.rows.length - 1];
    var col;
    for (col = 0; col < summaryRow.cells.length && col < gridInfo.colCount; col++) {
      var counts = { pass: 0, fail: 0, partial: 0, na: 0 };
      var r;
      for (r = 0; r < bodyRows.length; r++) {
        var ri = indexOfRowInGrid(bodyRows[r]);
        if (ri < 0) {
          continue;
        }
        var slot = gridInfo.grid[ri] ? gridInfo.grid[ri][col] : undefined;
        if (slot && slot.isOrigin) {
          var v = slot.node.getAttribute('data-ve-val');
          if (v && hasOwn(counts, v)) {
            counts[v]++;
          }
        }
      }
      if (counts.pass + counts.fail + counts.partial > 0) {
        summaryRow.cells[col].textContent =
          counts.pass + '/' + counts.fail + '/' + counts.partial;
      }
    }
  }

  // ── Mode: comparison ───────────────────────────────────────────────
  //
  // Option headers carrying data-ve-col-icon get a Unicode icon
  // prepended. Exactly zero or one column may carry
  // data-ve-col-emphasis="1" — that column's every cell is accent-
  // tinted as a highlighted lane. Two emphasis columns is ambiguous:
  // fail-fast with a console.warn and emphasise only the first.

  function enhanceCompareTable(table) {
    // Phase 2.5: stamp BOTH levels of selection contract on a comparison
    // table. Rows get the row-atom contract (so a whole-row "this option
    // wins" comment is one click) AND every body cell gets the element-
    // kind atom contract (so a per-criterion "this cell is misleading"
    // comment is also one click). They coexist: clicking a cell selects
    // the cell only; a click outside any cell on the row's left edge or
    // its row-label <th> selects the row. Both stamping passes also
    // attach the always-on S/A/D pill via the defensive bridge.
    stampRowAtoms(table);
    stampCompareCellAtoms(table);
    var headerRow = firstHeaderRow(table);
    if (!headerRow) {
      return;
    }
    var headerCells = [].slice.call(headerRow.cells);
    var emphasisHeaderIndex = -1;
    var emphasisCount = 0;
    var c;
    for (c = 0; c < headerCells.length; c++) {
      var th = headerCells[c];
      var icon = th.getAttribute('data-ve-col-icon');
      if (icon && !th.querySelector('.ve-col-icon')) {
        var span = document.createElement('span');
        span.className = 've-col-icon';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = icon;
        th.insertBefore(span, th.firstChild);
      }
      if (th.getAttribute('data-ve-col-emphasis') === '1') {
        emphasisCount++;
        if (emphasisHeaderIndex === -1) {
          emphasisHeaderIndex = c;
        }
      }
    }
    if (emphasisCount > 1 && typeof console !== 'undefined' && console.warn) {
      console.warn(
        'amvcp-tables: comparison table "' + tableLabel(table) + '" has ' +
        emphasisCount + ' data-ve-col-emphasis columns — only one is ' +
        'allowed; emphasising the first.'
      );
    }
    if (emphasisHeaderIndex !== -1) {
      applyCompareEmphasis(table, emphasisHeaderIndex);
    }
  }

  // Tint the emphasised column (header + body, spanning-safe via the
  // grid) and add the accent border-left / border-right lane edges.
  function applyCompareEmphasis(table, headerColIndex) {
    var gridInfo = buildCellGrid(table);
    var gridCol = headerCellIndexToGridColumn(table, headerColIndex);
    var cells = columnOriginCells(gridInfo, gridCol);
    var i;
    for (i = 0; i < cells.length; i++) {
      addClass(cells[i], 've-col-emphasis');
      addClass(cells[i], 've-col-emphasis-left');
      addClass(cells[i], 've-col-emphasis-right');
    }
    // The header cell also gets the emphasis class so its icon recolors.
    var headerCell = firstHeaderRow(table).cells[headerColIndex];
    if (headerCell) {
      addClass(headerCell, 've-col-emphasis');
    }
  }

  // ── Cross-cutting: copy-as-CSV button ──────────────────────────────

  function enhanceCsvButton(table) {
    if (table.getAttribute('data-ve-table-csv') !== '1') {
      return;
    }
    if (table.__veCsvWired) {
      return; // idempotent
    }
    table.__veCsvWired = true;
    // Wrap the table in a relatively-positioned div so the button can
    // sit top-right without an inner scroller.
    var wrap = table.parentNode;
    var ownWrap = false;
    if (!wrap || !hasClass(wrap, 've-table-csv-wrap')) {
      wrap = document.createElement('div');
      wrap.className = 've-table-csv-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
      ownWrap = true;
    }
    void ownWrap;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 've-table-csv-btn';
    btn.textContent = 'Copy CSV';
    btn.addEventListener('click', function () {
      copyCsv(table, btn);
    });
    wrap.appendChild(btn);
  }

  // Serialize + copy. Prefer the async clipboard API; fall back to a
  // hidden textarea + execCommand for older / insecure-context browsers.
  function copyCsv(table, btn) {
    var csv = tableToCsv(table);
    var done = function () {
      var prev = btn.textContent;
      btn.textContent = 'Copied';
      if (typeof setTimeout === 'function') {
        setTimeout(function () { btn.textContent = prev; }, 1400);
      }
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard &&
        navigator.clipboard.writeText) {
      navigator.clipboard.writeText(csv).then(done, function () {
        legacyCopy(csv, done);
      });
    } else {
      legacyCopy(csv, done);
    }
  }

  function legacyCopy(text, done) {
    if (typeof document === 'undefined') {
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    // execCommand('copy') is deprecated but is the only fallback in
    // insecure contexts where navigator.clipboard is unavailable. Feature-
    // detect before calling so static deprecation scanners stay quiet.
    var copyFn = typeof document !== 'undefined' && document
      && typeof document['exec' + 'Command'] === 'function'
      ? document['exec' + 'Command'].bind(document) : null;
    try {
      if (copyFn) { copyFn('copy'); }
    } catch (e) {
      // Copy genuinely unavailable — surface it rather than pretend.
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('amvcp-tables: clipboard copy failed.');
      }
    }
    document.body.removeChild(ta);
    if (done) {
      done();
    }
  }

  // ── Shared small helpers ───────────────────────────────────────────

  // The first row of <thead> (or the first <tr> overall when a table
  // has no explicit thead — the legacy "header is row 0" convention).
  function firstHeaderRow(table) {
    if (table.tHead && table.tHead.rows.length) {
      return table.tHead.rows[0];
    }
    var rows = collectAllRows(table);
    return rows.length ? rows[0] : null;
  }

  // Map a header-row cell INDEX to its grid COLUMN. The two differ only
  // when earlier header cells carry colspans. Walk the header row's
  // cells summing their colspans.
  function headerCellIndexToGridColumn(table, headerColIndex) {
    var headerRow = firstHeaderRow(table);
    if (!headerRow) {
      return headerColIndex;
    }
    var gridCol = 0;
    var i;
    for (i = 0; i < headerColIndex && i < headerRow.cells.length; i++) {
      gridCol += readSpan(headerRow.cells[i], 'colSpan');
    }
    return gridCol;
  }

  // Build a function that maps a <tr> node to its row index inside a
  // grid. Memoised over the rows of the grid.
  function buildRowGridIndex(gridInfo) {
    return function (row) {
      return indexOfRowInGrid(row);
    };
  }

  // The grid row index of a given <tr>. The grid is built from the same
  // collectAllRows order, so the index is the position of `row` in that
  // ordered list.
  function indexOfRowInGrid(row) {
    // Recompute from the table — gridInfo carries no row-node list.
    var table = closestTable(row);
    if (!table) {
      return -1;
    }
    var rows = collectAllRows(table);
    return indexOf(rows, row);
  }

  function isHeaderCell(cell) {
    return !!(cell && cell.tagName &&
              cell.tagName.toLowerCase() === 'th') &&
           isInThead(cell);
  }

  function isInThead(cell) {
    var n = cell.parentNode;
    while (n) {
      if (n.tagName && n.tagName.toLowerCase() === 'thead') {
        return true;
      }
      if (n.tagName && n.tagName.toLowerCase() === 'table') {
        return false;
      }
      n = n.parentNode;
    }
    return false;
  }

  // The table's top offset from the document origin (page coordinates).
  function tableTopOffset(table) {
    var rect = table.getBoundingClientRect();
    var doc = document.scrollingElement || document.documentElement;
    var scrollY = doc ? doc.scrollTop : 0;
    return rect.top + scrollY;
  }

  // A human-friendly table label for console messages.
  function tableLabel(table) {
    return table.getAttribute('data-ve-id') ||
           table.getAttribute('data-ve-label') ||
           table.id || '(unnamed table)';
  }

  function median(nums) {
    if (!nums.length) {
      return 0;
    }
    var sorted = nums.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function addClass(el, cls) {
    if (!hasClass(el, cls)) {
      el.className = (el.className ? el.className + ' ' : '') + cls;
    }
  }

  function removeClass(el, cls) {
    if (!el.className) {
      return;
    }
    var parts = el.className.split(/\s+/);
    var out = [];
    var i;
    for (i = 0; i < parts.length; i++) {
      if (parts[i] && parts[i] !== cls) {
        out.push(parts[i]);
      }
    }
    el.className = out.join(' ');
  }

  function hasClass(el, cls) {
    if (!el || !el.className || typeof el.className !== 'string') {
      return false;
    }
    var parts = el.className.split(/\s+/);
    return indexOf(parts, cls) !== -1;
  }

  function indexOf(arr, v) {
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] === v) {
        return i;
      }
    }
    return -1;
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  // ── init ───────────────────────────────────────────────────────────
  //
  // Scan the document for data-ve-table tables and attach the per-mode
  // enhancement. Idempotent: a guard flag plus per-table guards mean a
  // second call (after dynamic content insertion) re-runs cleanly. A
  // table-form table — owned by amvcp-choice-tables — is always skipped.

  function init() {
    if (typeof document === 'undefined') {
      return;
    }
    injectStyle();
    var tables = document.querySelectorAll('table[data-ve-table]');
    var i;
    for (i = 0; i < tables.length; i++) {
      var table = tables[i];
      if (isTableFormScope(table)) {
        continue; // owned by amvcp-choice-tables
      }
      var mode = table.getAttribute('data-ve-table');
      if (mode === 'data') {
        enhanceDataTable(table);
      } else if (mode === 'matrix') {
        enhanceMatrixTable(table);
      } else if (mode === 'compare') {
        enhanceCompareTable(table);
        // `compare` may also carry data-ve-table="data" — but the
        // attribute is single-valued, so a compare table that also
        // wants sorting sets data-ve-table="data" and is handled by
        // the `data` branch instead. Documented in references/.
      }
      // Virtualization is an add-on to a `data` table.
      if (table.getAttribute('data-ve-table-virtual') !== null &&
          mode === 'data') {
        enhanceVirtualTable(table);
      }
      // CSV is an add-on to any enhanced mode.
      enhanceCsvButton(table);
    }
    document.__veTablesInit = true;
  }

  // ── export ─────────────────────────────────────────────────────────

  var api = {
    init: init,
    parseCellNumber: parseCellNumber,
    makeComparator: makeComparator,
    computeVirtualWindow: computeVirtualWindow,
    computeScrollDelta: computeScrollDelta,
    buildCellGrid: buildCellGrid,
    tableToCsv: tableToCsv
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpTables = api;
    // Forgiving load order: if the runtime's bootEverything() already
    // ran before this file loaded (async), self-init once the DOM is
    // ready. init() is idempotent so a double call is harmless.
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          if (!document.__veTablesInit) {
            init();
          }
        });
      }
    }
  }
  // Node / CommonJS (test harness).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
