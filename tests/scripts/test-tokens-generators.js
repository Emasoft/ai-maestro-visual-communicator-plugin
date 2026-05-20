// test-tokens-generators.js
//
// Dev-browser script — exercises scripts/amvcp-tokens.js, the Phase-2
// design-tokens generator + anti-AI-slop gate layer.
//
// amvcp-tokens.js sits on top of the Phase-1 DESIGN.md engine: it ships
// the principled scale generators (phi spacing, OKLCh color ramp,
// neutral scale, MD3 elevation, motion library, z-index), the
// consolidated anti-slop gate, the ~12 named dual-theme presets, and the
// applyPersonalityDelta token-delta restyler.
//
// This suite loads token-sheet.html (which loads amvcp-designmd.js +
// amvcp-runtime.js + amvcp-tokens.js + amvcp-token-sheet.js) and drives
// window.amvcpTokens entirely through `page.evaluate` — every generator
// is pure, so no DOM render is needed.
//
// Coverage (design-tokens spec §9.1):
//   - generatePhiSpacing: 9 strictly-ascending ints, [0]===4
//   - generateOklchRamp: length + monotonic lightness; in-gamut; p3 opt
//   - generateNeutralScale: color-mix strings
//   - generateElevationScale: md3 keys; cinematic 6-layer stack
//   - generateMotionLibrary: 8 durations + 8 easings
//   - generateZIndexScale: 9 keys, ordered, behind===-1
//   - anti-slop gate: AI-purple, near-match, off-black pass, pure-black
//     fail, Inter-primary fail, Inter-fallback pass, gradient HTML
//   - every preset parses + passes the gate + is dual-theme
//   - applyPersonalityDelta round-trip
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/token-sheet.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until window.amvcpTokens is installed.
async function setup(page) {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(
      () => typeof window.amvcpTokens === 'object'
        && typeof window.amvcpTokens.generatePhiSpacing === 'function'
        && typeof window.amvcpDesignMd === 'object'
    );
    if (ready) return true;
    await page.waitForTimeout(60);
  }
  return false;
}

// ── Tests ───────────────────────────────────────────────────────────

async function testPhiSpacingAscending(page) {
  if (!(await setup(page))) {
    record('phi_spacing_ascending', 'FAIL', 'phi spacing ascending', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const arr = window.amvcpTokens.generatePhiSpacing(4, 9);
    let ascending = true;
    let allInts = true;
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'number' || Math.floor(arr[i]) !== arr[i]) {
        allInts = false;
      }
      if (i > 0 && arr[i] <= arr[i - 1]) {
        ascending = false;
      }
    }
    return { length: arr.length, first: arr[0], ascending, allInts, arr };
  });
  const ok = res.length === 9
    && res.first === 4
    && res.ascending === true
    && res.allInts === true;
  record(
    'phi_spacing_ascending',
    ok ? 'PASS' : 'FAIL',
    'generatePhiSpacing(4,9) → 9 strictly-ascending ints, [0]===4',
    JSON.stringify(res)
  );
}

