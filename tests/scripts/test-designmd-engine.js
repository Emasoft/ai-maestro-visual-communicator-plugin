// test-designmd-engine.js
//
// Dev-browser script — exercises the DESIGN.md realtime style engine
// AS WIRED INTO THE RUNTIME (Phase 1b, TRDD-352ef46a).
//
// Phase 1a shipped scripts/amvcp-designmd.js (parser + token mapper);
// test-designmd.js covers that module in isolation. Phase 1b wires the
// engine into amvcp-runtime.js: apply a DESIGN.md's tokens on boot,
// hot-swap a replacement live, toggle the theme, and surface every
// token in a floating style-controller pad generated from tokenSchema.
//
// This suite loads designmd-runtime.html — a page that embeds a
// <script type="text/design-md" id="ve-designmd"> block AND loads
// amvcp-designmd.js then amvcp-runtime.js — and drives the engine
// through the window.__veDesignMd test hook plus the real pad UI.
//
// Coverage (Phase 1b spec "Tests" section):
//   (a) the embedded DESIGN.md themes :root  → --vc-color-* present
//   (b) hot-swapping a second DESIGN.md changes the --vc-* values live
//   (c) theme toggle re-resolves light <-> dark
//   (d) the controller pad renders one control per tokenSchema entry
//       (indexed scale tokens expand per element), and editing one
//       control updates the matching --vc-* var
//   (e) Export round-trips via serializeDesignMd
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/designmd-runtime.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the runtime has booted, the engine
// global is installed, and the boot-time DESIGN.md apply has run (the
// __veDesignMd hook is installed at the very end of bootEverything()).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 920 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpDesignMd.parseDesignMd === 'function'
      && typeof window.__veDesignMd === 'object'
      && !!window.__veDesignMd.state.designmd
    );
    if (ready) return true;
    await page.waitForTimeout(70);
  }
  return false;
}

// Read a --vc-* custom property off :root (document.documentElement).
async function readRootVar(page, name) {
  return page.evaluate((n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name);
}

// A complete, schema-valid DESIGN.md with a deliberately distinct
// palette so a hot-swap is observable. `name` and the canvas colors
// are the only fields the tests assert on.
function makeDesignMd(name, lightCanvas, darkCanvas) {
  const colorBlock = (theme, canvas) =>
    '  ' + theme + ':\n'
    + '    canvas: "' + canvas + '"\n'
    + '    surface: "#ffffff"\n'
    + '    surface-raised: "#fafafa"\n'
    + '    surface-sunken: "#eeeeee"\n'
    + '    content: "#111111"\n'
    + '    content-muted: "#555555"\n'
    + '    content-subtle: "#999999"\n'
    + '    border: "#dddddd"\n'
    + '    border-strong: "#bbbbbb"\n'
    + '    accent: "#cc4488"\n'
    + '    on-accent: "#ffffff"\n'
    + '    success: "#2e8b57"\n'
    + '    warning: "#b8860b"\n'
    + '    danger: "#b22222"\n'
    + '    info: "#4682b4"\n';
  return '---\n'
    + 'designmd_version: 1\n'
    + 'meta:\n  name: "' + name + '"\n  default_theme: light\n'
    + 'colors:\n'
    + colorBlock('light', lightCanvas)
    + colorBlock('dark', darkCanvas)
    + 'typography:\n'
    + '  font-heading: "Georgia, serif"\n'
    + '  font-body: "Inter, sans-serif"\n'
    + '  font-mono: "Menlo, monospace"\n'
    + '  scale: [13, 15, 17, 21]\n'
    + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
    + '  line-height: 1.6\n'
    + 'spacing:\n  scale: [4, 8, 12, 16, 24]\n'
    + 'radius:\n  none: 0\n  sm: 3\n  md: 6\n  lg: 10\n  xl: 14\n  full: 9999\n'
    + '---\n\n# ' + name + '\n\nprose body for ' + name + '\n';
}

// ── Tests ───────────────────────────────────────────────────────────

async function testEmbeddedThemesRoot(page) {
  // (a) The embedded <script type="text/design-md"> block is applied on
  // boot: every --vc-color-* role lands on :root, and --vc-color-canvas
  // equals the embedded Fixture-A light value (#eef4ff). Also confirm a
  // non-color token (a typography px scale var) is present, proving the
  // whole token set — not just colors — was applied.
  if (!(await setup(page))) {
    record('designmd_engine_boot_apply', 'FAIL', 'embedded DESIGN.md themes :root', 'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const roles = [
      'canvas', 'surface', 'content', 'border', 'accent',
      'success', 'warning', 'danger', 'info'
    ];
    let allRoles = true;
    for (let i = 0; i < roles.length; i++) {
      if (!cs.getPropertyValue('--vc-color-' + roles[i]).trim()) {
        allRoles = false;
      }
    }
    return {
      themeAttr: root.getAttribute('data-ve-theme'),
      canvas: cs.getPropertyValue('--vc-color-canvas').trim(),
      allRolesPresent: allRoles,
      text0: cs.getPropertyValue('--vc-text-0').trim(),
      radiusMd: cs.getPropertyValue('--vc-radius-md').trim(),
      stateName: window.__veDesignMd.state.designmd
        ? window.__veDesignMd.state.designmd.meta.name : null,
      stateTheme: window.__veDesignMd.state.theme
    };
  });
  const ok = res.themeAttr === 'light'
    && res.canvas === '#eef4ff'
    && res.allRolesPresent === true
    && res.text0 === '12px'
    && res.radiusMd === '8px'
    && res.stateName === 'Fixture A'
    && res.stateTheme === 'light';
  record(
    'designmd_engine_boot_apply',
    ok ? 'PASS' : 'FAIL',
    'embedded DESIGN.md themes :root on boot → --vc-* present, canvas matches',
    JSON.stringify(res)
  );
}

