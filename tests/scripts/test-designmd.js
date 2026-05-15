// test-designmd.js
//
// Dev-browser script — exercises scripts/amvcp-designmd.js, the Phase-1a
// DESIGN.md realtime style engine (TRDD-352ef46a).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpDesignMd` + Node `module.exports`). This suite loads it
// as a browser global from designmd-engine.html and drives the public
// API entirely through `page.evaluate`:
//
//   parseDesignMd(text)            — frontmatter split + YAML subset
//                                    parse + {ref} resolution + schema
//                                    validation, fail-fast.
//   resolveTokens(designmd, theme) — flat { '--vc-*': value } map for a
//                                    theme; light and dark resolve
//                                    independently.
//   applyTokens(map, rootEl)       — sets the --vc-* custom properties
//                                    on a DOM element.
//   serializeDesignMd(designmd)    — round-trips frontmatter + prose.
//   tokenSchema                    — descriptor array for the Phase-1b
//                                    style-controller pad.
//
// Coverage (spec "Tests" section):
//   - parse a valid sample DESIGN.md
//   - resolve light + dark token maps (independent)
//   - {token.ref} resolution AND circular-ref rejection
//   - malformed-input fail-fast (no frontmatter; missing key)
//   - applyTokens sets the vars on a probe element
//   - tokenSchema shape; serializeDesignMd round-trip
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/designmd-engine.html";
const SAMPLE_URL = "http://127.0.0.1:8767/sample-DESIGN.md";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  // Wait until the IIFE has installed the global.
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(
      () => typeof window.amvcpDesignMd === 'object'
        && typeof window.amvcpDesignMd.parseDesignMd === 'function'
    );
    if (ready) return true;
    await page.waitForTimeout(60);
  }
  return false;
}

// Fetch the on-disk sample DESIGN.md text inside the page (the QuickJS
// runner has no FS, but the page can fetch from the test server).
async function fetchSample(page) {
  return page.evaluate(async (url) => {
    const r = await fetch(url + '?_=' + Date.now());
    if (!r.ok) return null;
    return r.text();
  }, SAMPLE_URL);
}

// ── Tests ───────────────────────────────────────────────────────────

async function testParseValidSample(page) {
  // Parse the shipped sample-DESIGN.md fixture. Expect ok:true, zero
  // errors, version 1, meta.name 'Heritage', and a non-empty prose body
  // (the markdown after the closing --- fence).
  if (!(await setup(page))) {
    record('designmd_parse_valid', 'FAIL', 'parse valid sample', 'global never appeared');
    return;
  }
  const text = await fetchSample(page);
  if (text === null) {
    record('designmd_parse_valid', 'FAIL', 'parse valid sample', 'could not fetch sample-DESIGN.md');
    return;
  }
  const res = await page.evaluate((t) => {
    const r = window.amvcpDesignMd.parseDesignMd(t);
    return {
      ok: r.ok,
      errors: r.errors,
      version: r.designmd ? r.designmd.version : null,
      name: r.designmd ? r.designmd.meta.name : null,
      defaultTheme: r.designmd ? r.designmd.meta.default_theme : null,
      hasProse: !!(r.designmd && r.designmd.prose && r.designmd.prose.length > 0),
      // The prose body is the markdown AFTER the closing fence — it must
      // start with the fixture's H1, proving the splitter cut at the
      // right place (not that prose can never contain a literal "---").
      proseStartsWithHeading: !!(r.designmd && r.designmd.prose
        && r.designmd.prose.indexOf('# Heritage') === 0)
    };
  }, text);
  const ok = res.ok === true
    && Array.isArray(res.errors) && res.errors.length === 0
    && res.version === 1
    && res.name === 'Heritage'
    && res.defaultTheme === 'light'
    && res.hasProse === true
    && res.proseStartsWithHeading === true;
  record(
    'designmd_parse_valid',
    ok ? 'PASS' : 'FAIL',
    'parseDesignMd on valid sample → ok:true, version 1, prose body present',
    JSON.stringify(res)
  );
}

