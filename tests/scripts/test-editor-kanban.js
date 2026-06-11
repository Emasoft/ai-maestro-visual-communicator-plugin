// ai-maestro-visual-communicator-plugin — editor-kanban (ticket triage) tests.
//
// Verifies amvcp-editor-kanban.js: a drag-triage board (Now/Next/Later/
// Cut) that EXPORTS its column ordering as markdown back to the agent via
// the existing runtime selection channel.
//
// Five tests:
//   1. renders columns + tickets from the declarative JSON markup;
//   2. a pointer-drag moves a ticket across columns — TOUCH and MOUSE;
//   3. the export entry in window.veSelection carries the correct markdown
//      ordering (asserted through the runtime's read-only
//      amvcpRuntime.buildSubmissionPayload hook — the exact /__ve-select
//      wire shape);
//   4. a data-ve-theme flip re-paints (the column canvas var changes);
//   5. a completed drag adds NO new DOM elements (no-new-elements rule —
//      state lives only in existing classes).
//
// The pointer gesture helper is the same multi-step synthetic-PointerEvent
// approach as test-touch-sortable.js (real moves so pointerleave/over fire
// like a production drag; single jumps hide ordering races — §1 of the
// browser-test rules).
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/editor-kanban-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 1200 });
  // The board persists its column placement to localStorage; a prior test
  // (or a prior whole-script run) would otherwise restore a reordered
  // board and corrupt the initial-render assertion. The page is reused
  // across all tests, and on the FIRST test the page starts on
  // about:blank (a different origin), so clearing BEFORE navigation can't
  // reach the fixture's 127.0.0.1 origin. Navigate first, clear on the
  // correct origin, then reload so init() reads an empty store.
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(FIXTURE + "?cb=" + Date.now() + "-r",
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpEditorKanban === 'object'
      && typeof window.amvcpEditorKanban.init === 'function'
      && (window.__vcFixtureReady === true || !!window.__vcFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vcFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Dispatch a full pointer drag from one element's centre to a target
// point inside another element. Runs ENTIRELY in the page so each move
// re-reads live geometry.
//   fromSel  — selector of the ticket to grab
//   toSel    — selector whose rect supplies the drop point
//   toEdge   — 'top' | 'bottom' | 'center' — where in toSel's rect to drop
//   ptype    — 'touch' | 'mouse'
async function pointerDrag(page, gesture) {
  return await page.evaluate((g) => {
    function centre(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function fire(el, type, x, y, ptype) {
      const ev = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: ptype === 'touch' ? 11 : 1,
        pointerType: ptype,
        isPrimary: true,
        button: type === 'pointerup' ? -1 : 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: x,
        clientY: y
      });
      el.dispatchEvent(ev);
    }
    const from = document.querySelector(g.fromSel);
    if (!from) { return { error: 'fromSel not found: ' + g.fromSel }; }
    const to = document.querySelector(g.toSel);
    if (!to) { return { error: 'toSel not found: ' + g.toSel }; }
    const c0 = centre(from);
    fire(from, 'pointerdown', c0.x, c0.y, g.ptype);

    const tr = to.getBoundingClientRect();
    const tx = tr.left + tr.width / 2;
    let ty;
    if (g.toEdge === 'top') { ty = tr.top + 6; }
    else if (g.toEdge === 'bottom') { ty = tr.bottom - 6; }
    else { ty = tr.top + tr.height / 2; }

    // Move in several steps so pointerleave/over fire like a real drag.
    // Pointer Events route every move to the capturing element, so
    // dispatch on `from` (the captured target), matching production.
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const x = c0.x + (tx - c0.x) * (i / steps);
      const y = c0.y + (ty - c0.y) * (i / steps);
      fire(from, 'pointermove', x, y, g.ptype);
    }
    fire(from, 'pointerup', tx, ty, g.ptype);
    return { dropped: true, tx, ty };
  }, gesture);
}

// Snapshot { columnKey: [ticketKey, …] } straight from the DOM.
async function boardState(page) {
  return await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.ve-editor-kanban-bucket').forEach((ul) => {
      const k = ul.getAttribute('data-col-key');
      out[k] = Array.from(ul.querySelectorAll(':scope > li'))
        .map(li => li.getAttribute('data-ticket-key'));
    });
    return out;
  });
}

async function testRendersColumnsAndTickets(page) {
  const s = await setup(page);
  if (!s.ok) {
    record('renders_columns_tickets', 'FAIL',
      'renders columns + tickets from markup', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.ve-editor-kanban-col'))
      .map(c => c.getAttribute('data-col-key'));
    const tickets = Array.from(
      document.querySelectorAll('.ve-editor-kanban-ticket'))
      .map(t => t.getAttribute('data-ticket-key'));
    const nowKeys = Array.from(document.querySelectorAll(
      '.ve-editor-kanban-bucket[data-col-key="now"] > li'))
      .map(li => li.getAttribute('data-ticket-key'));
    const nowCount = (document.querySelector(
      '[data-col-count-for="now"]') || {}).textContent;
    return { cols, tickets, nowKeys, nowCount };
  });
  const ok = r.cols.join(',') === 'now,next,later,cut'
    && r.tickets.length === 6
    && r.nowKeys.join(',') === 'auth,cache'
    && r.nowCount === '2';
  record('renders_columns_tickets', ok ? 'PASS' : 'FAIL',
    'columns + tickets render from declarative JSON markup',
    JSON.stringify(r));
}