async function testHotSwapChangesVars(page) {
  // (b) Hot-swap a second DESIGN.md through window.__veDesignMd.hotSwap.
  // The --vc-color-canvas var on :root must change live to the new
  // document's light canvas, with no page reload.
  if (!(await setup(page))) {
    record('designmd_engine_hotswap', 'FAIL', 'hot-swap changes --vc-* live', 'runtime/engine never booted');
    return;
  }
  const before = await readRootVar(page, '--vc-color-canvas');
  const swap = await page.evaluate((mdText) => {
    const res = window.__veDesignMd.hotSwap(mdText);
    return {
      ok: res.ok,
      errors: res.errors,
      stateName: window.__veDesignMd.state.designmd
        ? window.__veDesignMd.state.designmd.meta.name : null
    };
  }, makeDesignMd('Fixture B', '#fff0e6', '#1a0f08'));
  const after = await readRootVar(page, '--vc-color-canvas');
  const ok = before === '#eef4ff'
    && swap.ok === true
    && swap.stateName === 'Fixture B'
    && after === '#fff0e6'
    && after !== before;
  record(
    'designmd_engine_hotswap',
    ok ? 'PASS' : 'FAIL',
    'hot-swapping a second DESIGN.md restyles :root live (no reload)',
    JSON.stringify({ before: before, after: after, swap: swap })
  );
}

async function testHotSwapMalformedFailsLoud(page) {
  // (b, fail-fast) A malformed DESIGN.md handed to the hot-swap loader
  // must NOT apply a partial token set: the loader returns ok:false and
  // --vc-color-canvas on :root stays exactly what the prior (valid)
  // load set it to.
  if (!(await setup(page))) {
    record('designmd_engine_hotswap_failfast', 'FAIL', 'malformed hot-swap fails loud', 'runtime/engine never booted');
    return;
  }
  const before = await readRootVar(page, '--vc-color-canvas');
  const res = await page.evaluate(() => {
    // typography.font-mono omitted → a schema-validation failure.
    const bad = '---\n'
      + 'designmd_version: 1\n'
      + 'meta:\n  name: "Broken"\n  default_theme: light\n'
      + 'colors:\n  light:\n    canvas: "#000000"\n'
      + '---\nprose\n';
    const r = window.__veDesignMd.hotSwap(bad);
    return { ok: r.ok, errCount: (r.errors || []).length };
  });
  const after = await readRootVar(page, '--vc-color-canvas');
  const ok = res.ok === false
    && res.errCount > 0
    && after === before
    && after === '#eef4ff';
  record(
    'designmd_engine_hotswap_failfast',
    ok ? 'PASS' : 'FAIL',
    'malformed hot-swap → ok:false, :root tokens unchanged (no partial apply)',
    JSON.stringify({ before: before, after: after, res: res })
  );
}

