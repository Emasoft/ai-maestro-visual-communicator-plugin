/*!
 * ai-maestro-visual-communicator-plugin — form-input widgets.
 *
 * Phase 5 batch 1 (TRDD-9616579c §missing-elements): a dependency-free
 * module that ships SIX structured-response input widgets for
 * conversational agent reports. The agent renders a question; the user
 * answers via radio / checkbox / number+unit / date / color / rank
 * instead of typing prose. Every value lands in a custom event
 * (`ve-form-change`) that the runtime threads into the comment-turn
 * payload, and persists to localStorage so a refresh keeps the answer.
 *
 * The six widgets:
 *   §1 ve-quiz-radio    — single-select pick from N options
 *   §2 ve-quiz-multi    — multi-select pick (checkbox group)
 *   §3 ve-numeric-input — number + unit dropdown (px / % / em / s / …)
 *   §4 ve-date-input    — native <input type="date">
 *   §5 ve-color-input   — native <input type="color"> + hex readout
 *   §6 ve-rank-list     — drag-to-reorder <li> stack with persistent order
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

  // ── §6 ve-rank-list ────────────────────────────────────────────────
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
    var rnk = d.querySelectorAll('.ve-rank-list');
    for (var n = 0; n < rnk.length; n++) { initRankList(rnk[n]); }
  }

  // ── CSS — themed via --vc-* with hardcoded fallbacks ──────────────
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — form-inputs skill (injected) */',

    '.ve-quiz-radio, .ve-quiz-multi, .ve-numeric-input,',
    '.ve-date-input, .ve-color-input, .ve-rank-list {',
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
    '.ve-color-input[data-ve-id]:hover, .ve-rank-list[data-ve-id]:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-quiz-radio[data-ve-selected="1"],',
    '.ve-quiz-multi[data-ve-selected="1"],',
    '.ve-numeric-input[data-ve-selected="1"],',
    '.ve-date-input[data-ve-selected="1"],',
    '.ve-color-input[data-ve-selected="1"],',
    '.ve-rank-list[data-ve-selected="1"] {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 2px color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 25%, transparent);',
    '}',

    /* Shared labels */
    '.ve-quiz-label, .ve-numeric-label, .ve-date-label, .ve-color-label {',
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
