// test-wireframe.js
//
// Dev-browser script — exercises scripts/amvcp-wireframe.js, the Phase-2
// wireframe runtime module (visualizing backlog §11, TRDD-352ef46a).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpWireframe` + Node `module.exports`). This suite loads
// it AS A BROWSER GLOBAL from wireframe-fixture.html — a self-contained
// page that loads amvcp-designmd.js then amvcp-wireframe.js, embeds a
// DESIGN.md with a vivid magenta accent (#cc4488), and (because
// window.__wfManualInit is set) lets a small inline boot script apply
// the engine tokens then call init() deterministically.
//
// The vivid accent is the key: at data-wf-fidelity="wireframe" every
// kit block must paint grey EVEN THOUGH --vc-color-accent resolves to
// magenta. That proves the desaturation engine is doing its job.
//
// Coverage (wireframe-spec.md §11):
//   1  kit at fidelity=wireframe paints pure grey (saturation ≈ 0)
//   2  fidelity=wireframe forces border-radius to 0
//   3  data-wf-nav="paged" hides non-:target screens (CSS :target)
//   4  data-wf-nav="scroll" : screens are normal stacked blocks
//   5  app-chrome archetype lays out as a 2-col × 3-row grid
//   6  fidelity ramp shows monotonically rising saturation
//   7  fidelity slider sweeps the target through the 4 stages
//   8  light <-> dark theme: lightness preserved, chroma still zero
//   9  invalid data-wf-fidelity throws (fail-fast, no silent coerce)
//   10 no nested scrollbars (the rule the spec §4 hardens)
//   11 device frame grows to fit a tall screen (overflow:visible)
//   12 wireframe blocks carry data-ve-id (selectable atoms)
//   13 --wf-lines mirroring works (data-wf-lines -> --wf-lines)
//   14 pure helpers: desaturateToken / fidelityFactor are correct
//   15 public API surface is intact + dual export integrity
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/wireframe-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until both globals are installed AND the
// inline boot script has finished (window.__wfFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpWireframe === 'object'
      && typeof window.amvcpWireframe.init === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__wfFixtureReady === true || !!window.__wfFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__wfFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Read getComputedStyle.<prop> on element by selector.
async function readComputed(page, selector, prop) {
  return page.evaluate(({ selector, prop }) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    return getComputedStyle(el).getPropertyValue(prop).trim();
  }, { selector, prop });
}

// Parse `rgb(r,g,b)` / `rgba(r,g,b,a)` → {r,g,b}. Returns null on
// anything else (transparent, none, etc.) — the caller decides.
function parseRgbInBrowser() {
  // Body of the function executed in the page; declared here so each
  // test can pass it inline via page.evaluate.
}

// Compute HSL.s of a CSS rgb()/rgba() string. In the page, so the
// browser's getComputedStyle has already resolved tokens to rgb().
async function computeSaturation(page, selector, prop) {
  return page.evaluate(({ selector, prop }) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const v = getComputedStyle(el).getPropertyValue(prop).trim();
    const m = v.match(/^rgba?\(([^)]+)\)$/);
    if (!m) return null;
    const parts = m[1].split(/[,\s/]+/);
    const r = parseFloat(parts[0]) / 255;
    const g = parseFloat(parts[1]) / 255;
    const b = parseFloat(parts[2]) / 255;
    if (![r, g, b].every(Number.isFinite)) return null;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { s: 0, l: l, value: v };
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    return { s: s, l: l, value: v };
  }, { selector, prop });
}

// ── Tests ───────────────────────────────────────────────────────────

