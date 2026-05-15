// test-report-doc.js
//
// Dev-browser script — exercises scripts/amvcp-report-doc.js, the Phase-2
// non-element / cross-cutting runtime module (visualizing backlog §9 +
// §14 + §15 + §16, TRDD-352ef46a, Build #13).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpReportDoc` + Node `module.exports`). This suite loads it
// AS A BROWSER GLOBAL from report-doc-fixture.html — a self-contained
// page that loads amvcp-designmd.js then amvcp-report-doc.js, embeds a
// DESIGN.md, and (because window.__vcReportDocManualInit is set) lets a
// small inline boot script apply the engine tokens, inject the report-
// doc CSS, and call init() deterministically.
//
// Coverage (report-doc-spec.md §10 + §15.2 + §11):
//   1  injectReportDocCSS lands the <style id="ve-report-doc-styles">
//      and is idempotent (a second call is a no-op)
//   2  every callout variant resolves --vc-callout-accent off the right
//      --vc-color-* role (theme-driven recolor)
//   3  the whitepaper template counter-resets and adds the leading-zero
//      section number on h2::before
//   4  TOC scroll-spy adds .vc-toc-active to the link whose target is
//      currently in view
//   5  contrastRatio() returns a sane WCAG ratio for known pairs
//      (white-on-black ≈ 21:1, white-on-white = 1:1)
//   6  runGates(document) returns ok:true for a clean fixture page and
//      lists all 7 gates in the report
//   7  runGatesOnHtml(htmlText) runs the same 7 gates in static mode
//      and also returns ok:true for the fixture
//   8  the QA pipeline correctly FAILs the no-nested-scrollbars gate
//      when an inner-scroll <pre> is injected
//   9  light <-> dark recolors the doc shell (proves --vc-* swap works)
//   10 no nested scrollbars on the fixture itself — only the document
//      scrolls (the rule the QA pipeline enforces is satisfied)
//   11 a @media print block exists in the injected stylesheet (Cmd-P
//      gate the QA pipeline checks for)
//   12 loop-detection: failedTwice flips on the SECOND consecutive run
//      that fails the same gate for the same pageId
//   13 module self-init / dual export integrity — the public API surface
//      is intact, every name is a function or constant the spec calls
//      for, and the inline test hook (window.__veReportDoc) is wired
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/report-doc-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until both globals are installed AND the
// inline boot script has finished (window.__vrFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpReportDoc === 'object'
      && typeof window.amvcpReportDoc.runGates === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__vrFixtureReady === true || !!window.__vrFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vrFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testCssInjectedIdempotent(page) {
  // 1 — after boot, the <style id="ve-report-doc-styles"> is in the
  // head, AND a second injectReportDocCSS() call does NOT add another
  // (idempotent guard via STYLE_ID).
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_css_injected_idempotent', 'FAIL',
      'CSS injected and idempotent', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const before = document.querySelectorAll(
      'style#ve-report-doc-styles').length;
    window.amvcpReportDoc.injectReportDocCSS(document);
    window.amvcpReportDoc.injectReportDocCSS(document);
    const after = document.querySelectorAll(
      'style#ve-report-doc-styles').length;
    return { before: before, after: after };
  });
  const ok = res.before === 1 && res.after === 1;
  record('reportdoc_css_injected_idempotent', ok ? 'PASS' : 'FAIL',
    'injectReportDocCSS lands one <style>; a second call is a no-op',
    JSON.stringify(res));
}