async function testTouchDragMovesTicket(page) {
  // Touch-drag a "later" ticket (metrics) into the "now" column.
  const s = await setup(page);
  if (!s.ok) {
    record('touch_drag_moves', 'FAIL', 'touch drag moves ticket across columns', s.error);
    return;
  }
  const before = await boardState(page);
  const move = await pointerDrag(page, {
    fromSel: '.ve-editor-kanban-ticket[data-ticket-key="metrics"]',
    toSel: '.ve-editor-kanban-bucket[data-col-key="now"]',
    toEdge: 'bottom',
    ptype: 'touch'
  });
  const after = await boardState(page);
  const ok = !move.error
    && before.now.join(',') === 'auth,cache'
    && before.later.indexOf('metrics') >= 0
    && after.now.indexOf('metrics') >= 0
    && after.later.indexOf('metrics') < 0;
  record('touch_drag_moves', ok ? 'PASS' : 'FAIL',
    'touch-drag a ticket from Later into Now moves it across columns',
    JSON.stringify({ before, after, move }));
}

async function testMouseDragMovesTicket(page) {
  // Desktop parity: the SAME gesture with pointerType:'mouse' moves a
  // ticket too (cut → now).
  const s = await setup(page);
  if (!s.ok) {
    record('mouse_drag_moves', 'FAIL', 'mouse drag moves ticket (desktop parity)', s.error);
    return;
  }
  const move = await pointerDrag(page, {
    fromSel: '.ve-editor-kanban-ticket[data-ticket-key="legacy"]',
    toSel: '.ve-editor-kanban-bucket[data-col-key="now"]',
    toEdge: 'top',
    ptype: 'mouse'
  });
  const after = await boardState(page);
  const ok = !move.error
    && after.now.indexOf('legacy') >= 0
    && after.cut.indexOf('legacy') < 0;
  record('mouse_drag_moves', ok ? 'PASS' : 'FAIL',
    'mouse-pointer drag moves a ticket too — desktop parity preserved',
    JSON.stringify({ after, move }));
}

async function testExportMarkdownOrdering(page) {
  // After moving a ticket, the export entry in window.veSelection must
  // carry the new ordering as markdown. Assert through the runtime's
  // read-only buildSubmissionPayload hook — the exact /__ve-select shape.
  const s = await setup(page);
  if (!s.ok) {
    record('export_markdown_ordering', 'FAIL',
      'export payload carries markdown ordering', s.error);
    return;
  }
  // Move metrics (later) → now, top, so "now" becomes metrics,auth,cache.
  await pointerDrag(page, {
    fromSel: '.ve-editor-kanban-ticket[data-ticket-key="metrics"]',
    toSel: '.ve-editor-kanban-ticket[data-ticket-key="auth"]',
    toEdge: 'top',
    ptype: 'mouse'
  });
  const r = await page.evaluate(() => {
    const sel = window.veSelection || [];
    const entry = sel.find(e =>
      e && e.type === 'kanban-export'
      && e.entryId === 'element:ve-editor-kanban-export:triage:demo');
    // The wire payload the runtime would POST — proves the export rides
    // the existing selection channel (no second POST path).
    const payload = (window.amvcpRuntime
      && typeof window.amvcpRuntime.buildSubmissionPayload === 'function')
      ? window.amvcpRuntime.buildSubmissionPayload('submit')
      : null;
    const wire = payload && Array.isArray(payload.selections)
      ? payload.selections.find(x => x && x.type === 'kanban-export')
      : null;
    return {
      entryCount: sel.length,
      hasEntry: !!entry,
      md: entry && entry.data ? entry.data.markdown : null,
      ordering: entry && entry.data ? entry.data.ordering : null,
      wireMd: wire && wire.data ? wire.data.markdown : null,
      payloadKind: payload ? payload.kind : null
    };
  });
  const md = r.md || '';
  const ok = r.hasEntry
    // Exactly ONE export entry (re-export replaces, never duplicates).
    && r.entryCount === 1
    && r.ordering
    // Now now leads with the moved ticket, in priority order.
    && r.ordering.now.join(',') === 'metrics,auth,cache'
    // Later keeps its remaining ticket (only metrics was moved out).
    && r.ordering.later.join(',') === 'darkmode'
    // Markdown reflects the new ordering under the Now heading.
    && /## Now\n1\. Latency metrics\n2\. Fix auth redirect loop\n3\. Add response cache/.test(md)
    && /## Later\n1\. Dark-mode polish/.test(md)
    // The same markdown survives the /__ve-select wire format.
    && r.wireMd === md
    && r.payloadKind === 'submit';
  record('export_markdown_ordering', ok ? 'PASS' : 'FAIL',
    'export entry in veSelection carries the correct markdown ordering (wire-verified)',
    JSON.stringify(r));
}