async function testResolveLightAndDark(page) {
  // resolveTokens for 'light' and 'dark' must return independent maps.
  // canvas differs between themes; the typography scale (theme-agnostic)
  // is identical. --vc-text-0 must carry the 'px' unit; --vc-radius-full
  // must be '9999px'.
  if (!(await setup(page))) {
    record('designmd_resolve_themes', 'FAIL', 'resolve light + dark', 'global never appeared');
    return;
  }
  const text = await fetchSample(page);
  const res = await page.evaluate((t) => {
    const api = window.amvcpDesignMd;
    const p = api.parseDesignMd(t);
    if (!p.ok) return { parseErr: p.errors };
    const light = api.resolveTokens(p.designmd, 'light');
    const dark = api.resolveTokens(p.designmd, 'dark');
    return {
      lightCanvas: light['--vc-color-canvas'],
      darkCanvas: dark['--vc-color-canvas'],
      // typography.scale is [12,14,16,20,24,32,48] → index 0 is 12px,
      // index 2 is 16px. Theme-agnostic, so light and dark agree.
      lightText0: light['--vc-text-0'],
      darkText0: dark['--vc-text-0'],
      lightText2: light['--vc-text-2'],
      radiusFull: light['--vc-radius-full'],
      space3: light['--vc-space-3'],
      // motion duration-quick is 200ms; elevation shadow-1 is a present
      // optional token — both exercise the expanded engine groups.
      durationQuick: light['--vc-duration-quick'],
      shadow1: light['--vc-shadow-1'],
      // z-index + code are the new optional groups added by design-tokens.
      zModal: light['--vc-z-modal'],
      codeKeyword: light['--vc-code-keyword'],
      lightKeyCount: Object.keys(light).length,
      darkKeyCount: Object.keys(dark).length
    };
  }, text);
  const ok = !res.parseErr
    && res.lightCanvas === '#faf6ee'
    && res.darkCanvas === '#16130d'
    && res.lightCanvas !== res.darkCanvas
    // Theme-agnostic tokens must match across both maps and carry units.
    && res.lightText0 === '12px'
    && res.darkText0 === '12px'
    && res.lightText2 === '16px'
    && res.radiusFull === '9999px'
    && res.space3 === '16px'
    && res.durationQuick === '200ms'
    && res.shadow1 === '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)'
    // z-index emits a raw integer (no unit); code emits a color string.
    && res.zModal === '400'
    && res.codeKeyword === '#a8791f'
    // Both maps must have the same key set (only values differ).
    && res.lightKeyCount === res.darkKeyCount
    && res.lightKeyCount > 0;
  record(
    'designmd_resolve_themes',
    ok ? 'PASS' : 'FAIL',
    'resolveTokens light vs dark → independent maps, units applied',
    JSON.stringify(res)
  );
}

async function testTokenRefResolution(page) {
  // A {token.ref} scalar must resolve at parse time. Build a DESIGN.md
  // where dark.accent references light.accent — after parse, the dark
  // accent must equal the light accent literal.
  if (!(await setup(page))) {
    record('designmd_ref_resolve', 'FAIL', 'token ref resolution', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    // Minimal valid doc with a {ref}: dark.accent -> {colors.light.accent}.
    const colorBlock = function (theme, accent) {
      return '  ' + theme + ':\n'
        + '    canvas: "#000000"\n'
        + '    surface: "#010101"\n'
        + '    surface-raised: "#020202"\n'
        + '    surface-sunken: "#030303"\n'
        + '    content: "#fefefe"\n'
        + '    content-muted: "#cccccc"\n'
        + '    content-subtle: "#aaaaaa"\n'
        + '    border: "#222222"\n'
        + '    border-strong: "#333333"\n'
        + '    accent: ' + accent + '\n'
        + '    on-accent: "#ffffff"\n'
        + '    success: "#33aa66"\n'
        + '    warning: "#aa8833"\n'
        + '    danger: "#aa3333"\n'
        + '    info: "#3366aa"\n';
    };
    const doc = '---\n'
      + 'designmd_version: 1\n'
      + 'meta:\n  name: "Refs"\n  default_theme: light\n'
      + 'colors:\n'
      + colorBlock('light', '"#b8861f"')
      + colorBlock('dark', '{colors.light.accent}')
      + 'typography:\n'
      + '  font-heading: "Georgia, serif"\n'
      + '  font-body: "Inter, sans-serif"\n'
      + '  font-mono: "Menlo, monospace"\n'
      + '  scale: [12, 14, 16]\n'
      + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
      + '  line-height: 1.5\n'
      + 'spacing:\n  scale: [4, 8, 12]\n'
      + 'radius:\n  none: 0\n  sm: 4\n  md: 8\n  lg: 12\n  xl: 16\n  full: 9999\n'
      + '---\nprose body\n';
    const p = api.parseDesignMd(doc);
    if (!p.ok) return { parseErr: p.errors };
    const dark = api.resolveTokens(p.designmd, 'dark');
    const light = api.resolveTokens(p.designmd, 'light');
    return {
      darkAccent: dark['--vc-color-accent'],
      lightAccent: light['--vc-color-accent']
    };
  });
  const ok = !res.parseErr
    && res.darkAccent === '#b8861f'
    && res.darkAccent === res.lightAccent;
  record(
    'designmd_ref_resolve',
    ok ? 'PASS' : 'FAIL',
    '{colors.light.accent} ref resolves to the literal value at parse time',
    JSON.stringify(res)
  );
}

