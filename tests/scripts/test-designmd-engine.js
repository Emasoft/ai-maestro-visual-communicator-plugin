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
  // Open the pad via its real toggle button.
  const opened = await page.evaluate(() => {
    const t = document.getElementById('ve-designmd-toggle');
    if (!t) return false;
    t.click();
    const panel = document.getElementById('ve-designmd-panel');
    return !!panel && panel.getAttribute('data-open') === '1';
  });
  if (!opened) {
    record('designmd_engine_controller_pad', 'FAIL', 'controller pad renders from schema', 'pad toggle/panel missing');
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
  await page.evaluate(() => {
    const t = document.getElementById('ve-designmd-toggle');
    if (t) t.click();
  });
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
    // Open the pad and edit the canvas control so the export reflects it.
    const t = document.getElementById('ve-designmd-toggle');
    if (t) t.click();
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

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testEmbeddedThemesRoot,
  testHotSwapChangesVars,
  testHotSwapMalformedFailsLoud,
  testThemeToggleReresolves,
  testControllerPadFromSchema,
  testControllerEditUpdatesVar,
  testExportRoundTrips,
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