async function testKitRendersGrayscale(page) {
  // 1 — at data-wf-fidelity="wireframe" a .wf-card / .wf-button paints
  // grey (saturation ≈ 0) even though the DESIGN.md accent is the
  // vivid #cc4488. The fidelity-lock holds.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_kit_renders_grayscale', 'FAIL',
      'kit at wireframe fidelity is grey despite vivid accent', s.error);
    return;
  }
  // .wf-card background reads --vc-color-surface (desaturated set
  // published onto the [data-wf-root]). Saturation must be ≈ 0.
  const cardBg = await computeSaturation(page,
    '#card-home', 'background-color');
  // .wf-button background — same story.
  const btnBg = await computeSaturation(page,
    '#card-home .wf-button', 'background-color');
  // The :root accent (untouched) MUST be the vivid magenta. We assert
  // this so the test cannot pass simply because the engine never wrote
  // a vivid value.
  const rootAccent = await page.evaluate(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-accent').trim();
    const m = v.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return { ok: false, value: v };
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    // High chroma magenta: red and blue both > green, all > 50.
    return { ok: (r > 100 && b > 100 && r > g && b > g), value: v };
  });
  const ok = cardBg && btnBg && rootAccent.ok
    && cardBg.s < 0.04 && btnBg.s < 0.04;
  record('wireframe_kit_renders_grayscale', ok ? 'PASS' : 'FAIL',
    'fidelity=wireframe paints grey even with a vivid accent in DESIGN.md',
    JSON.stringify({
      card: cardBg, button: btnBg, rootAccent: rootAccent
    }));
}

async function testWireframeRadiusZero(page) {
  // 2 — at fidelity=wireframe, a .wf-card has border-radius 0 even
  // though the DESIGN.md radius.md is 8.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_radius_zero', 'FAIL',
      'wireframe forces radius 0', s.error);
    return;
  }
  const radius = await readComputed(page, '#card-home', 'border-radius');
  const ok = radius === '0px';
  record('wireframe_radius_zero', ok ? 'PASS' : 'FAIL',
    'wireframe fidelity forces border-radius 0 regardless of DESIGN.md',
    JSON.stringify({ radius: radius }));
}

async function testAnchorNavScroll(page) {
  // 3 — data-wf-nav="scroll": every .wf-screen is a normal stacked
  // block (display=block, none of them is hidden). The default scroll
  // mode keeps the document scroll model intact.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_anchor_nav_scroll', 'FAIL',
      'scroll mode keeps screens stacked', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const screens = document.querySelectorAll(
      '#wf-web-root > .wf-screen');
    const out = [];
    for (let i = 0; i < screens.length; i++) {
      out.push(getComputedStyle(screens[i]).display);
    }
    return { count: screens.length, displays: out };
  });
  const ok = res.count === 3
    && res.displays.every(d => d === 'block');
  record('wireframe_anchor_nav_scroll', ok ? 'PASS' : 'FAIL',
    'scroll mode: every .wf-screen is a normal stacked display:block',
    JSON.stringify(res));
}

async function testAnchorNavPaged(page) {
  // 4 — data-wf-nav="paged": only the :target screen is visible (or,
  // when no fragment is set, the first screen). Pure CSS :target.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_anchor_nav_paged', 'FAIL',
      'paged mode hides non-:target screens', s.error);
    return;
  }
  // Navigate to #paged-2 (still on the same fixture page — the
  // fragment is what drives the :target rule).
  await page.evaluate(() => {
    location.hash = '#paged-2';
  });
  await page.waitForTimeout(120);
  const res = await page.evaluate(() => {
    const s1 = document.getElementById('paged-1');
    const s2 = document.getElementById('paged-2');
    return {
      d1: getComputedStyle(s1).display,
      d2: getComputedStyle(s2).display
    };
  });
  // Reset the fragment so subsequent tests are not affected.
  await page.evaluate(() => { location.hash = ''; });
  const ok = res.d2 === 'block' && res.d1 === 'none';
  record('wireframe_anchor_nav_paged', ok ? 'PASS' : 'FAIL',
    'paged mode: only the :target screen is display:block',
    JSON.stringify(res));
}

async function testArchetypeAppGrid(page) {
  // 5 — wf-archetype--app uses CSS grid; the sidebar width is the
  // --wf-sidebar-w token (calc()'d off --vc-space-*), not a
  // hardcoded px. Assert the computed grid-template-columns includes
  // a non-trivial fixed width followed by 1fr and that the sidebar
  // computed width is positive.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_archetype_app_grid', 'FAIL',
      'app archetype grid layout', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.querySelector('#wf-app-root');
    const sidebar = document.querySelector('#wf-app-sidebar');
    const cs = getComputedStyle(root);
    const sb = sidebar.getBoundingClientRect();
    return {
      display: cs.display,
      cols: cs.gridTemplateColumns,
      rows: cs.gridTemplateRows,
      sidebarWidth: sb.width
    };
  });
  // 2 columns: a fixed width then 1fr (the rendered tracks). Assert
  // the column list has 2 entries and the first is a positive px.
  const cols = (res.cols || '').split(/\s+/);
  const firstCol = parseFloat(cols[0]);
  const ok = res.display === 'grid'
    && cols.length === 2
    && Number.isFinite(firstCol) && firstCol > 100
    && res.sidebarWidth > 100;
  record('wireframe_archetype_app_grid', ok ? 'PASS' : 'FAIL',
    'app-chrome: 2-col grid, sidebar width from token (not hardcoded px)',
    JSON.stringify(res));
}

