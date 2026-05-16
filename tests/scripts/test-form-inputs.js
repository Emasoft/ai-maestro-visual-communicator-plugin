// ai-maestro-visual-communicator-plugin — form-input widgets tests.
//
// Run with the test harness's dev-browser context. The fixture loads
// amvcp-form-inputs.js as a browser global and seeds the page with one
// of each widget kind. Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/form-inputs-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpFormInputs === 'object'
      && typeof window.amvcpFormInputs.init === 'function'
      && (window.__vcFixtureReady === true || !!window.__vcFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vcFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

async function testAllWidgetsInit(page) {
  // Boot the fixture — every widget kind should mount its DOM (radio
  // inputs, checkbox inputs, numeric input + unit select, date input,
  // color input + hex, rank list with draggable items).
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_all_init', 'FAIL', 'all widgets init', s.error);
    return;
  }
  const r = await page.evaluate(() => ({
    radioInited: document.querySelector('.ve-quiz-radio').__veInited === true,
    radioCount: document.querySelectorAll('.ve-quiz-radio input[type="radio"]').length,
    multiInited: document.querySelector('.ve-quiz-multi').__veInited === true,
    multiCount: document.querySelectorAll('.ve-quiz-multi input[type="checkbox"]').length,
    numericInited: document.querySelector('.ve-numeric-input').__veInited === true,
    numericValuePresent: !!document.querySelector('.ve-numeric-value'),
    numericUnits: document.querySelectorAll('.ve-numeric-unit option').length,
    dateInited: document.querySelector('.ve-date-input').__veInited === true,
    dateValue: document.querySelector('.ve-date-value').value,
    colorInited: document.querySelector('.ve-color-input').__veInited === true,
    colorHex: document.querySelector('.ve-color-hex').textContent,
    rankInited: document.querySelector('.ve-rank-list').__veInited === true,
    rankItems: document.querySelectorAll('.ve-rank-list .ve-rank-item').length,
    rankDraggable: document.querySelectorAll('.ve-rank-list li[draggable="true"]').length,
    typeAttrsCorrect: (function () {
      const expect = {
        '.ve-quiz-radio': 'quiz-radio',
        '.ve-quiz-multi': 'quiz-multi',
        '.ve-numeric-input': 'numeric-input',
        '.ve-date-input': 'date-input',
        '.ve-color-input': 'color-input',
        '.ve-slider': 'slider',
        '.ve-toggle': 'toggle',
        '.ve-rating': 'rating',
        '.ve-card-picker': 'card-picker',
        '.ve-tag-input': 'tag-input',
        '.ve-text-input': 'text-input',
        '.ve-text-area': 'text-area',
        '.ve-url-input': 'url-input',
        '.ve-rank-list': 'rank-list'
      };
      const bad = [];
      for (const sel in expect) {
        const el = document.querySelector(sel);
        const t = el && el.getAttribute('data-ve-type');
        if (t !== expect[sel]) bad.push(sel + ' = ' + t);
      }
      return bad;
    })()
  }));
  const ok = r.radioInited && r.radioCount === 3
    && r.multiInited && r.multiCount === 4
    && r.numericInited && r.numericValuePresent && r.numericUnits === 3
    && r.dateInited && r.dateValue === '2026-06-01'
    && r.colorInited && r.colorHex === '#b8861f'
    && r.rankInited && r.rankItems === 4 && r.rankDraggable === 4
    && r.typeAttrsCorrect.length === 0;
  record('form_inputs_all_init', ok ? 'PASS' : 'FAIL',
    'every kind mounts: radio, multi, numeric, date, color, rank',
    JSON.stringify(r));
}

async function testRadioEmitsChange(page) {
  // Clicking a non-default radio fires ve-form-change with the new value.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_radio_change', 'FAIL', 'radio change emits event', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const target = document.querySelector('.ve-quiz-radio input[value="feature-flag"]');
    target.click();
    return {
      checked: target.checked,
      lastEvent: window.__vcFormChanges[window.__vcFormChanges.length - 1],
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:quiz-radio:rollout-strategy') || 'null')
    };
  });
  const ok = r.checked === true
    && r.lastEvent
    && r.lastEvent.kind === 'quiz-radio'
    && r.lastEvent.value === 'feature-flag'
    && r.lsValue === 'feature-flag';
  record('form_inputs_radio_change', ok ? 'PASS' : 'FAIL',
    'clicking a radio updates state, fires ve-form-change, persists to LS',
    JSON.stringify(r));
}