async function testOklchRampLengthOrder(page) {
  if (!(await setup(page))) {
    record('oklch_ramp_length_order', 'FAIL', 'oklch ramp length + order', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const T = window.amvcpTokens;
    const ramp = T.generateOklchRamp('#b8861f', 10);
    // Lightness must be monotonically DECREASING — verify via the WCAG
    // relative luminance of each stop (a proxy for perceptual lightness;
    // a phi-decay ramp is monotone in luminance too).
    let decreasing = true;
    for (let i = 1; i < ramp.length; i++) {
      if (T.relativeLuminance(ramp[i]) >= T.relativeLuminance(ramp[i - 1])) {
        decreasing = false;
      }
    }
    let allHex = true;
    for (let i = 0; i < ramp.length; i++) {
      if (!/^#[0-9a-f]{6}$/.test(ramp[i])) allHex = false;
    }
    return { length: ramp.length, decreasing, allHex, first: ramp[0], last: ramp[9] };
  });
  const ok = res.length === 10
    && res.decreasing === true
    && res.allHex === true;
  record(
    'oklch_ramp_length_order',
    ok ? 'PASS' : 'FAIL',
    "generateOklchRamp('#b8861f',10) → 10 hexes, lightness monotone decreasing",
    JSON.stringify(res)
  );
}

async function testOklchRampInGamut(page) {
  if (!(await setup(page))) {
    record('oklch_ramp_in_gamut', 'FAIL', 'oklch ramp in gamut', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const ramp = window.amvcpTokens.generateOklchRamp('#04b477', 12);
    // Every returned hex must re-parse to a valid sRGB triple — i.e. all
    // six hex digits are 0-9a-f and decode to 0..255.
    let allValid = true;
    for (let i = 0; i < ramp.length; i++) {
      const h = ramp[i];
      if (!/^#[0-9a-f]{6}$/.test(h)) { allValid = false; continue; }
      const r = parseInt(h.slice(1, 3), 16);
      const g = parseInt(h.slice(3, 5), 16);
      const b = parseInt(h.slice(5, 7), 16);
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
        allValid = false;
      }
    }
    return { length: ramp.length, allValid };
  });
  const ok = res.length === 12 && res.allValid === true;
  record(
    'oklch_ramp_in_gamut',
    ok ? 'PASS' : 'FAIL',
    'every generateOklchRamp hex re-parses to a valid in-gamut sRGB color',
    JSON.stringify(res)
  );
}

async function testOklchRampP3Optional(page) {
  if (!(await setup(page))) {
    record('oklch_ramp_p3_optional', 'FAIL', 'oklch ramp p3 option', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const ramp = window.amvcpTokens.generateOklchRamp('#b8861f', 6, { p3: true });
    const p3 = ramp.p3;
    let allP3 = Array.isArray(p3) && p3.length === 6;
    if (allP3) {
      for (let i = 0; i < p3.length; i++) {
        if (p3[i].indexOf('color(display-p3') !== 0) allP3 = false;
      }
    }
    return { hasP3: Array.isArray(p3), p3Len: p3 ? p3.length : 0, allP3, sample: p3 ? p3[0] : null };
  });
  const ok = res.hasP3 === true && res.p3Len === 6 && res.allP3 === true;
  record(
    'oklch_ramp_p3_optional',
    ok ? 'PASS' : 'FAIL',
    'opts.p3:true returns a parallel color(display-p3 …) array',
    JSON.stringify(res)
  );
}

async function testNeutralScaleColorMix(page) {
  if (!(await setup(page))) {
    record('neutral_scale_colormix', 'FAIL', 'neutral scale color-mix', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const scale = window.amvcpTokens.generateNeutralScale('#1f1a14', [12, 50]);
    let allMix = scale.length === 2;
    for (let i = 0; i < scale.length; i++) {
      if (String(scale[i].value).indexOf('color-mix(in srgb') !== 0) {
        allMix = false;
      }
    }
    return { length: scale.length, allMix, sample: scale[0] ? scale[0].value : null };
  });
  const ok = res.length === 2 && res.allMix === true;
  record(
    'neutral_scale_colormix',
    ok ? 'PASS' : 'FAIL',
    "generateNeutralScale('#1f1a14',[12,50]) → color-mix(in srgb …) strings",
    JSON.stringify(res)
  );
}

async function testElevationMd3Keys(page) {
  if (!(await setup(page))) {
    record('elevation_md3_keys', 'FAIL', 'elevation md3 keys', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const el = window.amvcpTokens.generateElevationScale();
    const expect = ['shadow-0', 'shadow-1', 'shadow-2', 'shadow-3', 'shadow-4', 'shadow-border'];
    let allPresent = true;
    for (let i = 0; i < expect.length; i++) {
      if (typeof el[expect[i]] !== 'string') allPresent = false;
    }
    return { keys: Object.keys(el), allPresent };
  });
  const ok = res.allPresent === true && res.keys.length === 6;
  record(
    'elevation_md3_keys',
    ok ? 'PASS' : 'FAIL',
    'generateElevationScale() → keys shadow-0..4 + shadow-border',
    JSON.stringify(res)
  );
}

async function testElevationCinematicLayers(page) {
  if (!(await setup(page))) {
    record('elevation_cinematic_layers', 'FAIL', 'elevation cinematic layers', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const el = window.amvcpTokens.generateElevationScale({ style: 'cinematic' });
    // shadow-4 in the cinematic style is a 6-layer penumbra stack — six
    // comma-separated shadow layers.
    const layers = String(el['shadow-4']).split(/\),/).length;
    return { shadow4: el['shadow-4'], layers };
  });
  const ok = res.layers === 6;
  record(
    'elevation_cinematic_layers',
    ok ? 'PASS' : 'FAIL',
    "style:'cinematic' → shadow-4 has 6 comma-separated layers",
    JSON.stringify(res)
  );
}