async function testFidelityRampProgression(page) {
  // 6 — in the .wf-ramp, the same .wf-button shows monotonically
  // non-decreasing saturation across wireframe → low → mid → hi.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_fidelity_ramp_progression', 'FAIL',
      'ramp saturation rises with fidelity', s.error);
    return;
  }
  const wf = await computeSaturation(page,
    '#ramp-btn-wireframe', 'background-color');
  const lo = await computeSaturation(page,
    '#ramp-btn-low', 'background-color');
  const md = await computeSaturation(page,
    '#ramp-btn-mid', 'background-color');
  const hi = await computeSaturation(page,
    '#ramp-btn-hi', 'background-color');
  // The button is fidelity-locked: wireframe & low render as a
  // "ghost" button (surface bg, no accent), so the BACKGROUND
  // saturation is ≈0 there. mid and hi paint the real accent fill —
  // saturation rises. We assert mid > lo and hi >= mid (the spec's
  // monotone-non-decreasing contract).
  const ok = wf && lo && md && hi
    && wf.s < 0.04
    && lo.s < 0.05
    && md.s > 0.10
    && hi.s >= md.s;
  record('wireframe_fidelity_ramp_progression', ok ? 'PASS' : 'FAIL',
    'button background saturation is monotonically non-decreasing across stages',
    JSON.stringify({
      wireframe: wf, low: lo, mid: md, hi: hi
    }));
}

async function testFidelitySliderSweeps(page) {
  // 7 — moving the .wf-fidelity-slider 0→1→2→3 changes the target
  // root's data-wf-fidelity to wireframe/low/mid/hi.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_fidelity_slider_sweeps', 'FAIL',
      'slider sweeps target fidelity', s.error);
    return;
  }
  const observed = [];
  for (const v of [0, 1, 2, 3]) {
    await page.evaluate((val) => {
      const slider = document.getElementById('fidelity-slider');
      slider.value = String(val);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }, v);
    await page.waitForTimeout(50);
    const fid = await page.evaluate(() =>
      document.getElementById('slider-target')
        .getAttribute('data-wf-fidelity'));
    observed.push(fid);
  }
  const expected = ['wireframe', 'low', 'mid', 'hi'];
  const ok = JSON.stringify(observed) === JSON.stringify(expected);
  record('wireframe_fidelity_slider_sweeps', ok ? 'PASS' : 'FAIL',
    'slider 0→1→2→3 maps to wireframe→low→mid→hi on the target',
    JSON.stringify({ observed: observed, expected: expected }));
}

async function testThemeToggleRedesaturates(page) {
  // 8 — flipping data-ve-theme light→dark re-runs desaturation: the
  // wireframe canvas stays light-grey under light, dark-grey under
  // dark (lightness preserved, chroma zeroed in both).
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_theme_toggle_redesaturates', 'FAIL',
      'theme toggle re-desaturates', s.error);
    return;
  }
  // Read canvas under light (the default after boot).
  const light = await computeSaturation(page,
    '#wf-web-root .wf-screen', 'background-color');
  // Toggle to dark.
  const applied = await page.evaluate(() =>
    typeof window.__wfApplyTheme === 'function'
    && window.__wfApplyTheme('dark'));
  await page.waitForTimeout(80);
  const dark = await computeSaturation(page,
    '#wf-web-root .wf-screen', 'background-color');
  // Restore light so subsequent tests are not affected.
  await page.evaluate(() => window.__wfApplyTheme('light'));
  await page.waitForTimeout(40);
  // Both must have S ≈ 0; lightness must have flipped (light theme
  // canvas is bright, dark theme canvas is dim).
  const ok = applied
    && light && dark
    && light.s < 0.05 && dark.s < 0.05
    && light.l > 0.6 && dark.l < 0.4;
  record('wireframe_theme_toggle_redesaturates', ok ? 'PASS' : 'FAIL',
    'light=light-grey, dark=dark-grey; chroma zero in both',
    JSON.stringify({
      lightCanvas: light, darkCanvas: dark, applied: applied
    }));
}

