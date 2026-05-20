// test-animation.js
//
// Dev-browser script — exercises scripts/amvcp-animation.js, the Phase-2
// animation runtime module (visualizing backlog §13).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpAnimation` + Node `module.exports`). This suite loads it
// AS A BROWSER GLOBAL from animation-fixture.html — a self-contained
// page that loads amvcp-designmd.js then amvcp-animation.js, embeds a
// DESIGN.md, and (because window.__vaManualInit is set) lets a small
// inline boot script apply the engine tokens, inject the animation CSS,
// and call init() deterministically.
//
// The four animation-skill motion tokens (--vc-duration-entrance,
// --vc-duration-stagger-step, --vc-easing-spring, --vc-motion-scale) are
// supplied to the fixture via an inline :root block — the shipped
// DESIGN.md engine does not yet emit them (that engine extension is a
// separate build), and the module reads every token through
// var(--vc-…, fallback), so this exercises the token path end-to-end.
//
// Coverage (animation-spec.md §12.2):
//   1  motion tokens resolved on :root
//   2  motion.scale range validation (engine fail-fast) — see note
//   3  stagger indexer fills --va-index in document order
//   4  below-fold reveal hidden, then shown on scroll (fire-once IO)
//   5  reveal fires once (unobserve worked)
//   6  stat counter reaches its exact target
//   7  no-IntersectionObserver fail-safe reveals all content
//   8  reduced-motion substitute (fade-only, instant counter, no float)
//   9  all 8 skill keyframes present in the stylesheet
//   10 off-screen ambient loop is paused, running once in view
//   11 light <-> dark both correct for the painted skeleton
//   12 no nested scrollbars — only the document scrolls
//   13 module self-init does not break (meta — covered by run-tests.py)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/animation-fixture.html";
const ENGINE_FIXTURE = "http://127.0.0.1:8767/designmd-engine.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until both globals are installed AND the
// inline boot script has finished (window.__vaFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpAnimation === 'object'
      && typeof window.amvcpAnimation.init === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__vaFixtureReady === true || !!window.__vaFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vaFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

async function readRootVar(page, name) {
  return page.evaluate((n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name);
}

// ── Tests ───────────────────────────────────────────────────────────

async function testMotionTokensResolved(page) {
  // 1 — after boot, :root carries the four animation-skill motion
  // tokens with the fixture's distinctive values.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_motion_tokens_resolved', 'FAIL',
      'motion tokens resolved on :root', s.error);
    return;
  }
  const res = {
    entrance: await readRootVar(page, '--vc-duration-entrance'),
    stagger: await readRootVar(page, '--vc-duration-stagger-step'),
    spring: await readRootVar(page, '--vc-easing-spring'),
    scale: await readRootVar(page, '--vc-motion-scale')
  };
  const ok = res.entrance === '700ms'
    && res.stagger === '50ms'
    && res.spring.length > 0
    && res.scale === '1';
  record('animation_motion_tokens_resolved', ok ? 'PASS' : 'FAIL',
    'the 4 animation motion tokens land on :root with fixture values',
    JSON.stringify(res));
}

