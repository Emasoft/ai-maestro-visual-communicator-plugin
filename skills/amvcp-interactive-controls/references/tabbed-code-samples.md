# Tabbed code samples — N perspectives on one change

The 6-line tab pattern from feature explainers: show "the same thing
from N angles" without N separate code panels. Use cases: `config.yaml`
/ `server.ts` / `client.curl`; before / after; Python / TypeScript /
Rust; SQL / Prisma / raw query.

## What it is

`references/panels-disclosure.md` covers full tab containers with
ARIA roles, persistence, and per-tab textarea drafts. Tabbed code
samples are the **minimal** sibling: each tab is a `<pre>`, the
tabbar is `<button>`s, the active panel has `.on`. Trades
persistence and roving-tabindex for a 6-line handler.

## Scaffold

```html
<div class="ic-codetabs" data-ic-codetabs data-id="rate-limit-config">
  <div class="ic-codetabs-bar" role="tablist" aria-label="View">
    <button class="ic-codetabs-tab on" type="button"
            role="tab" aria-selected="true"  data-ic-t="0">limits.yaml</button>
    <button class="ic-codetabs-tab"    type="button"
            role="tab" aria-selected="false" data-ic-t="1">server.ts</button>
    <button class="ic-codetabs-tab"    type="button"
            role="tab" aria-selected="false" data-ic-t="2">curl</button>
  </div>
  <pre class="ic-codetabs-panel on" role="tabpanel" data-ic-p="0">
<code>buckets:
  - key: "ip"
    rate: 100/min
    burst: 20</code></pre>
  <pre class="ic-codetabs-panel"    role="tabpanel" data-ic-p="1">
<code>const limiter = new RateLimiter({ rate: 100 / 60, burst: 20 });
app.use('/api', limiter.middleware);</code></pre>
  <pre class="ic-codetabs-panel"    role="tabpanel" data-ic-p="2">
<code>curl -i https://api.example.com/v1/echo
# HTTP/2 429
# x-ratelimit-remaining: 0
# retry-after: 47</code></pre>
</div>
```

CSS:

```css
.ic-codetabs {
  margin: var(--vc-space-3, 16px) 0;
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  overflow: hidden;   /* NOT overflow:auto — only clips the rounded corners */
}
.ic-codetabs-bar {
  display: flex;
  gap: 0;
  background: var(--ve-control-bg, #ffffff);
  border-bottom: 1px solid var(--ve-control-border, #e3dcc9);
}
.ic-codetabs-tab {
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  border: none;
  background: transparent;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-codetabs-tab.on {
  color: var(--ve-control-fg, #14110b);
  border-bottom-color: var(--vc-color-accent, #b8861f);
  background: var(--vc-color-surface-sunken, #f1ece0);
}
.ic-codetabs-tab:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: -2px;
}
.ic-codetabs-panel {
  display: none;
  margin: 0;
  padding: var(--vc-space-3, 16px);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.5
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
  white-space: pre;          /* let the page expand if a line wraps */
}
.ic-codetabs-panel.on { display: block; }
```

The `overflow: hidden` is ONLY for the rounded corner clip on the
tabbar+panel composite; it never introduces an inner scroller
because the `<pre>` keeps `white-space: pre` and the page widens
naturally (no-nested-scrollbars).

## JS layer — 6 lines

```js
document.querySelectorAll('.ic-codetabs').forEach(function (root) {
  root.querySelectorAll('.ic-codetabs-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var k = t.getAttribute('data-ic-t');
      root.querySelectorAll('.ic-codetabs-tab').forEach(function (x) {
        var on = x.getAttribute('data-ic-t') === k;
        x.classList.toggle('on', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('.ic-codetabs-panel').forEach(function (p) {
        p.classList.toggle('on', p.getAttribute('data-ic-p') === k);
      });
    });
  });
});
```

For arrow-key navigation between tabs, see `references/panels-disclosure.md`'s
ARIA layer — apply the same roving-tabindex helper.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` | tabbar background |
| `--vc-color-surface-sunken` | active panel background |
| `--ve-control-border` | tabbar bottom border |
| `--vc-color-accent` | active-tab underline |
| `--ve-control-fg-dim` | inactive tab |
| `--ve-control-fg` | active tab + code text |
| `--ve-control-mono` | code + tab font |

Tabs use a mono font (matching the code panels they tab over) to
visually signal "these are file labels, not menu items".

## Selection / comment / decision-mini

- **Each `<pre class="ic-codetabs-panel">` is a selectable atom** so
  a reviewer can comment on "the yaml version" separately from "the
  TS version".
- **The tabbar itself** is not a selectable atom; tabs are
  navigation, not content.
- **Decision-mini.** A code-tab group is binary: Approve / Deny
  the change set. Attach to the `.ic-codetabs` root, not per-tab.

## JS-off degradation

**Lose tab switching; gain a stacked view.** With JS off:

- The active panel is the first one (`<pre class="ic-codetabs-panel on">`).
- Other panels stay `display: none` because the CSS hides them.

This is the wrong default — the reader sees only the first sample.
Fix: add a `<noscript>` block of `<style>` that unhides every panel
and gives each a heading derived from the tab label:

```html
<noscript>
  <style>
    .ic-codetabs-panel { display: block; }
    .ic-codetabs-bar { display: none; }
    .ic-codetabs-panel::before {
      content: attr(data-ic-p-label);
      display: block;
      font: 700 var(--vc-text-0, 12px)/1.2 var(--ve-control-font, inherit);
      color: var(--ve-control-fg-dim, #5b5343);
      text-transform: uppercase;
      padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px) 0;
    }
  </style>
</noscript>
```

…and author `data-ic-p-label="limits.yaml"` on each panel. With JS
off, every sample is visible stacked, each with its label header.
With JS on, the tabs win and the panels hide via `.ic-codetabs-panel`
default. This is the right fallback: more information, not less,
when the script doesn't run.

## Anti-patterns

- Using `<div>` instead of `<button>` for the tab — loses native
  focusability + keyboard activation + AT click handling.
- Forgetting `aria-selected` on the active tab — AT users can't
  tell which is selected.
- Using `<pre>` with `white-space: pre-wrap` AND `overflow-x: auto`
  to "make wide code wrap or scroll". Violates
  `no-nested-scrollbars` — keep `white-space: pre` and let the
  page widen.
- Hiding the tab labels behind icons only — non-mono icons in a
  mono-tabbar reads as decoration, not a label. Stick to text.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Click the 2nd tab — first panel hides, second panel shows.
const tabs = document.querySelectorAll('.ic-codetabs-tab');
tabs[1].click();
const panels = document.querySelectorAll('.ic-codetabs-panel');
console.assert(panels[0].classList.contains('on') === false);
console.assert(panels[1].classList.contains('on') === true);
console.assert(tabs[1].getAttribute('aria-selected') === 'true');

// JS-off baseline test (run with the JS handler unregistered):
// All panels should be visible, tab bar hidden — verify by removing
// the handler and checking the <noscript> styles activate.
```

Capture light + dark theme screenshots with each tab active in
turn; verify the active-tab underline + active-panel background
distinguish the active panel from its neighbours.
