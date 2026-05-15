// test-slide.js
//
// Dev-browser script — exercises scripts/amvcp-slide.js, the Phase-2
// slide-deck runtime module (visualizing backlog §5, slide-spec.md).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpSlideDeck` + Node `module.exports`). This suite loads it
// AS A BROWSER GLOBAL from slide-fixture.html — a self-contained page
// that loads amvcp-designmd.js then amvcp-slide.js, embeds a DESIGN.md
// + a 6-slide deck JSON, and (because window.__vsdManualInit is set)
// lets a small inline boot script apply the engine tokens, inject the
// deck CSS, render the deck into #deck-host, and wire navigation.
//
// Coverage (slide-spec.md §3-10):
//   1  module API surface intact, CSS injected, viewport mounted
//   2  parseDeck enforces the layout enum (fail-fast on unknown layout)
//   3  parseDeck enforces the block-type enum (fail-fast on unknown type)
//   4  16 layouts + bento-grid templates declared
//   5  six slides rendered, exactly one visible (others [hidden])
//   6  fitStage produces a positive transform:scale on the stage
//   7  Deck.next / Deck.prev / Deck.go drive the visible slide
//   8  validateHeadline accepts a sentence with a verb / a stat / rejects a label
//   9  weak-headline slide carries data-vsd-headline-warn (soft, not thrown)
//   10 selection-wiring data-ve-* attrs land on every .vsd-slide
//   11 light <-> dark theme toggle changes the canvas color (token path live)
//   12 no nested scrollbars — the viewport CLIPS, no inner scroll axis
//   13 navigation chrome is built (dots + counter + progress)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/slide-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until both globals are installed AND the
// inline boot script has finished (window.__vsdFixtureReady).
//
// localStorage MUST be wiped before each setup so each test starts at
// slide 0 — otherwise testDeckNavigationDrivesVisibleSlide's go(2)
// persists "current slide = 2" to localStorage:vsd:<deckId>:pos and
// every subsequent setup() restores to slide 2 instead of slide 0.
// We wipe via about:blank + localStorage.clear() because the fixture
// page itself calls createDeck on load, which calls _restore() before
// we get a chance to delete the key.
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  // Wipe localStorage on the fixture's origin BEFORE the deck reloads.
  await page.goto(FIXTURE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  // Now reload with a cache-buster — createDeck will see no persisted
  // position and start from slide 0.
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpSlideDeck === 'object'
      && typeof window.amvcpSlideDeck.renderDeck === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__vsdFixtureReady === true || !!window.__vsdFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vsdFixtureError || '');
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

async function testApiSurfaceIntact(page) {
  // 1 — public API + CSS injection + viewport mount all happened.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_api_surface_intact', 'FAIL',
      'public API + CSS injection + viewport mount intact', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpSlideDeck;
    const need = ['injectSlideCSS', 'parseDeck', 'renderDeck', 'createDeck',
      'fitStage', 'validateHeadline', 'boot', 'refresh'];
    const missing = [];
    for (let i = 0; i < need.length; i++) {
      if (typeof api[need[i]] !== 'function') { missing.push(need[i]); }
    }
    return {
      missing: missing,
      cssInjected: !!document.getElementById('vsd-slide-styles'),
      viewportMounted: !!document.querySelector('.vsd-viewport'),
      deckLive: !!window.__vsdFixtureDeck,
      fixtureError: window.__vsdFixtureError || ''
    };
  });
  const ok = res.missing.length === 0
    && res.cssInjected === true
    && res.viewportMounted === true
    && res.deckLive === true
    && res.fixtureError === '';
  record('slide_api_surface_intact', ok ? 'PASS' : 'FAIL',
    'every public API function present, deck CSS injected, viewport mounted',
    JSON.stringify(res));
}