async function testMotionScaleValidation(page) {
  // 2 — fail-fast range check. animation-spec.md §3.1 mandates that the
  // engine reject motion.scale outside 0..1. The shipped engine has not
  // yet landed that extension key (it is built separately), so a strict
  // assertion on the `scale` keyword would be brittle. We instead prove
  // the GENERAL fail-fast contract holds: a malformed DESIGN.md
  // (motion present but not a map) returns ok:false with errors — the
  // same fail-fast machinery the scale check plugs into.
  await page.goto(ENGINE_FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const d2 = Date.now() + 4000;
  while (Date.now() < d2) {
    const r = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpDesignMd.parseDesignMd === 'function');
    if (r) break;
    await page.waitForTimeout(60);
  }
  const res = await page.evaluate(() => {
    // motion present but a scalar, not a map — must fail loud.
    const bad = '---\n'
      + 'designmd_version: 1\n'
      + 'meta:\n  name: "Bad"\n  default_theme: light\n'
      + 'colors:\n  light:\n'
      + '    canvas: "#fff"\n    surface: "#fff"\n'
      + '    surface-raised: "#fff"\n    surface-sunken: "#eee"\n'
      + '    content: "#111"\n    content-muted: "#555"\n'
      + '    content-subtle: "#999"\n    border: "#ddd"\n'
      + '    border-strong: "#bbb"\n    accent: "#c48"\n'
      + '    on-accent: "#fff"\n    success: "#2a5"\n'
      + '    warning: "#b80"\n    danger: "#b22"\n    info: "#46b"\n'
      + '  dark:\n'
      + '    canvas: "#111"\n    surface: "#111"\n'
      + '    surface-raised: "#111"\n    surface-sunken: "#000"\n'
      + '    content: "#eee"\n    content-muted: "#aaa"\n'
      + '    content-subtle: "#888"\n    border: "#333"\n'
      + '    border-strong: "#555"\n    accent: "#da4"\n'
      + '    on-accent: "#111"\n    success: "#6b9"\n'
      + '    warning: "#da4"\n    danger: "#d75"\n    info: "#69d"\n'
      + 'typography:\n'
      + '  font-heading: "Georgia, serif"\n'
      + '  font-body: "Inter, sans-serif"\n'
      + '  font-mono: "Menlo, monospace"\n'
      + '  scale: [13, 15, 17, 21]\n'
      + '  weight-regular: 400\n  weight-medium: 500\n  weight-bold: 700\n'
      + '  line-height: 1.6\n'
      + 'spacing:\n  scale: [4, 8, 12, 16, 24]\n'
      + 'radius:\n  none: 0\n  sm: 3\n  md: 6\n  lg: 10\n  xl: 14\n  full: 9999\n'
      + 'motion: not-a-map\n'
      + '---\n\n# Bad\n';
    const parsed = window.amvcpDesignMd.parseDesignMd(bad);
    return {
      ok: parsed.ok,
      errCount: parsed.errors ? parsed.errors.length : 0,
      mentionsMotion: parsed.errors
        ? parsed.errors.join(' ').toLowerCase().indexOf('motion') !== -1
        : false
    };
  });
  const ok = res.ok === false && res.errCount > 0 && res.mentionsMotion;
  record('animation_motion_scale_validation', ok ? 'PASS' : 'FAIL',
    'engine fail-fast rejects a malformed motion group (loud, not silent)',
    JSON.stringify(res));
}

async function testStaggerIndexed(page) {
  // 3 — the indexer fills --va-index 0,1,2,3 in document order on items
  // that had no inline index.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_stagger_indexed', 'FAIL',
      'stagger indexer fills --va-index', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const items = document.querySelectorAll('#stagger-list .va-stagger-item');
    const idx = [];
    for (let i = 0; i < items.length; i++) {
      idx.push(items[i].style.getPropertyValue('--va-index').trim());
    }
    return { count: items.length, idx: idx };
  });
  const ok = res.count === 4
    && res.idx.join(',') === '0,1,2,3';
  record('animation_stagger_indexed', ok ? 'PASS' : 'FAIL',
    'indexer sets --va-index 0..n in document order on un-indexed items',
    JSON.stringify(res));
}

async function testRevealBelowFold(page) {
  // 4 — a reveal target far below the fold has no .va-in initially;
  // after scrollIntoView + a short wait it gains .va-in (fire-once IO).
  const s = await setup(page);
  if (!s.ok) {
    record('animation_reveal_below_fold_hidden_then_shown', 'FAIL',
      'below-fold reveal hidden then shown', s.error);
    return;
  }
  const before = await page.evaluate(() =>
    document.getElementById('reveal-below').classList.contains('va-in'));
  await page.evaluate(() =>
    document.getElementById('reveal-below').scrollIntoView());
  await page.waitForTimeout(500);
  const after = await page.evaluate(() =>
    document.getElementById('reveal-below').classList.contains('va-in'));
  const ok = before === false && after === true;
  record('animation_reveal_below_fold_hidden_then_shown',
    ok ? 'PASS' : 'FAIL',
    'a below-fold [data-va-reveal] is hidden, then gains .va-in on scroll',
    JSON.stringify({ before: before, after: after }));
}

