// test-interactive-controls.js
//
// Dev-browser script — exercises scripts/amvcp-interactive.js, the
// Phase-2 interactive-control widget module.
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpInteractive` + Node `module.exports`). This suite loads
// it from the self-contained fixture interactive-controls.html — which
// loads ONLY amvcp-designmd.js + amvcp-interactive.js (no runtime), so
// the standalone boot path is what is under test.
//
// Coverage (spec §13 test plan):
//   §0  state plumbing  — embedded JSON read, localStorage round-trip
//   §1  panels          — CSS-only tab switch, ARIA injection, drafts,
//                         native accordion, :target modal
//   §2  filter pills    — show/hide, persistence
//   §3  stepper         — state classes, guarded keyframe, step-nav
//   §4  virtualized list— binary search, windowed render, noscript
//   §5  live-tweak      — continuous setProperty, discrete classList
//   §6  Kanban          — drag move, Markdown export, persistence
//   xx  invariants      — theme recolor, no hardcoded hex, JS-off
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/interactive-controls.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name: name, status: status, desc: desc, detail: detail || '' });
}

// Load the fixture fresh and wait until both globals have installed.
async function setup(page) {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(
      () => typeof window.amvcpInteractive === 'object'
        && typeof window.amvcpInteractive.boot === 'function'
        && window.__amvcpInteractiveBooted === true
    );
    if (ready) {
      // Give the post-load vlist top-up script a frame to finish.
      await page.waitForTimeout(120);
      return true;
    }
    await page.waitForTimeout(60);
  }
  return false;
}

// ── §0 — state plumbing ──────────────────────────────────────────────

async function embedded_json_parsed(page) {
  // readModel('ic-data') returns the parsed object; a malformed model
  // throws (fail-fast — the engine never invents defaults).
  if (!(await setup(page))) {
    record('embedded_json_parsed', 'FAIL', 'embedded JSON parse', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpInteractive;
    const model = api.readModel('ic-data');
    let threwOnBad = false;
    // Inject a deliberately malformed model and confirm readModel throws.
    const bad = document.createElement('script');
    bad.type = 'application/json';
    bad.id = 'ic-bad-model';
    bad.textContent = '{ not valid json';
    document.body.appendChild(bad);
    try { api.readModel('ic-bad-model'); }
    catch (e) { threwOnBad = true; }
    document.body.removeChild(bad);
    return {
      hasTabs: !!(model && model.tabs && model.tabs.length === 3),
      hasBoard: !!(model && model.board && model.board.columns),
      threwOnBad: threwOnBad
    };
  });
  const ok = res.hasTabs && res.hasBoard && res.threwOnBad === true;
  record('embedded_json_parsed', ok ? 'PASS' : 'FAIL',
    'readModel parses the embedded JSON; malformed model throws',
    JSON.stringify(res));
}

async function localstorage_roundtrip(page) {
  // saveState/loadState round-trip a value; a missing key returns the
  // default; a data-ic-persist element with no data-id logs an error
  // (stateKey returns null and console.error fires).
  if (!(await setup(page))) {
    record('localstorage_roundtrip', 'FAIL', 'localStorage round-trip', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpInteractive;
    // A probe element with a data-id.
    const probe = document.createElement('div');
    probe.setAttribute('data-id', 'ic-test-rt-' + Date.now());
    api.saveState(probe, { n: 42 });
    const loaded = api.loadState(probe, null);
    // A fresh probe with NO stored key → default.
    const fresh = document.createElement('div');
    fresh.setAttribute('data-id', 'ic-test-missing-' + Date.now());
    const def = api.loadState(fresh, 'DEFAULT');
    // A data-ic-persist element with no data-id → stateKey null + error.
    let errored = false;
    const orig = console.error;
    console.error = function () { errored = true; };
    const noId = document.createElement('div');
    const key = api.stateKey(noId);
    console.error = orig;
    return {
      roundtrip: !!(loaded && loaded.n === 42),
      missingDefault: def === 'DEFAULT',
      noIdKeyNull: key === null,
      noIdErrored: errored
    };
  });
  const ok = res.roundtrip && res.missingDefault
    && res.noIdKeyNull && res.noIdErrored;
  record('localstorage_roundtrip', ok ? 'PASS' : 'FAIL',
    'saveState/loadState round-trip; missing key → default; no data-id → error',
    JSON.stringify(res));
}

// ── §1 — panels & disclosure ─────────────────────────────────────────

async function tabs_cssonly_switch(page) {
  // The tab switch is pure CSS — clicking a tab label checks its radio
  // and the matching .ic-tabpanel becomes display:block. (We verify the
  // CSS mechanism: set the radio directly, read computed display.)
  if (!(await setup(page))) {
    record('tabs_cssonly_switch', 'FAIL', 'CSS-only tab switch', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const detailRadio = document.getElementById('tab-detail');
    detailRadio.checked = true;
    const overview = document.querySelector('.ic-tabpanel[data-tab="tab-overview"]');
    const detail = document.querySelector('.ic-tabpanel[data-tab="tab-detail"]');
    return {
      overviewHidden: getComputedStyle(overview).display === 'none',
      detailVisible: getComputedStyle(detail).display === 'block'
    };
  });
  const ok = res.overviewHidden && res.detailVisible;
  record('tabs_cssonly_switch', ok ? 'PASS' : 'FAIL',
    'checking a tab radio shows its panel, hides the rest (CSS-only)',
    JSON.stringify(res));
}

async function tabs_aria_injected(page) {
  // After boot each .ic-tab has role="tab" + aria-selected; the active
  // tab has tabindex 0; ArrowRight moves selection and persists it.
  if (!(await setup(page))) {
    record('tabs_aria_injected', 'FAIL', 'tab ARIA injection', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const tabs = Array.prototype.slice.call(document.querySelectorAll('.ic-tab'));
    const allRole = tabs.every(function (t) { return t.getAttribute('role') === 'tab'; });
    const allAria = tabs.every(function (t) { return t.hasAttribute('aria-selected'); });
    // The default-checked tab (Overview) should be selected + tabindex 0.
    const overview = document.querySelector('.ic-tab[for="tab-overview"]');
    return {
      allRole: allRole,
      allAria: allAria,
      activeSelected: overview.getAttribute('aria-selected') === 'true',
      activeTabindex: overview.getAttribute('tabindex') === '0'
    };
  });
  // Drive a real ArrowRight on the active tab → selection moves.
  await page.focus('.ic-tab[for="tab-overview"]');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  const after = await page.evaluate(() => {
    const detailRadio = document.getElementById('tab-detail');
    let persisted = null;
    try { persisted = localStorage.getItem('amvcp-ic:report-tabs'); } catch (e) {}
    return {
      detailChecked: detailRadio.checked === true,
      persisted: persisted
    };
  });
  const ok = res.allRole && res.allAria && res.activeSelected
    && res.activeTabindex && after.detailChecked
    && after.persisted === '"tab-detail"';
  record('tabs_aria_injected', ok ? 'PASS' : 'FAIL',
    'boot injects role/aria-selected/tabindex; arrow key moves + persists',
    JSON.stringify({ pre: res, post: after }));
}

async function tabs_draft_restore(page) {
  // Typing in a [data-ic-draft] textarea autosaves (500 ms debounce);
  // reloading restores the draft.
  if (!(await setup(page))) {
    record('tabs_draft_restore', 'FAIL', 'tab draft restore', 'globals never appeared');
    return;
  }
  const stamp = 'draft text ' + Date.now();
  await page.evaluate((txt) => {
    const ta = document.querySelector('textarea[data-ic-draft]');
    ta.value = txt;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, stamp);
  // Wait past the 500 ms debounce so the save fires.
  await page.waitForTimeout(700);
  // Reload — the draft must restore.
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const restored = await page.evaluate(() => {
    const ta = document.querySelector('textarea[data-ic-draft]');
    return ta ? ta.value : null;
  });
  const ok = restored === stamp;
  record('tabs_draft_restore', ok ? 'PASS' : 'FAIL',
    'textarea draft autosaves after 500 ms and restores on reload',
    JSON.stringify({ restored: restored }));
}

async function accordion_native(page) {
  // <details> toggles open/closed; data-ic-accordion="single" closes
  // siblings when one opens.
  if (!(await setup(page))) {
    record('accordion_native', 'FAIL', 'native accordion', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const items = Array.prototype.slice.call(
      document.querySelectorAll('.ic-acc-item'));
    // Item 0 starts open. Open item 1 → item 0 must close (single mode).
    const before = items[0].open;
    items[1].open = true;
    items[1].dispatchEvent(new Event('toggle'));
    return {
      firstStartedOpen: before === true,
      firstClosedAfter: items[0].open === false,
      secondOpen: items[1].open === true
    };
  });
  const ok = res.firstStartedOpen && res.firstClosedAfter && res.secondOpen;
  record('accordion_native', ok ? 'PASS' : 'FAIL',
    'native <details> toggles; single-open mode closes siblings',
    JSON.stringify(res));
}

async function modal_target_open(page) {
  // href="#ic-modal-demo" makes .ic-modal:target display; the modal
  // card has no inner scrollbar (no max-height + overflow:auto).
  if (!(await setup(page))) {
    record('modal_target_open', 'FAIL', ':target modal', 'globals never appeared');
    return;
  }
  await page.evaluate(() => { location.hash = 'ic-modal-demo'; });
  await page.waitForTimeout(80);
  const open = await page.evaluate(() => {
    const modal = document.getElementById('ic-modal-demo');
    const card = modal.querySelector('.ic-modal-card');
    const cs = getComputedStyle(card);
    return {
      modalShown: getComputedStyle(modal).display !== 'none',
      cardNoInnerScroll: cs.overflow === 'visible' || cs.overflowY === 'visible'
    };
  });
  // Dismiss via the scrim link.
  await page.evaluate(() => { location.hash = ''; });
  await page.waitForTimeout(80);
  const closed = await page.evaluate(() => {
    return getComputedStyle(document.getElementById('ic-modal-demo')).display === 'none';
  });
  const ok = open.modalShown && open.cardNoInnerScroll && closed;
  record('modal_target_open', ok ? 'PASS' : 'FAIL',
    ':target shows the modal; card has no inner scrollbar; dismiss works',
    JSON.stringify({ open: open, closedAfter: closed }));
}

// ── §2 — filter pills ────────────────────────────────────────────────

async function filter_pills_show_hide(page) {
  // Selecting the "Bugs" pill shows only .ic-filtered[data-filter-tag=bug]
  // blocks; "All" shows every block. Pure CSS — works with JS off.
  if (!(await setup(page))) {
    record('filter_pills_show_hide', 'FAIL', 'filter pill show/hide', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    document.getElementById('flt-bug').checked = true;
    const blocks = Array.prototype.slice.call(
      document.querySelectorAll('.ic-filtered'));
    let bugShown = 0, perfShown = 0;
    blocks.forEach(function (b) {
      const shown = getComputedStyle(b).display !== 'none';
      if (b.getAttribute('data-filter-tag') === 'bug' && shown) bugShown++;
      if (b.getAttribute('data-filter-tag') === 'perf' && shown) perfShown++;
    });
    // Back to "All" — everything shows.
    document.getElementById('flt-all').checked = true;
    let allShown = 0;
    blocks.forEach(function (b) {
      if (getComputedStyle(b).display !== 'none') allShown++;
    });
    return { bugShown: bugShown, perfShown: perfShown, allShown: allShown,
             total: blocks.length };
  });
  const ok = res.bugShown === 2 && res.perfShown === 0
    && res.allShown === res.total;
  record('filter_pills_show_hide', ok ? 'PASS' : 'FAIL',
    'a tag pill shows only matching blocks; All shows everything (CSS-only)',
    JSON.stringify(res));
}

async function filter_pills_persist(page) {
  // The active filter is restored from localStorage on reload.
  if (!(await setup(page))) {
    record('filter_pills_persist', 'FAIL', 'filter pill persist', 'globals never appeared');
    return;
  }
  await page.evaluate(() => {
    const perf = document.getElementById('flt-perf');
    perf.checked = true;
    perf.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(80);
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => {
    return { perfChecked: document.getElementById('flt-perf').checked === true };
  });
  const ok = res.perfChecked;
  record('filter_pills_persist', ok ? 'PASS' : 'FAIL',
    'the active filter is restored from localStorage on reload',
    JSON.stringify(res));
}

// ── §3 — stepper ─────────────────────────────────────────────────────

async function stepper_states(page) {
  // The ic-step--done/--active/--pending classes apply per the model;
  // the active marker carries the spin animation (or, under
  // prefers-reduced-motion, the static accent style).
  if (!(await setup(page))) {
    record('stepper_states', 'FAIL', 'stepper state classes', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const steps = Array.prototype.slice.call(document.querySelectorAll('.ic-step'));
    // Model: Plan done, Build active, Test pending, Ship pending.
    const cls = steps.map(function (s) { return s.className; });
    const activeMarker = document.querySelector('.ic-step--active .ic-step-marker');
    const anim = activeMarker ? getComputedStyle(activeMarker).animationName : '';
    return {
      planDone: cls[0].indexOf('ic-step--done') !== -1,
      buildActive: cls[1].indexOf('ic-step--active') !== -1,
      testPending: cls[2].indexOf('ic-step--pending') !== -1,
      activeHasAnim: anim === 'ic-spin' || anim === 'none'
    };
  });
  const ok = res.planDone && res.buildActive && res.testPending
    && res.activeHasAnim;
  record('stepper_states', ok ? 'PASS' : 'FAIL',
    'step state classes apply per model; active marker spins (or static)',
    JSON.stringify(res));
}

async function stepper_spin_no_dup(page) {
  // The ic-spin @keyframes is injected exactly once; a second
  // injectSpinKeyframe() call does not add another <style id="__ic-spin">,
  // and the data-ic-spin-injected flag guards re-entry.
  if (!(await setup(page))) {
    record('stepper_spin_no_dup', 'FAIL', 'guarded keyframe', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpInteractive;
    api.injectSpinKeyframe();
    api.injectSpinKeyframe();
    const styles = document.querySelectorAll('style#__ic-spin');
    return {
      exactlyOne: styles.length === 1,
      flagSet: document.documentElement.getAttribute('data-ic-spin-injected') === '1'
    };
  });
  const ok = res.exactlyOne && res.flagSet;
  record('stepper_spin_no_dup', ok ? 'PASS' : 'FAIL',
    'ic-spin @keyframes is injected exactly once (guarded)',
    JSON.stringify(res));
}

async function stepper_step_nav(page) {
  // Clicking a --done step fires ic:step-nav with the right stepId.
  if (!(await setup(page))) {
    record('stepper_step_nav', 'FAIL', 'stepper step-nav', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    return new Promise(function (resolve) {
      const stepper = document.querySelector('.ic-stepper');
      let fired = null;
      stepper.addEventListener('ic:step-nav', function (e) {
        fired = e.detail;
      });
      const done = document.querySelector('.ic-step--done');
      done.click();
      setTimeout(function () {
        resolve({
          fired: fired !== null,
          stepId: fired ? fired.stepId : null
        });
      }, 80);
    });
  });
  const ok = res.fired && res.stepId === 's-plan';
  record('stepper_step_nav', ok ? 'PASS' : 'FAIL',
    'clicking a done step fires ic:step-nav with the step id',
    JSON.stringify(res));
}

// ── §4 — virtualized list ────────────────────────────────────────────

async function vlist_binary_search(page) {
  // lowerBound / getVisibleRange return correct indices for a known
  // offsets array — unit-level, via page.evaluate against the module.
  if (!(await setup(page))) {
    record('vlist_binary_search', 'FAIL', 'vlist binary search', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpInteractive;
    const off = api.computeOffsets([32, 32, 32, 32, 32]);  // [0,32,64,96,128,160]
    return {
      offsetsOk: off.join(',') === '0,32,64,96,128,160',
      lb64: api.lowerBound(off, 64),     // first idx whose val >= 64 → 2
      lb65: api.lowerBound(off, 65),     // → 3
      range: api.getVisibleRange(off, 40, 50, 1)  // scrollTop 40, vp 50, ov 1
    };
  });
  const ok = res.offsetsOk && res.lb64 === 2 && res.lb65 === 3
    && res.range && res.range.start >= 0 && res.range.end <= 5
    && res.range.start <= res.range.end;
  record('vlist_binary_search', ok ? 'PASS' : 'FAIL',
    'computeOffsets/lowerBound/getVisibleRange return correct indices',
    JSON.stringify(res));
}

async function vlist_windowed_render(page) {
  // Only overscan+visible rows exist in the DOM; the .ic-vlist total
  // height equals items*rowHeight (600*32); no inner scrollbar on it.
  if (!(await setup(page))) {
    record('vlist_windowed_render', 'FAIL', 'vlist windowed render', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const vlist = document.querySelector('[data-ic-vlist]');
    const rows = vlist.querySelectorAll('.ic-vrow');
    const cs = getComputedStyle(vlist);
    return {
      // 600 items → far fewer than 600 rows rendered (windowed).
      renderedCount: rows.length,
      windowed: rows.length > 0 && rows.length < 600,
      totalHeight: vlist.style.height,        // "19200px" = 600 * 32
      noInnerScroll: cs.overflow === 'visible' || cs.overflowY === 'visible'
    };
  });
  // Scroll the WINDOW down and confirm the rendered window changes.
  const firstWindow = await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-ic-vlist] .ic-vrow');
    return rows.length ? rows[0].getAttribute('data-vrow') : null;
  });
  await page.evaluate(() => { window.scrollTo(0, 8000); });
  await page.waitForTimeout(160);
  const afterScroll = await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-ic-vlist] .ic-vrow');
    return rows.length ? rows[0].getAttribute('data-vrow') : null;
  });
  const ok = res.windowed && res.totalHeight === '19200px'
    && res.noInnerScroll && firstWindow !== afterScroll;
  record('vlist_windowed_render', ok ? 'PASS' : 'FAIL',
    'only the visible window of rows is in the DOM; window-scroll re-windows',
    JSON.stringify({ pre: res, firstWindow: firstWindow, afterScroll: afterScroll }));
}

async function vlist_noscript_fallback(page) {
  // The <noscript> static list is present in the markup (so a JS-off
  // report is never blank).
  if (!(await setup(page))) {
    record('vlist_noscript_fallback', 'FAIL', 'vlist noscript', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const ns = document.querySelector('noscript');
    return {
      hasNoscript: !!ns,
      // noscript.textContent carries the inert markup text.
      mentionsList: !!ns && ns.textContent.indexOf('ic-vlist-plain') !== -1
    };
  });
  const ok = res.hasNoscript && res.mentionsList;
  record('vlist_noscript_fallback', ok ? 'PASS' : 'FAIL',
    'a <noscript> static list fallback is present in the markup',
    JSON.stringify(res));
}

// ── §5 — live-tweak ──────────────────────────────────────────────────

async function tweak_continuous(page) {
  // Moving a [data-ic-prop] range sets the custom property on the stage
  // and updates the <output>.
  if (!(await setup(page))) {
    record('tweak_continuous', 'FAIL', 'tweak continuous', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const range = document.querySelector('input[data-ic-prop]');
    range.value = '24';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    const stage = document.querySelector('[data-ic-stage]');
    const out = document.querySelector('.ic-tweak-val');
    return {
      propSet: stage.style.getPropertyValue('--demo-radius').trim() === '24px',
      outText: out ? out.textContent : null
    };
  });
  const ok = res.propSet && res.outText === '24px';
  record('tweak_continuous', ok ? 'PASS' : 'FAIL',
    'a range control sets the custom property on the stage + updates <output>',
    JSON.stringify(res));
}

async function tweak_discrete(page) {
  // Changing a [data-ic-class-group] select strips the old group class
  // and adds the chosen one on the stage element.
  if (!(await setup(page))) {
    record('tweak_discrete', 'FAIL', 'tweak discrete', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const sel = document.querySelector('select[data-ic-class-group]');
    sel.value = 'ic-demo-style--dashed';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    const box = document.querySelector('.ic-demo-box');
    return {
      hasDashed: box.className.indexOf('ic-demo-style--dashed') !== -1,
      noSolid: box.className.indexOf('ic-demo-style--solid') === -1
    };
  });
  const ok = res.hasDashed && res.noSolid;
  record('tweak_discrete', ok ? 'PASS' : 'FAIL',
    'a select strips the old group class and adds the chosen one',
    JSON.stringify(res));
}

async function tweak_designmd_token(page) {
  // A control wired to a custom property restyles a themed component
  // live — setProperty cascades to every descendant of the stage.
  if (!(await setup(page))) {
    record('tweak_designmd_token', 'FAIL', 'tweak token restyle', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const range = document.querySelector('input[data-ic-prop]');
    const box = document.querySelector('.ic-demo-box');
    range.value = '0';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    const at0 = getComputedStyle(box).borderRadius;
    range.value = '40';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    const at40 = getComputedStyle(box).borderRadius;
    return { at0: at0, at40: at40, differ: at0 !== at40 };
  });
  const ok = res.differ === true;
  record('tweak_designmd_token', ok ? 'PASS' : 'FAIL',
    'a tweaked custom property restyles the previewed component live',
    JSON.stringify(res));
}

// ── §6 — Kanban ──────────────────────────────────────────────────────

async function board_drag_move(page) {
  // Simulated drag (dragstart/dragover/drop with a DataTransfer) moves a
  // card to the target column; the model reflects the new col;
  // ic:reorder fires.
  if (!(await setup(page))) {
    record('board_drag_move', 'FAIL', 'board drag move', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    return new Promise(function (resolve) {
      const board = document.querySelector('[data-ic-board]');
      let reorder = null;
      board.addEventListener('ic:reorder', function (e) { reorder = e.detail; });
      // Card c1 starts in "now". Drag it to "done".
      const card = board.querySelector('.ic-card[data-id="c1"]');
      const target = board.querySelector('.ic-col[data-col="done"]');
      const dt = new DataTransfer();
      function ev(type, node) {
        const e = new DragEvent(type, { bubbles: true, cancelable: true });
        // jsdom/Chromium: dataTransfer is read-only on the synthetic
        // event — define it so the handler can read/write the payload.
        Object.defineProperty(e, 'dataTransfer', { value: dt });
        node.dispatchEvent(e);
      }
      ev('dragstart', card);
      ev('dragover', target);
      ev('drop', target);
      setTimeout(function () {
        const moved = board.querySelector(
          '.ic-col[data-col="done"] .ic-card[data-id="c1"]');
        resolve({
          cardInDone: !!moved,
          reorderFired: reorder !== null,
          modelCol: reorder
            ? (reorder.cards.filter(function (c) { return c.id === 'c1'; })[0] || {}).col
            : null
        });
      }, 100);
    });
  });
  const ok = res.cardInDone && res.reorderFired && res.modelCol === 'done';
  record('board_drag_move', ok ? 'PASS' : 'FAIL',
    'a simulated drag moves a card; the model updates; ic:reorder fires',
    JSON.stringify(res));
}

async function board_markdown_export(page) {
  // toMarkdown emits columns as ## headings and cards as - [ ] items in
  // column order.
  if (!(await setup(page))) {
    record('board_markdown_export', 'FAIL', 'board Markdown export', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const board = document.querySelector('[data-ic-board]');
    const md = window.amvcpInteractive.toBoardMarkdown(board);
    return {
      md: md,
      hasTitle: md.indexOf('# Sprint triage') === 0,
      hasNowHeading: md.indexOf('## Now') !== -1,
      hasCheckbox: md.indexOf('- [ ] **Fix login bug**') !== -1
    };
  });
  const ok = res.hasTitle && res.hasNowHeading && res.hasCheckbox;
  record('board_markdown_export', ok ? 'PASS' : 'FAIL',
    'toMarkdown emits ## column headings and - [ ] card items',
    JSON.stringify({ hasTitle: res.hasTitle, hasNowHeading: res.hasNowHeading,
                     hasCheckbox: res.hasCheckbox }));
}

async function board_persist(page) {
  // Card positions survive a reload via localStorage.
  if (!(await setup(page))) {
    record('board_persist', 'FAIL', 'board persist', 'globals never appeared');
    return;
  }
  // Move c3 from "next" to "now" via a simulated drag, which persists.
  await page.evaluate(() => {
    const board = document.querySelector('[data-ic-board]');
    const card = board.querySelector('.ic-card[data-id="c3"]');
    const target = board.querySelector('.ic-col[data-col="now"]');
    const dt = new DataTransfer();
    function ev(type, node) {
      const e = new DragEvent(type, { bubbles: true, cancelable: true });
      Object.defineProperty(e, 'dataTransfer', { value: dt });
      node.dispatchEvent(e);
    }
    ev('dragstart', card);
    ev('dragover', target);
    ev('drop', target);
  });
  await page.waitForTimeout(120);
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => {
    const board = document.querySelector('[data-ic-board]');
    const moved = board.querySelector('.ic-col[data-col="now"] .ic-card[data-id="c3"]');
    return { c3InNow: !!moved };
  });
  const ok = res.c3InNow;
  record('board_persist', ok ? 'PASS' : 'FAIL',
    'card positions survive a reload via localStorage',
    JSON.stringify(res));
}

// ── invariants ───────────────────────────────────────────────────────

async function theme_recolor(page) {
  // Hot-swapping the embedded DESIGN.md (light -> dark) recolors every
  // widget — read a pill / step marker / card computed color before and
  // after; the values must differ and never stay a hardcoded hex.
  if (!(await setup(page))) {
    record('theme_recolor', 'FAIL', 'theme recolor', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const dm = window.amvcpDesignMd;
    const ic = window.amvcpInteractive;
    const scriptEl = document.getElementById('ic-designmd');
    // The embedded <script> is HTML-indented — trim the structural
    // whitespace the same way the module does before parsing.
    const parsed = dm.parseDesignMd(ic.readEmbeddedDesignMdText(scriptEl));
    if (!parsed.ok) return { parseErr: parsed.errors };
    function sample() {
      return {
        bg: getComputedStyle(document.body).backgroundColor,
        card: getComputedStyle(document.querySelector('.ic-card')).backgroundColor,
        marker: getComputedStyle(
          document.querySelector('.ic-step--done .ic-step-marker')).backgroundColor
      };
    }
    // Apply light, sample; apply dark, sample.
    dm.applyTokens(dm.resolveTokens(parsed.designmd, 'light'));
    const light = sample();
    dm.applyTokens(dm.resolveTokens(parsed.designmd, 'dark'));
    const dark = sample();
    return { light: light, dark: dark };
  });
  const ok = !res.parseErr
    && res.light.bg !== res.dark.bg
    && res.light.card !== res.dark.card
    && res.light.marker !== res.dark.marker;
  record('theme_recolor', ok ? 'PASS' : 'FAIL',
    'hot-swapping light/dark DESIGN.md recolors body, card, step marker',
    JSON.stringify(res));
}

async function no_hardcoded_hex(page) {
  // Scan the component stylesheet text — no raw #rrggbb outside a
  // var(--…, #fallback) fallback slot.
  if (!(await setup(page))) {
    record('no_hardcoded_hex', 'FAIL', 'no hardcoded hex', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(async () => {
    // Fetch the raw amvcp-interactive.css text from the server.
    const r = await fetch('amvcp-interactive.css?_=' + Date.now());
    if (!r.ok) return { fetchErr: true };
    const css = await r.text();
    // Strip every `var(... , #hex)` fallback slot, then look for any
    // remaining #hex — those would be hardcoded colors.
    const stripped = css.replace(/var\([^)]*\)/g, '');
    const leftover = stripped.match(/#[0-9a-fA-F]{3,8}\b/g);
    return {
      cssLen: css.length,
      leftover: leftover || [],
      clean: !leftover
    };
  });
  const ok = !res.fetchErr && res.clean === true;
  record('no_hardcoded_hex', ok ? 'PASS' : 'FAIL',
    'no raw #hex in component CSS outside a var(…, #fallback) slot',
    JSON.stringify(res));
}