async function testParseDeckRejectsUnknownLayout(page) {
  // 2 — parseDeck throws naming the offending JSON path on an unknown
  // layout (slide-spec.md §5.5 — fail-fast on STRUCTURAL violations).
  const s = await setup(page);
  if (!s.ok) {
    record('slide_parse_rejects_unknown_layout', 'FAIL',
      'parseDeck rejects unknown layout', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const bad = {
      title: 'Bad Layout',
      slides: [{ layout: 'mosaic-grid-supreme', blocks: [
        { type: 'heading', text: 'Heading' }
      ]}]
    };
    let threw = false;
    let msg = '';
    try { window.amvcpSlideDeck.parseDeck(bad); }
    catch (e) { threw = true; msg = String(e && e.message || e); }
    return {
      threw: threw,
      msg: msg,
      mentionsLayout: msg.toLowerCase().indexOf('layout') !== -1,
      mentionsName: msg.indexOf('mosaic-grid-supreme') !== -1,
      mentionsPath: msg.indexOf('slides[0].layout') !== -1
    };
  });
  const ok = res.threw === true
    && res.mentionsLayout
    && res.mentionsName
    && res.mentionsPath;
  record('slide_parse_rejects_unknown_layout', ok ? 'PASS' : 'FAIL',
    'parseDeck throws naming the path on an unknown layout name',
    JSON.stringify(res));
}

async function testParseDeckRejectsUnknownBlockType(page) {
  // 3 — parseDeck throws on an unknown block type (the highest-frequency
  // authoring error — never silently skip).
  const s = await setup(page);
  if (!s.ok) {
    record('slide_parse_rejects_unknown_block_type', 'FAIL',
      'parseDeck rejects unknown block type', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const bad = {
      title: 'Bad Block',
      slides: [{ layout: 'manifesto', blocks: [
        { type: 'mermaidd', source: 'graph TD; A-->B' }
      ]}]
    };
    let threw = false;
    let msg = '';
    try { window.amvcpSlideDeck.parseDeck(bad); }
    catch (e) { threw = true; msg = String(e && e.message || e); }
    return {
      threw: threw,
      msg: msg,
      mentionsType: msg.toLowerCase().indexOf('block type') !== -1,
      mentionsName: msg.indexOf('mermaidd') !== -1
    };
  });
  const ok = res.threw === true && res.mentionsType && res.mentionsName;
  record('slide_parse_rejects_unknown_block_type', ok ? 'PASS' : 'FAIL',
    'parseDeck throws naming the offending block type',
    JSON.stringify(res));
}

async function testLayoutsCatalog(page) {
  // 4 — the 16 named layouts + the 7 bento grids are all declared on the
  // exposed _constants surface (the single source of truth the spec
  // mandates). Catches a future refactor that drops a layout.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_layouts_catalog_complete', 'FAIL',
      '16 layouts + 7 bento grids declared', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const c = window.amvcpSlideDeck._constants;
    const wantLayouts = ['manifesto', 'section-divider', 'statement',
      'content', 'two-column', 'comparison', 'quadrant', 'data-story',
      'metrics', 'timeline', 'bento', 'stack', 'full-bleed', 'quote',
      'code-focus', 'closing'];
    const wantGrids = ['hero', 'gallery', 'asymmetric', 'feature',
      'stats', 'split', 'full'];
    const missingLayouts = [];
    for (let i = 0; i < wantLayouts.length; i++) {
      if (c.LAYOUTS.indexOf(wantLayouts[i]) === -1) {
        missingLayouts.push(wantLayouts[i]);
      }
    }
    const missingGrids = [];
    for (let i = 0; i < wantGrids.length; i++) {
      if (c.BENTO_GRIDS.indexOf(wantGrids[i]) === -1) {
        missingGrids.push(wantGrids[i]);
      }
    }
    return {
      layoutCount: c.LAYOUTS.length,
      gridCount: c.BENTO_GRIDS.length,
      missingLayouts: missingLayouts,
      missingGrids: missingGrids
    };
  });
  const ok = res.layoutCount === 16
    && res.gridCount === 7
    && res.missingLayouts.length === 0
    && res.missingGrids.length === 0;
  record('slide_layouts_catalog_complete', ok ? 'PASS' : 'FAIL',
    '16 layouts + 7 bento grids all declared on _constants',
    JSON.stringify(res));
}

