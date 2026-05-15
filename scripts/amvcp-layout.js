/*!
 * ai-maestro-visual-communicator-plugin — layout technique JS module.
 *
 * Phase 2 (TRDD-352ef46a, Build #2 — layout). The ONE JavaScript file
 * the layout technique needs. Everything else the technique ships is
 * pure CSS (grid presets, reading container, print, decorative
 * surfaces). This module adds three small behaviours, each of which
 * DEGRADES GRACEFULLY when JS is off:
 *
 *   initTOC()            — scroll-spy table of contents. Builds the
 *                          `.la-toc__list` from the document's headings
 *                          and highlights the link of the heading in the
 *                          mid-viewport band via IntersectionObserver.
 *                          JS off → static anchors still jump, no live
 *                          highlight.
 *   initStickyHeader()   — toggles `.is-scrolled` on a `.la-header` once
 *                          the page is scrolled, so a hairline border
 *                          appears. rAF-throttled. JS off → header is
 *                          still `position:sticky`, just no scroll
 *                          border.
 *   initSidebarToggle()  — flips `data-la-sidebar` open<->closed on the
 *                          target of every `[data-la-toggle]` button,
 *                          mirroring `aria-expanded`. Optional Ctrl+B
 *                          global shortcut. JS off → sidebar stays at
 *                          its HTML-authored state (open).
 *
 * Dual export:
 *   - browser: `window.amvcpLayout = { … }` (self-boots on
 *     DOMContentLoaded, mirrors amvcp-runtime.js's boot pattern)
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-runtime.js and scripts/amvcp-designmd.js —
 * `var`, function declarations, ES5-safe: no arrow functions, no
 * template literals, no classes, no const/let.
 *
 * Token contract: this module NEVER sets a `--vc-*` value — the
 * DESIGN.md engine (amvcp-designmd.js) owns those. The module only
 * reads the DOM and toggles classes/attributes; all theming is done in
 * the layout CSS via `var(--vc-…, fallback)`.
 *
 * Fail-fast contract: a malformed scaffold (a `.la-toc` with no
 * `.la-toc__list`) is reported with a clear `console.error` and that
 * ONE feature is skipped — a layout bug must not crash the whole
 * report, but the module never silently pretends success. There are
 * no try/catch fallback paths.
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The observer root is shrunk to the middle band of the viewport: a
  // heading counts as "active" only while it sits in the upper-middle
  // strip (top 40% masked, bottom 40% masked → 20% band centred on
  // viewport y=50%). This band is wide enough to capture the heading
  // when it is centred via `scrollIntoView({ block: 'center' })` — a
  // narrower band would miss that target whenever the element sat
  // exactly at viewport centre. This is the `rootMargin` scroll-spy
  // variant — the spec drops the redundant `threshold:0.5` variant.
  var TOC_ROOT_MARGIN = '-40% 0px -40% 0px';

  // Headings the TOC tracks by default. Overridable per-page with a
  // `data-la-toc-headings` attribute on the `.la-toc` element.
  var TOC_DEFAULT_HEADINGS = 'h2, h3';

  // ── Small DOM / string helpers ─────────────────────────────────────

  // Slugify a heading's text into an id-safe token: lowercase, collapse
  // every run of non-alphanumeric characters to a single dash, trim
  // leading/trailing dashes. An empty result (heading was all symbols)
  // falls back to 'section' so the caller's de-dupe counter still
  // produces a unique, valid id.
  function slugify(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    s = s.replace(/[^a-z0-9]+/g, '-');
    s = s.replace(/^-+/, '').replace(/-+$/, '');
    return s || 'section';
  }

  // True when the element (or the active element) is a text-entry
  // surface — used to suppress the Ctrl+B shortcut while the user is
  // typing, so it never steals a keystroke from an input.
  function isTextEntry(el) {
    if (!el) { return false; }
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return true;
    }
    return !!el.isContentEditable;
  }

  // The numeric heading depth (2 for <h2>, 3 for <h3>, …). Anything that
  // is not an h1-h6 returns 0 — such an element is not a TOC target.
  function headingDepth(el) {
    if (!el || !el.tagName) { return 0; }
    var m = /^h([1-6])$/.exec(el.tagName.toLowerCase());
    return m ? parseInt(m[1], 10) : 0;
  }

  // ── Group 5 — scroll-spy table of contents ─────────────────────────
  //
  // For each `.la-toc` on the page: collect its heading targets, ensure
  // every one has a stable id, build the `<ol>` list (UNLESS an author
  // pre-filled it — a static TOC is respected for the JS-off case), and
  // wire an IntersectionObserver that re-highlights the active link as
  // the page scrolls. The observer fires REPEATEDLY (links must
  // re-activate when scrolling back up) — this is deliberately a
  // different observer from a fire-once scroll-reveal.
  //
  // Returns the IntersectionObserver created for the LAST `.la-toc`
  // processed (or null when none / unsupported) so a test can inspect
  // and a future caller can disconnect it.
  function initTOC(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) { return null; }

    var tocs = doc.querySelectorAll('.la-toc');
    var lastObserver = null;
    var t;
    for (t = 0; t < tocs.length; t++) {
      lastObserver = wireOneToc(doc, tocs[t]) || lastObserver;
    }
    return lastObserver;
  }

  // Wire a single `.la-toc`. Pulled out of initTOC so the per-TOC logic
  // is testable in isolation and the loop above stays flat.
  function wireOneToc(doc, toc) {
    var list = toc.querySelector('.la-toc__list');
    if (!list) {
      // Malformed scaffold — fail loud, skip this one feature.
      logError('.la-toc is missing its .la-toc__list — TOC skipped');
      return null;
    }

    // Heading selector: per-TOC override via data-la-toc-headings,
    // else the module default.
    var sel = toc.getAttribute('data-la-toc-headings') || TOC_DEFAULT_HEADINGS;
    var headings = collectHeadings(doc, sel);
    if (headings.length === 0) {
      // No headings to track — not an error (a short page may have
      // none). Nothing to build, nothing to observe.
      return null;
    }

    // Respect an author-supplied static TOC: only build the list when
    // the author left the <ol> empty. Either way the live highlight is
    // still wired below.
    if (!hasElementChild(list)) {
      buildTocList(doc, list, headings);
    }

    return observeHeadings(toc, headings);
  }

  // Collect the heading elements matching `sel`, in document order, and
  // ensure each one carries a unique id (generating a slug-based id for
  // any heading the author left un-IDed). Headings that resolve to
  // depth 0 (somehow not an h1-h6) are dropped.
  function collectHeadings(doc, sel) {
    var nodes = doc.querySelectorAll(sel);
    var out = [];
    var used = {};
    var i;

    // Seed the used-id set with ids ALREADY on the page so a generated
    // slug never collides with an existing element id.
    var existing = doc.querySelectorAll('[id]');
    for (i = 0; i < existing.length; i++) {
      used[existing[i].id] = true;
    }

    for (i = 0; i < nodes.length; i++) {
      var h = nodes[i];
      if (headingDepth(h) === 0) { continue; }
      if (!h.id) {
        h.id = uniqueId(slugify(h.textContent), used);
      }
      used[h.id] = true;
      out.push(h);
    }
    return out;
  }

  // Produce an id from `base` that is not already a key of `used`,
  // appending `-2`, `-3`, … until it is unique. Does NOT mutate `used`
  // (the caller records the final id).
  function uniqueId(base, used) {
    if (!used[base]) { return base; }
    var n = 2;
    while (used[base + '-' + n]) { n++; }
    return base + '-' + n;
  }

  // Build the `<li><a>` items for `headings` and append them to `list`.
  // Each anchor carries `data-depth` so the CSS can indent nested h3s.
  function buildTocList(doc, list, headings) {
    var i;
    for (i = 0; i < headings.length; i++) {
      var h = headings[i];
      var li = doc.createElement('li');
      var a = doc.createElement('a');
      a.setAttribute('href', '#' + h.id);
      a.setAttribute('data-depth', String(headingDepth(h)));
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  // Wire the IntersectionObserver that toggles `.is-active` on the TOC
  // link of whichever heading is in the mid-viewport band. Returns the
  // observer (or null when IntersectionObserver is unavailable — an
  // ancient-browser degradation: the TOC is built but un-highlighted,
  // logged once, not treated as an error).
  //
  // The callback maintains a SET of currently-intersecting headings
  // (added on `isIntersecting:true`, removed on `isIntersecting:false`)
  // and after every batch picks ONE deterministic winner: the topmost
  // intersecting heading by viewport-y. This is more robust than the
  // naive "last entry wins" approach when multiple headings are in the
  // band simultaneously, when entries arrive in non-document order, or
  // when a single batch contains both leaving and arriving entries —
  // all failure modes that were observable in the previous
  // implementation. After the rAF frame settles, the set reflects the
  // true visibility state of every observed heading and the active
  // link is consistent.
  function observeHeadings(toc, headings) {
    if (typeof IntersectionObserver === 'undefined') {
      logError('IntersectionObserver unavailable — TOC built without live highlight');
      return null;
    }

    // Live set of headings currently intersecting the band, plus their
    // last-known boundingClientRect.top — the latter is the tiebreaker
    // when multiple headings sit in the band at once. Map kept around
    // entries by id (stable across batches) rather than by element ref
    // so a re-render that swaps in a fresh DOM node still cleanly
    // tracks the new heading instead of leaking the old one.
    var visible = {};

    var onIntersect = function (entries) {
      var j;
      for (j = 0; j < entries.length; j++) {
        var entry = entries[j];
        var id = entry.target.id;
        if (entry.isIntersecting) {
          visible[id] = entry.boundingClientRect.top;
        } else if (id in visible) {
          delete visible[id];
        }
      }
      pickActiveFromVisible(toc, visible);
    };

    var observer = new IntersectionObserver(onIntersect, {
      rootMargin: TOC_ROOT_MARGIN,
      threshold: 0
    });
    var i;
    for (i = 0; i < headings.length; i++) {
      observer.observe(headings[i]);
    }
    return observer;
  }

  // From the set of currently-visible heading ids (mapped to their last
  // known viewport top), pick the topmost one and mark its TOC link
  // `.is-active`. When `visible` is empty (no heading in the band) the
  // currently-active link is left untouched — scrolling between bands
  // should not blank the TOC, the user expects the last-known location
  // to remain highlighted.
  function pickActiveFromVisible(toc, visible) {
    var bestId = null;
    var bestTop = Infinity;
    var id;
    for (id in visible) {
      if (Object.prototype.hasOwnProperty.call(visible, id)) {
        if (visible[id] < bestTop) {
          bestTop = visible[id];
          bestId = id;
        }
      }
    }
    if (bestId !== null) {
      setActiveLink(toc, bestId);
    }
  }

  // Clear `.is-active` from every link in this `.la-toc`, then set it on
  // the link whose href points at `#id`. Scoped to the given `.la-toc`
  // so two TOCs on one page never fight over the active class.
  function setActiveLink(toc, id) {
    var links = toc.querySelectorAll('.la-toc a');
    var i;
    for (i = 0; i < links.length; i++) {
      links[i].classList.remove('is-active');
    }
    var active = toc.querySelector('.la-toc a[href="#' + cssEscapeId(id) + '"]');
    if (active) {
      active.classList.add('is-active');
    }
  }

  // ── Group 4 — sticky-header scroll state ───────────────────────────
  //
  // For every `.la-header` on the page, toggle `.is-scrolled` based on
  // whether a tiny `.la-header-sentinel` element placed BEFORE the
  // header is currently in the viewport. When the sentinel is visible
  // (page is at the top), `.is-scrolled` is removed; when the sentinel
  // scrolls out of view, `.is-scrolled` is added.
  //
  // Why an IntersectionObserver on a sentinel and NOT a scroll-event
  // listener: the scroll event coalesces with `scroll-behavior: smooth`
  // and with programmatic `window.scrollTo(…)` in surprising ways — in
  // particular a `scrollTo(0, 0)` issued from a test may fire only the
  // INTERMEDIATE scroll positions before the wait expires, leaving
  // `is-scrolled` stuck on. IntersectionObserver fires off the actual
  // visibility of the sentinel rather than off scroll-events, so the
  // class always matches the rendered state by the next animation frame.
  //
  // The sentinel is injected by the module (zero fixture coupling) and
  // is a single `1px` block with `aria-hidden="true"` and
  // `pointer-events:none` so it is invisible and inert to the user.
  //
  // Returns the IntersectionObserver created for the LAST `.la-header`
  // (or null when there is no `.la-header` / IntersectionObserver is
  // unavailable) so a test can inspect and a future caller can
  // disconnect it.
  function initStickyHeader(win, doc) {
    win = win || (typeof window !== 'undefined' ? window : null);
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!win || !doc) { return null; }

    var headers = doc.querySelectorAll('.la-header');
    if (headers.length === 0) { return null; }

    if (typeof win.IntersectionObserver === 'undefined') {
      logError('IntersectionObserver unavailable — sticky-header scroll state will not toggle');
      return null;
    }

    var lastObserver = null;
    var i;
    for (i = 0; i < headers.length; i++) {
      lastObserver = wireHeaderSentinel(doc, headers[i]) || lastObserver;
    }
    return lastObserver;
  }

  // Wire one `.la-header` with its sentinel. Inject (or reuse) a
  // `.la-header-sentinel` immediately before the header in the DOM, then
  // observe it. When the sentinel is intersecting the viewport, the
  // header is at-top (no `.is-scrolled`); when it leaves, scrolled.
  function wireHeaderSentinel(doc, header) {
    var sentinel = header.previousElementSibling;
    if (!sentinel || !sentinel.classList ||
        !sentinel.classList.contains('la-header-sentinel')) {
      sentinel = doc.createElement('div');
      sentinel.className = 'la-header-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      // Inert + invisible. The CSS file also declares these for
      // belt-and-braces, but in-line style guarantees correctness even
      // if the CSS hasn't loaded yet (sentinel must measure 0 height in
      // layout — a taller sentinel would shift the page chrome by a
      // pixel each boot).
      sentinel.style.cssText =
        'display:block;block-size:1px;inline-size:1px;' +
        'position:absolute;inset-block-start:0;inset-inline-start:0;' +
        'pointer-events:none;visibility:hidden;';
      // The sentinel must live in the SAME stacking/scroll context as
      // the header — insert just before it so a sticky header still
      // sticks correctly (the sentinel is below the header in document
      // order and scrolls past the viewport top first).
      if (header.parentNode) {
        header.parentNode.insertBefore(sentinel, header);
      } else {
        // Header somehow detached — fail loud, skip wiring.
        logError('.la-header has no parent — sticky scroll state skipped');
        return null;
      }
    }

    var sync = function (entries) {
      var j;
      for (j = 0; j < entries.length; j++) {
        // sentinel intersecting → at top → remove .is-scrolled
        // sentinel NOT intersecting → scrolled past top → add .is-scrolled
        header.classList.toggle('is-scrolled', !entries[j].isIntersecting);
      }
    };

    var observer = new IntersectionObserver(sync, {
      // No rootMargin — the 1px-tall sentinel scrolls out of the viewport
      // on any positive scroll, so the IO callback fires the moment the
      // header should grow its hairline border.
      threshold: 0
    });
    observer.observe(sentinel);
    return observer;
  }

  // ── Group 2c — IDE sidebar collapse ────────────────────────────────
  //
  // Every `[data-la-toggle]` button targets a layout element by its
  // `data-ve-id`. Clicking the button flips that element's
  // `data-la-sidebar` between `open` and `closed` and mirrors the new
  // state onto the button's `aria-expanded`. An optional global Ctrl+B
  // toggles the FIRST such button (gated so it never fires while the
  // user is typing in an input).
  //
  // This is the spec's documented temporary local toggle — when the
  // `interactive-control` technique ships its `data-id` localStorage
  // toggle helper, this delegates to it (derived task in the spec) so
  // the collapsed/open state persists across reloads.
  //
  // Returns the count of toggle buttons that were wired.
  function initSidebarToggle(win, doc) {
    win = win || (typeof window !== 'undefined' ? window : null);
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) { return 0; }

    var buttons = doc.querySelectorAll('[data-la-toggle]');
    if (buttons.length === 0) { return 0; }

    var i;
    for (i = 0; i < buttons.length; i++) {
      wireToggleButton(doc, buttons[i]);
    }

    // Global Ctrl+B → toggle the first sidebar. Skipped while a text
    // entry is focused so it never eats a keystroke.
    if (win) {
      win.addEventListener('keydown', function (ev) {
        var key = ev.key;
        var isB = key === 'b' || key === 'B';
        if (!isB || !ev.ctrlKey || ev.metaKey || ev.altKey) { return; }
        var focused = doc.activeElement;
        if (isTextEntry(focused)) { return; }
        ev.preventDefault();
        toggleSidebar(doc, buttons[0]);
      });
    }
    return buttons.length;
  }

  // Attach the click handler for one toggle button.
  function wireToggleButton(doc, btn) {
    btn.addEventListener('click', function () {
      toggleSidebar(doc, btn);
    });
  }

  // Flip the `data-la-sidebar` state of `btn`'s target and mirror
  // `aria-expanded`. The target is resolved by matching the button's
  // `data-la-toggle` value against an element's `data-ve-id`.
  function toggleSidebar(doc, btn) {
    if (!btn) { return; }
    var targetId = btn.getAttribute('data-la-toggle');
    if (!targetId) {
      logError('[data-la-toggle] button has an empty target id — ignored');
      return;
    }
    var target = doc.querySelector('[data-ve-id="' + cssEscapeId(targetId) + '"]');
    if (!target) {
      logError('[data-la-toggle] target "' + targetId + '" not found — ignored');
      return;
    }
    var current = target.getAttribute('data-la-sidebar');
    var next = current === 'closed' ? 'open' : 'closed';
    target.setAttribute('data-la-sidebar', next);
    btn.setAttribute('aria-expanded', next === 'open' ? 'true' : 'false');
  }

  // ── Shared low-level helpers ───────────────────────────────────────

  // True when `el` has at least one ELEMENT child (text nodes ignored).
  // Used to decide whether an author pre-filled a TOC `<ol>`.
  function hasElementChild(el) {
    if (!el) { return false; }
    if (typeof el.childElementCount === 'number') {
      return el.childElementCount > 0;
    }
    // Fallback for environments without childElementCount.
    var n = el.firstChild;
    while (n) {
      if (n.nodeType === 1) { return true; }
      n = n.nextSibling;
    }
    return false;
  }

  // Minimal id escaper for use inside an attribute selector. Heading ids
  // produced by slugify() are already `[a-z0-9-]+`, but an
  // author-supplied id could contain a quote or backslash; escape those
  // so the selector string cannot break out. This is intentionally
  // narrow (not a full CSS.escape) — it only needs to neutralise the
  // two characters that would terminate the `[href="…"]` literal.
  function cssEscapeId(id) {
    return String(id == null ? '' : id)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
  }

  // Single funnel for the module's error reporting — every fail-fast
  // path goes through here so the prefix is consistent and a test can
  // spy one function. Never throws; a layout glitch must not abort the
  // page.
  function logError(msg) {
    if (typeof console !== 'undefined' && console && typeof console.error === 'function') {
      console.error('amvcp-layout: ' + msg);
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────
  //
  // Initialise all three behaviours. Each init is independent and
  // self-guards on the absence of its scaffold, so calling boot() on a
  // page that uses only one layout group is safe and cheap.
  function boot() {
    initTOC();
    initStickyHeader();
    initSidebarToggle();
  }

  // ── Public API + dual export ───────────────────────────────────────

  var api = {
    initTOC: initTOC,
    initStickyHeader: initStickyHeader,
    initSidebarToggle: initSidebarToggle,
    boot: boot,
    // Exposed for unit tests — small pure helpers with no DOM need.
    slugify: slugify,
    headingDepth: headingDepth,
    uniqueId: uniqueId
  };

  if (typeof window !== 'undefined') {
    window.amvcpLayout = api;
    // Self-boot on DOMContentLoaded, mirroring amvcp-runtime.js. If the
    // document has already finished parsing (script loaded late), boot
    // immediately.
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
