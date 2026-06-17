/*!
 * amvcp-docwiki.js — the navigable-document-wiki shell runtime.
 *
 * Turns a single self-contained HTML page that holds many `[data-ve-doc]`
 * sections into a hash-routed, Wikipedia-style wiki: cross-file links are plain
 * `<a href="#/<route>">` anchors, so the browser records real history and
 * back/forward work natively. This module shows the active page, maintains a
 * clickable breadcrumb trail, wires ◀ ▶ buttons + a search box, and emits a
 * `docwiki:navigate` event on every route so renderers / the search layer can
 * react.
 *
 * ES5-safe, dependency-free, no build step. Themed entirely from the runtime's
 * --ve-control-* (chrome) and --vc-color-* (content) tokens — light + dark both,
 * zero hardcoded palette. Self-contained: injects its own scoped stylesheet once.
 *
 * DOM contract:
 *   <div data-docwiki>                         the wiki root (bar injected first)
 *     <section data-ve-doc="home" data-doc-title="Home">…</section>
 *     <section data-ve-doc="trdd/103a53e0" data-doc-title="TRDD-103a53e0 — …">…</section>
 *     …
 *   </div>
 *   cross-link:  <a href="#/trdd/103a53e0" data-ve-navigate>label</a>
 *
 * Routes: "home" (default), "search" (q via #/search?q=…), and any "<type>/<id>".
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var STYLE_ID = 'amvcp-docwiki-style';
  var MAX_CRUMBS = 6; // head + … + recent tail
  var trail = [];     // [{route, title}]

  // ── scoped stylesheet (chrome = --ve-control-*, content = --vc-*) ──────────
  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var css =
      '[data-docwiki]{--dw-bar-h:auto;}' +
      '.docwiki-bar{position:sticky;top:0;z-index:var(--vc-z-modal,1000);' +
        'display:flex;align-items:center;gap:var(--vc-space-3,.5rem);flex-wrap:wrap;' +
        'padding:var(--vc-space-2,.4rem) var(--vc-space-4,.75rem);' +
        'background:var(--ve-control-overlay-bg,var(--vc-color-surface-raised,#fff));' +
        'border-bottom:1px solid var(--ve-control-border,var(--vc-color-border,#ddd));' +
        'font-family:var(--ve-control-font,var(--vc-font-body,system-ui,sans-serif));' +
        'color:var(--ve-control-fg,var(--vc-color-content,#222));' +
        '-webkit-backdrop-filter:blur(var(--ve-control-overlay-blur,6px));' +
        'backdrop-filter:blur(var(--ve-control-overlay-blur,6px));}' +
      '.docwiki-navbtns{display:flex;gap:var(--vc-space-1,.25rem);flex:0 0 auto;}' +
      '.docwiki-btn{appearance:none;cursor:pointer;line-height:1;' +
        'font:inherit;min-width:1.9em;padding:.3em .55em;' +
        'background:var(--ve-control-bg,var(--vc-color-surface,#f4f4f5));' +
        'color:var(--ve-control-fg,var(--vc-color-content,#222));' +
        'border:1px solid var(--ve-control-border,var(--vc-color-border,#ddd));' +
        'border-radius:var(--ve-control-radius-sm,var(--vc-radius-sm,4px));}' +
      '.docwiki-btn:hover{background:var(--ve-control-bg-hover,var(--vc-color-surface-raised,#eee));}' +
      '.docwiki-btn:focus-visible{outline:2px solid var(--ve-accent,var(--vc-color-accent,#3b82f6));outline-offset:1px;}' +
      '.docwiki-crumbs{flex:1 1 12rem;min-width:0;display:flex;flex-wrap:wrap;' +
        'align-items:center;gap:.15em .35em;font-size:.92em;}' +
      '.docwiki-crumb{color:var(--vc-color-accent,#2563eb);text-decoration:none;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:22ch;}' +
      '.docwiki-crumb:hover{text-decoration:underline;}' +
      '.docwiki-crumb[aria-current="page"]{color:var(--ve-control-fg,var(--vc-color-content,#222));' +
        'font-weight:var(--vc-weight-bold,600);pointer-events:none;}' +
      '.docwiki-sep{color:var(--vc-color-content-muted,#999);}' +
      '.docwiki-search{flex:0 1 16rem;display:flex;gap:var(--vc-space-1,.25rem);margin-left:auto;}' +
      '.docwiki-search input{flex:1 1 auto;min-width:6rem;font:inherit;padding:.3em .55em;' +
        'background:var(--ve-control-bg,var(--vc-color-canvas,#fff));' +
        'color:var(--ve-control-fg,var(--vc-color-content,#222));' +
        'border:1px solid var(--ve-control-border,var(--vc-color-border,#ddd));' +
        'border-radius:var(--ve-control-radius-sm,var(--vc-radius-sm,4px));}' +
      // pages: hidden unless active. overflow visible (no nested scrollbars).
      '[data-docwiki] [data-ve-doc]{display:none;overflow:visible;' +
        'max-width:none;padding:var(--vc-space-5,1rem) var(--vc-space-4,.75rem);}' +
      '[data-docwiki] [data-ve-doc].is-active{display:block;}' +
      '.docwiki-missing{color:var(--vc-color-danger,#b91c1c);padding:var(--vc-space-5,1rem);}';
    var el = doc.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (doc.head || doc.documentElement).appendChild(el);
  }

  // ── hash parsing ──────────────────────────────────────────────────────────
  // "#/trdd/103a53e0" -> {route:"trdd/103a53e0"}; "#/search?q=foo" -> {route:"search",q:"foo"}
  function parseHash(hash) {
    var h = (hash || '').replace(/^#\/?/, '');
    if (!h) return { route: 'home', q: null };
    var qi = h.indexOf('?');
    var q = null;
    if (qi !== -1) {
      var qs = h.slice(qi + 1);
      h = h.slice(0, qi);
      var m = /(?:^|&)q=([^&]*)/.exec(qs);
      if (m) { try { q = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { q = m[1]; } }
    }
    return { route: h.replace(/\/+$/, '') || 'home', q: q };
  }

  function pages(root) { return root.querySelectorAll('[data-ve-doc]'); }

  function findPage(root, route) {
    var list = pages(root), i;
    for (i = 0; i < list.length; i++) {
      if (list[i].getAttribute('data-ve-doc') === route) return list[i];
    }
    return null;
  }

  function titleOf(page, route) {
    if (page) {
      var t = page.getAttribute('data-doc-title');
      if (t) return t;
      var h = page.querySelector('h1,h2');
      if (h && h.textContent) return h.textContent.trim();
    }
    return route === 'home' ? 'Home' : route;
  }

  // ── breadcrumb trail (Wikipedia-style "where you came from", deduped) ──────
  function updateTrail(route, title) {
    var i;
    for (i = 0; i < trail.length; i++) {
      if (trail[i].route === route) { trail.length = i + 1; trail[i].title = title; return; }
    }
    trail.push({ route: route, title: title });
  }

  function renderCrumbs(doc, container) {
    while (container.firstChild) container.removeChild(container.firstChild);
    var items = trail.slice();
    if (items.length === 0 || items[0].route !== 'home') {
      items.unshift({ route: 'home', title: 'Home' });
    }
    var shown = items;
    if (items.length > MAX_CRUMBS) {
      shown = [items[0], { route: null, title: '…' }].concat(items.slice(items.length - (MAX_CRUMBS - 2)));
    }
    var i;
    for (i = 0; i < shown.length; i++) {
      if (i > 0) {
        var sep = doc.createElement('span');
        sep.className = 'docwiki-sep'; sep.textContent = '›'; sep.setAttribute('aria-hidden', 'true');
        container.appendChild(sep);
      }
      var it = shown[i];
      if (it.route === null) {
        var ell = doc.createElement('span');
        ell.className = 'docwiki-sep'; ell.textContent = it.title;
        container.appendChild(ell);
        continue;
      }
      var a = doc.createElement('a');
      a.className = 'docwiki-crumb';
      a.href = '#/' + it.route;
      a.textContent = it.title;
      if (i === shown.length - 1) a.setAttribute('aria-current', 'page');
      container.appendChild(a);
    }
  }

  // ── router ────────────────────────────────────────────────────────────────
  function makeRouter(doc, root, crumbsEl) {
    return function route() {
      var parsed = parseHash(global.location.hash);
      var r = parsed.route;
      var list = pages(root), i, page = null;
      for (i = 0; i < list.length; i++) {
        var isActive = list[i].getAttribute('data-ve-doc') === r;
        if (isActive) page = list[i];
        if (isActive) { addClass(list[i], 'is-active'); } else { removeClass(list[i], 'is-active'); }
      }
      if (!page) {
        // unknown route: fall back to home if it exists, else show a missing note
        var home = findPage(root, 'home');
        if (home && r !== 'home') { addClass(home, 'is-active'); page = home; r = 'home'; }
        else if (!home) { showMissing(doc, root, r); }
      }
      updateTrail(r, titleOf(page, r));
      if (crumbsEl) renderCrumbs(doc, crumbsEl);
      if (global.scrollTo) { try { global.scrollTo(0, 0); } catch (e) {} }
      emit(doc, root, r, parsed.q, page);
    };
  }

  function showMissing(doc, root, r) {
    var note = root.querySelector('.docwiki-missing');
    if (!note) {
      note = doc.createElement('div');
      note.className = 'docwiki-missing';
      root.appendChild(note);
    }
    note.textContent = 'No page for "' + r + '".';
    addClass(note, 'is-active');
  }

  function emit(doc, root, route, q, page) {
    var ev;
    try {
      ev = new global.CustomEvent('docwiki:navigate', { bubbles: true, detail: { route: route, q: q, page: page } });
    } catch (e) {
      ev = doc.createEvent('CustomEvent');
      ev.initCustomEvent('docwiki:navigate', true, false, { route: route, q: q, page: page });
    }
    root.dispatchEvent(ev);
  }

  function addClass(el, c) { if (el.className.indexOf(c) === -1) el.className = (el.className + ' ' + c).replace(/\s+/g, ' ').trim(); }
  function removeClass(el, c) { el.className = (' ' + el.className + ' ').replace(' ' + c + ' ', ' ').replace(/\s+/g, ' ').trim(); }

  // ── top bar ────────────────────────────────────────────────────────────────
  function buildBar(doc, root) {
    if (root.querySelector('.docwiki-bar')) return root.querySelector('.docwiki-crumbs');
    var bar = doc.createElement('header');
    bar.className = 'docwiki-bar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Document wiki');

    var navbtns = doc.createElement('div');
    navbtns.className = 'docwiki-navbtns';
    var back = mkBtn(doc, '◀', 'Back');
    var fwd = mkBtn(doc, '▶', 'Forward');
    back.onclick = function () { if (global.history) global.history.back(); };
    fwd.onclick = function () { if (global.history) global.history.forward(); };
    navbtns.appendChild(back); navbtns.appendChild(fwd);

    var crumbs = doc.createElement('nav');
    crumbs.className = 'docwiki-crumbs';
    crumbs.setAttribute('aria-label', 'Breadcrumb');

    var search = doc.createElement('form');
    search.className = 'docwiki-search';
    var input = doc.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search…';
    input.setAttribute('aria-label', 'Search the wiki');
    search.appendChild(input);
    search.onsubmit = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      var q = input.value.replace(/^\s+|\s+$/g, '');
      global.location.hash = q ? '#/search?q=' + encodeURIComponent(q) : '#/home';
    };

    bar.appendChild(navbtns);
    bar.appendChild(crumbs);
    bar.appendChild(search);
    root.insertBefore(bar, root.firstChild);
    return crumbs;
  }

  function mkBtn(doc, label, title) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'docwiki-btn';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    return b;
  }

  // ── init ────────────────────────────────────────────────────────────────────
  function initOne(doc, root) {
    if (root.getAttribute('data-docwiki-ready') === '1') return;
    root.setAttribute('data-docwiki-ready', '1');
    injectStyles(doc);
    var crumbsEl = buildBar(doc, root);
    var router = makeRouter(doc, root, crumbsEl);
    if (global.addEventListener) global.addEventListener('hashchange', router, false);
    root.__docwikiRoute = router;
    router(); // route the initial hash
  }

  function initAll(docArg) {
    var doc = docArg || global.document;
    if (!doc) return;
    var roots = doc.querySelectorAll('[data-docwiki]'), i;
    for (i = 0; i < roots.length; i++) initOne(doc, roots[i]);
  }

  global.amvcpDocwiki = {
    version: VERSION,
    init: initAll,
    parseHash: parseHash,
    goto: function (route) { global.location.hash = '#/' + String(route).replace(/^#?\/?/, ''); }
  };

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', function () { initAll(); }, false);
    } else {
      initAll();
    }
  }
})(typeof window !== 'undefined' ? window : this);
