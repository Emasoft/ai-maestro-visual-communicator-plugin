// test-typography.js
//
// Dev-browser script — exercises the amvcp-typography skill module
// (Phase 2 typography). Loads tests/fixtures/typography-specimen.html —
// a self-contained page that loads amvcp-designmd.js (the DESIGN.md
// engine) + amvcp-typography.js (the type-scale calculator + variable-
// font detect) and embeds amvcp-typography.css inline, themed entirely
// off the engine's --vc-* tokens.
//
// The fixture is self-contained — it does NOT load the full runtime —
// so this suite tests the typography module in isolation.
//
// Coverage (typography spec §12.2, 13 cases):
//   T1  tokens resolve            T8  static-font fallback weight
//   T2  fluid clamp responsive    T9  scale-system switch via engine
//   T3  height breakpoint         T10 malformed scale-system fails
//   T4  semantic hierarchy        T11 no `color` set by the layer
//   T5  bare <h1> uses token      T12 no inner scrollbar
//   T6  label uppercase/tracked   T13 theme swap restyles type
//   T7  variable-font detect
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/typography-specimen.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the engine + typography module are
// installed and the fixture's boot script has run (window.__veTypo.ready).
async function setup(page, width, height) {
  await page.setViewportSize({
    width: width || 1280,
    height: height || 920
  });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpTypography === 'object'
      && typeof window.__veTypo === 'object'
      && window.__veTypo.ready === true
    );
    if (ready) return true;
    await page.waitForTimeout(70);
  }
  return false;
}

// Read a --vc-* custom property off :root.
async function readRootVar(page, name) {
  return page.evaluate((n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name);
}

// Read the computed font-size (px, numeric) of an element by id.
async function fontSizePx(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return null;
    return parseFloat(getComputedStyle(el).fontSize);
  }, id);
}

// A complete schema-valid DESIGN.md text whose typography.scale is a
// parameter, so a hot-swap / scale-switch is observable. Uses only the
// 6 required groups + the required typography keys (no optional keys —
// the standalone engine does not allow-list them).
function makeDesignMd(name, scaleArr) {
  const colorBlock = (theme) =>
    '  ' + theme + ':\n'
    + '    canvas: "#ffffff"\n'
    + '    surface: "#f7f7f8"\n'
    + '    surface-raised: "#fefefe"\n'
    + '    surface-sunken: "#eeeef0"\n'
    + '    content: "#16181d"\n'
    + '    content-muted: "#5b606b"\n'
    + '    content-subtle: "#9098a3"\n'
    + '    border: "#e1e3e8"\n'
    + '    border-strong: "#c4c8d0"\n'
    + '    accent: "#3a6df0"\n'
    + '    on-accent: "#ffffff"\n'
    + '    success: "#2e8b57"\n'
    + '    warning: "#b8860b"\n'
    + '    danger: "#b22222"\n'
    + '    info: "#4682b4"\n';
  return '---\n'
    + 'designmd_version: 1\n'
    + 'meta:\n  name: "' + name + '"\n  default_theme: light\n'
    + 'colors:\n'
    + colorBlock('light')
    + colorBlock('dark')
    + 'typography:\n'
    + '  font-heading: "Space Grotesk, Georgia, serif"\n'
    + '  font-body: "IBM Plex Sans, system-ui, sans-serif"\n'
    + '  font-mono: "JetBrains Mono, ui-monospace, monospace"\n'
    + '  scale: [' + scaleArr.join(', ') + ']\n'
    + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
    + '  line-height: 1.55\n'
    + 'spacing:\n  scale: [4, 8, 12, 16, 24, 32, 48, 64]\n'
    + 'radius:\n  none: 0\n  sm: 4\n  md: 8\n  lg: 12\n  xl: 16\n  full: 9999\n'
    + '---\n\n# ' + name + '\n\nprose body\n';
}

// ── Tests ───────────────────────────────────────────────────────────

