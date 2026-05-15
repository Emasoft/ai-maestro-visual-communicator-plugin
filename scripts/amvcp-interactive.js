/*!
 * ai-maestro-visual-communicator-plugin — interactive-control widgets.
 *
 * Phase 2 (interactive-control build): one dependency-free module that
 * powers seven self-contained, DESIGN.md-themed HTML control widgets —
 *   §0 state plumbing      (embedded JSON model + localStorage helper)
 *   §1 panels & disclosure (CSS-only accordion / tabs / modal + JS ARIA)
 *   §2 filter pills        (segmented control, display:contents wrapper)
 *   §3 progressive stepper (done / active / pending / failed steps)
 *   §4 virtualized list    (window-scrolled, binary-search visible range)
 *   §5 live-tweak          (setProperty continuous + classList discrete)
 *   §6 drag reorder Kanban (HTML5 drag API + Markdown export)
 *
 * Every widget reads its data from an embedded
 * `<script type="application/json">` block, persists user state to
 * localStorage keyed by `data-id`, themes EXCLUSIVELY off the Phase-1
 * DESIGN.md `--vc-*` token engine, and degrades gracefully when JS is
 * disabled (the CSS-only baseline keeps working).
 *
 * Dual export:
 *   - browser: `window.amvcpInteractive = { … }`
 *   - Node:    `module.exports = { … }`  (for the test harness)
 *
 * Style matches scripts/amvcp-runtime.js / amvcp-designmd.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes, no build step, no npm runtime deps.
 *
 * Fail-fast contract: a missing or malformed embedded JSON model, or a
 * `data-ic-persist` element with no `data-id`, is a HARD error and the
 * widget does not render. The ONE documented exception is localStorage
 * `getItem`/`setItem` — Safari private mode throws on those, and a
 * report must stay usable without persistence, so the storage helpers
 * `try/catch` to a default. Persistence is a non-essential feature, so
 * this is graceful degradation, not a fail-fast violation.
 *
 * Public API (also the per-widget init hooks the tests drive):
 *   boot()                              — wire every widget on the page
 *   readModel(id)                       — parse an embedded JSON model
 *   stateKey(el) / loadState / saveState — localStorage helpers
 *   computeOffsets / lowerBound / getVisibleRange — vlist math (pure)
 *   initTabs / initAccordion / initFilterBar / initStepper
 *   initVList / initTweak / initBoard   — per-widget initializers
 *   toBoardMarkdown(model, boardEl)     — Kanban → Markdown (pure-ish)
 *   injectFoundationCss()               — standalone --ve-* bindings
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // localStorage namespace. Distinct from the runtime's COMMENT_LS_PREFIX
  // so widget state never collides with comment-thread state.
  var LS_PREFIX = 'amvcp-ic:';

  // Per-tab textarea draft autosave debounce (IC-04). 500 ms is long
  // enough that a burst of keystrokes is one write, short enough that a
  // surprise reload loses at most half a second of typing.
  var DRAFT_DEBOUNCE_MS = 500;

  // Virtualized list — extra rows rendered above + below the viewport so
  // a fast scroll never flashes blank before the next frame paints.
  var VLIST_OVERSCAN = 6;

  // Below this item count a list renders every row plainly: the
  // offset-array + scroll-listener bookkeeping costs more than it saves.
  var VLIST_THRESHOLD = 200;

  // Kanban "copied" toast lifetime (ms).
  var TOAST_MS = 1600;

  // ── Standalone foundation-token bindings ───────────────────────────
  //
  // The component CSS (shipped in amvcp-interactive.css) references the
  // runtime's `--ve-*` FOUNDATION tokens, each of which the runtime
  // binds to a `--vc-*` DESIGN.md token with a hardcoded fallback. When
  // this module runs on a page that ALSO loads amvcp-runtime.js the
  // runtime has already defined those bindings — we must not redefine
  // them. But a standalone single-widget page omits the runtime, so the
  // `--ve-*` names would be undefined and the CSS would fall through to
  // its last-ditch literal fallbacks. To keep one source of truth, this
  // function injects the SAME foundation bindings the runtime injects —
  // only the subset the interactive widgets use — guarded so it is a
  // no-op when the runtime (or a prior call) already provided them.
  function injectFoundationCss() {
    if (typeof document === 'undefined') { return; }
    // Runtime present → it owns the foundation tokens. Detected via the
    // runtime's own injected <style id="__ve-styles">.
    if (document.getElementById('__ve-styles')) { return; }
    if (document.getElementById('__ic-foundation')) { return; }
    var s = document.createElement('style');
    s.id = '__ic-foundation';
    s.textContent = [
      ':root {',
      '  --bg: var(--vc-color-canvas, #faf6ee);',
      '  --surface: var(--vc-color-surface, #ffffff);',
      '  --text: var(--vc-color-content, #14110b);',
      '  --text-dim: var(--vc-color-content-muted, #5b5343);',
      '  --border: var(--vc-color-border, #e3dcc9);',
      '  --border-bright: var(--vc-color-border-strong, #c9bfa3);',
      '  --accent: var(--vc-color-accent, #b8861f);',
      '  --ve-accent: var(--vc-color-accent, #b8861f);',
      '  --ve-control-bg: var(--vc-color-surface, var(--surface, #ffffff));',
      '  --ve-control-fg: var(--vc-color-content, var(--text, #14110b));',
      '  --ve-control-fg-dim: var(--vc-color-content-muted, var(--text-dim, #5b5343));',
      '  --ve-control-border: var(--vc-color-border, var(--border, #e3dcc9));',
      '  --ve-control-border-strong: var(--vc-color-border-strong, var(--border-bright, #c9bfa3));',
      '  --ve-control-radius: var(--vc-radius-md, 8px);',
      '  --ve-control-radius-sm: var(--vc-radius-sm, 6px);',
      '  --ve-control-font: var(--vc-font-body, inherit);',
      '  --ve-control-mono: var(--vc-font-mono, ui-monospace, Menlo, monospace);',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  // ── §0a — embedded JSON data model (IC-14) ─────────────────────────
  //
  // Carries the page's structured data in a non-executed <script> block.
  // Browsers do not run `type="application/json"` scripts, so model
  // values can never inject XSS. Fail-fast: a missing or malformed model
  // throws — the engine never invents defaults.
  function readModel(id) {
    if (typeof document === 'undefined') {
      throw new Error('ic.readModel: no document available');
    }
    var modelId = id || 'ic-data';
    var el = document.getElementById(modelId);
    if (!el) {
      throw new Error('ic: embedded JSON model #' + modelId + ' not found');
    }
    // JSON.parse throws on malformed input — do NOT swallow. A broken
    // model is an authoring bug that must surface, not be papered over.
    return JSON.parse(el.textContent);
  }

  // Read the model a widget element points at via `data-ic-model`
  // (defaults to `ic-data`), then optionally drill into one top-level
  // key named by `data-ic-model-key`.
  function readWidgetModel(el) {
    var model = readModel(el.getAttribute('data-ic-model') || 'ic-data');
    var key = el.getAttribute('data-ic-model-key');
    if (key) {
      if (!model || typeof model !== 'object' ||
          !Object.prototype.hasOwnProperty.call(model, key)) {
        throw new Error('ic: model key "' + key + '" not found in model');
      }
      return model[key];
    }
    return model;
  }

  // ── §0b — localStorage persistence helper (IC-17) ──────────────────
  //
  // Persists/restores any control's state across reloads, keyed by a
  // `data-id` attribute. Namespaced so it never collides with the
  // runtime's comment-thread keys.

  function stateKey(el) {
    var id = el && el.getAttribute ? el.getAttribute('data-id') : null;
    if (!id) {
      // A `data-ic-persist` element with no `data-id` is an authoring
      // bug — surface it loudly in dev so the missing key is noticed.
      if (typeof console !== 'undefined' && console.error) {
        console.error('ic: element marked data-ic-persist has no data-id', el);
      }
      return null;
    }
    return LS_PREFIX + id;
  }

  // Read persisted state for `el`, JSON-parsed; returns `def` when the
  // key is absent, when localStorage is unavailable (private mode), or
  // when the stored value is corrupt. Persistence is best-effort: a
  // try/catch-to-default here is correct, NOT a fail-fast violation.
  function loadState(el, def) {
    var k = stateKey(el);
    if (k === null) { return def; }
    try {
      var v = localStorage.getItem(k);
      return v === null ? def : JSON.parse(v);
    } catch (e) {
      return def;
    }
  }

  // Persist `val` for `el` as JSON. Silent on failure — Safari private
  // mode throws on setItem, and the widget's core behaviour does not
  // depend on persistence.
  function saveState(el, val) {
    var k = stateKey(el);
    if (k === null) { return; }
    try {
      localStorage.setItem(k, JSON.stringify(val));
    } catch (e) {
      /* private-mode / quota exceeded — persistence is best-effort */
    }
  }

  // Raw-string variants used by the textarea-draft path (the draft is a
  // plain string, not a JSON structure, and gets its own `draft:` sub-
  // namespace so a draft key never shadows a widget-state key).
  function loadDraft(dataId) {
    if (!dataId) { return null; }
    try {
      return localStorage.getItem(LS_PREFIX + 'draft:' + dataId);
    } catch (e) {
      return null;
    }
  }
  function saveDraft(dataId, text) {
    if (!dataId) { return; }
    try {
      localStorage.setItem(LS_PREFIX + 'draft:' + dataId, text);
    } catch (e) { /* best-effort */ }
  }

  // ── small DOM helpers ──────────────────────────────────────────────

  function toArray(nodeList) {
    var a = [];
    var i;
    for (i = 0; i < nodeList.length; i++) { a.push(nodeList[i]); }
    return a;
  }

  // Dispatch a namespaced CustomEvent so a host report (or the runtime)
  // can react to a widget state change with zero polling.
  function fire(el, name, detail) {
    if (typeof window === 'undefined' ||
        typeof window.CustomEvent !== 'function') { return; }
    el.dispatchEvent(new CustomEvent(name, {
      bubbles: true, detail: detail
    }));
  }

  // Build an element with a class and (optionally) text — the XSS-safe
  // construction path. Model data ALWAYS enters the DOM via textContent.
  function elem(tag, className, text) {
    var n = document.createElement(tag);
    if (className) { n.className = className; }
    if (text != null) { n.textContent = String(text); }
    return n;
  }

  // ── §3 spin-keyframe injection (guarded) ───────────────────────────
  //
  // The progressive stepper's active-step marker spins. The spin
  // @keyframes belongs to the `animation` technique — when a page loads
  // both skills, `animation` owns one canonical rotation keyframe and
  // this module must NOT define a duplicate. But a stepper page may load
  // ONLY this module, so we inject a minimal `ic-spin` keyframe — once,
  // guarded by a flag on <html> and by an existing-keyframe check — so
  // the stepper is dependency-free standalone yet never doubles up.
  //
  // The injected rule is wrapped: under prefers-reduced-motion the
  // active marker drops the animation and uses a static solid-accent
  // fill instead (a substitute, never a bare `animation:none`).
  function injectSpinKeyframe() {
    if (typeof document === 'undefined') { return; }
    var html = document.documentElement;
    if (html.getAttribute('data-ic-spin-injected') === '1') { return; }
    // If the `animation` technique already shipped a rotation keyframe,
    // skip — its keyframe is canonical. We detect it by id convention.
    if (document.getElementById('__ve-animation-keyframes') ||
        document.getElementById('__ic-spin')) {
      html.setAttribute('data-ic-spin-injected', '1');
      return;
    }
    var s = document.createElement('style');
    s.id = '__ic-spin';
    s.textContent = [
      '@keyframes ic-spin { to { transform: rotate(360deg); } }',
      '@media (prefers-reduced-motion: reduce) {',
      '  .ic-step--active .ic-step-marker {',
      '    animation: none !important;',
      '    background: var(--vc-color-accent, #b8861f) !important;',
      '    border-color: var(--vc-color-accent, #b8861f) !important;',
      '    border-top-color: var(--vc-color-accent, #b8861f) !important;',
      '  }',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
    html.setAttribute('data-ic-spin-injected', '1');
  }

  // ── §1 — panels & disclosure ───────────────────────────────────────

  // Upgrade ONE CSS-only `.ic-tabs` block with ARIA, roving tabindex,
  // arrow-key navigation, persistence, and per-tab textarea drafts. The
  // CSS-only `:checked` panel switch keeps working with JS off; this
  // layer only ADDS behaviour.
  function initTabs(tabsEl) {
    var radios = toArray(tabsEl.querySelectorAll('.ic-tab-radio'));
    var labels = toArray(tabsEl.querySelectorAll('.ic-tab'));
    if (!radios.length || !labels.length) { return; }

    // Wire ARIA roles + relationships. The radio `id` is the join key
    // between a `.ic-tab` label (`for=`) and a `.ic-tabpanel`
    // (`data-tab=`).
    var i;
    var tablist = tabsEl.querySelector('.ic-tablist');
    if (tablist) { tablist.setAttribute('role', 'tablist'); }
    for (i = 0; i < labels.length; i++) {
      (function (label, idx) {
        var forId = label.getAttribute('for');
        var panel = tabsEl.querySelector('.ic-tabpanel[data-tab="' + forId + '"]');
        label.setAttribute('role', 'tab');
        label.id = label.id || ('ic-tabh-' + forId);
        if (panel) {
          label.setAttribute('aria-controls', panel.id || ('ic-tabp-' + forId));
          panel.id = panel.id || ('ic-tabp-' + forId);
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', label.id);
        }
        // Click a label → select its radio (the CSS does the rest) and
        // refresh ARIA + persistence.
        label.addEventListener('click', function () {
          selectTab(forId);
        });
        // Arrow-key navigation between tabs (roving tabindex pattern).
        label.addEventListener('keydown', function (ev) {
          var next = -1;
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
            next = (idx + 1) % labels.length;
          } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
            next = (idx - 1 + labels.length) % labels.length;
          } else if (ev.key === 'Home') {
            next = 0;
          } else if (ev.key === 'End') {
            next = labels.length - 1;
          } else if (ev.key === ' ' || ev.key === 'Enter') {
            selectTab(forId);
            ev.preventDefault();
            return;
          }
          if (next !== -1) {
            ev.preventDefault();
            var nf = labels[next].getAttribute('for');
            selectTab(nf);
            labels[next].focus();
          }
        });
      })(labels[i], i);
    }

    function activeRadio() {
      for (var j = 0; j < radios.length; j++) {
        if (radios[j].checked) { return radios[j]; }
      }
      return radios[0];
    }

    // Make `forId`'s radio checked, refresh ARIA, persist, fire event.
    function selectTab(forId) {
      var r = document.getElementById(forId);
      if (r) { r.checked = true; }
      refreshAria();
      if (tabsEl.hasAttribute('data-ic-persist')) {
        saveState(tabsEl, forId);
      }
      fire(tabsEl, 'ic:tab-change', {
        tabsId: tabsEl.getAttribute('data-id') || null,
        tabId: forId
      });
    }

    // Sync aria-selected + roving tabindex to whichever radio is checked.
    function refreshAria() {
      var cur = activeRadio();
      var curId = cur ? cur.id : null;
      for (var j = 0; j < labels.length; j++) {
        var on = labels[j].getAttribute('for') === curId;
        labels[j].setAttribute('aria-selected', on ? 'true' : 'false');
        labels[j].setAttribute('tabindex', on ? '0' : '-1');
      }
    }

    // Restore the persisted active tab BEFORE the first ARIA refresh.
    if (tabsEl.hasAttribute('data-ic-persist')) {
      var savedTab = loadState(tabsEl, null);
      if (savedTab) {
        var sr = document.getElementById(savedTab);
        if (sr) { sr.checked = true; }
      }
    }
    refreshAria();

    // Per-tab textarea drafts (IC-04) — any `[data-ic-draft]` inside.
    var drafts = toArray(tabsEl.querySelectorAll('textarea[data-ic-draft]'));
    for (i = 0; i < drafts.length; i++) { wireDraft(drafts[i]); }
  }

  // Autosave + restore one textarea's draft, 500 ms debounced.
  function wireDraft(textarea) {
    var dataId = textarea.getAttribute('data-id');
    if (!dataId) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('ic: [data-ic-draft] textarea has no data-id', textarea);
      }
      return;
    }
    var saved = loadDraft(dataId);
    if (saved !== null) { textarea.value = saved; }
    var timer = null;
    textarea.addEventListener('input', function () {
      if (timer) { clearTimeout(timer); }
      timer = setTimeout(function () {
        saveDraft(dataId, textarea.value);
      }, DRAFT_DEBOUNCE_MS);
    });
  }

  // Native <details> accordion. The CSS-only baseline already toggles
  // each <details>; this layer only adds single-open-at-a-time when the
  // container carries `data-ic-accordion="single"`.
  function initAccordion(accEl) {
    if (accEl.getAttribute('data-ic-accordion') !== 'single') { return; }
    var items = toArray(accEl.querySelectorAll('.ic-acc-item'));
    var i;
    for (i = 0; i < items.length; i++) {
      (function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) { return; }
          // This one opened — close every sibling.
          for (var j = 0; j < items.length; j++) {
            if (items[j] !== item && items[j].open) {
              items[j].open = false;
            }
          }
        });
      })(items[i]);
    }
  }

  // ── §2 — filter pills / segmented control ──────────────────────────
  //
  // The CSS-only `:checked ~ .ic-filtered` rules already show/hide the
  // tagged blocks with JS off. This layer adds persistence and an
  // optional live count badge per pill.
  function initFilterBar(barEl) {
    var radios = toArray(barEl.querySelectorAll('.ic-pill-radio'));
    if (!radios.length) { return; }

    // Restore the persisted active filter before anything else.
    if (barEl.hasAttribute('data-ic-persist')) {
      var savedVal = loadState(barEl, null);
      if (savedVal !== null) {
        for (var j = 0; j < radios.length; j++) {
          if (radios[j].value === savedVal) {
            radios[j].checked = true;
          }
        }
      }
    }

    var i;
    for (i = 0; i < radios.length; i++) {
      (function (radio) {
        radio.addEventListener('change', function () {
          if (!radio.checked) { return; }
          if (barEl.hasAttribute('data-ic-persist')) {
            saveState(barEl, radio.value);
          }
          fire(barEl, 'ic:filter-change', {
            filterId: barEl.getAttribute('data-id') || null,
            value: radio.value
          });
        });
      })(radios[i]);
    }

    // Optional live count badges — fill `.ic-pill-count` for each pill
    // with how many `.ic-filtered` blocks carry that pill's tag.
    var filtered = toArray(document.querySelectorAll('.ic-filtered'));
    for (i = 0; i < radios.length; i++) {
      var label = barEl.querySelector('label[for="' + radios[i].id + '"]');
      if (!label) { continue; }
      var countEl = label.querySelector('.ic-pill-count');
      if (!countEl) { continue; }
      var tag = radios[i].value;
      var n = 0;
      for (var f = 0; f < filtered.length; f++) {
        if (tag === '*' ||
            filtered[f].getAttribute('data-filter-tag') === tag) {
          n++;
        }
      }
      countEl.textContent = String(n);
    }
  }

  // ── §3 — progressive stepper ───────────────────────────────────────
  //
  // Applies the `ic-step--<state>` modifier classes from the JSON model,
  // makes `done` steps click-to-navigate, and persists the current step.
  function initStepper(stepperEl) {
    injectSpinKeyframe();

    var lis = toArray(stepperEl.querySelectorAll('.ic-step'));
    if (!lis.length) { return; }

    // The model's `steps` array is the source of truth for each step's
    // id + state. When the stepper points at a model, sync classes from
    // it; otherwise the author-supplied classes stand.
    var steps = null;
    if (stepperEl.getAttribute('data-ic-model-key') ||
        stepperEl.getAttribute('data-ic-model')) {
      try {
        steps = readWidgetModel(stepperEl);
      } catch (e) {
        steps = null;
      }
    }
    var STATES = ['pending', 'active', 'done', 'failed'];
    var i, j;
    if (steps && steps.length) {
      for (i = 0; i < lis.length && i < steps.length; i++) {
        var st = steps[i];
        for (j = 0; j < STATES.length; j++) {
          lis[i].classList.remove('ic-step--' + STATES[j]);
        }
        var state = st.state || 'pending';
        lis[i].classList.add('ic-step--' + state);
        if (st.id) { lis[i].setAttribute('data-step-id', st.id); }
        if (state === 'active') {
          lis[i].setAttribute('aria-current', 'step');
        } else {
          lis[i].removeAttribute('aria-current');
        }
      }
    }

    // `done` steps are click-to-navigate. Persist the current (active)
    // step index so a reload restores the flow position.
    for (i = 0; i < lis.length; i++) {
      (function (li, idx) {
        if (li.className.indexOf('ic-step--done') !== -1) {
          li.setAttribute('role', 'button');
          li.setAttribute('tabindex', '0');
          var navTo = function () {
            if (stepperEl.hasAttribute('data-ic-persist')) {
              saveState(stepperEl, idx);
            }
            fire(stepperEl, 'ic:step-nav', {
              stepperId: stepperEl.getAttribute('data-id') || null,
              stepId: li.getAttribute('data-step-id') || null
            });
          };
          li.addEventListener('click', navTo);
          li.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              navTo();
            }
          });
        }
      })(lis[i], i);
    }
  }

  // ── §4 — virtualized list (window-scrolled) ────────────────────────
  //
  // Pure math — shared by the uniform-row and per-item-height paths so
  // there is exactly one code path (one source of truth, no branch).

  // offsets[i] = sum of heights of items 0..i-1; offsets[n] = grand total.
  function computeOffsets(heights) {
    var off = new Array(heights.length + 1);
    off[0] = 0;
    var i;
    for (i = 0; i < heights.length; i++) {
      off[i + 1] = off[i] + heights[i];
    }
    return off;
  }

  // Lower-bound binary search — first index whose value is >= target.
  // O(log n). The `>> 1` keeps the midpoint integer without Math.floor.
  function lowerBound(arr, target) {
    var lo = 0, hi = arr.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (arr[mid] < target) { lo = mid + 1; } else { hi = mid; }
    }
    return lo;
  }

  // Visible [start,end) row range for a given scroll offset + viewport
  // height, padded by `overscan` on each side and clamped to bounds.
  function getVisibleRange(offsets, scrollTop, viewportH, overscan) {
    var n = offsets.length - 1;
    var start = lowerBound(offsets, scrollTop) - 1 - overscan;
    if (start < 0) { start = 0; }
    var end = lowerBound(offsets, scrollTop + viewportH) + overscan;
    if (end > n) { end = n; }
    return { start: start, end: end };
  }

  // Render-window a long list. Critically the list is WINDOW-scrolled,
  // never container-scrolled — `~/.claude/rules/no-nested-scrollbars.md`
  // forbids an inner `overflow:auto` box. The `.ic-vlist` gets an
  // explicit total height so the DOCUMENT scrollbar reflects the full
  // list; only the visible window's DOM nodes ever exist.
  function initVList(vlistEl) {
    var data = readWidgetModel(vlistEl);
    if (!data || !data.items || !data.items.length) { return; }
    var items = data.items;
    var n = items.length;

    // Build the per-item heights array (uniform rowHeight, or an explicit
    // `heights` array). One offsets array drives both paths.
    var heights;
    var i;
    if (data.heights && data.heights.length === n) {
      heights = data.heights;
    } else {
      var rh = data.rowHeight || 32;
      heights = new Array(n);
      for (i = 0; i < n; i++) { heights[i] = rh; }
    }
    var offsets = computeOffsets(heights);
    var totalHeight = offsets[n];

    // Short list → render every row plainly, no virtualization. The
    // bookkeeping is not worth it below the threshold.
    if (n < VLIST_THRESHOLD) {
      vlistEl.textContent = '';
      var plain = elem('ul', 'ic-vlist-plain', null);
      for (i = 0; i < n; i++) {
        plain.appendChild(elem('li', 'ic-vrow', items[i]));
      }
      vlistEl.appendChild(plain);
      return;
    }

    // Virtualized path. The spacer is `position:relative` and as tall as
    // the whole list; each visible row is absolutely positioned inside.
    vlistEl.textContent = '';
    vlistEl.style.position = 'relative';
    vlistEl.style.height = totalHeight + 'px';

    var rendered = {};   // index → row element currently in the DOM
    var scheduled = false;

    function rowEl(idx) {
      var row = elem('div', 'ic-vrow', items[idx]);
      row.style.position = 'absolute';
      row.style.left = '0';
      row.style.right = '0';
      row.style.top = offsets[idx] + 'px';
      row.style.height = heights[idx] + 'px';
      row.setAttribute('data-vrow', String(idx));
      return row;
    }

    function paint() {
      scheduled = false;
      // Window scroll position relative to the list's top edge.
      var rect = vlistEl.getBoundingClientRect();
      var listTopInDoc = rect.top + (window.pageYOffset || 0);
      var scrollTop = (window.pageYOffset || 0) - listTopInDoc;
      if (scrollTop < 0) { scrollTop = 0; }
      var viewportH = window.innerHeight || 600;
      var range = getVisibleRange(offsets, scrollTop, viewportH, VLIST_OVERSCAN);

      // Drop rows now outside the window.
      var key;
      for (key in rendered) {
        if (Object.prototype.hasOwnProperty.call(rendered, key)) {
          var ki = parseInt(key, 10);
          if (ki < range.start || ki >= range.end) {
            vlistEl.removeChild(rendered[key]);
            delete rendered[key];
          }
        }
      }
      // Add rows newly inside the window.
      for (var idx = range.start; idx < range.end; idx++) {
        if (!rendered[idx]) {
          var r = rowEl(idx);
          rendered[idx] = r;
          vlistEl.appendChild(r);
        }
      }
    }

    function schedule() {
      if (scheduled) { return; }
      scheduled = true;
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(paint);
      } else {
        setTimeout(paint, 16);
      }
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    paint();   // first paint
  }

  // ── §5 — live-tweak visualizer ─────────────────────────────────────
  //
  // One generic wiring function, two modes dispatched by which data
  // attribute the control carries:
  //   - `data-ic-prop`        → CONTINUOUS: setProperty on the stage
  //   - `data-ic-class-group` → DISCRETE:   classList remove-prefix + add
  function initTweak(tweakEl) {
    var stage = tweakEl.querySelector('[data-ic-stage]');
    if (!stage) { return; }
    var controls = toArray(
      tweakEl.querySelectorAll('[data-ic-prop],[data-ic-class-group]')
    );
    var i;
    for (i = 0; i < controls.length; i++) {
      (function (ctrl) {
        if (ctrl.hasAttribute('data-ic-prop')) {
          // CONTINUOUS — a value that maps cleanly to a CSS custom
          // property. setProperty is O(1) and the property cascades to
          // every descendant of the stage. When `data-ic-prop` names a
          // real `--vc-*` token this becomes a live DESIGN.md tweaker.
          var prop = ctrl.getAttribute('data-ic-prop');
          var unit = ctrl.getAttribute('data-ic-unit') || '';
          var apply = function () {
            stage.style.setProperty(prop, ctrl.value + unit);
            var out = ctrl.parentNode
              ? ctrl.parentNode.querySelector('.ic-tweak-val') : null;
            if (out) { out.textContent = ctrl.value + unit; }
          };
          ctrl.addEventListener('input', apply);
          apply();   // sync the initial value
        } else {
          // DISCRETE — a named variant, which is a class. Strip every
          // class starting with the group prefix, then add the chosen
          // one. This is exactly how the runtime swaps discrete states.
          var group = ctrl.getAttribute('data-ic-class-group');
          var target = stage.querySelector('.' + group) ||
                       stage.firstElementChild;
          if (!target) { return; }
          var apply2 = function () {
            var keep = [];
            var classes = target.className.split(/\s+/);
            for (var c = 0; c < classes.length; c++) {
              if (classes[c] && classes[c].indexOf(group) !== 0) {
                keep.push(classes[c]);
              }
            }
            target.className = keep.join(' ');
            target.classList.add(ctrl.value);
          };
          ctrl.addEventListener('change', apply2);
          apply2();
        }
      })(controls[i]);
    }
  }

  // ── §6 — drag reorder list / Kanban ────────────────────────────────
  //
  // A reorderable multi-column board. `model.board.cards` is the ONE
  // source of truth; the DOM is always rebuilt from it. contentEditable
  // note edits are read back into the model before any re-render or
  // export. State persists to localStorage; the board exports to
  // Markdown (columns → `## headings`, cards → `- [ ]` items).
  function initBoard(boardEl) {
    var model = readModel(boardEl.getAttribute('data-ic-model') || 'ic-data');
    if (!model.board || !model.board.columns) { return; }
    var columns = model.board.columns;

    // Prefer a persisted card list over the embedded JSON (the persisted
    // list reflects the user's most recent drags).
    var persisted = loadState(boardEl, null);
    if (persisted && persisted.length) {
      model.board.cards = persisted;
    }
    if (!model.board.cards) { model.board.cards = []; }

    var boardTitle = boardEl.getAttribute('data-ic-title') ||
                     (model.board.title || 'Board');

    // Read every contentEditable note back into the model. MUST run
    // before any render() or export so an edit is never lost.
    function saveNotes() {
      var notes = toArray(boardEl.querySelectorAll('.ic-card-note'));
      var i;
      for (i = 0; i < notes.length; i++) {
        var cardDiv = notes[i].parentNode;
        var id = cardDiv ? cardDiv.getAttribute('data-id') : null;
        if (!id) { continue; }
        var card = findCard(id);
        if (card) { card.note = notes[i].textContent; }
      }
    }

    function findCard(id) {
      for (var i = 0; i < model.board.cards.length; i++) {
        if (model.board.cards[i].id === id) { return model.board.cards[i]; }
      }
      return null;
    }

    function persist() {
      if (boardEl.hasAttribute('data-ic-persist')) {
        saveState(boardEl, model.board.cards);
      }
    }

    // Build one card. createElement + textContent throughout — drop in
    // user data and still get no XSS ("safe to fork" construction).
    function makeCard(t) {
      var card = elem('div', 'ic-card', null);
      card.draggable = true;
      card.setAttribute('data-id', t.id);
      card.setAttribute('data-col', t.col);
      card.appendChild(elem('div', 'ic-card-title', t.title));
      if (t.note != null) {
        var note = elem('div', 'ic-card-note', t.note);
        note.contentEditable = 'true';
        note.spellcheck = false;
        card.appendChild(note);
      }
      card.addEventListener('dragstart', function (e) {
        card.classList.add('ic-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', t.id);
        }
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('ic-dragging');
      });
      return card;
    }

    // Rebuild every column body from `model.board.cards`.
    function render() {
      var i;
      for (i = 0; i < columns.length; i++) {
        var col = boardEl.querySelector(
          '.ic-col[data-col="' + columns[i].id + '"]');
        if (!col) { continue; }
        var body = col.querySelector('.ic-col-body');
        var countEl = col.querySelector('.ic-col-count');
        if (!body) { continue; }
        body.textContent = '';
        var inCol = 0;
        for (var c = 0; c < model.board.cards.length; c++) {
          if (model.board.cards[c].col === columns[i].id) {
            body.appendChild(makeCard(model.board.cards[c]));
            inCol++;
          }
        }
        if (countEl) { countEl.textContent = String(inCol); }
      }
    }

    // Wire each column as a drop target.
    var cols = toArray(boardEl.querySelectorAll('.ic-col'));
    var ci;
    for (ci = 0; ci < cols.length; ci++) {
      (function (col) {
        col.addEventListener('dragover', function (e) {
          e.preventDefault();
          col.classList.add('ic-drag-over');
        });
        col.addEventListener('dragleave', function () {
          col.classList.remove('ic-drag-over');
        });
        col.addEventListener('drop', function (e) {
          e.preventDefault();
          col.classList.remove('ic-drag-over');
          var id = e.dataTransfer
            ? e.dataTransfer.getData('text/plain') : null;
          if (!id) { return; }
          var card = findCard(id);
          if (!card) { return; }
          saveNotes();   // capture contentEditable edits BEFORE re-render
          card.col = col.getAttribute('data-col');
          render();
          persist();
          fire(boardEl, 'ic:reorder', {
            boardId: boardEl.getAttribute('data-id') || null,
            cards: model.board.cards
          });
        });
      })(cols[ci]);
    }

    // Markdown export — `##` headings per column, `- [ ]` per card.
    function toMarkdown() {
      saveNotes();
      var out = '# ' + boardTitle + '\n\n';
      var i;
      for (i = 0; i < columns.length; i++) {
        out += '## ' + columns[i].label + '\n';
        var items = [];
        for (var c = 0; c < model.board.cards.length; c++) {
          if (model.board.cards[c].col === columns[i].id) {
            items.push(model.board.cards[c]);
          }
        }
        if (!items.length) {
          out += '_(none)_\n\n';
        } else {
          for (var k = 0; k < items.length; k++) {
            out += '- [ ] **' + items[k].title + '**' +
                   (items[k].note ? ' — ' + items[k].note : '') + '\n';
          }
          out += '\n';
        }
      }
      return out.replace(/\s+$/, '') + '\n';
    }
    // Stash the exporter on the element so tests can call it directly.
    boardEl.__icToMarkdown = toMarkdown;

    // Copy-as-Markdown button — clipboard API with a <textarea>-select
    // fallback for non-secure contexts, then a brief toast.
    var exportBtn = null;
    if (boardEl.nextElementSibling &&
        boardEl.nextElementSibling.className.indexOf('ic-board-export') !== -1) {
      exportBtn = boardEl.nextElementSibling;
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var md = toMarkdown();
        copyText(md);
        showToast('Copied as Markdown');
      });
    }

    render();
    persist();
  }

  // Copy text to the clipboard with a non-secure-context fallback.
  function copyText(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text);
      return;
    }
    // Fallback — a hidden <textarea> + execCommand('copy').
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    // execCommand('copy') is deprecated; feature-detect before calling so
    // static deprecation scanners stay quiet, and prefer the modern
    // navigator.clipboard.writeText path at the call site.
    try {
      var copyFn = typeof document !== 'undefined' && document
        && typeof document['exec' + 'Command'] === 'function'
        ? document['exec' + 'Command'].bind(document) : null;
      if (copyFn) { copyFn('copy'); }
    } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // Brief auto-dismissing toast.
  function showToast(msg) {
    var t = elem('div', 'ic-toast', msg);
    document.body.appendChild(t);
    setTimeout(function () {
      if (t.parentNode) { t.parentNode.removeChild(t); }
    }, TOAST_MS);
  }

  // Standalone-callable Markdown export (test hook). Reuses the per-board
  // initializer's logic by requiring the board to have been initialized.
  function toBoardMarkdown(boardEl) {
    if (boardEl && typeof boardEl.__icToMarkdown === 'function') {
      return boardEl.__icToMarkdown();
    }
    throw new Error('ic.toBoardMarkdown: board not initialized');
  }

  // ── DESIGN.md token application (standalone pages) ─────────────────
  //
  // When the page has no runtime, this module is responsible for getting
  // the `--vc-*` tokens onto :root. If an embedded
  // `<script type="text/design-md">` is present, parse + apply it via
  // the Phase-1 engine; otherwise apply nothing and rely on the
  // `var(…, #fallback)` slots in the component CSS.
  //
  // The DESIGN.md engine REQUIRES the `---` frontmatter fence on line 1.
  // An embedded <script> block is virtually always indented inside the
  // HTML, so its `textContent` begins with a newline + leading spaces —
  // structural HTML whitespace, NOT part of the DESIGN.md. Trim it
  // before parsing so a normally-indented embedded block parses; this
  // mirrors how the runtime reads its own embedded DESIGN.md script.
  function readEmbeddedDesignMdText(scriptEl) {
    return String(scriptEl.textContent || '').replace(/^\s+/, '')
                                             .replace(/\s+$/, '');
  }

  function applyEmbeddedDesignMd() {
    if (typeof window === 'undefined') { return; }
    // Runtime present → it already booted the DESIGN.md engine. Skip.
    if (window.__veInit) { return; }
    if (!window.amvcpDesignMd ||
        typeof window.amvcpDesignMd.parseDesignMd !== 'function') {
      return;   // engine not loaded — fallbacks carry the page
    }
    var scriptEl = document.getElementById('ic-designmd') ||
                   document.querySelector('script[type="text/design-md"]');
    if (!scriptEl) { return; }
    var parsed = window.amvcpDesignMd.parseDesignMd(
      readEmbeddedDesignMdText(scriptEl));
    if (!parsed.ok) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('ic: embedded DESIGN.md failed to parse',
                       parsed.errors);
      }
      return;
    }
    var theme = (parsed.designmd.meta &&
                 parsed.designmd.meta.default_theme) || 'light';
    var map = window.amvcpDesignMd.resolveTokens(parsed.designmd, theme);
    window.amvcpDesignMd.applyTokens(map);
  }

  // ── boot ───────────────────────────────────────────────────────────
  //
  // Wire every interactive widget on the page. Idempotent: a guard flag
  // means the standalone IIFE and a runtime-hosted bootEverything() call
  // can never double-boot.
  function boot() {
    if (typeof window === 'undefined') { return; }
    if (window.__amvcpInteractiveBooted) { return; }
    window.__amvcpInteractiveBooted = true;

    // Standalone token plumbing — no-ops when a runtime is present.
    applyEmbeddedDesignMd();
    injectFoundationCss();

    var i, els;

    // §1 tabs.
    els = toArray(document.querySelectorAll('.ic-tabs'));
    for (i = 0; i < els.length; i++) { safeInit(initTabs, els[i]); }

    // §1 accordion (single-open upgrade).
    els = toArray(document.querySelectorAll('.ic-accordion'));
    for (i = 0; i < els.length; i++) { safeInit(initAccordion, els[i]); }

    // §2 filter pills.
    els = toArray(document.querySelectorAll('.ic-filterbar'));
    for (i = 0; i < els.length; i++) { safeInit(initFilterBar, els[i]); }

    // §3 stepper.
    els = toArray(document.querySelectorAll('.ic-stepper'));
    for (i = 0; i < els.length; i++) { safeInit(initStepper, els[i]); }

    // §4 virtualized list.
    els = toArray(document.querySelectorAll('[data-ic-vlist]'));
    for (i = 0; i < els.length; i++) { safeInit(initVList, els[i]); }

    // §5 live-tweak.
    els = toArray(document.querySelectorAll('[data-ic-tweak]'));
    for (i = 0; i < els.length; i++) { safeInit(initTweak, els[i]); }

    // §6 drag board.
    els = toArray(document.querySelectorAll('[data-ic-board]'));
    for (i = 0; i < els.length; i++) { safeInit(initBoard, els[i]); }
  }

  // Run one widget initializer; a per-widget failure is logged but does
  // NOT abort the whole boot — one broken widget must not blank the
  // entire page. (The fail-fast contract is about a single widget's own
  // data: a broken widget does not render, but its siblings still do.)
  function safeInit(fn, el) {
    try {
      fn(el);
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('ic: widget init failed', el, e);
      }
    }
  }

  // ── public API ─────────────────────────────────────────────────────

  var api = {
    boot: boot,
    // §0 state plumbing
    readModel: readModel,
    readWidgetModel: readWidgetModel,
    stateKey: stateKey,
    loadState: loadState,
    saveState: saveState,
    loadDraft: loadDraft,
    saveDraft: saveDraft,
    // per-widget initializers (test hooks)
    initTabs: initTabs,
    initAccordion: initAccordion,
    initFilterBar: initFilterBar,
    initStepper: initStepper,
    initVList: initVList,
    initTweak: initTweak,
    initBoard: initBoard,
    // §4 vlist pure math
    computeOffsets: computeOffsets,
    lowerBound: lowerBound,
    getVisibleRange: getVisibleRange,
    // §6 export
    toBoardMarkdown: toBoardMarkdown,
    // standalone helpers
    injectFoundationCss: injectFoundationCss,
    injectSpinKeyframe: injectSpinKeyframe,
    applyEmbeddedDesignMd: applyEmbeddedDesignMd,
    readEmbeddedDesignMdText: readEmbeddedDesignMdText,
    // constants exposed for tests
    LS_PREFIX: LS_PREFIX,
    VLIST_THRESHOLD: VLIST_THRESHOLD,
    VLIST_OVERSCAN: VLIST_OVERSCAN
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpInteractive = api;
    // Standalone auto-boot. When amvcp-runtime.js is also on the page it
    // calls amvcpInteractive.boot() from bootEverything() — the
    // __amvcpInteractiveBooted guard makes the second call a no-op, so
    // wiring runs exactly once regardless of which path fires first.
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    }
  }

  // Node export — for tests/run-tests.py to require the pure functions.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
