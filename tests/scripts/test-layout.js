// test-layout.js
//
// Dev-browser script — exercises the layout technique (Phase 2,
// TRDD-352ef46a, Build #2). The layout technique ships:
//   - amvcp-layout.css : spatial-foundation aliases, grid presets, the
//     measured reading container, sticky header, scroll-spy TOC styles,
//     print/paged layout, decorative surfaces.
//   - amvcp-layout.js  : scroll-spy TOC, sticky-header scroll-state,
//     IDE sidebar collapse — all degrade gracefully when JS is off.
//
// Two self-contained fixtures (engine + layout module, no runtime):
//   layout-grids.html — groups 1-5, 7
//   layout-print.html — group 6
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const GRIDS = "http://127.0.0.1:8767/layout-grids.html";
const PRINT = "http://127.0.0.1:8767/layout-print.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load a fixture, wait until the layout module + the engine globals are
// installed and the fixture bootstrap has applied the DESIGN.md tokens
// (proven by --vc-space-3 being present on :root).
async function setup(page, url) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpLayout === 'object'
      && typeof window.amvcpLayout.boot === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && getComputedStyle(document.documentElement)
           .getPropertyValue('--vc-space-3').trim().length > 0
    );
    if (ready) return true;
    await page.waitForTimeout(70);
  }
  return false;
}