async function testTokensResolve(page) {
  // T1 — after boot the engine has emitted the typography token group:
  // --vc-text-0..6 are present and non-empty, --vc-text-hero and the
  // semantic weight tokens are present, the font stacks resolve.
  if (!(await setup(page))) {
    record('typography_tokens_resolve', 'FAIL', 'typography tokens resolve on boot', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const get = (n) => cs.getPropertyValue(n).trim();
    let textSteps = true;
    for (let i = 0; i <= 6; i++) {
      if (!get('--vc-text-' + i)) textSteps = false;
    }
    return {
      textSteps: textSteps,
      hero: get('--vc-text-hero'),
      wDisplay: get('--vc-weight-display'),
      wHeading: get('--vc-weight-heading'),
      fontHeading: get('--vc-font-heading'),
      fontBody: get('--vc-font-body')
    };
  });
  const ok = res.textSteps === true
    && res.hero !== ''
    && res.wDisplay !== ''
    && res.wHeading !== ''
    && res.fontHeading !== ''
    && res.fontBody !== '';
  record(
    'typography_tokens_resolve',
    ok ? 'PASS' : 'FAIL',
    'engine emits the typography group → --vc-text-* / weights / fonts present',
    JSON.stringify(res)
  );
}

async function testFluidClampResponsive(page) {
  // T2 — the clamp() actually scales: the hero font-size at a narrow
  // viewport is smaller than at a wide one, and the narrow value still
  // honors the 24px clamp() min floor (data-ve-type-scale is on, hero
  // height breakpoints do not apply at height 920).
  if (!(await setup(page, 480, 920))) {
    record('typography_fluid_clamp_responsive', 'FAIL', 'fluid clamp() scales with viewport', 'fixture never booted');
    return;
  }
  const narrow = await fontSizePx(page, 'spec-hero');
  await page.setViewportSize({ width: 1600, height: 920 });
  await page.waitForTimeout(120);
  const wide = await fontSizePx(page, 'spec-hero');
  const ok = typeof narrow === 'number' && typeof wide === 'number'
    && wide > narrow
    && narrow >= 24;
  record(
    'typography_fluid_clamp_responsive',
    ok ? 'PASS' : 'FAIL',
    'hero font-size grows from a narrow to a wide viewport, min floor honored',
    JSON.stringify({ narrow: narrow, wide: wide })
  );
}

async function testHeightBreakpoint(page) {
  // T3 — the max-height:500px breakpoint shrinks the hero tier: at a
  // 480px-tall viewport the hero font-size is <= 40px (the breakpoint's
  // clamp() max).
  if (!(await setup(page, 1280, 480))) {
    record('typography_height_breakpoint', 'FAIL', 'height breakpoint shrinks hero', 'fixture never booted');
    return;
  }
  const hero = await fontSizePx(page, 'spec-hero');
  const ok = typeof hero === 'number' && hero <= 40;
  record(
    'typography_height_breakpoint',
    ok ? 'PASS' : 'FAIL',
    'compact-height viewport shrinks the hero tier (max-height:500px breakpoint)',
    JSON.stringify({ heroAt480h: hero })
  );
}

async function testSemanticHierarchy(page) {
  // T4 — the contract produces a real, strictly-decreasing hierarchy:
  // hero > H1 > H2 > H3 >= body-lg(lead) > body > body-sm > caption.
  if (!(await setup(page))) {
    record('typography_semantic_hierarchy', 'FAIL', 'semantic hierarchy decreases', 'fixture never booted');
    return;
  }
  const sizes = await page.evaluate(() => {
    const ids = ['spec-hero', 'spec-h1', 'spec-h2', 'spec-h3', 'spec-lead',
                 'spec-body', 'spec-body-sm', 'spec-caption'];
    const out = {};
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      out[ids[i]] = el ? parseFloat(getComputedStyle(el).fontSize) : null;
    }
    return out;
  });
  const ok =
    sizes['spec-hero'] > sizes['spec-h1']
    && sizes['spec-h1'] > sizes['spec-h2']
    && sizes['spec-h2'] > sizes['spec-h3']
    && sizes['spec-h3'] >= sizes['spec-lead']
    && sizes['spec-lead'] > sizes['spec-body']
    && sizes['spec-body'] > sizes['spec-body-sm']
    && sizes['spec-body-sm'] > sizes['spec-caption'];
  record(
    'typography_semantic_hierarchy',
    ok ? 'PASS' : 'FAIL',
    'rendered roles form a strictly decreasing size cascade',
    JSON.stringify(sizes)
  );
}