async function testThemeToggleReresolves(page) {
  // (c) Toggling the theme must re-resolve the SAME designmd for the
  // other theme and re-apply. After boot the page is 'light'
  // (canvas #eef4ff); toggling to 'dark' must swap --vc-color-canvas to
  // the embedded Fixture-A dark canvas (#0b1220) and re-stamp
  // data-ve-theme. Toggling back restores the light value.
  if (!(await setup(page))) {
    record('designmd_engine_theme_toggle', 'FAIL', 'theme toggle re-resolves', 'runtime/engine never booted');
    return;
  }
  const lightCanvas = await readRootVar(page, '--vc-color-canvas');
  const afterDark = await page.evaluate(() => {
    window.__veDesignMd.toggleTheme();
    return {
      canvas: getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-canvas').trim(),
      themeAttr: document.documentElement.getAttribute('data-ve-theme'),
      stateTheme: window.__veDesignMd.state.theme
    };
  });
  const backToLight = await page.evaluate(() => {
    window.__veDesignMd.toggleTheme();
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim();
  });
  const ok = lightCanvas === '#eef4ff'
    && afterDark.canvas === '#0b1220'
    && afterDark.themeAttr === 'dark'
    && afterDark.stateTheme === 'dark'
    && backToLight === '#eef4ff';
  record(
    'designmd_engine_theme_toggle',
    ok ? 'PASS' : 'FAIL',
    'theme toggle re-resolves light <-> dark colors and re-applies',
    JSON.stringify({ light: lightCanvas, dark: afterDark, backLight: backToLight })
  );
}

async function testControllerPadFromSchema(page) {
  // (d) The floating style-controller pad is generated from
  // tokenSchema: opening it renders one control per token (indexed
  // scale tokens expand to one control per array element). The expected
  // control count is DERIVED from tokenSchema + the loaded designmd —
  // never hardcoded — so the test stays correct if the schema grows.
  if (!(await setup(page))) {
    record('designmd_engine_controller_pad', 'FAIL', 'controller pad renders from schema', 'runtime/engine never booted');
    return;
  }
  // Phase 2.5 (TRDD-352ef46a, p25-runtime-theme-pod): the pod is now a
  // self-floating panel visible by default — no toggle button to click.
  // We just verify the panel exists and has its body rendered.
  const opened = await page.evaluate(() => {
    const panel = document.getElementById('ve-designmd-panel');
    return !!panel && !!panel.querySelector('.ve-designmd-controls');
  });
  if (!opened) {
    record('designmd_engine_controller_pad', 'FAIL', 'controller pad renders from schema', 'pad panel missing');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    const designmd = window.__veDesignMd.state.designmd;
    const theme = window.__veDesignMd.state.theme;
    // Reproduce the pad's "how many controls should exist" rule purely
    // from the schema + the live designmd token tree.
    const readPath = function (path) {
      if (!path) return undefined;
      let cur = designmd.tokens;
      for (let i = 0; i < path.length; i++) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[path[i]];
      }
      return cur;
    };
    let expected = 0;
    const groupsSeen = {};
    for (let i = 0; i < api.tokenSchema.length; i++) {
      const e = api.tokenSchema[i];
      groupsSeen[e.group] = true;
      if (e.indexed) {
        // The scale array lives under the entry's group.
        const arr = (e.group === 'typography')
          ? readPath(['typography', 'scale'])
          : readPath(['spacing', 'scale']);
        if (Object.prototype.toString.call(arr) === '[object Array]') {
          expected += arr.length;
        }
      } else {
        // Non-indexed: counts only when the token is actually present.
        let path;
        if (e.group === 'color') path = ['colors', theme, e.key];
        else if (e.group === 'typography') path = ['typography', e.key];
        else if (e.group === 'radius') path = ['radius', e.key];
        else if (e.group === 'elevation' || e.group === 'motion') path = [e.group, e.key];
        else path = null;
        if (readPath(path) !== undefined) expected += 1;
      }
    }
    const rows = document.querySelectorAll('#ve-designmd-panel .ve-designmd-control');
    const groupSections = document.querySelectorAll('#ve-designmd-panel .ve-designmd-group');
    // Every rendered group label must be a real schema group.
    let groupsOk = groupSections.length > 0;
    for (let i = 0; i < groupSections.length; i++) {
      const g = groupSections[i].getAttribute('data-ve-designmd-group');
      if (!groupsSeen[g]) groupsOk = false;
    }
    return {
      expected: expected,
      rendered: rows.length,
      groupCount: groupSections.length,
      groupsOk: groupsOk,
      schemaLen: api.tokenSchema.length
    };
  });
  const ok = res.rendered > 0
    && res.rendered === res.expected
    && res.groupCount > 0
    && res.groupsOk === true;
  record(
    'designmd_engine_controller_pad',
    ok ? 'PASS' : 'FAIL',
    'controller pad renders exactly one control per tokenSchema token',
    JSON.stringify(res)
  );
}

