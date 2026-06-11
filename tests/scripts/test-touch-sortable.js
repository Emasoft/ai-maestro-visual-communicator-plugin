// ai-maestro-visual-communicator-plugin — touch-parity sortable tests.
//
// Verifies the Pointer-Events drag-reorder path shared by ve-rank-list
// and ve-tier-list (TRDD-7114fb4e Opt 3). The widgets dropped HTML5
// drag-and-drop (which never fires on touch) for a single pointer path
// that works on mouse + touch + pen. These tests drive that path with
// SYNTHETIC PointerEvents dispatched with pointerType:'touch' AND
// 'mouse', and assert the DOM order, the emitted ve-form-change payload,
// that a sub-threshold tap does NOT reorder and still reaches the
// runtime's click-to-select model, and that a drag adds NO new DOM
// elements (the no-new-elements rule — state lives in existing classes).
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/touch-sortable-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpFormInputs === 'object'
      && typeof window.amvcpFormInputs.init === 'function'
      && (window.__vcFixtureReady === true || !!window.__vcFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vcFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Dispatch a full pointer drag gesture from one element's centre to a
// target point. Runs ENTIRELY in the page so each move re-reads live
// geometry. `gesture` carries:
//   fromSel  — CSS selector of the element to grab
//   toSel    — CSS selector whose rect supplies the drop point
//   toEdge   — 'top' | 'mid' | 'bottom' | 'center' — where in toSel's
//              rect to release (top/bottom drive rank insert-before/after)
//   ptype    — 'touch' | 'mouse'
//   moveOnly — when true, only move `dx`/`dy` px (no full drop) — used
//              for the sub-threshold tap test
async function pointerDrag(page, gesture) {
  return await page.evaluate((g) => {
    function centre(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r };
    }
    function fire(el, type, x, y, ptype) {
      // PointerEvent is constructable in Chromium; isPrimary + a stable
      // pointerId let setPointerCapture (guarded in the widget) work.
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
    const c0 = centre(from);
    // Press on the source item.
    fire(from, 'pointerdown', c0.x, c0.y, g.ptype);

    if (g.moveOnly) {
      // A tiny nudge BELOW the widget's 6px threshold — must read as a
      // tap, not a drag. Then release on the same element.
      const nx = c0.x + (g.dx || 2);
      const ny = c0.y + (g.dy || 2);
      fire(from, 'pointermove', nx, ny, g.ptype);
      fire(from, 'pointerup', nx, ny, g.ptype);
      return { tap: true };
    }

    const to = document.querySelector(g.toSel);
    if (!to) { return { error: 'toSel not found: ' + g.toSel }; }
    const tr = to.getBoundingClientRect();
    let tx = tr.left + tr.width / 2;
    let ty;
    if (g.toEdge === 'top') { ty = tr.top + 3; }
    else if (g.toEdge === 'bottom') { ty = tr.bottom - 3; }
    else { ty = tr.top + tr.height / 2; }   // mid / center

    // Move in several steps so pointerleave/over fire like a real drag
    // (single jumps hide ordering races — §1 of the browser-test rules).
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const x = c0.x + (tx - c0.x) * (i / steps);
      const y = c0.y + (ty - c0.y) * (i / steps);
      // Pointer Events route every move to the capturing element, so
      // dispatch on `from` (the captured target), matching production.
      fire(from, 'pointermove', x, y, g.ptype);
    }
    fire(from, 'pointerup', tx, ty, g.ptype);
    return { dropped: true, tx: tx, ty: ty };
  }, gesture);
}

async function rankKeys(page) {
  return await page.evaluate(() =>
    Array.from(document.querySelectorAll('.ve-rank-list ol > li'))
      .map(l => l.getAttribute('data-ve-rank-key')));
}

async function testTouchRankReorder(page) {
  // Touch-drag rank item 3 (charlie) ABOVE item 1 (alpha): the DOM
  // order should put charlie first.
  const s = await setup(page);
  if (!s.ok) {
    record('touch_rank_reorder', 'FAIL', 'touch drag rank reorders DOM', s.error);
    return;
  }
  const before = await rankKeys(page);
  const move = await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="charlie"]',
    toSel: '.ve-rank-list ol > li[data-ve-rank-key="alpha"]',
    toEdge: 'top',
    ptype: 'touch'
  });
  const after = await rankKeys(page);
  const ok = !move.error
    && before.join(',') === 'alpha,bravo,charlie,delta'
    && after[0] === 'charlie'
    && after.indexOf('alpha') === 1
    && after.length === 4;
  record('touch_rank_reorder', ok ? 'PASS' : 'FAIL',
    'touch-drag rank item above the first reorders the DOM',
    JSON.stringify({ before, after, move }));
}