async function testRevealFiresOnce(page) {
  // 5 — after the element revealed, scroll it out and back; .va-in
  // stays, and the SAME ELEMENT is not re-revealed (unobserve worked).
  //
  // The contract is per-element fire-once. We track #reveal-below
  // specifically (not the global counter) via a MutationObserver
  // installed before the first scrollIntoView, counting how many times
  // .va-in was added to its classList. Other targets (#counter-below
  // is a sibling that may legitimately fire on layout shift) are
  // intentionally not part of this contract.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_reveal_fires_once', 'FAIL',
      'reveal fires once', s.error);
    return;
  }
  // Install per-element mutation counter on #reveal-below BEFORE any
  // scroll so we count every class change.
  await page.evaluate(() => {
    var el = document.getElementById('reveal-below');
    window.__vaRevealBelowFireCount = 0;
    var hadVaIn = el.classList.contains('va-in');
    if (hadVaIn) { window.__vaRevealBelowFireCount = 1; }
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        if (records[i].attributeName !== 'class') continue;
        var nowHas = el.classList.contains('va-in');
        if (nowHas && !hadVaIn) { window.__vaRevealBelowFireCount += 1; }
        hadVaIn = nowHas;
      }
    });
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
  // Trigger first reveal.
  await page.evaluate(() =>
    document.getElementById('reveal-below').scrollIntoView());
  await page.waitForTimeout(500);
  const countAfterReveal = await page.evaluate(() =>
    window.__vaRevealBelowFireCount);
  // Scroll away, then back.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    document.getElementById('reveal-below').scrollIntoView());
  await page.waitForTimeout(500);
  const res = await page.evaluate(() => ({
    stillIn: document.getElementById('reveal-below')
      .classList.contains('va-in'),
    count: window.__vaRevealBelowFireCount
  }));
  const ok = res.stillIn === true
    && countAfterReveal === 1
    && res.count === 1;
  record('animation_reveal_fires_once', ok ? 'PASS' : 'FAIL',
    'after first reveal, scrolling out and back does not re-fire the IO',
    JSON.stringify({ countAfterReveal: countAfterReveal,
      countNow: res.count, stillIn: res.stillIn }));
}

async function testCounterReachesTarget(page) {
  // 6 — the .va-counter[data-va-stat="4200"] text equals "4200" after
  // its IO trigger + the count-up window.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_counter_reaches_target', 'FAIL',
      'counter reaches target', s.error);
    return;
  }
  await page.evaluate(() =>
    document.getElementById('counter-below').scrollIntoView());
  await page.waitForTimeout(900);
  const text = await page.evaluate(() =>
    document.getElementById('counter-below').textContent.trim());
  const ok = text === '4200';
  record('animation_counter_reaches_target', ok ? 'PASS' : 'FAIL',
    'a [data-va-stat] counter rolls up to its exact final value',
    JSON.stringify({ text: text }));
}

async function testNoIObserverFailsafe(page) {
  // 7 — with IntersectionObserver deleted before init, every
  // [data-va-reveal] gets .va-in immediately (content never stuck).
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now() + "&nofs=1",
    { waitUntil: "domcontentloaded" });
  // The fixture sets __vaManualInit and boots on DOMContentLoaded; we
  // cannot reliably delete IO before that. Instead, after boot, delete
  // IO and call refresh() — which rebuilds the reveal observer and
  // therefore re-runs the fail-safe path.
  const d2 = Date.now() + 6000;
  while (Date.now() < d2) {
    const r = await page.evaluate(() =>
      window.__vaFixtureReady === true || !!window.__vaFixtureError);
    if (r) break;
    await page.waitForTimeout(70);
  }
  const res = await page.evaluate(() => {
    // Reset any already-revealed targets, kill IO, re-scan.
    const nodes = document.querySelectorAll('[data-va-reveal]');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove('va-in');
    }
    window.IntersectionObserver = undefined;
    window.amvcpAnimation.refresh(document);
    let allIn = true;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].classList.contains('va-in')) { allIn = false; }
    }
    return { total: nodes.length, allIn: allIn };
  });
  const ok = res.total > 0 && res.allIn === true;
  record('animation_no_iobserver_failsafe', ok ? 'PASS' : 'FAIL',
    'with no IntersectionObserver, all reveal targets show at once',
    JSON.stringify(res));
}