async function testMultiEmitsArray(page) {
  // Toggling checkboxes emits an ARRAY value (not a single string).
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_multi_change', 'FAIL', 'multi change emits array', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const billing = document.querySelector('.ve-quiz-multi input[value="billing"]');
    const frontend = document.querySelector('.ve-quiz-multi input[value="frontend"]');
    billing.click();
    frontend.click();
    return {
      lastEvent: window.__vcFormChanges[window.__vcFormChanges.length - 1],
      events: window.__vcFormChanges.filter(e => e.kind === 'quiz-multi').length
    };
  });
  const ok = r.lastEvent
    && r.lastEvent.kind === 'quiz-multi'
    && Array.isArray(r.lastEvent.value)
    && r.lastEvent.value.indexOf('auth') >= 0
    && r.lastEvent.value.indexOf('billing') >= 0
    && r.lastEvent.value.indexOf('frontend') >= 0
    && r.events === 2;
  record('form_inputs_multi_change', ok ? 'PASS' : 'FAIL',
    'checkbox toggles emit array values; LS persists the full set',
    JSON.stringify(r));
}

async function testNumericEmitsValueUnit(page) {
  // Typing in the number input + switching the unit fires two events;
  // both carry a {value, unit} payload.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_numeric_change', 'FAIL', 'numeric change emits {value,unit}', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const num = document.querySelector('.ve-numeric-value');
    const sel = document.querySelector('.ve-numeric-unit');
    num.value = '777';
    num.dispatchEvent(new Event('input', { bubbles: true }));
    sel.value = 'h';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    const last2 = window.__vcFormChanges.slice(-2);
    return {
      first: last2[0],
      second: last2[1],
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:num:cache-ttl') || 'null')
    };
  });
  const ok = r.first && r.first.value && r.first.value.value === 777
    && r.first.value.unit === 's'
    && r.second && r.second.value.value === 777
    && r.second.value.unit === 'h'
    && r.lsValue && r.lsValue.value === 777 && r.lsValue.unit === 'h';
  record('form_inputs_numeric_change', ok ? 'PASS' : 'FAIL',
    'numeric input + unit emit {value,unit}; LS keeps the latest payload',
    JSON.stringify(r));
}

async function testDateAndColorEmit(page) {
  // Native date / color inputs fire on user change.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_date_color_change', 'FAIL', 'date+color change', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const date = document.querySelector('.ve-date-value');
    date.value = '2027-01-15';
    date.dispatchEvent(new Event('change', { bubbles: true }));
    const color = document.querySelector('.ve-color-value');
    color.value = '#3a6b5c';
    color.dispatchEvent(new Event('input', { bubbles: true }));
    return {
      dateEvent: window.__vcFormChanges
        .filter(e => e.kind === 'date-input').pop(),
      colorEvent: window.__vcFormChanges
        .filter(e => e.kind === 'color-input').pop(),
      hexAfter: document.querySelector('.ve-color-hex').textContent
    };
  });
  const ok = r.dateEvent && r.dateEvent.value === '2027-01-15'
    && r.colorEvent && r.colorEvent.value === '#3a6b5c'
    && r.hexAfter === '#3a6b5c';
  record('form_inputs_date_color_change', ok ? 'PASS' : 'FAIL',
    'date + color inputs emit values; hex readout updates with color',
    JSON.stringify(r));
}

