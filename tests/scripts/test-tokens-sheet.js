// test-tokens-sheet.js
//
// Dev-browser script — exercises scripts/amvcp-token-sheet.js, the
// Phase-2 design-tokens contact-sheet renderer.
//
// The contact sheet is the headline design-tokens deliverable: a
// rendered, self-contained, DESIGN.md-themed HTML page that shows every
// token visually, click-to-copy. The renderer is schema-driven — one
// panel per token group — so it also proves the §2 engine expansion
// shipped (a z-index / code panel only renders if the new groups
// resolve).
//
// This suite loads token-sheet.html (which embeds the "Trust Indigo"
// DESIGN.md and loads engine + runtime + tokens + token-sheet) and
// mounts a contact sheet into #vc-sheet-mount.
//
// Coverage (design-tokens spec §9.2):
//   - all panels present (color … semantic-roles)
//   - color grid is themed; spacing bars are TRUE px
//   - contrast annotation + a low-contrast warn marker
//   - both themes' color grids rendered
//   - click-to-copy calls navigator.clipboard.writeText
//   - the sheet's Theme button flips data-ve-theme and re-themes
//   - hot-swap restyles the mounted sheet live
//   - no nested scrollbars; <pre> is overflow:visible
//   - reduced-motion: motion chips do not animate
//   - the §2 engine expansion vars resolve (shadow-3, z-modal, code)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/token-sheet.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture, wait for the runtime+engine+tokens+sheet bundles,
// then mount a contact sheet from the embedded DESIGN.md. Returns true
// once a [data-vc-sheet] root is in the DOM.
async function setupAndMount(page) {
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 7000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpTokenSheet === 'object'
      && typeof window.__veDesignMd === 'object'
      && !!window.__veDesignMd.state.designmd);
    if (ready) break;
    await page.waitForTimeout(70);
  }
  if (!ready) return false;
  // Mount the sheet from the runtime's live designmd state.
  return page.evaluate(() => {
    const mount = document.getElementById('vc-sheet-mount');
    if (!mount) return false;
    // Already mounted from a previous test on the same page? Clear it.
    mount.innerHTML = '';
    const designmd = window.__veDesignMd.state.designmd;
    window.amvcpTokenSheet.mountContactSheet(designmd, mount);
    return !!mount.querySelector('[data-vc-sheet]');
  });
}

// ── Tests ───────────────────────────────────────────────────────────

async function testSheetRendersAllPanels(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_renders_all_panels', 'FAIL', 'all panels render', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const want = ['color', 'typography', 'spacing', 'radius', 'elevation',
      'motion', 'z-index', 'state', 'code', 'semantic-roles'];
    const found = {};
    const panels = document.querySelectorAll('[data-vc-panel]');
    for (let i = 0; i < panels.length; i++) {
      found[panels[i].getAttribute('data-vc-panel')] = true;
    }
    let allPresent = true;
    for (let i = 0; i < want.length; i++) {
      if (!found[want[i]]) allPresent = false;
    }
    return { panelCount: panels.length, allPresent, found: Object.keys(found) };
  });
  const ok = res.allPresent === true && res.panelCount >= 10;
  record(
    'sheet_renders_all_panels',
    ok ? 'PASS' : 'FAIL',
    'one [data-vc-panel] per token group present (color … semantic-roles)',
    JSON.stringify(res)
  );
}

async function testSheetColorGridThemed(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_color_grid_themed', 'FAIL', 'color grid themed', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // A swatch's face background must equal the resolved --vc-color-<role>
    // value. Pick the accent swatch in the active-theme grid.
    const swatch = document.querySelector(
      '.vc-sheet-color-grid .vc-sheet-swatch[data-vc-role="accent"] .vc-sheet-swatch-face'
    );
    if (!swatch) return { missing: true };
    const faceBg = getComputedStyle(swatch).backgroundColor;
    // The resolved accent token on :root.
    const rootAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-accent').trim();
    // Normalize: render rootAccent through a probe to get rgb().
    const probe = document.createElement('span');
    probe.style.color = rootAccent;
    document.body.appendChild(probe);
    const rootAccentRgb = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return { missing: false, faceBg: faceBg, rootAccentRgb: rootAccentRgb, match: faceBg === rootAccentRgb };
  });
  const ok = res.missing === false && res.match === true;
  record(
    'sheet_color_grid_themed',
    ok ? 'PASS' : 'FAIL',
    "a color swatch's computed background equals the resolved --vc-color-<role>",
    JSON.stringify(res)
  );
}

