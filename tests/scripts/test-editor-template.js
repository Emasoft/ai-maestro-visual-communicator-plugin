// test-editor-template.js
//
// Dev-browser script — exercises scripts/amvcp-editor-template.js, the
// prompt / template tuner (TRDD-1627a698 gap #20).
//
// THE THING: an editable prompt/template with {{variable}} slots, a
// per-variable input panel, a LIVE re-rendered preview of the filled
// template, and an EXPORT of {template, values, rendered} that rides the
// existing runtime selection channel (window.veSelection). Interaction
// Mode is FIXED (export = a kind:"element" entry, the same channel a click
// uses); Graphic Style is DESIGN.md-driven, light + dark both.
//
// Coverage (build spec acceptance — 5 tests):
//   1. renders inputs + an initial preview filled with the defaults
//   2. editing a var live-updates the preview text
//   3. switching a select-type var re-renders the preview
//   4. Export pushes a kind:"element" entry into window.veSelection whose
//      data.{template,values,rendered} is consistent with the UI
//   5. editing adds NO new DOM elements outside the preview's own text,
//      AND a theme flip re-paints (resolved tokens change per theme)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/editor-template-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture, wait for the runtime + the editor module + the wired
// editor (its preview <pre> exists). Returns true once ready.
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 7000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = await page.evaluate(() =>
      typeof window.amvcpEditorTemplate === 'object'
      && Array.isArray(window.veSelection)
      && !!document.querySelector('.ve-editor-template .ve-tpl-preview')
      && document.querySelectorAll('.ve-editor-template .ve-tpl-field').length > 0);
    if (ready) break;
    await page.waitForTimeout(70);
  }
  return ready;
}

// ── Tests ───────────────────────────────────────────────────────────

async function testRendersInputsAndInitialPreview(page) {
  if (!(await setup(page))) {
    record('tpl_renders_inputs', 'FAIL', 'inputs + initial preview render', 'editor never wired');
    return;
  }
  const res = await page.evaluate(() => {
    const root = document.querySelector('.ve-editor-template');
    // The JSON model <script> is CONSUMED on init (initEditor clears the
    // host's children to render the panel) — the live state lives in
    // el.__veTpl. So read the variable count from there, not from a tag
    // that no longer exists.
    const wantFields = (root.__veTpl && root.__veTpl.varDefs) ? root.__veTpl.varDefs.length : 0;
    const fields = root.querySelectorAll('.ve-tpl-field').length;
    // One input control per variable, of the right element type.
    const controls = {
      text: root.querySelectorAll('input.ve-tpl-input').length,
      select: root.querySelectorAll('select.ve-tpl-select').length,
      textarea: root.querySelectorAll('textarea.ve-tpl-textarea').length
    };
    const pre = root.querySelector('.ve-tpl-preview');
    const previewText = pre ? pre.textContent : '';
    // Defaults: tone=concise, topic=the quarterly report, count=120, audience=executives
    const expected = 'Write a concise summary of the quarterly report in 120 words. Audience: executives.';
    // Each filled slot is painted via its OWN span (no overlay) — count them.
    const slotSpans = pre ? pre.querySelectorAll('span.ve-tpl-slot').length : 0;
    return {
      fields, wantFields, controls,
      previewText, expected, previewMatches: previewText === expected,
      slotSpans
    };
  });
  const ok = res.fields === res.wantFields
    && res.controls.text === 2 && res.controls.select === 1 && res.controls.textarea === 1
    && res.previewMatches === true
    && res.slotSpans === 4;
  record(
    'tpl_renders_inputs',
    ok ? 'PASS' : 'FAIL',
    'one input per variable + initial preview filled with defaults',
    JSON.stringify(res)
  );
}

async function testEditingUpdatesPreview(page) {
  if (!(await setup(page))) {
    record('tpl_edit_updates_preview', 'FAIL', 'editing live-updates preview', 'editor never wired');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('.ve-editor-template');
    const pre = root.querySelector('.ve-tpl-preview');
    const before = pre.textContent;
    const tone = root.querySelector('input.ve-tpl-input');     // first text input = tone
    tone.value = 'snarky';
    tone.dispatchEvent(new Event('input', { bubbles: true }));
    // Debounced 120ms — wait past it.
    await new Promise(r => setTimeout(r, 220));
    const after = pre.textContent;
    return {
      before, after,
      changed: before !== after,
      hasNewValue: after.indexOf('snarky') !== -1,
      droppedOld: after.indexOf('concise') === -1
    };
  });
  const ok = res.changed === true && res.hasNewValue === true && res.droppedOld === true;
  record(
    'tpl_edit_updates_preview',
    ok ? 'PASS' : 'FAIL',
    'typing in a var input live-updates the preview text (debounced)',
    JSON.stringify(res)
  );
}

async function testSelectSwitchesReRender(page) {
  if (!(await setup(page))) {
    record('tpl_select_rerenders', 'FAIL', 'select var switches re-render', 'editor never wired');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('.ve-editor-template');
    const pre = root.querySelector('.ve-tpl-preview');
    const sel = root.querySelector('select.ve-tpl-select');     // count var
    const before = pre.textContent;                            // contains "120"
    sel.value = '400';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 220));
    const after = pre.textContent;
    return {
      before, after,
      hasNew: after.indexOf('in 400 words') !== -1,
      droppedOld: after.indexOf('in 120 words') === -1
    };
  });
  const ok = res.hasNew === true && res.droppedOld === true;
  record(
    'tpl_select_rerenders',
    ok ? 'PASS' : 'FAIL',
    'changing a select-type variable re-renders the filled preview',
    JSON.stringify(res)
  );
}

