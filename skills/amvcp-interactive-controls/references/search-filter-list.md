# Search-filter list — incremental text filter

A search input at the top of a list; typing filters the rows in
real time. Pure CSS or pure-JS, depending on whether persistence
and highlighted-match are required. The Cmd+K / "/" shortcut from
`references/keyboard-shortcuts.md` ties in cleanly.

## What it is

For any list with >20 rows, a search filter beats scroll-and-scan.
This pattern offers two modes:

- **CSS-only** — a hidden `<input>` text serves as the filter; CSS
  attribute selectors hide rows whose data attribute doesn't match.
  Limited to exact-prefix matching, but works with JS off.
- **JS-enhanced** — substring / fuzzy match, highlight the matched
  characters, "X of N" counter, debounce, ESC to clear.

## Scaffold

```html
<div class="ic-searchlist" data-ic-searchlist data-id="findings-search">
  <label class="ic-searchlist-label" for="ic-search-1">
    Filter findings
  </label>
  <input class="ic-searchlist-input" type="search"
         id="ic-search-1" placeholder="Type to filter…"
         data-ic-searchlist-input>
  <span class="ic-searchlist-counter">
    <span data-ic-searchlist-shown>0</span>
    /
    <span data-ic-searchlist-total>0</span>
  </span>
  <ul class="ic-searchlist-list" data-ic-searchlist-list>
    <li class="ic-searchlist-row" data-ic-search="auth login token">
      <strong>Auth bypass via dangling token</strong>
      <p>The session token is not invalidated …</p>
    </li>
    <li class="ic-searchlist-row" data-ic-search="cache invalidation race">
      <strong>Cache invalidation race</strong>
      <p>Two writers concurrently updating …</p>
    </li>
  </ul>
  <p class="ic-searchlist-empty" data-ic-searchlist-empty hidden>
    No matches.
  </p>
</div>
```

The `data-ic-search` attribute on each row is the search corpus
(lowercase, space-separated, includes synonyms). Authoring it
explicitly beats searching the full DOM text — the author controls
what counts as a match.

CSS:

```css
.ic-searchlist {
  margin: var(--vc-space-3, 16px) 0;
}
.ic-searchlist-input {
  width: 100%;
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--ve-control-bg, #ffffff);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.4
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg, #14110b);
}
.ic-searchlist-input:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
.ic-searchlist-counter {
  display: inline-block;
  margin: var(--vc-space-1, 8px) 0;
  padding: 0 var(--vc-space-1, 8px);
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 8%, transparent);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.4
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg-dim, #5b5343);
  font-variant-numeric: tabular-nums;
}
.ic-searchlist-row { /* normal row styles */ }
.ic-searchlist-row.is-hidden { display: none; }
.ic-searchlist-row mark {
  background: color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 32%, transparent);
  color: inherit;
  border-radius: 2px;
  padding: 0 2px;
}
```

## JS engine