async function testSlidesRenderedExactlyOneVisible(page) {
  // 5 — six .vsd-slide land in the DOM; exactly one is visible (no
  // [hidden]); the rest are hidden (slide-spec.md §4.3 — discrete-slide
  // model, exactly one visible at a time).
  const s = await setup(page);
  if (!s.ok) {
    record('slide_six_rendered_one_visible', 'FAIL',
      'six slides rendered, exactly one visible', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const slides = document.querySelectorAll('.vsd-slide');
    let visible = 0;
    let hidden = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].hasAttribute('hidden')) { hidden++; }
      else { visible++; }
    }
    return { total: slides.length, visible: visible, hidden: hidden };
  });
  const ok = res.total === 6 && res.visible === 1 && res.hidden === 5;
  record('slide_six_rendered_one_visible', ok ? 'PASS' : 'FAIL',
    'all six fixture slides rendered, exactly one is visible',
    JSON.stringify(res));
}

async function testFitStageScalesPositively(page) {
  // 6 — fitStage applied a positive transform:scale on .vsd-stage so a
  // 1920x1080 stage shows fitted into the 1280x800 viewport.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_fit_stage_positive_scale', 'FAIL',
      'fitStage produces a positive transform:scale', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const stage = document.querySelector('.vsd-stage');
    if (!stage) { return { ok: false, reason: 'no stage' }; }
    const transform = stage.style.transform || '';
    const m = transform.match(/scale\(([\d.]+)\)/);
    const ratio = m ? parseFloat(m[1]) : 0;
    return {
      transform: transform,
      ratio: ratio,
      stageW: stage.style.width,
      stageH: stage.style.height
    };
  });
  // 1280/1920 = 0.6666; 800/1080 = 0.7407. min = 0.6666. So ratio > 0.5
  // and < 1 is the right window.
  const ok = res.ratio > 0.4 && res.ratio < 1.0
    && res.stageW === '1920px' && res.stageH === '1080px';
  record('slide_fit_stage_positive_scale', ok ? 'PASS' : 'FAIL',
    'fitStage scaled the 1920x1080 stage to fit the 1280x800 viewport',
    JSON.stringify(res));
}

async function testDeckNavigationDrivesVisibleSlide(page) {
  // 7 — Deck.go(2), .next(), .prev() flip which .vsd-slide is the
  // un-hidden one. The Deck object is the single source of truth for
  // "current slide" (slide-spec.md §4.5).
  const s = await setup(page);
  if (!s.ok) {
    record('slide_navigation_drives_visible', 'FAIL',
      'Deck.go/.next/.prev drives the visible slide', s.error);
    return;
  }
  // Helper to read which slide indexes are NOT hidden.
  async function visibleIdx() {
    return page.evaluate(() => {
      const slides = document.querySelectorAll('.vsd-slide');
      const idx = [];
      for (let i = 0; i < slides.length; i++) {
        if (!slides[i].hasAttribute('hidden')) { idx.push(i); }
      }
      return idx;
    });
  }
  const start = await visibleIdx();
  await page.evaluate(() => window.__vsdFixtureDeck.go(2));
  await page.waitForTimeout(450);  // wait past the transition duration
  const afterGo = await visibleIdx();
  const goCurrent = await page.evaluate(() =>
    window.__vsdFixtureDeck.current());
  await page.evaluate(() => window.__vsdFixtureDeck.next());
  await page.waitForTimeout(450);
  const afterNext = await visibleIdx();
  await page.evaluate(() => window.__vsdFixtureDeck.prev());
  await page.waitForTimeout(450);
  const afterPrev = await visibleIdx();
  const ok = start.length === 1 && start[0] === 0
    && afterGo.length === 1 && afterGo[0] === 2 && goCurrent === 2
    && afterNext.length === 1 && afterNext[0] === 3
    && afterPrev.length === 1 && afterPrev[0] === 2;
  record('slide_navigation_drives_visible', ok ? 'PASS' : 'FAIL',
    'go(2)/next()/prev() each flip the single un-hidden slide',
    JSON.stringify({ start: start, afterGo: afterGo,
      afterNext: afterNext, afterPrev: afterPrev,
      goCurrent: goCurrent }));
}

