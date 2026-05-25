/*!
 * ai-maestro-visual-communicator-plugin — form-input widgets.
 *
 * Phase 5 batch 1 (TRDD-9616579c §missing-elements): a dependency-free
 * module that ships NINETEEN structured-response input widgets for
 * conversational agent reports. The agent renders a question; the user
 * answers via a typed widget instead of typing prose. Every value lands
 * in a custom event (`ve-form-change`) that the runtime threads into the
 * comment-turn payload, and persists to localStorage so a refresh keeps
 * the answer.
 *
 * The nineteen widgets:
 *   §1  ve-quiz-radio     — single-select pick from N options
 *   §2  ve-quiz-multi     — multi-select pick (checkbox group)
 *   §3  ve-numeric-input  — number + unit dropdown (px / % / em / s / …)
 *   §4  ve-date-input     — native <input type="date">
 *   §5  ve-color-input    — native <input type="color"> + hex readout
 *   §6  ve-slider         — themed range slider with optional ticks
 *   §7  ve-toggle         — themed boolean switch (role="switch")
 *   §8  ve-rating         — 1-N star / dot rating
 *   §9  ve-card-picker    — rich single-select cards (title/subtitle/body)
 *   §10 ve-tag-input      — typed tags with chip display + suggestions
 *   §11 ve-text-input     — single-line text with optional pattern check
 *   §12 ve-text-area      — multi-line with character counter
 *   §13 ve-url-input      — URL with live validation + preview link
 *   §14 ve-tree-picker    — hierarchical single-select tree
 *   §15 ve-password-input — masked text with strength meter
 *   §16 ve-currency-input — monetary amount + currency switcher
 *   §17 ve-gallery-picker — single-select from N image cards
 *   §18 ve-tier-list      — drag items into S/A/B/C/D tier zones
 *   §19 ve-rank-list      — drag-to-reorder <li> stack with persistent order
 *
 * Design contract:
 *   - Dependency-free. Pure HTML + CSS + vanilla ES5-style JS.
 *   - Theme-driven. Every color / radius / font reads a `--vc-*` token
 *     via `var(--vc-*, fallback)`. Both light + dark themes correct by
 *     construction.
 *   - Fail-fast. A malformed `<script type="application/json">` block
 *     or a widget without `data-ve-id` is a hard error (paints a red
 *     `[form-input error] …` box in place). Storage failures (Safari
 *     private mode) are the documented exception — they degrade
 *     gracefully because persistence is not load-bearing.
 *   - Selection-model integrated. Every widget root carries `data-ve-id`
 *     and `data-ve-type` so the runtime's universal selection model
 *     (hover / focus-visible / click) wires it for free. A widget's
 *     change always emits `ve-form-change` on `document` with
 *     `detail = { kind, id, value }`.
 *   - No nested scrollbars. The rank list naturally extends the page;
 *     the rest are single-row controls.
 *
 * Dual export:
 *   - browser: `window.amvcpFormInputs = { ... }`
 *   - Node:    `module.exports = { ... }`
 *
 * Style matches scripts/amvcp-diagram.js / amvcp-interactive.js —
 * `var`, function declarations, ES5-safe, no arrow functions, no
 * template literals, no classes.
 *
 * Public API:
 *   injectStyles(doc)               — append the skill <style>
 *   init(root)                      — wire every widget on the page
 *   initQuizRadio(el)               — wire one .ve-quiz-radio
 *   initQuizMulti(el)               — wire one .ve-quiz-multi
 *   initNumericInput(el)            — wire one .ve-numeric-input
 *   initDateInput(el)               — wire one .ve-date-input
 *   initColorInput(el)              — wire one .ve-color-input
 *   initSlider(el)                  — wire one .ve-slider
 *   initToggle(el)                  — wire one .ve-toggle
 *   initRating(el)                  — wire one .ve-rating
 *   initCardPicker(el)              — wire one .ve-card-picker
 *   initTagInput(el)                — wire one .ve-tag-input
 *   initTextInput(el)               — wire one .ve-text-input
 *   initTextArea(el)                — wire one .ve-text-area
 *   initUrlInput(el)                — wire one .ve-url-input
 *   initTreePicker(el)              — wire one .ve-tree-picker
 *   initPasswordInput(el)           — wire one .ve-password-input
 *   initCurrencyInput(el)           — wire one .ve-currency-input
 *   initGalleryPicker(el)           — wire one .ve-gallery-picker
 *   initTierList(el)                — wire one .ve-tier-list
 *   initRankList(el)                — wire one .ve-rank-list
 *   readModel(el)                   — parse embedded JSON (or null)
 *   loadValue(id, def)              — localStorage read
 *   saveValue(id, value)            — localStorage write
 *   emitChange(kind, id, value)     — fire `ve-form-change` on document
 */