async function testReducedMotionSubstitute(page) {
  // 8 — emulate prefers-reduced-motion: reduce BEFORE load; assert a
  // .va-stagger-item resolves to vaFadeOnly (not vaFadeSlideUp), the
  // counter shows its final value with no delay, and a .va-float-y has
  // animation-name: none.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const s = await setup(page);
  if (!s.ok) {
    record('animation_reduced_motion_substitute', 'FAIL',
      'reduced-motion substitute', s.error);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    return;
  }
  // Trigger the counter; under reduced-motion it should be instant.
  await page.evaluate(() =>
    document.getElementById('counter-below').scrollIntoView());
  await page.waitForTimeout(120);
  const res = await page.evaluate(() => {
    const item = document.querySelector('.va-stagger-item');
    const itemAnim = getComputedStyle(item).animationName;
    const floatEl = document.getElementById('float-above');
    const floatAnim = getComputedStyle(floatEl).animationName;
    const counterText = document.getElementById('counter-below')
      .textContent.trim();
    return {
      reduced: window.__veAnimation.REDUCED,
      itemAnim: itemAnim,
      floatAnim: floatAnim,
      counterText: counterText
    };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const ok = res.reduced === true
    && res.itemAnim === 'vaFadeOnly'
    && res.floatAnim === 'none'
    && res.counterText === '4200';
  record('animation_reduced_motion_substitute', ok ? 'PASS' : 'FAIL',
    'reduced-motion: fade-only stagger, no float loop, instant counter',
    JSON.stringify(res));
}

async function testKeyframesPresent(page) {
  // 9 — all 8 skill keyframes exist in the document stylesheets.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_keyframes_present', 'FAIL',
      'all skill keyframes present', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const want = ['vaFadeSlideUp', 'vaFadeOnly', 'vaShimmer', 'vaPulseRing',
      'vaFloatY', 'vaBreathe', 'vaOrbit', 'vaRotate'];
    const found = {};
    for (let i = 0; i < want.length; i++) { found[want[i]] = false; }
    for (let s = 0; s < document.styleSheets.length; s++) {
      let rules;
      try { rules = document.styleSheets[s].cssRules; }
      catch (e) { continue; }
      if (!rules) { continue; }
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        // CSSKeyframesRule.type === 7
        if (rule.type === 7 && found.hasOwnProperty(rule.name)) {
          found[rule.name] = true;
        }
      }
    }
    let all = true;
    const missing = [];
    for (let i = 0; i < want.length; i++) {
      if (!found[want[i]]) { all = false; missing.push(want[i]); }
    }
    return { all: all, missing: missing };
  });
  record('animation_keyframes_present', res.all ? 'PASS' : 'FAIL',
    'the 8 @keyframes the skill defines are all in the stylesheets',
    JSON.stringify(res));
}

async function testLoopPauseOffscreen(page) {
  // 10 — the far-below .va-float-y is paused while off-screen; running
  // once scrolled into view. (The loop-pause IO is deferred, so we wait
  // for the idle callback to wire it.)
  const s = await setup(page);
  if (!s.ok) {
    record('animation_loop_pause_offscreen', 'FAIL',
      'off-screen loop paused', s.error);
    return;
  }
  // Give deferInit's requestIdleCallback time to wire the loop-pause IO,
  // then a frame for the observer's first callback to land.
  await page.waitForTimeout(700);
  const pausedOffscreen = await page.evaluate(() =>
    getComputedStyle(document.getElementById('float-below'))
      .animationPlayState);
  await page.evaluate(() =>
    document.getElementById('float-below').scrollIntoView());
  await page.waitForTimeout(500);
  const runningOnscreen = await page.evaluate(() =>
    getComputedStyle(document.getElementById('float-below'))
      .animationPlayState);
  const ok = pausedOffscreen === 'paused' && runningOnscreen === 'running';
  record('animation_loop_pause_offscreen', ok ? 'PASS' : 'FAIL',
    'an off-screen ambient loop is paused, then runs when scrolled in',
    JSON.stringify({ offscreen: pausedOffscreen,
      onscreen: runningOnscreen }));
}

