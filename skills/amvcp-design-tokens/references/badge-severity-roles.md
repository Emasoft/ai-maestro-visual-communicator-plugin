# Badge severity role map — MUST / IMO / Q / FYI (DT-19)

A four-level severity convention for review comments and document
findings, mapped onto the engine's four semantic-state roles so badges
theme with the rest of the page. The smallest reusable role map (only
4 entries) but the most-used by other techniques.

## What it does

`amvcpTokens.ROLE_MAPS.badge` declares the map; `renderRoleMapCss('badge')`
returns a `<style>` block of attribute selectors that derive each
badge color from a `--vc-color-*` semantic role:

```css
[data-vc-role="MUST"] {
  --vc-role-color: var(--vc-color-danger);
  color: var(--vc-role-color);
  background:    color-mix(in srgb, var(--vc-role-color) 12%, var(--vc-color-surface));
  border-color:  color-mix(in srgb, var(--vc-role-color) 30%, var(--vc-color-surface));
}
[data-vc-role="IMO"] { --vc-role-color: var(--vc-color-info);    /* … */ }
[data-vc-role="Q"]   { --vc-role-color: var(--vc-color-warning); /* … */ }
[data-vc-role="FYI"] { --vc-role-color: var(--vc-color-success); /* … */ }
```

| Role | Maps to | Use |
|---|---|---|
| `MUST` | `--vc-color-danger` | a blocker — the reviewee MUST address before merge |
| `IMO` | `--vc-color-info` | reviewer's opinion — neither blocking nor a question |
| `Q` | `--vc-color-warning` | a clarifying question — needs an answer, not a code change |
| `FYI` | `--vc-color-success` | informational — file-locator pointers, follow-up reminders |

## When to use

This vocabulary is documented for code-review comments and review-style
artifacts (PR reviews, RFC critiques, design reviews). It's a
convention, not a hard requirement — but using a SHARED 4-letter
prefix on every comment makes a 30-comment review skimmable and lets
the reader filter by severity ("show me only MUSTs first").

Don't introduce parallel severity vocabularies (`HIGH/MED/LOW`,
`CRIT/MAJ/MIN`) in the same artifact — pick ONE and stick to it.
`MUST/IMO/Q/FYI` is the canonical one because it conveys the ACTION
expected of the reviewee, not the severity from the reviewer's POV.

## Scaffold to emit

```html
<!-- inject the role-map CSS once per page -->
<script>
  document.head.insertAdjacentHTML('beforeend',
    amvcpTokens.renderRoleMapCss('badge'));
</script>

<!-- consume with data-vc-role -->
<p>
  <span data-vc-role="MUST">MUST</span>
  Memory leak in the connection-pool teardown — see
  <code>conn.close()</code> at <code>db.ts:142</code>.
</p>

<p>
  <span data-vc-role="Q">Q</span>
  Should this also handle the case where <code>retries === 0</code>?
</p>
```

The `data-vc-role` element doesn't need any other class — the
attribute selector wins and themes it automatically.

## Lib functions used

- `amvcpTokens.renderRoleMapCss('badge')` → `<style>` text block
- `amvcpTokens.ROLE_MAPS.badge` → the raw `{ attr, roles }` map (useful
  if you want to introspect the roles in JS)

## DESIGN.md tokens used

- reads (via derivation): `--vc-color-danger`, `--vc-color-info`,
  `--vc-color-warning`, `--vc-color-success`
- reads (via the bg/border mix): `--vc-color-surface` (the per-theme
  flip happens here)

## Anti-slop interaction

The role map produces NO literal hexes — every badge color is a
`var(--vc-color-*)` reference + a `color-mix(... var(--vc-color-surface))`
mix. So a badge in a `factory-dark` theme reads as orange-tinted
chrome on a dark canvas, and the SAME badge in a `parchment` theme
reads as honey/red chrome on cream. One markup, two themes, zero
hand-tuning.

Slop equivalents (hand-coded `[data-severity="MUST"] { bg: #FEF2F2;
color: #DC2626; border-color: #FECACA; }`) hardcode FOR ONE THEME
and break in the other.

## Selection / comment / decision-mini contract

Badges are SPANS — they participate in normal text selection. Selecting
across a `MUST` badge and surrounding prose paints the
`--vc-selection-bg` over both; the badge's own bg / fg / border stay
intact under the selection overlay (because they're opaque colors,
not derivative).

When a badge is INSIDE a comment thread, the thread's selection /
copy affordance treats the badge as inline text — no special handling
needed.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a doc with all
four badges under `dev-browser`. Screenshot in **both themes** (R1)
and verify:

1. each badge's `color` reads against its `background` (use
   `amvcpTokens.contrastRatio(fg, bg) >= 4.5` via `page.evaluate` on
   each badge);
2. the SAME badge looks different in light vs dark (the bg flips from
   pale to dark variant of the same hue — visual proof the
   `color-mix(... surface)` worked);
3. NO `[data-severity]`, `[data-vc-severity]`, `[class*="severity"]`
   parallel vocabularies in the markup (audit with a regex over the
   HTML — if found, replace with `[data-vc-role]`).
