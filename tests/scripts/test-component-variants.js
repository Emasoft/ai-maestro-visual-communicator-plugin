// test-component-variants.js
//
// Dev-browser script — exercises scripts/amvcp-component-variants.js, the
// component variant-matrix renderer.
//
// THE THING: every size · state · intent of ONE UI component laid out on
// a single sheet for review. Each variant cell is a runtime selection
// ATOM (data-ve-id / data-ve-type) so selection / highlight / triple-
// state feedback / comment come from the runtime (the FIXED Interaction
// Mode), NOT from custom code in the module. Graphic style is fully
// DESIGN.md-driven, light + dark both.
//
// This suite loads component-variants.html (which embeds the "Trust
// Indigo" DESIGN.md + a sample schema and loads engine + runtime +
// component-variants) and mounts a matrix into #vc-cvm-mount.
//
// Coverage (build spec acceptance):
//   - the matrix renders the expected cell count
//   - cells carry data-ve-id / data-ve-type (the atom contract)
//   - the module does NOT inject selection / hover CSS (no foreign
//     interaction — selection feedback is the runtime's job)
//   - light + dark both theme correctly (resolved tokens differ per theme)
//   - Alt-click on a cell's copy button calls navigator.clipboard.writeText
//   - the Theme button flips data-ve-theme and re-themes
//   - axis bands render (one per primary-axis value)
//   - no nested scrollbars
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/component-variants.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture, wait for engine + runtime + renderer, then mount a
// matrix from the embedded schema. Returns true once a [data-vc-cvm]
// root is in the DOM.
async function setupAndMount(page) {
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 7000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpComponentVariants === 'object'
      && typeof window.__veDesignMd === 'object'
      && !!window.__veDesignMd.state.designmd);
    if (ready) break;
    await page.waitForTimeout(70);
  }
  if (!ready) return false;
  return page.evaluate(() => {
    const mount = document.getElementById('vc-cvm-mount');
    if (!mount) return false;
    mount.innerHTML = '';
    const designmd = window.__veDesignMd.state.designmd;
    const schema = JSON.parse(
      document.getElementById('ve-variant-schema').textContent);
    window.amvcpComponentVariants.mountVariantMatrix(schema, designmd, mount);
    return !!mount.querySelector('[data-vc-cvm]');
  });
}

// ── Tests ───────────────────────────────────────────────────────────

async function testMatrixRendersCells(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_renders_cells', 'FAIL', 'matrix renders all cells', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const schema = JSON.parse(
      document.getElementById('ve-variant-schema').textContent);
    const want = schema.render.variants.length;
    const cells = document.querySelectorAll('.vc-cvm-cell');
    return { want: want, got: cells.length };
  });
  const ok = res.got === res.want && res.want > 0;
  record(
    'cvm_renders_cells',
    ok ? 'PASS' : 'FAIL',
    'one .vc-cvm-cell per schema variant',
    JSON.stringify(res)
  );
}

async function testCellsAreAtoms(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_cells_are_atoms', 'FAIL', 'cells are runtime atoms', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const cells = document.querySelectorAll('.vc-cvm-cell');
    let allStamped = cells.length > 0;
    let sampleId = '';
    let sampleType = '';
    for (let i = 0; i < cells.length; i++) {
      const id = cells[i].getAttribute('data-ve-id');
      const type = cells[i].getAttribute('data-ve-type');
      if (!id || type !== 'component-variant'
        || id.indexOf('component-variant:') !== 0) {
        allStamped = false;
      }
      if (i === 0) { sampleId = id; sampleType = type; }
    }
    return { count: cells.length, allStamped, sampleId, sampleType };
  });
  const ok = res.allStamped === true;
  record(
    'cvm_cells_are_atoms',
    ok ? 'PASS' : 'FAIL',
    'every cell carries data-ve-id="component-variant:…" + data-ve-type="component-variant"',
    JSON.stringify(res)
  );
}