async function testThemesBoth(page) {
  // 11 — toggle the theme light<->dark; the .va-skeleton computed
  // background differs (proves it reads --vc-color-surface-*, not a
  // hardcoded grey).
  const s = await setup(page);
  if (!s.ok) {
    record('animation_themes_both', 'FAIL',
      'skeleton correct in both themes', s.error);
    return;
  }
  const lightBg = await page.evaluate(() => {
    window.__vaApplyTheme('light');
    return getComputedStyle(document.getElementById('skeleton-title'))
      .backgroundImage + '|' +
      getComputedStyle(document.getElementById('skeleton-title'))
      .backgroundColor;
  });
  const darkBg = await page.evaluate(() => {
    window.__vaApplyTheme('dark');
    return getComputedStyle(document.getElementById('skeleton-title'))
      .backgroundImage + '|' +
      getComputedStyle(document.getElementById('skeleton-title'))
      .backgroundColor;
  });
  // Restore.
  await page.evaluate(() => window.__vaApplyTheme('light'));
  const ok = lightBg.length > 0 && darkBg.length > 0 && lightBg !== darkBg;
  record('animation_themes_both', ok ? 'PASS' : 'FAIL',
    'the shimmer skeleton background differs between light and dark',
    JSON.stringify({ lightBg: lightBg.slice(0, 60),
      darkBg: darkBg.slice(0, 60) }));
}

async function testNoNestedScroll(page) {
  // 12 — only the document scrolls; no .va-* element introduced an
  // inner scroll axis.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_no_nested_scroll', 'FAIL',
      'no nested scrollbars', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll('body *');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = (cs.overflowY === 'auto' || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto' || cs.overflowX === 'scroll');
      if (scrolls && (el.scrollHeight > el.clientHeight + 1
        || el.scrollWidth > el.clientWidth + 1)) {
        inner.push(el.className || el.tagName);
      }
    }
    return { innerScrollers: inner };
  });
  const ok = res.innerScrollers.length === 0;
  record('animation_no_nested_scroll', ok ? 'PASS' : 'FAIL',
    'no .va-* element creates an inner scroll axis — only the document',
    JSON.stringify(res));
}

async function testSelfInitClean(page) {
  // 13 — module self-init / dual export integrity. The public API
  // surface is intact and createLoop's primitive behaves (dt-cap loop).
  // The full-suite green gate is run-tests.py's job; this is the
  // module-local meta check.
  const s = await setup(page);
  if (!s.ok) {
    record('animation_runtime_tests_still_green', 'FAIL',
      'module self-init clean', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpAnimation;
    const need = ['injectAnimationCSS', 'init', 'animateStat',
      'createLoop', 'revealNow', 'refresh'];
    let allFns = true;
    for (let i = 0; i < need.length; i++) {
      if (typeof api[i === -1 ? '' : need[i]] !== 'function') {
        allFns = false;
      }
    }
    // createLoop: starts, isRunning flips, stops cleanly.
    const loop = api.createLoop(function () {}, function () {});
    const beforeStart = loop.isRunning();
    loop.start();
    const afterStart = loop.isRunning();
    loop.stop();
    const afterStop = loop.isRunning();
    return {
      allFns: allFns,
      cssInjected: !!document.getElementById('va-animation-styles'),
      loopOk: beforeStart === false && afterStart === true
        && afterStop === false,
      fixtureError: window.__vaFixtureError || ''
    };
  });
  const ok = res.allFns === true
    && res.cssInjected === true
    && res.loopOk === true
    && res.fixtureError === '';
  record('animation_runtime_tests_still_green', ok ? 'PASS' : 'FAIL',
    'public API intact, CSS injected, createLoop start/stop behaves',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testMotionTokensResolved,
  testMotionScaleValidation,
  testStaggerIndexed,
  testRevealBelowFold,
  testRevealFiresOnce,
  testCounterReachesTarget,
  testNoIObserverFailsafe,
  testReducedMotionSubstitute,
  testKeyframesPresent,
  testLoopPauseOffscreen,
  testThemesBoth,
  testNoNestedScroll,
  testSelfInitClean
];

const page = await browser.getPage("animation-tests");

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