async function testMotionLibraryShape(page) {
  if (!(await setup(page))) {
    record('motion_library_shape', 'FAIL', 'motion library shape', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const m = window.amvcpTokens.generateMotionLibrary();
    const durKeys = Object.keys(m.durations || {});
    const easeKeys = Object.keys(m.easings || {});
    // Durations are raw numbers; easings are cubic-bezier(…) or 'linear'.
    let durNumbers = true;
    for (let i = 0; i < durKeys.length; i++) {
      if (typeof m.durations[durKeys[i]] !== 'number') durNumbers = false;
    }
    let easeCurves = true;
    for (let i = 0; i < easeKeys.length; i++) {
      const v = m.easings[easeKeys[i]];
      if (v !== 'linear' && v.indexOf('cubic-bezier') !== 0) easeCurves = false;
    }
    return { durCount: durKeys.length, easeCount: easeKeys.length, durNumbers, easeCurves };
  });
  const ok = res.durCount === 8
    && res.easeCount === 8
    && res.durNumbers === true
    && res.easeCurves === true;
  record(
    'motion_library_shape',
    ok ? 'PASS' : 'FAIL',
    'generateMotionLibrary() → 8 numeric durations + 8 cubic-bezier/linear easings',
    JSON.stringify(res)
  );
}

async function testZIndexScaleOrder(page) {
  if (!(await setup(page))) {
    record('zindex_scale_order', 'FAIL', 'z-index scale order', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const z = window.amvcpTokens.generateZIndexScale();
    const order = ['behind', 'base', 'raised', 'dropdown', 'sticky', 'overlay', 'modal', 'toast', 'tooltip'];
    let ascending = true;
    for (let i = 1; i < order.length; i++) {
      if (z[order[i]] <= z[order[i - 1]]) ascending = false;
    }
    return { keyCount: Object.keys(z).length, behind: z.behind, tooltip: z.tooltip, ascending };
  });
  const ok = res.keyCount === 9
    && res.behind === -1
    && res.ascending === true;
  record(
    'zindex_scale_order',
    ok ? 'PASS' : 'FAIL',
    'generateZIndexScale() → 9 keys, behind < base < … < tooltip, behind===-1',
    JSON.stringify(res)
  );
}

async function testAntislopFlagsAiPurple(page) {
  if (!(await setup(page))) {
    record('antislop_flags_ai_purple', 'FAIL', 'anti-slop flags AI purple', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const r = window.amvcpTokens.lintTokenSet({ '--vc-color-accent': '#8B5CF6' });
    return {
      ok: r.ok,
      vCount: r.violations.length,
      firstKind: r.violations[0] ? r.violations[0].kind : null
    };
  });
  const ok = res.ok === false
    && res.vCount > 0
    && res.firstKind === 'color';
  record(
    'antislop_flags_ai_purple',
    ok ? 'PASS' : 'FAIL',
    'lintTokenSet on accent #8B5CF6 → ok:false, violation kind "color"',
    JSON.stringify(res)
  );
}

async function testAntislopNearMatch(page) {
  if (!(await setup(page))) {
    record('antislop_near_match', 'FAIL', 'anti-slop near-match', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    // #8c5cf7 is one digit off the banned AI purple #8b5cf6 — the OKLab
    // deltaE near-match must still flag it.
    const r = window.amvcpTokens.lintTokenSet({ '--vc-color-accent': '#8c5cf7' });
    return { ok: r.ok, vCount: r.violations.length };
  });
  const ok = res.ok === false && res.vCount > 0;
  record(
    'antislop_near_match',
    ok ? 'PASS' : 'FAIL',
    'a one-digit-off purple #8c5cf7 is ALSO flagged (OKLab near-match)',
    JSON.stringify(res)
  );
}

