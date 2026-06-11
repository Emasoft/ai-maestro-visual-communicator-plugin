/*!
 * ai-maestro-visual-communicator-plugin — feature-flag toggle editor.
 *
 * TRDD-1627a698 gap #19 (html-effectiveness import, artifact 19): a
 * dependency-free editor for a set of feature flags. The agent renders
 * grouped toggle switches; the user flips them; a "copy diff" affordance
 * emits a unified-diff-style text of changed-vs-default flags AND pushes
 * that diff into the runtime's multi-select channel (window.veSelection)
 * as a kind:"element" entry — so the export rides the EXISTING selection
 * payload, never a foreign export UX (project CLAUDE.md §4, the FIXED
 * Interaction-Design Mode).
 *
 * THE THING: "a grouped feature-flag editor with dependency warnings and
 * a copy-diff export." One skill, one thing. The editing facet is these
 * toggles; the export facet is the selection-payload round-trip.
 *
 * Declarative markup contract:
 *
 *   <div class="ve-editor-toggles" data-ve-id="toggles:rollout">
 *     <script type="application/json">
 *     {
 *       "title": "Rollout flags",
 *       "exportId": "flag-diff:rollout",        // optional; defaults to data-ve-id
 *       "groups": [
 *         { "label": "Delivery", "flags": [
 *           { "key": "canary",   "label": "Canary rollout", "default": false },
 *           { "key": "telemetry","label": "Telemetry",      "default": true  },
 *           { "key": "autoRoll", "label": "Auto-rollback",  "default": false,
 *             "requires": ["telemetry"] }
 *         ]},
 *         { "label": "Experimental", "flags": [
 *           { "key": "newUi",    "label": "New UI shell",   "default": false }
 *         ]}
 *       ]
 *     }
 *     </script>
 *   </div>
 *
 * A flag's `requires: ["a","b"]` lists OTHER flag keys that must all be ON
 * for this flag to be coherent. Flipping a flag ON while any required flag
 * is OFF reveals an inline dependency-warning row (per the NO-NEW-ELEMENTS
 * highlight rule: the warning row is PRE-RENDERED at build time, hidden by
 * a class; flipping only toggles the class — never injects geometry). The
 * warning clears the moment its requirements are satisfied.
 *
 * Design contract (mirrors scripts/amvcp-form-inputs.js):
 *   - Dependency-free. Pure HTML + CSS + vanilla ES5-style JS (var,
 *     function declarations, no arrow functions, no template literals,
 *     no classes).
 *   - Theme-driven. Every color / radius / font reads a `--vc-*` token via
 *     var(--vc-*, fallback). Light + dark correct by construction; a live
 *     data-ve-theme flip re-paints with zero JS.
 *   - Fail-fast. A malformed JSON block, a missing data-ve-id, or a spec
 *     with no flags paints a red `[editor-toggles error] …` box in place.
 *     localStorage failures (Safari private mode) are the documented
 *     exception — they degrade silently because persistence is not
 *     load-bearing.
 *   - Export rides the runtime. The copy-diff affordance calls
 *     window.veToggle({id,type,label,data}) when the runtime is present
 *     (it dedupes + paints + updates the submit counter); it removes any
 *     stale prior diff entry first so the call always lands a FRESH diff.
 *     Without the runtime it pushes straight onto window.veSelection so
 *     the contract still holds for file:// pages and tests.
 *
 * Dual export:
 *   - browser: window.amvcpEditorToggles = { ... }
 *   - Node:    module.exports = { ... }
 *
 * Public API:
 *   injectStyles(doc)        — append the skill <style> (idempotent)
 *   init(root)               — wire every .ve-editor-toggles under root
 *   initEditor(el)           — wire one .ve-editor-toggles
 *   readModel(el)            — parse embedded JSON (or null on error)
 *   computeDiff(state, spec) — { changed:[{key,from,to}], text } unified diff
 *   loadValue(id, def)       — localStorage read
 *   saveValue(id, value)     — localStorage write
 *   pushDiffToSelection(...) — land the diff in window.veSelection
 */