async function testCalloutVariantsThemed(page) {
  // 2 — each .vc-callout--<variant> resolves its --vc-callout-accent off
  // the matching --vc-color-* role. The 5 accents must be five DISTINCT
  // values (proves the variant -> role mapping is wired correctly and
  // the engine actually painted each token).
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_callout_variants_themed', 'FAIL',
      'callout variants themed off --vc-color-*', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const ids = ['callout-tip', 'callout-warning', 'callout-info',
      'callout-note', 'callout-danger'];
    const accents = {};
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      accents[ids[i]] = getComputedStyle(el)
        .getPropertyValue('--vc-callout-accent').trim();
    }
    const seen = {};
    let distinct = 0;
    for (const k in accents) {
      if (accents[k] && !seen[accents[k]]) {
        seen[accents[k]] = true;
        distinct++;
      }
    }
    return { accents: accents, distinct: distinct };
  });
  const ok = res.distinct === 5
    && res.accents['callout-tip'].length > 0
    && res.accents['callout-danger'].length > 0;
  record('reportdoc_callout_variants_themed', ok ? 'PASS' : 'FAIL',
    'each of the 5 callout variants resolves a distinct --vc-color-* role',
    JSON.stringify(res));
}

async function testWhitepaperLeadingZero(page) {
  // 3 — the whitepaper template's CSS counter rule is present in the
  // injected stylesheet (Chromium's getComputedStyle returns the raw
  // counter() expression, not the resolved string, so we verify the
  // rule rather than the rendered text). Also verify the .vc-doc--
  // whitepaper modifier is on the article — the only other invariant
  // a template has is its `--vc-doc-measure` value, which should
  // resolve to 64ch on the whitepaper preset.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_whitepaper_leading_zero', 'FAIL',
      'whitepaper template wires up correctly', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    // 1. Walk the stylesheets for a rule whose selector text contains
    //    .vc-doc--whitepaper h2::before AND whose content references
    //    counter(vc-sec, decimal-leading-zero).
    let foundCounterRule = false;
    let foundResetRule = false;
    for (let s = 0; s < document.styleSheets.length; s++) {
      let rules;
      try { rules = document.styleSheets[s].cssRules; }
      catch (e) { continue; }
      if (!rules) { continue; }
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        if (rule.type !== 1) { continue; }   // CSSStyleRule
        const sel = rule.selectorText || '';
        const txt = rule.cssText || '';
        if (sel.indexOf('.vc-doc--whitepaper') !== -1
          && sel.indexOf('h2') !== -1
          && txt.indexOf('decimal-leading-zero') !== -1) {
          foundCounterRule = true;
        }
        if (sel === '.vc-doc--whitepaper'
          && txt.indexOf('counter-reset') !== -1
          && txt.indexOf('vc-sec') !== -1) {
          foundResetRule = true;
        }
      }
    }
    // 2. The .vc-doc--whitepaper measure resolves to 64ch.
    const article = document.getElementById('report-root');
    const measure = getComputedStyle(article)
      .getPropertyValue('--vc-doc-measure').trim();
    return {
      foundCounterRule: foundCounterRule,
      foundResetRule: foundResetRule,
      measure: measure,
      hasModifier: article.classList.contains('vc-doc--whitepaper')
    };
  });
  const ok = res.foundCounterRule === true
    && res.foundResetRule === true
    && res.measure === '64ch'
    && res.hasModifier === true;
  record('reportdoc_whitepaper_leading_zero', ok ? 'PASS' : 'FAIL',
    'whitepaper template wires counter-reset, h2::before counter, 64ch measure',
    JSON.stringify(res));
}

async function testTocScrollSpyHighlights(page) {
  // 4 — the TOC scroll-spy adds .vc-toc-active on the link whose target
  // is currently in view. Scroll the metrics section into view and
  // verify <a href="#sec-metrics"> picks up the active class.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_toc_scroll_spy_highlights', 'FAIL',
      'TOC scroll-spy highlights active section', s.error);
    return;
  }
  await page.evaluate(() =>
    document.getElementById('sec-metrics').scrollIntoView());
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => {
    const link = document.querySelector('.vc-toc a[href="#sec-metrics"]');
    return {
      hasActive: link ? link.classList.contains('vc-toc-active') : false,
      activeCount: document.querySelectorAll(
        '.vc-toc a.vc-toc-active').length
    };
  });
  // Exactly one link should be active at a time (the spy clears the
  // others before adding the new one).
  const ok = res.hasActive === true && res.activeCount === 1;
  record('reportdoc_toc_scroll_spy_highlights', ok ? 'PASS' : 'FAIL',
    'scrolling a section into view marks ONE TOC link .vc-toc-active',
    JSON.stringify(res));
}

