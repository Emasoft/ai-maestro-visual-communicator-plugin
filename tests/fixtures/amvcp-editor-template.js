/*!
 * ai-maestro-visual-communicator-plugin — prompt / template tuner.
 *
 * TRDD-1627a698 gap #20: the "Prompt tuner" custom-editing interface from
 * the html-effectiveness import. THE THING it visualizes: an editable
 * prompt/template with {{variable}} slots, a per-variable input panel, and
 * a LIVE re-rendered preview of the filled template that updates as you
 * type — then EXPORTS the final {template, values, rendered} back to the
 * agent.
 *
 * Architecture compliance (project CLAUDE.md):
 *   - Interaction-Design Mode = FIXED. The "edit" facet is the editable
 *     inputs + the live preview; the EXPORT rides the existing runtime
 *     selection channel — pressing Export pushes ONE kind:"element" entry
 *     into window.veSelection (the same channel a click would). No foreign
 *     selection / drag / export paradigm is introduced. Inputs carry
 *     data-ve-overlay="1" so caret clicks never toggle atom-selection
 *     (mirrors how amvcp-interactive.js exempts card-note textareas).
 *   - NO-NEW-ELEMENTS highlight rule. Slot highlighting in the preview is a
 *     class re-paint of the slot's OWN <span> element (.ve-tpl-slot) — never
 *     an injected overlay / ring / frame. The element exists in the rendered
 *     output; the highlight only re-colors it.
 *   - Graphic Style Mode = VARIABLE via DESIGN.md. Every color / radius /
 *     font reads a `--vc-*` token via `var(--vc-*, fallback)`; both light +
 *     dark themes correct by construction. A theme flip re-paints live.
 *   - Composable primitive. Self-contained; its own data-ve-* atoms +
 *     scoped stylesheet. The single runtime scan inits it alongside others.
 *
 * Declarative markup contract:
 *   <div class="ve-editor-template" data-ve-id="…">
 *     <script type="application/json">
 *       { "template": "Write a {{tone}} summary of {{topic}} in {{count}} words.",
 *         "variables": [
 *           { "key": "tone",  "label": "Tone",  "default": "concise", "type": "text" },
 *           { "key": "topic", "label": "Topic", "default": "the report" },
 *           { "key": "count", "label": "Word count", "default": "120",
 *             "type": "select", "options": ["80","120","200"] }
 *         ] }
 *     </script>
 *   </div>
 * `template` is required (string with {{key}} slots). `variables[]` is
 * required (>=1). Each var: { key (required), label?, default?, type:
 * "text"|"textarea"|"select", options? (required for select) }. A slot
 * referencing an unknown key renders the literal {{key}} (visible, not
 * silently dropped) so the author notices the mismatch.
 *
 * Export payload (rides window.veSelection as a kind:"element" entry):
 *   { kind:"element", id:<data-ve-id>, type:"editor-template",
 *     label:"Template: …",
 *     data:{ template:<string>, values:{key:value,…}, rendered:<string> } }
 *
 * Dual export:
 *   - browser: window.amvcpEditorTemplate = { ... }
 *   - Node:    module.exports = { ... }
 *
 * Style matches scripts/amvcp-form-inputs.js / amvcp-interactive.js — `var`,
 * function declarations, ES5-safe (no arrow fns, no template literals, no
 * classes).
 *
 * Public API:
 *   injectStyles(doc)            — append the skill <style> once
 *   init(root)                   — wire every .ve-editor-template on the page
 *   initEditor(el)               — wire one .ve-editor-template
 *   readModel(el)                — parse embedded JSON (or null on error)
 *   renderTemplate(tpl, values)  — fill {{slots}} → string (pure)
 *   slotKeys(tpl)                — ordered list of {{keys}} in a template
 *   exportSelection(el)          — push the export entry into veSelection
 */