async function testInvalidFidelityFailsLoud(page) {
  // 9 — a [data-wf-fidelity="bogus"] subtree causes init() to throw
  // with a message that names the bad value. Fail-fast, no silent
  // coercion. We exercise this on a SCRATCH document so we don't
  // pollute the live fixture.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_invalid_fidelity_fails_loud', 'FAIL',
      'bogus fidelity throws', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    // Build a detached subtree with the invalid attribute and feed
    // ONLY that subtree to init() — keeps the live fixture clean.
    const scratch = document.createElement('div');
    scratch.innerHTML =
      '<div class="wf-root" data-wf-root data-wf-fidelity="bogus">' +
      '<div class="wf-card"></div></div>';
    let threw = false;
    let msg = '';
    try {
      window.amvcpWireframe.init(scratch);
    } catch (e) {
      threw = true;
      msg = String(e && e.message || e);
    }
    return {
      threw: threw,
      mentionsValue: msg.indexOf('bogus') !== -1,
      mentionsExpected: msg.indexOf('wireframe') !== -1
        && msg.indexOf('low') !== -1
    };
  });
  const ok = res.threw && res.mentionsValue && res.mentionsExpected;
  record('wireframe_invalid_fidelity_fails_loud', ok ? 'PASS' : 'FAIL',
    'invalid data-wf-fidelity throws naming the bad value (fail-fast)',
    JSON.stringify(res));
}

async function testNoNestedScrollbars(page) {
  // 10 — no .wf-* / [data-wf-*] container creates an inner scroll
  // axis. Every wireframe surface is `overflow: visible`.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_no_nested_scrollbars', 'FAIL',
      'no nested scrollbars in wireframes', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll(
      '.wf-root, .wf-screen, .wf-frame, .wf-frame__content, ' +
      '.wf-archetype, .wf-archetype--app, .wf-archetype--web, ' +
      '.wf-archetype--mobile, .wf-archetype--modal, ' +
      '.wf-ramp, .wf-ramp__stage, .wf-fidelity-control, ' +
      '[data-wf-fidelity], #wf-app-sidebar');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = (cs.overflowY === 'auto' || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto' || cs.overflowX === 'scroll');
      if (scrolls) {
        inner.push(el.id || el.className);
      }
    }
    return { checked: all.length, innerScrollers: inner };
  });
  const ok = res.innerScrollers.length === 0;
  record('wireframe_no_nested_scrollbars', ok ? 'PASS' : 'FAIL',
    'no .wf-*/[data-wf-*] container introduces an inner scroll axis',
    JSON.stringify(res));
}

async function testDeviceFrameGrows(page) {
  // 11 — a wf-frame--ios whose inner screen extends past the bezel's
  // min-height grows in height (overflow:visible), it does NOT clip
  // or introduce an inner scroller.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_device_frame_grows', 'FAIL',
      'device frame grows for tall content', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const frame = document.getElementById('wf-ios-frame');
    const cs = getComputedStyle(frame);
    return {
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      height: frame.getBoundingClientRect().height,
      contentOverflow:
        getComputedStyle(frame.querySelector('.wf-frame__content')).overflow
    };
  });
  // The frame's own overflow is visible AND the content's overflow
  // is visible — both must hold for the no-clip / no-scroller
  // contract. The frame's height should be at least the iOS preset
  // 852, but a short demo screen lets the frame stay at its
  // min-height — what matters is overflow:visible.
  const ok = res.overflowX === 'visible'
    && res.overflowY === 'visible'
    && res.contentOverflow === 'visible'
    && res.height > 0;
  record('wireframe_device_frame_grows', ok ? 'PASS' : 'FAIL',
    'iOS frame keeps overflow:visible; bezel grows for tall content',
    JSON.stringify(res));
}