async function testContrastRatioMath(page) {
  // 5 — contrastRatio() implements the WCAG 2.x formula correctly.
  // White-on-black is the maximum (≈21:1); same-color is the minimum
  // (1:1). A blue-on-white pairing should clear 4.5:1.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_contrast_ratio_math', 'FAIL',
      'WCAG contrast ratio math', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const cr = window.amvcpReportDoc.contrastRatio;
    return {
      whiteOnBlack: cr('#ffffff', '#000000'),
      whiteOnWhite: cr('#ffffff', '#ffffff'),
      blueOnWhite: cr('#1f4dbf', '#ffffff'),
      bogus: cr('not-a-color', '#000000')
    };
  });
  const ok = res.whiteOnBlack > 20.9 && res.whiteOnBlack < 21.1
    && Math.abs(res.whiteOnWhite - 1) < 0.001
    && res.blueOnWhite >= 4.5
    && res.bogus === 0;
  record('reportdoc_contrast_ratio_math', ok ? 'PASS' : 'FAIL',
    'WCAG ratio: 21:1 white/black, 1:1 same-color, 0 for unparseable',
    JSON.stringify(res));
}

async function testRunGatesDomReportShape(page) {
  // 6 — runGates(document) returns a QaReport with mode:"dom", a 7-entry
  // gates array, every gate id matched to a known one, and ok:true
  // (the fixture is intentionally clean).
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_run_gates_dom_report_shape', 'FAIL',
      'runGates(document) report shape + ok', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    window.amvcpReportDoc.resetLoopState();
    const r = window.amvcpReportDoc.runGates(document, 'fixture-dom');
    const ids = r.gates.map(function (g) { return g.id; });
    return {
      ok: r.ok,
      mode: r.mode,
      gateCount: r.gates.length,
      ids: ids,
      // Detail per gate so a failure pinpoints the offending gate.
      gates: r.gates.map(function (g) {
        return { id: g.id, status: g.status, detail: g.detail.slice(0, 80) };
      })
    };
  });
  const want = ['no-nested-scrollbars', 'wcag-contrast', 'reduced-motion',
    'print-css', 'semantic-html', 'banned-color', 'banned-font'];
  let allPresent = true;
  for (let i = 0; i < want.length; i++) {
    if (res.ids.indexOf(want[i]) === -1) { allPresent = false; }
  }
  const ok = res.mode === 'dom'
    && res.gateCount === 7
    && allPresent
    && res.ok === true;
  record('reportdoc_run_gates_dom_report_shape', ok ? 'PASS' : 'FAIL',
    'runGates(doc) yields a 7-gate DOM report and the fixture passes ok:true',
    JSON.stringify(res));
}

