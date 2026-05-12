// test-multiselect.js
//
// Dev-browser script — exercises the multi-select element-toggle flow
// added in TRDD-7a980994 phase 1, plus the floating Submit/Exit buttons
// and the ESC clear shortcut. Single click on any [data-ve-id] toggles
// the element's membership in window.veSelection. The new wave of
// coverage (TRDD-5f41ad36 D1+D2+D5) verifies:
//
//   - single-click adds entry
//   - second click on a different element adds (multi-select semantics)
//   - clicking the same element again removes
//   - ESC clears the entire set
//   - Submit posts {kind:'submit', count:N, selections:[…]}
//   - Exit posts {kind:'exit', count:0, selections:[]}
//   - multi-click on prose: depth grammar 1 (letter) → 2 (word) → 3 (block)
//   - oversized POST gets rejected with 413 (A1 content-length cap)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>
//
// Pre-conditions:
//   - server up on http://127.0.0.1:8767/
//   - tests/fixtures/multiselect.html (3 cards with data-ve-id)
//   - tests/fixtures/sample-report.html (for the prose depth test)

const FIXTURE = "http://127.0.0.1:8767/multiselect.html";
const PROSE_FIXTURE = "http://127.0.0.1:8767/paragraph-numbering-depth.html";
const LAST_SELECT = "/__ve-test-last-select";
const RESET_SELECT = "/__ve-test-reset-last-select";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page, fixtureUrl) {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto((fixtureUrl || FIXTURE) + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  // Wipe the captured /__ve-select payload so each test starts clean.
  await page.evaluate(async (url) => {
    try { await fetch(url, { method: 'GET' }); } catch (_) {}
  }, RESET_SELECT);
}

async function clickCard(page, cardId) {
  const pos = await page.evaluate((id) => {
    const el = document.querySelector('[data-ve-id="' + id + '"]');
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, cardId);
  if (!pos) return false;
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(200);
  return true;
}

async function readSelection(page) {
  return page.evaluate(() => (window.veSelection || []).map((e) => e.id || e.entryId));
}

async function readLastSelectPayload(page) {
  return page.evaluate(async (url) => {
    const r = await fetch(url + '?_=' + Date.now());
    if (!r.ok) return null;
    const j = await r.json();
    return j ? j.payload : null;
  }, LAST_SELECT);
}

// ── Tests ───────────────────────────────────────────────────────────

async function testSingleClickAddsEntry(page) {
  // D1.1 — single click on a [data-ve-id] adds the element to veSelection.
  await setup(page);
  const ok = await clickCard(page, 'card-alpha');
  if (!ok) {
    record('multiselect_single_click_adds', 'FAIL', 'single click adds entry', 'card not found');
    return;
  }
  const sel = await readSelection(page);
  const pass = sel.length === 1 && sel[0] === 'card-alpha';
  record(
    'multiselect_single_click_adds',
    pass ? 'PASS' : 'FAIL',
    'single click on a [data-ve-id] card adds it to veSelection',
    JSON.stringify(sel)
  );
}

async function testSecondClickAddsSecond(page) {
  // D1.2 — clicking a SECOND card with the first still selected leaves
  // both in the set (multi-select semantics — no ctrl modifier needed).
  await setup(page);
  await clickCard(page, 'card-alpha');
  await clickCard(page, 'card-beta');
  const sel = await readSelection(page);
  const pass = sel.length === 2
    && sel.indexOf('card-alpha') >= 0
    && sel.indexOf('card-beta') >= 0;
  record(
    'multiselect_second_click_adds',
    pass ? 'PASS' : 'FAIL',
    'clicking a second card extends the selection (no modifier)',
    JSON.stringify(sel)
  );
}

async function testRepeatClickRemoves(page) {
  // D1.3 — clicking the SAME card a second time removes it from the set.
  await setup(page);
  await clickCard(page, 'card-alpha');
  await clickCard(page, 'card-beta');
  await clickCard(page, 'card-alpha');   // toggle off
  const sel = await readSelection(page);
  const pass = sel.length === 1 && sel[0] === 'card-beta';
  record(
    'multiselect_repeat_click_removes',
    pass ? 'PASS' : 'FAIL',
    'clicking the same card again removes it (toggle semantics)',
    JSON.stringify(sel)
  );
}

async function testEscClearsSelection(page) {
  // D2.1 — ESC clears the entire veSelection set + repaints the cards.
  await setup(page);
  await clickCard(page, 'card-alpha');
  await clickCard(page, 'card-beta');
  await clickCard(page, 'card-gamma');
  const before = await readSelection(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const after = await readSelection(page);
  const pass = before.length === 3 && after.length === 0;
  record(
    'multiselect_esc_clears',
    pass ? 'PASS' : 'FAIL',
    'ESC clears every entry from veSelection',
    JSON.stringify({ before, after })
  );
}

async function testSubmitButtonPostsPayload(page) {
  // D2.2 — clicking the floating corner button (top-right) POSTs the
  // current veSelection as {kind:'exit', count:N, selections:[…]} to
  // /__ve-select. Per the e516350 contract ("corner buttons NEVER
  // submit"), the corner click is a DISMISS — the page's own visible
  // Submit/Send affordance handles real submission. So the test now
  // verifies the corner sends an EXIT payload that still CARRIES the
  // selections, not a submit payload. The "submit_posts" name is kept
  // for git-blame continuity even though the kind it asserts is exit.
  await setup(page);
  await clickCard(page, 'card-alpha');
  await clickCard(page, 'card-gamma');
  // Click the top-right corner button (id=ve-submit-tr).
  const btn = await page.evaluate(() => {
    const b = document.getElementById('ve-submit-tr');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!btn) {
    record('multiselect_submit_posts', 'FAIL', 'corner button posts payload', 'button missing');
    return;
  }
  await page.mouse.click(btn.x, btn.y);
  // Give the POST round-trip time (sendBeacon is async).
  await page.waitForTimeout(500);
  const payload = await readLastSelectPayload(page);
  const pass = payload
    && payload.kind === 'exit'
    && payload.count === 2
    && Array.isArray(payload.selections)
    && payload.selections.length === 2
    && payload.selections.some((s) => s.id === 'card-alpha')
    && payload.selections.some((s) => s.id === 'card-gamma');
  record(
    'multiselect_submit_posts',
    pass ? 'PASS' : 'FAIL',
    'corner button POSTs {kind:exit, count, selections:[…]} per e516350 dismiss-only contract',
    JSON.stringify(payload)
  );
}

async function testExitButtonPostsEmptyPayload(page) {
  // D2.3 — with NO selection, clicking the Submit button (which doubles
  // as Exit when veSelection is empty) posts {kind:'exit', count:0,
  // selections:[]}. The runtime auto-derives the kind based on count.
  await setup(page);
  // Don't click any cards — the floating button now means "Exit".
  const btn = await page.evaluate(() => {
    const b = document.getElementById('ve-submit-tr');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!btn) {
    record('multiselect_exit_posts', 'FAIL', 'Exit button posts payload', 'button missing');
    return;
  }
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(500);
  const payload = await readLastSelectPayload(page);
  const pass = payload
    && payload.kind === 'exit'
    && payload.count === 0
    && Array.isArray(payload.selections)
    && payload.selections.length === 0;
  record(
    'multiselect_exit_posts',
    pass ? 'PASS' : 'FAIL',
    'empty selection + Submit click posts {kind:exit, count:0}',
    JSON.stringify(payload)
  );
}

async function testProseDepthChain(page) {
  // D5 (TRDD-5f41ad36) — multi-click depth grammar inside [data-ve-prose].
  // The runtime uses SHIFTED-BY-1 grammar (handleProseClick comment in
  // amvcp-runtime.js): the FIRST click NEVER paints, it just registers
  // the chain start. The 2nd click within 500 ms is the first one that
  // paints (depth=1 = letter), the 3rd paints depth=2 = word, the 4th
  // paints depth=3 = block. Each click REPLACES the previous chain entry
  // at a deeper depth, so the chain only ever has one entry at any time
  // (the latest depth). This matches the convention that a single click
  // is cursor-only and a double-click selects a word.
  await setup(page, PROSE_FIXTURE);
  // The sample report has paragraphs inside <article data-ve-prose>.
  const t = await page.evaluate(() => {
    const p = document.querySelector('[data-ve-prose] p[data-ve-pnum]');
    if (!p) return null;
    p.scrollIntoView({ block: 'center' });
    // Find the largest text-node child for a stable click point. Avoid
    // the .ve-pnum marker (which IS clickable as the section toggle).
    const textNodes = [];
    function walk(node) {
      for (const c of node.childNodes) {
        if (c.nodeType === Node.TEXT_NODE && c.textContent.trim().length > 8) {
          textNodes.push(c);
        } else if (c.nodeType === Node.ELEMENT_NODE && !c.classList.contains('ve-pnum')) {
          walk(c);
        }
      }
    }
    walk(p);
    if (textNodes.length === 0) return null;
    // Pick the longest text node so the click definitely lands inside a
    // word (not on whitespace), and aim for the middle so word/block
    // boundaries on either side are plausible.
    textNodes.sort((a, b) => b.textContent.length - a.textContent.length);
    const target = textNodes[0];
    const range = document.createRange();
    range.selectNode(target);
    const r = range.getBoundingClientRect();
    return { x: r.x + r.width / 4, y: r.y + r.height / 2 };
  });
  if (!t) {
    record('multiselect_prose_depth_chain', 'FAIL', 'prose multi-click depth chain', 'no prose paragraph');
    return;
  }
  // Click 1: NO PAINT (registers chain start only).
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(80);
  const afterOne = await page.evaluate(() => (window.veSelection || []).filter((e) => e.kind === 'text').map((e) => ({ depth: e.depth, len: (e.text || '').length })));
  // Click 2: paints depth=1 (letter).
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(80);
  const afterTwo = await page.evaluate(() => (window.veSelection || []).filter((e) => e.kind === 'text').map((e) => ({ depth: e.depth, len: (e.text || '').length })));
  // Click 3: paints depth=2 (word).
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(80);
  const afterThree = await page.evaluate(() => (window.veSelection || []).filter((e) => e.kind === 'text').map((e) => ({ depth: e.depth, len: (e.text || '').length })));
  // Click 4: paints depth=3 (block).
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(80);
  const afterFour = await page.evaluate(() => (window.veSelection || []).filter((e) => e.kind === 'text').map((e) => ({ depth: e.depth, len: (e.text || '').length })));

  // Assertions per the SHIFTED-BY-1 grammar:
  //   afterOne   = []                       (no paint on first click)
  //   afterTwo   = [{depth:1, len:1}]       (one letter)
  //   afterThree = [{depth:2, len:>=1}]     (one word; replaces depth=1)
  //   afterFour  = [{depth:3, len:>word}]   (a block; replaces depth=2)
  // We deliberately don't assert exact text lengths beyond ordering —
  // the chosen click point may land on a word that's shorter than the
  // surrounding block. We assert depths and that block > word > letter.
  const pass = afterOne.length === 0
    && afterTwo.length === 1 && afterTwo[0].depth === 1
    && afterThree.length === 1 && afterThree[0].depth === 2
    && afterFour.length === 1 && afterFour[0].depth === 3
    && afterTwo[0].len <= afterThree[0].len
    && afterThree[0].len <= afterFour[0].len;
  record(
    'multiselect_prose_depth_chain',
    pass ? 'PASS' : 'FAIL',
    'prose: 1st click no paint, 2nd=letter, 3rd=word, 4th=block (SHIFTED-BY-1)',
    JSON.stringify({ afterOne, afterTwo, afterThree, afterFour })
  );
}

async function testOversizedPostRejected(page) {
  // A1 (TRDD-5f41ad36) — content-length DoS bound. POSTing a body
  // larger than the per-endpoint cap (256 KB for /__ve-comment, 2 MB
  // for /__ve-select) returns HTTP 413. We fire one oversized POST
  // against /__ve-comment because it has the smaller cap and is the
  // cheapest to exceed; the same code path applies to /__ve-select.
  await setup(page);
  const status = await page.evaluate(async () => {
    // Build a payload just over 256 KB. The wire format includes JSON
    // overhead so we pad to 270K bytes.
    const big = 'x'.repeat(270 * 1024);
    const body = JSON.stringify({ threadId: 'a-tid', text: big });
    const r = await fetch('/__ve-comment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    return r.status;
  });
  const pass = status === 413;
  record(
    'multiselect_oversized_post_413',
    pass ? 'PASS' : 'FAIL',
    'oversized POST to /__ve-comment returns HTTP 413',
    JSON.stringify({ status })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSingleClickAddsEntry,
  testSecondClickAddsSecond,
  testRepeatClickRemoves,
  testEscClearsSelection,
  testSubmitButtonPostsPayload,
  testExitButtonPostsEmptyPayload,
  testProseDepthChain,
  testOversizedPostRejected,
];

const page = await browser.getPage("multiselect-tests");

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
