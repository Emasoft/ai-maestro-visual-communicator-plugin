# `lintLiveDocument` — in-browser slop audit

## Table of Contents

- [What it does](#what-it-does)
- [Why a live walk vs. linting source](#why-a-live-walk-vs-linting-source)
- [When to run](#when-to-run)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The in-browser variant of the slop gate. Walks the DOM under
`rootEl`, reads `getComputedStyle`, and stamps `data-vc-slop-alert
="<reason>"` on each offender. The complement to `lintTokenSet` (which
audits the token SOURCE) and `lintHtml` (which audits a markup
string): this one audits the RENDERED page.

## What it does

```
amvcpTokens.lintLiveDocument(rootEl?) -> { ok, violations: […] }
```

For every element under `rootEl` (default `document.body`):

1. read computed `background-image` — flag if it contains
   `linear-gradient(`;
2. read computed `backdrop-filter` / `webkit-backdrop-filter` — flag
   if it contains `blur(`;
3. read computed `color` — convert to hex, check via
   `bannedColorReason`;
4. read computed `background-color` — convert to hex, check via
   `bannedColorReason`;
5. read computed `font-family` — extract the primary family, check
   against `BANNED_FONTS`;
6. if any of the above flags, append the reason to `problems`, set
   `data-vc-slop-alert="<reasons joined by '; '>"` on the element,
   add a violation to the output.

After the walk, audit DISTINCT text colors used across the page — if
the count exceeds 8 (a generous threshold), flag a coarse
"uncoordinated palette" violation.

## Why a live walk vs. linting source

Some slop only manifests at COMPUTED-STYLE time:

- a CSS rule that resolves to a banned color via `var()` chains;
- a `font-family` that picks up the user's `system-ui` which happens
  to be Inter on their system;
- a `linear-gradient(…)` set via JS at runtime;
- a `backdrop-filter: blur(…)` set via a plugin / inline script.

The source-side lints catch what's in the AUTHORED CSS / DESIGN.md.
The live lint catches what's in the RENDERED RESULT.

## When to run

- as a smoke test in CI — render a sample artifact in a headless
  browser, run `lintLiveDocument(document.body)`, fail the build if
  it returns violations;
- as a dev-mode tool — wire a "Slop check" button into the page that
  walks the DOM and flashes the offenders;
- as a one-off audit — paste the function into the dev tools console
  on any page (the result with `data-vc-slop-alert` attributes makes
  the offenders visually obvious thanks to the
  `[data-vc-slop-alert]` CSS rule's dashed outline).

## Scaffold to emit

For a dev-mode "audit" button on the page:

```html
<button id="slop-audit-btn">Run slop audit</button>

<script>
  document.getElementById('slop-audit-btn').addEventListener('click', function () {
    var report = amvcpTokens.lintLiveDocument(document.body);
    if (report.ok) {
      alert('No slop detected. ' + report.violations.length + ' issues.');
    } else {
      console.table(report.violations);
      alert('Slop found — ' + report.violations.length + ' elements flagged. ' +
            'Check the DOM for [data-vc-slop-alert] attributes.');
    }
  });
</script>
```

The `[data-vc-slop-alert]` CSS rule in `amvcp-tokens.css`:

```css
[data-vc-slop-alert] {
  outline: 2px dashed var(--vc-color-danger, #a84a32);
  outline-offset: 2px;
}
```

— so flagged elements get a visible dashed outline.

## Lib functions used

- `amvcpTokens.lintLiveDocument(rootEl)` →
  `{ ok: boolean, violations: Array<{kind, token, value, reason}> }`
- (internal) `bannedColorReason(hex)`, `cssColorToHex(css)`,
  `primaryFontFamily(stack)` — the shared helpers `lintHtml` /
  `lintTokenSet` also use
- `amvcpTokens.BANNED_COLORS`, `BANNED_FONTS`, `BANNED_PATTERNS` —
  the data tables; the live walker only uses BANNED_COLORS and
  BANNED_FONTS directly (patterns are inferred from computed
  background-image / backdrop-filter)

## DESIGN.md tokens used

- reads (via the `[data-vc-slop-alert]` CSS):
  `--vc-color-danger` (the outline color)
- the AUDIT itself reads the LIVE COMPUTED VALUES of every element —
  it doesn't care about the underlying tokens, only about what the
  user sees on screen

## Anti-slop interaction

The function IS the gate's runtime variant. There's no other
interaction.

The function throws when called outside a browser (`typeof document
=== 'undefined'`) — the source-side `lintHtml` is the variant to use
for headless / build-time scans of a string.

## Selection / comment / decision-mini contract

The `data-vc-slop-alert` attribute is informational — it doesn't
participate in selection / comment / decision-mini state. Selecting
text inside a flagged element works normally; the dashed outline
is `outline`, not `border`, so it doesn't shift layout.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — author a known-slop
page (a card with `background: linear-gradient(135deg, #6366F1,
#3B82F6)` and `font-family: "Inter, system-ui"`), open it under
`dev-browser`, run:

```js
const report = await page.evaluate(() => amvcpTokens.lintLiveDocument(document.body));
console.assert(!report.ok);
console.assert(report.violations.length >= 2);  // gradient + banned indigo + banned blue + banned font
```

Then take a screenshot — the flagged card should have a visible
dashed outline in danger color. Screenshot in **both themes** (R1)
— the `[data-vc-slop-alert]` outline color is `--vc-color-danger`,
which themes per page, so the outline reads as the page's
danger-role color in either theme.