async function testRunGatesStaticOnHtml(page) {
  // 7 — runGatesOnHtml(htmlText) runs the same 7 gates against an HTML
  // string in Node-friendly static mode (no DOM, no computed styles).
  // Feed it a hand-rolled clean HTML stub that embeds the same DESIGN.md
  // as the fixture; assert the same gate shape + ok:true.
  // (We can't feed the fixture's own outerHTML because it would include
  // the injected report-doc <style> whose @media print block contains
  // sanctioned #ffffff/#000000 ink-on-paper constants — those would
  // legitimately trip the static banned-color regex even though they
  // are exempt by spec §15. The contract this test verifies is that
  // static mode RUNS the 7 gates and returns ok:true on a clean page.)
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_run_gates_static_on_html', 'FAIL',
      'runGatesOnHtml(htmlText) report shape', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    window.amvcpReportDoc.resetLoopState();
    // A clean, standalone HTML stub: real <main>, real <h1>/<h2>, a
    // @media print block, a prefers-reduced-motion block, the same
    // DESIGN.md as the fixture (so wcag-contrast and banned-color have
    // tokens to resolve), and zero inline hex colors in the body.
    const designmd = document.getElementById('ve-designmd').textContent;
    const html = '<!DOCTYPE html><html><head>'
      + '<style>'
      + '@media print { body { color: #333333; } }'
      + '@media (prefers-reduced-motion: reduce) { '
      + '  .x { transition: none; }'
      + '}'
      + 'body { font-family: var(--vc-font-body, Georgia, serif); '
      + '  color: var(--vc-color-content, #1f1a14); }'
      + '@keyframes z { from { opacity: 0; } to { opacity: 1; } }'
      + '</style>'
      + '<script type="text/design-md">' + designmd + '</' + 'script>'
      + '</head><body><main><article>'
      + '<h1>Stub doc</h1><h2>Section</h2>'
      + '<p>Body text under the section.</p>'
      + '</article></main></body></html>';
    const r = window.amvcpReportDoc.runGatesOnHtml(html, 'fixture-static');
    const ids = r.gates.map(function (g) { return g.id; });
    return {
      ok: r.ok,
      mode: r.mode,
      gateCount: r.gates.length,
      ids: ids,
      gates: r.gates.map(function (g) {
        return { id: g.id, status: g.status, detail: g.detail.slice(0, 80) };
      })
    };
  });
  const ok = res.mode === 'static'
    && res.gateCount === 7
    && res.ids.indexOf('no-nested-scrollbars') !== -1
    && res.ids.indexOf('print-css') !== -1
    && res.ok === true;
  record('reportdoc_run_gates_static_on_html', ok ? 'PASS' : 'FAIL',
    'runGatesOnHtml(html) runs the same 7 gates in static mode (ok:true)',
    JSON.stringify(res));
}

async function testGateNoNestedScrollbarsCatchesBadInsert(page) {
  // 8 — dynamically inject an element that uses overflow:auto on
  // overflowing content (the rule violation). runGates(document)'s
  // no-nested-scrollbars gate must FAIL it.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_gate_no_nested_scrollbars_catches_bad_insert', 'FAIL',
      'no-nested-scrollbars gate catches a bad insert', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    // Build a small inner-scroller — small clientHeight, large content,
    // overflow:auto. The gate should detect the inner scrollbar.
    const bad = document.createElement('div');
    bad.id = 'vr-inner-scroll-offender';
    bad.style.cssText = 'overflow:auto;height:80px;width:200px;'
      + 'position:fixed;top:-9999px;';
    bad.innerHTML = '<div style="height:1500px;width:1000px;'
      + 'background:#ddd;">tall content</div>';
    document.body.appendChild(bad);
    window.amvcpReportDoc.resetLoopState();
    const r = window.amvcpReportDoc.runGates(document, 'fixture-bad');
    let nested = null;
    for (let i = 0; i < r.gates.length; i++) {
      if (r.gates[i].id === 'no-nested-scrollbars') { nested = r.gates[i]; }
    }
    // Cleanup so other tests start clean.
    bad.parentNode.removeChild(bad);
    return {
      reportOk: r.ok,
      nestedStatus: nested ? nested.status : null,
      detail: nested ? nested.detail.slice(0, 120) : null,
      mentionsOffender: nested
        ? nested.detail.indexOf('vr-inner-scroll-offender') !== -1
        : false
    };
  });
  const ok = res.reportOk === false
    && res.nestedStatus === 'FAIL'
    && res.mentionsOffender === true;
  record('reportdoc_gate_no_nested_scrollbars_catches_bad_insert',
    ok ? 'PASS' : 'FAIL',
    'an inner-scroll <div> trips no-nested-scrollbars FAIL with element id',
    JSON.stringify(res));
}