async function testNoForeignInteractionCss(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_no_foreign_interaction', 'FAIL', 'no foreign interaction CSS', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // The module's injected stylesheet (#vc-cvm-style) must NOT contain
    // selection / hover / highlight rules — those are the runtime's FIXED
    // Interaction Mode and duplicating them here would be a violation.
    const styleEl = document.getElementById('vc-cvm-style');
    const css = styleEl ? styleEl.textContent : '';
    const forbidden = ['data-ve-selected', ':hover', 've-comment-handle',
      've-decision', 'brightness('];
    const hits = [];
    for (let i = 0; i < forbidden.length; i++) {
      if (css.indexOf(forbidden[i]) !== -1) hits.push(forbidden[i]);
    }
    // The runtime DOES style the cells on selection — prove a cell is
    // seen by the runtime by toggling data-ve-selected and reading that
    // the runtime's injected CSS gives it a non-empty box-shadow/outline.
    const cell = document.querySelector('.vc-cvm-cell');
    let runtimeStyles = false;
    if (cell) {
      cell.setAttribute('data-ve-selected', '1');
      const cs = getComputedStyle(cell);
      runtimeStyles = (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px')
        || (cs.boxShadow && cs.boxShadow !== 'none');
      cell.removeAttribute('data-ve-selected');
    }
    return { styleInjected: !!styleEl, forbiddenHits: hits, runtimeStyles };
  });
  // The module must own NO selection CSS; the runtime must own it.
  const ok = res.styleInjected === true
    && res.forbiddenHits.length === 0
    && res.runtimeStyles === true;
  record(
    'cvm_no_foreign_interaction',
    ok ? 'PASS' : 'FAIL',
    "module CSS has no selection/hover rules; the runtime styles selected cells",
    JSON.stringify(res)
  );
}

async function testAxisBandsRender(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_axis_bands', 'FAIL', 'axis bands render', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const schema = JSON.parse(
      document.getElementById('ve-variant-schema').textContent);
    const primary = Object.keys(schema.axes)[0];           // "state"
    const values = schema.axes[primary];
    const bands = document.querySelectorAll('.vc-cvm-axis-band');
    const seen = {};
    for (let i = 0; i < bands.length; i++) {
      const v = bands[i].querySelector('.vc-cvm-axis-value');
      if (v) seen[v.textContent.trim()] = true;
    }
    // Every primary-axis value that has at least one variant gets a band.
    let allBands = true;
    for (let i = 0; i < values.length; i++) {
      if (!seen[values[i]]) allBands = false;
    }
    return { primary, values, bandCount: bands.length, seen: Object.keys(seen), allBands };
  });
  const ok = res.allBands === true && res.bandCount >= res.values.length;
  record(
    'cvm_axis_bands',
    ok ? 'PASS' : 'FAIL',
    'one axis band per primary-axis value (the matrix grouping)',
    JSON.stringify(res)
  );
}

async function testThemedFromTokens(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_themed_from_tokens', 'FAIL', 'instances themed from --vc-*', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // An accent-stripe instance's ::before stripe color must resolve to
    // the page's --vc-color-accent (proving the treatment is token-driven,
    // not a hardcoded hex).
    const stripeInst = document.querySelector('.vc-cvm-instance[data-vc-stripe]');
    if (!stripeInst) return { missing: true };
    const beforeBg = getComputedStyle(stripeInst, '::before').backgroundColor;
    // Probe the resolved accent token.
    const rootAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-accent').trim();
    const probe = document.createElement('span');
    probe.style.color = rootAccent;
    document.body.appendChild(probe);
    const accentRgb = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    // The default-flat instance background should be the surface token.
    const flat = document.querySelector('.vc-cvm-instance');
    const flatBg = flat ? getComputedStyle(flat).backgroundColor : '';
    return { missing: false, beforeBg, accentRgb,
      stripeMatch: beforeBg === accentRgb, flatBg };
  });
  const ok = res.missing === false && res.stripeMatch === true;
  record(
    'cvm_themed_from_tokens',
    ok ? 'PASS' : 'FAIL',
    "an accent stripe resolves to --vc-color-accent (DESIGN.md-driven, no hardcoded palette)",
    JSON.stringify(res)
  );
}

async function testCopySnippet(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_copy_snippet', 'FAIL', 'copy snippet', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    let copied = null;
    const realClipboard = navigator.clipboard;
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: function (v) { copied = v; return Promise.resolve(); } }
      });
    } catch (e) {
      return { stubFailed: true };
    }
    const btn = document.querySelector('.vc-cvm-copy[data-vc-copy]');
    if (!btn) return { missing: true };
    const expected = btn.getAttribute('data-vc-copy');
    // Plain click SELECTS (runtime); the copy path is behind Alt/Option.
    btn.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, altKey: true
    }));
    await new Promise(function (r) { setTimeout(r, 60); });
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true, value: realClipboard
      });
    } catch (e) { /* leave the stub — harmless for the rest of the run */ }
    return { missing: false, expected, copied, match: copied === expected };
  });
  const ok = !res.stubFailed && res.missing === false && res.match === true;
  record(
    'cvm_copy_snippet',
    ok ? 'PASS' : 'FAIL',
    'Alt-clicking a cell copy button calls navigator.clipboard.writeText with the snippet',
    JSON.stringify(res)
  );
}