async function testCircularRefRejected(page) {
  // A {ref} cycle (font-heading -> {…font-body}, font-body -> {…font-heading})
  // must be rejected: ok:false with an error mentioning "circular".
  if (!(await setup(page))) {
    record('designmd_ref_circular', 'FAIL', 'circular ref rejected', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    const colorBlock = function (theme) {
      return '  ' + theme + ':\n'
        + '    canvas: "#000000"\n'
        + '    surface: "#010101"\n'
        + '    surface-raised: "#020202"\n'
        + '    surface-sunken: "#030303"\n'
        + '    content: "#fefefe"\n'
        + '    content-muted: "#cccccc"\n'
        + '    content-subtle: "#aaaaaa"\n'
        + '    border: "#222222"\n'
        + '    border-strong: "#333333"\n'
        + '    accent: "#b8861f"\n'
        + '    on-accent: "#ffffff"\n'
        + '    success: "#33aa66"\n'
        + '    warning: "#aa8833"\n'
        + '    danger: "#aa3333"\n'
        + '    info: "#3366aa"\n';
    };
    // font-heading and font-body point at each other → a cycle.
    const doc = '---\n'
      + 'designmd_version: 1\n'
      + 'meta:\n  name: "Cycle"\n  default_theme: light\n'
      + 'colors:\n'
      + colorBlock('light')
      + colorBlock('dark')
      + 'typography:\n'
      + '  font-heading: "{typography.font-body}"\n'
      + '  font-body: "{typography.font-heading}"\n'
      + '  font-mono: "Menlo, monospace"\n'
      + '  scale: [12, 14, 16]\n'
      + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
      + '  line-height: 1.5\n'
      + 'spacing:\n  scale: [4, 8, 12]\n'
      + 'radius:\n  none: 0\n  sm: 4\n  md: 8\n  lg: 12\n  xl: 16\n  full: 9999\n'
      + '---\nprose\n';
    const p = api.parseDesignMd(doc);
    return {
      ok: p.ok,
      designmdIsNull: p.designmd === null,
      errors: p.errors,
      mentionsCircular: (p.errors || []).join(' ').toLowerCase()
        .indexOf('circular') !== -1
    };
  });
  const ok = res.ok === false
    && res.designmdIsNull === true
    && res.mentionsCircular === true;
  record(
    'designmd_ref_circular',
    ok ? 'PASS' : 'FAIL',
    'mutually-referencing {ref}s → ok:false, error names "circular"',
    JSON.stringify(res)
  );
}