```js
function initSearchList(rootEl) {
  var input  = rootEl.querySelector('[data-ic-searchlist-input]');
  var listEl = rootEl.querySelector('[data-ic-searchlist-list]');
  var emptyEl = rootEl.querySelector('[data-ic-searchlist-empty]');
  var shownEl = rootEl.querySelector('[data-ic-searchlist-shown]');
  var totalEl = rootEl.querySelector('[data-ic-searchlist-total]');
  if (!input || !listEl) { return; }

  var rows = Array.from(listEl.querySelectorAll('.ic-searchlist-row'));
  if (totalEl) { totalEl.textContent = String(rows.length); }

  // Cache the original strong-titles so we can re-render <mark> spans.
  rows.forEach(function (r) {
    var strong = r.querySelector('strong');
    if (strong && !strong.hasAttribute('data-ic-original')) {
      strong.setAttribute('data-ic-original', strong.textContent);
    }
  });

  function highlight(strong, q) {
    var orig = strong.getAttribute('data-ic-original') || strong.textContent;
    if (!q) { strong.textContent = orig; return; }
    var lower = orig.toLowerCase();
    var i = lower.indexOf(q);
    strong.textContent = '';
    if (i === -1) { strong.textContent = orig; return; }
    strong.appendChild(document.createTextNode(orig.slice(0, i)));
    var mark = document.createElement('mark');
    mark.textContent = orig.slice(i, i + q.length);
    strong.appendChild(mark);
    strong.appendChild(document.createTextNode(orig.slice(i + q.length)));
  }

  function apply() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var hay = (r.getAttribute('data-ic-search') || '').toLowerCase();
      var on = !q || hay.indexOf(q) !== -1;
      r.classList.toggle('is-hidden', !on);
      if (on) {
        shown++;
        var strong = r.querySelector('strong');
        if (strong) { highlight(strong, q); }
      }
    });
    if (shownEl) { shownEl.textContent = String(shown); }
    if (emptyEl) {
      if (shown === 0) { emptyEl.removeAttribute('hidden'); }
      else             { emptyEl.setAttribute('hidden', ''); }
    }
    rootEl.dispatchEvent(new CustomEvent('ic:search-change', {
      bubbles: true,
      detail: { searchId: rootEl.getAttribute('data-id'), q: q, shown: shown }
    }));
  }

  // Debounce — wait 80 ms between keystrokes before filtering.
  var t = null;
  input.addEventListener('input', function () {
    if (t) { clearTimeout(t); }
    t = setTimeout(apply, 80);
  });
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && input.value) {
      input.value = '';
      apply();
      ev.preventDefault();
    }
  });
  apply();
}
document.querySelectorAll('[data-ic-searchlist]').forEach(initSearchList);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` | input background |
| `--ve-control-border` | input border |
| `--vc-color-accent` | focus ring + `<mark>` tint |
| `--ve-control-mono` | counter font |
| `--ve-control-fg-dim` | counter text |
| `--vc-radius-md` | input rounding |
| `--vc-radius-full` | counter pill |

The `<input type="search">` gets a native "✕" clear button in
Chromium/Safari — keep it. Don't write a custom clear button.

## Selection / comment / decision-mini

- **Each row IS a selectable atom** so the reader can comment on
  a finding directly.
- **The search input is NOT an atom** — it's a verb.
- **Decision-mini.** Per-row Skip / Approve / Deny.

## JS-off degradation

**List shows; search does not filter.** With JS off:

- The search input is functional (the user types into it) but the
  rows do not hide.
- The counter stays at `0 / N` (the JS would have updated it).
- The empty state never appears.

Mitigation: the JS-off audience sees the full list, which is the
worst-case but still useful. For a critical JS-off context,
fall back to a small `<select>` of categories above the list — the
browser handles `<select>` natively and the form-inline `oninput`
can drive an `<output>` even without JS scripting.

For a 100% CSS-only version with limited match capability:

```html
<input type="text" id="q" oninput="
  document.querySelectorAll('.ic-searchlist-row').forEach(r => {
    r.classList.toggle('is-hidden',
      r.getAttribute('data-ic-search').indexOf(this.value.toLowerCase()) === -1);
  });
">
```

That uses an inline event handler (often CSP-blocked) but is one
line of code and works without an external script.

## Anti-patterns

- Filtering on `innerText` of the row. Slow (forces layout) and
  matches whatever the user can see — including dim hints and
  date stamps. The `data-ic-search` corpus is the right contract.
- No debounce. Holding a key fires `input` per keystroke; without
  debounce the page flakes on long lists.
- Hiding rows with `display: none` AND keeping their DOM. For
  thousands of rows pair with the virtualized-list pattern
  (`references/virtualized-list.md`) so hidden rows aren't even
  rendered.
- Forgetting to escape `<mark>` boundaries on multi-byte
  substrings (Unicode emoji). The above slices on UTF-16 code
  units — safe for ASCII, may split a surrogate pair for some
  emoji. For internationalised reports, slice on grapheme clusters
  via `Intl.Segmenter`.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Type "auth" — only matching rows visible; counter reads 1 / 2.
const input = document.querySelector('[data-ic-searchlist-input]');
input.value = 'auth';
input.dispatchEvent(new Event('input', { bubbles: true }));
await new Promise(r => setTimeout(r, 120));   // wait for debounce
const visibleRows = document.querySelectorAll('.ic-searchlist-row:not(.is-hidden)');
console.assert(visibleRows.length === 1);
console.assert(document.querySelector('[data-ic-searchlist-shown]').textContent === '1');
console.assert(document.querySelector('mark').textContent === 'auth');

// ESC clears.
await page.keyboard.press('Escape');
console.assert(input.value === '');
```

Screenshot both themes with: empty filter, partial filter (matches +
highlight), and no-match (empty state). Verify `<mark>` tint reads
in both themes.
