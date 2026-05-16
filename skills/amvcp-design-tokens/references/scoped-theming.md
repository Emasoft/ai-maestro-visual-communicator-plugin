# Scoped theming — per-section / per-component DESIGN.md (DT-06)

`applyTokens(map, rootEl)` accepts ANY element as `rootEl`. So a SINGLE
section / sidebar / modal can carry its OWN DESIGN.md while the rest of
the page keeps the global one. No engine change, no new mechanism — the
existing rootEl parameter IS the scoping primitive.

## What it does

The engine's `applyTokens(map, rootEl)` defaults `rootEl` to
`document.documentElement`, but accepts any element. The function sets
the `--vc-*` map as INLINE STYLE on that element. CSS custom-property
inheritance does the rest: descendants of `rootEl` inherit the inline
values; the rest of the page inherits the global ones from `<html>`.

This is exactly the "scope tokens to a `.stage` ancestor, override on
`.stage.dark`" pattern documented in
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
as the cleanest per-block theme-flip — but generalised: instead of just
flipping LIGHT ↔ DARK, the scoped subtree can run a COMPLETELY DIFFERENT
DESIGN.md (a parchment sidebar inside a factory-dark page, etc).

## When to use

- A "live-token playground" sidebar that re-themes its own preview as
  the user fiddles with sliders (the user's main reading area stays
  themed normally).
- A side-by-side "before / after" panel where one side runs the page's
  current DESIGN.md and the other side runs a candidate replacement.
- A modal that intentionally inverts (slate canvas with ivory text)
  while the page underneath stays the bright theme — without writing
  a `.modal-dark` style block.
- Embedding a third-party widget / iframe-less embed and forcing its
  tokens to a vendor's preset.

DO NOT use for routine theme toggling — that's
`window.__veDesignMd.toggleTheme()` (which still operates on the
document root). Scoped theming is for SECTION-LEVEL token differences.

## Scaffold to emit

```html
<main>
  <p>This paragraph reads the page's main theme tokens.</p>

  <aside class="vc-theme-scope" id="parchment-sidebar">
    <p>This paragraph reads a different DESIGN.md.</p>
  </aside>
</main>

<script>
  // Load the alternate DESIGN.md text.
  var altText = amvcpTokens.PRESETS['parchment'];
  var alt = amvcpDesignMd.parseDesignMd(altText);
  var altMap = amvcpDesignMd.resolveTokens(alt.designmd, 'light');

  // Apply to the sidebar only. The rest of <main> is unchanged.
  amvcpDesignMd.applyTokens(
    altMap,
    document.getElementById('parchment-sidebar')
  );
</script>
```

The `.vc-theme-scope` class is documented in `amvcp-tokens.css` as a
positioning marker — it just sets `position: relative` so absolutely-
positioned descendants land relative to the scoped root. The theming
itself is the `applyTokens` call.

## Lib functions used

- `amvcpDesignMd.parseDesignMd(text)` — parse the alternate DESIGN.md
- `amvcpDesignMd.resolveTokens(designmd, themeName)` — resolve to a
  flat map for one theme
- `amvcpDesignMd.applyTokens(map, rootEl)` — apply to `rootEl`
- `amvcpTokens.PRESETS` — pick an alternate preset to apply

## DESIGN.md tokens used

- ALL of them — the scoped subtree gets a full alternate token surface
- reads (host page): nothing — scoped theming is purely additive

## Anti-slop interaction

Scoped theming itself never trips the slop lint (`lintTokenSet`
operates per token set; if both the page and the scoped subtree pass,
the artifact is clean). But it does open one risk: a scoped subtree
that *fails* to apply could fall back to the host page's tokens AND
look wrong because the markup expected the alternate. Always assert
the application succeeded:

```js
var beforeAccent = getComputedStyle(sidebar).getPropertyValue('--vc-color-accent').trim();
amvcpDesignMd.applyTokens(altMap, sidebar);
var afterAccent = getComputedStyle(sidebar).getPropertyValue('--vc-color-accent').trim();
if (afterAccent === beforeAccent) {
  throw new Error('scoped theming did not change --vc-color-accent on the sidebar');
}
```

## Selection / comment / decision-mini contract

Selection inside the scoped subtree uses the scoped tokens' accent
(via the inherited `::selection { background: var(--vc-selection-bg); }`
rule, which resolves at the cursor's effective `--vc-color-accent`).
So selecting text in a parchment sidebar inside a factory-dark page
yields a parchment-tinted selection mark inside the sidebar — visual
continuity is preserved per-region.

Comment threads and decision-mini widgets opened INSIDE the scoped
subtree inherit the scoped tokens automatically — no special handling
needed.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the artifact under
`dev-browser`, screenshot a region that contains BOTH the host and the
scoped subtree, and verify a visible color discontinuity at the
boundary. Run `getComputedStyle(scopedEl).getPropertyValue('--vc-color-accent')`
and assert it ≠ `getComputedStyle(document.documentElement).getPropertyValue('--vc-color-accent')`.
Take screenshots in **both base-themes** (R1) — flipping the host
page from light to dark must not affect the scoped subtree's
appearance (since it has its own resolved token set inline).

If the scoped subtree's tokens "leak" to the host page (host paragraphs
suddenly look parchment), you likely applied to `document.body`
instead of the specific section — re-check the `rootEl` argument.