async function testThemeToggle(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_theme_toggle', 'FAIL', 'theme toggle', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.documentElement;
    const beforeTheme = root.getAttribute('data-ve-theme');
    const btn = document.querySelector('.vc-cvm-theme-toggle');
    if (!btn) return { missing: true };
    btn.click();
    await new Promise(function (r) { setTimeout(r, 80); });
    const afterTheme = root.getAttribute('data-ve-theme');
    const afterCanvas = getComputedStyle(root)
      .getPropertyValue('--vc-color-canvas').trim();
    return { missing: false, beforeTheme, afterTheme,
      themeFlipped: beforeTheme !== afterTheme, afterCanvas };
  });
  const ok = res.missing === false
    && res.themeFlipped === true
    && (res.afterTheme === 'light' || res.afterTheme === 'dark');
  record(
    'cvm_theme_toggle',
    ok ? 'PASS' : 'FAIL',
    "clicking the Theme button flips data-ve-theme and re-themes",
    JSON.stringify(res)
  );
}

async function testNoNestedScrollbars(page) {
  if (!(await setupAndMount(page))) {
    record('cvm_no_nested_scrollbars', 'FAIL', 'no nested scrollbars', 'matrix never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.querySelector('.vc-cvm');
    const all = root.querySelectorAll('*');
    let offenders = 0;
    for (let i = 0; i < all.length; i++) {
      const cs = getComputedStyle(all[i]);
      const scrolls = (cs.overflowX === 'auto' || cs.overflowX === 'scroll'
        || cs.overflowY === 'auto' || cs.overflowY === 'scroll');
      if (scrolls) {
        if (all[i].scrollHeight > all[i].clientHeight + 1
          || all[i].scrollWidth > all[i].clientWidth + 1) {
          offenders++;
        }
      }
    }
    return { offenders };
  });
  const ok = res.offenders === 0;
  record(
    'cvm_no_nested_scrollbars',
    ok ? 'PASS' : 'FAIL',
    'no .vc-cvm descendant is a nested scroller (page expands)',
    JSON.stringify(res)
  );
}

async function testLightAndDarkBothTheme(page) {
  // The dual-theme correctness contract, asserted in the DOM (the
  // dev-browser sandbox forbids absolute screenshot paths; the rest of
  // the suite proves "both themes" via computed-style assertions too).
  // Force light, capture resolved canvas + an instance background; flip
  // to dark, capture again. Both themes must render cells AND the
  // resolved tokens must actually differ — proving each theme themes
  // correctly, not just one.
  if (!(await setupAndMount(page))) {
    record('cvm_light_dark_both', 'FAIL', 'light + dark both theme', 'matrix never mounted');
    return;
  }
  const cap = function () {
    return page.evaluate(() => {
      const root = document.documentElement;
      const canvas = getComputedStyle(root)
        .getPropertyValue('--vc-color-canvas').trim();
      const inst = document.querySelector('.vc-cvm-instance');
      const bg = inst ? getComputedStyle(inst).backgroundColor : '';
      return {
        theme: root.getAttribute('data-ve-theme'),
        cells: document.querySelectorAll('.vc-cvm-cell').length,
        canvas: canvas,
        instBg: bg
      };
    });
  };
  // Ensure we start in light.
  await page.evaluate(() => {
    const root = document.documentElement;
    if (root.getAttribute('data-ve-theme') === 'dark'
      && window.__veDesignMd && window.__veDesignMd.toggleTheme) {
      window.__veDesignMd.toggleTheme();
    }
  });
  await page.waitForTimeout(60);
  const light = await cap();
  await page.evaluate(() => {
    if (window.__veDesignMd && window.__veDesignMd.toggleTheme) {
      window.__veDesignMd.toggleTheme();
    }
  });
  await page.waitForTimeout(60);
  const dark = await cap();
  const ok = light.cells > 0 && dark.cells > 0
    && light.theme === 'light' && dark.theme === 'dark'
    && light.canvas !== dark.canvas
    && light.instBg !== dark.instBg;
  record(
    'cvm_light_dark_both',
    ok ? 'PASS' : 'FAIL',
    'matrix renders in BOTH light and dark; resolved tokens differ per theme',
    JSON.stringify({ light, dark })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testMatrixRendersCells,
  testCellsAreAtoms,
  testNoForeignInteractionCss,
  testAxisBandsRender,
  testThemedFromTokens,
  testCopySnippet,
  testThemeToggle,
  testNoNestedScrollbars,
  testLightAndDarkBothTheme,
];

const page = await browser.getPage("component-variants-tests");

try {
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
} finally {
  await page.close();
}