async function testThemeRecolor(page) {
  // 9 — toggling the theme re-resolves --vc-color-canvas and
  // --vc-color-content, and the .vc-doc shell re-paints accordingly.
  // Compares the doc shell's computed background between light and dark.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_theme_recolor', 'FAIL',
      'doc shell recolors light <-> dark', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    window.__vrApplyTheme('light');
    const lightBg = getComputedStyle(
      document.getElementById('report-root')).backgroundColor;
    const lightFg = getComputedStyle(
      document.getElementById('report-root')).color;
    window.__vrApplyTheme('dark');
    const darkBg = getComputedStyle(
      document.getElementById('report-root')).backgroundColor;
    const darkFg = getComputedStyle(
      document.getElementById('report-root')).color;
    window.__vrApplyTheme('light');   // restore
    return {
      lightBg: lightBg, darkBg: darkBg,
      lightFg: lightFg, darkFg: darkFg
    };
  });
  const ok = res.lightBg.length > 0 && res.darkBg.length > 0
    && res.lightBg !== res.darkBg
    && res.lightFg !== res.darkFg;
  record('reportdoc_theme_recolor', ok ? 'PASS' : 'FAIL',
    '.vc-doc background + foreground both differ between light and dark',
    JSON.stringify(res));
}

async function testNoNestedScrollOnFixture(page) {
  // 10 — the fixture itself satisfies the no-nested-scrollbars rule:
  // every overflowing element is the document, never an inner box.
  // (This is the same contract Gate 1 enforces — proven independently
  // by walking the DOM ourselves so it cannot be hidden by a Gate-1
  // false PASS.)
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_no_nested_scroll_on_fixture', 'FAIL',
      'fixture has no nested scrollbars', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll('body *');
    const offenders = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'textarea' || el.isContentEditable) { continue; }
      const scrolls = cs.overflowX === 'auto' || cs.overflowX === 'scroll'
        || cs.overflowY === 'auto' || cs.overflowY === 'scroll';
      if (!scrolls) { continue; }
      if (el.scrollWidth > el.clientWidth + 1
        || el.scrollHeight > el.clientHeight + 1) {
        offenders.push((el.id || tag) + '.' + (el.className || ''));
      }
    }
    return { offenders: offenders };
  });
  const ok = res.offenders.length === 0;
  record('reportdoc_no_nested_scroll_on_fixture', ok ? 'PASS' : 'FAIL',
    'no .vc-* element creates an inner scroll axis on the fixture',
    JSON.stringify(res));
}

async function testPrintMediaRulePresent(page) {
  // 11 — the injected stylesheet contains a @media print block (the
  // gate the QA pipeline checks for). Walk document.styleSheets and
  // look for a CSSMediaRule whose mediaText mentions "print".
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_print_media_rule_present', 'FAIL',
      'a @media print block exists in the injected stylesheet', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    let found = false;
    let inOurSheet = false;
    for (let s = 0; s < document.styleSheets.length; s++) {
      let rules;
      try { rules = document.styleSheets[s].cssRules; }
      catch (e) { continue; }
      if (!rules) { continue; }
      const owner = document.styleSheets[s].ownerNode;
      const isOurSheet = owner && owner.id === 've-report-doc-styles';
      for (let r = 0; r < rules.length; r++) {
        const rule = rules[r];
        // CSSMediaRule.type === 4
        if (rule.type === 4 && rule.media && rule.media.mediaText
          && /print/i.test(rule.media.mediaText)) {
          found = true;
          if (isOurSheet) { inOurSheet = true; }
        }
      }
    }
    return { found: found, inOurSheet: inOurSheet };
  });
  const ok = res.found === true && res.inOurSheet === true;
  record('reportdoc_print_media_rule_present', ok ? 'PASS' : 'FAIL',
    'a @media print rule is present in the injected ve-report-doc-styles',
    JSON.stringify(res));
}