async function testControllerEditUpdatesVar(page) {
  // (d, edit) Editing one control in the pad must immediately update the
  // matching --vc-* var on :root AND the in-memory designmd. Drive the
  // canvas color input: set it to a known hex, dispatch 'input', then
  // read --vc-color-canvas back off :root and the designmd state.
  if (!(await setup(page))) {
    record('designmd_engine_controller_edit', 'FAIL', 'editing a control updates the var', 'runtime/engine never booted');
    return;
  }
  // Phase 2.5: pod visible by default — no toggle click needed.
  const res = await page.evaluate(() => {
    // The canvas color control drives --vc-color-canvas.
    const input = document.querySelector(
      '#ve-designmd-panel .ve-designmd-input[data-ve-designmd-cssvar="--vc-color-canvas"]'
    );
    if (!input) return { missing: true };
    input.value = '#123456';
    // 'input' is what the runtime listens for (live keystroke / drag).
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const designmd = window.__veDesignMd.state.designmd;
    return {
      missing: false,
      rootVar: getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-canvas').trim(),
      // The in-memory designmd's light.canvas must have been updated
      // too — that is the single source of truth Export reads.
      designmdValue: designmd.tokens.colors.light.canvas
    };
  });
  const ok = res.missing === false
    && res.rootVar === '#123456'
    && res.designmdValue === '#123456';
  record(
    'designmd_engine_controller_edit',
    ok ? 'PASS' : 'FAIL',
    'editing the canvas control updates --vc-color-canvas + the designmd',
    JSON.stringify(res)
  );
}

