# Click-to-copy — the contact-sheet affordance

Every swatch / specimen / bar / chip in the contact sheet is a
`<button data-vc-copy="<value>">`. One delegated `click` listener on
the sheet root copies the value via `navigator.clipboard.writeText`
and flashes a "copied" tooltip. This is the ONE deliberate fail-soft
path in the entire design-tokens system.

## What it does

`attachCopy(rootEl)` attaches a single `click` listener on the sheet
root. On click of any element with `data-vc-copy`:

1. read `event.target.closest('[data-vc-copy]').dataset.vcCopy`;
2. call `navigator.clipboard.writeText(value)`;
3. on success, set `data-vc-copied="Copied!"` on the target (the
   `[data-vc-copied]::after` CSS shows a tooltip);
4. after 1.4 seconds, remove `data-vc-copied`;
5. on failure (e.g. `navigator.clipboard` unavailable in an insecure
   context), fall back to `copyFallback`: create a hidden
   `<textarea>`, populate, select, `document.execCommand('copy')`,
   remove;
6. if THAT also fails, the button still SHOWS the value as
   selectable text (the `data-vc-copy` attribute is reflected into
   the button's visible label).

## Why fail-soft (instead of fail-fast)

The design-tokens system everywhere else is FAIL-FAST: a malformed
DESIGN.md throws, a banned color throws, a non-ascending spacing
scale throws. Click-to-copy is the deliberate exception because:

- copying is a CONVENIENCE affordance, not a data contract;
- a missing `navigator.clipboard` (insecure context, old browser) is
  a USER ENVIRONMENT issue, not an authoring defect — throwing would
  break the entire sheet for users in those environments;
- the fallback path keeps the value VISIBLE so the user can
  hand-copy via OS-level select-and-copy.

This is documented in `SKILL.md` § Error Handling as "the ONE
deliberate fail-soft path".

## Scaffold to emit

The pattern is built into `amvcp-token-sheet.js` — every panel's
builder emits buttons with `data-vc-copy`. For a custom widget that
wants the same affordance:

```html
<button data-vc-copy="var(--vc-color-accent)" class="my-copy-button">
  --vc-color-accent
</button>

<script>
  // Attach the standard delegate to the custom root.
  amvcpTokenSheet.attachCopy(myCustomRoot);
  // (the function isn't currently exported; see Lib section below)
</script>
```

The CSS for the flash tooltip:

```css
[data-vc-copy] {
  position: relative;     /* for the absolute ::after */
}
[data-vc-copy][data-vc-copied]::after {
  content: attr(data-vc-copied);
  position: absolute;
  top: var(--vc-space-1, 8px);
  right: var(--vc-space-1, 8px);
  z-index: var(--vc-z-tooltip, 600);
  padding: 2px var(--vc-space-1, 8px);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--vc-color-content, #1f1a14);
  color: var(--vc-color-canvas, #faf6ee);
  font-family: var(--vc-font-body, system-ui, sans-serif);
  font-size: var(--vc-text-0, 12px);
  pointer-events: none;
}
```

## Lib functions used

- (internal) `attachCopy(rootEl)`, `copyValue(value, anchor)`,
  `copyFallback(value, anchor)`, `flashCopied(anchor, altLabel)` —
  defined in `amvcp-token-sheet.js`, currently not exported on the
  public `amvcpTokenSheet` API; called by `renderContactSheet` /
  `mountContactSheet` automatically
- `navigator.clipboard.writeText(value)` — the standard browser
  clipboard API
- `document.execCommand('copy')` — the legacy fallback path

## DESIGN.md tokens used

- reads (via the flash tooltip's CSS):
  `--vc-color-content`, `--vc-color-canvas`, `--vc-font-body`,
  `--vc-text-0`, `--vc-radius-sm`, `--vc-space-1`, `--vc-z-tooltip`
- writes: NOTHING

## Anti-slop interaction

The copy affordance doesn't introduce colors / fonts of its own — the
tooltip uses page-theme tokens — so it stays slop-clean by design.

## Selection / comment / decision-mini contract

The button is keyboard-accessible (you can Tab to it and press
Enter / Space to fire the click handler). Selecting text INSIDE the
button (e.g. dragging across the visible value) works normally and
gives the user the same value via OS-level copy (Ctrl/Cmd+C) — a
DEFAULT-DEFAULT fallback for the worst-case "even our fallback
failed" scenario.

The flashed tooltip uses `pointer-events: none` so it doesn't
intercept further clicks (a quick double-click on a swatch fires
the copy TWICE — both are valid, both flash, the second copy lands
in the clipboard).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Test the copy affordance:

```js
// Select a known swatch and click it.
await page.click('button[data-vc-copy="#b8861f"]');
// Wait briefly for the flash to appear.
await page.waitForTimeout(200);
const flashedAttr = await page.evaluate(
  () => document.querySelector('button[data-vc-copy="#b8861f"]')
    .getAttribute('data-vc-copied'));
console.assert(flashedAttr === 'Copied!');
// Wait for the flash to disappear.
await page.waitForTimeout(1500);
const goneAttr = await page.evaluate(
  () => document.querySelector('button[data-vc-copy="#b8861f"]')
    .getAttribute('data-vc-copied'));
console.assert(goneAttr === null);
```

Test the fallback path (in a Chromium without clipboard permission
granted) — the flash should still appear (fallback worked), or the
text should remain selectable (fallback-of-fallback). NEVER an
error toast — the affordance is fail-soft.

Test the keyboard path — `Tab` to a swatch, press `Enter`, verify
the flash fires.
