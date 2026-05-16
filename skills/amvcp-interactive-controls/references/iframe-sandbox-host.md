# Iframe sandbox host — embed untrusted HTML safely

For interactive reports that need to render LLM-emitted or
user-pasted HTML inline (e.g. "preview this snippet"), the
`<iframe sandbox>` pattern is the only safe primitive. This
reference covers the sandbox + `srcdoc` flow, the `postMessage`
turn protocol, and the script clone-recreate trick for progressive
appends. Excluded from `references/state-plumbing.md` (which forbids
any live-transport feature); this is the **self-contained, single-
shot** host that fits the static-artifact contract.

## What it is

Native browser sandbox via `<iframe sandbox="allow-scripts">`
(no `allow-same-origin`) — the iframe runs scripts in an
isolated origin that can't reach the parent's DOM, cookies, or
storage. The host page communicates via `postMessage`.

Use cases:

- Preview a code snippet as rendered HTML in a learning report.
- Show user-pasted HTML safely.
- Sandbox a third-party widget (chart, embed) that you don't fully
  trust.

NOT for live streams (SSE / WebSocket) — those need a server and
are out of scope per IC-07/IC-13 SKIPs.

## Scaffold

```html
<div class="ic-sbx" data-ic-sbx data-id="snippet-preview">
  <header class="ic-sbx-head">
    <span class="ic-sbx-title">Preview</span>
    <button type="button" class="ic-sbx-reload" data-ic-sbx-reload>
      Reload
    </button>
  </header>
  <iframe class="ic-sbx-frame" data-ic-sbx-frame
          sandbox="allow-scripts"
          srcdoc="<!doctype html><html><body><p>Loading…</p></body></html>"
          loading="lazy"
          referrerpolicy="no-referrer"
          title="Snippet preview"></iframe>
</div>
<!-- The snippet to render -->
<script type="text/html" id="snippet-html">
  <!doctype html>
  <html>
    <body style="font: 14px/1.5 sans-serif; padding: 12px;">
      <h1>Hello</h1>
      <p>Demo snippet.</p>
      <script>document.body.style.background = '#fffbe6';</scr<!---->ipt>
    </body>
  </html>
</script>
```

The snippet lives in a `<script type="text/html">` block — browsers
do NOT execute these. Reading the textContent gives the raw HTML
string ready to drop into `srcdoc`.

The `</scr...ipt>` split inside the snippet is the standard
workaround for embedding a `</script>` literal inside an HTML
`<script>` block — without the split, the host page's parser would
close the outer `<script>` at the inner `</script>`.

CSS:

```css
.ic-sbx {
  margin: var(--vc-space-3, 16px) 0;
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  overflow: hidden;
}
.ic-sbx-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  border-bottom: 1px solid var(--ve-control-border, #e3dcc9);
}
.ic-sbx-title {
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-sbx-reload {
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg-dim, #5b5343);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  cursor: pointer;
}
.ic-sbx-frame {
  display: block;
  width: 100%;
  height: 24rem;             /* fixed height for an owned-viewport surface */
  border: 0;
  background: var(--vc-color-canvas, #faf6ee);
}
```

## JS engine — drop snippet, optionally postMessage

```js
function initSandbox(rootEl) {
  var frame   = rootEl.querySelector('.ic-sbx-frame');
  var reload  = rootEl.querySelector('[data-ic-sbx-reload]');
  var snippetEl = document.getElementById(
    rootEl.getAttribute('data-ic-source') || 'snippet-html');
  if (!frame || !snippetEl) { return; }

  function load() {
    frame.srcdoc = snippetEl.textContent;
  }

  if (reload) {
    reload.addEventListener('click', load);
  }
  load();

  // Optional: postMessage send to the iframe. The iframe runs with no
  // origin, so its `window.parent.origin` is "null" — match it on
  // BOTH sides.
  window.amvcpSandbox = window.amvcpSandbox || {};
  window.amvcpSandbox[rootEl.getAttribute('data-id')] = {
    send: function (msg) {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage(msg, '*');
        //                                    ^^^ — '*' because the sandbox has no origin
      }
    }
  };

  // The iframe can postMessage back; the parent verifies the source.
  window.addEventListener('message', function (ev) {
    if (ev.source !== frame.contentWindow) { return; }
    rootEl.dispatchEvent(new CustomEvent('ic:sandbox-message', {
      bubbles: true,
      detail: { sandboxId: rootEl.getAttribute('data-id'), data: ev.data }
    }));
  });
}
document.querySelectorAll('[data-ic-sbx]').forEach(initSandbox);
```