async function testRankDragReorders(page) {
  // Drag the LAST item onto the FIRST — the rank order should rotate
  // it to the top, and the change event should carry the new order.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_rank_drag', 'FAIL', 'rank drag reorders', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const list = document.querySelector('.ve-rank-list ol');
    const items = list.querySelectorAll('li');
    const dragged = items[3];          // last (docs)
    const target = items[0];           // first (logs)
    const dt = new DataTransfer();
    dragged.dispatchEvent(new DragEvent('dragstart',
      { bubbles: true, cancelable: true, dataTransfer: dt }));
    const tr = target.getBoundingClientRect();
    target.dispatchEvent(new DragEvent('dragover',
      { bubbles: true, cancelable: true,
        clientY: tr.top + 4, dataTransfer: dt }));
    target.dispatchEvent(new DragEvent('drop',
      { bubbles: true, cancelable: true,
        clientY: tr.top + 4, dataTransfer: dt }));
    dragged.dispatchEvent(new DragEvent('dragend',
      { bubbles: true, cancelable: true, dataTransfer: dt }));
    const after = Array.from(list.querySelectorAll('li'))
      .map(l => l.getAttribute('data-ve-rank-key'));
    return {
      newOrder: after,
      lastEvent: window.__vcFormChanges.filter(
        e => e.kind === 'rank-list').pop(),
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:rank:priorities') || 'null')
    };
  });
  const ok = r.newOrder
    && r.newOrder.length === 4
    && r.newOrder[0] === 'docs'
    && r.newOrder[1] === 'logs'
    && r.lastEvent && r.lastEvent.value
    && r.lastEvent.value[0] === 'docs'
    && Array.isArray(r.lsValue) && r.lsValue[0] === 'docs';
  record('form_inputs_rank_drag', ok ? 'PASS' : 'FAIL',
    'dragging last item onto first rotates it to top; emits new order',
    JSON.stringify(r));
}

async function testPersistenceAcrossReload(page) {
  // After a state change, reload the fixture — the saved LS values
  // should re-hydrate the widgets to their last picked state.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_persistence', 'FAIL', 'persistence across reload', s.error);
    return;
  }
  await page.evaluate(() => {
    document.querySelector('.ve-quiz-radio input[value="blue-green"]').click();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => window.__vcFixtureReady === true);
    if (ready) { break; }
    await page.waitForTimeout(70);
  }
  const r = await page.evaluate(() => ({
    checked: document.querySelector(
      '.ve-quiz-radio input[value="blue-green"]').checked
  }));
  const ok = r.checked === true;
  record('form_inputs_persistence', ok ? 'PASS' : 'FAIL',
    'radio default is overridden by LS-saved value after reload',
    JSON.stringify(r));
}

async function testThemeTokensApplied(page) {
  // Switching <html data-ve-theme="dark"> must re-theme the widgets —
  // the radio accent color, card background, border, hex readout
  // colour all read --vc-* tokens via var(). Spot-check 3 surfaces.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_theme_tokens', 'FAIL', 'theme tokens applied', s.error);
    return;
  }
  const light = await page.evaluate(() => ({
    cardBg: getComputedStyle(document.querySelector('.ve-quiz-radio')).backgroundColor,
    cardBorder: getComputedStyle(document.querySelector('.ve-quiz-radio')).borderTopColor,
    hexColor: getComputedStyle(document.querySelector('.ve-color-hex')).color
  }));
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-ve-theme', 'dark');
  });
  await page.waitForTimeout(50);
  const dark = await page.evaluate(() => ({
    cardBg: getComputedStyle(document.querySelector('.ve-quiz-radio')).backgroundColor,
    cardBorder: getComputedStyle(document.querySelector('.ve-quiz-radio')).borderTopColor,
    hexColor: getComputedStyle(document.querySelector('.ve-color-hex')).color
  }));
  // Each surface should change between themes (the token VALUE changed)
  const ok = light.cardBg !== dark.cardBg
    && light.cardBorder !== dark.cardBorder
    && light.hexColor !== dark.hexColor;
  record('form_inputs_theme_tokens', ok ? 'PASS' : 'FAIL',
    'switching data-ve-theme flips card/border/hex color via --vc-* tokens',
    JSON.stringify({ light, dark }));
}