async function testHeadingUsesToken(page) {
  // T5 — a bare <h1> (no class) has computed font-size equal to the
  // resolved --vc-text-6 value: element-level defaults work without a
  // class. Compared at a viewport wide enough that the clamp() is at
  // its max so both sides equal the --vc-text-6-max anchor.
  if (!(await setup(page, 1900, 920))) {
    record('typography_heading_uses_token', 'FAIL', 'bare <h1> uses --vc-text-6', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const h1 = document.getElementById('spec-h1');
    const cs = getComputedStyle(document.documentElement);
    return {
      h1Size: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
      text6Max: parseFloat(cs.getPropertyValue('--vc-text-6-max'))
    };
  });
  // At a 1900px-wide viewport the --vc-text-6 clamp() is pinned to its
  // max (the --vc-text-6-max anchor), so the bare h1 must equal it.
  const ok = typeof res.h1Size === 'number'
    && typeof res.text6Max === 'number'
    && Math.abs(res.h1Size - res.text6Max) < 0.6;
  record(
    'typography_heading_uses_token',
    ok ? 'PASS' : 'FAIL',
    'bare <h1> computed font-size equals the resolved --vc-text-6 anchor',
    JSON.stringify(res)
  );
}

async function testLabelUppercaseTracked(page) {
  // T6 — .vc-type-label has text-transform:uppercase and a positive
  // letter-spacing (~0.08em of the --vc-text-0 size).
  if (!(await setup(page))) {
    record('typography_label_uppercase_tracked', 'FAIL', 'label uppercase + tracked', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const el = document.getElementById('spec-label');
    if (!el) return { missing: true };
    const cs = getComputedStyle(el);
    return {
      transform: cs.textTransformProperty || cs.textTransform,
      letterSpacing: cs.letterSpacing,
      fontSize: parseFloat(cs.fontSize)
    };
  });
  // letter-spacing computes to px; 0.08em of the caption size is a
  // small positive value. Assert it parses > 0 and transform is upper.
  const ls = parseFloat(res.letterSpacing);
  const ok = !res.missing
    && res.transform === 'uppercase'
    && typeof ls === 'number' && ls > 0;
  record(
    'typography_label_uppercase_tracked',
    ok ? 'PASS' : 'FAIL',
    '.vc-type-label is uppercase with positive letter-spacing',
    JSON.stringify(res)
  );
}

async function testVariableFontDetect(page) {
  // T7 — the typography JS API is exposed; supportsVariableFonts()
  // returns a boolean; <html> carries data-ve-vfont ∈ {yes,no}.
  // Diagnostic-only — passes regardless of the actual value.
  if (!(await setup(page))) {
    record('typography_variable_font_detect', 'FAIL', 'variable-font detect API', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpTypography;
    const sv = api && typeof api.supportsVariableFonts === 'function'
      ? api.supportsVariableFonts() : 'no-api';
    return {
      apiPresent: !!api,
      supportsType: typeof sv,
      supportsVal: sv,
      vfontAttr: document.documentElement.getAttribute('data-ve-vfont')
    };
  });
  const ok = res.apiPresent === true
    && res.supportsType === 'boolean'
    && (res.vfontAttr === 'yes' || res.vfontAttr === 'no');
  record(
    'typography_variable_font_detect',
    ok ? 'PASS' : 'FAIL',
    'supportsVariableFonts() returns a boolean, data-ve-vfont stamped',
    JSON.stringify(res)
  );
}

async function testStaticFontFallback(page) {
  // T8 — the .vc-type-hero element has BOTH a font-weight AND a
  // font-variation-settings in computed style, and the font-weight
  // resolves to the --vc-weight-display value (480). Proves the static
  // fallback weight is set alongside the variation-settings.
  if (!(await setup(page))) {
    record('typography_static_font_fallback', 'FAIL', 'static-font fallback weight', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const el = document.getElementById('spec-hero');
    if (!el) return { missing: true };
    const cs = getComputedStyle(el);
    const rootCs = getComputedStyle(document.documentElement);
    return {
      fontWeight: cs.fontWeight,
      variationSettings: cs.fontVariationSettings,
      weightDisplayToken: rootCs.getPropertyValue('--vc-weight-display').trim()
    };
  });
  // computed font-weight is numeric-string; must equal the display token.
  const ok = !res.missing
    && typeof res.variationSettings === 'string'
    && res.variationSettings !== ''
    && res.variationSettings !== 'normal'
    && String(parseInt(res.fontWeight, 10)) === res.weightDisplayToken;
  record(
    'typography_static_font_fallback',
    ok ? 'PASS' : 'FAIL',
    '.vc-type-hero has font-variation-settings AND a matching static font-weight',
    JSON.stringify(res)
  );
}