async function testThemeFlipRepaints(page) {
  // Flipping data-ve-theme light → dark must re-paint the board. The
  // DESIGN.md engine re-applies the --vc-* tokens on a MutationObserver
  // tick (async), so we wait after each setAttribute — the same dance the
  // graphviz-template test uses. A column's background reads from
  // --vc-color-surface-sunken (light #f1ece1 vs dark #0f0d09), so the
  // computed colour must change between the two themes.
  const s = await setup(page);
  if (!s.ok) {
    record('theme_flip_repaints', 'FAIL', 'theme flip re-paints (canvas var)', s.error);
    return;
  }
  const r = await page.evaluate(async () => {
    const html = document.documentElement;
    const col = document.querySelector('.ve-editor-kanban-col');
    function snap() {
      return {
        sunkenVar: getComputedStyle(html)
          .getPropertyValue('--vc-color-surface-sunken').trim().toLowerCase(),
        colBg: getComputedStyle(col).backgroundColor
      };
    }
    html.setAttribute('data-ve-theme', 'light');
    await new Promise(rr => setTimeout(rr, 700));
    const light = snap();
    html.setAttribute('data-ve-theme', 'dark');
    await new Promise(rr => setTimeout(rr, 700));
    const dark = snap();
    return { light, dark };
  });
  // The token resolves to the fixture's light vs dark surface-sunken AND
  // the column actually re-painted (computed bg differs) — proof the flip
  // drove the paint live, not a hardcoded colour.
  const ok = r.light.sunkenVar === '#f1ece1'
    && r.dark.sunkenVar === '#0f0d09'
    && r.light.colBg !== r.dark.colBg
    && /rgb/.test(r.light.colBg) && /rgb/.test(r.dark.colBg);
  record('theme_flip_repaints', ok ? 'PASS' : 'FAIL',
    'data-ve-theme flip re-paints the column canvas (token-driven)',
    JSON.stringify(r));
}

async function testDragAddsNoNewElements(page) {
  // The no-new-elements rule: a drag must never inject outlines, frames,
  // or ghost nodes — drag state lives only in existing CSS classes. The
  // total element count under the board (and in <body>) is unchanged
  // after a completed drag, and no stray dragging/drop-target class
  // lingers.
  const s = await setup(page);
  if (!s.ok) {
    record('drag_no_new_elements', 'FAIL', 'drag injects no DOM nodes', s.error);
    return;
  }
  const pre = await page.evaluate(() => ({
    bodyCount: document.body.querySelectorAll('*').length,
    boardCount: document.querySelector('.ve-editor-kanban')
      .querySelectorAll('*').length
  }));
  await pointerDrag(page, {
    fromSel: '.ve-editor-kanban-ticket[data-ticket-key="metrics"]',
    toSel: '.ve-editor-kanban-bucket[data-col-key="now"]',
    toEdge: 'bottom',
    ptype: 'touch'
  });
  await pointerDrag(page, {
    fromSel: '.ve-editor-kanban-ticket[data-ticket-key="legacy"]',
    toSel: '.ve-editor-kanban-bucket[data-col-key="next"]',
    toEdge: 'center',
    ptype: 'mouse'
  });
  const post = await page.evaluate(() => ({
    bodyCount: document.body.querySelectorAll('*').length,
    boardCount: document.querySelector('.ve-editor-kanban')
      .querySelectorAll('*').length,
    lingeringDragClasses: document.querySelectorAll(
      '.ve-editor-kanban-dragging, .ve-editor-kanban-drop-target').length
  }));
  const ok = post.bodyCount === pre.bodyCount
    && post.boardCount === pre.boardCount
    && post.lingeringDragClasses === 0;
  record('drag_no_new_elements', ok ? 'PASS' : 'FAIL',
    'a completed drag adds zero DOM nodes + leaves no lingering drag classes',
    JSON.stringify({ pre, post }));
}

// ── Runner ───────────────────────────────────────────────────────────

const tests = [
  testRendersColumnsAndTickets,
  testTouchDragMovesTicket,
  testMouseDragMovesTicket,
  testExportMarkdownOrdering,
  testThemeFlipRepaints,
  testDragAddsNoNewElements
];

const page = await browser.getPage("editor-kanban-tests");

try {
  for (const t of tests) {
    try {
      await t(page);
    } catch (e) {
      record(t.name || 'unnamed', 'ERROR', t.name || '',
        String(e && e.message || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