async function testFailFastOnMissingId(page) {
  // A widget WITHOUT data-ve-id paints an [form-input error] box.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_fail_fast_no_id', 'FAIL', 'fail-fast on missing id', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const div = document.createElement('div');
    div.className = 've-quiz-radio';
    // no data-ve-id
    const sc = document.createElement('script');
    sc.setAttribute('type', 'application/json');
    sc.textContent = JSON.stringify({
      options: [{value:'a',label:'A'}, {value:'b',label:'B'}]
    });
    div.appendChild(sc);
    document.body.appendChild(div);
    window.amvcpFormInputs.initQuizRadio(div);
    const alert = div.querySelector('[role="alert"]');
    return {
      alertPresent: !!alert,
      alertText: alert ? alert.textContent : '',
      noRadios: div.querySelectorAll('input[type="radio"]').length
    };
  });
  const ok = r.alertPresent
    && r.alertText.indexOf('[form-input error]') === 0
    && r.alertText.indexOf('data-ve-id') >= 0
    && r.noRadios === 0;
  record('form_inputs_fail_fast_no_id', ok ? 'PASS' : 'FAIL',
    'a widget without data-ve-id paints [form-input error] and renders nothing',
    JSON.stringify(r));
}

async function testSliderRendersAndEmits(page) {
  // ve-slider mounts a range input + readout, optional ticks, emits
  // ve-form-change(kind=slider, value=<number>) on input.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_slider_change', 'FAIL',
      'slider mounts + emits change', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-slider');
    const input = root.querySelector('.ve-slider-value');
    const readout = root.querySelector('.ve-slider-readout');
    const ticks = root.querySelectorAll('.ve-slider-tick').length;
    const initialReadout = readout.textContent;
    input.value = '70';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const ev = window.__vcFormChanges.filter(e => e.kind === 'slider').pop();
    return {
      typeAttr: root.getAttribute('data-ve-type'),
      tickCount: ticks,
      initialReadout: initialReadout,
      afterReadout: readout.textContent,
      eventValue: ev ? ev.value : null,
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:slider:rollout-percent') || 'null')
    };
  });
  const ok = r.typeAttr === 'slider'
    && r.tickCount === 5
    && r.afterReadout === '70 %'
    && r.eventValue === 70
    && r.lsValue === 70;
  record('form_inputs_slider_change', ok ? 'PASS' : 'FAIL',
    'slider renders ticks; input event fires + persists',
    JSON.stringify(r));
}

async function testToggleFlipsState(page) {
  // ve-toggle starts in model.value state; clicking flips aria-checked
  // and emits ve-form-change(kind=toggle, value=<boolean>).
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_toggle_change', 'FAIL',
      'toggle flips state + emits', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-toggle');
    const btn = root.querySelector('.ve-toggle-switch');
    const initial = btn.getAttribute('aria-checked');
    btn.click();
    const after = btn.getAttribute('aria-checked');
    const captionAfter = (root.querySelector('.ve-toggle-caption') || {}).textContent;
    const ev = window.__vcFormChanges.filter(e => e.kind === 'toggle').pop();
    // Keyboard Space flip
    btn.dispatchEvent(new KeyboardEvent('keydown',
      { bubbles: true, key: ' ', cancelable: true }));
    const afterKey = btn.getAttribute('aria-checked');
    return {
      typeAttr: root.getAttribute('data-ve-type'),
      initial: initial,
      afterClick: after,
      captionAfterClick: captionAfter,
      eventValue: ev ? ev.value : null,
      afterKeyboard: afterKey,
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:toggle:auto-rollback') || 'null')
    };
  });
  const ok = r.typeAttr === 'toggle'
    && r.initial === 'true'
    && r.afterClick === 'false'
    && r.captionAfterClick === 'OFF'
    && r.eventValue === false
    && r.afterKeyboard === 'true'
    && r.lsValue === true;
  record('form_inputs_toggle_change', ok ? 'PASS' : 'FAIL',
    'toggle flips on click + Space; caption + LS update',
    JSON.stringify(r));
}