async function testTouchRankEmitsOrder(page) {
  // The same touch gesture must fire ve-form-change carrying the new
  // order array (verify in the event payload + LS — the ≥2-places rule).
  const s = await setup(page);
  if (!s.ok) {
    record('touch_rank_emits', 'FAIL', 'touch rank emits ve-form-change order', s.error);
    return;
  }
  await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="charlie"]',
    toSel: '.ve-rank-list ol > li[data-ve-rank-key="alpha"]',
    toEdge: 'top',
    ptype: 'touch'
  });
  const r = await page.evaluate(() => ({
    lastEvent: window.__vcFormChanges.filter(e => e.kind === 'rank-list').pop(),
    lsValue: JSON.parse(localStorage.getItem(
      'amvcp-form-input:rank:touch') || 'null')
  }));
  const ok = r.lastEvent
    && r.lastEvent.kind === 'rank-list'
    && Array.isArray(r.lastEvent.value)
    && r.lastEvent.value[0] === 'charlie'
    && Array.isArray(r.lsValue)
    && r.lsValue[0] === 'charlie';
  record('touch_rank_emits', ok ? 'PASS' : 'FAIL',
    'touch reorder fires ve-form-change with new order + persists to LS',
    JSON.stringify(r));
}

async function testMouseRankReorder(page) {
  // Desktop parity after dropping HTML5 DnD: the SAME gesture with
  // pointerType:'mouse' still reorders.
  const s = await setup(page);
  if (!s.ok) {
    record('mouse_rank_reorder', 'FAIL', 'mouse drag still reorders (desktop parity)', s.error);
    return;
  }
  const move = await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="delta"]',
    toSel: '.ve-rank-list ol > li[data-ve-rank-key="alpha"]',
    toEdge: 'top',
    ptype: 'mouse'
  });
  const after = await rankKeys(page);
  const r = await page.evaluate(() =>
    (window.__vcFormChanges.filter(e => e.kind === 'rank-list').pop() || {}).value);
  const ok = !move.error
    && after[0] === 'delta'
    && Array.isArray(r) && r[0] === 'delta';
  record('mouse_rank_reorder', ok ? 'PASS' : 'FAIL',
    'mouse-pointer drag reorders too — desktop parity preserved',
    JSON.stringify({ after, event: r, move }));
}

async function testTouchTierAssign(page) {
  // Touch-drag a tier item (logs, starts in unranked) into the A bucket
  // → it lands in A and a tier-list change event fires with A's array.
  const s = await setup(page);
  if (!s.ok) {
    record('touch_tier_assign', 'FAIL', 'touch drag tier assigns + flushes', s.error);
    return;
  }
  const move = await pointerDrag(page, {
    fromSel: '.ve-tier-item[data-item-key="logs"]',
    toSel: '.ve-tier-bucket[data-tier-key="A"]',
    toEdge: 'center',
    ptype: 'touch'
  });
  const r = await page.evaluate(() => ({
    aContains: Array.from(document.querySelectorAll(
      '.ve-tier-bucket[data-tier-key="A"] > li'))
      .map(l => l.getAttribute('data-item-key')),
    lastEvent: window.__vcFormChanges.filter(e => e.kind === 'tier-list').pop(),
    lsLogsTier: (JSON.parse(localStorage.getItem(
      'amvcp-form-input:tier:touch') || '{}')).logs
  }));
  const ok = !move.error
    && r.aContains.indexOf('logs') >= 0
    && r.lastEvent && r.lastEvent.kind === 'tier-list'
    && Array.isArray(r.lastEvent.value.A)
    && r.lastEvent.value.A.indexOf('logs') >= 0
    && r.lsLogsTier === 'A';
  record('touch_tier_assign', ok ? 'PASS' : 'FAIL',
    'touch-drag a tier item into bucket A assigns it + flushes the event',
    JSON.stringify(r));
}

async function testTapDoesNotReorderOrBlockSelect(page) {
  // A plain tap (sub-threshold movement) must NOT reorder the list, and
  // must NOT swallow the click — the runtime's click-to-select still
  // marks the widget root selected (data-ve-selected="1"). This proves
  // the 6px threshold lets a real click through to selection.
  const s = await setup(page);
  if (!s.ok) {
    record('tap_no_reorder_no_block', 'FAIL', 'tap keeps order + reaches selection', s.error);
    return;
  }
  const before = await rankKeys(page);
  // Tap (2px nudge) on the charlie item, then a real click — synthetic
  // pointerup does not auto-generate a click, so emit one to model the
  // browser's click that follows a tap.
  await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="charlie"]',
    moveOnly: true,
    dx: 2, dy: 2,
    ptype: 'touch'
  });
  const r = await page.evaluate(() => {
    const li = document.querySelector(
      '.ve-rank-list ol > li[data-ve-rank-key="charlie"]');
    // The browser fires a click after a tap; reproduce it so we test the
    // runtime's selection path (the widget must not have suppressed it).
    li.dispatchEvent(new MouseEvent('click',
      { bubbles: true, cancelable: true }));
    const root = document.querySelector('.ve-rank-list');
    return {
      order: Array.from(document.querySelectorAll('.ve-rank-list ol > li'))
        .map(l => l.getAttribute('data-ve-rank-key')),
      rootSelected: root.getAttribute('data-ve-selected'),
      reorderEvents: window.__vcFormChanges
        .filter(e => e.kind === 'rank-list').length
    };
  });
  const ok = before.join(',') === 'alpha,bravo,charlie,delta'
    && r.order.join(',') === 'alpha,bravo,charlie,delta'
    && r.reorderEvents === 0
    && r.rootSelected === '1';
  record('tap_no_reorder_no_block', ok ? 'PASS' : 'FAIL',
    'a sub-threshold tap leaves order intact + still selects (click not blocked)',
    JSON.stringify(r));
}