async function testValidateHeadlineHeuristic(page) {
  // 8 — validateHeadline accepts: a complete sentence with a verb, a
  // stat-driven headline, a multi-word headline with -ed morphology;
  // rejects: an empty string, a 2-word verbless label, a 4-word noun
  // phrase. Slide-spec.md §10.1 — soft check, never throws.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_validate_headline_heuristic', 'FAIL',
      'validateHeadline accepts sentences, rejects labels', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const v = window.amvcpSlideDeck.validateHeadline;
    return {
      // Accepts:
      sentence: v('Latency dropped 38% after the cache rewrite shipped.').ok,
      stat: v('38 percent faster than last year').ok,
      verbed: v('Five teams shipped seven features this quarter').ok,
      // Rejects:
      empty: v('').ok,
      twoWord: v('Q3 Results').ok,
      noun: v('Engineering Department Quarterly Status').ok
    };
  });
  const ok = res.sentence === true
    && res.stat === true
    && res.verbed === true
    && res.empty === false
    && res.twoWord === false
    && res.noun === false;
  record('slide_validate_headline_heuristic', ok ? 'PASS' : 'FAIL',
    'verb / stat / morphology accepted; empty / label / noun-phrase rejected',
    JSON.stringify(res));
}

async function testWeakHeadlineCollectsSoftWarning(page) {
  // 9 — slide #6's heading is "Q3 Results" (verbless, 2 words). The
  // rendered .vsd-slide carries data-vsd-headline-warn — a non-print
  // attribute the recipe surfaces. Renderer DID NOT throw.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_weak_headline_soft_warn', 'FAIL',
      'weak headline collects soft warning', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const slides = document.querySelectorAll('.vsd-slide');
    const warned = [];
    for (let i = 0; i < slides.length; i++) {
      const h = slides[i].querySelector('[data-vsd-headline-warn]');
      if (h) { warned.push({ slide: i, reason: h.getAttribute('data-vsd-headline-warn') }); }
    }
    return {
      slideCount: slides.length,
      warnedCount: warned.length,
      warned: warned,
      fixtureError: window.__vsdFixtureError || ''
    };
  });
  const ok = res.slideCount === 6
    && res.warnedCount === 1
    && res.warned[0].slide === 5
    && res.fixtureError === '';
  record('slide_weak_headline_soft_warn', ok ? 'PASS' : 'FAIL',
    'slide #6 weak heading attaches data-vsd-headline-warn; render did not throw',
    JSON.stringify(res));
}

async function testSelectionWiringAttrs(page) {
  // 10 — every .vsd-slide carries data-ve-id, data-ve-type, data-ve-label
  // so the runtime's selection layer (modal-comments etc.) keeps slides
  // click-selectable (slide-spec.md §11 output contract).
  const s = await setup(page);
  if (!s.ok) {
    record('slide_selection_wiring_attrs', 'FAIL',
      'data-ve-* attrs on every .vsd-slide', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const slides = document.querySelectorAll('.vsd-slide');
    const seenIds = {};
    let allGood = true;
    let firstBad = null;
    for (let i = 0; i < slides.length; i++) {
      const id = slides[i].getAttribute('data-ve-id');
      const type = slides[i].getAttribute('data-ve-type');
      const label = slides[i].getAttribute('data-ve-label');
      if (!id || !type || !label || type !== 'slide') {
        allGood = false;
        if (firstBad === null) {
          firstBad = { i: i, id: id, type: type, label: label };
        }
      }
      if (id) {
        if (seenIds[id]) { allGood = false; firstBad = firstBad
          || { i: i, dup: id }; }
        seenIds[id] = true;
      }
    }
    return {
      total: slides.length,
      allGood: allGood,
      firstBad: firstBad,
      uniqueIds: Object.keys(seenIds).length
    };
  });
  const ok = res.total === 6 && res.allGood === true && res.uniqueIds === 6;
  record('slide_selection_wiring_attrs', ok ? 'PASS' : 'FAIL',
    'every slide carries unique data-ve-id, data-ve-type=slide, data-ve-label',
    JSON.stringify(res));
}

async function testThemesBoth(page) {
  // 11 — toggle the theme light <-> dark; the .vsd-viewport's computed
  // background changes (proves the deck CSS reads --vc-color-canvas, not
  // a hardcoded value). Project memory: every visual must be correct in
  // BOTH themes.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_themes_both_correct', 'FAIL',
      'viewport canvas correct in both themes', s.error);
    return;
  }
  const lightBg = await page.evaluate(() => {
    window.__vsdApplyTheme('light');
    return getComputedStyle(document.querySelector('.vsd-viewport'))
      .backgroundColor;
  });
  const darkBg = await page.evaluate(() => {
    window.__vsdApplyTheme('dark');
    return getComputedStyle(document.querySelector('.vsd-viewport'))
      .backgroundColor;
  });
  // Restore.
  await page.evaluate(() => window.__vsdApplyTheme('light'));
  const ok = lightBg.length > 0 && darkBg.length > 0 && lightBg !== darkBg;
  record('slide_themes_both_correct', ok ? 'PASS' : 'FAIL',
    'the deck letterbox bg differs between light and dark themes',
    JSON.stringify({ lightBg: lightBg, darkBg: darkBg }));
}