async function testRatingClickAndClear(page) {
  // ve-rating starts with model.value filled; clicking slot N fills
  // N slots and emits N. Clearing fires 0 and zero filled slots.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_rating_change', 'FAIL',
      'rating click + clear', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-rating');
    const slots = root.querySelectorAll('.ve-rating-slot');
    const initialFilled = root.querySelectorAll('.ve-rating-filled').length;
    slots[4].click();  // pick the 5th star
    const fillAfter5 = root.querySelectorAll('.ve-rating-filled').length;
    const ev5 = window.__vcFormChanges.filter(e => e.kind === 'rating').pop();
    root.querySelector('.ve-rating-clear').click();
    const fillAfterClear = root.querySelectorAll('.ve-rating-filled').length;
    const ev0 = window.__vcFormChanges.filter(e => e.kind === 'rating').pop();
    return {
      typeAttr: root.getAttribute('data-ve-type'),
      slotCount: slots.length,
      initialFilled: initialFilled,
      fillAfter5: fillAfter5,
      ev5Value: ev5 ? ev5.value : null,
      fillAfterClear: fillAfterClear,
      ev0Value: ev0 ? ev0.value : null,
      readout: root.querySelector('.ve-rating-readout').textContent,
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:rating:confidence') || 'null')
    };
  });
  const ok = r.typeAttr === 'rating'
    && r.slotCount === 5
    && r.initialFilled === 3
    && r.fillAfter5 === 5
    && r.ev5Value === 5
    && r.fillAfterClear === 0
    && r.ev0Value === 0
    && r.readout === '0 / 5'
    && r.lsValue === 0;
  record('form_inputs_rating_change', ok ? 'PASS' : 'FAIL',
    'rating slot click fills N + emits N; clear empties + emits 0',
    JSON.stringify(r));
}

async function testCardPickerSelection(page) {
  // ve-card-picker mounts N cards with icon/title/subtitle/body, marks
  // model.default selected, and clicking a different card swaps the
  // selection + emits ve-form-change.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_card_picker', 'FAIL', 'card-picker selection', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-card-picker');
    const cards = root.querySelectorAll('.ve-card-picker-card');
    const icons = root.querySelectorAll('.ve-card-picker-icon');
    const subs  = root.querySelectorAll('.ve-card-picker-subtitle');
    const initialSelected =
      (root.querySelector('.ve-card-picker-selected') || {})
        .getAttribute && root.querySelector('.ve-card-picker-selected')
        .getAttribute('data-card-value');
    // Click sqlite
    root.querySelector('[data-card-value="sqlite"]').click();
    const afterSelected =
      root.querySelector('.ve-card-picker-selected')
        .getAttribute('data-card-value');
    const afterAria = root.querySelector(
      '[data-card-value="sqlite"]').getAttribute('aria-checked');
    const ev = window.__vcFormChanges
      .filter(e => e.kind === 'card-picker').pop();
    return {
      typeAttr: root.getAttribute('data-ve-type'),
      cardCount: cards.length,
      iconCount: icons.length,
      subtitleCount: subs.length,
      initialSelected: initialSelected,
      afterSelected: afterSelected,
      afterAria: afterAria,
      eventValue: ev ? ev.value : null,
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:card:database-engine') || 'null')
    };
  });
  const ok = r.typeAttr === 'card-picker'
    && r.cardCount === 3
    && r.iconCount === 3
    && r.subtitleCount === 3
    && r.initialSelected === 'postgres'
    && r.afterSelected === 'sqlite'
    && r.afterAria === 'true'
    && r.eventValue === 'sqlite'
    && r.lsValue === 'sqlite';
  record('form_inputs_card_picker', ok ? 'PASS' : 'FAIL',
    'card-picker renders rich cards; click swaps selection + emits',
    JSON.stringify(r));
}