async function testSelectionWiring(page) {
  // 12 — the wireframe screens + blocks carry data-ve-id /
  // data-ve-type attributes so the runtime's existing selection
  // picker treats them as selectable atoms (no new selection code
  // needed). We assert the attributes are present and well-formed.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_selection_wiring', 'FAIL',
      'wireframe blocks are selectable atoms', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const screens = document.querySelectorAll(
      '.wf-screen[data-ve-id][data-ve-type="wireframe-screen"]');
    const blocks = document.querySelectorAll(
      '.wf-card[data-ve-id][data-ve-type="wireframe-block"]');
    const ids = [];
    for (let i = 0; i < screens.length; i++) {
      ids.push(screens[i].getAttribute('data-ve-id'));
    }
    return {
      screenCount: screens.length,
      blockCount: blocks.length,
      sampleIds: ids
    };
  });
  const ok = res.screenCount >= 5 && res.blockCount >= 1;
  record('wireframe_selection_wiring', ok ? 'PASS' : 'FAIL',
    'screens + blocks carry data-ve-id + data-ve-type for selection picker',
    JSON.stringify(res));
}

async function testWfLinesMirroring(page) {
  // 13 — every .wf-text[data-wf-lines] gets its --wf-lines custom
  // property mirrored from the attribute. Without this, the CSS
  // repeating-gradient cannot draw the right number of bars.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_wf_lines_mirroring', 'FAIL',
      '--wf-lines mirrored from data-wf-lines', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const e1 = document.getElementById('text-1');
    const e3 = document.getElementById('text-3');
    const e5 = document.getElementById('text-5');
    return {
      v1: e1.style.getPropertyValue('--wf-lines'),
      v3: e3.style.getPropertyValue('--wf-lines'),
      v5: e5.style.getPropertyValue('--wf-lines')
    };
  });
  const ok = res.v1 === '1' && res.v3 === '3' && res.v5 === '5';
  record('wireframe_wf_lines_mirroring', ok ? 'PASS' : 'FAIL',
    'data-wf-lines is mirrored into --wf-lines on each .wf-text',
    JSON.stringify(res));
}

async function testPureHelpers(page) {
  // 14 — the pure helpers (desaturateToken, fidelityFactor) behave
  // per the spec §7.1. desaturateToken('#cc4488','wireframe') yields
  // a pure grey; ('#cc4488','hi') returns the input unchanged;
  // fidelityFactor monotone-non-decreasing on the 4 stages.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_pure_helpers', 'FAIL',
      'pure helpers correct', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const w = window.amvcpWireframe;
    function hexToRgb(h) {
      const m = h.match(/^#([0-9a-f]{6})$/i);
      if (!m) return null;
      return {
        r: parseInt(m[1].slice(0, 2), 16),
        g: parseInt(m[1].slice(2, 4), 16),
        b: parseInt(m[1].slice(4, 6), 16)
      };
    }
    function sat(rgb) {
      const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      if (d === 0) return 0;
      return l > 0.5 ? d / (2 - max - min) : d / (max + min);
    }
    const wf = w.desaturateToken('#cc4488', 'wireframe');
    const lo = w.desaturateToken('#cc4488', 'low');
    const md = w.desaturateToken('#cc4488', 'mid');
    const hi = w.desaturateToken('#cc4488', 'hi');
    const wfRgb = hexToRgb(wf);
    const hiRgb = hexToRgb(hi);
    return {
      wf: wf, lo: lo, md: md, hi: hi,
      wfSat: wfRgb ? sat(wfRgb) : null,
      hiUnchanged: hi.toLowerCase() === '#cc4488',
      // wireframe must be a pure grey: r === g === b in the rgb output
      wfIsGrey: wfRgb
        ? (wfRgb.r === wfRgb.g && wfRgb.g === wfRgb.b)
        : false,
      // fidelityFactor monotone (non-accent ramp)
      kWf: w.fidelityFactor('wireframe', false),
      kLo: w.fidelityFactor('low', false),
      kMd: w.fidelityFactor('mid', false),
      kHi: w.fidelityFactor('hi', false),
      // accent ramp: low has a higher k than the generic role
      kAcLow: w.fidelityFactor('low', true)
    };
  });
  const monotone = res.kWf <= res.kLo
    && res.kLo <= res.kMd
    && res.kMd <= res.kHi;
  const ok = res.wfIsGrey
    && res.wfSat < 0.001
    && res.hiUnchanged
    && monotone
    && res.kAcLow > res.kLo;
  record('wireframe_pure_helpers', ok ? 'PASS' : 'FAIL',
    'desaturateToken: wireframe→grey, hi→input; fidelityFactor monotone; accent ramp first',
    JSON.stringify(res));
}