async function testScaleSystemSwitch(page) {
  // T9 — switch the scale system from perfect-fourth to golden via the
  // JS calculator → engine round-trip; --vc-text-6 (resolved THROUGH
  // the engine) must increase (golden 1.618 > perfect-fourth 1.333 →
  // a bigger top step). Confirms the calculator → engine → --vc-* path.
  if (!(await setup(page, 1900, 920))) {
    record('typography_scale_system_switch', 'FAIL', 'scale-system switch via engine', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const typo = window.amvcpTypography;
    const t = window.__veTypo;
    const rootCs = () => getComputedStyle(document.documentElement);
    // Baseline --vc-text-6-max (the engine anchor for the top step).
    const before = parseFloat(rootCs().getPropertyValue('--vc-text-6-max'));
    // Recompute the scale for the golden system, mutate the engine's
    // token tree, and re-apply THROUGH the engine.
    const goldenScale = typo.applyScaleSystem('golden', {
      engine: t.engine,
      designmd: t.designmd,
      theme: t.theme
    });
    const after = parseFloat(rootCs().getPropertyValue('--vc-text-6-max'));
    return {
      before: before,
      after: after,
      goldenTopStep: goldenScale[goldenScale.length - 1],
      // The engine's token tree itself must now hold the golden scale.
      treeScaleTop: t.designmd.tokens.typography.scale[
        t.designmd.tokens.typography.scale.length - 1]
    };
  });
  const ok = typeof res.before === 'number'
    && typeof res.after === 'number'
    && res.after > res.before
    && res.treeScaleTop === res.goldenTopStep;
  record(
    'typography_scale_system_switch',
    ok ? 'PASS' : 'FAIL',
    'golden scale-system switch increases --vc-text-6 via the engine round-trip',
    JSON.stringify(res)
  );
}

async function testMalformedScaleSystemFails(page) {
  // T10 — an unknown scale-system name makes the calculator THROW; it
  // does not silently pick a ratio. Fail-fast.
  if (!(await setup(page))) {
    record('typography_malformed_scale_system_fails', 'FAIL', 'malformed scale-system fails loud', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const typo = window.amvcpTypography;
    let threwRatio = false, threwApply = false;
    try { typo.ratioForSystem('bogus-system'); }
    catch (e) { threwRatio = true; }
    try {
      typo.applyScaleSystem('bogus-system', {
        engine: window.__veTypo.engine,
        designmd: window.__veTypo.designmd
      });
    } catch (e) { threwApply = true; }
    // A valid generateScale call must still succeed (proves the throw
    // is specific to the bad name, not a blanket failure).
    let validOk = false;
    try {
      const s = typo.generateScale(16, 1.333, 7, 2);
      validOk = Array.isArray(s) && s.length === 7;
    } catch (e) { validOk = false; }
    return { threwRatio: threwRatio, threwApply: threwApply, validOk: validOk };
  });
  const ok = res.threwRatio === true
    && res.threwApply === true
    && res.validOk === true;
  record(
    'typography_malformed_scale_system_fails',
    ok ? 'PASS' : 'FAIL',
    'unknown scale-system name throws (fail-fast), valid call still works',
    JSON.stringify(res)
  );
}