async function testTagInputAddRemoveSuggest(page) {
  // ve-tag-input: type + Enter adds a chip, suggestions are filtered
  // by typed text, clicking a suggestion adds it as a chip and hides
  // it from suggestions, the chip ✕ removes a tag.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_tag_input', 'FAIL', 'tag-input add/remove/suggest', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-tag-input');
    const input = root.querySelector('.ve-tag-input-field');
    function chipTexts() {
      return Array.from(
        root.querySelectorAll('.ve-tag-input-chip-label')
      ).map(l => l.textContent);
    }
    function hintTexts() {
      return Array.from(
        root.querySelectorAll('.ve-tag-input-hint')
      ).map(l => l.textContent);
    }
    const initial = { chips: chipTexts(), hints: hintTexts().length };
    // Type + Enter
    input.value = 'critical';
    input.dispatchEvent(new KeyboardEvent('keydown',
      { bubbles: true, cancelable: true, key: 'Enter' }));
    const afterEnter = chipTexts();
    const evEnter = window.__vcFormChanges
      .filter(e => e.kind === 'tag-input').pop();
    // Click a suggestion (the first visible one)
    const sug = root.querySelector('.ve-tag-input-hint');
    const sugText = sug ? sug.textContent : null;
    if (sug) { sug.click(); }
    const afterSuggest = chipTexts();
    // Remove the first chip via ✕
    root.querySelector('.ve-tag-input-chip-x').click();
    const afterRemove = chipTexts();
    const evRemove = window.__vcFormChanges
      .filter(e => e.kind === 'tag-input').pop();
    return {
      typeAttr: root.getAttribute('data-ve-type'),
      initial: initial,
      afterEnter: afterEnter,
      evEnterValue: evEnter ? evEnter.value : null,
      sugText: sugText,
      afterSuggest: afterSuggest,
      afterRemove: afterRemove,
      evRemoveValue: evRemove ? evRemove.value : null,
      lsValue: JSON.parse(localStorage.getItem(
        'amvcp-form-input:tags:rollout-tags') || 'null')
    };
  });
  const ok = r.typeAttr === 'tag-input'
    && r.initial.chips.length === 1
    && r.initial.chips[0] === 'security'
    && r.afterEnter.indexOf('critical') >= 0
    && Array.isArray(r.evEnterValue)
    && r.evEnterValue.indexOf('critical') >= 0
    && r.sugText && r.afterSuggest.indexOf(r.sugText) >= 0
    && r.afterRemove.length === r.afterSuggest.length - 1
    && Array.isArray(r.evRemoveValue);
  record('form_inputs_tag_input', ok ? 'PASS' : 'FAIL',
    'tag-input: type+Enter adds, click suggestion adds, ✕ removes',
    JSON.stringify(r));
}

async function testTextInputPatternValidation(page) {
  // ve-text-input mounts, applies model.pattern as regex, paints
  // model.patternMsg in red when value doesn't match, clears the
  // error when value matches. Event payload is {value, valid}.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_text_pattern', 'FAIL',
      'text-input pattern validation', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-text-input');
    const input = root.querySelector('.ve-text-input-field');
    const err = root.querySelector('.ve-text-input-error');
    const initial = {
      value: input.value,
      error: err.textContent,
      hasInvalid: root.classList.contains('ve-text-input-invalid')
    };
    // Bad value
    input.value = 'not-a-semver';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const badEv = window.__vcFormChanges
      .filter(e => e.kind === 'text-input').pop();
    const bad = {
      error: err.textContent,
      hasInvalid: root.classList.contains('ve-text-input-invalid'),
      eventValid: badEv ? badEv.value.valid : null
    };
    // Good value
    input.value = '3.4.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const goodEv = window.__vcFormChanges
      .filter(e => e.kind === 'text-input').pop();
    const good = {
      error: err.textContent,
      hasInvalid: root.classList.contains('ve-text-input-invalid'),
      eventValid: goodEv ? goodEv.value.valid : null
    };
    return { initial, bad, good };
  });
  const ok = r.initial.value === '1.2.0' && !r.initial.hasInvalid
    && r.bad.hasInvalid && r.bad.error.indexOf('major.minor.patch') >= 0
    && r.bad.eventValid === false
    && !r.good.hasInvalid && r.good.error === ''
    && r.good.eventValid === true;
  record('form_inputs_text_pattern', ok ? 'PASS' : 'FAIL',
    'text-input regex pattern flags invalid + clears on valid; event carries .valid',
    JSON.stringify(r));
}