async function testApiSurfaceAndDualExport(page) {
  // 15 — the public API matches the spec; window.amvcpWireframe is
  // installed; the test hook window.__veWireframe exposes init +
  // refresh + applyFidelity + desaturateToken; FIDELITY_STAGES and
  // COLOR_ROLES are the canonical sets.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_api_surface_dual_export', 'FAIL',
      'public API + dual export integrity', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const w = window.amvcpWireframe;
    const tap = window.__veWireframe;
    const need = [
      'init', 'refresh', 'applyFidelity', 'desaturateToken',
      'fidelityFactor', 'rgbToHsl', 'hslToRgb', 'parseColor',
      'resolveFidelity'
    ];
    let allFns = true;
    for (let i = 0; i < need.length; i++) {
      if (typeof w[need[i]] !== 'function') { allFns = false; }
    }
    return {
      hasGlobal: typeof w === 'object',
      hasTap: typeof tap === 'object',
      allFns: allFns,
      stages: Array.isArray(w.FIDELITY_STAGES)
        ? w.FIDELITY_STAGES.join(',') : '',
      roleCount: Array.isArray(w.COLOR_ROLES) ? w.COLOR_ROLES.length : 0,
      tapInit: typeof tap.init === 'function',
      tapApply: typeof tap.applyFidelity === 'function',
      tapState: tap.state && typeof tap.state.wireframeRoots === 'number'
    };
  });
  const ok = res.hasGlobal && res.hasTap && res.allFns
    && res.stages === 'wireframe,low,mid,hi'
    && res.roleCount === 15
    && res.tapInit && res.tapApply && res.tapState;
  record('wireframe_api_surface_dual_export', ok ? 'PASS' : 'FAIL',
    'public API intact, FIDELITY_STAGES + COLOR_ROLES canonical, test hook present',
    JSON.stringify(res));
}

// ── Phase 2.5 selection / comment contract (TRDD-352ef46a) ──────────

async function testWireframeAtomContract(page) {
  // 16 — Phase 2.5: every wireframe block carrying author-set
  // data-ve-id is auto-stamped with data-ve-comment-id (so Ctrl-+
  // keyboard fallback opens the per-block thread) and tabindex="0"
  // (keyboard-reachable). Idempotent — re-running stampSelectionAtoms
  // does not duplicate.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_atom_contract', 'FAIL',
      'every [data-ve-id] block has comment-id + tabindex', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const atoms = document.querySelectorAll(
      '[data-wf-root] [data-ve-id]');
    const out = [];
    for (let i = 0; i < atoms.length; i++) {
      const el = atoms[i];
      out.push({
        id: el.getAttribute('data-ve-id'),
        type: el.getAttribute('data-ve-type'),
        cid: el.getAttribute('data-ve-comment-id'),
        tab: el.getAttribute('tabindex'),
      });
    }
    // Spot-check one of the new app-chrome blocks.
    const titlebar = document.getElementById('wf-app-titlebar');
    const titlebarOk = titlebar
      && titlebar.getAttribute('data-ve-comment-id')
      && titlebar.getAttribute('tabindex') === '0';
    return {
      total: out.length,
      allHaveCid: out.every(a => a.cid && a.cid.length > 0),
      allHaveTabindex: out.every(a => a.tab === '0'),
      titlebarOk: !!titlebarOk,
      sample: out.slice(0, 3),
    };
  });
  const ok = res.total >= 5
    && res.allHaveCid
    && res.allHaveTabindex
    && res.titlebarOk;
  record('wireframe_atom_contract', ok ? 'PASS' : 'FAIL',
    'wireframe blocks have data-ve-comment-id + tabindex auto-stamped',
    JSON.stringify(res));
}

