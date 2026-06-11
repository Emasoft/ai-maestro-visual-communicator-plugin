// ai-maestro-visual-communicator-plugin — ticket-triage kanban editor.
//
// THE THING: a ticket-triage board. The user drags tickets between the
// fixed Now / Next / Later / Cut columns (configurable), then EXPORTS the
// resulting ordering as markdown back to the agent.
//
// Architecture compliance (project CLAUDE.md + TRDD-1627a698):
//   • Interaction Design Mode = FIXED. The board is a composable HTML
//     primitive. State (drag-in-flight, drop-target, column membership)
//     lives ONLY in EXISTING-element CSS classes + the runtime's
//     brightness/glow — NEVER a new frame, ghost, outline, or injected
//     node (the NO-NEW-ELEMENTS rule). Selection / highlight / triple-
//     state feedback / the comment round-trip come from amvcp-runtime.js;
//     this module reinvents none of it.
//   • Export RIDES the existing selection channel. On every reorder the
//     board pushes (or replaces) a SINGLE kind:"element" entry into
//     window.veSelection whose data.markdown carries the full ordering.
//     submit (Enter / the runtime Submit button) returns it verbatim —
//     no foreign export UX, no second POST path.
//   • Graphic Style Mode = VARIABLE via DESIGN.md. Every colour is a
//     var(--vc-*, fallback); a data-ve-theme flip re-paints live.
//
// The pointer-drag is the shared makePointerSortable pattern from
// amvcp-form-inputs.js (mouse + touch + pen, 6px threshold, capture,
// trailing-click suppression). Per the module-isolation rule it is
// COPIED here, not imported across modules.
//
// Public surface (window.amvcpEditorKanban):
//   init(root)          — scan + wire every .ve-editor-kanban under root
//   injectStyles(doc)   — inject the scoped --vc-* themed stylesheet once
//   initBoard(el)       — wire one board (idempotent)
//
// Auto-boots on load unless window.__vcEditorKanbanManualInit is set
// (the test fixture sets it so it can boot deterministically AFTER the
// runtime has stamped its selection wiring).