async function testDragAddsNoNewElements(page) {
  // The no-new-elements rule: a drag must never inject outlines, frames,
  // or ghost nodes — drag state lives only in existing CSS classes. The
  // total element count under the widgets (and in <body>) is unchanged
  // after a completed drag, and no stray ve-*-dragging/-drop-target
  // class lingers.
  const s = await setup(page);
  if (!s.ok) {
    record('drag_no_new_elements', 'FAIL', 'drag injects no DOM nodes', s.error);
    return;
  }
  const pre = await page.evaluate(() => ({
    bodyCount: document.body.querySelectorAll('*').length,
    rankCount: document.querySelector('.ve-rank-list').querySelectorAll('*').length,
    tierCount: document.querySelector('.ve-tier-list').querySelectorAll('*').length
  }));
  await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="charlie"]',
    toSel: '.ve-rank-list ol > li[data-ve-rank-key="alpha"]',
    toEdge: 'top',
    ptype: 'touch'
  });
  await pointerDrag(page, {
    fromSel: '.ve-tier-item[data-item-key="logs"]',
    toSel: '.ve-tier-bucket[data-tier-key="A"]',
    toEdge: 'center',
    ptype: 'touch'
  });
  const post = await page.evaluate(() => ({
    bodyCount: document.body.querySelectorAll('*').length,
    rankCount: document.querySelector('.ve-rank-list').querySelectorAll('*').length,
    tierCount: document.querySelector('.ve-tier-list').querySelectorAll('*').length,
    lingeringDragClasses: document.querySelectorAll(
      '.ve-rank-dragging, .ve-rank-drop-target, '
      + '.ve-tier-dragging, .ve-tier-drop-target').length
  }));
  const ok = post.bodyCount === pre.bodyCount
    && post.rankCount === pre.rankCount
    && post.tierCount === pre.tierCount
    && post.lingeringDragClasses === 0;
  record('drag_no_new_elements', ok ? 'PASS' : 'FAIL',
    'a completed drag adds zero DOM nodes + leaves no lingering drag classes',
    JSON.stringify({ pre, post }));
}

async function testDragSuppressesTrailingClickSelect(page) {
  // After a real drag, the browser emits a trailing `click`. That click
  // must NOT toggle the runtime's element-selection (otherwise every
  // reorder would also select the widget). The engine flags exactly one
  // post-drag click for suppression via a window-capture listener that
  // pre-empts the runtime's document-capture selection handler. Verify
  // the root is NOT selected after drag + trailing click.
  const s = await setup(page);
  if (!s.ok) {
    record('drag_suppresses_click_select', 'FAIL',
      'post-drag click does not select', s.error);
    return;
  }
  await pointerDrag(page, {
    fromSel: '.ve-rank-list ol > li[data-ve-rank-key="charlie"]',
    toSel: '.ve-rank-list ol > li[data-ve-rank-key="alpha"]',
    toEdge: 'top',
    ptype: 'mouse'
  });
  const r = await page.evaluate(() => {
    // The browser fires a click on the (moved) item after the drag —
    // reproduce it. The engine's suppression must swallow it.
    const li = document.querySelector(
      '.ve-rank-list ol > li[data-ve-rank-key="charlie"]');
    li.dispatchEvent(new MouseEvent('click',
      { bubbles: true, cancelable: true }));
    return {
      rootSelected: document.querySelector('.ve-rank-list')
        .getAttribute('data-ve-selected'),
      reordered: Array.from(document.querySelectorAll('.ve-rank-list ol > li'))
        .map(l => l.getAttribute('data-ve-rank-key'))[0]
    };
  });
  // The drag itself must have reordered (charlie first), and the trailing
  // click must NOT have left the widget selected.
  const ok = r.reordered === 'charlie'
    && r.rootSelected !== '1';
  record('drag_suppresses_click_select', ok ? 'PASS' : 'FAIL',
    'the click that trails a drag is swallowed — no spurious selection',
    JSON.stringify(r));
}

// ── Runner ───────────────────────────────────────────────────────────

const tests = [
  testTouchRankReorder,
  testTouchRankEmitsOrder,
  testMouseRankReorder,
  testTouchTierAssign,
  testTapDoesNotReorderOrBlockSelect,
  testDragAddsNoNewElements,
  testDragSuppressesTrailingClickSelect
];

const page = await browser.getPage("touch-sortable-tests");

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