async function testAntislopOffblackPasses(page) {
  if (!(await setup(page))) {
    record('antislop_offblack_passes', 'FAIL', 'anti-slop off-black passes', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    // An off-black canvas + off-white content must NOT be flagged — only
    // literal pure #000/#fff are slop.
    const r = window.amvcpTokens.lintTokenSet({
      '--vc-color-canvas': '#faf6ee',
      '--vc-color-content': '#1f1a14'
    });
    return { ok: r.ok, vCount: r.violations.length };
  });
  const ok = res.ok === true && res.vCount === 0;
  record(
    'antislop_offblack_passes',
    ok ? 'PASS' : 'FAIL',
    'canvas #faf6ee + content #1f1a14 → ok:true (off-black/off-white pass)',
    JSON.stringify(res)
  );
}

async function testAntislopPureBlackFails(page) {
  if (!(await setup(page))) {
    record('antislop_pure_black_fails', 'FAIL', 'anti-slop pure black fails', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const r = window.amvcpTokens.lintTokenSet({ '--vc-color-content': '#000000' });
    return {
      ok: r.ok,
      vCount: r.violations.length,
      reason: r.violations[0] ? r.violations[0].reason : ''
    };
  });
  const ok = res.ok === false
    && res.vCount > 0
    && res.reason.toLowerCase().indexOf('pure') !== -1;
  record(
    'antislop_pure_black_fails',
    ok ? 'PASS' : 'FAIL',
    'a token equal to #000000 → flagged exact (pure black)',
    JSON.stringify(res)
  );
}

async function testAntislopInterPrimaryFails(page) {
  if (!(await setup(page))) {
    record('antislop_inter_primary_fails', 'FAIL', 'anti-slop Inter primary fails', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const r = window.amvcpTokens.lintTokenSet({ '--vc-font-body': 'Inter, system-ui' });
    return {
      ok: r.ok,
      vCount: r.violations.length,
      firstKind: r.violations[0] ? r.violations[0].kind : null
    };
  });
  const ok = res.ok === false
    && res.vCount > 0
    && res.firstKind === 'font';
  record(
    'antislop_inter_primary_fails',
    ok ? 'PASS' : 'FAIL',
    '--vc-font-body "Inter, system-ui" → flagged (banned primary family)',
    JSON.stringify(res)
  );
}

async function testAntislopInterFallbackPasses(page) {
  if (!(await setup(page))) {
    record('antislop_inter_fallback_passes', 'FAIL', 'anti-slop Inter fallback passes', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    // Inter as a non-leading fallback is allowed — only the first family
    // of the stack is checked.
    const r = window.amvcpTokens.lintTokenSet({ '--vc-font-body': 'Georgia, Inter, serif' });
    return { ok: r.ok, vCount: r.violations.length };
  });
  const ok = res.ok === true && res.vCount === 0;
  record(
    'antislop_inter_fallback_passes',
    ok ? 'PASS' : 'FAIL',
    '"Georgia, Inter, serif" (Inter not first) → not flagged',
    JSON.stringify(res)
  );
}

async function testAntislopLintHtmlGradient(page) {
  if (!(await setup(page))) {
    record('antislop_lint_html_gradient', 'FAIL', 'lintHtml flags gradient', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const html = '<div style="background:linear-gradient(135deg,#8b5cf6,#3b82f6)">x</div>';
    const r = window.amvcpTokens.lintHtml(html);
    return { ok: r.ok, vCount: r.violations.length };
  });
  const ok = res.ok === false && res.vCount > 0;
  record(
    'antislop_lint_html_gradient',
    ok ? 'PASS' : 'FAIL',
    'lintHtml on markup with a linear-gradient(135deg,…) page bg → flagged',
    JSON.stringify(res)
  );
}