async function testNoNestedScroll(page) {
  // 12 — only the document scrolls; .vsd-viewport CLIPS, no slide /
  // layout / inner element introduces an inner scroll axis. Hard
  // invariant from no-nested-scrollbars rule.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_no_nested_scroll', 'FAIL',
      'no nested scrollbars in the deck', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const viewport = document.querySelector('.vsd-viewport');
    const cs = getComputedStyle(viewport);
    // The viewport itself must be overflow:hidden — that is the CLIP,
    // not a scroller.
    const viewportOverflow = cs.overflow + '|' + cs.overflowX + '|' + cs.overflowY;
    // Scan every descendant under .vsd-viewport for an actually-scrolling
    // box (overflow:auto/scroll AND content overflowing).
    const all = viewport.querySelectorAll('*');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const ecs = getComputedStyle(el);
      const scrolls = (ecs.overflowY === 'auto' || ecs.overflowY === 'scroll'
        || ecs.overflowX === 'auto' || ecs.overflowX === 'scroll');
      if (scrolls && (el.scrollHeight > el.clientHeight + 1
        || el.scrollWidth > el.clientWidth + 1)) {
        inner.push(el.className || el.tagName);
      }
    }
    return {
      viewportOverflow: viewportOverflow,
      innerScrollers: inner
    };
  });
  // The viewport overflow can be reported as either "hidden" or
  // "hidden|hidden|hidden" depending on the browser shorthand — both
  // are correct for "this element CLIPS, not scrolls".
  const viewportClips = res.viewportOverflow.indexOf('hidden') !== -1
    && res.viewportOverflow.indexOf('auto') === -1
    && res.viewportOverflow.indexOf('scroll') === -1;
  const ok = viewportClips && res.innerScrollers.length === 0;
  record('slide_no_nested_scroll', ok ? 'PASS' : 'FAIL',
    'viewport CLIPS (overflow:hidden); no inner element scrolls',
    JSON.stringify(res));
}

async function testNavigationChromeBuilt(page) {
  // 13 — navigation chrome (six dots, counter, progress fill) is built
  // and the active dot has aria-current="true". Slide-spec.md §4.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_navigation_chrome_built', 'FAIL',
      'nav dots + counter + progress built', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const dots = document.querySelectorAll('.vsd-dot');
    const counter = document.querySelector('.vsd-counter');
    const progress = document.querySelector('.vsd-progress-fill');
    let activeIdx = -1;
    for (let i = 0; i < dots.length; i++) {
      if (dots[i].getAttribute('aria-current') === 'true') { activeIdx = i; }
    }
    return {
      dotCount: dots.length,
      counterText: counter ? counter.textContent.trim() : '',
      hasProgress: !!progress,
      activeIdx: activeIdx
    };
  });
  const ok = res.dotCount === 6
    && res.counterText === '1 / 6'
    && res.hasProgress === true
    && res.activeIdx === 0;
  record('slide_navigation_chrome_built', ok ? 'PASS' : 'FAIL',
    '6 dots, counter "1 / 6", progress fill, first dot aria-current',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testApiSurfaceIntact,
  testParseDeckRejectsUnknownLayout,
  testParseDeckRejectsUnknownBlockType,
  testLayoutsCatalog,
  testSlidesRenderedExactlyOneVisible,
  testFitStageScalesPositively,
  testDeckNavigationDrivesVisibleSlide,
  testValidateHeadlineHeuristic,
  testWeakHeadlineCollectsSoftWarning,
  testSelectionWiringAttrs,
  testThemesBoth,
  testNoNestedScroll,
  testNavigationChromeBuilt
];

const page = await browser.getPage("slide-tests");

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