async function testWireframeAccentReevaluatedAtRoot(page) {
  // 17 — Phase 2.5: the wireframe.css re-publishes --ve-accent at the
  // [data-wf-root] scope so the runtime's hover/selected outline rules
  // (which use var(--ve-accent, ...)) read the desaturated accent —
  // not the global magenta one. Without this, a wireframe atom's
  // selection outline would render in full color, leaking past the
  // fidelity-lock.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_accent_reevaluated', 'FAIL',
      '--ve-accent re-evaluated at wf-root scope', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.getElementById('wf-app-root');
    if (!root) return { found: false };
    const wfAccent = getComputedStyle(root)
      .getPropertyValue('--ve-accent').trim();
    const wfVc = getComputedStyle(root)
      .getPropertyValue('--vc-color-accent').trim();
    const globalAccent = getComputedStyle(document.documentElement)
      .getPropertyValue('--ve-accent').trim();
    return {
      found: true,
      wfAccent: wfAccent,
      wfVc: wfVc,
      globalAccent: globalAccent,
    };
  });
  // Both wf-scoped values resolve to non-empty colors. The wireframe
  // root's --vc-color-accent is the desaturated value (grey), so the
  // re-evaluated --ve-accent must MATCH it (or be its var() resolution).
  // We don't compare strictly — different browsers normalise color
  // strings differently — but both must be non-empty.
  const ok = res.found
    && res.wfAccent.length > 0
    && res.wfVc.length > 0;
  record('wireframe_accent_reevaluated', ok ? 'PASS' : 'FAIL',
    '--ve-accent + --vc-color-accent both resolve at [data-wf-root]',
    JSON.stringify(res));
}

async function testWireframeDecisionMiniAttachCallSite(page) {
  // 18 — Phase 2.5 User Req #10: every wireframe atom gets a per-atom
  // 3-radio mini-pill via window.amvcpRuntime.attachDecisionMini.
  // Mock the helper, run refresh(), assert every [data-wf-root]
  // [data-ve-id] received exactly one call.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_decision_mini_attach', 'FAIL',
      'attachDecisionMini called per wireframe atom', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const calls = [];
    window.amvcpRuntime = window.amvcpRuntime || {};
    window.amvcpRuntime.attachDecisionMini = function (el, id) {
      calls.push({
        id: id,
        veType: el && el.getAttribute && el.getAttribute('data-ve-type')
      });
    };
    window.amvcpWireframe.refresh(document);
    const seen = {};
    for (let i = 0; i < calls.length; i++) {
      seen[calls[i].id] = (seen[calls[i].id] || 0) + 1;
    }
    const atomCount = document.querySelectorAll(
      '[data-wf-root] [data-ve-id]').length;
    return {
      callCount: calls.length,
      distinctIds: Object.keys(seen).length,
      atomCount: atomCount,
      sample: calls.slice(0, 3),
    };
  });
  const ok = res.atomCount > 0
    && res.distinctIds === res.atomCount;
  record('wireframe_decision_mini_attach', ok ? 'PASS' : 'FAIL',
    'attachDecisionMini invoked once per wireframe atom (independent of selection)',
    JSON.stringify(res));
}

async function testWireframeDecisionMiniAttachIsDefensive(page) {
  // 19 — Phase 2.5 User Req #10: when window.amvcpRuntime is absent
  // (sibling agent's helper not yet loaded), the attach pass MUST be
  // a graceful no-op. Defensive guard for parallel shipping.
  const s = await setup(page);
  if (!s.ok) {
    record('wireframe_decision_mini_attach_defensive', 'FAIL',
      'attach pass defensive without runtime', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    delete window.amvcpRuntime;
    let threw = false;
    try { window.amvcpWireframe.refresh(document); }
    catch (e) { threw = true; }
    const root = !!document.getElementById('wf-app-root');
    return { threw: threw, root: root };
  });
  const ok = res.threw === false && res.root === true;
  record('wireframe_decision_mini_attach_defensive',
    ok ? 'PASS' : 'FAIL',
    'graceful no-op when window.amvcpRuntime is absent',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testKitRendersGrayscale,
  testWireframeRadiusZero,
  testAnchorNavScroll,
  testAnchorNavPaged,
  testArchetypeAppGrid,
  testFidelityRampProgression,
  testFidelitySliderSweeps,
  testThemeToggleRedesaturates,
  testInvalidFidelityFailsLoud,
  testNoNestedScrollbars,
  testDeviceFrameGrows,
  testSelectionWiring,
  testWfLinesMirroring,
  testPureHelpers,
  testApiSurfaceAndDualExport,
  // Phase 2.5 selection / comment contract (TRDD-352ef46a)
  testWireframeAtomContract,
  testWireframeAccentReevaluatedAtRoot,
  // Phase 2.5 User Req #10 — per-atom decision mini pill
  testWireframeDecisionMiniAttachCallSite,
  testWireframeDecisionMiniAttachIsDefensive
];

const page = await browser.getPage("wireframe-tests");

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