async function testExportPayload(page) {
  if (!(await setup(page))) {
    record('tpl_export_payload', 'FAIL', 'export payload in veSelection', 'editor never wired');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('.ve-editor-template');
    // Edit two vars so the export reflects the live UI, not just defaults.
    const tone = root.querySelector('input.ve-tpl-input');
    tone.value = 'formal';
    tone.dispatchEvent(new Event('input', { bubbles: true }));
    const sel = root.querySelector('select.ve-tpl-select');
    sel.value = '200';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 220));

    const before = window.veSelection.length;
    const btn = root.querySelector('.ve-tpl-export');
    btn.click();
    await new Promise(r => setTimeout(r, 60));

    const sels = window.veSelection;
    const entry = sels.find(e => e && e.id === 've-tpl-summary') || null;
    // Re-derive what the UI shows so we can assert the payload matches it.
    const previewText = root.querySelector('.ve-tpl-preview').textContent;

    // Idempotency: a second export must NOT duplicate the entry.
    btn.click();
    await new Promise(r => setTimeout(r, 60));
    const countForId = window.veSelection.filter(e => e && e.id === 've-tpl-summary').length;

    return {
      addedOne: window.veSelection.length === before + 1 || (before > 0 && countForId === 1),
      countForId,
      entryPresent: !!entry,
      kind: entry && entry.kind,
      type: entry && entry.type,
      hasTemplate: !!(entry && entry.data && typeof entry.data.template === 'string'),
      hasValues: !!(entry && entry.data && entry.data.values && typeof entry.data.values === 'object'),
      hasRendered: !!(entry && entry.data && typeof entry.data.rendered === 'string'),
      valuesTone: entry && entry.data && entry.data.values && entry.data.values.tone,
      valuesCount: entry && entry.data && entry.data.values && entry.data.values.count,
      renderedMatchesPreview: !!(entry && entry.data && entry.data.rendered === previewText),
      // rendered must equal renderTemplate(template, values) — internal consistency.
      renderedConsistent: !!(entry && entry.data
        && window.amvcpEditorTemplate.renderTemplate(entry.data.template, entry.data.values) === entry.data.rendered)
    };
  });
  const ok = res.entryPresent === true
    && res.kind === 'element'
    && res.type === 'editor-template'
    && res.hasTemplate && res.hasValues && res.hasRendered
    && res.valuesTone === 'formal' && res.valuesCount === '200'
    && res.renderedMatchesPreview === true
    && res.renderedConsistent === true
    && res.countForId === 1;
  record(
    'tpl_export_payload',
    ok ? 'PASS' : 'FAIL',
    'Export pushes ONE kind:"element" entry carrying {template,values,rendered} consistent with the UI',
    JSON.stringify(res)
  );
}

async function testNoNewElementsAndThemeRepaint(page) {
  if (!(await setup(page))) {
    record('tpl_no_new_els_theme', 'FAIL', 'no new DOM on edit + theme repaint', 'editor never wired');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('.ve-editor-template');
    const pre = root.querySelector('.ve-tpl-preview');
    // Count every element OUTSIDE the preview before & after an edit. The
    // NO-NEW-ELEMENTS rule: editing only re-paints the preview's own text —
    // no injected overlay / frame / ring anywhere else in the editor.
    function countOutsidePreview() {
      const all = root.querySelectorAll('*');
      let n = 0;
      for (let i = 0; i < all.length; i++) {
        if (!pre.contains(all[i]) && all[i] !== pre) n++;
      }
      return n;
    }
    const beforeCount = countOutsidePreview();
    const tone = root.querySelector('input.ve-tpl-input');
    tone.value = 'urgent';
    tone.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 220));
    const afterCount = countOutsidePreview();

    // Theme flip — resolved canvas token must change (proves both themes
    // theme correctly via DESIGN.md, not a hardcoded palette).
    const rootDoc = document.documentElement;
    const beforeTheme = rootDoc.getAttribute('data-ve-theme');
    const beforeCanvas = getComputedStyle(rootDoc).getPropertyValue('--vc-color-canvas').trim();
    const beforePreBg = getComputedStyle(pre).backgroundColor;
    if (window.__veDesignMd && window.__veDesignMd.toggleTheme) {
      window.__veDesignMd.toggleTheme();
    }
    await new Promise(r => setTimeout(r, 80));
    const afterTheme = rootDoc.getAttribute('data-ve-theme');
    const afterCanvas = getComputedStyle(rootDoc).getPropertyValue('--vc-color-canvas').trim();
    const afterPreBg = getComputedStyle(pre).backgroundColor;

    return {
      beforeCount, afterCount, noNewOutside: afterCount === beforeCount,
      beforeTheme, afterTheme, themeFlipped: beforeTheme !== afterTheme,
      canvasChanged: beforeCanvas !== afterCanvas,
      preBgChanged: beforePreBg !== afterPreBg
    };
  });
  const ok = res.noNewOutside === true
    && res.themeFlipped === true
    && res.canvasChanged === true
    && res.preBgChanged === true;
  record(
    'tpl_no_new_els_theme',
    ok ? 'PASS' : 'FAIL',
    'editing adds no DOM outside the preview text; a theme flip re-paints (tokens differ per theme)',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testRendersInputsAndInitialPreview,
  testEditingUpdatesPreview,
  testSelectSwitchesReRender,
  testExportPayload,
  testNoNewElementsAndThemeRepaint,
];

const page = await browser.getPage("editor-template-tests");

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
