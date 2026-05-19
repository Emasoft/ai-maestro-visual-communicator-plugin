# Sub-technique A8 — The source-fidelity integrity probe

## Table of Contents

- [A8.1 What it does](#a81-what-it-does)
- [A8.2 Why this exists](#a82-why-this-exists)
- [A8.3 The two probe implementations](#a83-the-two-probe-implementations)
- [A8.4 The call sites](#a84-the-call-sites)
- [A8.5 The failure-mode catalog (what the probe catches)](#a85-the-failure-mode-catalog-what-the-probe-catches)
- [A8.6 What the probe does NOT catch](#a86-what-the-probe-does-not-catch)
- [A8.7 The cascade — probe is the LAST line of defence](#a87-the-cascade--probe-is-the-last-line-of-defence)
- [A8.8 Performance](#a88-performance)
- [A8.9 What an author can do (basically nothing)](#a89-what-an-author-can-do-basically-nothing)
- [A8.10 The test contract](#a810-the-test-contract)
- [A8.11 No tokens consumed](#a811-no-tokens-consumed)

The non-negotiable contract: every highlighted line's rendered HTML
MUST decode back to a byte-exact copy of the source line, or the
highlight is discarded and plain text is returned. This reference
catalogs the probe's machinery and the failure modes it catches.

Implements the source-fidelity contract documented in
`scripts/amvcp-code-highlight.js` (see the module's "Fail-fast /
source-fidelity contract" header — NON-NEGOTIABLE).

## A8.1 What it does

After `highlightLineInternal(src, langDesc, carry)` returns the
rendered token-span HTML, the probe:

1. Strips all HTML tags from the rendered string.
2. Decodes the three entities the escaper produces (`&lt;`, `&gt;`,
   `&amp;`).
3. Asserts the result byte-matches the original source line.

If the byte-match fails, the highlight is DISCARDED. `escapeHtml(src)`
— the plain but byte-correct line — is returned.

## A8.2 Why this exists

Highlighting is **decorative**. Source fidelity is **mandatory**.

Three failure paths an unprotected tokenizer would introduce:
1. **Character loss.** A regex over-greedily consumes a character
   that should have stayed as code text. The user copies the block,
   the source they paste back differs from what they intended.
2. **Character corruption.** An escape mismatch encodes a character
   wrongly (a `<` rendered as the literal `<` of a span instead of
   `&lt;`). The DOM treats it as markup, the rendered text differs
   from the source.
3. **Character duplication.** A regex matches the same chunk twice
   (e.g. a keyword inside a string), produces two spans, and the
   restore pass renders both. Source has a duplicate character.

All three would break the copy button (the source IS what the user
gets when they copy). All three are caught by the probe.

## A8.3 The two probe implementations

The module is dual-export (browser + Node, see
[tokenizer-contract.md](./tokenizer-contract.md) §A1.3). The probe has
two paths:

```js
var hasDocument = (typeof document !== 'undefined' && document &&
                   typeof document.createElement === 'function');

function probeTextContent(html) {
  if (hasDocument) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent;
  }
  // Node fallback: drop tags, decode the 3 entities escapeHtml produces.
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
```

**Browser:** `innerHTML` + `textContent` round-trip through the actual
DOM. This is the gold standard — the same parser the user's browser
uses to render the block decodes the entities, so the probe asserts
exactly what the user will read.

**Node:** a deterministic string-replace fallback. Order matters —
`&amp;` is replaced LAST so `"&amp;lt;"` decodes to `"&lt;"` not
`"<"`. The fallback is used by the test harness (`tests/scripts/test-
designmd.js` and any pure-Node integration tests).

## A8.4 The call sites

`highlightLine`:

```js
function highlightLine(text, lang) {
  var src = (text == null) ? '' : String(text);
  var langId = normalizeLang(lang);
  if (!langId) return escapeHtml(src);
  var desc = LANGUAGES[langId];
  if (!desc) return escapeHtml(src);

  var rendered;
  try {
    rendered = highlightLineInternal(src, desc, null);
  } catch (e) {
    return escapeHtml(src);    // regex / table bug — degrade to plain
  }
  if (probeTextContent(rendered) !== src) {
    return escapeHtml(src);    // probe failed — degrade to plain
  }
  return rendered;
}
```

`highlightBlock` runs the probe per line:

```js
for (i = 0; i < arr.length; i++) {
  var src = (arr[i] == null) ? '' : String(arr[i]);
  var rendered;
  try {
    rendered = highlightLineInternal(src, desc, carry);
  } catch (e) {
    out.push(escapeHtml(src));   // line-local failure
    continue;
  }
  if (probeTextContent(rendered) !== src) {
    out.push(escapeHtml(src));   // line-local failure
    continue;
  }
  out.push(rendered);
}
```

A failed line still updates `carry` (the tokenizer ran) so multi-line
constructs (block comments, triple strings) stay consistent.

## A8.5 The failure-mode catalog (what the probe catches)

| Bug class | Example symptom | What the probe does |
|---|---|---|
| Regex over-match | `\w+` swallows trailing whitespace | Renders extra/missing space; probe fails; plain text wins |
| Anchor confusion | `wordRe`'s non-word anchor consumes a leading char | Source has `foo()`, render has `oo()` + `<span>f</span>`; probe fails |
| Escape ordering | `&` replaced last instead of first | `&lt;` becomes `&amp;lt;`; round-trip differs; probe fails |
| Stash-restore mis-index | Placeholder index off by one | Wrong stashed HTML expands; text content mismatches; probe fails |
| Infinite loop guard miss | Zero-length match in a `*` quantifier | The internal guard breaks the loop; result is a partial render; probe fails; plain text |
| Placeholder leak | The U+0001 / U+0002 control char escapes into output | DOM ignores them in text content; probe MIGHT pass (control chars round-trip cleanly) — defensive `stripControl` covers this |
| Token-span text wrong | `<span class="ve-tok-x">XX</span>` for source `X` | Probe immediately catches the doubled character |

The probe's role is **safety net**, not main code path. The tokenizer
is designed to never fail; the probe ensures that if it does, the
user is never the victim.

## A8.6 What the probe does NOT catch

| Edge case | Why not caught |
|---|---|
| Wrong COLOR (a `for` keyword coloured as a string) | The text content is correct; only the colour is wrong. The probe asserts source fidelity, not semantic correctness. |
| Missing token (a keyword left uncoloured) | Plain identifier inside a string stays escaped + uncoloured; probe passes; the block is just less coloured. |
| A language table that mis-classifies builtins | Same — text fidelity is fine, only colour is wrong. |
| A keyword that should be split (the `case` in `switch case` getting one span when it should be one span per `case`) | Both renderings have the same text content. |

Wrong colors → file a bug against the language table. The probe is
about **byte safety**, not **semantic correctness**. Wrong colours
make a block uglier; missing characters make a block dangerous.

## A8.7 The cascade — probe is the LAST line of defence

Three earlier defences before the probe:

1. **`null` lang fallback** — undeclared / unknown language returns
   `escapeHtml(src)` immediately. The probe is never invoked.
2. **`try / catch` around `highlightLineInternal`** — any thrown
   exception inside the tokenizer (regex bug, stash overflow, etc.)
   is caught and `escapeHtml(src)` returned.
3. **Per-pass placeholder-aware scanners** — every regex pass rejects
   matches that overlap a stashed placeholder, so a later pass can
   never corrupt an earlier one.

The probe catches what slips through all three: a tokenizer that ran
to completion, didn't throw, but produced a render whose text content
differs from the input.

## A8.8 Performance

The probe runs per line. `div.innerHTML = html` + `div.textContent`
read is ~5-20µs per line on a modern browser. For a 500-line block
that's ~10ms — imperceptible.

The Node fallback is ~2-5µs per line (a pure-JS string replace). The
test harness can probe 10,000 lines in ~50ms.

Optimization is NOT a priority: this code runs once at page load (or
at hot-swap), not per frame. Predictability > speed.

## A8.9 What an author can do (basically nothing)

The probe is invisible to the author. Their job is to:
- Author plain `<pre><code class="language-x">…</code></pre>`
- Declare the language correctly
- NEVER hand-inject `<span class="ve-tok-*">` markup

If they do all three, the probe never fires on their behalf. If they
hand-inject spans, the runtime's `initCodeGutter` skips the block
(because `<code>.children.length > 0`), the tokenizer is never called,
and there's no probe to defeat — but there's also no gutter, no copy
button, no selection. The hand-injected spans render as-is, but the
block has lost the chrome that makes it useful.

The advice: trust the tokenizer + probe pair. If a block renders
badly, file a bug against the language table — don't paper over it.

## A8.10 The test contract

`tests/scripts/test-designmd.js` (the integration suite) tests each
of the seven languages on:

- Empty line → empty line (no rendered tags)
- Plain identifier → plain identifier (no spans, but probe passes)
- Each token role exercised by a minimal example
- Multi-line constructs (block comments, triple strings) that span
  across calls and need `carry` to stay consistent
- Edge cases (unterminated strings, regexes that look like keywords,
  CSS calc() with operators that mimic JS, etc.)
- Pathological inputs the probe MUST catch (handcrafted to trigger
  each failure mode in §A8.5)

Each test asserts:
1. `highlightLine(src, lang)` returns a string (no throw, no
   `undefined`).
2. `probeTextContent(returned)` equals `src` (byte-exact).
3. The render contains the expected `<span class="ve-tok-X">` for the
   expected token (when one is expected).

A failure on any test BLOCKS the build. The probe contract is
load-bearing.

## A8.11 No tokens consumed

The probe is pure JS, no theming surface. Tokens render or they don't;
the probe doesn't care which.