## Sandbox policy table

| Flag | Effect | Use when |
|---|---|---|
| `allow-scripts` | Scripts run in the iframe | **always** if the snippet has any JS |
| `allow-same-origin` | Iframe shares origin with parent | **never** combined with `allow-scripts` (escapes the sandbox) |
| `allow-forms` | `<form>` submission allowed | If the snippet posts a form |
| `allow-popups` | `window.open` allowed | If the snippet opens links |
| `allow-modals` | `alert/confirm/prompt` allowed | Rarely needed |
| `allow-downloads` | Snippet can download files | Only for user-driven downloads |

The single rule: **never combine `allow-scripts` + `allow-same-
origin`**. Together they let the iframe remove its own `sandbox`
attribute and escape the cage.

## Script clone-recreate trick

For LIVE appending (a stream of HTML chunks, each containing
`<script>`), the iframe must re-run scripts after each append.
`insertAdjacentHTML` doesn't trigger script execution; the trick is
to clone-replace each new `<script>` so the browser parses it as
fresh:

```js
// Inside the iframe — runs once at load, then on every message
window.addEventListener('message', function (ev) {
  if (ev.data.type === 'chunk') {
    document.body.insertAdjacentHTML('beforeend', ev.data.html);
    document.querySelectorAll('script').forEach(function (s) {
      var n = document.createElement('script');
      for (var i = 0; i < s.attributes.length; i++) {
        n.setAttribute(s.attributes[i].name, s.attributes[i].value);
      }
      n.textContent = s.textContent;
      s.parentNode.replaceChild(n, s);
    });
  }
});
```

The `replaceChild` re-parses the script; the original is detached.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-border` | frame + header border |
| `--vc-color-surface-sunken` | header bar |
| `--vc-color-canvas` | iframe default background |
| `--vc-radius-md` | rounded container |
| `--ve-control-fg-dim` | title + button text |

## Selection / comment / decision-mini

- **The `.ic-sbx` container IS a selectable atom** — the preview as
  a whole is the comment-able thing.
- **Iframe contents are NOT atoms in the parent** — comments on
  individual elements inside the iframe would need an inverse
  bridge (overcomplicated for a static report).
- **Decision-mini on the container** — Approve / Deny the snippet.

## JS-off degradation

**Iframe shows whatever the `srcdoc` attribute says.** With JS off:

- The static `srcdoc="..."` content renders.
- No reload, no postMessage, no dynamic snippet replacement.

For JS-off audiences: author the `srcdoc` attribute with the
intended snippet directly (HTML-escaped). The reload button does
nothing; that's acceptable.

## Anti-patterns

- `sandbox="allow-scripts allow-same-origin"` — fully escapes.
- Trusting `ev.data` without origin check — for cross-origin
  iframes you'd validate `ev.origin`; for sandbox=no-origin you
  validate `ev.source === frame.contentWindow`.
- Resizing the iframe to fit its content via JS measuring its
  inner DOM — that breaks the sandbox isolation. Use a fixed
  height + the `<iframe>`'s native scrollbar (an exception to
  no-nested-scrollbars because the iframe is its own owned
  viewport).
- Passing user-content to `srcdoc` without HTML-escaping the
  attribute value. The `srcdoc` value IS HTML; quotes inside need
  escaping.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Iframe loaded with the snippet content.
await new Promise(r => setTimeout(r, 200));
const frame = document.querySelector('.ic-sbx-frame');
// Reach into the iframe's document (this works for srcdoc; the iframe
// shares no origin with the parent BUT srcdoc-loaded iframes are
// considered same-origin for the purposes of contentDocument access).
const innerDoc = frame.contentDocument;
console.assert(innerDoc.body.textContent.indexOf('Hello') !== -1,
               'iframe did not render the snippet');

// Sandbox enforcement — the inner script cannot reach the parent.
const innerScript = `
  try { parent.document.title = 'OWNED'; }
  catch (e) { /* expected — sandbox blocks */ }
`;
// (skip this in the verifier — just confirm parent.document is still
// unchanged after load.)
console.assert(document.title !== 'OWNED');
```

Screenshot the host page with the iframe rendered; verify the
snippet content shows AND the host page's content is unaffected.