async function testMalformedFailFast(page) {
  // Two fail-fast cases:
  //  (a) text with no frontmatter fence at all,
  //  (b) a doc missing a required key (typography.font-mono).
  // Both must return ok:false, designmd:null, and a non-empty error list.
  if (!(await setup(page))) {
    record('designmd_malformed_failfast', 'FAIL', 'malformed fail-fast', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    // (a) plain markdown, no `---` fence.
    const noFence = api.parseDesignMd('# just a heading\n\nsome prose, no yaml\n');
    // (b) valid frontmatter but typography.font-mono is absent.
    const colorBlock = function (theme) {
      return '  ' + theme + ':\n'
        + '    canvas: "#000000"\n'
        + '    surface: "#010101"\n'
        + '    surface-raised: "#020202"\n'
        + '    surface-sunken: "#030303"\n'
        + '    content: "#fefefe"\n'
        + '    content-muted: "#cccccc"\n'
        + '    content-subtle: "#aaaaaa"\n'
        + '    border: "#222222"\n'
        + '    border-strong: "#333333"\n'
        + '    accent: "#b8861f"\n'
        + '    on-accent: "#ffffff"\n'
        + '    success: "#33aa66"\n'
        + '    warning: "#aa8833"\n'
        + '    danger: "#aa3333"\n'
        + '    info: "#3366aa"\n';
    };
    const missingKey = api.parseDesignMd('---\n'
      + 'designmd_version: 1\n'
      + 'meta:\n  name: "Incomplete"\n  default_theme: light\n'
      + 'colors:\n'
      + colorBlock('light')
      + colorBlock('dark')
      + 'typography:\n'
      + '  font-heading: "Georgia, serif"\n'
      + '  font-body: "Inter, sans-serif"\n'
      // font-mono intentionally omitted.
      + '  scale: [12, 14, 16]\n'
      + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
      + '  line-height: 1.5\n'
      + 'spacing:\n  scale: [4, 8, 12]\n'
      + 'radius:\n  none: 0\n  sm: 4\n  md: 8\n  lg: 12\n  xl: 16\n  full: 9999\n'
      + '---\nprose\n');
    return {
      noFenceOk: noFence.ok,
      noFenceNull: noFence.designmd === null,
      noFenceErrCount: (noFence.errors || []).length,
      missingOk: missingKey.ok,
      missingNull: missingKey.designmd === null,
      missingErrCount: (missingKey.errors || []).length,
      missingMentionsFontMono: (missingKey.errors || []).join(' ')
        .indexOf('font-mono') !== -1
    };
  });
  const ok = res.noFenceOk === false
    && res.noFenceNull === true
    && res.noFenceErrCount > 0
    && res.missingOk === false
    && res.missingNull === true
    && res.missingErrCount > 0
    && res.missingMentionsFontMono === true;
  record(
    'designmd_malformed_failfast',
    ok ? 'PASS' : 'FAIL',
    'no-frontmatter AND missing-required-key → ok:false, designmd:null',
    JSON.stringify(res)
  );
}

async function testApplyTokensOnProbe(page) {
  // applyTokens must set the --vc-* custom properties on a given element.
  // Resolve the sample's light map, apply it to #vc-probe, then read the
  // computed custom properties back off that element.
  if (!(await setup(page))) {
    record('designmd_apply_tokens', 'FAIL', 'applyTokens on probe', 'global never appeared');
    return;
  }
  const text = await fetchSample(page);
  const res = await page.evaluate((t) => {
    const api = window.amvcpDesignMd;
    const p = api.parseDesignMd(t);
    if (!p.ok) return { parseErr: p.errors };
    const map = api.resolveTokens(p.designmd, 'light');
    const probe = document.getElementById('vc-probe');
    const returned = api.applyTokens(map, probe);
    const cs = getComputedStyle(probe);
    return {
      returnedIsProbe: returned === probe,
      canvas: cs.getPropertyValue('--vc-color-canvas').trim(),
      // typography.scale index 0 is 12 → '12px'.
      text0: cs.getPropertyValue('--vc-text-0').trim(),
      fontHeading: cs.getPropertyValue('--vc-font-heading').trim(),
      radiusMd: cs.getPropertyValue('--vc-radius-md').trim()
    };
  }, text);
  const ok = !res.parseErr
    && res.returnedIsProbe === true
    && res.canvas === '#faf6ee'
    && res.text0 === '12px'
    && res.fontHeading.indexOf('Playfair Display') !== -1
    && res.radiusMd === '8px';
  record(
    'designmd_apply_tokens',
    ok ? 'PASS' : 'FAIL',
    'applyTokens sets --vc-* props on the probe element',
    JSON.stringify(res)
  );
}