(function () {
  'use strict';

  var LS_PREFIX = 'amvcp-editor-kanban:';
  var STYLE_ID = 'vc-editor-kanban-styles';

  // Default columns when the model omits them. Order is meaningful — it
  // is the left-to-right priority the exported markdown preserves.
  var DEFAULT_COLUMNS = [
    { key: 'now',   label: 'Now' },
    { key: 'next',  label: 'Next' },
    { key: 'later', label: 'Later' },
    { key: 'cut',   label: 'Cut' }
  ];

  // ── Storage helpers (graceful degradation on Safari private mode) ──
  function loadValue(id, def) {
    try {
      if (typeof localStorage === 'undefined') { return def; }
      var raw = localStorage.getItem(LS_PREFIX + id);
      if (raw === null) { return def; }
      try { return JSON.parse(raw); }
      catch (e) { return def; }
    } catch (e) { return def; }
  }
  function saveValue(id, value) {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.setItem(LS_PREFIX + id, JSON.stringify(value));
    } catch (e) { /* quota / private mode — silently degrade */ }
  }

  // ── Fail-fast helper ───────────────────────────────────────────────
  function paintError(hostEl, message) {
    hostEl.textContent = '';
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'padding:10px 12px;'
      + 'font:12px/1.4 var(--vc-font-mono, ui-monospace, monospace);'
      + 'color:var(--vc-color-danger, #a84a32);'
      + 'background:color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 8%, transparent);'
      + 'border:1px solid var(--vc-color-danger, #a84a32);'
      + 'border-radius:var(--vc-radius-md, 8px);';
    box.textContent = '[editor-kanban error] ' + message;
    hostEl.appendChild(box);
  }

  function readModel(el) {
    var jsonEl = el.querySelector(':scope > script[type="application/json"]');
    if (!jsonEl) { return null; }
    try { return JSON.parse(jsonEl.textContent || ''); }
    catch (e) {
      paintError(el, 'malformed JSON: ' + (e && e.message));
      return null;
    }
  }

  function requireId(el) {
    var id = el.getAttribute('data-ve-id');
    if (!id) {
      paintError(el, 'missing data-ve-id attribute');
      return null;
    }
    return id;
  }

  // ── pointer-events sortable (COPIED from amvcp-form-inputs.js per the
  // module-isolation rule — do NOT import across modules) ──────────────
  //
  // opts:
  //   items           — every draggable element
  //   containers      — drop containers (the column <ul>s)
  //   hitTest(x, y)   — returns {container, beforeNode, highlight} | null
  //   onCommit(item, container, beforeNode) — perform the move + persist
  //   draggingClass   — class toggled on the item while it is dragging
  //   dropTargetClass — class toggled on the live drop container/row
  function makePointerSortable(opts) {
    var items = opts.items || [];
    var containers = opts.containers || [];
    var hitTest = opts.hitTest;
    var onCommit = opts.onCommit;
    var draggingClass = opts.draggingClass;
    var dropTargetClass = opts.dropTargetClass;
    // ~6px move threshold so a click/tap is NOT a drag — below it the
    // pointerup falls through to the runtime's click-to-select model.
    var THRESHOLD = 6;

    var active = null;        // the item currently being dragged (post-threshold)
    var pressItem = null;
    var pressId = null;
    var startX = 0, startY = 0;
    var started = false;      // crossed the threshold?
    var lastTarget = null;    // node currently flashed with dropTargetClass
    var suppressClick = false; // swallow the click that trails a drag

    function clearTargets() {
      for (var i = 0; i < containers.length; i++) {
        containers[i].classList.remove(dropTargetClass);
      }
      if (lastTarget) { lastTarget.classList.remove(dropTargetClass); }
      lastTarget = null;
    }

    function endDrag(commit, x, y) {
      if (started && active) {
        if (commit && hitTest) {
          var hit = hitTest(x, y);
          if (hit && hit.container) {
            onCommit(active, hit.container, hit.beforeNode || null);
          }
        }
        active.classList.remove(draggingClass);
        // A real drag fires a trailing `click`; suppress exactly one so
        // it does not toggle the runtime's element-selection.
        suppressClick = true;
      }
      clearTargets();
      active = null;
      pressItem = null;
      pressId = null;
      started = false;
    }

    function onDown(ev) {
      if (ev.button !== undefined && ev.button !== 0) { return; }
      if (ev.isPrimary === false) { return; }
      if (active) { return; }   // a drag is already in flight
      pressItem = this;
      pressId = ev.pointerId;
      startX = ev.clientX;
      startY = ev.clientY;
      started = false;
      try {
        if (pressItem.setPointerCapture) {
          pressItem.setPointerCapture(ev.pointerId);
        }
      } catch (_) { /* capture unavailable — proceed without it */ }
    }

    function onMove(ev) {
      if (!pressItem || ev.pointerId !== pressId) { return; }
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      if (!started) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) { return; }
        started = true;
        active = pressItem;
        active.classList.add(draggingClass);
      }
      if (ev.cancelable) { ev.preventDefault(); }
      if (!hitTest) { return; }
      var hit = hitTest(ev.clientX, ev.clientY);
      var next = hit ? (hit.highlight || hit.container) : null;
      if (next !== lastTarget) {
        if (lastTarget) { lastTarget.classList.remove(dropTargetClass); }
        if (next) { next.classList.add(dropTargetClass); }
        lastTarget = next;
      }
    }

    function onUp(ev) {
      if (!pressItem || ev.pointerId !== pressId) { return; }
      endDrag(true, ev.clientX, ev.clientY);
    }

    function onCancel(ev) {
      if (!pressItem || ev.pointerId !== pressId) { return; }
      endDrag(false, ev.clientX, ev.clientY);
    }

    function onClick(ev) {
      // Kill the synthetic `click` the browser emits right after a drag
      // release so it does not reach the runtime's click-to-select model.
      // A sub-threshold tap never sets the flag, so its click passes
      // through unharmed. MUST run before the runtime's document-capture
      // selection handler — a window-capture listener fires first.
      if (suppressClick) {
        suppressClick = false;
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('click', onClick, true);
    }

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      // touch-action:none on the DRAGGABLE ITEM ONLY (never the page) so
      // a touch-drag reorders instead of scrolling.
      it.style.touchAction = 'none';
      it.addEventListener('pointerdown', onDown);
      it.addEventListener('pointermove', onMove);
      it.addEventListener('pointerup', onUp);
      it.addEventListener('pointercancel', onCancel);
    }
  }

  // ── export: ride the runtime selection channel ──────────────────────
  //
  // Push (or replace) ONE kind:"element" entry into window.veSelection
  // carrying the full board ordering as markdown. Re-export updates the
  // same entry (keyed by entryId) so submit never returns duplicates.
  // This is the ONLY export path — it is exactly the wire format the
  // runtime POSTs to /__ve-select; the agent reads data.markdown.
  function pushExportEntry(id, columns, lists, label) {
    var sel = (typeof window !== 'undefined') ? window.veSelection : null;
    if (!sel || typeof sel.push !== 'function') { return; }
    var markdown = orderingMarkdown(columns, lists, label);
    var ordering = orderingObject(columns, lists);
    var entryId = 'element:ve-editor-kanban-export:' + id;
    var entry = {
      kind: 'element',
      entryId: entryId,
      id: 've-editor-kanban-export:' + id,
      type: 'kanban-export',
      label: (label || 'Triage board') + ' — ordering',
      data: { boardId: id, ordering: ordering, markdown: markdown }
    };
    var found = -1;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i] && sel[i].entryId === entryId) { found = i; break; }
    }
    if (found >= 0) { sel[found] = entry; }
    else { sel.push(entry); }
    // Best-effort refresh of the runtime's Submit-button count without
    // reaching into its private API — the count is cosmetic; the payload
    // (asserted via amvcpRuntime.buildSubmissionPayload) is the contract.
    try {
      if (typeof window !== 'undefined' && window.amvcpRuntime
          && typeof window.amvcpRuntime.refreshSelectionUI === 'function') {
        window.amvcpRuntime.refreshSelectionUI();
      }
    } catch (_) { /* no public refresh hook — payload is still correct */ }
  }

  // { columnKey: ["ticketKey", …] } in left-to-right column order.
  function orderingObject(columns, lists) {
    var out = {};
    for (var c = 0; c < columns.length; c++) {
      var key = columns[c].key;
      var ul = lists[key];
      var arr = [];
      if (ul) {
        var nodes = ul.querySelectorAll(':scope > li');
        for (var i = 0; i < nodes.length; i++) {
          var tk = nodes[i].getAttribute('data-ticket-key');
          if (tk) { arr.push(tk); }
        }
      }
      out[key] = arr;
    }
    return out;
  }

  // A human-readable markdown rendering of the ordering — the artifact
  // the agent acts on. One `## Column` heading per column, then a
  // numbered list of its tickets in priority order (empty columns show
  // `_(empty)_`).
  function orderingMarkdown(columns, lists, label) {
    var lines = [];
    lines.push('# ' + (label || 'Triage board'));
    lines.push('');
    for (var c = 0; c < columns.length; c++) {
      var col = columns[c];
      var ul = lists[col.key];
      lines.push('## ' + (col.label || col.key));
      var nodes = ul ? ul.querySelectorAll(':scope > li') : [];
      if (!nodes.length) {
        lines.push('_(empty)_');
      } else {
        for (var i = 0; i < nodes.length; i++) {
          var li = nodes[i];
          var title = li.getAttribute('data-ticket-title')
            || li.getAttribute('data-ticket-key') || '';
          lines.push((i + 1) + '. ' + title);
        }
      }
      lines.push('');
    }
    return lines.join('\n').replace(/\n+$/, '') + '\n';
  }

  // ── one board ───────────────────────────────────────────────────────
  function initBoard(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.tickets) || model.tickets.length < 1) {
      paintError(el, 'editor-kanban requires tickets[] with >= 1 ticket');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'editor-kanban');

    var columns = (Array.isArray(model.columns) && model.columns.length)
      ? model.columns
      : DEFAULT_COLUMNS;
    var boardLabel = model.label || el.getAttribute('data-ve-label') || 'Triage board';

    // Saved placement: { ticketKey: columnKey }. On load the saved
    // column wins; tickets with no/stale saved column fall back to their
    // model `column` (or the first column).
    var saved = loadValue(id, {});
    if (!saved || typeof saved !== 'object') { saved = {}; }

    // Build the column-key set once for fast validity checks.
    var validCol = {};
    for (var vc = 0; vc < columns.length; vc++) { validCol[columns[vc].key] = 1; }

    el.textContent = '';

    if (boardLabel) {
      var lab = document.createElement('p');
      lab.className = 've-editor-kanban-label';
      lab.textContent = boardLabel;
      el.appendChild(lab);
    }

    var board = document.createElement('div');
    board.className = 've-editor-kanban-columns';
    el.appendChild(board);

    // Map of column-key -> the <ul> that holds its tickets.
    var lists = {};
    for (var ci = 0; ci < columns.length; ci++) {
      (function (col) {
        var colEl = document.createElement('div');
        colEl.className = 've-editor-kanban-col';
        colEl.setAttribute('data-col-key', col.key);
        if (col.tone) { colEl.setAttribute('data-col-tone', col.tone); }

        var head = document.createElement('div');
        head.className = 've-editor-kanban-col-head';
        var nameEl = document.createElement('span');
        nameEl.className = 've-editor-kanban-col-name';
        nameEl.textContent = col.label || col.key;
        head.appendChild(nameEl);
        var countEl = document.createElement('span');
        countEl.className = 've-editor-kanban-col-count';
        countEl.setAttribute('data-col-count-for', col.key);
        head.appendChild(countEl);
        colEl.appendChild(head);

        var ul = document.createElement('ul');
        ul.className = 've-editor-kanban-bucket';
        ul.setAttribute('data-col-key', col.key);
        ul.setAttribute('role', 'list');
        lists[col.key] = ul;
        colEl.appendChild(ul);

        board.appendChild(colEl);
      })(columns[ci]);
    }

    var ticketEls = [];   // every draggable <li>, fed to the sortable
    for (var ti = 0; ti < model.tickets.length; ti++) {
      (function (t) {
        var key = t.key || t.value || ('ticket-' + ti);
        var title = t.title || t.label || key;
        var li = document.createElement('li');
        li.className = 've-editor-kanban-ticket';
        li.setAttribute('data-ticket-key', key);
        li.setAttribute('data-ticket-title', title);
        li.setAttribute('title', title);

        var titleEl = document.createElement('span');
        titleEl.className = 've-editor-kanban-ticket-title';
        titleEl.textContent = title;
        li.appendChild(titleEl);

        if (t.meta) {
          var metaEl = document.createElement('span');
          metaEl.className = 've-editor-kanban-ticket-meta';
          metaEl.textContent = t.meta;
          li.appendChild(metaEl);
        }

        ticketEls.push(li);

        // Placement: saved → model.column → first column.
        var target = (saved[key] && validCol[saved[key]]) ? saved[key]
          : (t.column && validCol[t.column]) ? t.column
            : columns[0].key;
        lists[target].appendChild(li);
      })(model.tickets[ti]);
    }

    function refreshCounts() {
      for (var k in lists) {
        if (!lists.hasOwnProperty(k)) { continue; }
        var n = lists[k].querySelectorAll(':scope > li').length;
        var badge = el.querySelector('[data-col-count-for="' + k + '"]');
        if (badge) { badge.textContent = String(n); }
      }
    }
    refreshCounts();

    function flush() {
      var assignment = {};
      for (var k in lists) {
        if (!lists.hasOwnProperty(k)) { continue; }
        var nodes = lists[k].querySelectorAll(':scope > li');
        for (var i = 0; i < nodes.length; i++) {
          var tk = nodes[i].getAttribute('data-ticket-key');
          if (tk) { assignment[tk] = k; }
        }
      }
      saveValue(id, assignment);
      refreshCounts();
      pushExportEntry(id, columns, lists, boardLabel);
    }

    // List of every bucket (drop container) for highlight bookkeeping.
    var buckets = [];
    for (var bk in lists) {
      if (lists.hasOwnProperty(bk)) { buckets.push(lists[bk]); }
    }

    // Pointer-events drag: the ticket row under the pointer decides the
    // insertion point (Y-midpoint → insert before/after, same rule the
    // form-inputs rank-list uses). Dropping on empty bucket space appends.
    makePointerSortable({
      items: ticketEls,
      containers: buckets,
      hitTest: function (x, y) {
        var node = document.elementFromPoint(x, y);
        if (!node || !node.closest) { return null; }
        // Resolve the bucket under the pointer; only buckets in THIS board.
        var bucket = node.closest('.ve-editor-kanban-bucket');
        if (!bucket || !el.contains(bucket)) { return null; }
        // If the pointer is over a specific ticket row, use its Y-midpoint
        // to insert before/after; never relative to the row being dragged.
        var li = node.closest('.ve-editor-kanban-ticket');
        if (li && bucket.contains(li)
            && !li.classList.contains('ve-editor-kanban-dragging')) {
          var rect = li.getBoundingClientRect();
          var midY = rect.top + rect.height / 2;
          var beforeNode = y < midY ? li : li.nextSibling;
          return { container: bucket, beforeNode: beforeNode, highlight: bucket };
        }
        // Over empty bucket space (or over the dragged row) — append.
        return { container: bucket, beforeNode: null, highlight: bucket };
      },
      onCommit: function (item, container, beforeNode) {
        container.insertBefore(item, beforeNode);
        flush();
      },
      draggingClass: 've-editor-kanban-dragging',
      dropTargetClass: 've-editor-kanban-drop-target'
    });

    // Seed the export entry so a submit WITHOUT any drag still returns the
    // initial ordering (the board is "exportable by design", not only
    // after the user reorders).
    pushExportEntry(id, columns, lists, boardLabel);
  }

  // ── scoped, --vc-* themed stylesheet (graphic-style chrome ONLY — no
  // selection/hover CSS; the runtime owns brightness/glow) ─────────────
  function injectStyles(doc) {
    var d = doc || document;
    if (d.getElementById(STYLE_ID)) { return; }
    var css = [
      '.ve-editor-kanban {',
      '  display:block;',
      '  margin:18px 0;',
      '}',
      '.ve-editor-kanban-label {',
      '  font:600 14px/1.4 var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  margin:0 0 12px;',
      '}',
      // The columns row extends the PAGE rather than scrolling internally
      // (no-nested-scrollbars rule): it wraps, and the document widens.
      '.ve-editor-kanban-columns {',
      '  display:flex;',
      '  flex-wrap:wrap;',
      '  gap:14px;',
      '  align-items:flex-start;',
      '}',
      '.ve-editor-kanban-col {',
      '  flex:1 1 180px;',
      '  min-width:160px;',
      '  background:var(--vc-color-surface-sunken, #f1ece1);',
      '  border:1px solid var(--vc-color-border, #e3dcc9);',
      '  border-radius:var(--vc-radius-lg, 12px);',
      '  padding:12px 12px 14px;',
      '}',
      '.ve-editor-kanban-col-head {',
      '  display:flex;',
      '  align-items:center;',
      '  justify-content:space-between;',
      '  margin:0 0 10px;',
      '}',
      '.ve-editor-kanban-col-name {',
      '  font:600 13px/1.2 var(--vc-font-body, system-ui, sans-serif);',
      '  letter-spacing:0.02em;',
      '  color:var(--vc-color-content, #1f1a14);',
      '}',
      '.ve-editor-kanban-col-count {',
      '  font:600 11px/1 var(--vc-font-mono, ui-monospace, monospace);',
      '  color:var(--vc-color-on-accent, #fffdf9);',
      '  background:var(--vc-color-accent, #b8861f);',
      '  border-radius:var(--vc-radius-full, 9999px);',
      '  min-width:18px;',
      '  text-align:center;',
      '  padding:2px 6px;',
      '}',
      '.ve-editor-kanban-bucket {',
      '  list-style:none;',
      '  margin:0;',
      '  padding:0;',
      '  display:flex;',
      '  flex-direction:column;',
      '  gap:8px;',
      '  min-height:48px;',
      '}',
      '.ve-editor-kanban-ticket {',
      '  display:flex;',
      '  flex-direction:column;',
      '  gap:3px;',
      '  background:var(--vc-color-surface, #fffefb);',
      '  border:1px solid var(--vc-color-border-strong, #c9bfa3);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '  padding:9px 11px;',
      '  cursor:grab;',
      '  user-select:none;',
      '}',
      '.ve-editor-kanban-ticket-title {',
      '  font:500 13px/1.35 var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-content, #1f1a14);',
      '}',
      '.ve-editor-kanban-ticket-meta {',
      '  font:400 11px/1.3 var(--vc-font-mono, ui-monospace, monospace);',
      '  color:var(--vc-color-content-muted, #5b5343);',
      '}',
      // Drag-in-flight + drop-target are EXISTING-element re-paints only
      // (brightness + a token-coloured border-tint) — never a new node,
      // ring, or ghost. NO outline (the no-new-elements rule).
      '.ve-editor-kanban-ticket.ve-editor-kanban-dragging {',
      '  cursor:grabbing;',
      '  opacity:0.55;',
      '}',
      '.ve-editor-kanban-bucket.ve-editor-kanban-drop-target {',
      '  background:color-mix(in srgb,'
        + ' var(--vc-color-accent, #b8861f) 12%, transparent);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '}',
      // Touch: bigger hit-targets on the draggable tickets.
      'body[data-ve-touch="1"] .ve-editor-kanban-ticket { padding:13px 13px; }'
    ].join('\n');
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    (d.head || d.documentElement).appendChild(style);
  }

  // ── init dispatcher ────────────────────────────────────────────────
  function init(root) {
    var d = root || document;
    var boards = d.querySelectorAll('.ve-editor-kanban');
    for (var i = 0; i < boards.length; i++) { initBoard(boards[i]); }
  }

  var api = {
    init: init,
    injectStyles: injectStyles,
    initBoard: initBoard
  };

  if (typeof window !== 'undefined') {
    window.amvcpEditorKanban = api;
    // Auto-boot unless the page sets __vcEditorKanbanManualInit (tests do).
    if (document && document.readyState !== 'loading') {
      if (!window.__vcEditorKanbanManualInit) {
        injectStyles(document);
        init(document);
      }
    } else if (document) {
      document.addEventListener('DOMContentLoaded', function () {
        if (!window.__vcEditorKanbanManualInit) {
          injectStyles(document);
          init(document);
        }
      });
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