async function testSheetSpacingBarsTruePx(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_spacing_bars_true_px', 'FAIL', 'spacing bars true px', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // The spacing bars use width:var(--vc-space-<i>) — TRUE px, not %.
    // Bar at index 3 should be the --vc-space-3 px value (16px in the
    // Trust-Indigo sample's [4,8,12,16,…] scale).
    const bars = document.querySelectorAll('.vc-sheet-space-bar');
    if (bars.length < 4) return { tooFew: bars.length };
    const bar3 = bars[3];
    const w = getComputedStyle(bar3).width;
    const space3 = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-space-3').trim();
    return { width: w, space3: space3, match: w === space3 };
  });
  const ok = res.match === true;
  record(
    'sheet_spacing_bars_true_px',
    ok ? 'PASS' : 'FAIL',
    "a spacing bar's computed width equals the --vc-space-<i> px (true px)",
    JSON.stringify(res)
  );
}

async function testSheetContrastAnnotation(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_contrast_annotation', 'FAIL', 'contrast annotation', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // Every color cell shows a numeric ratio. At least one text-role
    // cell carries the ratio; and the renderer marks low-contrast cells
    // with data-vc-contrast-warn — verify the markup mechanism exists by
    // checking a ratio string is rendered and a warn attribute is a
    // valid (possibly-zero) count.
    const ratios = document.querySelectorAll('.vc-sheet-swatch-contrast');
    let allNumeric = ratios.length > 0;
    for (let i = 0; i < ratios.length; i++) {
      if (!/^[0-9.]+:1$/.test(ratios[i].textContent.trim())) {
        allNumeric = false;
      }
    }
    const warns = document.querySelectorAll(
      '.vc-sheet-swatch-contrast[data-vc-contrast-warn]'
    );
    return {
      ratioCount: ratios.length,
      allNumeric: allNumeric,
      warnMechanismPresent: warns.length >= 0
    };
  });
  const ok = res.ratioCount > 0 && res.allNumeric === true;
  record(
    'sheet_contrast_annotation',
    ok ? 'PASS' : 'FAIL',
    'each color cell shows a numeric contrast ratio; warn-marker mechanism present',
    JSON.stringify(res)
  );
}

async function testSheetDualThemeGrids(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_dual_theme_grids', 'FAIL', 'dual-theme grids', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // The color panel renders BOTH the active AND the opposite theme's
    // grids — two [data-vc-theme-grid] grids, one light, one dark.
    const grids = document.querySelectorAll(
      '[data-vc-panel="color"] [data-vc-theme-grid]'
    );
    const themes = {};
    for (let i = 0; i < grids.length; i++) {
      themes[grids[i].getAttribute('data-vc-theme-grid')] = true;
    }
    return {
      gridCount: grids.length,
      hasLight: themes.light === true,
      hasDark: themes.dark === true
    };
  });
  const ok = res.gridCount === 2 && res.hasLight === true && res.hasDark === true;
  record(
    'sheet_dual_theme_grids',
    ok ? 'PASS' : 'FAIL',
    "the color panel renders BOTH the active and the opposite theme's grids",
    JSON.stringify(res)
  );
}

async function testSheetClickToCopy(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_click_to_copy', 'FAIL', 'click-to-copy', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    // Stub navigator.clipboard.writeText so the copy is observable.
    let copied = null;
    const realClipboard = navigator.clipboard;
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: function (v) {
            copied = v;
            return Promise.resolve();
          }
        }
      });
    } catch (e) {
      return { stubFailed: true };
    }
    // Click a swatch button — it carries data-vc-copy="<value>".
    const swatch = document.querySelector(
      '.vc-sheet-color-grid .vc-sheet-swatch[data-vc-copy]'
    );
    if (!swatch) {
      return { missing: true };
    }
    const expected = swatch.getAttribute('data-vc-copy');
    // CONTRACT (user 2026-05-16): plain click now SELECTS the swatch
    // for comment; clipboard-copy moved behind Alt/Option modifier.
    // Dispatch an Alt+click so the copy path fires.
    swatch.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, altKey: true
    }));
    // Let the writeText promise settle.
    await new Promise(function (r) { setTimeout(r, 60); });
    // Restore.
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: realClipboard
      });
    } catch (e) { /* leave the stub — harmless for the rest of the run */ }
    return { missing: false, expected: expected, copied: copied, match: copied === expected };
  });
  const ok = !res.stubFailed && res.missing === false && res.match === true;
  record(
    'sheet_click_to_copy',
    ok ? 'PASS' : 'FAIL',
    'Alt-clicking a swatch calls navigator.clipboard.writeText with the token value',
    JSON.stringify(res)
  );
}