async function testExportRoundTrips(page) {
  // (e) Export the current in-memory designmd via the engine's
  // serializeDesignMd, then re-parse the exported text: it must parse
  // ok and yield an equal token tree. To also prove a CONTROLLER EDIT
  // survives the export, change the canvas through the pad first, then
  // export, re-parse, and confirm the edited value is in the export.
  if (!(await setup(page))) {
    record('designmd_engine_export_roundtrip', 'FAIL', 'export round-trips', 'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    // Phase 2.5: pod visible by default — edit the canvas control so
    // the export reflects it.
    const input = document.querySelector(
      '#ve-designmd-panel .ve-designmd-input[data-ve-designmd-cssvar="--vc-color-canvas"]'
    );
    if (input) {
      input.value = '#abcdef';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Export → DESIGN.md text.
    const exported = window.__veDesignMd.exportText();
    if (typeof exported !== 'string' || exported.length === 0) {
      return { exportFailed: true };
    }
    // Re-parse the exported text — must be a valid DESIGN.md.
    const reparsed = api.parseDesignMd(exported);
    if (!reparsed.ok) {
      return { reparseFailed: true, errors: reparsed.errors };
    }
    // The re-parsed light + dark token maps must equal the live state's
    // maps (full round-trip), and the edited canvas must be carried.
    const live = window.__veDesignMd.state.designmd;
    const liveLight = api.resolveTokens(live, 'light');
    const reLight = api.resolveTokens(reparsed.designmd, 'light');
    const liveDark = api.resolveTokens(live, 'dark');
    const reDark = api.resolveTokens(reparsed.designmd, 'dark');
    let mapsEqual = Object.keys(liveLight).length === Object.keys(reLight).length
      && Object.keys(liveDark).length === Object.keys(reDark).length;
    for (const k in liveLight) {
      if (liveLight[k] !== reLight[k]) mapsEqual = false;
    }
    for (const k in liveDark) {
      if (liveDark[k] !== reDark[k]) mapsEqual = false;
    }
    return {
      exportFailed: false,
      reparseFailed: false,
      reparseOk: reparsed.ok,
      editSurvives: reparsed.designmd.tokens.colors.light.canvas === '#abcdef',
      mapsEqual: mapsEqual,
      proseNonEmpty: !!(reparsed.designmd.prose && reparsed.designmd.prose.length > 0)
    };
  });
  const ok = !res.exportFailed
    && !res.reparseFailed
    && res.reparseOk === true
    && res.editSurvives === true
    && res.mapsEqual === true
    && res.proseNonEmpty === true;
  record(
    'designmd_engine_export_roundtrip',
    ok ? 'PASS' : 'FAIL',
    'Export → serializeDesignMd → re-parse yields an equal token tree',
    JSON.stringify(res)
  );
}

// ── Phase 2.5 (TRDD-352ef46a, p25-runtime-theme-pod) tests ──
//
// The rebuilt pod is floating + draggable, ships a theme-library drawer
// of curated DESIGN.md presets, exposes import/export, and collapses to
// a small drag handle. These tests verify each capability end-to-end
// through the __veDesignMd test hook.

async function testPodPositionPersists(page) {
  // movePod(x,y) updates the pod's left/top inline styles AND writes
  // ve-designmd-pad-pos into localStorage. A subsequent reload restores
  // the pod to that position (within a few px — clamping rounds).
  if (!(await setup(page))) {
    record('designmd_engine_pod_drag', 'FAIL', 'pod position persists across reload', 'runtime/engine never booted');
    return;
  }
  const targetX = 80, targetY = 60;
  const moved = await page.evaluate(([x, y]) => {
    const r = window.__veDesignMd.movePod(x, y);
    const stored = localStorage.getItem('ve-designmd-pad-pos');
    return { rect: r, stored: stored };
  }, [targetX, targetY]);
  if (!moved.rect) {
    record('designmd_engine_pod_drag', 'FAIL', 'pod position persists across reload', 'movePod returned null');
    return;
  }
  // Reload the page. The pod must come back at (within ~2px of) the
  // saved position — clamping may round to the nearest integer pixel.
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Re-wait for runtime boot.
  const rebooted = await page.evaluate(() => new Promise((res) => {
    const deadline = Date.now() + 4000;
    (function poll() {
      if (window.__veDesignMd && window.__veDesignMd.getPodPosition()) return res(true);
      if (Date.now() > deadline) return res(false);
      setTimeout(poll, 60);
    })();
  }));
  if (!rebooted) {
    record('designmd_engine_pod_drag', 'FAIL', 'pod position persists across reload', 'runtime did not re-boot');
    return;
  }
  const after = await page.evaluate(() => window.__veDesignMd.getPodPosition());
  const ok = after
    && Math.abs(after.x - targetX) <= 2
    && Math.abs(after.y - targetY) <= 2;
  record(
    'designmd_engine_pod_drag',
    ok ? 'PASS' : 'FAIL',
    'pod position is persisted to localStorage and restored on reload',
    JSON.stringify({ moved: moved.rect, stored: moved.stored, after: after, targetX: targetX, targetY: targetY })
  );
}

async function testPodLibraryPreset(page) {
  // applyPreset('cyber-neon') hot-swaps the page to the Cyber-Neon
  // preset; the loaded-name strip shows it; the canvas color matches
  // what the preset declares.
  if (!(await setup(page))) {
    record('designmd_engine_pod_library', 'FAIL', 'library preset applies', 'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const before = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim();
    const presets = window.__veDesignMd.presets();
    const cyber = presets.filter(p => p.key === 'cyber-neon')[0];
    if (!cyber) return { missing: true, presetCount: presets.length };
    const r = window.__veDesignMd.applyPreset('cyber-neon');
    const after = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim();
    const loadedNameEl = document.querySelector('.ve-designmd-loaded-name');
    return {
      missing: false,
      presetCount: presets.length,
      applyOk: r && r.ok,
      before: before,
      after: after,
      activeTheme: window.__veDesignMd.state.theme,
      // Cyber-Neon's dark canvas is "#070b14" — the engine resolves
      // that into the var verbatim.
      expectedDarkCanvas: '#070b14',
      loadedNameShown: !!loadedNameEl && loadedNameEl.getAttribute('data-show') === '1',
      loadedNameText: loadedNameEl ? loadedNameEl.textContent : null,
      lsPreset: localStorage.getItem('ve-designmd-pad-preset')
    };
  });
  // Cyber-Neon's default_theme is "dark" but the page already has the
  // theme stamp from boot — so the ACTIVE theme stays whatever it was,
  // and `after` is the canvas value for THAT theme.
  const expected = res.activeTheme === 'dark' ? '#070b14' : '#f1f4f7';
  const ok = res.missing === false
    && res.presetCount >= 5
    && res.applyOk === true
    && res.after === expected
    && res.loadedNameShown === true
    && res.lsPreset === 'cyber-neon';
  record(
    'designmd_engine_pod_library',
    ok ? 'PASS' : 'FAIL',
    'theme-library preset applies via applyPreset() and surfaces in loaded-name',
    JSON.stringify(res)
  );
}

async function testPodCollapseAndExpand(page) {
  // setCollapsed(true) hides the pad body but keeps the head visible
  // (and grabable). setCollapsed(false) shows the body again. The
  // collapsed state persists in localStorage. As of TRDD-9616579c the
  // pod's first-load default is COLLAPSED (the un-set LS branch).
  if (!(await setup(page))) {
    record('designmd_engine_pod_collapse', 'FAIL', 'collapse/expand toggle', 'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const panel = document.getElementById('ve-designmd-panel');
    const body = panel.querySelector('.ve-designmd-body');
    const initial = window.__veDesignMd.isCollapsed();
    window.__veDesignMd.setCollapsed(true);
    const collapsedDisplay = getComputedStyle(body).display;
    const collapsedAttr = panel.getAttribute('data-collapsed');
    const lsCollapsed = localStorage.getItem('ve-designmd-pad-collapsed');
    window.__veDesignMd.setCollapsed(false);
    const expandedDisplay = getComputedStyle(body).display;
    const expandedAttr = panel.getAttribute('data-collapsed');
    return {
      initial: initial,
      collapsedAttr: collapsedAttr,
      collapsedDisplay: collapsedDisplay,
      lsCollapsed: lsCollapsed,
      expandedAttr: expandedAttr,
      expandedDisplay: expandedDisplay
    };
  });
  // initial is `true` when LS has no value yet (the new default), or
  // whatever the last test left in LS. Either way the collapse/expand
  // toggle itself is what's under test — accept both initial states.
  const ok = (res.initial === true || res.initial === false)
    && res.collapsedAttr === '1'
    && res.collapsedDisplay === 'none'
    && res.lsCollapsed === '1'
    && res.expandedAttr === '0'
    && res.expandedDisplay !== 'none';
  record(
    'designmd_engine_pod_collapse',
    ok ? 'PASS' : 'FAIL',
    'pod collapses to a handle (body hidden) and expands back',
    JSON.stringify(res)
  );
}

async function testPodDefaultCollapsedOnFirstLoad(page) {
  // TRDD-9616579c regression #2: when localStorage carries no saved
  // collapsed state, the pod starts COLLAPSED so it doesn't cover
  // page content. The user expands it explicitly when they want to
  // edit tokens.
  if (!(await setup(page))) {
    record('designmd_engine_pod_default_collapsed',
      'FAIL', 'default-collapsed on first load',
      'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    // Clear LS + force the engine to re-init the pod from a clean slate
    // (by removing+reinjecting it). The simplest path is just to clear
    // LS, remove the panel, and call applyDesignMd which re-runs
    // engineInit -> buildDesignMdController(). But that branch is
    // internal; the public surface is to call window.location.reload —
    // which we cannot do mid-page-evaluate. Instead inspect the post-
    // setup behaviour: setCollapsed(false), save its LS value, clear
    // LS, then verify our default branch by reading the *would-be*
    // initial state via the same logic the runtime uses.
    localStorage.removeItem('ve-designmd-pad-collapsed');
    var raw = localStorage.getItem('ve-designmd-pad-collapsed');
    var savedCollapsed = raw === null ? true : (raw === '1');
    return { rawNull: raw === null, savedCollapsed: savedCollapsed };
  });
  // Reload the page to actually exercise the boot-time branch.
  await page.reload({ waitUntil: 'domcontentloaded' });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.__veDesignMd === 'object'
      && typeof window.__veDesignMd.isCollapsed === 'function');
    if (ready) { break; }
    await page.waitForTimeout(70);
  }
  // Clear the LS value the previous test set, then reload again so the
  // initial branch is exercised with no saved value.
  await page.evaluate(() => localStorage.removeItem('ve-designmd-pad-collapsed'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const deadline2 = Date.now() + 6000;
  while (Date.now() < deadline2) {
    const ready = await page.evaluate(() =>
      typeof window.__veDesignMd === 'object'
      && typeof window.__veDesignMd.isCollapsed === 'function');
    if (ready) { break; }
    await page.waitForTimeout(70);
  }
  const initialOnFreshLoad = await page.evaluate(() =>
    window.__veDesignMd.isCollapsed());
  const ok = res.rawNull && res.savedCollapsed === true
    && initialOnFreshLoad === true;
  record('designmd_engine_pod_default_collapsed',
    ok ? 'PASS' : 'FAIL',
    'pod starts collapsed when LS carries no saved state (TRDD-9616579c #2)',
    JSON.stringify({ ...res, initialOnFreshLoad }));
}

async function testPodAutoFadeOnIdle(page) {
  // TRDD-9616579c regression #2: when the pointer is far from the pod
  // it fades to a low opacity so content underneath is readable; on
  // mouseenter it wakes back to full opacity instantly.
  if (!(await setup(page))) {
    record('designmd_engine_pod_auto_fade', 'FAIL',
      'auto-fade when idle', 'runtime/engine never booted');
    return;
  }
  const idleOpacity = await page.evaluate(() => new Promise(res => {
    const panel = document.getElementById('ve-designmd-panel');
    // Move pointer to top-left away from the panel
    const ev = new MouseEvent('mouseleave', { bubbles: true });
    panel.dispatchEvent(ev);
    setTimeout(() => res(getComputedStyle(panel).opacity), 1900);
  }));
  const awakeOpacity = await page.evaluate(() => new Promise(res => {
    const panel = document.getElementById('ve-designmd-panel');
    const ev = new MouseEvent('mouseenter', { bubbles: true });
    panel.dispatchEvent(ev);
    // Wait one frame for the 220ms transition to advance
    setTimeout(() => res(getComputedStyle(panel).opacity), 350);
  }));
  const ok = parseFloat(idleOpacity) < 0.6
    && parseFloat(awakeOpacity) > 0.85;
  record('designmd_engine_pod_auto_fade', ok ? 'PASS' : 'FAIL',
    'pod fades to low opacity when idle; wakes on mouseenter',
    JSON.stringify({ idleOpacity, awakeOpacity }));
}

async function testPodLibraryDrawerToggle(page) {
  // The library drawer is collapsed by default; clicking its head
  // expands it (the preset list becomes visible). The state persists
  // via localStorage.
  if (!(await setup(page))) {
    record('designmd_engine_pod_drawer', 'FAIL', 'library drawer toggles', 'runtime/engine never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const drawer = document.querySelector('.ve-designmd-library');
    const head = drawer.querySelector('.ve-designmd-library-head');
    const list = drawer.querySelector('.ve-designmd-library-list');
    const initialOpen = drawer.getAttribute('data-open');
    const initialDisplay = getComputedStyle(list).display;
    head.click();
    const afterOpen = drawer.getAttribute('data-open');
    const afterDisplay = getComputedStyle(list).display;
    const presetCount = list.querySelectorAll('.ve-designmd-preset').length;
    return {
      initialOpen: initialOpen,
      initialDisplay: initialDisplay,
      afterOpen: afterOpen,
      afterDisplay: afterDisplay,
      presetCount: presetCount,
      lsLibOpen: localStorage.getItem('ve-designmd-pad-library-open')
    };
  });
  const ok = res.initialOpen === '0'
    && res.initialDisplay === 'none'
    && res.afterOpen === '1'
    && res.afterDisplay !== 'none'
    && res.presetCount >= 5
    && res.lsLibOpen === '1';
  record(
    'designmd_engine_pod_drawer',
    ok ? 'PASS' : 'FAIL',
    'theme-library drawer toggles open, persists state, lists ≥5 presets',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testEmbeddedThemesRoot,
  testHotSwapChangesVars,
  testHotSwapMalformedFailsLoud,
  testThemeToggleReresolves,
  testControllerPadFromSchema,
  testControllerEditUpdatesVar,
  testExportRoundTrips,
  // Phase 2.5 (p25-runtime-theme-pod) — floating draggable pod.
  testPodPositionPersists,
  testPodLibraryPreset,
  testPodCollapseAndExpand,
  testPodDefaultCollapsedOnFirstLoad,
  testPodAutoFadeOnIdle,
  testPodLibraryDrawerToggle,
];

const page = await browser.getPage("designmd-engine-tests");

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
