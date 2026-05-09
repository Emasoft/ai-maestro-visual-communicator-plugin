// test-table-form.js
//
// Dev-browser script — exercises the table-as-question (form selection)
// flow in the runtime. Tables marked with `data-ve-type="table-form"`
// + `data-ve-mode="single|multi"` get an injected radio/checkbox column,
// a Submit button, and (if a free-text row is present) a one-line
// auto-select. Submitting POSTs to /__ve-select via the legacy
// postSelection() path with payload:
//
//   { id: 've-table-<id>-submit',
//     type: 'table-form',
//     label: '<summary>',
//     data: { tableId, question, mode, selected:[{id,label[,text]}…], text } }
//
// TRDD-5f41ad36 D3 — verifies single-radio, multi-checkbox, and
// free-text submission paths.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const SINGLE = "http://127.0.0.1:8767/table-form-single.html";
const MULTI  = "http://127.0.0.1:8767/table-form-multi.html";
const FREE   = "http://127.0.0.1:8767/table-form-freetext.html";
const LAST_SELECT = "/__ve-test-last-select";
const RESET_SELECT = "/__ve-test-reset-last-select";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page, url) {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(url + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(async (u) => {
    try { await fetch(u, { method: 'GET' }); } catch (_) {}
  }, RESET_SELECT);
}

async function clickRowControl(page, rowId) {
  // Click the checkbox/radio that the runtime injects into the leading
  // cell of every <tr data-ve-row-id="...">.
  const ok = await page.evaluate((rid) => {
    const inp = document.querySelector('tr[data-ve-row-id="' + rid + '"] input[data-ve-control]');
    if (!inp) return false;
    inp.scrollIntoView({ block: 'center' });
    inp.click();
    return true;
  }, rowId);
  await page.waitForTimeout(150);
  return ok;
}

async function clickFormSubmit(page) {
  const pos = await page.evaluate(() => {
    const b = document.querySelector('[data-ve-form-submit]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!pos) return false;
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(500);
  return true;
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

async function testSingleRadioSubmit(page) {
  // D3.1 — single-mode table: pick one row, click Submit.
  // Expect payload.type === 'table-form', payload.data.mode === 'single',
  // payload.data.selected === [{id:'opt-svelte', label:'Svelte'}].
  await setup(page, SINGLE);
  await clickRowControl(page, 'opt-svelte');
  const submitted = await clickFormSubmit(page);
  if (!submitted) {
    record('table_form_single_radio', 'FAIL', 'single-radio submit', 'submit button missing');
    return;
  }
  const payload = await readLastSelectPayload(page);
  const ok = payload
    && payload.type === 'table-form'
    && payload.data
    && payload.data.mode === 'single'
    && Array.isArray(payload.data.selected)
    && payload.data.selected.length === 1
    && payload.data.selected[0].id === 'opt-svelte'
    && payload.data.selected[0].label === 'Svelte';
  record(
    'table_form_single_radio',
    ok ? 'PASS' : 'FAIL',
    'single-mode: pick one row → POST {type:table-form, mode:single, selected:[…]}',
    JSON.stringify(payload)
  );
}

async function testMultiCheckboxSubmit(page) {
  // D3.2 — multi-mode table: tick TWO checkboxes, click Submit.
  // Expect payload.data.mode === 'multi' and 2 entries in selected.
  await setup(page, MULTI);
  await clickRowControl(page, 'opt-py');
  await clickRowControl(page, 'opt-rust');
  const submitted = await clickFormSubmit(page);
  if (!submitted) {
    record('table_form_multi_checkbox', 'FAIL', 'multi-checkbox submit', 'submit button missing');
    return;
  }
  const payload = await readLastSelectPayload(page);
  const ids = (payload && payload.data && Array.isArray(payload.data.selected))
    ? payload.data.selected.map((s) => s.id).sort()
    : [];
  const ok = payload
    && payload.type === 'table-form'
    && payload.data
    && payload.data.mode === 'multi'
    && ids.length === 2
    && ids[0] === 'opt-py'
    && ids[1] === 'opt-rust';
  record(
    'table_form_multi_checkbox',
    ok ? 'PASS' : 'FAIL',
    'multi-mode: tick two rows → POST {mode:multi, selected:[2 entries]}',
    JSON.stringify(payload)
  );
}

async function testFreeTextSubmit(page) {
  // D3.3 — free-text mode: type into the inline text input, click Submit.
  // The runtime auto-selects the __text row's radio when the input gets
  // focus / receives input. Expect payload.data.text === '<typed>' and
  // payload.data.selected[0].text === '<typed>'.
  await setup(page, FREE);
  // Click the free-text input + type.
  const tx = await page.evaluate(() => {
    const i = document.querySelector('tr[data-ve-row-id="__text"] input[type="text"]');
    if (!i) return null;
    i.scrollIntoView({ block: 'center' });
    const r = i.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!tx) {
    record('table_form_freetext', 'FAIL', 'free-text submit', 'free-text input missing');
    return;
  }
  await page.mouse.click(tx.x, tx.y);
  await page.waitForTimeout(150);
  await page.keyboard.type('Helix');
  await page.waitForTimeout(200);
  // Wait for the input value to actually contain 'Helix' (poll loop —
  // same flake-resistant pattern as test-regex-panels.js, C1 fix).
  const inputDeadline = Date.now() + 2000;
  let inputValue = null;
  while (Date.now() < inputDeadline) {
    inputValue = await page.evaluate(() => {
      const i = document.querySelector('tr[data-ve-row-id="__text"] input[type="text"]');
      return i ? i.value : null;
    });
    if (inputValue === 'Helix') break;
    await page.waitForTimeout(60);
  }
  const submitted = await clickFormSubmit(page);
  if (!submitted) {
    record('table_form_freetext', 'FAIL', 'free-text submit', 'submit button missing');
    return;
  }
  const payload = await readLastSelectPayload(page);
  const ok = payload
    && payload.type === 'table-form'
    && payload.data
    && payload.data.text === 'Helix'
    && Array.isArray(payload.data.selected)
    && payload.data.selected.length === 1
    && payload.data.selected[0].id === '__text'
    && payload.data.selected[0].text === 'Helix';
  record(
    'table_form_freetext',
    ok ? 'PASS' : 'FAIL',
    'free-text: type → POST {data:{text:<typed>, selected:[__text]}}',
    JSON.stringify({ inputValue, payload })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSingleRadioSubmit,
  testMultiCheckboxSubmit,
  testFreeTextSubmit,
];

const page = await browser.getPage("table-form-tests");

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
