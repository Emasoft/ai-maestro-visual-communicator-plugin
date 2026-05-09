// test-code-gutter.js
//
// Dev-browser script — exercises the code line-number gutter
// (TRDD-7a980994 phase 6). Every <pre><code> gets an injected
// .ve-code-gutter on its left with one .ve-code-linenum button per
// physical line. Click semantics:
//
//   1 click   = toggle a single kind:'codeline' for that line
//   drag N→M  = push a kind:'codelines' for the inclusive interval
//   2 clicks  = select all lines (kind:'codelines' 1..N)
//   3 clicks  = clear every codeline / codelines for that block
//
// TRDD-5f41ad36 D4 — verifies single-line click + drag selection.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/code-gutter.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
}

async function gutterButtonRect(page, line) {
  return page.evaluate((ln) => {
    const btns = Array.from(document.querySelectorAll('.ve-code-linenum'));
    const b = btns.find((x) => parseInt(x.getAttribute('data-line'), 10) === ln);
    if (!b) return null;
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, line);
}

async function readSelection(page) {
  // Wait for the runtime to settle the click-chain timer (350 ms in the
  // implementation). We don't know exactly when the scheduler will fire,
  // so we poll for any 'codeline' / 'codelines' entry.
  return page.evaluate(() => (window.veSelection || []).filter(
    (e) => e.kind === 'codeline' || e.kind === 'codelines'
  ));
}

// ── Tests ───────────────────────────────────────────────────────────

async function testSingleLineClickSelects(page) {
  // D4.1 — single click on the line-2 gutter button toggles a
  // kind:'codeline' entry for that line. The runtime debounces clicks
  // through a 350 ms chain timer (so 1 click vs 2 clicks vs 3 clicks
  // can be distinguished); we wait > 350 ms after mouseup before
  // asserting.
  await setup(page);
  const pos = await gutterButtonRect(page, 2);
  if (!pos) {
    record('code_gutter_single_line', 'FAIL', 'single-line click', 'gutter button missing');
    return;
  }
  // Use mousedown + mouseup so the runtime's down/up listeners both fire.
  await page.mouse.move(pos.x, pos.y);
  await page.mouse.down();
  await page.mouse.up();
  // Give the 350 ms chain timer + repaint time to land.
  await page.waitForTimeout(550);
  const sel = await readSelection(page);
  const ok = sel.length === 1
    && sel[0].kind === 'codeline'
    && sel[0].line === 2;
  record(
    'code_gutter_single_line',
    ok ? 'PASS' : 'FAIL',
    'single click on gutter line 2 → kind:codeline, line:2',
    JSON.stringify(sel)
  );
}

async function testDragSelectsRange(page) {
  // D4.2 — mousedown on line-1, drag to line-3, mouseup. Should push
  // a kind:'codelines' with fromLine=1, toLine=3. The runtime's mouseover
  // tracking flips `dragging=true` when the cursor enters a different
  // line button, so a real drag (not a single click on the start line)
  // is required.
  await setup(page);
  const start = await gutterButtonRect(page, 1);
  const end   = await gutterButtonRect(page, 3);
  if (!start || !end) {
    record('code_gutter_drag_range', 'FAIL', 'drag selects range', 'gutter buttons missing');
    return;
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  // Multi-step move so mouseover fires on the intermediate line buttons.
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const sel = await readSelection(page);
  const ok = sel.length === 1
    && sel[0].kind === 'codelines'
    && sel[0].fromLine === 1
    && sel[0].toLine === 3;
  record(
    'code_gutter_drag_range',
    ok ? 'PASS' : 'FAIL',
    'drag from line 1 to line 3 → kind:codelines, [1, 3]',
    JSON.stringify(sel)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSingleLineClickSelects,
  testDragSelectsRange,
];

const page = await browser.getPage("code-gutter-tests");

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