(function () {
  'use strict';

  var STYLE_ID = 'vc-editor-template-styles';
  // {{ key }} — key is a JS-ident-ish token; whitespace inside braces is
  // tolerated and trimmed. Global + capturing so both split and key-list
  // passes can reuse it (each pass makes its own RegExp to keep lastIndex
  // private — a shared global regex with lastIndex is a classic bug).
  function slotRe() { return /\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}/g; }

  // ── Fail-fast helper (mirrors amvcp-form-inputs.paintError) ──────────
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
    box.textContent = '[editor-template error] ' + message;
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

  // ── Pure helpers ─────────────────────────────────────────────────────
  function slotKeys(tpl) {
    var keys = [];
    var seen = {};
    var re = slotRe();
    var m;
    while ((m = re.exec(String(tpl || ''))) !== null) {
      if (!seen[m[1]]) { seen[m[1]] = 1; keys.push(m[1]); }
    }
    return keys;
  }

  function renderTemplate(tpl, values) {
    // Replace every {{key}} with values[key]. Unknown keys keep the literal
    // {{key}} so the author can SEE the mismatch (fail-visible, not silent).
    values = values || {};
    return String(tpl == null ? '' : tpl).replace(slotRe(), function (whole, key) {
      return Object.prototype.hasOwnProperty.call(values, key)
        ? String(values[key])
        : whole;
    });
  }

  // ── Styles (scoped, --vc-* themed, light + dark by construction) ─────
  function injectStyles(doc) {
    doc = doc || document;
    if (doc.getElementById(STYLE_ID)) { return; }
    var css = [
      '.ve-editor-template{',
      '  display:grid;gap:var(--vc-space-4, 16px);',
      '  grid-template-columns:minmax(220px,1fr) minmax(260px,1.4fr);',
      '  align-items:start;',
      '  padding:var(--vc-space-4, 16px);',
      '  border:1px solid var(--vc-color-border, #e3dcc9);',
      '  border-radius:var(--vc-radius-lg, 12px);',
      '  background:var(--vc-color-surface, #fffefb);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  font:14px/1.5 var(--vc-font-body, system-ui, sans-serif);',
      '}',
      '@media (max-width:640px){.ve-editor-template{grid-template-columns:1fr;}}',
      '.ve-tpl-fields{display:flex;flex-direction:column;gap:var(--vc-space-3, 12px);min-width:0;}',
      '.ve-tpl-field{display:flex;flex-direction:column;gap:4px;min-width:0;}',
      '.ve-tpl-field-label{',
      '  font:600 12px/1.3 var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-content-muted, #5b5343);',
      '  letter-spacing:0.02em;',
      '}',
      '.ve-tpl-field-label code{',
      '  font:inherit;font-family:var(--vc-font-mono, ui-monospace, monospace);',
      '  color:var(--vc-color-content-subtle, #8a8170);',
      '}',
      '.ve-tpl-input,.ve-tpl-select,.ve-tpl-textarea{',
      '  font:14px/1.4 var(--vc-font-mono, ui-monospace, monospace);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  background:var(--vc-color-surface-sunken, #f1ece1);',
      '  border:1px solid var(--vc-color-border-strong, #c9bfa3);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '  padding:7px 10px;width:100%;box-sizing:border-box;',
      '}',
      '.ve-tpl-textarea{resize:vertical;min-height:64px;}',
      '.ve-tpl-input:focus,.ve-tpl-select:focus,.ve-tpl-textarea:focus{',
      '  outline:2px solid var(--vc-color-accent, #b8861f);outline-offset:1px;',
      '  border-color:var(--vc-color-accent, #b8861f);',
      '}',
      '.ve-tpl-preview-wrap{display:flex;flex-direction:column;gap:6px;min-width:0;}',
      '.ve-tpl-preview-label{',
      '  font:600 12px/1.3 var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-content-muted, #5b5343);letter-spacing:0.02em;',
      '}',
      // Preview is a <pre>: opt out of the runtime line-number gutter
      // (data-ve-no-gutter is set in code too) and let the page expand
      // rather than scroll (no-nested-scrollbars rule) — wide content wraps.
      '.ve-tpl-preview{',
      '  margin:0;white-space:pre-wrap;overflow-wrap:anywhere;overflow:visible;',
      '  font:13px/1.6 var(--vc-font-mono, ui-monospace, monospace);',
      '  color:var(--vc-color-content, #1f1a14);',
      '  background:var(--vc-color-surface-sunken, #f1ece1);',
      '  border:1px solid var(--vc-color-border, #e3dcc9);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '  padding:12px 14px;',
      '}',
      // Slot re-paint — the EXISTING slot <span>, never an injected frame.
      '.ve-tpl-slot{',
      '  border-radius:4px;padding:0 2px;',
      '  background:color-mix(in srgb, var(--vc-color-accent, #b8861f) 18%, transparent);',
      '  color:var(--vc-color-content, #1f1a14);',
      '}',
      // An unfilled / unknown slot reads as a caution, still no new element.
      '.ve-tpl-slot[data-ve-tpl-missing="1"]{',
      '  background:color-mix(in srgb, var(--vc-color-danger, #a84a32) 16%, transparent);',
      '}',
      '.ve-tpl-export{',
      '  align-self:flex-start;margin-top:2px;',
      '  font:600 13px/1 var(--vc-font-body, system-ui, sans-serif);',
      '  color:var(--vc-color-on-accent, #fffdf9);',
      '  background:var(--vc-color-accent, #b8861f);',
      '  border:1px solid var(--vc-color-accent, #b8861f);',
      '  border-radius:var(--vc-radius-md, 8px);',
      '  padding:9px 16px;cursor:pointer;',
      '}',
      '.ve-tpl-export:hover{filter:brightness(1.06);}',
      '.ve-tpl-export:focus{outline:2px solid var(--vc-color-accent, #b8861f);outline-offset:2px;}',
      '.ve-tpl-export[data-ve-tpl-exported="1"]{',
      '  background:var(--vc-color-success, #3a6b5c);border-color:var(--vc-color-success, #3a6b5c);',
      '}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    (doc.head || doc.documentElement).appendChild(style);
  }

  // ── Live preview rendering (slots painted via own <span>) ────────────
  function paintPreview(preEl, tpl, values) {
    // Build the filled text as DOM: literal runs as text nodes, slots as
    // <span class="ve-tpl-slot"> carrying the filled value (or the literal
    // {{key}} when unknown). This is the ONLY DOM the editor adds, and it
    // lives inside the preview's own content — no overlay anywhere.
    preEl.textContent = '';
    var src = String(tpl == null ? '' : tpl);
    var re = slotRe();
    var last = 0;
    var m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) {
        preEl.appendChild(document.createTextNode(src.slice(last, m.index)));
      }
      var key = m[1];
      var known = Object.prototype.hasOwnProperty.call(values, key);
      var span = document.createElement('span');
      span.className = 've-tpl-slot';
      span.setAttribute('data-ve-tpl-key', key);
      if (known) {
        span.textContent = String(values[key]);
      } else {
        span.textContent = m[0];            // literal {{key}} — fail-visible
        span.setAttribute('data-ve-tpl-missing', '1');
      }
      preEl.appendChild(span);
      last = re.lastIndex;
    }
    if (last < src.length) {
      preEl.appendChild(document.createTextNode(src.slice(last)));
    }
  }

  // ── Export: ride the existing runtime selection channel ──────────────
  function buildExportEntry(el, tpl, values) {
    var id = el.getAttribute('data-ve-id');
    var rendered = renderTemplate(tpl, values);
    var labelText = rendered.replace(/\s+/g, ' ').trim();
    if (labelText.length > 60) { labelText = labelText.slice(0, 57) + '…'; }
    return {
      kind: 'element',
      entryId: 'element:' + id,
      id: id,
      type: 'editor-template',
      label: 'Template: ' + labelText,
      data: { template: String(tpl == null ? '' : tpl), values: values, rendered: rendered }
    };
  }

  function exportSelection(el) {
    // Push (or replace) ONE element entry into window.veSelection, the same
    // array a normal click toggles. We splice any stale entry for this id
    // first, then defer to window.veToggle so the runtime's repaint +
    // submit-button counter side-effects run through the canonical path.
    var state = el.__veTpl;
    if (!state) { return null; }
    var entry = buildExportEntry(el, state.template, currentValues(el));
    var sel = (typeof window !== 'undefined') ? window.veSelection : null;
    if (sel && typeof window.veToggle === 'function') {
      for (var i = sel.length - 1; i >= 0; i--) {
        if (sel[i] && sel[i].entryId === entry.entryId) { sel.splice(i, 1); }
      }
      // veToggle adds the entry (it was just removed) AND runs the runtime
      // repaint + submit-button update — so the count reflects the export.
      window.veToggle({ id: entry.id, type: entry.type, label: entry.label, data: entry.data });
    } else if (sel) {
      // Runtime present but veToggle missing (older build): manage the
      // array directly so export still works.
      for (var j = sel.length - 1; j >= 0; j--) {
        if (sel[j] && sel[j].entryId === entry.entryId) { sel.splice(j, 1); }
      }
      sel.push(entry);
    }
    return entry;
  }

  function currentValues(el) {
    var state = el.__veTpl;
    var values = {};
    if (!state) { return values; }
    for (var k = 0; k < state.varDefs.length; k++) {
      var key = state.varDefs[k].key;
      values[key] = state.inputs[key] ? state.inputs[key].value : '';
    }
    return values;
  }

  // ── Wire one editor ──────────────────────────────────────────────────
  function initEditor(el) {
    if (!el || el.__veTpl) { return; }
    var id = el.getAttribute('data-ve-id');
    if (!id) { paintError(el, 'missing data-ve-id attribute'); return; }
    var model = readModel(el);
    if (!model) {
      // readModel paints its own error for malformed JSON; a missing block
      // is a distinct, explicit failure.
      if (!el.querySelector(':scope > script[type="application/json"]')) {
        paintError(el, 'missing <script type="application/json"> model');
      }
      return;
    }
    if (typeof model.template !== 'string' || !model.template) {
      paintError(el, 'model.template must be a non-empty string');
      return;
    }
    if (!Array.isArray(model.variables) || model.variables.length < 1) {
      paintError(el, 'model.variables must be a non-empty array');
      return;
    }
    for (var v = 0; v < model.variables.length; v++) {
      var def = model.variables[v];
      if (!def || typeof def.key !== 'string' || !def.key) {
        paintError(el, 'each variable needs a non-empty string "key"');
        return;
      }
      if (def.type === 'select'
        && (!Array.isArray(def.options) || def.options.length < 1)) {
        paintError(el, 'select variable "' + def.key + '" needs options[]');
        return;
      }
    }

    injectStyles(el.ownerDocument || document);
    el.__veTpl = { template: model.template, varDefs: model.variables, inputs: {} };
    el.setAttribute('data-ve-type', el.getAttribute('data-ve-type') || 'editor-template');
    el.textContent = '';

    // ── Left column: the variable input panel ──
    var fields = document.createElement('div');
    fields.className = 've-tpl-fields';

    var preview = document.createElement('pre');     // declared early; closure below
    preview.className = 've-tpl-preview';
    preview.setAttribute('data-ve-no-gutter', '');   // keep the runtime gutter off
    preview.setAttribute('data-ve-overlay', '1');    // caret clicks never toggle atom-selection

    var debounceTimer = null;
    function scheduleRender() {
      if (debounceTimer) { clearTimeout(debounceTimer); }
      debounceTimer = setTimeout(doRender, 120);     // debounced live re-render
    }
    function doRender() {
      debounceTimer = null;
      paintPreview(preview, el.__veTpl.template, currentValues(el));
      // Mutating values invalidates a prior export — drop the "exported" tag.
      exportBtn.removeAttribute('data-ve-tpl-exported');
    }

    for (var i = 0; i < model.variables.length; i++) {
      (function (def) {
        var field = document.createElement('div');
        field.className = 've-tpl-field';
        var lab = document.createElement('label');
        lab.className = 've-tpl-field-label';
        var code = document.createElement('code');
        code.textContent = '{{' + def.key + '}}';
        lab.appendChild(document.createTextNode((def.label || def.key) + ' '));
        lab.appendChild(code);
        var inputId = 've-tpl-' + id + '-' + def.key;
        lab.setAttribute('for', inputId);
        field.appendChild(lab);

        var input;
        if (def.type === 'select') {
          input = document.createElement('select');
          input.className = 've-tpl-select';
          for (var o = 0; o < def.options.length; o++) {
            var opt = document.createElement('option');
            opt.value = String(def.options[o]);
            opt.textContent = String(def.options[o]);
            input.appendChild(opt);
          }
          input.value = (def['default'] != null) ? String(def['default'])
            : String(def.options[0]);
          input.addEventListener('change', scheduleRender);
        } else if (def.type === 'textarea') {
          input = document.createElement('textarea');
          input.className = 've-tpl-textarea';
          input.rows = 3;
          input.value = (def['default'] != null) ? String(def['default']) : '';
          input.addEventListener('input', scheduleRender);
        } else {
          input = document.createElement('input');
          input.className = 've-tpl-input';
          input.type = 'text';
          input.value = (def['default'] != null) ? String(def['default']) : '';
          input.addEventListener('input', scheduleRender);
        }
        // Caret clicks in any input must NEVER toggle atom-selection.
        input.setAttribute('data-ve-overlay', '1');
        input.id = inputId;
        el.__veTpl.inputs[def.key] = input;
        field.appendChild(input);
        fields.appendChild(field);
      })(model.variables[i]);
    }

    // ── Right column: live preview + export ──
    var previewWrap = document.createElement('div');
    previewWrap.className = 've-tpl-preview-wrap';
    var previewLabel = document.createElement('div');
    previewLabel.className = 've-tpl-preview-label';
    previewLabel.textContent = 'Live preview';
    previewWrap.appendChild(previewLabel);
    previewWrap.appendChild(preview);

    var exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 've-tpl-export';
    exportBtn.textContent = 'Export to agent';
    exportBtn.setAttribute('data-ve-overlay', '1');   // a control, never an atom
    exportBtn.addEventListener('click', function () {
      exportSelection(el);
      exportBtn.setAttribute('data-ve-tpl-exported', '1');
    });
    previewWrap.appendChild(exportBtn);

    el.appendChild(fields);
    el.appendChild(previewWrap);

    // Initial preview with defaults — visible before any edit.
    paintPreview(preview, el.__veTpl.template, currentValues(el));
  }

  // ── Page-wide init ────────────────────────────────────────────────────
  function init(root) {
    root = root || document;
    injectStyles(root.ownerDocument || document);
    var nodes = root.querySelectorAll('.ve-editor-template');
    for (var i = 0; i < nodes.length; i++) { initEditor(nodes[i]); }
  }

  var api = {
    injectStyles: injectStyles,
    init: init,
    initEditor: initEditor,
    readModel: readModel,
    renderTemplate: renderTemplate,
    slotKeys: slotKeys,
    exportSelection: exportSelection
  };

  if (typeof window !== 'undefined') {
    window.amvcpEditorTemplate = api;
    // Self-init once the DOM is ready so a page that merely drops the markup
    // + this script (alongside the runtime) lights up with no glue code —
    // same pattern as the other element modules.
    function boot() { try { init(document); } catch (e) { /* fail-soft boot */ } }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
