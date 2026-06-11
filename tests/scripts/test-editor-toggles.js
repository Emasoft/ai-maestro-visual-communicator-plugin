// test-editor-toggles.js
//
// Dev-browser script — proves the feature-flag toggle editor
// (scripts/amvcp-editor-toggles.js, TRDD-1627a698 gap #19) renders,
// toggles, warns on unmet dependencies, exports a diff through the
// runtime selection channel, and adds ZERO new DOM elements on
// interaction while re-painting on a live theme flip.
//
// The fixture's spec:
//   group "Delivery":    canary(default off), telemetry(default ON),
//                        autoRoll(default off, requires [telemetry, canary])
//   group "Experimental":newUi(default off),
//                        betaApi(default off, requires [newUi])
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/editor-toggles-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the module global is installed AND the
// inline boot script finished (window.__etFixtureReady) or errored.
//
// CRITICAL: the editor persists flag state to localStorage keyed by the
// container's data-ve-id, and the same dev-browser page is reused across
// every test in this suite. Without a reset, a flag flipped ON in test N
// is restored from localStorage in test N+1 — polluting the diff and the
// dependency-warning state. So each setup() navigates once, wipes the
// editor's localStorage keys, then reloads to re-init from clean defaults.
async function setup(page) {
  await page.setViewportSize({ width: 1100, height: 820 });
  // First navigation — get an origin so localStorage is reachable, then
  // clear every amvcp-editor-toggles key.
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('amvcp-editor-toggles:') === 0) { kill.push(k); }
      }
      for (var j = 0; j < kill.length; j++) { localStorage.removeItem(kill[j]); }
      if (window.veSelection) { window.veSelection.length = 0; }
    } catch (e) { /* private mode — nothing persisted anyway */ }
  });
  // Reload so the editor re-inits from cleared storage (defaults).
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpEditorToggles === 'object'
      && typeof window.amvcpEditorToggles.init === 'function'
      && (window.__etFixtureReady === true || !!window.__etFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__etFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Helper: flip the switch for a given flag key (clicks its button).
async function flip(page, key) {
  await page.evaluate((k) => {
    const sw = document.querySelector('.ve-et-switch[data-ve-et-flag="' + k + '"]');
    if (sw) { sw.click(); }
  }, key);
  await page.waitForTimeout(40);
}

// ── Tests ───────────────────────────────────────────────────────────

async function testRendersGroupsAndSwitches(page) {
  // 1 — the editor renders one labelled band per group and one
  // role="switch" button per flag, from the embedded spec.
  const s = await setup(page);
  if (!s.ok) {
    record('editor_toggles_renders', 'FAIL',
      'renders group bands + switches from spec', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.querySelector('.ve-editor-toggles');
    const groups = root ? root.querySelectorAll('.ve-et-group') : [];
    const groupLabels = Array.prototype.map.call(
      root ? root.querySelectorAll('.ve-et-group-label') : [],
      function (n) { return n.textContent; });
    const switches = root ? root.querySelectorAll('.ve-et-switch[role="switch"]') : [];
    // telemetry defaults ON → its switch must be aria-checked at start.
    const tele = root && root.querySelector('.ve-et-switch[data-ve-et-flag="telemetry"]');
    const canary = root && root.querySelector('.ve-et-switch[data-ve-et-flag="canary"]');
    return {
      hasRoot: !!root,
      groupCount: groups.length,
      groupLabels: groupLabels,
      switchCount: switches.length,
      teleChecked: tele ? tele.getAttribute('aria-checked') : null,
      canaryChecked: canary ? canary.getAttribute('aria-checked') : null,
      hasCopy: !!(root && root.querySelector('.ve-et-copy'))
    };
  });
  const ok = res.hasRoot
    && res.groupCount === 2
    && res.groupLabels.indexOf('Delivery') >= 0
    && res.groupLabels.indexOf('Experimental') >= 0
    && res.switchCount === 5
    && res.teleChecked === 'true'      // default ON honoured
    && res.canaryChecked === 'false'   // default off honoured
    && res.hasCopy;
  record('editor_toggles_renders', ok ? 'PASS' : 'FAIL',
    'renders 2 group bands + 5 role=switch buttons honouring defaults',
    JSON.stringify(res));
}

async function testToggleFlipsState(page) {
  // 2 — clicking a switch flips its aria-checked and the live status
  // line reports the change count.
  const s = await setup(page);
  if (!s.ok) {
    record('editor_toggles_flip', 'FAIL',
      'switch flips aria-checked + status', s.error);
    return;
  }
  const before = await page.evaluate(() => {
    const sw = document.querySelector('.ve-et-switch[data-ve-et-flag="canary"]');
    return sw ? sw.getAttribute('aria-checked') : null;
  });
  await flip(page, 'canary');
  const after = await page.evaluate(() => {
    const sw = document.querySelector('.ve-et-switch[data-ve-et-flag="canary"]');
    const status = document.querySelector('.ve-et-status');
    return {
      checked: sw ? sw.getAttribute('aria-checked') : null,
      status: status ? status.textContent : ''
    };
  });
  const ok = before === 'false'
    && after.checked === 'true'
    && /1 flag changed/.test(after.status);
  record('editor_toggles_flip', ok ? 'PASS' : 'FAIL',
    'clicking a switch flips aria-checked false→true and updates status',
    JSON.stringify({ before: before, after: after }));
}

async function testDependencyWarning(page) {
  // 3 — turning autoRoll ON while canary is OFF (telemetry already on)
  // shows autoRoll's PRE-RENDERED warning row naming canary; turning
  // canary ON clears it.
  const s = await setup(page);
  if (!s.ok) {
    record('editor_toggles_dep_warning', 'FAIL',
      'dependency warning shows when required flag off, clears when satisfied',
      s.error);
    return;
  }
  // autoRoll requires [telemetry, canary]; telemetry is on by default,
  // canary is off → flipping autoRoll ON must surface the warning.
  await flip(page, 'autoRoll');
  const warned = await page.evaluate(() => {
    const w = document.querySelector('.ve-et-warn[data-ve-et-warn="autoRoll"]');
    return {
      shown: !!(w && w.classList.contains('ve-et-warn--show')),
      msg: w ? (w.querySelector('.ve-et-warn-msg').textContent || '') : ''
    };
  });
  // Satisfy the remaining requirement → warning clears.
  await flip(page, 'canary');
  const cleared = await page.evaluate(() => {
    const w = document.querySelector('.ve-et-warn[data-ve-et-warn="autoRoll"]');
    return !!(w && !w.classList.contains('ve-et-warn--show'));
  });
  const ok = warned.shown
    && /Canary rollout/.test(warned.msg)   // names the unmet requirement
    && !/Telemetry/.test(warned.msg)       // telemetry is satisfied, not named
    && cleared === true;
  record('editor_toggles_dep_warning', ok ? 'PASS' : 'FAIL',
    'autoRoll warns "Requires Canary rollout" while off, clears when canary on',
    JSON.stringify({ warned: warned, cleared: cleared }));
}

async function testDiffExportToSelection(page) {
  // 4 — clicking "Copy diff" after flipping canary lands a
  // kind:"element" entry in window.veSelection whose data.diff carries
  // the +canary/-canary unified-diff lines (export rides the runtime
  // selection channel per the TRDD).
  const s = await setup(page);
  if (!s.ok) {
    record('editor_toggles_diff_export', 'FAIL',
      'copy-diff payload lands in veSelection with changed-flag lines', s.error);
    return;
  }
  await flip(page, 'canary');   // canary default off → now on (1 change)
  await page.evaluate(() => {
    const btn = document.querySelector('.ve-et-copy');
    if (btn) { btn.click(); }
  });
  await page.waitForTimeout(60);
  const res = await page.evaluate(() => {
    const sel = window.veSelection || [];
    const entry = sel.filter(function (e) {
      return e && e.id === 'flag-diff:rollout';
    })[0] || null;
    return {
      listIsArray: Array.isArray(window.veSelection),
      count: sel.length,
      entry: entry
    };
  });
  const e = res.entry || {};
  const data = e.data || {};
  const diffText = data.diff || '';
  const changed = data.changed || [];
  const ok = res.listIsArray
    && e.kind === 'element'
    && e.type === 'flag-diff'
    && changed.length === 1
    && changed[0] && changed[0].key === 'canary'
    && changed[0].from === false && changed[0].to === true
    && /-canary = false/.test(diffText)
    && /\+canary = true/.test(diffText);
  record('editor_toggles_diff_export', ok ? 'PASS' : 'FAIL',
    'copy-diff pushes kind:"element"/type:"flag-diff" entry with +/-canary lines',
    JSON.stringify({ listIsArray: res.listIsArray, count: res.count,
      kind: e.kind, type: e.type, changed: changed,
      diffHead: diffText.slice(0, 120) }));
}

async function testNoNewElementsAndThemeRepaint(page) {
  // 5 — interaction (flipping a switch, showing a warning) adds NO new
  // DOM elements (the warning row is pre-rendered, only its class
  // toggles), and a live data-ve-theme flip re-paints the switch track
  // off the --vc-* tokens (different accent colour light vs dark).
  const s = await setup(page);
  if (!s.ok) {
    record('editor_toggles_no_new_dom_theme', 'FAIL',
      'interaction adds no new DOM + theme flip re-paints', s.error);
    return;
  }
  const before = await page.evaluate(
    () => document.querySelectorAll('*').length);
  // A sequence of interactions that SHOWS a warning (the case most likely
  // to inject geometry if done wrong): autoRoll on (warns), newUi on,
  // betaApi on (warns). None must add a node.
  await flip(page, 'autoRoll');
  await flip(page, 'newUi');
  await flip(page, 'betaApi');
  await flip(page, 'newUi');     // turn newUi back off → betaApi now warns
  const afterInteract = await page.evaluate(() => ({
    count: document.querySelectorAll('*').length,
    autoRollWarn: !!document.querySelector(
      '.ve-et-warn[data-ve-et-warn="autoRoll"].ve-et-warn--show'),
    betaWarn: !!document.querySelector(
      '.ve-et-warn[data-ve-et-warn="betaApi"].ve-et-warn--show')
  }));
  // Now flip the theme and read the switch track colour in both themes.
  const lightAccent = await page.evaluate(() => {
    const sw = document.querySelector(
      '.ve-et-switch[data-ve-et-flag="canary"]');
    document.querySelector(
      '.ve-et-switch[data-ve-et-flag="canary"]').setAttribute(
        'aria-checked', 'true');  // force the on-track colour for a stable read
    return getComputedStyle(sw).backgroundColor;
  });
  await page.evaluate(
    () => document.documentElement.setAttribute('data-ve-theme', 'dark'));
  await page.waitForTimeout(80);
  const darkAccent = await page.evaluate(() => {
    const sw = document.querySelector(
      '.ve-et-switch[data-ve-et-flag="canary"]');
    return getComputedStyle(sw).backgroundColor;
  });
  const ok = afterInteract.count === before     // ZERO new DOM elements
    && afterInteract.autoRollWarn === true       // warning shown via class only
    && afterInteract.betaWarn === true
    && !!lightAccent && !!darkAccent
    && lightAccent !== darkAccent;               // theme flip re-painted
  record('editor_toggles_no_new_dom_theme', ok ? 'PASS' : 'FAIL',
    'interaction adds 0 DOM nodes (pre-rendered warnings) + theme flip re-paints track',
    JSON.stringify({ before: before, after: afterInteract.count,
      autoRollWarn: afterInteract.autoRollWarn, betaWarn: afterInteract.betaWarn,
      lightAccent: lightAccent, darkAccent: darkAccent }));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testRendersGroupsAndSwitches,
  testToggleFlipsState,
  testDependencyWarning,
  testDiffExportToSelection,
  testNoNewElementsAndThemeRepaint
];

const page = await browser.getPage("editor-toggles-tests");

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