async function testTextAreaCharCounter(page) {
  // ve-text-area counter shows "<n> / <max>" and goes "near-limit"
  // (warning color) past 90% of maxLength.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_textarea_counter', 'FAIL',
      'textarea counter', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-text-area');
    const ta = root.querySelector('.ve-text-area-field');
    const counter = root.querySelector('.ve-text-area-counter');
    // Type short
    ta.value = 'short note';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const shortRes = {
      counter: counter.textContent,
      nearLimit: counter.classList.contains('ve-text-area-near-limit')
    };
    // Type near limit (>= 90% of 280 = 252+)
    ta.value = 'x'.repeat(260);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const longRes = {
      counter: counter.textContent,
      nearLimit: counter.classList.contains('ve-text-area-near-limit')
    };
    const ev = window.__vcFormChanges
      .filter(e => e.kind === 'text-area').pop();
    return { shortRes, longRes, eventValue: ev ? ev.value.length : null };
  });
  const ok = r.shortRes.counter === '10 / 280'
    && !r.shortRes.nearLimit
    && r.longRes.counter === '260 / 280'
    && r.longRes.nearLimit
    && r.eventValue === 260;
  record('form_inputs_textarea_counter', ok ? 'PASS' : 'FAIL',
    'textarea counter formats N / max + flags near-limit past 90%',
    JSON.stringify(r));
}

async function testUrlInputValidationAndPreview(page) {
  // ve-url-input shows/hides the preview link based on URL validity,
  // sets href to the typed URL, paints error text when invalid, and
  // honours allowedProtocols.
  const s = await setup(page);
  if (!s.ok) {
    record('form_inputs_url_validation', 'FAIL',
      'url-input validation', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const root = document.querySelector('.ve-url-input');
    const input = root.querySelector('.ve-url-input-field');
    const preview = root.querySelector('.ve-url-input-preview');
    const err = root.querySelector('.ve-url-input-error');
    const initial = {
      previewVisible: getComputedStyle(preview).display !== 'none',
      previewHref: preview.href,
      error: err.textContent
    };
    // Invalid
    input.value = 'definitely not a url';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const invalid = {
      previewVisible: getComputedStyle(preview).display !== 'none',
      error: err.textContent,
      hasInvalidClass: root.classList.contains('ve-url-input-invalid')
    };
    // Disallowed protocol (model declares ["http","https"])
    input.value = 'ftp://example.com/file';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const wrongProto = {
      error: err.textContent,
      hasInvalidClass: root.classList.contains('ve-url-input-invalid')
    };
    // Valid
    input.value = 'https://example.com/dashboard';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const valid = {
      previewVisible: getComputedStyle(preview).display !== 'none',
      previewHref: preview.href,
      error: err.textContent,
      hasInvalidClass: root.classList.contains('ve-url-input-invalid'),
      event: window.__vcFormChanges
        .filter(e => e.kind === 'url-input').pop()
    };
    return { initial, invalid, wrongProto, valid };
  });
  const ok = r.initial.previewVisible
    && r.initial.previewHref.indexOf('grafana.internal') >= 0
    && !r.invalid.previewVisible
    && r.invalid.hasInvalidClass
    && r.invalid.error.indexOf('not a valid URL') >= 0
    && r.wrongProto.error.indexOf('protocol') >= 0
    && r.wrongProto.hasInvalidClass
    && r.valid.previewVisible
    && r.valid.previewHref.indexOf('example.com/dashboard') >= 0
    && !r.valid.hasInvalidClass
    && r.valid.event && r.valid.event.value.valid === true;
  record('form_inputs_url_validation', ok ? 'PASS' : 'FAIL',
    'url-input shows preview when valid; flags bad URLs + wrong protocol',
    JSON.stringify(r));
}

// ── Runner ───────────────────────────────────────────────────────────

const tests = [
  testAllWidgetsInit,
  testRadioEmitsChange,
  testMultiEmitsArray,
  testNumericEmitsValueUnit,
  testDateAndColorEmit,
  testRankDragReorders,
  testPersistenceAcrossReload,
  testThemeTokensApplied,
  testFailFastOnMissingId,
  testSliderRendersAndEmits,
  testToggleFlipsState,
  testRatingClickAndClear,
  testCardPickerSelection,
  testTagInputAddRemoveSuggest,
  testTextInputPatternValidation,
  testTextAreaCharCounter,
  testUrlInputValidationAndPreview
];

const page = await browser.getPage("form-inputs-tests");

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