async function testTokenSchemaShape(page) {
  // tokenSchema must be a non-empty descriptor array; every entry needs
  // key/group/type/cssVar/control fields. It must include color tokens
  // (themed:true) and the two indexed scale tokens (indexed:true).
  if (!(await setup(page))) {
    record('designmd_token_schema', 'FAIL', 'tokenSchema shape', 'global never appeared');
    return;
  }
  const res = await page.evaluate(() => {
    const schema = window.amvcpDesignMd.tokenSchema;
    if (!Array.isArray(schema) || schema.length === 0) {
      return { bad: 'not a non-empty array' };
    }
    let allFields = true;
    const groups = {};
    let themedCount = 0;
    let indexedCount = 0;
    for (let i = 0; i < schema.length; i++) {
      const e = schema[i];
      if (typeof e.key !== 'string' || typeof e.group !== 'string'
        || typeof e.type !== 'string' || typeof e.cssVar !== 'string'
        || typeof e.control !== 'string') {
        allFields = false;
      }
      groups[e.group] = true;
      if (e.themed === true) themedCount++;
      if (e.indexed === true) indexedCount++;
    }
    return {
      length: schema.length,
      allFields: allFields,
      hasColorGroup: groups.color === true,
      hasTypographyGroup: groups.typography === true,
      themedCount: themedCount,
      indexedCount: indexedCount
    };
  });
  const ok = !res.bad
    && res.length > 0
    && res.allFields === true
    && res.hasColorGroup === true
    && res.hasTypographyGroup === true
    && res.themedCount > 0
    // exactly two indexed tokens: typography.scale + spacing.scale.
    && res.indexedCount === 2;
  record(
    'designmd_token_schema',
    ok ? 'PASS' : 'FAIL',
    'tokenSchema is a complete descriptor array (themed + indexed tokens)',
    JSON.stringify(res)
  );
}

async function testSerializeRoundTrip(page) {
  // serializeDesignMd(parse(sample)) must itself re-parse to an equal
  // token tree (parse → serialize → parse is stable). Compare a handful
  // of representative tokens across the two parses, and confirm the
  // prose body survives.
  if (!(await setup(page))) {
    record('designmd_serialize_roundtrip', 'FAIL', 'serialize round-trip', 'global never appeared');
    return;
  }
  const text = await fetchSample(page);
  const res = await page.evaluate((t) => {
    const api = window.amvcpDesignMd;
    const p1 = api.parseDesignMd(t);
    if (!p1.ok) return { parseErr1: p1.errors };
    const serialized = api.serializeDesignMd(p1.designmd);
    const p2 = api.parseDesignMd(serialized);
    if (!p2.ok) return { parseErr2: p2.errors };
    const a = api.resolveTokens(p1.designmd, 'dark');
    const b = api.resolveTokens(p2.designmd, 'dark');
    // Compare the full dark map key-by-key.
    let mapsEqual = Object.keys(a).length === Object.keys(b).length;
    for (const k in a) {
      if (a[k] !== b[k]) mapsEqual = false;
    }
    return {
      reparseOk: p2.ok,
      mapsEqual: mapsEqual,
      nameSurvives: p2.designmd.meta.name === 'Heritage',
      proseSurvives: p1.designmd.prose === p2.designmd.prose,
      proseNonEmpty: p2.designmd.prose.length > 0
    };
  }, text);
  const ok = !res.parseErr1 && !res.parseErr2
    && res.reparseOk === true
    && res.mapsEqual === true
    && res.nameSurvives === true
    && res.proseSurvives === true
    && res.proseNonEmpty === true;
  record(
    'designmd_serialize_roundtrip',
    ok ? 'PASS' : 'FAIL',
    'parse → serialize → parse yields an equal token tree + prose',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testParseValidSample,
  testResolveLightAndDark,
  testTokenRefResolution,
  testCircularRefRejected,
  testMalformedFailFast,
  testApplyTokensOnProbe,
  testTokenSchemaShape,
  testSerializeRoundTrip,
];

const page = await browser.getPage("designmd-tests");

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