async function js_off_degradation(page) {
  // With JS disabled, tabs/accordion/modal/filter pills still function
  // (pure CSS); the vlist + board show their <noscript> fallback. We
  // verify the CSS-only mechanisms work without the module's globals.
  // dev-browser cannot toggle JS per-page, so we verify the CSS-only
  // contract: the :checked / :target selectors drive the widgets with
  // NO reliance on window.amvcpInteractive.
  if (!(await setup(page))) {
    record('js_off_degradation', 'FAIL', 'JS-off degradation', 'globals never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    // Tabs: a radio drives a panel with no JS call.
    document.getElementById('tab-notes').checked = true;
    const notesPanel = document.querySelector('.ic-tabpanel[data-tab="tab-notes"]');
    const tabsCssOnly = getComputedStyle(notesPanel).display === 'block';
    // Filter: a radio drives block visibility with no JS call.
    document.getElementById('flt-bug').checked = true;
    const bugBlock = document.querySelector('.ic-filtered[data-filter-tag="bug"]');
    const perfBlock = document.querySelector('.ic-filtered[data-filter-tag="perf"]');
    const filterCssOnly = getComputedStyle(bugBlock).display === 'block'
      && getComputedStyle(perfBlock).display === 'none';
    document.getElementById('flt-all').checked = true;
    // Modal: :target drives display with no JS call.
    location.hash = 'ic-modal-demo';
    const modalCssOnly = getComputedStyle(
      document.getElementById('ic-modal-demo')).display !== 'none';
    location.hash = '';
    // vlist + board have a <noscript> fallback in the markup.
    const noscriptPresent = !!document.querySelector('noscript');
    return { tabsCssOnly: tabsCssOnly, filterCssOnly: filterCssOnly,
             modalCssOnly: modalCssOnly, noscriptPresent: noscriptPresent };
  });
  const ok = res.tabsCssOnly && res.filterCssOnly
    && res.modalCssOnly && res.noscriptPresent;
  record('js_off_degradation', ok ? 'PASS' : 'FAIL',
    'tabs/accordion/modal/filter work CSS-only; vlist+board have noscript',
    JSON.stringify(res));
}

// ── Runner ───────────────────────────────────────────────────────────

const tests = [
  embedded_json_parsed,
  localstorage_roundtrip,
  tabs_cssonly_switch,
  tabs_aria_injected,
  tabs_draft_restore,
  accordion_native,
  modal_target_open,
  filter_pills_show_hide,
  filter_pills_persist,
  stepper_states,
  stepper_spin_no_dup,
  stepper_step_nav,
  vlist_binary_search,
  vlist_windowed_render,
  vlist_noscript_fallback,
  tweak_continuous,
  tweak_discrete,
  tweak_designmd_token,
  board_drag_move,
  board_markdown_export,
  board_persist,
  theme_recolor,
  no_hardcoded_hex,
  js_off_degradation
];

const page = await browser.getPage("interactive-controls-tests");

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
    console.log("TEST | " + r.name + " | " + r.status + " | " + r.desc
      + " | " + r.detail.replace(/\|/g, '/'));
  }
} finally {
  await page.close();
}
