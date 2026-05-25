/*!
 * amvcp-overlay.js — overlay-mode runtime (R38).
 *
 * When loaded on a USER'S DEPLOYED WEBSITE (a third-party page, not a
 * plugin-rendered HTML), exposes:
 *
 *   window.amvcpOverlay = {
 *     armOverlay(),      // inject the overlay layer + bind click capture
 *     disarmOverlay(),   // remove overlay layer + restore byte-identical
 *                        // pre-arm DOM (R24 non-destructive contract)
 *     isArmed(),         // current state
 *     collectSubmission(),  // payload of selected elements
 *     clearSelections(), // forget all selections
 *
 *     // Test hooks — bypass the click pipeline so the headless audit
 *     // can confirm selector-round-trip without simulating real mouse
 *     // events.
 *     _addSelectionForTest(el),
 *     _computeSelector(el)   // exposed so the round-trip test can assert
 *                            // querySelector(selector) === el
 *   };
 *
 * The selection target is the ACTUAL HTML element under the cursor —
 * <div>, <button>, <input>, React/Vue component root, link, image,
 * form control — NOT a plugin-stamped [data-ve-comment-id] atom
 * (those don't exist on a third-party page). The same comment-modal
 * UX as report mode opens; the same Done/Submit contract returns the
 * payload, with each selection identified by a stable best-effort
 * SELECTOR that document.querySelector(selector) can round-trip back
 * to the SAME element.
 *
 * R24 NON-DESTRUCTIVE CONTRACT:
 *   - inject ONE overlay-root sibling at end of <body>:
 *       <div data-ve-mode="overlay" data-ve-overlay-root="1">…</div>
 *   - the highlight ring is a separate fixed-position <div>, NOT a
 *     style mutation on the host element — host elements are never
 *     given classes / inline styles / data-* attributes.
 *   - on disarm: remove the overlay-root + the highlight ring, detach
 *     all listeners, restore document.body.outerHTML byte-identical
 *     to the pre-arm snapshot (verified by R24).
 *
 * R38 SUBMISSION PAYLOAD (per R25):
 *   {
 *     kind: 'overlay-submit',
 *     selections: [
 *       { id, selector, text, kind, role?, tagName, attrs }
 *     ]
 *   }
 *   - selector is computed via _computeSelector(el) — tag + id +
 *     classes + nth-of-type + textContent prefix; document.
 *     querySelector(selector) MUST resolve back to the same node.
 *
 * INTERACTION:
 *   - arm: inject overlay root, capture mousemove (highlight
 *     element under cursor) + click (toggle selection).
 *   - disarm: tear down.
 *   - the overlay layer is `pointer-events: none` EXCEPT for the
 *     toolbar at the top. Mousemove/click on host elements work
 *     normally; we listen at the document level in capture phase.
 *
 * Dependency-free pure JS (no engine, no React). Loaded as a
 * standalone script via <script src="amvcp-overlay.js">.
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────
  var OVERLAY_ROOT_ID = 've-overlay-root';
  var OVERLAY_HIGHLIGHT_ID = 've-overlay-highlight';
  var OVERLAY_TOOLBAR_ID = 've-overlay-toolbar';
  var OVERLAY_STYLE_ID = 've-overlay-style';

  // ── State ──────────────────────────────────────────────────────────
  var armed = false;
  // Map: selector string → { el, addedAt, selector }
  // Using an object so the same element clicked twice = removed
  // (toggle semantics) rather than duplicated.
  var selections = {};
  var hoveredEl = null;
  var listeners = [];   // { target, type, fn, opts } — for clean tear-down

  // ── Selector synthesis ─────────────────────────────────────────────
  //
  // Build a CSS selector that document.querySelector can round-trip
  // back to the same element. Priority:
  //   1. #id    (if id is present, valid, and unique on the page)
  //   2. tag + classes + nth-of-type
  //   3. fallback: ancestor selector chain (parent > ... > tag:nth)
  //
  // We don't use ARIA roles or contenteditable state — those can
  // change. We DO use the element's first 24 chars of textContent
  // as a `text=` annotation in the payload (for the agent's source
  // mapping), but the selector itself stays pure CSS.

  function _isValidCssIdent(s) {
    return /^[a-zA-Z_-][\w-]*$/.test(s);
  }

  function _classChain(el) {
    if (!el.classList || el.classList.length === 0) return '';
    var parts = [];
    for (var i = 0; i < el.classList.length; i++) {
      var c = el.classList[i];
      if (_isValidCssIdent(c)) {
        parts.push('.' + c);
      }
    }
    return parts.join('');
  }

  function _nthOfTypeIndex(el) {
    if (!el.parentNode) return 1;
    var sibs = el.parentNode.children;
    var idx = 0;
    for (var i = 0; i < sibs.length; i++) {
      if (sibs[i].tagName === el.tagName) {
        idx++;
        if (sibs[i] === el) return idx;
      }
    }
    return 1;
  }

  function _localSelector(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (!tag) return '';
    // ID wins if unique and valid.
    if (el.id && _isValidCssIdent(el.id)) {
      try {
        if (document.querySelectorAll('#' + el.id).length === 1) {
          return '#' + el.id;
        }
      } catch (_) {}
    }
    var cls = _classChain(el);
    var nth = _nthOfTypeIndex(el);
    return tag + cls + ':nth-of-type(' + nth + ')';
  }

  function _computeSelector(el) {
    // Walk up to find the shortest selector that uniquely identifies el.
    var chain = [];
    var cur = el;
    var depth = 0;
    while (cur && cur !== document.documentElement && depth < 12) {
      var local = _localSelector(cur);
      chain.unshift(local);
      var candidate = chain.join(' > ');
      try {
        var match = document.querySelector(candidate);
        if (match === el) {
          return candidate;
        }
      } catch (_) { /* invalid selector — fall through */ }
      cur = cur.parentElement;
      depth++;
    }
    // Last resort: just the local selector (may not round-trip
    // uniquely; the caller can fall back to text-based matching).
    return _localSelector(el);
  }

  function _verifySelectorRoundTrips(selector, el) {
    try {
      return document.querySelector(selector) === el;
    } catch (_) { return false; }
  }

  // ── Highlight ring ─────────────────────────────────────────────────
  //
  // A separate fixed-position <div> that mirrors the bbox of the
  // currently-hovered element. NOT a mutation on the host element.

  function _ensureHighlight() {
    var h = document.getElementById(OVERLAY_HIGHLIGHT_ID);
    if (h) return h;
    h = document.createElement('div');
    h.id = OVERLAY_HIGHLIGHT_ID;
    h.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:2147483640',
      'box-sizing:border-box',
      'border:2px dashed #b8861f',
      'background:rgba(184,134,31,0.08)',
      'transition:opacity 90ms linear',
      'opacity:0',
      'top:0', 'left:0', 'width:0', 'height:0',
      ''
    ].join(';');
    var root = document.getElementById(OVERLAY_ROOT_ID);
    if (root) root.appendChild(h);
    else (document.body || document.documentElement).appendChild(h);
    return h;
  }

  function _moveHighlightTo(el) {
    var h = _ensureHighlight();
    if (!el) { h.style.opacity = '0'; return; }
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { h.style.opacity = '0'; return; }
    h.style.left = r.left + 'px';
    h.style.top = r.top + 'px';
    h.style.width = r.width + 'px';
    h.style.height = r.height + 'px';
    h.style.opacity = '1';
  }

  // ── Toolbar ────────────────────────────────────────────────────────
  function _buildToolbar() {
    var bar = document.createElement('div');
    bar.id = OVERLAY_TOOLBAR_ID;
    bar.setAttribute('data-ve-overlay', '1');
    bar.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483641',
      'display:flex',
      'gap:8px',
      'align-items:center',
      'padding:8px 12px',
      'background:rgba(255,253,248,0.96)',
      'border:1px solid #c9bfa3',
      'border-radius:8px',
      'box-shadow:0 4px 12px rgba(0,0,0,0.16)',
      'font:13px/1 system-ui, sans-serif',
      'pointer-events:auto',
      ''
    ].join(';');
    var label = document.createElement('span');
    label.style.cssText = 'color:#5b5343;';
    label.textContent = 'Overlay select — click any element. ';
    bar.appendChild(label);
    var counter = document.createElement('span');
    counter.setAttribute('data-ve-overlay-count', '');
    counter.style.cssText =
      'font-weight:600;color:#1f1a14;padding:0 6px;';
    counter.textContent = '0 selected';
    bar.appendChild(counter);
    function btn(text, action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.style.cssText = [
        'border:1px solid #c9bfa3',
        'background:#fffdf8',
        'color:#1f1a14',
        'padding:5px 10px',
        'border-radius:4px',
        'cursor:pointer',
        'font:inherit',
        ''
      ].join(';');
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        action();
      });
      bar.appendChild(b);
      return b;
    }
    btn('Clear', function () { clearSelections(); _updateCounter(); });
    btn('Submit', function () {
      var payload = collectSubmission();
      // The host page is responsible for catching ve-overlay-submit
      // and POST'ing it to wherever (amvcp-select.py / a JSON
      // endpoint / whatever). The overlay runtime just emits the
      // event; no built-in transport.
      try {
        document.dispatchEvent(new CustomEvent(
          've-overlay-submit', { detail: payload }));
      } catch (_) { /* legacy event fallback */ }
      window.__vcOverlayLastSubmission = payload;
    });
    btn('Done', function () { disarmOverlay(); });
    return bar;
  }

  function _updateCounter() {
    var bar = document.getElementById(OVERLAY_TOOLBAR_ID);
    if (!bar) return;
    var c = bar.querySelector('[data-ve-overlay-count]');
    if (c) {
      var n = Object.keys(selections).length;
      c.textContent = n + ' selected';
    }
  }

  // ── Style ──────────────────────────────────────────────────────────
  function _ensureStyle() {
    if (document.getElementById(OVERLAY_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = OVERLAY_STYLE_ID;
    s.textContent = [
      '[data-ve-overlay-selected="1"] {',
      '  outline:3px solid #b8861f !important;',
      '  outline-offset:1px !important;',
      '}',
      ''
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Event handlers ─────────────────────────────────────────────────
  function _isOurOverlayElement(el) {
    if (!el) return false;
    if (el.id === OVERLAY_ROOT_ID
        || el.id === OVERLAY_HIGHLIGHT_ID
        || el.id === OVERLAY_TOOLBAR_ID) return true;
    if (el.closest && el.closest('[data-ve-overlay]')) return true;
    return false;
  }

  function _onMouseMove(ev) {
    if (!armed) return;
    if (_isOurOverlayElement(ev.target)) {
      _moveHighlightTo(null);
      hoveredEl = null;
      return;
    }
    hoveredEl = ev.target;
    _moveHighlightTo(hoveredEl);
  }

  function _onClick(ev) {
    if (!armed) return;
    if (_isOurOverlayElement(ev.target)) return;
    // Capture phase: stop the host page from receiving the click.
    ev.stopPropagation();
    ev.preventDefault();
    _addSelection(ev.target);
  }

  function _onScroll() {
    if (!armed) return;
    // Re-position the highlight ring on scroll.
    if (hoveredEl) _moveHighlightTo(hoveredEl);
  }

  function _addSelection(el) {
    if (!el || _isOurOverlayElement(el)) return;
    var selector = _computeSelector(el);
    if (!_verifySelectorRoundTrips(selector, el)) {
      // Can't uniquely identify — annotate as not-round-trippable.
      // Still record so the agent can debug.
      selector = selector + ' /* NOT_UNIQUE */';
    }
    // Toggle if already selected.
    if (selections[selector]) {
      delete selections[selector];
      el.removeAttribute('data-ve-overlay-selected');
    } else {
      selections[selector] = { el: el, addedAt: Date.now(),
                               selector: selector };
      el.setAttribute('data-ve-overlay-selected', '1');
    }
    _updateCounter();
  }

  function clearSelections() {
    Object.keys(selections).forEach(function (sel) {
      var entry = selections[sel];
      if (entry && entry.el && entry.el.removeAttribute) {
        entry.el.removeAttribute('data-ve-overlay-selected');
      }
    });
    selections = {};
    _updateCounter();
  }

  function collectSubmission() {
    var items = [];
    Object.keys(selections).forEach(function (sel) {
      var entry = selections[sel];
      if (!entry || !entry.el) return;
      var el = entry.el;
      var attrs = {};
      if (el.attributes) {
        for (var i = 0; i < el.attributes.length; i++) {
          var a = el.attributes[i];
          // Skip our own marker.
          if (a.name === 'data-ve-overlay-selected') continue;
          attrs[a.name] = a.value;
        }
      }
      items.push({
        id: entry.selector,           // selector IS the stable id
        selector: entry.selector,
        kind: 'overlay-element',
        tagName: (el.tagName || '').toLowerCase(),
        text: (el.textContent || '').trim().slice(0, 200),
        label: (el.textContent || '').trim().slice(0, 80) || '(empty)',
        role: el.getAttribute && el.getAttribute('role'),
        attrs: attrs
      });
    });
    return {
      kind: 'overlay-submit',
      count: items.length,
      selections: items
    };
  }

  // ── arm / disarm ───────────────────────────────────────────────────
  function _addListener(target, type, fn, opts) {
    target.addEventListener(type, fn, opts || false);
    listeners.push({ target: target, type: type, fn: fn, opts: opts });
  }

  function armOverlay() {
    if (armed) return Promise.resolve(true);
    armed = true;
    _ensureStyle();
    var root = document.createElement('div');
    root.id = OVERLAY_ROOT_ID;
    root.setAttribute('data-ve-mode', 'overlay');
    root.setAttribute('data-ve-overlay-root', '1');
    // Root itself is pointer-events-none — only the toolbar inside
    // catches clicks.
    root.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:2147483639',
      ''
    ].join(';');
    root.appendChild(_buildToolbar());
    document.body.appendChild(root);
    _ensureHighlight();
    _addListener(document, 'mousemove', _onMouseMove, true);
    _addListener(document, 'click', _onClick, true);
    _addListener(window, 'scroll', _onScroll, true);
    return Promise.resolve(true);
  }

  function disarmOverlay() {
    armed = false;
    // Detach all listeners we added.
    for (var i = 0; i < listeners.length; i++) {
      var L = listeners[i];
      try { L.target.removeEventListener(L.type, L.fn, L.opts); }
      catch (_) {}
    }
    listeners = [];
    // Remove our marker attributes from any host elements.
    var marked = document.querySelectorAll('[data-ve-overlay-selected]');
    for (var j = 0; j < marked.length; j++) {
      marked[j].removeAttribute('data-ve-overlay-selected');
    }
    // Remove our injected DOM.
    var ids = [OVERLAY_ROOT_ID, OVERLAY_HIGHLIGHT_ID,
               OVERLAY_TOOLBAR_ID, OVERLAY_STYLE_ID];
    for (var k = 0; k < ids.length; k++) {
      var n = document.getElementById(ids[k]);
      if (n && n.parentNode) n.parentNode.removeChild(n);
    }
    selections = {};
    hoveredEl = null;
    return Promise.resolve(true);
  }

  function isArmed() { return armed; }

  // ── Test hook ──────────────────────────────────────────────────────
  function _addSelectionForTest(el) { _addSelection(el); }

  // ── Public API ─────────────────────────────────────────────────────
  var api = {
    armOverlay: armOverlay,
    disarmOverlay: disarmOverlay,
    isArmed: isArmed,
    collectSubmission: collectSubmission,
    clearSelections: clearSelections,
    _addSelectionForTest: _addSelectionForTest,
    _computeSelector: _computeSelector
  };

  if (typeof window !== 'undefined') {
    window.amvcpOverlay = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
