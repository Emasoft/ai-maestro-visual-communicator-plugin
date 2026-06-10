// test-slide-delegated.js
//
// Dev-browser script — proves the JSON-deck DELEGATED-BLOCK path
// (code / diagram / chart) renders end-to-end through the sibling
// renderer modules (TRDD-503fb3af G1).
//
// Before the fix, scripts/amvcp-slide.js called
// `window.<module>.renderInto(host, spec)` but NO renderer defined
// `renderInto`, so ANY deck with a delegated block threw
// "window.amvcp*.renderInto is not available" at render time — the
// feature never worked. This suite loads slide-delegated-fixture.html
// (which loads amvcp-slide.js + amvcp-code-highlight.js + amvcp-chart.js
// + amvcp-diagram.js and renders a one-slide deck carrying all three
// delegated block types) and asserts each block produced real DOM.
//
// Notations are limited to what window.amvcpDiagram actually renders
// (scene-graph + ASCII); Mermaid/Graphviz live in amvcp-graph-diagrams,
// not in slide delegated blocks.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/slide-delegated-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the engine globals are installed AND
// the inline boot script finished (window.__vsdFixtureReady) or errored.
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpSlideDeck === 'object'
      && typeof window.amvcpSlideDeck.renderDeck === 'function'
      && typeof window.amvcpCodeHighlight === 'object'
      && typeof window.amvcpChart === 'object'
      && typeof window.amvcpDiagram === 'object'
      && (window.__vsdFixtureReady === true || !!window.__vsdFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vsdFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testDeckWithDelegatedBlocksRenders(page) {
  // 1 — the whole deck renders without the old "renderInto is not
  // available" throw. This is the headline regression guard for G1.
  const s = await setup(page);
  const renderIntoThrow = /renderInto is not available/i.test(s.error || '');
  const res = await page.evaluate(() => ({
    viewportMounted: !!document.querySelector('.vsd-viewport'),
    delegateCount: document.querySelectorAll('.vsd-delegate').length,
    fixtureError: window.__vsdFixtureError || ''
  }));
  const ok = s.ok
    && !renderIntoThrow
    && res.viewportMounted === true
    && res.delegateCount === 3
    && res.fixtureError === '';
  record('slide_delegated_deck_renders', ok ? 'PASS' : 'FAIL',
    'deck with code+diagram+chart delegated blocks renders (no renderInto throw)',
    JSON.stringify(Object.assign({ setupErr: s.error || '' }, res)));
}

async function testDelegatedCodeBlock(page) {
  // 2 — the delegated CODE block renders the amvcp-code-highlight
  // .ve-code-block <pre><code> structure with the source visible.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_delegated_code_block', 'FAIL',
      'delegated code block renders highlighted .ve-code-block', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.querySelector('[data-vsd-delegate="code"]');
    const codeEl = host && host.querySelector('.ve-code-block pre code');
    return {
      hostPresent: !!host,
      codeBlockPresent: !!codeEl,
      langClass: codeEl ? codeEl.className : '',
      hasSource: !!(codeEl && /cache\.get/.test(codeEl.textContent || ''))
    };
  });
  const ok = res.hostPresent && res.codeBlockPresent
    && /language-js/.test(res.langClass) && res.hasSource;
  record('slide_delegated_code_block', ok ? 'PASS' : 'FAIL',
    'delegated code block → .ve-code-block <pre><code class=language-js> with source',
    JSON.stringify(res));
}

async function testDelegatedDiagramBlock(page) {
  // 3 — the delegated DIAGRAM block (ascii notation) renders into a
  // selectable .ve-ascii-diagram host with the art as text content.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_delegated_diagram_block', 'FAIL',
      'delegated ascii diagram block renders selectable host', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.querySelector('[data-vsd-delegate="diagram"]');
    return {
      hostPresent: !!host,
      asciiSelectable: !!(host && host.getAttribute('data-ve-ascii-selectable') === '1'),
      asciiClass: !!(host && host.classList.contains('ve-ascii-diagram')),
      hasArt: !!(host && /client/.test(host.textContent || '')
        && /cache/.test(host.textContent || ''))
    };
  });
  const ok = res.hostPresent && res.asciiSelectable && res.asciiClass && res.hasArt;
  record('slide_delegated_diagram_block', ok ? 'PASS' : 'FAIL',
    'delegated ascii diagram → .ve-ascii-diagram[data-ve-ascii-selectable] with art',
    JSON.stringify(res));
}

async function testDelegatedChartBlock(page) {
  // 4 — the delegated CHART block (Chart.js-shaped data, bar type)
  // renders a real chart figure (svg/canvas/figure, any backend) into
  // its host — not a blank placeholder.
  const s = await setup(page);
  if (!s.ok) {
    record('slide_delegated_chart_block', 'FAIL',
      'delegated chart block renders a chart figure', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.querySelector('[data-vsd-delegate="chart"]');
    const mark = host && host.querySelector(
      'svg, canvas, figure, .ve-chart, [data-ve-chart-type], [class*="chart"]');
    return {
      hostPresent: !!host,
      childCount: host ? host.childElementCount : 0,
      chartMarkPresent: !!mark,
      markTag: mark ? mark.tagName.toLowerCase() : ''
    };
  });
  const ok = res.hostPresent && res.childCount > 0 && res.chartMarkPresent;
  record('slide_delegated_chart_block', ok ? 'PASS' : 'FAIL',
    'delegated chart block → a chart figure (svg/canvas/figure) in the host',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testDeckWithDelegatedBlocksRenders,
  testDelegatedCodeBlock,
  testDelegatedDiagramBlock,
  testDelegatedChartBlock
];

const page = await browser.getPage("slide-delegated-tests");

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