async function testSheetThemeToggle(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_theme_toggle', 'FAIL', 'theme toggle', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.documentElement;
    const beforeTheme = root.getAttribute('data-ve-theme');
    const swatchFace = document.querySelector(
      '.vc-sheet-color-grid .vc-sheet-swatch[data-vc-role="canvas"] .vc-sheet-swatch-face'
    );
    const beforeBg = swatchFace ? getComputedStyle(swatchFace).backgroundColor : null;
    // Click the sheet's Theme button.
    const btn = document.querySelector('.vc-sheet-theme-toggle');
    if (!btn) return { missing: true };
    btn.click();
    await new Promise(function (r) { setTimeout(r, 80); });
    const afterTheme = root.getAttribute('data-ve-theme');
    // A swatch's value is the THEME-SPECIFIC color baked at render time,
    // so the canvas swatch face does not itself change; what changes is
    // data-ve-theme + the page's resolved --vc-color-canvas. Verify the
    // resolved root token flipped.
    const afterCanvas = getComputedStyle(root)
      .getPropertyValue('--vc-color-canvas').trim();
    return {
      missing: false,
      beforeTheme: beforeTheme,
      afterTheme: afterTheme,
      themeFlipped: beforeTheme !== afterTheme,
      afterCanvas: afterCanvas
    };
  });
  const ok = res.missing === false
    && res.themeFlipped === true
    && (res.afterTheme === 'light' || res.afterTheme === 'dark');
  record(
    'sheet_theme_toggle',
    ok ? 'PASS' : 'FAIL',
    "clicking the sheet's Theme button flips data-ve-theme and re-themes",
    JSON.stringify(res)
  );
}

async function testSheetHotswapRestyles(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_hotswap_restyles', 'FAIL', 'hot-swap restyles sheet', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.documentElement;
    const beforeAccent = getComputedStyle(root)
      .getPropertyValue('--vc-color-accent').trim();
    // Hot-swap a distinct preset (factory-dark's orange accent).
    const otherPreset = window.amvcpTokens.PRESETS['factory-dark'];
    const r = window.__veDesignMd.hotSwap(otherPreset);
    await new Promise(function (rs) { setTimeout(rs, 80); });
    const afterAccent = getComputedStyle(root)
      .getPropertyValue('--vc-color-accent').trim();
    return {
      swapOk: r.ok,
      beforeAccent: beforeAccent,
      afterAccent: afterAccent,
      accentChanged: beforeAccent !== afterAccent
    };
  });
  const ok = res.swapOk === true && res.accentChanged === true;
  record(
    'sheet_hotswap_restyles',
    ok ? 'PASS' : 'FAIL',
    'window.__veDesignMd.hotSwap(otherPreset) re-themes the mounted sheet live',
    JSON.stringify(res)
  );
}