// Read a CSS custom property off :root.
async function readRootVar(page, name) {
  return page.evaluate((n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name);
}

// ── P1 tests ────────────────────────────────────────────────────────

async function testSpatialAliases(page) {
  // Group 1: the --la-* gap aliases resolve off the engine's
  // --vc-space-* scale. --la-gap must equal --vc-space-3 (16px from the
  // fixture's scale). Then hot-apply a DESIGN.md with a different
  // spacing scale and confirm --la-gap follows — proving the alias is
  // live, not a frozen copy. Run once light, once dark, asserting the
  // alias is theme-invariant (spacing does not flip with the theme).
  if (!(await setup(page, GRIDS))) {
    record('layout_spatial_aliases', 'FAIL', 'group-1 --la-* aliases resolve off --vc-space-*', 'fixture never booted');
    return;
  }
  const space3 = await readRootVar(page, '--vc-space-3');
  const gapLight = await readRootVar(page, '--la-gap');
  // Flip to dark — spacing tokens must not change.
  await page.evaluate(() => window.__veLayoutFixture.applyTheme('dark'));
  await page.waitForTimeout(40);
  const gapDark = await readRootVar(page, '--la-gap');
  const themeDark = await page.evaluate(() =>
    document.documentElement.getAttribute('data-ve-theme'));
  const canvasDark = await readRootVar(page, '--vc-color-canvas');
  // Restore light, then hot-apply a DESIGN.md with a wider base step.
  await page.evaluate(() => window.__veLayoutFixture.applyTheme('light'));
  const swapped = await page.evaluate(() => {
    const api = window.amvcpDesignMd;
    const block = document.getElementById('ve-designmd');
    // Trim the leading newline that follows the opening <script> tag —
    // the engine requires the `---` fence on line 1.
    let txt = block.textContent.trim();
    // Replace the spacing scale's index-3 value (16 → 20). Must stay in
    // the (12, 24) interval — the engine enforces strictly-ascending
    // spacing.scale, so picking 40 (>24) makes parseDesignMd reject the
    // whole DESIGN.md and the hot-swap silently no-ops.
    txt = txt.replace('scale: [4, 8, 12, 16, 24, 32, 48, 64]',
                      'scale: [4, 8, 12, 20, 24, 32, 48, 64]');
    const parsed = api.parseDesignMd(txt);
    if (!parsed.ok) return { ok: false };
    api.applyTokens(api.resolveTokens(parsed.designmd, 'light'),
                    document.documentElement);
    return {
      ok: true,
      space3: getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-space-3').trim(),
      gap: getComputedStyle(document.documentElement)
        .getPropertyValue('--la-gap').trim()
    };
  });
  const ok =
    space3 === '16px' &&
    gapLight === space3 &&
    gapDark === gapLight &&
    themeDark === 'dark' &&
    canvasDark === '#16130d' &&
    swapped.ok &&
    swapped.space3 === '20px' &&
    swapped.gap === '20px';
  record(
    'layout_spatial_aliases',
    ok ? 'PASS' : 'FAIL',
    '--la-gap aliases --vc-space-3 live, theme-invariant, follows a hot-swap',
    JSON.stringify({ space3, gapLight, gapDark, themeDark, canvasDark, swapped })
  );
}

async function testReadingMeasure(page) {
  // Group 3: .la-article holds its reading measure. It must NOT be a
  // <main> (the runtime forces main { max-width:none }, which would
  // silently destroy the measure — §0.4). Its measured centre-column
  // child must be narrower than the article's full content width.
  // Re-checked in light AND dark — layout boxes are theme-invariant.
  if (!(await setup(page, GRIDS))) {
    record('layout_reading_measure', 'FAIL', '.la-article holds its measure', 'fixture never booted');
    return;
  }
  async function measure() {
    return page.evaluate(() => {
      const art = document.querySelector('.la-article');
      const measured = art.querySelector('p');           // a centre-column child
      const aw = art.getBoundingClientRect().width;
      const mw = measured.getBoundingClientRect().width;
      return {
        tag: art.tagName.toLowerCase(),
        articleWidth: aw,
        measuredWidth: mw,
        narrower: mw < aw - 2                            // measured < full
      };
    });
  }
  const light = await measure();
  await page.evaluate(() => window.__veLayoutFixture.applyTheme('dark'));
  await page.waitForTimeout(40);
  const dark = await measure();
  await page.evaluate(() => window.__veLayoutFixture.applyTheme('light'));
  const ok =
    light.tag === 'article' &&
    light.narrower === true &&
    dark.narrower === true &&
    Math.abs(light.measuredWidth - dark.measuredWidth) < 1;  // theme-invariant
  record(
    'layout_reading_measure',
    ok ? 'PASS' : 'FAIL',
    '.la-article is not <main>; centre column is measured (< full width), theme-invariant',
    JSON.stringify({ light, dark })
  );
}

async function testArticleBleed(page) {
  // Group 3: a .la-article__bleed child extends past the measured
  // column, and the article never grows an inner scrollbar
  // (scrollWidth === clientWidth).
  if (!(await setup(page, GRIDS))) {
    record('layout_article_bleed', 'FAIL', 'bleed children extend past the measure', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const art = document.querySelector('.la-article');
    const measured = art.querySelector('p:not(.la-article__bleed)');
    const bleed = art.querySelector('.la-article__bleed');
    return {
      bleedWidth: bleed.getBoundingClientRect().width,
      measuredWidth: measured.getBoundingClientRect().width,
      noInnerScroll: art.scrollWidth <= art.clientWidth + 1
    };
  });
  const ok = res.bleedWidth > res.measuredWidth + 2 && res.noInnerScroll;
  record(
    'layout_article_bleed',
    ok ? 'PASS' : 'FAIL',
    '.la-article__bleed is wider than a measured child; no inner scrollbar',
    JSON.stringify(res)
  );
}

async function testGrid21(page) {
  // Group 2a: .la-grid--2-1 is a 2:1 asymmetric grid. The main region
  // is ~2x the sidebar width at a desktop viewport; the sidebar holds
  // a >= 280px floor (the minmax(min(300px,100%),1fr) rule).
  if (!(await setup(page, GRIDS))) {
    record('layout_grid_2_1', 'FAIL', '.la-grid--2-1 is a 2:1 grid', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const grid = document.querySelector('.la-grid--2-1');
    const main = grid.querySelector('.la-region--main, [data-ve-id="region-content"]');
    const side = grid.querySelector('.la-region--side, [data-ve-id="region-sidebar"]');
    const mw = main.getBoundingClientRect().width;
    const sw = side.getBoundingClientRect().width;
    return { mainWidth: mw, sideWidth: sw, ratio: mw / sw };
  });
  // 2fr : 1fr column ratio — allow tolerance for the gap.
  const ok = res.ratio > 1.6 && res.ratio < 2.6 && res.sideWidth >= 280;
  record(
    'layout_grid_2_1',
    ok ? 'PASS' : 'FAIL',
    'main region ≈ 2x sidebar width; sidebar holds its floor',
    JSON.stringify(res)
  );
}

async function testGridCollapse(page) {
  // Group 2a: the grid collapses to a single column at a mobile
  // viewport (< 768px) — main + sidebar end up at equal (full) width.
  if (!(await setup(page, GRIDS))) {
    record('layout_grid_collapse', 'FAIL', 'grid collapses to 1 column on mobile', 'fixture never booted');
    return;
  }
  await page.setViewportSize({ width: 480, height: 900 });
  await page.waitForTimeout(60);
  const res = await page.evaluate(() => {
    const grid = document.querySelector('.la-grid--2-1');
    const main = grid.querySelector('[data-ve-id="region-content"]');
    const side = grid.querySelector('[data-ve-id="region-sidebar"]');
    return {
      mainWidth: main.getBoundingClientRect().width,
      sideWidth: side.getBoundingClientRect().width
    };
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const ok = Math.abs(res.mainWidth - res.sideWidth) < 2;
  record(
    'layout_grid_collapse',
    ok ? 'PASS' : 'FAIL',
    'at 480px the grid stacks — main + sidebar widths are equal',
    JSON.stringify(res)
  );
}

async function testTocBuilt(page) {
  // Group 5: the scroll-spy TOC auto-builds from the document's
  // headings. The (initially empty) .la-toc__list gets one <a> per
  // h2/h3, and every href points at a real heading id.
  if (!(await setup(page, GRIDS))) {
    record('layout_toc_built', 'FAIL', 'scroll-spy TOC auto-builds', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const links = document.querySelectorAll('.la-toc .la-toc__list a');
    const headingCount = document.querySelectorAll('.demo-pad h2, .demo-pad h3').length;
    let allResolve = links.length > 0;
    for (let i = 0; i < links.length; i++) {
      const id = links[i].getAttribute('href').slice(1);
      if (!document.getElementById(id)) allResolve = false;
    }
    return {
      linkCount: links.length,
      headingCount: headingCount,
      allHrefsResolve: allResolve
    };
  });
  const ok = res.linkCount > 0 && res.linkCount === res.headingCount && res.allHrefsResolve;
  record(
    'layout_toc_built',
    ok ? 'PASS' : 'FAIL',
    '.la-toc__list populated with one resolvable <a> per heading',
    JSON.stringify(res)
  );
}

async function testTocActive(page) {
  // Group 5: the scroll-spy observer highlights the in-view heading and
  // RE-activates an earlier heading when scrolling back up (it fires
  // repeatedly, not fire-once).
  if (!(await setup(page, GRIDS))) {
    record('layout_toc_active', 'FAIL', 'scroll-spy highlights the in-view heading', 'fixture never booted');
    return;
  }
  // Scroll a mid-document heading into the observer's mid-viewport band.
  await page.evaluate(() => {
    const h = document.getElementById('sec-dash');
    h.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(260);
  const midActive = await page.evaluate(() => {
    const a = document.querySelector('.la-toc a[href="#sec-dash"]');
    return a ? a.classList.contains('is-active') : false;
  });
  // Scroll back to the top — an earlier heading must re-activate.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    document.getElementById('sec-reading').scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(260);
  const topActive = await page.evaluate(() => {
    const a = document.querySelector('.la-toc a[href="#sec-reading"]');
    return a ? a.classList.contains('is-active') : false;
  });
  const ok = midActive === true && topActive === true;
  record(
    'layout_toc_active',
    ok ? 'PASS' : 'FAIL',
    'mid heading link gains .is-active; scroll back up re-activates an earlier link',
    JSON.stringify({ midActive, topActive })
  );
}

async function testTocAnchors(page) {
  // Group 5: clicking a TOC anchor jumps the heading into view — the
  // native anchor jump works independent of the IntersectionObserver
  // (so the TOC is useful even with the live highlight aside).
  if (!(await setup(page, GRIDS))) {
    record('layout_toc_no_js_anchors', 'FAIL', 'TOC anchors still jump', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    const link = document.querySelector('.la-toc a[href="#sec-end"]');
    if (!link) return { clicked: false };
    link.click();
    await new Promise((r) => setTimeout(r, 400));
    const target = document.getElementById('sec-end');
    const rect = target.getBoundingClientRect();
    // The target heading is now within the viewport.
    return {
      clicked: true,
      inView: rect.top >= -2 && rect.top < window.innerHeight,
      scrolledY: window.pageYOffset
    };
  });
  const ok = res.clicked === true && res.inView === true && res.scrolledY > 0;
  record(
    'layout_toc_no_js_anchors',
    ok ? 'PASS' : 'FAIL',
    'clicking a TOC anchor scrolls its heading into view (native jump)',
    JSON.stringify(res)
  );
}

async function testPrintMedia(page) {
  // Group 6: under print emulation, the @media print reset hides the
  // chrome (.la-header, .la-toc) and flattens the .la-article grid to
  // a plain block.
  if (!(await setup(page, PRINT))) {
    record('layout_print_media', 'FAIL', '@media print reset hides chrome', 'fixture never booted');
    return;
  }
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(60);
  const printed = await page.evaluate(() => {
    const cs = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).display : 'missing';
    };
    return {
      header: cs('.la-header'),
      toc: cs('.la-toc'),
      article: cs('.la-article')
    };
  });
  await page.emulateMedia({ media: 'screen' });
  const ok =
    printed.header === 'none' &&
    printed.toc === 'none' &&
    printed.article === 'block';
  record(
    'layout_print_media',
    ok ? 'PASS' : 'FAIL',
    'print: .la-header/.la-toc display:none, .la-article display:block',
    JSON.stringify(printed)
  );
}

async function testNoNestedScroll(page) {
  // Cross-cutting: no layout element emits an inner scroller. Every
  // .la-grid / .la-ide* / .la-toc / .la-article element has computed
  // overflow ∈ {visible, hidden, clip} — never auto/scroll. The IDE
  // sidebar's hidden is a collapse clip, not a scroller.
  if (!(await setup(page, GRIDS))) {
    record('layout_no_nested_scroll', 'FAIL', 'no layout element is an inner scroller', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const sels = [
      '.la-grid', '.la-cardrow', '.la-card', '.la-ide',
      '.la-ide__sidebar', '.la-ide__center', '.la-ide__inspector',
      '.la-dashboard', '.la-toc', '.la-toc__list', '.la-article',
      '.la-hero'
    ];
    const allowed = { visible: 1, hidden: 1, clip: 1 };
    const offenders = [];
    for (let s = 0; s < sels.length; s++) {
      const nodes = document.querySelectorAll(sels[s]);
      for (let i = 0; i < nodes.length; i++) {
        const cs = getComputedStyle(nodes[i]);
        // overflow-x / overflow-y resolve to the longhand values.
        if (!allowed[cs.overflowX] || !allowed[cs.overflowY]) {
          offenders.push(sels[s] + ' {' + cs.overflowX + '/' + cs.overflowY + '}');
        }
      }
    }
    return { offenders: offenders, checked: sels.length };
  });
  const ok = res.offenders.length === 0;
  record(
    'layout_no_nested_scroll',
    ok ? 'PASS' : 'FAIL',
    'every layout element has overflow ∈ {visible,hidden,clip} — no inner scroller',
    JSON.stringify(res)
  );
}

// ── P2 tests ────────────────────────────────────────────────────────

async function testSubgridAlign(page) {
  // Group 2b: subgrid aligns the card rows across the .la-cardrow. With
  // one card carrying a 2-line title, the footers of all cards still
  // share the same offsetTop (the subgrid row track is shared).
  if (!(await setup(page, GRIDS))) {
    record('layout_subgrid_align', 'FAIL', 'subgrid aligns card rows', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const footers = document.querySelectorAll('.la-cardrow .la-card__footer');
    const tops = [];
    for (let i = 0; i < footers.length; i++) {
      tops.push(Math.round(footers[i].getBoundingClientRect().top));
    }
    let aligned = tops.length >= 2;
    for (let i = 1; i < tops.length; i++) {
      if (Math.abs(tops[i] - tops[0]) > 1) aligned = false;
    }
    return { footerTops: tops, aligned: aligned };
  });
  record(
    'layout_subgrid_align',
    res.aligned ? 'PASS' : 'FAIL',
    '.la-card footers share a baseline row across the card row (subgrid)',
    JSON.stringify(res)
  );
}

async function testIdeCollapse(page) {
  // Group 2c: clicking the [data-la-toggle] button flips
  // data-la-sidebar open↔closed, mirrors aria-expanded, and the closed
  // state collapses the FIRST GRID TRACK to 0. The track width is read
  // from the resolved `grid-template-columns` — the sidebar element's
  // bounding box still includes its child's padding inside the
  // `overflow:hidden` collapse clip, so the track value is the precise
  // signal that the column collapsed.
  if (!(await setup(page, GRIDS))) {
    record('layout_ide_collapse', 'FAIL', 'IDE sidebar collapse toggle works', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const btn = document.querySelector('[data-la-toggle]');
    const ide = document.querySelector('.la-ide');
    // The resolved grid-template-columns is a space-separated px list;
    // the first entry is the sidebar track.
    const firstTrack = function () {
      var cols = getComputedStyle(ide).gridTemplateColumns.trim().split(/\s+/);
      return parseFloat(cols[0]) || 0;
    };
    const before = {
      state: ide.getAttribute('data-la-sidebar'),
      aria: btn.getAttribute('aria-expanded'),
      track: firstTrack()
    };
    btn.click();
    const after = {
      state: ide.getAttribute('data-la-sidebar'),
      aria: btn.getAttribute('aria-expanded'),
      track: firstTrack()
    };
    return { before: before, after: after };
  });
  const ok =
    res.before.state === 'open' &&
    res.after.state === 'closed' &&
    res.before.aria === 'true' &&
    res.after.aria === 'false' &&
    res.before.track > 1 &&
    res.after.track < 1;
  record(
    'layout_ide_collapse',
    ok ? 'PASS' : 'FAIL',
    'toggle flips data-la-sidebar + aria-expanded; closed collapses the sidebar grid track to 0',
    JSON.stringify(res)
  );
}

async function testDashboardSpan(page) {
  // Group 2d: data-span children occupy their fraction of the 12-col
  // .la-dashboard — span-8 ≈ 8/12, span-4 ≈ 4/12 of the content width.
  if (!(await setup(page, GRIDS))) {
    record('layout_dashboard_span', 'FAIL', 'data-span sizes dashboard children', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const dash = document.querySelector('.la-dashboard');
    const c8 = dash.querySelector('[data-span="8"]');
    const c4 = dash.querySelector('[data-span="4"]');
    const w8 = c8.getBoundingClientRect().width;
    const w4 = c4.getBoundingClientRect().width;
    return { w8: w8, w4: w4, ratio: w8 / w4 };
  });
  // 8:4 → ratio ≈ 2 (gap pulls it slightly off).
  const ok = res.ratio > 1.7 && res.ratio < 2.4;
  record(
    'layout_dashboard_span',
    ok ? 'PASS' : 'FAIL',
    '[data-span="8"] ≈ 2x [data-span="4"] width in the 12-col dashboard',
    JSON.stringify(res)
  );
}

async function testStickyHeader(page) {
  // Group 4: scrolling past the threshold adds .is-scrolled to the
  // .la-header (its block-end border becomes non-transparent); scrolling
  // back to the top removes it.
  if (!(await setup(page, GRIDS))) {
    record('layout_sticky_header', 'FAIL', 'sticky header gains .is-scrolled', 'fixture never booted');
    return;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(80);
  const atTop = await page.evaluate(() =>
    document.querySelector('.la-header').classList.contains('is-scrolled'));
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(120);
  const scrolled = await page.evaluate(() =>
    document.querySelector('.la-header').classList.contains('is-scrolled'));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  const backTop = await page.evaluate(() =>
    document.querySelector('.la-header').classList.contains('is-scrolled'));
  const ok = atTop === false && scrolled === true && backTop === false;
  record(
    'layout_sticky_header',
    ok ? 'PASS' : 'FAIL',
    'scrolling toggles .is-scrolled on the sticky header',
    JSON.stringify({ atTop, scrolled, backTop })
  );
}

async function testRtlMirror(page) {
  // Group 8 (RTL): with dir="rtl" on the root, the sidebar of
  // .la-grid--2-1 flips to the inline-start (visually the right) side —
  // proving every layout rule uses logical properties.
  if (!(await setup(page, GRIDS))) {
    record('layout_rtl_mirror', 'FAIL', 'RTL mirrors the layout', 'fixture never booted');
    return;
  }
  const ltr = await page.evaluate(() => {
    const grid = document.querySelector('.la-grid--2-1');
    const main = grid.querySelector('[data-ve-id="region-content"]');
    const side = grid.querySelector('[data-ve-id="region-sidebar"]');
    return {
      mainLeft: main.getBoundingClientRect().left,
      sideLeft: side.getBoundingClientRect().left
    };
  });
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.waitForTimeout(60);
  const rtl = await page.evaluate(() => {
    const grid = document.querySelector('.la-grid--2-1');
    const main = grid.querySelector('[data-ve-id="region-content"]');
    const side = grid.querySelector('[data-ve-id="region-sidebar"]');
    return {
      mainLeft: main.getBoundingClientRect().left,
      sideLeft: side.getBoundingClientRect().left
    };
  });
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; });
  // LTR: main is left of sidebar. RTL: main is right of sidebar (mirrored).
  const ok = ltr.mainLeft < ltr.sideLeft && rtl.mainLeft > rtl.sideLeft;
  record(
    'layout_rtl_mirror',
    ok ? 'PASS' : 'FAIL',
    'dir="rtl" flips the .la-grid--2-1 sidebar to the inline-start side',
    JSON.stringify({ ltr, rtl })
  );
}

// ── P3 tests ────────────────────────────────────────────────────────

async function testDeviceParams(page) {
  // Group 7a: the four --dev-* custom properties size the .la-device
  // frame; .la-device--no-notch hides the ::before notch.
  if (!(await setup(page, GRIDS))) {
    record('layout_device_params', 'FAIL', '--dev-* props size the device frame', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const dev = document.querySelector('.la-device');
    const base = dev.getBoundingClientRect();
    // The fixture sets --dev-w:200px --dev-h:420px.
    const sizedRight =
      Math.abs(base.width - 200) < 2 && Math.abs(base.height - 420) < 2;
    // ::before (the notch) has non-zero size by default.
    const notch = getComputedStyle(dev, '::before');
    const notchVisibleDefault = notch.display !== 'none';
    // Toggle --no-notch and re-check.
    dev.classList.add('la-device--no-notch');
    const notch2 = getComputedStyle(dev, '::before');
    const notchHidden = notch2.display === 'none';
    dev.classList.remove('la-device--no-notch');
    return {
      sizedRight: sizedRight,
      width: base.width,
      height: base.height,
      notchVisibleDefault: notchVisibleDefault,
      notchHiddenWithModifier: notchHidden
    };
  });
  const ok =
    res.sizedRight &&
    res.notchVisibleDefault === true &&
    res.notchHiddenWithModifier === true;
  record(
    'layout_device_params',
    ok ? 'PASS' : 'FAIL',
    '.la-device sizes from --dev-*; --no-notch hides the ::before notch',
    JSON.stringify(res)
  );
}

async function testHeroLayers(page) {
  // Group 7b: the .la-hero::after ghost-text layer reads data-ghost, and
  // the hero is NOT scrollable despite the oversized ghost layer. The
  // hero uses `overflow:clip` — unlike `overflow:hidden`, clip
  // establishes no scroll container, so attempting to scroll the hero
  // leaves scrollTop/scrollLeft at 0 (the no-nested-scrollbars-correct
  // behaviour for a decoration clip).
  if (!(await setup(page, GRIDS))) {
    record('layout_hero_layers', 'FAIL', 'hero ghost layer + not scrollable', 'fixture never booted');
    return;
  }
  const res = await page.evaluate(() => {
    const hero = document.querySelector('.la-hero');
    const after = getComputedStyle(hero, '::after');
    const ghostContent = after.content;
    const ghostAttr = hero.getAttribute('data-ghost');
    // Try to scroll the hero — an overflow:clip box has no scroll
    // origin, so both offsets must stay 0.
    hero.scrollTop = 999;
    hero.scrollLeft = 999;
    return {
      ghostContent: ghostContent,
      ghostAttr: ghostAttr,
      ghostMatches: ghostContent.indexOf(ghostAttr) !== -1,
      notScrollable: hero.scrollTop === 0 && hero.scrollLeft === 0
    };
  });
  const ok = res.ghostMatches === true && res.notScrollable === true;
  record(
    'layout_hero_layers',
    ok ? 'PASS' : 'FAIL',
    '.la-hero::after renders data-ghost; overflow:clip keeps the hero non-scrollable',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  // P1
  testSpatialAliases,
  testReadingMeasure,
  testArticleBleed,
  testGrid21,
  testGridCollapse,
  testTocBuilt,
  testTocActive,
  testTocAnchors,
  testPrintMedia,
  testNoNestedScroll,
  // P2
  testSubgridAlign,
  testIdeCollapse,
  testDashboardSpan,
  testStickyHeader,
  testRtlMirror,
  // P3
  testDeviceParams,
  testHeroLayers
];

const page = await browser.getPage("layout-tests");

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