async function testEveryPresetPassesGate(page) {
  if (!(await setup(page))) {
    record('every_preset_passes_gate', 'FAIL', 'every preset passes gate', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const T = window.amvcpTokens;
    const E = window.amvcpDesignMd;
    const keys = Object.keys(T.PRESETS);
    let allOk = keys.length >= 10;
    const fails = [];
    for (let i = 0; i < keys.length; i++) {
      const parsed = E.parseDesignMd(T.PRESETS[keys[i]]);
      if (!parsed.ok) { allOk = false; fails.push(keys[i] + ':parse'); continue; }
      const lint = T.lintTokenSet(parsed.designmd);
      if (!lint.ok) { allOk = false; fails.push(keys[i] + ':gate'); }
    }
    return { presetCount: keys.length, allOk, fails };
  });
  const ok = res.presetCount >= 10 && res.allOk === true;
  record(
    'every_preset_passes_gate',
    ok ? 'PASS' : 'FAIL',
    'every PRESETS entry: parseDesignMd ok AND lintTokenSet ok (ships no slop)',
    JSON.stringify(res)
  );
}

async function testEveryPresetDualTheme(page) {
  if (!(await setup(page))) {
    record('every_preset_dual_theme', 'FAIL', 'every preset dual theme', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const T = window.amvcpTokens;
    const E = window.amvcpDesignMd;
    const keys = Object.keys(T.PRESETS);
    let allDual = true;
    const fails = [];
    for (let i = 0; i < keys.length; i++) {
      const parsed = E.parseDesignMd(T.PRESETS[keys[i]]);
      if (!parsed.ok) { allDual = false; fails.push(keys[i]); continue; }
      const c = parsed.designmd.tokens.colors;
      const lightRoles = c.light ? Object.keys(c.light).length : 0;
      const darkRoles = c.dark ? Object.keys(c.dark).length : 0;
      if (lightRoles !== 15 || darkRoles !== 15) {
        allDual = false;
        fails.push(keys[i] + ':' + lightRoles + '/' + darkRoles);
      }
    }
    return { presetCount: keys.length, allDual, fails };
  });
  const ok = res.allDual === true && res.presetCount >= 10;
  record(
    'every_preset_dual_theme',
    ok ? 'PASS' : 'FAIL',
    'every preset has both colors.light and colors.dark with all 15 roles',
    JSON.stringify(res)
  );
}

async function testPersonalityDeltaRoundtrip(page) {
  if (!(await setup(page))) {
    record('personality_delta_roundtrip', 'FAIL', 'personality delta round-trip', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const T = window.amvcpTokens;
    const E = window.amvcpDesignMd;
    const heritage = T.PRESETS.heritage;
    const before = E.parseDesignMd(heritage);
    const warmed = T.applyPersonalityDelta(heritage, 'warmer');
    const after = E.parseDesignMd(warmed);
    if (!after.ok) {
      return { reparseOk: false, errors: after.errors };
    }
    const beforeAccent = before.designmd.tokens.colors.light.accent;
    const afterAccent = after.designmd.tokens.colors.light.accent;
    return {
      reparseOk: true,
      beforeAccent: beforeAccent,
      afterAccent: afterAccent,
      accentChanged: beforeAccent !== afterAccent
    };
  });
  const ok = res.reparseOk === true && res.accentChanged === true;
  record(
    'personality_delta_roundtrip',
    ok ? 'PASS' : 'FAIL',
    "applyPersonalityDelta(heritage,'warmer') → re-parses ok, accent shifted",
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testPhiSpacingAscending,
  testOklchRampLengthOrder,
  testOklchRampInGamut,
  testOklchRampP3Optional,
  testNeutralScaleColorMix,
  testElevationMd3Keys,
  testElevationCinematicLayers,
  testMotionLibraryShape,
  testZIndexScaleOrder,
  testAntislopFlagsAiPurple,
  testAntislopNearMatch,
  testAntislopOffblackPasses,
  testAntislopPureBlackFails,
  testAntislopInterPrimaryFails,
  testAntislopInterFallbackPasses,
  testAntislopLintHtmlGradient,
  testEveryPresetPassesGate,
  testEveryPresetDualTheme,
  testPersonalityDeltaRoundtrip,
];

const page = await browser.getPage("tokens-generators-tests");

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