async function testLoopDetectionFlipsOnSecondFail(page) {
  // 12 — call runGates twice with the same pageId on a page where the
  // SAME gate fails both times. The second call must report
  // loop.failedTwice === true (the loop-detection contract, spec
  // §10.5). Use the same inner-scroll insertion technique as test 8 to
  // create a stable, repeatable failure.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_loop_detection_flips_on_second_fail', 'FAIL',
      'failedTwice flips on a second consecutive same-gate fail', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const bad = document.createElement('div');
    bad.id = 'vr-loop-offender';
    bad.style.cssText = 'overflow:auto;height:60px;width:200px;'
      + 'position:fixed;top:-9999px;';
    bad.innerHTML = '<div style="height:1500px;width:1000px;'
      + 'background:#ddd;">offender</div>';
    document.body.appendChild(bad);
    window.amvcpReportDoc.resetLoopState();
    const r1 = window.amvcpReportDoc.runGates(document, 'page-loop');
    const r2 = window.amvcpReportDoc.runGates(document, 'page-loop');
    bad.parentNode.removeChild(bad);
    return {
      first: { gate: r1.loop.gate, twice: r1.loop.failedTwice },
      second: { gate: r2.loop.gate, twice: r2.loop.failedTwice }
    };
  });
  const ok = res.first.gate === 'no-nested-scrollbars'
    && res.first.twice === false
    && res.second.gate === 'no-nested-scrollbars'
    && res.second.twice === true;
  record('reportdoc_loop_detection_flips_on_second_fail',
    ok ? 'PASS' : 'FAIL',
    'second consecutive same-gate fail (same pageId) sets failedTwice',
    JSON.stringify(res));
}

async function testApiSurfaceComplete(page) {
  // 13 — the public API surface is intact. Every name the spec calls
  // for is a function (or constant of the right shape), the test hook
  // window.__veReportDoc is wired, and the constants TEMPLATES /
  // CALLOUT_VARIANTS hold the expected lengths.
  const s = await setup(page);
  if (!s.ok) {
    record('reportdoc_api_surface_complete', 'FAIL',
      'public API + test hooks intact', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpReportDoc;
    const fns = ['injectReportDocCSS', 'init', 'refresh', 'runGates',
      'runGatesOnHtml', 'contrastRatio', 'resetLoopState'];
    let allFns = true;
    for (let i = 0; i < fns.length; i++) {
      if (typeof api[fns[i]] !== 'function') { allFns = false; }
    }
    const hook = window.__veReportDoc;
    const hookOk = !!hook && hook.cssInjected === true
      && typeof hook.runGates === 'function'
      && typeof hook.parseColor === 'function';
    return {
      allFns: allFns,
      templatesLen: (api.TEMPLATES || []).length,
      calloutsLen: (api.CALLOUT_VARIANTS || []).length,
      hookOk: hookOk,
      cssText: typeof api._cssText === 'string'
        && api._cssText.length > 1000,
      fixtureError: window.__vrFixtureError || ''
    };
  });
  const ok = res.allFns === true
    && res.templatesLen === 6
    && res.calloutsLen === 5
    && res.hookOk === true
    && res.cssText === true
    && res.fixtureError === '';
  record('reportdoc_api_surface_complete', ok ? 'PASS' : 'FAIL',
    'public API intact + 6 templates + 5 callouts + test hook wired',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testCssInjectedIdempotent,
  testCalloutVariantsThemed,
  testWhitepaperLeadingZero,
  testTocScrollSpyHighlights,
  testContrastRatioMath,
  testRunGatesDomReportShape,
  testRunGatesStaticOnHtml,
  testGateNoNestedScrollbarsCatchesBadInsert,
  testThemeRecolor,
  testNoNestedScrollOnFixture,
  testPrintMediaRulePresent,
  testLoopDetectionFlipsOnSecondFail,
  testApiSurfaceComplete
];

const page = await browser.getPage("report-doc-tests");

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