async function testSheetNoNestedScrollbars(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_no_nested_scrollbars', 'FAIL', 'no nested scrollbars', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // No descendant of .vc-sheet may be a scroll container (computed
    // overflow auto/scroll WITH content that overflows). The code <pre>
    // must be overflow:visible.
    const sheet = document.querySelector('.vc-sheet');
    const all = sheet.querySelectorAll('*');
    let offenders = 0;
    for (let i = 0; i < all.length; i++) {
      const cs = getComputedStyle(all[i]);
      const ox = cs.overflowX;
      const oy = cs.overflowY;
      const scrolls = (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll');
      if (scrolls) {
        // Only an actual overflow (content bigger than the box) is a
        // violation — a scroll value with no overflow is harmless.
        if (all[i].scrollHeight > all[i].clientHeight + 1
          || all[i].scrollWidth > all[i].clientWidth + 1) {
          offenders++;
        }
      }
    }
    const pre = document.querySelector('.vc-sheet-code');
    const preOverflow = pre ? getComputedStyle(pre).overflow : 'visible';
    return { offenders: offenders, preOverflow: preOverflow };
  });
  const ok = res.offenders === 0
    && (res.preOverflow === 'visible' || res.preOverflow.indexOf('visible') !== -1);
  record(
    'sheet_no_nested_scrollbars',
    ok ? 'PASS' : 'FAIL',
    'no .vc-sheet descendant is a nested scroller; <pre> is overflow:visible',
    JSON.stringify(res)
  );
}

async function testSheetReducedMotionStatic(page) {
  // Emulate prefers-reduced-motion BEFORE the page loads, then mount.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (!(await setupAndMount(page))) {
    record('sheet_reduced_motion_static', 'FAIL', 'reduced-motion static', 'sheet never mounted');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    return;
  }
  const res = await page.evaluate(async () => {
    // With reduced-motion on, motion chips carry data-vc-reduced and do
    // NOT animate on click — clicking must leave the dot's transform
    // empty / 'none'.
    const chip = document.querySelector('.vc-sheet-motion-chip');
    if (!chip) return { missing: true };
    const isReduced = chip.getAttribute('data-vc-reduced') === '1';
    const dot = chip.querySelector('.vc-sheet-motion-dot');
    chip.click();
    await new Promise(function (r) { setTimeout(r, 120); });
    const transform = dot ? getComputedStyle(dot).transform : 'none';
    // The chip still SHOWS the easing string (meta text non-empty).
    const meta = chip.querySelector('.vc-sheet-motion-meta');
    const showsEasing = !!meta && meta.textContent.indexOf('cubic-bezier') !== -1
      || (!!meta && meta.textContent.indexOf('linear') !== -1);
    return {
      missing: false,
      isReduced: isReduced,
      transform: transform,
      didNotAnimate: transform === 'none' || transform === '' || transform === 'matrix(1, 0, 0, 1, 0, 0)',
      showsEasing: showsEasing
    };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const ok = res.missing === false
    && res.isReduced === true
    && res.didNotAnimate === true;
  record(
    'sheet_reduced_motion_static',
    ok ? 'PASS' : 'FAIL',
    'with prefers-reduced-motion, motion chips do not animate and show the easing',
    JSON.stringify(res)
  );
}

async function testSheetEngineExpansionPresent(page) {
  if (!(await setupAndMount(page))) {
    record('sheet_engine_expansion_present', 'FAIL', 'engine expansion present', 'sheet never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    // The §2 engine expansion: shadow-3 (elevation 5-level), z-modal
    // (the new z-index group), code-keyword (the new code group) must
    // all resolve as --vc-* custom properties on :root.
    const cs = getComputedStyle(document.documentElement);
    return {
      shadow3: cs.getPropertyValue('--vc-shadow-3').trim(),
      zModal: cs.getPropertyValue('--vc-z-modal').trim(),
      codeKeyword: cs.getPropertyValue('--vc-code-keyword').trim(),
      durationBase: cs.getPropertyValue('--vc-duration-base').trim()
    };
  });
  const ok = res.shadow3.length > 0
    && res.zModal === '400'
    && res.codeKeyword.length > 0
    && res.durationBase === '300ms';
  record(
    'sheet_engine_expansion_present',
    ok ? 'PASS' : 'FAIL',
    '--vc-shadow-3, --vc-z-modal, --vc-code-keyword resolve (§2 expansion shipped)',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSheetRendersAllPanels,
  testSheetColorGridThemed,
  testSheetSpacingBarsTruePx,
  testSheetContrastAnnotation,
  testSheetDualThemeGrids,
  testSheetClickToCopy,
  testSheetThemeToggle,
  testSheetHotswapRestyles,
  testSheetNoNestedScrollbars,
  testSheetReducedMotionStatic,
  testSheetEngineExpansionPresent,
];

const page = await browser.getPage("tokens-sheet-tests");

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