async function testNoColorSet(page) {
  // T11 — the typography layer sets no `color` property on any
  // .vc-type-* / h1-h6 / p / small rule. Scan every stylesheet rule on
  // the specimen page; flag any typography selector that declares
  // `color`. Guards the light/dark theme invariant.
  if (!(await setup(page))) {
    record('typography_no_color_set', 'FAIL', 'typography layer sets no color', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const TYPO_SEL = /(^|[\s,>])(\.vc-type-|h[1-6]\b|p\b|small\b)/;
    const offenders = [];
    const sheets = document.styleSheets;
    for (let s = 0; s < sheets.length; s++) {
      let rules;
      try { rules = sheets[s].cssRules; }
      catch (e) { continue; }
      if (!rules) continue;
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        const collect = (rr) => {
          if (!rr.selectorText || !rr.style) return;
          if (!TYPO_SEL.test(rr.selectorText)) return;
          // .getPropertyValue('color') is set ONLY if the rule itself
          // declares color (not inherited).
          if (rr.style.getPropertyValue('color')) {
            offenders.push(rr.selectorText + ' {color}');
          }
        };
        if (rule.cssRules) {
          // @media / nested — descend one level.
          for (let n = 0; n < rule.cssRules.length; n++) {
            collect(rule.cssRules[n]);
          }
        } else {
          collect(rule);
        }
      }
    }
    return { offenders: offenders };
  });
  const ok = res.offenders.length === 0;
  record(
    'typography_no_color_set',
    ok ? 'PASS' : 'FAIL',
    'no typography rule (.vc-type-*/h1-6/p/small) declares a `color`',
    JSON.stringify(res)
  );
}

async function testNoInnerScrollbar(page) {
  // T12 — the typography layer introduces no inner scroll container: no
  // .vc-type-* element has computed overflow ∈ {auto,scroll}. The page
  // body MAY have scrollWidth > clientWidth (the page extends — allowed
  // by no-nested-scrollbars.md) but no typography element is itself a
  // scroller.
  if (!(await setup(page))) {
    record('typography_no_inner_scrollbar', 'FAIL', 'no inner scrollbar from typography', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const els = document.querySelectorAll(
      '[class*="vc-type-"], h1, h2, h3, h4, h5, h6, p, small');
    const scrollers = [];
    for (let i = 0; i < els.length; i++) {
      const cs = getComputedStyle(els[i]);
      const ox = cs.overflowX, oy = cs.overflowY;
      if (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll') {
        scrollers.push(els[i].tagName + '.' + els[i].className);
      }
    }
    return { scrollerCount: scrollers.length, scrollers: scrollers.slice(0, 5) };
  });
  const ok = res.scrollerCount === 0;
  record(
    'typography_no_inner_scrollbar',
    ok ? 'PASS' : 'FAIL',
    'no .vc-type-*/heading/p element is an overflow:auto|scroll container',
    JSON.stringify(res)
  );
}

async function testThemeSwapRestyles(page) {
  // T13 — hot-swap a second DESIGN.md whose typography.scale differs;
  // a heading's resolved --vc-text-6 anchor changes live with no
  // reload. Confirms the live-restyle contract holds for typography
  // tokens. Compared at a wide viewport so the clamp() is at its max.
  if (!(await setup(page, 1900, 920))) {
    record('typography_theme_swap_restyles', 'FAIL', 'theme swap restyles type', 'fixture never booted');
    return;
  }
  const before = await readRootVar(page, '--vc-text-6-max');
  const swapped = await page.evaluate((dmdText) => {
    return window.__veTypo.hotSwap(dmdText, 'light');
  }, makeDesignMd('Swapped', [10, 13, 17, 23, 31, 42, 70]));
  await page.waitForTimeout(120);
  const after = await readRootVar(page, '--vc-text-6-max');
  const h1After = await fontSizePx(page, 'spec-h1');
  const ok = swapped && swapped.ok === true
    && before !== ''
    && after !== ''
    && before !== after
    && typeof h1After === 'number'
    && Math.abs(h1After - parseFloat(after)) < 0.6;
  record(
    'typography_theme_swap_restyles',
    ok ? 'PASS' : 'FAIL',
    'hot-swapping a DESIGN.md with a different scale restyles a heading live',
    JSON.stringify({ before: before, after: after, h1After: h1After })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testTokensResolve,
  testFluidClampResponsive,
  testHeightBreakpoint,
  testSemanticHierarchy,
  testHeadingUsesToken,
  testLabelUppercaseTracked,
  testVariableFontDetect,
  testStaticFontFallback,
  testScaleSystemSwitch,
  testMalformedScaleSystemFails,
  testNoColorSet,
  testNoInnerScrollbar,
  testThemeSwapRestyles,
];

const page = await browser.getPage("typography-tests");

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
