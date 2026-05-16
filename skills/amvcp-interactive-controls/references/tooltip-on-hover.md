# Tooltip on hover — title attribute upgrade

Three patterns for adding a hovering hint to an element. From the
zero-effort `title=""` baseline to a fully styled CSS tooltip to a
JS popover with the "hover-bridge" trick. Always include the
hover-bridge — without it, the tooltip vanishes the moment the
cursor crosses the gap into it.

## Three tiers

| Tier | Affordance | Hover-bridge needed? |
|---|---|---|
| 1. `title=""` | Native browser tooltip | No (browser-managed) |
| 2. CSS `::after` | Styled tooltip via pseudo | No (in DOM subtree) |
| 3. JS popover | Floating element, anchored | **Yes** |

## Tier 1 — `title=""` baseline

For non-critical hints, the native `title=""` IS sufficient. It
reads on hover, on focus (some browsers), and via AT. No CSS, no
JS:

```html
<button type="button" title="Reset the form to its initial state">
  Reset
</button>
```

Limitations: slow to appear (~600 ms browser delay), can't be
styled, vanishes after a few seconds, hidden on touch. Use only
for nice-to-have hints.

## Tier 2 — CSS `::after` tooltip

When you need a styled tooltip that appears immediately on hover,
position it as a `::after` pseudo on the trigger. No JS needed.
The pseudo lives **inside the trigger's DOM subtree**, so there's
no hover-bridge problem.

```html
<span class="ic-tip" data-ic-tip="Used to compute the rate limit per IP.">
  rate_limit
</span>
```

CSS:

```css
.ic-tip {
  position: relative;
  border-bottom: 1px dotted var(--vc-color-accent, #b8861f);
  cursor: help;
}
.ic-tip::after {
  content: attr(data-ic-tip);
  position: absolute;
  bottom: calc(100% + var(--vc-space-1, 8px));
  left: 50%;
  transform: translateX(-50%);
  padding: var(--vc-space-1, 8px) var(--vc-space-2, 12px);
  background: var(--vc-color-content, #14110b);
  color: var(--vc-color-canvas, #faf6ee);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.3
        var(--ve-control-font, inherit);
  border-radius: var(--vc-radius-sm, 4px);
  white-space: pre-wrap;
  max-width: 20em;
  width: max-content;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease);
  z-index: var(--vc-z-tooltip, 300);
}
.ic-tip:hover::after,
.ic-tip:focus-visible::after {
  opacity: 1;
}
.ic-tip:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ic-tip::after { transition: none; }
}
```

This works for ~95% of tooltip needs. Limitations: the pseudo
clips at the trigger's overflow-hidden ancestor. For a tooltip
inside a `<table>` with `overflow: hidden`, the tooltip is
clipped — use Tier 3.

## Tier 3 — JS popover with hover-bridge

For tooltips that must escape an `overflow: hidden` ancestor, OR
for rich content (links, buttons, multi-line markdown), use a
real popover element appended to `<body>`. The **hover-bridge**
is the critical trick (per
`~/.claude/rules/browser-ui-test-techniques.md` rule #2).

```js
function attachRichTooltip(trigger, content) {
  var tip = document.createElement('div');
  tip.className = 'ic-rtip';
  tip.appendChild(content);   // a DOM fragment with the rich content
  tip.style.position = 'absolute';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  var hideTimer = null;
  function scheduleHide() {
    if (hideTimer) { clearTimeout(hideTimer); }
    hideTimer = setTimeout(function () { tip.style.display = 'none'; }, 180);
  }
  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }
  function showAt(rect) {
    tip.style.display = 'block';
    tip.style.left = (rect.left + rect.width / 2) + 'px';
    tip.style.top  = (rect.bottom + 8) + 'px';
    tip.style.transform = 'translateX(-50%)';
  }
  trigger.addEventListener('mouseenter', function () {
    cancelHide();
    showAt(trigger.getBoundingClientRect());
  });
  trigger.addEventListener('mouseleave', scheduleHide);
  // ↑ Without scheduleHide on the trigger, the tip would disappear
  //   the instant the cursor crossed the 8 px gap into it.
  tip.addEventListener('mouseenter', cancelHide);
  tip.addEventListener('mouseleave', scheduleHide);
  // ↑ When the cursor is over the tip itself, keep it alive.

  // Hide on scroll — the tip's anchored position becomes wrong.
  window.addEventListener('scroll', function () {
    tip.style.display = 'none';
  }, { passive: true });

  trigger.addEventListener('focus', function () {
    cancelHide();
    showAt(trigger.getBoundingClientRect());
  });
  trigger.addEventListener('blur', scheduleHide);
}
```

The 180 ms hide delay is the **hover-bridge window**: small enough
that a casual mouse drift hides the tip, large enough that an
intentional move from trigger to tip clears it.

CSS for the rich-tip:

```css
.ic-rtip {
  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface-raised, #ffffff);
  color: var(--vc-color-content, #14110b);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  box-shadow: var(--vc-shadow-2, 0 4px 16px rgba(0,0,0,0.10));
  max-width: 28em;
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.5
        var(--ve-control-font, inherit);
  z-index: var(--vc-z-tooltip, 300);
}
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-content` | tier-2 dark tooltip bg |
| `--vc-color-canvas` | tier-2 light text |
| `--vc-color-surface-raised` | tier-3 light card bg |
| `--vc-color-accent` | tier-2 dotted underline + focus ring |
| `--vc-z-tooltip` | always above content + below modal |
| `--vc-duration-fast` | fade-in |

## Selection / comment / decision-mini

- **Tooltip content** is not standalone content — it's an
  ephemeral overlay; not an atom.
- **The element that triggers the tooltip** is the atom — comments
  attach there ("clarify this term", "remove the tooltip, it's
  obvious").

## JS-off degradation

- **Tier 1 (`title=""`)** — works without JS.
- **Tier 2 (CSS `::after`)** — works without JS.
- **Tier 3 (JS popover)** — degrades to no tooltip; the trigger
  is still functional otherwise.

For critical hints, use Tier 1 or 2 so the message survives the
JS-off audience.

## Anti-patterns

- A JS tooltip without the hover-bridge — the tip vanishes when
  the cursor crosses the gap.
- A tooltip without `prefers-reduced-motion` respect — the fade
  is jarring for motion-sensitive users.
- A tooltip with interactive content (links, buttons) on hover
  only — touch and keyboard users can't reach it. Use
  `popover="auto"` (`references/popover-and-dialog.md`) for
  interactive overlays.
- Hardcoding the z-index — must reference `--vc-z-tooltip` so the
  layering matches the design-token contract.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md` AND the
"trust real mouse paths" rule:

```js
// Hover with steps so mouseleave/over fire in sequence.
const tip = document.querySelector('.ic-tip');
const r = tip.getBoundingClientRect();
await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
await page.waitForTimeout(200);
const beforeOpacity = await page.evaluate(() => {
  const tip = document.querySelector('.ic-tip');
  return getComputedStyle(tip, '::after').opacity;
});
console.assert(parseFloat(beforeOpacity) > 0.5);

// Move away — tip fades out.
await page.mouse.move(r.x + r.width / 2, r.y - 100, { steps: 8 });
await page.waitForTimeout(250);
```

For Tier 3 — verify the hover-bridge window: move from trigger to
tip in 8 steps without exiting the bridge; verify the tip stays
visible.

Screenshot light + dark with the tooltip visible; verify contrast.