(function () {
  'use strict';

  var LS_PREFIX = 'amvcp-editor-toggles:';
  var STYLE_ID = 'vc-editor-toggles-styles';

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
    box.textContent = '[editor-toggles error] ' + message;
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

  // ── Stylesheet (injected once; graphic-style chrome only) ──────────
  function injectStyles(doc) {
    doc = doc || document;
    if (doc.getElementById(STYLE_ID)) { return; }
    var css = ''
      + '.ve-editor-toggles{'
      + 'border:1px solid var(--vc-color-border, #e3dcc9);'
      + 'background:var(--vc-color-surface, #fffefb);'
      + 'border-radius:var(--vc-radius-lg, 12px);'
      + 'padding:18px 18px 8px;'
      + 'font:14px/1.5 var(--vc-font-body, system-ui, sans-serif);'
      + 'color:var(--vc-color-content, #1f1a14);}'
      + '.ve-et-title{font-size:15px;font-weight:600;margin:0 0 4px;'
      + 'color:var(--vc-color-content, #1f1a14);}'
      + '.ve-et-group{margin:14px 0 0;}'
      + '.ve-et-group-label{font-size:12px;font-weight:600;'
      + 'text-transform:uppercase;letter-spacing:0.05em;'
      + 'color:var(--vc-color-content-subtle, #8a8170);'
      + 'margin:0 0 6px;padding-bottom:4px;'
      + 'border-bottom:1px solid var(--vc-color-border, #e3dcc9);}'
      + '.ve-et-row{display:flex;align-items:center;gap:12px;'
      + 'padding:7px 2px;}'
      + '.ve-et-flag-label{flex:1;color:var(--vc-color-content, #1f1a14);}'
      // The switch — role="switch" button, no native checkbox so theming
      // is total. Track + knob driven entirely by --vc-* tokens.
      + '.ve-et-switch{position:relative;flex:0 0 auto;width:44px;'
      + 'height:24px;border-radius:var(--vc-radius-full, 9999px);'
      + 'border:1px solid var(--vc-color-border-strong, #c9bfa3);'
      + 'background:var(--vc-color-surface-sunken, #f1ece0);'
      + 'cursor:pointer;padding:0;transition:background 140ms ease,'
      + 'border-color 140ms ease;}'
      + '.ve-et-switch:focus-visible{outline:2px solid '
      + 'var(--vc-color-accent, #b8861f);outline-offset:2px;}'
      + '.ve-et-switch[aria-checked="true"]{'
      + 'background:var(--vc-color-accent, #b8861f);'
      + 'border-color:var(--vc-color-accent, #b8861f);}'
      + '.ve-et-knob{position:absolute;top:2px;left:2px;width:18px;'
      + 'height:18px;border-radius:var(--vc-radius-full, 9999px);'
      + 'background:var(--vc-color-surface, #fffefb);'
      + 'box-shadow:0 1px 2px rgba(0,0,0,0.18);'
      + 'transition:transform 140ms ease;}'
      + '.ve-et-switch[aria-checked="true"] .ve-et-knob{'
      + 'transform:translateX(20px);'
      + 'background:var(--vc-color-on-accent, #fffdf9);}'
      // The dependency-warning row: PRE-RENDERED, hidden by default, shown
      // only via the .ve-et-warn--show class (no injected geometry).
      + '.ve-et-warn{display:none;align-items:flex-start;gap:8px;'
      + 'margin:0 0 7px 0;padding:7px 10px;'
      + 'font-size:12.5px;line-height:1.4;'
      + 'color:var(--vc-color-danger, #a84a32);'
      + 'background:color-mix(in srgb,'
      + ' var(--vc-color-warning, #a8791f) 12%, transparent);'
      + 'border-left:3px solid var(--vc-color-warning, #a8791f);'
      + 'border-radius:var(--vc-radius-sm, 4px);}'
      + '.ve-et-warn.ve-et-warn--show{display:flex;}'
      + '.ve-et-warn-icon{flex:0 0 auto;font-weight:700;}'
      // Footer: the copy-diff affordance + a live status note.
      + '.ve-et-foot{display:flex;align-items:center;gap:12px;'
      + 'margin:14px 0 6px;padding-top:10px;'
      + 'border-top:1px solid var(--vc-color-border, #e3dcc9);}'
      + '.ve-et-copy{appearance:none;cursor:pointer;'
      + 'font:600 13px/1 var(--vc-font-body, system-ui, sans-serif);'
      + 'color:var(--vc-color-on-accent, #fffdf9);'
      + 'background:var(--vc-color-accent, #b8861f);'
      + 'border:1px solid var(--vc-color-accent, #b8861f);'
      + 'border-radius:var(--vc-radius-md, 8px);padding:8px 14px;'
      + 'transition:filter 120ms ease;}'
      + '.ve-et-copy:hover{filter:brightness(1.06);}'
      + '.ve-et-copy:focus-visible{outline:2px solid '
      + 'var(--vc-color-accent, #b8861f);outline-offset:2px;}'
      + '.ve-et-status{font-size:12.5px;'
      + 'color:var(--vc-color-content-muted, #5b5343);}';
    var styleEl = doc.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    (doc.head || doc.documentElement).appendChild(styleEl);
  }

  // ── Diff computation (one source of truth for the export text) ─────
  // Returns { changed: [{key,label,from,to}], text }. `text` is a
  // unified-diff-style block keyed by flag — `-key = <default>` /
  // `+key = <current>` for every flag whose value differs from default.
  function computeDiff(state, flat) {
    var changed = [];
    var lines = ['--- flags (default)', '+++ flags (current)'];
    for (var i = 0; i < flat.length; i++) {
      var f = flat[i];
      var def = !!f['default'];
      var cur = !!state[f.key];
      if (cur !== def) {
        changed.push({ key: f.key, label: f.label || f.key, from: def, to: cur });
        lines.push('-' + f.key + ' = ' + def);
        lines.push('+' + f.key + ' = ' + cur);
      }
    }
    if (!changed.length) {
      lines.push(' (no changes — all flags at default)');
    }
    return { changed: changed, text: lines.join('\n') };
  }

  // ── Export: land the diff in the runtime selection channel ─────────
  // Idempotent: a prior diff entry for the same exportId is removed first
  // so re-copying always lands a FRESH diff rather than toggling it off.
  function pushDiffToSelection(exportId, diff, title) {
    var entryId = 'element:' + exportId;
    var list = (typeof window !== 'undefined' && window.veSelection)
      ? window.veSelection : null;
    // Remove any stale diff entry for this editor (match the runtime's
    // entryId convention so veToggle's own dedupe stays consistent).
    if (list) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] && list[i].entryId === entryId) { list.splice(i, 1); }
      }
    }
    var payload = {
      id: exportId,
      type: 'flag-diff',
      label: (title || 'Feature flags') + ' — ' + diff.changed.length
        + ' changed',
      data: { changed: diff.changed, diff: diff.text }
    };
    // Prefer the runtime's own toggle path (it dedupes by the same
    // entryId, paints, and refreshes the submit-button counter). Because
    // we removed the stale entry above, this call always ADDS.
    if (typeof window !== 'undefined'
        && typeof window.veToggle === 'function') {
      window.veToggle(payload);
      return;
    }
    // No runtime — push straight onto window.veSelection so the export
    // contract still holds (file:// pages, unit tests). Create the array
    // if the runtime never booted.
    if (typeof window !== 'undefined') {
      if (!window.veSelection) { window.veSelection = []; }
      window.veSelection.push({
        kind: 'element',
        entryId: entryId,
        id: payload.id,
        type: payload.type,
        label: payload.label,
        data: payload.data
      });
    }
  }

  // ── Flatten the spec's groups into a single ordered flag list ──────
  function flattenFlags(spec) {
    var flat = [];
    var groups = spec.groups || [];
    for (var g = 0; g < groups.length; g++) {
      var flags = (groups[g] && groups[g].flags) || [];
      for (var f = 0; f < flags.length; f++) { flat.push(flags[f]); }
    }
    return flat;
  }

  // ── Wire one editor ────────────────────────────────────────────────
  function initEditor(el) {
    if (!el || el.__veInited) { return; }
    var id = requireId(el);
    if (!id) { return; }
    var spec = readModel(el);
    if (!spec || !Array.isArray(spec.groups) || !spec.groups.length) {
      paintError(el, 'editor-toggles requires { groups:[{flags:[…]}] }');
      return;
    }
    var flat = flattenFlags(spec);
    if (!flat.length) {
      paintError(el, 'editor-toggles requires at least one flag');
      return;
    }
    // Validate flag shape up-front (fail-fast — a keyless flag would make
    // the diff and the dependency graph incoherent).
    var byKey = {};
    for (var v = 0; v < flat.length; v++) {
      if (!flat[v] || typeof flat[v].key !== 'string' || !flat[v].key) {
        paintError(el, 'every flag needs a string "key"');
        return;
      }
      byKey[flat[v].key] = flat[v];
    }
    el.__veInited = true;
    el.setAttribute('data-ve-type', 'editor-toggles');

    injectStyles(el.ownerDocument || document);

    var exportId = spec.exportId || id;
    var title = spec.title || el.getAttribute('data-ve-label') || 'Feature flags';

    // Persisted state overrides defaults; unknown keys are dropped so a
    // spec change can't resurrect a stale flag.
    var persisted = loadValue(id, null);
    var state = {};
    for (var k = 0; k < flat.length; k++) {
      var fk = flat[k].key;
      if (persisted && Object.prototype.hasOwnProperty.call(persisted, fk)) {
        state[fk] = !!persisted[fk];
      } else {
        state[fk] = !!flat[k]['default'];
      }
    }

    // Build the DOM. Switch + warning row are both rendered NOW; the
    // warning is hidden by class and only toggled later (no injected
    // geometry at flip-time).
    el.textContent = '';
    var doc = el.ownerDocument || document;

    if (title) {
      var titleEl = doc.createElement('p');
      titleEl.className = 've-et-title';
      titleEl.textContent = title;
      el.appendChild(titleEl);
    }

    // Map of key → { switchEl, warnEl } so flip handlers can repaint.
    var nodes = {};

    var groups = spec.groups;
    for (var gi = 0; gi < groups.length; gi++) {
      var grp = groups[gi];
      var groupEl = doc.createElement('div');
      groupEl.className = 've-et-group';
      if (grp && grp.label) {
        var glab = doc.createElement('p');
        glab.className = 've-et-group-label';
        glab.textContent = grp.label;
        groupEl.appendChild(glab);
      }
      var gflags = (grp && grp.flags) || [];
      for (var gf = 0; gf < gflags.length; gf++) {
        (function (flag) {
          var key = flag.key;
          var row = doc.createElement('div');
          row.className = 've-et-row';
          row.setAttribute('data-ve-et-row', key);

          var labelEl = doc.createElement('span');
          labelEl.className = 've-et-flag-label';
          labelEl.id = 've-et-lbl-' + exportId + '-' + key;
          labelEl.textContent = flag.label || key;

          var sw = doc.createElement('button');
          sw.type = 'button';
          sw.className = 've-et-switch';
          sw.setAttribute('role', 'switch');
          sw.setAttribute('data-ve-et-flag', key);
          sw.setAttribute('aria-checked', state[key] ? 'true' : 'false');
          sw.setAttribute('aria-labelledby', labelEl.id);
          var knob = doc.createElement('span');
          knob.className = 've-et-knob';
          sw.appendChild(knob);

          row.appendChild(labelEl);
          row.appendChild(sw);
          groupEl.appendChild(row);

          // Pre-rendered dependency-warning row (hidden until needed).
          var warn = doc.createElement('div');
          warn.className = 've-et-warn';
          warn.setAttribute('role', 'status');
          warn.setAttribute('data-ve-et-warn', key);
          var icon = doc.createElement('span');
          icon.className = 've-et-warn-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = '⚠';
          var msg = doc.createElement('span');
          msg.className = 've-et-warn-msg';
          warn.appendChild(icon);
          warn.appendChild(msg);
          groupEl.appendChild(warn);

          nodes[key] = { sw: sw, warn: warn, msg: msg, flag: flag };

          sw.addEventListener('click', function () {
            state[key] = !state[key];
            sw.setAttribute('aria-checked', state[key] ? 'true' : 'false');
            saveValue(id, state);
            refreshWarnings();
            refreshStatus();
          });
          sw.addEventListener('keydown', function (ev) {
            // Space/Enter on a role=switch is the ARIA-expected activation.
            if (ev.key === ' ' || ev.key === 'Enter'
                || ev.key === 'Spacebar') {
              ev.preventDefault();
              sw.click();
            }
          });
        }(gflags[gf]));
      }
      el.appendChild(groupEl);
    }

    // Footer — copy-diff affordance + live status note.
    var foot = doc.createElement('div');
    foot.className = 've-et-foot';
    var copyBtn = doc.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 've-et-copy';
    copyBtn.setAttribute('data-ve-et-copy', '1');
    copyBtn.textContent = 'Copy diff';
    var statusEl = doc.createElement('span');
    statusEl.className = 've-et-status';
    statusEl.setAttribute('data-ve-et-status', '1');
    statusEl.setAttribute('aria-live', 'polite');
    foot.appendChild(copyBtn);
    foot.appendChild(statusEl);
    el.appendChild(foot);

    // ── Dependency-warning logic ─────────────────────────────────────
    // A flag with requires:[…] that is ON while any requirement is OFF
    // shows its pre-rendered warning row. The warning text names the
    // unmet requirement(s). The warning clears once they're satisfied.
    function unmetRequirements(flag) {
      var req = flag.requires;
      if (!Array.isArray(req) || !req.length) { return []; }
      var missing = [];
      for (var r = 0; r < req.length; r++) {
        var depKey = req[r];
        // Only count requirements that exist AND are off; an unknown
        // requirement key is ignored (spec authoring slip, not a crash).
        if (Object.prototype.hasOwnProperty.call(state, depKey)
            && !state[depKey]) {
          missing.push(byKey[depKey] && byKey[depKey].label
            ? byKey[depKey].label : depKey);
        }
      }
      return missing;
    }

    function refreshWarnings() {
      for (var key in nodes) {
        if (!Object.prototype.hasOwnProperty.call(nodes, key)) { continue; }
        var n = nodes[key];
        var show = false;
        if (state[key]) {
          var missing = unmetRequirements(n.flag);
          if (missing.length) {
            show = true;
            n.msg.textContent = 'Requires ' + missing.join(', ')
              + ' to be on.';
          }
        }
        if (show) { n.warn.classList.add('ve-et-warn--show'); }
        else { n.warn.classList.remove('ve-et-warn--show'); }
      }
    }

    function refreshStatus() {
      var diff = computeDiff(state, flat);
      var n = diff.changed.length;
      statusEl.textContent = n === 0
        ? 'No changes from default.'
        : (n + (n === 1 ? ' flag' : ' flags') + ' changed from default.');
    }

    copyBtn.addEventListener('click', function () {
      var diff = computeDiff(state, flat);
      // Best-effort clipboard write (fail-soft: HTTP context lacks the
      // async clipboard; the diff still reaches the agent via the
      // selection channel, which is the load-bearing path).
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard
            && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(diff.text);
        }
      } catch (e) { /* fail-soft — selection channel is the real export */ }
      pushDiffToSelection(exportId, diff, title);
      statusEl.textContent = diff.changed.length
        ? ('Copied diff (' + diff.changed.length + ' changed) → selection.')
        : 'No changes to copy.';
    });

    // Initial paint of warnings + status (a spec can start with a flag
    // already ON whose requirement defaults OFF).
    refreshWarnings();
    refreshStatus();
  }

  // ── Wire every editor under root ───────────────────────────────────
  function init(root) {
    root = root || document;
    var els = root.querySelectorAll('.ve-editor-toggles');
    for (var i = 0; i < els.length; i++) { initEditor(els[i]); }
  }

  // ── Dual export ────────────────────────────────────────────────────
  var api = {
    injectStyles: injectStyles,
    init: init,
    initEditor: initEditor,
    readModel: readModel,
    computeDiff: computeDiff,
    loadValue: loadValue,
    saveValue: saveValue,
    pushDiffToSelection: pushDiffToSelection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.amvcpEditorToggles = api;
    // Auto-init on DOM ready unless a page opts into manual init (mirrors
    // the form-inputs convention: set window.__vcEditorTogglesManualInit
    // = true before loading this script to wire it yourself).
    if (!window.__vcEditorTogglesManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          init(document);
        });
      } else {
        init(document);
      }
    }
  }
})();