(function () {
  'use strict';

  var LS_PREFIX = 'amvcp-form-input:';
  var STYLE_ID = 'vc-form-inputs-styles';

  // ── Storage helpers (graceful degradation on Safari private mode) ──
  function loadValue(id, def) {
    try {
      if (typeof localStorage === 'undefined') { return def; }
      var raw = localStorage.getItem(LS_PREFIX + id);
      if (raw === null) { return def; }
      try { return JSON.parse(raw); }
      catch (e) { return def; }
    } catch (e) { return def; }
  }
  function saveValue(id, value) {
    try {
      if (typeof localStorage === 'undefined') { return; }
      localStorage.setItem(LS_PREFIX + id, JSON.stringify(value));
    } catch (e) { /* quota / private mode — silently degrade */ }
  }

  // ── Event helper ───────────────────────────────────────────────────
  function emitChange(kind, id, value) {
    if (typeof document === 'undefined' || !document.dispatchEvent) {
      return;
    }
    var ev;
    try {
      ev = new CustomEvent('ve-form-change',
        { bubbles: true, detail: { kind: kind, id: id, value: value } });
    } catch (e) {
      // Older browsers — fall back to a synthetic event.
      ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('ve-form-change', true, false,
        { kind: kind, id: id, value: value });
    }
    document.dispatchEvent(ev);
  }

  // ── Fail-fast helper ───────────────────────────────────────────────
  function paintError(hostEl, message) {
    hostEl.textContent = '';
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'padding:10px 12px;'
      + 'font:12px/1.4 var(--vc-font-mono, ui-monospace, monospace);'
      + 'color:var(--vc-color-danger, #a84a32);'
      + 'background:color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 8%, transparent);'
      + 'border:1px solid var(--vc-color-danger, #a84a32);'
      + 'border-radius:var(--vc-radius-md, 8px);';
    box.textContent = '[form-input error] ' + message;
    hostEl.appendChild(box);
  }

  function readModel(el) {
    var jsonEl = el.querySelector(':scope > script[type="application/json"]');
    if (!jsonEl) { return null; }
    try { return JSON.parse(jsonEl.textContent || ''); }
    catch (e) {
      paintError(el, 'malformed JSON: ' + (e && e.message));
      return null;
    }
  }

  function requireId(el) {
    var id = el.getAttribute('data-ve-id');
    if (!id) {
      paintError(el, 'missing data-ve-id attribute');
      return null;
    }
    return id;
  }

  // ── §1 ve-quiz-radio ───────────────────────────────────────────────
  function initQuizRadio(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.options) || model.options.length < 2) {
      paintError(el, 'quiz-radio requires options[] with >= 2 items');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'quiz-radio');
    var current = loadValue(id, model['default'] || null);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('p');
      lab.className = 've-quiz-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var group = document.createElement('div');
    group.className = 've-quiz-options';
    group.setAttribute('role', 'radiogroup');
    if (labelText) { group.setAttribute('aria-label', labelText); }
    var name = 've-quiz-' + id + '-' + Math.random().toString(36).slice(2, 8);
    for (var i = 0; i < model.options.length; i++) {
      (function (opt) {
        var item = document.createElement('label');
        item.className = 've-quiz-option';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = opt.value;
        if (current === opt.value) { input.checked = true; }
        input.addEventListener('change', function () {
          if (input.checked) {
            saveValue(id, opt.value);
            emitChange('quiz-radio', id, opt.value);
          }
        });
        var text = document.createElement('span');
        text.className = 've-quiz-option-text';
        text.textContent = opt.label || opt.value;
        item.appendChild(input);
        item.appendChild(text);
        group.appendChild(item);
      })(model.options[i]);
    }
    el.appendChild(group);
  }

  // ── §2 ve-quiz-multi ───────────────────────────────────────────────
  function initQuizMulti(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.options) || model.options.length < 1) {
      paintError(el, 'quiz-multi requires options[] with >= 1 item');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'quiz-multi');
    var currentArr = loadValue(id,
      Array.isArray(model['default']) ? model['default'] : []);
    var currentSet = {};
    for (var ci = 0; ci < currentArr.length; ci++) {
      currentSet[currentArr[ci]] = true;
    }
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab2 = document.createElement('p');
      lab2.className = 've-quiz-label';
      lab2.textContent = labelText;
      el.appendChild(lab2);
    }
    var group2 = document.createElement('div');
    group2.className = 've-quiz-options';
    group2.setAttribute('role', 'group');
    if (labelText) { group2.setAttribute('aria-label', labelText); }
    function flush() {
      var out = [];
      var boxes = group2.querySelectorAll('input[type="checkbox"]');
      for (var k = 0; k < boxes.length; k++) {
        if (boxes[k].checked) { out.push(boxes[k].value); }
      }
      saveValue(id, out);
      emitChange('quiz-multi', id, out);
    }
    for (var i = 0; i < model.options.length; i++) {
      (function (opt) {
        var item = document.createElement('label');
        item.className = 've-quiz-option';
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.value = opt.value;
        if (currentSet[opt.value]) { input.checked = true; }
        input.addEventListener('change', flush);
        var text = document.createElement('span');
        text.className = 've-quiz-option-text';
        text.textContent = opt.label || opt.value;
        item.appendChild(input);
        item.appendChild(text);
        group2.appendChild(item);
      })(model.options[i]);
    }
    el.appendChild(group2);
  }

  // ── §3 ve-numeric-input ────────────────────────────────────────────
  function initNumericInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'numeric-input');
    var def = {
      value: typeof model.value === 'number' ? model.value : 0,
      unit: model.unit || (Array.isArray(model.units)
        ? model.units[0] : 'px'),
      min: typeof model.min === 'number' ? model.min : null,
      max: typeof model.max === 'number' ? model.max : null,
      step: typeof model.step === 'number' ? model.step : 1
    };
    var current = loadValue(id, def);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-numeric-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var num = document.createElement('input');
    num.type = 'number';
    num.className = 've-numeric-value';
    num.value = String(current.value !== undefined
      ? current.value : def.value);
    if (def.min !== null) { num.min = String(def.min); }
    if (def.max !== null) { num.max = String(def.max); }
    num.step = String(def.step);
    var units = Array.isArray(model.units) && model.units.length
      ? model.units : [def.unit];
    var sel = document.createElement('select');
    sel.className = 've-numeric-unit';
    for (var i = 0; i < units.length; i++) {
      var o = document.createElement('option');
      o.value = units[i];
      o.textContent = units[i];
      if ((current.unit || def.unit) === units[i]) { o.selected = true; }
      sel.appendChild(o);
    }
    function fire() {
      var v = { value: parseFloat(num.value), unit: sel.value };
      if (!isFinite(v.value)) { v.value = def.value; }
      saveValue(id, v);
      emitChange('numeric-input', id, v);
    }
    num.addEventListener('input', fire);
    sel.addEventListener('change', fire);
    el.appendChild(num);
    el.appendChild(sel);
  }

  // ── §4 ve-date-input ───────────────────────────────────────────────
  function initDateInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'date-input');
    var current = loadValue(id, model.value || '');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-date-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var input = document.createElement('input');
    input.type = 'date';
    input.className = 've-date-value';
    if (current) { input.value = current; }
    if (model.min) { input.min = model.min; }
    if (model.max) { input.max = model.max; }
    input.addEventListener('change', function () {
      saveValue(id, input.value);
      emitChange('date-input', id, input.value);
    });
    el.appendChild(input);
  }

  // ── §5 ve-color-input ──────────────────────────────────────────────
  function initColorInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'color-input');
    var current = loadValue(id, model.value || '#888888');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-color-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var input = document.createElement('input');
    input.type = 'color';
    input.className = 've-color-value';
    input.value = current;
    var hex = document.createElement('span');
    hex.className = 've-color-hex';
    hex.textContent = current.toLowerCase();
    input.addEventListener('input', function () {
      hex.textContent = input.value.toLowerCase();
      saveValue(id, input.value);
      emitChange('color-input', id, input.value);
    });
    el.appendChild(input);
    el.appendChild(hex);
  }

  // ── §6 ve-slider ───────────────────────────────────────────────────
  //
  // Themed range slider. Optional ticks[] array renders labeled
  // marks below the track via a <datalist>. The current value
  // displays to the right of the slider with its (optional) unit.
  function initSlider(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'slider');
    var def = {
      value: typeof model.value === 'number' ? model.value : 0,
      min:   typeof model.min   === 'number' ? model.min   : 0,
      max:   typeof model.max   === 'number' ? model.max   : 100,
      step:  typeof model.step  === 'number' ? model.step  : 1,
      unit:  model.unit || ''
    };
    var current = loadValue(id, def.value);
    if (typeof current !== 'number') { current = def.value; }
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-slider-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var row = document.createElement('div');
    row.className = 've-slider-row';
    var input = document.createElement('input');
    input.type = 'range';
    input.className = 've-slider-value';
    input.min  = String(def.min);
    input.max  = String(def.max);
    input.step = String(def.step);
    input.value = String(current);
    var listId = '';
    if (Array.isArray(model.ticks) && model.ticks.length) {
      listId = 've-slider-ticks-' + Math.random().toString(36).slice(2, 8);
      var dl = document.createElement('datalist');
      dl.id = listId;
      for (var t = 0; t < model.ticks.length; t++) {
        var tick = model.ticks[t];
        var op = document.createElement('option');
        op.value = String(tick.value !== undefined ? tick.value : tick);
        if (tick.label) { op.label = tick.label; }
        dl.appendChild(op);
      }
      el.appendChild(dl);
      input.setAttribute('list', listId);
    }
    var readout = document.createElement('span');
    readout.className = 've-slider-readout';
    function paint(v) {
      readout.textContent = v + (def.unit ? (' ' + def.unit) : '');
    }
    paint(current);
    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      if (!isFinite(v)) { v = def.value; }
      paint(v);
      saveValue(id, v);
      emitChange('slider', id, v);
    });
    row.appendChild(input);
    row.appendChild(readout);
    el.appendChild(row);
    // Render tick labels under the track when supplied
    if (Array.isArray(model.ticks) && model.ticks.length) {
      var legend = document.createElement('div');
      legend.className = 've-slider-tick-labels';
      var range = (def.max - def.min) || 1;
      for (var ti = 0; ti < model.ticks.length; ti++) {
        var tk = model.ticks[ti];
        var val = tk.value !== undefined ? tk.value : tk;
        var pct = ((val - def.min) / range) * 100;
        var sp = document.createElement('span');
        sp.className = 've-slider-tick';
        sp.style.left = pct + '%';
        sp.textContent = tk.label || String(val);
        legend.appendChild(sp);
      }
      el.appendChild(legend);
    }
  }

  // ── §7 ve-toggle ───────────────────────────────────────────────────
  //
  // Themed boolean switch. Renders a label + an aria-checked button
  // styled as a sliding pill (track + knob). Click toggles the state
  // and fires ve-form-change with a boolean.
  function initToggle(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'toggle');
    var current = loadValue(id,
      typeof model.value === 'boolean' ? model.value : false);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 've-toggle-switch';
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', current ? 'true' : 'false');
    if (labelText) { btn.setAttribute('aria-label', labelText); }
    var knob = document.createElement('span');
    knob.className = 've-toggle-knob';
    btn.appendChild(knob);
    var lab = document.createElement('span');
    lab.className = 've-toggle-label';
    lab.textContent = labelText;
    el.appendChild(btn);
    el.appendChild(lab);
    // Optional on/off captions
    if (model.onLabel || model.offLabel) {
      var cap = document.createElement('span');
      cap.className = 've-toggle-caption';
      cap.textContent = current ? (model.onLabel || 'on')
                                : (model.offLabel || 'off');
      el.appendChild(cap);
      btn.__veCaption = cap;
      btn.__veCapOn  = model.onLabel  || 'on';
      btn.__veCapOff = model.offLabel || 'off';
    }
    function flip() {
      var v = !(btn.getAttribute('aria-checked') === 'true');
      btn.setAttribute('aria-checked', v ? 'true' : 'false');
      if (btn.__veCaption) {
        btn.__veCaption.textContent = v ? btn.__veCapOn : btn.__veCapOff;
      }
      saveValue(id, v);
      emitChange('toggle', id, v);
    }
    btn.addEventListener('click', flip);
    btn.addEventListener('keydown', function (ev) {
      if (ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        flip();
      }
    });
    // Clicking the label also flips (matches native <label> behaviour)
    lab.addEventListener('click', function () { btn.focus(); flip(); });
  }

  // ── §8 ve-rating ───────────────────────────────────────────────────
  //
  // 1-N star (or dot) rating. Reads model.max (default 5) and
  // model.shape ("star" | "dot") to pick the glyph. Hover paints up
  // to the hovered slot; click commits the choice. A 0 ("clear")
  // button is shown on the right.
  function initRating(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'rating');
    var max = (typeof model.max === 'number' && model.max > 0) ? model.max : 5;
    var shape = (model.shape === 'dot') ? 'dot' : 'star';
    var current = loadValue(id,
      typeof model.value === 'number' ? model.value : 0);
    if (typeof current !== 'number' || current < 0 || current > max) {
      current = 0;
    }
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-rating-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var row = document.createElement('div');
    row.className = 've-rating-row';
    var slots = [];
    function paint(level) {
      for (var i = 0; i < slots.length; i++) {
        if (i < level) { slots[i].classList.add('ve-rating-filled'); }
        else { slots[i].classList.remove('ve-rating-filled'); }
      }
      readout.textContent = level + ' / ' + max;
    }
    for (var i = 0; i < max; i++) {
      (function (idx) {
        var slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 've-rating-slot ve-rating-' + shape;
        slot.setAttribute('aria-label', 'rate ' + (idx + 1));
        slot.setAttribute('data-rating-value', String(idx + 1));
        slot.textContent = (shape === 'star') ? '★' : '●';
        slot.addEventListener('mouseenter', function () { paint(idx + 1); });
        slot.addEventListener('focus',      function () { paint(idx + 1); });
        slot.addEventListener('click', function (ev) {
          ev.preventDefault();
          current = idx + 1;
          paint(current);
          saveValue(id, current);
          emitChange('rating', id, current);
        });
        row.appendChild(slot);
        slots.push(slot);
      })(i);
    }
    row.addEventListener('mouseleave', function () { paint(current); });
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 've-rating-clear';
    clearBtn.textContent = '✕';
    clearBtn.title = 'Clear rating';
    clearBtn.setAttribute('aria-label', 'Clear rating');
    clearBtn.addEventListener('click', function () {
      current = 0;
      paint(0);
      saveValue(id, 0);
      emitChange('rating', id, 0);
    });
    row.appendChild(clearBtn);
    var readout = document.createElement('span');
    readout.className = 've-rating-readout';
    row.appendChild(readout);
    el.appendChild(row);
    paint(current);
  }

  // ── §9 ve-card-picker ──────────────────────────────────────────────
  //
  // Single-select picker where each option is a CARD with title +
  // subtitle + body + optional icon (an emoji glyph or a single SVG
  // path string). Visually denser than ve-quiz-radio — for picking
  // between rich proposals, not yes/no flavours of a value.
  function initCardPicker(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.options) || model.options.length < 2) {
      paintError(el, 'card-picker requires options[] with >= 2 items');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'card-picker');
    var current = loadValue(id, model['default'] || null);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('p');
      lab.className = 've-card-picker-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var grid = document.createElement('div');
    grid.className = 've-card-picker-grid';
    grid.setAttribute('role', 'radiogroup');
    if (labelText) { grid.setAttribute('aria-label', labelText); }
    var cards = [];
    function paint() {
      for (var k = 0; k < cards.length; k++) {
        var sel = cards[k].__veValue === current;
        cards[k].setAttribute('aria-checked', sel ? 'true' : 'false');
        if (sel) { cards[k].classList.add('ve-card-picker-selected'); }
        else { cards[k].classList.remove('ve-card-picker-selected'); }
      }
    }
    for (var i = 0; i < model.options.length; i++) {
      (function (opt) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 've-card-picker-card';
        card.setAttribute('role', 'radio');
        card.__veValue = opt.value;
        card.setAttribute('data-card-value', opt.value);
        card.setAttribute('aria-checked', current === opt.value
          ? 'true' : 'false');
        if (opt.icon) {
          var icon = document.createElement('span');
          icon.className = 've-card-picker-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = opt.icon;
          card.appendChild(icon);
        }
        var body = document.createElement('span');
        body.className = 've-card-picker-body';
        var title = document.createElement('span');
        title.className = 've-card-picker-title';
        title.textContent = opt.label || opt.value;
        body.appendChild(title);
        if (opt.subtitle) {
          var sub = document.createElement('span');
          sub.className = 've-card-picker-subtitle';
          sub.textContent = opt.subtitle;
          body.appendChild(sub);
        }
        if (opt.body) {
          var text = document.createElement('span');
          text.className = 've-card-picker-text';
          text.textContent = opt.body;
          body.appendChild(text);
        }
        card.appendChild(body);
        card.addEventListener('click', function () {
          current = opt.value;
          paint();
          saveValue(id, current);
          emitChange('card-picker', id, current);
        });
        card.addEventListener('keydown', function (ev) {
          if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            card.click();
          }
        });
        grid.appendChild(card);
        cards.push(card);
      })(model.options[i]);
    }
    el.appendChild(grid);
    paint();
  }

  // ── §10 ve-tag-input ───────────────────────────────────────────────
  //
  // Typed tags with chip display + optional autocomplete suggestions.
  // The user types into the text input; pressing Enter or comma
  // commits the typed text as a chip. Clicking a chip's ✕ removes it.
  // If model.suggestions is supplied, matching ones are listed below
  // the input as clickable buttons.
  function initTagInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'tag-input');
    var tags = loadValue(id,
      Array.isArray(model['default']) ? model['default'].slice() : []);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    var placeholder = model.placeholder || 'add a tag…';
    var suggestions = Array.isArray(model.suggestions) ? model.suggestions : [];
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-tag-input-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var box = document.createElement('div');
    box.className = 've-tag-input-box';
    var chipWrap = document.createElement('span');
    chipWrap.className = 've-tag-input-chips';
    box.appendChild(chipWrap);
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 've-tag-input-field';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', labelText || 'tag input');
    box.appendChild(input);
    var hints = document.createElement('div');
    hints.className = 've-tag-input-hints';
    el.appendChild(box);
    el.appendChild(hints);

    function flush() {
      saveValue(id, tags.slice());
      emitChange('tag-input', id, tags.slice());
    }
    function removeTag(t) {
      var idx = tags.indexOf(t);
      if (idx === -1) { return; }
      tags.splice(idx, 1);
      paintChips();
      paintHints();
      flush();
    }
    function addTag(t) {
      var v = (t || '').trim();
      if (!v) { return; }
      if (tags.indexOf(v) !== -1) { return; }   // dedupe
      tags.push(v);
      paintChips();
      paintHints();
      flush();
    }
    function paintChips() {
      chipWrap.textContent = '';
      for (var ci = 0; ci < tags.length; ci++) {
        (function (t) {
          var chip = document.createElement('span');
          chip.className = 've-tag-input-chip';
          var label = document.createElement('span');
          label.className = 've-tag-input-chip-label';
          label.textContent = t;
          var x = document.createElement('button');
          x.type = 'button';
          x.className = 've-tag-input-chip-x';
          x.textContent = '×';
          x.title = 'Remove "' + t + '"';
          x.setAttribute('aria-label', 'Remove ' + t);
          x.addEventListener('click', function (ev) {
            ev.preventDefault();
            removeTag(t);
          });
          chip.appendChild(label);
          chip.appendChild(x);
          chipWrap.appendChild(chip);
        })(tags[ci]);
      }
    }
    function paintHints() {
      hints.textContent = '';
      if (!suggestions.length) { return; }
      var q = input.value.toLowerCase().trim();
      var matches = [];
      for (var si = 0; si < suggestions.length; si++) {
        var s = suggestions[si];
        if (tags.indexOf(s) !== -1) { continue; }
        if (!q || s.toLowerCase().indexOf(q) !== -1) { matches.push(s); }
      }
      if (!matches.length) { return; }
      for (var mi = 0; mi < matches.length && mi < 8; mi++) {
        (function (s) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 've-tag-input-hint';
          b.textContent = s;
          b.title = 'Add tag "' + s + '"';
          b.addEventListener('click', function (ev) {
            ev.preventDefault();
            addTag(s);
            input.value = '';
            input.focus();
          });
          hints.appendChild(b);
        })(matches[mi]);
      }
    }
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ',') {
        ev.preventDefault();
        addTag(input.value);
        input.value = '';
        paintHints();
      } else if (ev.key === 'Backspace' && input.value === ''
                 && tags.length > 0) {
        // Quick-remove last tag on Backspace in empty field
        removeTag(tags[tags.length - 1]);
      }
    });
    input.addEventListener('input', paintHints);
    input.addEventListener('blur', function () {
      // Commit a non-empty trailing value on blur (so the user can
      // click "Done" without first pressing Enter).
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    });
    paintChips();
    paintHints();
  }

  // ── §11 ve-text-input ──────────────────────────────────────────────
  //
  // Themed single-line text input with optional live validation. The
  // model carries:
  //   value:        initial string (or "")
  //   placeholder:  ghost text
  //   pattern:      JS regex source (without slashes)
  //   patternMsg:   error string when pattern doesn't match
  //   minLength:    optional
  //   maxLength:    optional (also caps the input)
  //   required:     true → empty value = invalid
  //
  // The event payload is { value: <string>, valid: <boolean> } so
  // downstream code can gate on validity.
  function initTextInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'text-input');
    var current = loadValue(id, model.value || '');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    var pat = null;
    if (model.pattern) {
      try { pat = new RegExp('^(?:' + model.pattern + ')$'); }
      catch (e) {
        paintError(el, 'text-input pattern is not a valid regex: '
          + (e && e.message));
        return;
      }
    }
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-text-input-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 've-text-input-field';
    if (model.placeholder) { input.placeholder = model.placeholder; }
    if (typeof model.maxLength === 'number') {
      input.maxLength = model.maxLength;
    }
    if (typeof model.minLength === 'number') {
      input.minLength = model.minLength;
    }
    input.value = current;
    var err = document.createElement('span');
    err.className = 've-text-input-error';
    err.setAttribute('aria-live', 'polite');
    function validate() {
      var v = input.value;
      var problems = [];
      if (model.required && !v.trim()) { problems.push('required'); }
      if (pat && v && !pat.test(v)) {
        problems.push(model.patternMsg || 'invalid format');
      }
      if (typeof model.minLength === 'number'
          && v.length < model.minLength) {
        problems.push('min length ' + model.minLength);
      }
      err.textContent = problems.join(' · ');
      var valid = problems.length === 0;
      el.classList.toggle('ve-text-input-invalid', !valid);
      return valid;
    }
    input.addEventListener('input', function () {
      var valid = validate();
      saveValue(id, input.value);
      emitChange('text-input', id, { value: input.value, valid: valid });
    });
    input.addEventListener('blur', validate);
    el.appendChild(input);
    el.appendChild(err);
    validate();
  }

  // ── §12 ve-text-area ───────────────────────────────────────────────
  //
  // Themed multi-line textarea with optional maxLength + live char count.
  function initTextArea(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'text-area');
    var current = loadValue(id, model.value || '');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-text-area-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var ta = document.createElement('textarea');
    ta.className = 've-text-area-field';
    if (model.placeholder) { ta.placeholder = model.placeholder; }
    if (typeof model.maxLength === 'number') {
      ta.maxLength = model.maxLength;
    }
    if (typeof model.rows === 'number') {
      ta.rows = model.rows;
    } else {
      ta.rows = 4;
    }
    ta.value = current;
    var counter = document.createElement('span');
    counter.className = 've-text-area-counter';
    counter.setAttribute('aria-live', 'polite');
    function paintCounter() {
      if (typeof model.maxLength === 'number') {
        counter.textContent = ta.value.length + ' / ' + model.maxLength;
        var nearLimit = ta.value.length >= model.maxLength * 0.9;
        counter.classList.toggle('ve-text-area-near-limit', nearLimit);
      } else {
        counter.textContent = ta.value.length + ' chars';
      }
    }
    paintCounter();
    ta.addEventListener('input', function () {
      paintCounter();
      saveValue(id, ta.value);
      emitChange('text-area', id, ta.value);
    });
    el.appendChild(ta);
    el.appendChild(counter);
  }

  // ── §13 ve-url-input ───────────────────────────────────────────────
  //
  // Single-line URL input. Validates with the URL constructor (so
  // anything `new URL(value)` accepts is valid). When valid, shows
  // a small "preview" link to the right that opens in a new tab.
  function initUrlInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'url-input');
    var current = loadValue(id, model.value || '');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-url-input-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var row = document.createElement('div');
    row.className = 've-url-input-row';
    var input = document.createElement('input');
    input.type = 'url';
    input.className = 've-url-input-field';
    input.value = current;
    if (model.placeholder) {
      input.placeholder = model.placeholder;
    } else {
      input.placeholder = 'https://…';
    }
    var preview = document.createElement('a');
    preview.className = 've-url-input-preview';
    preview.target = '_blank';
    preview.rel = 'noopener noreferrer';
    preview.textContent = 'open ↗';
    var err = document.createElement('span');
    err.className = 've-url-input-error';
    err.setAttribute('aria-live', 'polite');
    function parse(v) {
      if (!v) { return { ok: !model.required, error: '' }; }
      try {
        var u = new URL(v);
        if (Array.isArray(model.allowedProtocols)
            && model.allowedProtocols.length) {
          var p = u.protocol.replace(':', '');
          if (model.allowedProtocols.indexOf(p) === -1) {
            return { ok: false, error: 'protocol must be one of '
              + model.allowedProtocols.join(', ') };
          }
        }
        return { ok: true, error: '', url: v };
      } catch (e) {
        return { ok: false, error: 'not a valid URL' };
      }
    }
    function paint() {
      var p = parse(input.value);
      err.textContent = p.error;
      el.classList.toggle('ve-url-input-invalid', !p.ok);
      if (p.ok && p.url) {
        preview.href = p.url;
        preview.style.display = '';
      } else {
        preview.removeAttribute('href');
        preview.style.display = 'none';
      }
      return p.ok;
    }
    input.addEventListener('input', function () {
      var valid = paint();
      saveValue(id, input.value);
      emitChange('url-input', id, { value: input.value, valid: valid });
    });
    input.addEventListener('blur', paint);
    row.appendChild(input);
    row.appendChild(preview);
    el.appendChild(row);
    el.appendChild(err);
    paint();
  }

  // ── §14 ve-tree-picker ─────────────────────────────────────────────
  //
  // Hierarchical single-select picker for file trees, folder pickers,
  // skill catalogues, etc. The model is a nested {label, value?,
  // children?} tree. Each non-leaf node is a "branch" that can be
  // expanded/collapsed by clicking its caret or label. Each leaf
  // (no children) is selectable; click commits its `value` (or its
  // accumulated dot-joined path when `value` is omitted) and emits a
  // ve-form-change.
  //
  // Persistence: the selected path AND the set of expanded branch
  // paths are saved separately to localStorage so a refresh restores
  // both the selection and the expansion state.
  function _renderTreeNode(doc, node, depth, parentPath, ctx) {
    var path = node.value !== undefined && node.value !== null
      ? String(node.value)
      : (parentPath ? parentPath + '/' : '') + (node.label || '');
    var hasChildren = Array.isArray(node.children)
                      && node.children.length > 0;
    var li = doc.createElement('li');
    li.className = 've-tree-node ' + (hasChildren
      ? 've-tree-branch' : 've-tree-leaf');
    li.setAttribute('role', 'treeitem');
    li.setAttribute('aria-level', String(depth + 1));
    li.setAttribute('data-tree-path', path);

    var row = doc.createElement('div');
    row.className = 've-tree-row';
    row.style.paddingLeft = (depth * 16 + 6) + 'px';

    if (hasChildren) {
      var caret = doc.createElement('button');
      caret.type = 'button';
      caret.className = 've-tree-caret';
      caret.setAttribute('aria-label',
        'Expand or collapse ' + (node.label || ''));
      caret.textContent = '▸';
      caret.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        toggleBranch();
      });
      row.appendChild(caret);
    } else {
      var spacer = doc.createElement('span');
      spacer.className = 've-tree-bullet';
      spacer.textContent = '·';
      row.appendChild(spacer);
    }

    var icon = doc.createElement('span');
    icon.className = 've-tree-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = node.icon
      || (hasChildren ? '\u{1F4C1}' : '\u{1F4C4}');   // 📁 / 📄
    row.appendChild(icon);

    var label = doc.createElement('span');
    label.className = 've-tree-label';
    label.textContent = node.label || node.value || '?';
    row.appendChild(label);

    li.appendChild(row);

    var childList = null;
    if (hasChildren) {
      childList = doc.createElement('ul');
      childList.className = 've-tree-children';
      childList.setAttribute('role', 'group');
      for (var i = 0; i < node.children.length; i++) {
        childList.appendChild(_renderTreeNode(doc, node.children[i],
          depth + 1, path, ctx));
      }
      li.appendChild(childList);
      // Restore expanded state
      var open = ctx.expanded[path] === true
        || ctx.expanded[path] === undefined && (depth < ctx.defaultDepth);
      setOpen(open);
    }

    function setOpen(o) {
      li.classList.toggle('ve-tree-open', o);
      li.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (childList) {
        childList.style.display = o ? '' : 'none';
      }
      if (row.querySelector('.ve-tree-caret')) {
        row.querySelector('.ve-tree-caret').textContent = o ? '▾' : '▸';
      }
      ctx.expanded[path] = o;
      ctx.saveExpanded();
    }
    function toggleBranch() {
      setOpen(!li.classList.contains('ve-tree-open'));
    }

    // Click handler — leaf selects, branch toggles
    function rowActivate(ev) {
      if (ev.preventDefault) { ev.preventDefault(); }
      if (hasChildren) {
        toggleBranch();
      } else {
        ctx.selectLeaf(path, li);
      }
    }
    row.addEventListener('click', rowActivate);
    row.addEventListener('keydown', function (ev) {
      if (ev.key === ' ' || ev.key === 'Enter') { rowActivate(ev); }
    });

    if (!hasChildren) {
      label.setAttribute('tabindex', '0');
      label.setAttribute('role', 'option');
      if (path === ctx.selectedPath) {
        li.classList.add('ve-tree-selected');
        label.setAttribute('aria-selected', 'true');
      }
    }

    return li;
  }

  function initTreePicker(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.tree) || model.tree.length === 0) {
      paintError(el, 'tree-picker requires a non-empty tree[] array');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'tree-picker');
    var LS_EXP = id + ':expanded';
    var selectedPath = loadValue(id, model['default'] || '');
    var expanded = loadValue(LS_EXP, {}) || {};
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    var defaultDepth = typeof model.defaultDepth === 'number'
      ? model.defaultDepth : 1;
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-tree-picker-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var readout = document.createElement('span');
    readout.className = 've-tree-picker-readout';
    function paintReadout() {
      readout.textContent = selectedPath
        ? ('selected: ' + selectedPath) : '(no selection)';
    }
    var rootList = document.createElement('ul');
    rootList.className = 've-tree-root';
    rootList.setAttribute('role', 'tree');
    if (labelText) { rootList.setAttribute('aria-label', labelText); }
    var ctx = {
      selectedPath: selectedPath,
      expanded: expanded,
      defaultDepth: defaultDepth,
      saveExpanded: function () { saveValue(LS_EXP, expanded); },
      selectLeaf: function (path, li) {
        // Repaint old selection off
        var prev = rootList.querySelector('.ve-tree-selected');
        if (prev) { prev.classList.remove('ve-tree-selected'); }
        var prevLabel = rootList.querySelector('[aria-selected="true"]');
        if (prevLabel) { prevLabel.removeAttribute('aria-selected'); }
        selectedPath = path;
        ctx.selectedPath = path;
        li.classList.add('ve-tree-selected');
        var newLabel = li.querySelector('.ve-tree-label');
        if (newLabel) { newLabel.setAttribute('aria-selected', 'true'); }
        paintReadout();
        saveValue(id, path);
        emitChange('tree-picker', id, path);
      }
    };
    for (var i = 0; i < model.tree.length; i++) {
      rootList.appendChild(_renderTreeNode(document, model.tree[i],
        0, '', ctx));
    }
    el.appendChild(rootList);
    el.appendChild(readout);
    paintReadout();
  }

  // ── §15 ve-password-input ──────────────────────────────────────────
  //
  // Masked text input with a show/hide eye toggle and a 4-bar strength
  // meter. Strength is computed from length + char-class diversity
  // (lower / upper / digit / symbol) so the score is portable across
  // browsers. The event payload is { value: <string>, strength: 0..4 }
  // so downstream code can gate on a minimum.
  //
  // Privacy note: the LS persistence default for password is OFF (a
  // saved password in localStorage is a footgun on a shared machine).
  // Set `persist: true` in the model JSON to opt in.
  function _passwordStrength(s) {
    if (!s) { return 0; }
    var hasLower = /[a-z]/.test(s);
    var hasUpper = /[A-Z]/.test(s);
    var hasDigit = /[0-9]/.test(s);
    var hasSymbol = /[^A-Za-z0-9]/.test(s);
    var classes = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0)
                + (hasDigit ? 1 : 0) + (hasSymbol ? 1 : 0);
    var len = s.length;
    // Score 0..4 — weights chosen so 8+ chars + 3 classes lands at 3,
    // 12+ chars + 4 classes lands at 4.
    if (len < 4) { return 0; }
    if (len < 8 || classes <= 1) { return 1; }
    if (len < 10 || classes <= 2) { return 2; }
    if (len < 12 || classes <= 3) { return 3; }
    return 4;
  }
  var PASSWORD_STRENGTH_LABELS = [
    'too short', 'weak', 'fair', 'good', 'strong'
  ];

  function initPasswordInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'password-input');
    var persist = model.persist === true;
    var current = persist ? loadValue(id, model.value || '')
                          : (model.value || '');
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    var minLen = typeof model.minLength === 'number' ? model.minLength : 0;
    var minStrength = typeof model.minStrength === 'number'
      ? model.minStrength : 0;
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-password-input-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var row = document.createElement('div');
    row.className = 've-password-input-row';
    var input = document.createElement('input');
    input.type = 'password';
    input.className = 've-password-input-field';
    input.value = current;
    if (model.placeholder) { input.placeholder = model.placeholder; }
    if (model.autocomplete) { input.autocomplete = model.autocomplete; }
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 've-password-input-toggle';
    toggle.title = 'Show / hide password';
    toggle.setAttribute('aria-label', 'Toggle password visibility');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = '\u{1F441}';        // 👁
    toggle.addEventListener('click', function () {
      var hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      toggle.textContent = hidden ? '\u{1F576}' : '\u{1F441}'; // 🕶 / 👁
    });
    row.appendChild(input);
    row.appendChild(toggle);
    el.appendChild(row);
    var meter = document.createElement('div');
    meter.className = 've-password-input-meter';
    meter.setAttribute('aria-hidden', 'true');
    var bars = [];
    for (var i = 0; i < 4; i++) {
      var bar = document.createElement('span');
      bar.className = 've-password-input-bar';
      meter.appendChild(bar);
      bars.push(bar);
    }
    el.appendChild(meter);
    var status = document.createElement('span');
    status.className = 've-password-input-status';
    status.setAttribute('aria-live', 'polite');
    el.appendChild(status);
    function paint() {
      var v = input.value;
      var s = _passwordStrength(v);
      // Light up s bars (s in [0,4])
      for (var k = 0; k < bars.length; k++) {
        bars[k].classList.toggle('ve-password-input-bar-on', k < s);
        // Tint progressive bars
        bars[k].classList.remove('ve-password-input-bar-weak',
          've-password-input-bar-fair', 've-password-input-bar-good',
          've-password-input-bar-strong');
        if (k < s) {
          var cls = 've-password-input-bar-' +
            (s === 1 ? 'weak' : s === 2 ? 'fair'
             : s === 3 ? 'good' : 'strong');
          bars[k].classList.add(cls);
        }
      }
      var problems = [];
      if (v.length < minLen) {
        problems.push('min length ' + minLen);
      }
      if (s < minStrength) {
        problems.push('strength must be ≥ '
          + PASSWORD_STRENGTH_LABELS[minStrength]);
      }
      var label = PASSWORD_STRENGTH_LABELS[s];
      status.textContent = label + (problems.length
        ? ' · ' + problems.join(' · ') : '');
      el.classList.toggle('ve-password-input-invalid', problems.length > 0);
      return { strength: s, valid: problems.length === 0 };
    }
    input.addEventListener('input', function () {
      var r = paint();
      if (persist) { saveValue(id, input.value); }
      emitChange('password-input', id, {
        value: input.value,
        strength: r.strength,
        valid: r.valid
      });
    });
    paint();
  }

  // ── §16 ve-currency-input ──────────────────────────────────────────
  //
  // Numeric amount with a currency-symbol prefix and an optional
  // dropdown to switch currencies. The display formats with the
  // browser's Intl.NumberFormat when available (so 1234.5 renders
  // "$1,234.50" in en-US, "1.234,50 €" in de-DE) but stores + emits
  // the raw {amount, currency} payload.
  var CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'Fr',
    CAD: 'CA$', AUD: 'A$', CNY: '¥', INR: '₹', BTC: '₿'
  };

  function _formatCurrency(amount, currency, locale) {
    if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
      var sym = CURRENCY_SYMBOLS[currency] || (currency + ' ');
      return sym + (isFinite(amount) ? amount.toFixed(2) : '0.00');
    }
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: 'currency', currency: currency
      }).format(amount);
    } catch (e) {
      return (CURRENCY_SYMBOLS[currency] || currency + ' ')
        + (isFinite(amount) ? amount.toFixed(2) : '0.00');
    }
  }

  function initCurrencyInput(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el) || {};
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'currency-input');
    var def = {
      amount: typeof model.amount === 'number' ? model.amount : 0,
      currency: model.currency || 'USD'
    };
    var current = loadValue(id, def);
    if (!current || typeof current.amount !== 'number') { current = def; }
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    var locale = model.locale || undefined;
    var currencies = Array.isArray(model.currencies) && model.currencies.length
      ? model.currencies : [current.currency];
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('label');
      lab.className = 've-currency-input-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var row = document.createElement('div');
    row.className = 've-currency-input-row';
    var sym = document.createElement('span');
    sym.className = 've-currency-input-symbol';
    function paintSymbol(c) {
      sym.textContent = CURRENCY_SYMBOLS[c] || c;
    }
    paintSymbol(current.currency);
    row.appendChild(sym);
    var input = document.createElement('input');
    input.type = 'number';
    input.className = 've-currency-input-amount';
    input.value = String(current.amount);
    input.step = model.step ? String(model.step) : '0.01';
    if (typeof model.min === 'number') { input.min = String(model.min); }
    if (typeof model.max === 'number') { input.max = String(model.max); }
    row.appendChild(input);
    var sel = null;
    if (currencies.length > 1) {
      sel = document.createElement('select');
      sel.className = 've-currency-input-select';
      for (var i = 0; i < currencies.length; i++) {
        var o = document.createElement('option');
        o.value = currencies[i];
        o.textContent = currencies[i];
        if (currencies[i] === current.currency) { o.selected = true; }
        sel.appendChild(o);
      }
      row.appendChild(sel);
    }
    el.appendChild(row);
    var preview = document.createElement('span');
    preview.className = 've-currency-input-preview';
    function paintPreview() {
      preview.textContent = _formatCurrency(
        parseFloat(input.value) || 0,
        sel ? sel.value : current.currency,
        locale
      );
    }
    paintPreview();
    el.appendChild(preview);
    function fire() {
      var v = {
        amount: parseFloat(input.value),
        currency: sel ? sel.value : current.currency
      };
      if (!isFinite(v.amount)) { v.amount = 0; }
      saveValue(id, v);
      emitChange('currency-input', id, v);
    }
    input.addEventListener('input', function () {
      paintPreview();
      fire();
    });
    if (sel) {
      sel.addEventListener('change', function () {
        paintSymbol(sel.value);
        paintPreview();
        fire();
      });
    }
  }

  // ── §17 ve-gallery-picker ──────────────────────────────────────────
  //
  // Single-select picker from N image cards. Each option has a
  // thumbnail src + a caption. Conceptually richer than card-picker:
  // for picking between art styles, brand palettes, image presets,
  // material samples, etc. Images that fail to load fall back to a
  // muted "(image unavailable)" placeholder so the picker still
  // works for the visible caption.
  function initGalleryPicker(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.options) || model.options.length < 2) {
      paintError(el, 'gallery-picker requires options[] with >= 2 items');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'gallery-picker');
    var current = loadValue(id, model['default'] || null);
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('p');
      lab.className = 've-gallery-picker-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    var grid = document.createElement('div');
    grid.className = 've-gallery-picker-grid';
    grid.setAttribute('role', 'radiogroup');
    if (labelText) { grid.setAttribute('aria-label', labelText); }
    var cards = [];
    function paint() {
      for (var k = 0; k < cards.length; k++) {
        var sel = cards[k].__veValue === current;
        cards[k].setAttribute('aria-checked', sel ? 'true' : 'false');
        cards[k].classList.toggle('ve-gallery-picker-selected', sel);
      }
    }
    for (var i = 0; i < model.options.length; i++) {
      (function (opt) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 've-gallery-picker-card';
        card.setAttribute('role', 'radio');
        card.__veValue = opt.value;
        card.setAttribute('data-gallery-value', opt.value);
        card.setAttribute('aria-checked', current === opt.value
          ? 'true' : 'false');
        var thumb = document.createElement('div');
        thumb.className = 've-gallery-picker-thumb';
        if (opt.src) {
          var img = document.createElement('img');
          img.className = 've-gallery-picker-img';
          img.alt = opt.label || opt.value;
          img.loading = 'lazy';
          img.src = opt.src;
          img.addEventListener('error', function () {
            img.style.display = 'none';
            var ph = document.createElement('span');
            ph.className = 've-gallery-picker-placeholder';
            ph.textContent = '(image unavailable)';
            thumb.appendChild(ph);
          });
          thumb.appendChild(img);
        } else {
          var ph = document.createElement('span');
          ph.className = 've-gallery-picker-placeholder';
          ph.textContent = opt.emoji || '\u{1F5BC}';   // 🖼
          thumb.appendChild(ph);
        }
        card.appendChild(thumb);
        var cap = document.createElement('span');
        cap.className = 've-gallery-picker-caption';
        cap.textContent = opt.label || opt.value;
        card.appendChild(cap);
        if (opt.subtitle) {
          var sub = document.createElement('span');
          sub.className = 've-gallery-picker-subtitle';
          sub.textContent = opt.subtitle;
          card.appendChild(sub);
        }
        card.addEventListener('click', function () {
          current = opt.value;
          paint();
          saveValue(id, current);
          emitChange('gallery-picker', id, current);
        });
        card.addEventListener('keydown', function (ev) {
          if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            card.click();
          }
        });
        grid.appendChild(card);
        cards.push(card);
      })(model.options[i]);
    }
    el.appendChild(grid);
    paint();
  }

  // ── §18 ve-tier-list ───────────────────────────────────────────────
  //
  // Tier-list maker: drag items between tier zones (S / A / B / C / D
  // by default, customisable via model.tiers). Items start in an
  // "unranked" bucket and the user drags each into the appropriate
  // tier. The emitted payload is { tier1: ["item1","item2"],
  // tier2: ["item3"], unranked: ["item4"] }.
  //
  // The drag uses the same HTML5 API the rank-list uses, so the
  // implementation is mostly bookkeeping around which tier-bucket the
  // item ended up in.
  function initTierList(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var model = readModel(el);
    if (!model || !Array.isArray(model.items) || model.items.length < 1) {
      paintError(el, 'tier-list requires items[] with >= 1 item');
      return;
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'tier-list');
    var tiers = Array.isArray(model.tiers) && model.tiers.length
      ? model.tiers
      : [
          { key: 'S', label: 'S', tone: 'best' },
          { key: 'A', label: 'A', tone: 'great' },
          { key: 'B', label: 'B', tone: 'good' },
          { key: 'C', label: 'C', tone: 'fair' },
          { key: 'D', label: 'D', tone: 'weak' }
        ];
    var labelText = model.label || el.getAttribute('data-ve-label') || '';
    // Saved assignment: { itemKey: tierKey | 'unranked' }
    var saved = loadValue(id, {});
    if (!saved || typeof saved !== 'object') { saved = {}; }
    el.textContent = '';
    if (labelText) {
      var lab = document.createElement('p');
      lab.className = 've-tier-list-label';
      lab.textContent = labelText;
      el.appendChild(lab);
    }
    // Map of tier-key -> the <ul> that holds its items
    var lists = {};
    function buildRow(tier) {
      var row = document.createElement('div');
      row.className = 've-tier-row';
      row.setAttribute('data-tier-key', tier.key);
      if (tier.tone) { row.setAttribute('data-tier-tone', tier.tone); }
      var badge = document.createElement('div');
      badge.className = 've-tier-badge';
      if (tier.tone) { badge.setAttribute('data-tier-tone', tier.tone); }
      badge.textContent = tier.label || tier.key;
      var ul = document.createElement('ul');
      ul.className = 've-tier-bucket';
      ul.setAttribute('data-tier-key', tier.key);
      ul.setAttribute('role', 'list');
      lists[tier.key] = ul;
      row.appendChild(badge);
      row.appendChild(ul);
      return row;
    }
    for (var i = 0; i < tiers.length; i++) {
      el.appendChild(buildRow(tiers[i]));
    }
    // Unranked bucket at the bottom
    var unranked = document.createElement('div');
    unranked.className = 've-tier-row ve-tier-unranked-row';
    unranked.setAttribute('data-tier-key', 'unranked');
    var ubadge = document.createElement('div');
    ubadge.className = 've-tier-badge ve-tier-badge-unranked';
    ubadge.textContent = 'unranked';
    var uul = document.createElement('ul');
    uul.className = 've-tier-bucket';
    uul.setAttribute('data-tier-key', 'unranked');
    uul.setAttribute('role', 'list');
    lists['unranked'] = uul;
    unranked.appendChild(ubadge);
    unranked.appendChild(uul);
    el.appendChild(unranked);

    var dragged = null;
    function setupItem(li) {
      li.classList.add('ve-tier-item');
      li.setAttribute('draggable', 'true');
      li.addEventListener('dragstart', function (ev) {
        dragged = li;
        li.classList.add('ve-tier-dragging');
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = 'move';
          try { ev.dataTransfer.setData('text/plain',
            li.getAttribute('data-item-key') || ''); }
          catch (_) {}
        }
      });
      li.addEventListener('dragend', function () {
        if (dragged) { dragged.classList.remove('ve-tier-dragging'); }
        dragged = null;
        for (var k in lists) {
          if (lists.hasOwnProperty(k)) {
            lists[k].classList.remove('ve-tier-drop-target');
          }
        }
      });
    }
    function setupBucket(bucket) {
      bucket.addEventListener('dragover', function (ev) {
        if (!dragged) { return; }
        if (ev.preventDefault) { ev.preventDefault(); }
        if (ev.dataTransfer) { ev.dataTransfer.dropEffect = 'move'; }
        bucket.classList.add('ve-tier-drop-target');
      });
      bucket.addEventListener('dragleave', function () {
        bucket.classList.remove('ve-tier-drop-target');
      });
      bucket.addEventListener('drop', function (ev) {
        if (ev.preventDefault) { ev.preventDefault(); }
        if (!dragged) { return; }
        bucket.appendChild(dragged);
        bucket.classList.remove('ve-tier-drop-target');
        flush();
      });
    }
    // Build + place every item in its saved tier (default: unranked)
    for (var ii = 0; ii < model.items.length; ii++) {
      (function (it) {
        var key = it.key || it.value || ('item-' + ii);
        var li = document.createElement('li');
        li.setAttribute('data-item-key', key);
        li.setAttribute('title', it.label || key);
        if (it.icon) {
          var ic = document.createElement('span');
          ic.className = 've-tier-icon';
          ic.textContent = it.icon;
          li.appendChild(ic);
        }
        var lbl = document.createElement('span');
        lbl.className = 've-tier-text';
        lbl.textContent = it.label || key;
        li.appendChild(lbl);
        setupItem(li);
        var target = saved[key] && lists[saved[key]] ? saved[key] : 'unranked';
        lists[target].appendChild(li);
      })(model.items[ii]);
    }
    for (var bk in lists) {
      if (lists.hasOwnProperty(bk)) { setupBucket(lists[bk]); }
    }
    function flush() {
      var assignment = {};
      var payload = {};
      for (var k in lists) {
        if (!lists.hasOwnProperty(k)) { continue; }
        var nodes = lists[k].querySelectorAll(':scope > li');
        var arr = [];
        for (var i = 0; i < nodes.length; i++) {
          var key = nodes[i].getAttribute('data-item-key');
          if (key) {
            arr.push(key);
            assignment[key] = k;
          }
        }
        payload[k] = arr;
      }
      saveValue(id, assignment);
      emitChange('tier-list', id, payload);
    }
  }

  // ── §19 ve-rank-list ───────────────────────────────────────────────
  //
  // Drag-to-reorder a <li> stack. Uses HTML5 drag-and-drop. Persists
  // the post-drag order as an array of `data-ve-rank-key` values; on
  // load the saved order is applied to the DOM before wiring drag.
  function initRankList(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'rank-list');
    var ol = el.querySelector(':scope > ol, :scope > ul');
    if (!ol) {
      paintError(el, 'rank-list requires a child <ol> or <ul>');
      return;
    }
    var items = Array.prototype.slice.call(ol.children);
    // Drop anything that's not an <li>
    for (var ii = items.length - 1; ii >= 0; ii--) {
      if (items[ii].tagName !== 'LI') { items.splice(ii, 1); }
    }
    if (items.length < 2) { return; }   // nothing to rank
    // Apply saved order
    var saved = loadValue(id, null);
    if (Array.isArray(saved)) {
      var byKey = {};
      for (var ki = 0; ki < items.length; ki++) {
        var k = items[ki].getAttribute('data-ve-rank-key');
        if (k) { byKey[k] = items[ki]; }
      }
      for (var si = 0; si < saved.length; si++) {
        var node = byKey[saved[si]];
        if (node) { ol.appendChild(node); }
      }
    }
    // Wire drag on every <li>
    items = Array.prototype.slice.call(ol.children);   // re-read post-reorder
    var dragged = null;
    function readOrder() {
      var lis = ol.querySelectorAll(':scope > li');
      var out = [];
      for (var i = 0; i < lis.length; i++) {
        var key = lis[i].getAttribute('data-ve-rank-key');
        if (key) { out.push(key); }
      }
      return out;
    }
    function setupItem(li) {
      li.setAttribute('draggable', 'true');
      li.classList.add('ve-rank-item');
      li.addEventListener('dragstart', function (ev) {
        dragged = li;
        li.classList.add('ve-rank-dragging');
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = 'move';
          // setData required for Firefox to actually trigger drag.
          try { ev.dataTransfer.setData('text/plain',
            li.getAttribute('data-ve-rank-key') || ''); }
          catch (_) { /* ignore */ }
        }
      });
      li.addEventListener('dragend', function () {
        if (dragged) { dragged.classList.remove('ve-rank-dragging'); }
        dragged = null;
        var lisAfter = ol.querySelectorAll(':scope > li');
        for (var i = 0; i < lisAfter.length; i++) {
          lisAfter[i].classList.remove('ve-rank-drop-target');
        }
      });
      li.addEventListener('dragover', function (ev) {
        if (!dragged || dragged === li) { return; }
        if (ev.preventDefault) { ev.preventDefault(); }
        if (ev.dataTransfer) { ev.dataTransfer.dropEffect = 'move'; }
        li.classList.add('ve-rank-drop-target');
      });
      li.addEventListener('dragleave', function () {
        li.classList.remove('ve-rank-drop-target');
      });
      li.addEventListener('drop', function (ev) {
        if (ev.preventDefault) { ev.preventDefault(); }
        if (!dragged || dragged === li) { return; }
        // Insert before or after based on the drop position
        var rect = li.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (ev.clientY < midY) {
          ol.insertBefore(dragged, li);
        } else {
          ol.insertBefore(dragged, li.nextSibling);
        }
        li.classList.remove('ve-rank-drop-target');
        var order = readOrder();
        saveValue(id, order);
        emitChange('rank-list', id, order);
      });
    }
    for (var pi = 0; pi < items.length; pi++) { setupItem(items[pi]); }
  }

  // ── init dispatcher ───────────────────────────────────────────────
  function init(root) {
    var d = root || document;
    var rad = d.querySelectorAll('.ve-quiz-radio');
    for (var i = 0; i < rad.length; i++) { initQuizRadio(rad[i]); }
    var mul = d.querySelectorAll('.ve-quiz-multi');
    for (var j = 0; j < mul.length; j++) { initQuizMulti(mul[j]); }
    var num = d.querySelectorAll('.ve-numeric-input');
    for (var k = 0; k < num.length; k++) { initNumericInput(num[k]); }
    var dat = d.querySelectorAll('.ve-date-input');
    for (var l = 0; l < dat.length; l++) { initDateInput(dat[l]); }
    var col = d.querySelectorAll('.ve-color-input');
    for (var m = 0; m < col.length; m++) { initColorInput(col[m]); }
    var sld = d.querySelectorAll('.ve-slider');
    for (var o = 0; o < sld.length; o++) { initSlider(sld[o]); }
    var tog = d.querySelectorAll('.ve-toggle');
    for (var p = 0; p < tog.length; p++) { initToggle(tog[p]); }
    var rat = d.querySelectorAll('.ve-rating');
    for (var q = 0; q < rat.length; q++) { initRating(rat[q]); }
    var crd = d.querySelectorAll('.ve-card-picker');
    for (var u = 0; u < crd.length; u++) { initCardPicker(crd[u]); }
    var tag = d.querySelectorAll('.ve-tag-input');
    for (var v = 0; v < tag.length; v++) { initTagInput(tag[v]); }
    var txt = d.querySelectorAll('.ve-text-input');
    for (var w = 0; w < txt.length; w++) { initTextInput(txt[w]); }
    var ta  = d.querySelectorAll('.ve-text-area');
    for (var x = 0; x < ta.length; x++) { initTextArea(ta[x]); }
    var url = d.querySelectorAll('.ve-url-input');
    for (var y = 0; y < url.length; y++) { initUrlInput(url[y]); }
    var trp = d.querySelectorAll('.ve-tree-picker');
    for (var z = 0; z < trp.length; z++) { initTreePicker(trp[z]); }
    var pwd = d.querySelectorAll('.ve-password-input');
    for (var aa = 0; aa < pwd.length; aa++) { initPasswordInput(pwd[aa]); }
    var cur = d.querySelectorAll('.ve-currency-input');
    for (var bb = 0; bb < cur.length; bb++) { initCurrencyInput(cur[bb]); }
    var gal = d.querySelectorAll('.ve-gallery-picker');
    for (var cc = 0; cc < gal.length; cc++) { initGalleryPicker(gal[cc]); }
    var tier = d.querySelectorAll('.ve-tier-list');
    for (var dd = 0; dd < tier.length; dd++) { initTierList(tier[dd]); }
    var rnk = d.querySelectorAll('.ve-rank-list');
    for (var n = 0; n < rnk.length; n++) { initRankList(rnk[n]); }
  }

  // ── CSS — themed via --vc-* with hardcoded fallbacks ──────────────
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — form-inputs skill (injected) */',

    '.ve-quiz-radio, .ve-quiz-multi, .ve-numeric-input,',
    '.ve-date-input, .ve-color-input, .ve-slider, .ve-toggle,',
    '.ve-rating, .ve-card-picker, .ve-tag-input, .ve-text-input,',
    '.ve-text-area, .ve-url-input, .ve-tree-picker,',
    '.ve-password-input, .ve-currency-input, .ve-gallery-picker,',
    '.ve-tier-list, .ve-rank-list {',
    '  display: block;',
    '  margin-block: 12px;',
    '  padding: 12px 14px;',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  font: 14px/1.45 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',

    /* Selection + hover affordance — the runtime's universal selection
       model wires data-ve-id, but standalone usage still gets a hint. */
    '.ve-quiz-radio[data-ve-id]:hover, .ve-quiz-multi[data-ve-id]:hover,',
    '.ve-numeric-input[data-ve-id]:hover, .ve-date-input[data-ve-id]:hover,',
    '.ve-color-input[data-ve-id]:hover, .ve-slider[data-ve-id]:hover,',
    '.ve-toggle[data-ve-id]:hover, .ve-rating[data-ve-id]:hover,',
    '.ve-card-picker[data-ve-id]:hover, .ve-tag-input[data-ve-id]:hover,',
    '.ve-text-input[data-ve-id]:hover, .ve-text-area[data-ve-id]:hover,',
    '.ve-url-input[data-ve-id]:hover, .ve-tree-picker[data-ve-id]:hover,',
    '.ve-password-input[data-ve-id]:hover,',
    '.ve-currency-input[data-ve-id]:hover,',
    '.ve-gallery-picker[data-ve-id]:hover,',
    '.ve-tier-list[data-ve-id]:hover,',
    '.ve-rank-list[data-ve-id]:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-quiz-radio[data-ve-selected="1"],',
    '.ve-quiz-multi[data-ve-selected="1"],',
    '.ve-numeric-input[data-ve-selected="1"],',
    '.ve-date-input[data-ve-selected="1"],',
    '.ve-color-input[data-ve-selected="1"],',
    '.ve-slider[data-ve-selected="1"],',
    '.ve-toggle[data-ve-selected="1"],',
    '.ve-rating[data-ve-selected="1"],',
    '.ve-card-picker[data-ve-selected="1"],',
    '.ve-tag-input[data-ve-selected="1"],',
    '.ve-text-input[data-ve-selected="1"],',
    '.ve-text-area[data-ve-selected="1"],',
    '.ve-url-input[data-ve-selected="1"],',
    '.ve-tree-picker[data-ve-selected="1"],',
    '.ve-password-input[data-ve-selected="1"],',
    '.ve-currency-input[data-ve-selected="1"],',
    '.ve-gallery-picker[data-ve-selected="1"],',
    '.ve-tier-list[data-ve-selected="1"],',
    '.ve-rank-list[data-ve-selected="1"] {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',

    /* Shared labels */
    '.ve-quiz-label, .ve-numeric-label, .ve-date-label, .ve-color-label,',
    '.ve-slider-label, .ve-rating-label, .ve-card-picker-label,',
    '.ve-tag-input-label, .ve-text-input-label,',
    '.ve-text-area-label, .ve-url-input-label,',
    '.ve-tree-picker-label, .ve-password-input-label,',
    '.ve-currency-input-label, .ve-gallery-picker-label,',
    '.ve-tier-list-label {',
    '  display: block;',
    '  font-weight: 600;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  margin: 0 0 8px;',
    '}',

    /* Quiz options (shared by radio and multi) */
    '.ve-quiz-options {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 6px;',
    '}',
    '.ve-quiz-option {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  padding: 6px 10px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  cursor: pointer;',
    '  user-select: none;',
    '}',
    '.ve-quiz-option:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 8%, transparent);',
    '}',
    '.ve-quiz-option input { accent-color: var(--vc-color-accent, #b8861f); }',
    '.ve-quiz-option-text { color: var(--vc-color-content, #1f1a14); }',

    /* Numeric */
    '.ve-numeric-input {',
    '  display: flex;',
    '  align-items: center;',
    '  flex-wrap: wrap;',
    '  gap: 8px;',
    '}',
    '.ve-numeric-input .ve-numeric-label { flex-basis: 100%; margin: 0; }',
    '.ve-numeric-value {',
    '  width: 110px;',
    '  padding: 6px 8px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '}',
    '.ve-numeric-unit {',
    '  padding: 6px 8px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '}',

    /* Date */
    '.ve-date-input {',
    '  display: flex;',
    '  align-items: center;',
    '  flex-wrap: wrap;',
    '  gap: 8px;',
    '}',
    '.ve-date-input .ve-date-label { flex-basis: 100%; margin: 0; }',
    '.ve-date-value {',
    '  padding: 6px 8px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  min-width: 160px;',
    '}',

    /* Color */
    '.ve-color-input {',
    '  display: flex;',
    '  align-items: center;',
    '  flex-wrap: wrap;',
    '  gap: 8px;',
    '}',
    '.ve-color-input .ve-color-label { flex-basis: 100%; margin: 0; }',
    '.ve-color-value {',
    '  width: 44px;',
    '  height: 32px;',
    '  padding: 2px;',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  cursor: pointer;',
    '}',
    '.ve-color-hex {',
    '  font: 600 13px/1 var(--vc-font-mono, ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  letter-spacing: 0.02em;',
    '}',

    /* Slider */
    '.ve-slider-row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '}',
    '.ve-slider-value {',
    '  flex: 1;',
    '  accent-color: var(--vc-color-accent, #b8861f);',
    '  height: 18px;',
    '  cursor: pointer;',
    '}',
    '.ve-slider-readout {',
    '  font: 600 13px/1 var(--vc-font-mono, ui-monospace, monospace);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  letter-spacing: 0.01em;',
    '  min-width: 64px;',
    '  text-align: right;',
    '}',
    '.ve-slider-tick-labels {',
    '  position: relative;',
    '  height: 18px;',
    '  margin-top: 4px;',
    '}',
    '.ve-slider-tick {',
    '  position: absolute;',
    '  transform: translateX(-50%);',
    '  font: 11px/1 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',

    /* Toggle */
    '.ve-toggle {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  flex-wrap: wrap;',
    '}',
    '.ve-toggle-switch {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  width: 42px;',
    '  height: 24px;',
    '  border-radius: 999px;',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  position: relative;',
    '  cursor: pointer;',
    '  transition: background 160ms ease, border-color 160ms ease;',
    '  padding: 0;',
    '  flex: none;',
    '}',
    '.ve-toggle-switch:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 2px;',
    '}',
    '.ve-toggle-switch[aria-checked="true"] {',
    '  background: var(--vc-color-accent, #b8861f);',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-toggle-knob {',
    '  position: absolute;',
    '  top: 2px;',
    '  left: 2px;',
    '  width: 18px;',
    '  height: 18px;',
    '  border-radius: 50%;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);',
    '  transition: transform 160ms ease;',
    '}',
    '.ve-toggle-switch[aria-checked="true"] .ve-toggle-knob {',
    '  transform: translateX(18px);',
    '  background: var(--vc-color-on-accent, #ffffff);',
    '}',
    '.ve-toggle-label {',
    '  font-weight: 600;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  cursor: pointer;',
    '}',
    '.ve-toggle-caption {',
    '  margin-left: auto;',
    '  font: 600 12px/1 var(--vc-font-mono, ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  text-transform: lowercase;',
    '  letter-spacing: 0.04em;',
    '}',

    /* Rating */
    '.ve-rating-row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 4px;',
    '}',
    '.ve-rating-slot {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 0;',
    '  font: 22px/1 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-border-strong, #c9bfa3);',
    '  cursor: pointer;',
    '  padding: 2px 4px;',
    '  line-height: 1;',
    '  transition: color 120ms ease;',
    '}',
    '.ve-rating-slot:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 2px;',
    '  border-radius: 4px;',
    '}',
    '.ve-rating-filled {',
    '  color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-rating-dot { font-size: 18px; }',
    '.ve-rating-clear {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 0;',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '  cursor: pointer;',
    '  font: 14px/1 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  margin-left: 8px;',
    '  padding: 4px 6px;',
    '  border-radius: 4px;',
    '}',
    '.ve-rating-clear:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 12%, transparent);',
    '  color: var(--vc-color-danger, #a84a32);',
    '}',
    '.ve-rating-readout {',
    '  margin-left: 12px;',
    '  font: 600 12px/1 var(--vc-font-mono, ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  font-variant-numeric: tabular-nums;',
    '}',

    /* Card picker */
    '.ve-card-picker-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));',
    '  gap: 10px;',
    '}',
    '.ve-card-picker-card {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  text-align: left;',
    '  display: flex;',
    '  align-items: flex-start;',
    '  gap: 10px;',
    '  padding: 12px 14px;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  font: inherit;',
    '  color: inherit;',
    '  cursor: pointer;',
    '  transition: border-color 120ms ease, box-shadow 120ms ease,'
      + ' transform 120ms ease;',
    '}',
    '.ve-card-picker-card:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  transform: translateY(-1px);',
    '}',
    '.ve-card-picker-card:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 2px;',
    '}',
    '.ve-card-picker-selected {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 8%, transparent);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 35%, transparent);',
    '}',
    '.ve-card-picker-icon {',
    '  font-size: 22px;',
    '  line-height: 1;',
    '  flex: none;',
    '  color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-card-picker-body {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 4px;',
    '  min-width: 0;',
    '}',
    '.ve-card-picker-title {',
    '  font-weight: 700;',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-card-picker-subtitle {',
    '  font-size: 12px;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  letter-spacing: 0.02em;',
    '  text-transform: uppercase;',
    '}',
    '.ve-card-picker-text {',
    '  font-size: 13px;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  line-height: 1.4;',
    '}',

    /* Tag input */
    '.ve-tag-input-box {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 6px 8px;',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  min-height: 40px;',
    '}',
    '.ve-tag-input-box:focus-within {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',
    '.ve-tag-input-chips {',
    '  display: contents;',
    '}',
    '.ve-tag-input-chip {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 4px;',
    '  padding: 3px 4px 3px 10px;',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 16%, transparent);',
    '  border-radius: 999px;',
    '  font: 13px/1.2 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-tag-input-chip-x {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  border: 0;',
    '  background: transparent;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  cursor: pointer;',
    '  font-size: 14px;',
    '  line-height: 1;',
    '  padding: 2px 6px;',
    '  border-radius: 50%;',
    '}',
    '.ve-tag-input-chip-x:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 18%, transparent);',
    '  color: var(--vc-color-danger, #a84a32);',
    '}',
    '.ve-tag-input-field {',
    '  flex: 1;',
    '  min-width: 120px;',
    '  border: 0;',
    '  outline: none;',
    '  background: transparent;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  padding: 4px 2px;',
    '}',
    '.ve-tag-input-field::placeholder {',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.ve-tag-input-hints {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 4px;',
    '  margin-top: 8px;',
    '}',
    '.ve-tag-input-hint {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  border: 1px dashed var(--vc-color-border-strong, #c9bfa3);',
    '  background: transparent;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  border-radius: 999px;',
    '  padding: 3px 10px;',
    '  font: 12px/1.2 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  cursor: pointer;',
    '}',
    '.ve-tag-input-hint:hover {',
    '  border-style: solid;',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',

    /* Text input + textarea + URL input — shared field styling */
    '.ve-text-input-field, .ve-text-area-field, .ve-url-input-field {',
    '  width: 100%;',
    '  box-sizing: border-box;',
    '  padding: 8px 10px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  outline: none;',
    '}',
    '.ve-text-input-field:focus, .ve-text-area-field:focus,',
    '.ve-url-input-field:focus {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',
    '.ve-text-input-field::placeholder, .ve-text-area-field::placeholder,',
    '.ve-url-input-field::placeholder {',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.ve-text-area-field {',
    '  resize: vertical;',
    '  min-height: 80px;',
    '  font-family: var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '}',
    '.ve-text-input-error, .ve-url-input-error {',
    '  display: block;',
    '  margin-top: 6px;',
    '  min-height: 1.2em;',
    '  font: 12px/1.3 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-danger, #a84a32);',
    '}',
    '.ve-text-input-invalid .ve-text-input-field,',
    '.ve-url-input-invalid .ve-url-input-field {',
    '  border-color: var(--vc-color-danger, #a84a32);',
    '}',
    '.ve-text-input-invalid .ve-text-input-field:focus,',
    '.ve-url-input-invalid .ve-url-input-field:focus {',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 25%, transparent);',
    '}',
    '.ve-text-area-counter {',
    '  display: block;',
    '  margin-top: 6px;',
    '  font: 11px/1 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  text-align: right;',
    '  font-variant-numeric: tabular-nums;',
    '}',
    '.ve-text-area-near-limit {',
    '  color: var(--vc-color-warning, #a8791f);',
    '  font-weight: 700;',
    '}',
    /* URL input — preview link sits to the right of the field */
    '.ve-url-input-row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '}',
    '.ve-url-input-row > .ve-url-input-field { flex: 1; }',
    '.ve-url-input-preview {',
    '  flex: none;',
    '  padding: 7px 12px;',
    '  font: 600 12px/1 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  background: var(--vc-color-accent, #b8861f);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  text-decoration: none;',
    '}',
    '.ve-url-input-preview:hover { filter: brightness(1.08); }',

    /* Tree picker */
    '.ve-tree-root, .ve-tree-children {',
    '  list-style: none;',
    '  margin: 0;',
    '  padding: 0;',
    '}',
    '.ve-tree-row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 4px 6px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  cursor: pointer;',
    '  user-select: none;',
    '}',
    '.ve-tree-row:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 8%, transparent);',
    '}',
    '.ve-tree-caret {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 0;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  cursor: pointer;',
    '  font: 12px/1 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  width: 18px;',
    '  height: 18px;',
    '  padding: 0;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  border-radius: 4px;',
    '}',
    '.ve-tree-caret:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 16%, transparent);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-tree-bullet {',
    '  width: 18px;',
    '  text-align: center;',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.ve-tree-icon {',
    '  font-size: 14px;',
    '  line-height: 1;',
    '  flex: none;',
    '}',
    '.ve-tree-label {',
    '  font: 14px/1.3 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '}',
    '.ve-tree-selected > .ve-tree-row {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 18%, transparent);',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: -2px;',
    '}',
    '.ve-tree-selected > .ve-tree-row > .ve-tree-label {',
    '  font-weight: 600;',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-tree-leaf .ve-tree-icon {',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.ve-tree-picker-readout {',
    '  display: block;',
    '  margin-top: 8px;',
    '  padding: 6px 10px;',
    '  font: 12px/1 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '}',

    /* Password input */
    '.ve-password-input-row {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '}',
    '.ve-password-input-field {',
    '  flex: 1;',
    '  padding: 8px 10px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  outline: none;',
    '  letter-spacing: 0.06em;',
    '}',
    '.ve-password-input-field:focus {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',
    '.ve-password-input-toggle {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  padding: 6px 10px;',
    '  font-size: 16px;',
    '  line-height: 1;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  cursor: pointer;',
    '}',
    '.ve-password-input-toggle:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-password-input-meter {',
    '  display: flex;',
    '  gap: 4px;',
    '  margin-top: 8px;',
    '}',
    '.ve-password-input-bar {',
    '  flex: 1;',
    '  height: 5px;',
    '  border-radius: 3px;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  transition: background 160ms ease;',
    '}',
    '.ve-password-input-bar-weak    { background: var(--vc-color-danger, #a84a32); }',
    '.ve-password-input-bar-fair    { background: var(--vc-color-warning, #a8791f); }',
    '.ve-password-input-bar-good    { background: var(--vc-color-info, #3464a8); }',
    '.ve-password-input-bar-strong  { background: var(--vc-color-success, #3a6b5c); }',
    '.ve-password-input-status {',
    '  display: block;',
    '  margin-top: 6px;',
    '  font: 12px/1.3 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.ve-password-input-invalid .ve-password-input-status {',
    '  color: var(--vc-color-danger, #a84a32);',
    '}',

    /* Currency input */
    '.ve-currency-input-row {',
    '  display: inline-flex;',
    '  align-items: stretch;',
    '  gap: 0;',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  overflow: hidden;',
    '}',
    '.ve-currency-input-row:focus-within {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',
    '.ve-currency-input-symbol {',
    '  padding: 8px 10px;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  font: 600 14px/1.2 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  display: inline-flex;',
    '  align-items: center;',
    '  border-right: 1px solid var(--vc-color-border, #e3dcc9);',
    '}',
    '.ve-currency-input-amount {',
    '  padding: 8px 10px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: transparent;',
    '  border: 0;',
    '  outline: none;',
    '  width: 140px;',
    '  font-variant-numeric: tabular-nums;',
    '}',
    '.ve-currency-input-select {',
    '  padding: 8px 10px;',
    '  font: inherit;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border: 0;',
    '  border-left: 1px solid var(--vc-color-border, #e3dcc9);',
    '  outline: none;',
    '  cursor: pointer;',
    '}',
    '.ve-currency-input-preview {',
    '  display: inline-block;',
    '  margin-left: 12px;',
    '  font: 600 13px/1 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  letter-spacing: 0.01em;',
    '  vertical-align: middle;',
    '}',

    /* Gallery picker */
    '.ve-gallery-picker-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));',
    '  gap: 10px;',
    '}',
    '.ve-gallery-picker-card {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  text-align: center;',
    '  display: flex;',
    '  flex-direction: column;',
    '  align-items: stretch;',
    '  gap: 6px;',
    '  padding: 6px;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  font: inherit;',
    '  color: inherit;',
    '  cursor: pointer;',
    '  transition: transform 120ms ease, border-color 120ms ease,'
      + ' box-shadow 120ms ease;',
    '}',
    '.ve-gallery-picker-card:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  transform: translateY(-1px);',
    '}',
    '.ve-gallery-picker-card:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 2px;',
    '}',
    '.ve-gallery-picker-selected {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 3px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 35%, transparent);',
    '}',
    '.ve-gallery-picker-thumb {',
    '  width: 100%;',
    '  aspect-ratio: 4 / 3;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  overflow: hidden;',
    '}',
    '.ve-gallery-picker-img {',
    '  width: 100%;',
    '  height: 100%;',
    '  object-fit: cover;',
    '  display: block;',
    '}',
    '.ve-gallery-picker-placeholder {',
    '  font-size: 32px;',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.ve-gallery-picker-caption {',
    '  font: 600 13px/1.3 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-gallery-picker-subtitle {',
    '  font: 11px/1.2 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  letter-spacing: 0.02em;',
    '}',

    /* Tier list */
    '.ve-tier-row {',
    '  display: flex;',
    '  align-items: stretch;',
    '  gap: 0;',
    '  margin-bottom: 4px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  overflow: hidden;',
    '}',
    '.ve-tier-badge {',
    '  flex: none;',
    '  width: 60px;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font: 800 18px/1 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  background: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.ve-tier-badge[data-tier-tone="best"]   { background: var(--vc-color-danger, #a84a32); }',
    '.ve-tier-badge[data-tier-tone="great"]  { background: var(--vc-color-warning, #a8791f); }',
    '.ve-tier-badge[data-tier-tone="good"]   { background: var(--vc-color-accent, #b8861f); }',
    '.ve-tier-badge[data-tier-tone="fair"]   { background: var(--vc-color-info, #3464a8); }',
    '.ve-tier-badge[data-tier-tone="weak"]   { background: var(--vc-color-success, #3a6b5c); }',
    '.ve-tier-badge-unranked {',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  font: 600 11px/1 var(--vc-font-mono,'
      + ' ui-monospace, monospace);',
    '  text-transform: lowercase;',
    '  letter-spacing: 0.04em;',
    '}',
    '.ve-tier-bucket {',
    '  list-style: none;',
    '  margin: 0;',
    '  padding: 8px;',
    '  flex: 1;',
    '  min-height: 56px;',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 6px;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-left: 0;',
    '  border-radius: 0 var(--vc-radius-sm, 4px) var(--vc-radius-sm, 4px) 0;',
    '}',
    '.ve-tier-drop-target {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 16%, transparent);',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-tier-item {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 4px;',
    '  padding: 4px 10px;',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
    '  border-radius: 999px;',
    '  font: 14px/1.3 var(--vc-font-body,'
      + ' ui-sans-serif, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  cursor: grab;',
    '  user-select: none;',
    '}',
    '.ve-tier-item:hover { border-color: var(--vc-color-accent, #b8861f); }',
    '.ve-tier-dragging { opacity: 0.5; cursor: grabbing; }',
    '.ve-tier-icon { font-size: 14px; line-height: 1; }',

    /* Rank list */
    '.ve-rank-list > ol, .ve-rank-list > ul {',
    '  list-style: decimal inside;',
    '  margin: 0;',
    '  padding: 0;',
    '  counter-reset: ve-rank;',
    '}',
    '.ve-rank-list > ul { list-style: none; }',
    '.ve-rank-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  padding: 8px 10px;',
    '  margin-block: 4px;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  cursor: grab;',
    '  user-select: none;',
    '  transition: transform 120ms ease, box-shadow 120ms ease;',
    '}',
    '.ve-rank-item::before {',
    '  content: "\\2630";',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '  font-size: 16px;',
    '  flex: none;',
    '  cursor: grab;',
    '}',
    '.ve-rank-item:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-rank-dragging {',
    '  opacity: 0.5;',
    '  transform: scale(0.98);',
    '}',
    '.ve-rank-drop-target {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 35%, transparent);',
    '}',

    /* prefers-reduced-motion */
    '@media (prefers-reduced-motion: reduce) {',
    '  .ve-rank-item { transition: none; }',
    '}',
    ''
  ];
  var CSS_TEXT = CSS_LINES.join('\n');

  function injectStyles(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById && d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS_TEXT;
    d.head.appendChild(style);
  }

  // ── Public API ─────────────────────────────────────────────────────
  var api = {
    injectStyles: injectStyles,
    init: init,
    initQuizRadio: initQuizRadio,
    initQuizMulti: initQuizMulti,
    initNumericInput: initNumericInput,
    initDateInput: initDateInput,
    initColorInput: initColorInput,
    initSlider: initSlider,
    initToggle: initToggle,
    initRating: initRating,
    initCardPicker: initCardPicker,
    initTagInput: initTagInput,
    initTextInput: initTextInput,
    initTextArea: initTextArea,
    initUrlInput: initUrlInput,
    initTreePicker: initTreePicker,
    initPasswordInput: initPasswordInput,
    initCurrencyInput: initCurrencyInput,
    initGalleryPicker: initGalleryPicker,
    initTierList: initTierList,
    initRankList: initRankList,
    readModel: readModel,
    loadValue: loadValue,
    saveValue: saveValue,
    emitChange: emitChange
  };

  if (typeof window !== 'undefined') {
    window.amvcpFormInputs = api;
    // Auto-boot unless the page sets __vcFormInputsManualInit (tests do).
    if (document && document.readyState !== 'loading') {
      if (!window.__vcFormInputsManualInit) {
        injectStyles(document);
        init(document);
      }
    } else if (document) {
      document.addEventListener('DOMContentLoaded', function () {
        if (!window.__vcFormInputsManualInit) {
          injectStyles(document);
          init(document);
        }
      });
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
