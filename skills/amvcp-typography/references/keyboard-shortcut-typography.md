# Keyboard shortcut typography — `<kbd>`, key combos, and the modifier-key glyphs

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [The modifier-key glyph mapping](#the-modifier-key-glyph-mapping)
- [The cross-platform convention](#the-cross-platform-convention)
- [Why `white-space: nowrap` on `.vc-keycombo`](#why-white-space-nowrap-on-vc-keycombo)
- [The plus separator opacity](#the-plus-separator-opacity)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Accessibility — `aria-label` for clarity](#accessibility--aria-label-for-clarity)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to use `<kbd>`](#when-not-to-use-kbd)
- [Verification](#verification)
- [Cross-references](#cross-references)

A page that documents keyboard shortcuts — a help menu, a power-user
cheatsheet, a CLI help text rendered as HTML — needs a consistent
typographic shape for each KEY and each COMBINATION. The typography
skill ships the `<kbd>` element default plus the
`.vc-keycombo` utility and the `.vc-key-mod` modifier for the
visual signature of "press Ctrl+Shift+P".

## What it is

A keyboard shortcut is a SEQUENCE of physical key presses, sometimes
involving MODIFIER keys (Ctrl / Cmd / Shift / Alt / Option / Meta).
The typography contract distinguishes:

| Element | Renders as | Used for |
|---|---|---|
| `<kbd>` | Bordered chip | A single key (or a combo, treated atomically) |
| `<kbd><kbd>X</kbd><kbd>Y</kbd></kbd>` | Multiple chips joined | A key combo (Ctrl+P, Cmd+Shift+K) |
| `.vc-key-mod` | Modifier glyph (⌘, ⌥, ⇧, ⌃) | Modifier key in a combo on macOS |
| `.vc-keycombo` | Container for a sequence | A multi-step shortcut (`Ctrl+K Ctrl+S`) |

The typography skill ships THIS visual contract; the HTML markup
discipline (when to wrap in `<kbd>` vs `<code>`, when to nest) is
documented here.

## The contract

`amvcp-typography.css` already ships the bare `<kbd>` contract
(see [code-and-mono.md](./code-and-mono.md)); this reference extends
with the combo-specific shapes:

```css
/* Container for a keyboard shortcut combo. */
.vc-keycombo {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  white-space: nowrap;
}

/* Modifier glyph — slightly larger, slightly heavier. */
.vc-key-mod {
  font-size: 0.95em;                   /* slightly larger than body */
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  font-family: var(--vc-font-body, inherit);  /* the glyph face renders the symbol */
  margin-right: 0.05em;
}

/* The + separator between modifiers / keys. */
.vc-keycombo .vc-key-sep,
.vc-keycombo .vc-key-plus {
  margin: 0 0.05em;
  opacity: 0.5;                        /* subtle, doesn't compete with the keys */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
}

/* A multi-step shortcut (chord) — Vim-style or VS Code's Ctrl+K Ctrl+S. */
.vc-keychord {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  /* Each step is a .vc-keycombo. */
}
```

## Scaffold

### Single key

```html
<p>Press <kbd>F1</kbd> for help.</p>
```

### Two-key combo (macOS convention with modifier glyphs)

```html
<p>Save with <span class="vc-keycombo">
  <kbd><span class="vc-key-mod">⌘</span>S</kbd>
</span>.</p>
```

The modifier glyph (⌘ = Command on macOS) sits before the letter
inside a single `<kbd>` chip — macOS convention writes "⌘S" as a
single unit.

### Cross-platform combo

```html
<p>Save with
  <span class="vc-keycombo">
    <kbd>Ctrl</kbd><span class="vc-key-plus">+</span><kbd>S</kbd>
  </span> (Windows / Linux) or
  <span class="vc-keycombo">
    <kbd>⌘</kbd><span class="vc-key-plus">+</span><kbd>S</kbd>
  </span> (macOS).</p>
```

The `+` separator is a `<span class="vc-key-plus">` — distinct from
plain text "+" so the typography contract can dim it without
affecting prose.

### Multi-step chord

```html
<p>Open the command palette with
  <span class="vc-keychord">
    <span class="vc-keycombo">
      <kbd>Ctrl</kbd><span class="vc-key-plus">+</span><kbd>K</kbd>
    </span>
    <span class="vc-keycombo">
      <kbd>Ctrl</kbd><span class="vc-key-plus">+</span><kbd>S</kbd>
    </span>
  </span>.</p>
```

The chord renders as "Ctrl+K Ctrl+S" with each combo visually grouped,
and a small inter-combo gap.

## Tokens consumed / extended

- **Consumes:** `--vc-font-mono`, `--vc-font-body`, `--vc-weight-label`,
  `--vc-weight-medium`, `--vc-weight-body`, `--vc-weight-regular`.
- **Extends:** nothing.

## The modifier-key glyph mapping

The macOS modifier glyphs are Unicode characters that the body face
must render. The mapping:

| Modifier | macOS glyph | Unicode |
|---|---|---|
| Command | ⌘ | U+2318 PLACE OF INTEREST SIGN |
| Option | ⌥ | U+2325 OPTION KEY |
| Shift | ⇧ | U+21E7 UPWARDS WHITE ARROW |
| Control (Mac "Ctrl") | ⌃ | U+2303 UP ARROWHEAD |
| Caps Lock | ⇪ | U+21EA UPWARDS WHITE ARROW FROM BAR |
| Return | ⏎ | U+23CE RETURN SYMBOL |
| Tab | ⇥ | U+21E5 RIGHTWARDS ARROW TO BAR |
| Backspace | ⌫ | U+232B ERASE TO THE LEFT |
| Delete (forward) | ⌦ | U+2326 ERASE TO THE RIGHT |
| Escape | ⎋ | U+238B BROKEN CIRCLE WITH NORTHWEST ARROW |
| Eject | ⏏ | U+23CF EJECT SYMBOL |
| Up Arrow | ↑ | U+2191 |
| Down Arrow | ↓ | U+2193 |
| Left Arrow | ← | U+2190 |
| Right Arrow | → | U+2192 |

All are universally available in modern font stacks. If the body
face lacks the glyph, the browser falls back to a system glyph (the
default Unicode rendering).

For Windows / Linux conventions, use the spelled-out names:
"Ctrl", "Shift", "Alt", "Win" (or "Super" for Linux).

## The cross-platform convention

For documentation that targets both macOS and Windows / Linux users,
two patterns:

**Pattern A: Show both, mac first** (Apple-style):

> Press ⌘S (Ctrl+S on Windows / Linux).

**Pattern B: Show generic, footnote**:

> Press Ctrl+S<sup>1</sup> to save.
>
> ¹ On macOS, use Cmd+S.

**Pattern C: Detect platform via JS** (the runtime's job, not
typography's):

```js
const mod = (navigator.platform.match(/Mac/i) ? '⌘' : 'Ctrl');
elem.textContent = mod + '+S';
```

The typography skill ships the visual contract for ALL THREE
patterns; the agent picks the documentation strategy.

## Why `white-space: nowrap` on `.vc-keycombo`

A keyboard combo MUST stay on one line — "Ctrl + ↵ S" (where the
combo wraps mid-keys) is meaningless to the reader. The combo's
`white-space: nowrap` enforces this. The combo overflows its parent
container rather than wrapping.

For a long combo that doesn't fit, the agent can re-flow by ending the
prose mid-thought: "Press Ctrl + Shift + P (or, on macOS, the
corresponding Cmd + Shift + P) to open …"

## The plus separator opacity

The "+" between modifier and key is dimmed to `opacity: 0.5`. The
keys are the focus; the "+" is connective tissue. Dimming it lets
the eye scan the keys without "+" visual noise.

This is the editorial convention seen in macOS Help, VS Code's
help, Sublime Text's docs.

## Light + dark — fully covered

The contract sets sizes and weights via tokens, no colour. The
opacity-dimmed "+" is theme-correct (opacity blends with whatever
background colour). The modifier glyph uses the body face which is
themed via `--ve-control-fg`. Correct in both themes.

## Accessibility — `aria-label` for clarity

A combo of glyphs like "⌘⇧K" is opaque to screen readers — many
TTS engines pronounce the Unicode glyphs as "place of interest sign
upwards white arrow K", which is useless.

For accessibility, wrap with `aria-label`:

```html
<span class="vc-keycombo"
      aria-label="Command Shift K">
  <kbd>⌘</kbd><kbd>⇧</kbd><kbd>K</kbd>
</span>
```

The screen reader reads "Command Shift K"; sighted users see the
glyphs.

Alternative: hide the glyphs from screen readers and provide alt
text:

```html
<span class="vc-keycombo">
  <kbd aria-hidden="true">⌘</kbd><span class="visually-hidden">Command</span>
  <kbd aria-hidden="true">⇧</kbd><span class="visually-hidden">Shift</span>
  <kbd aria-hidden="true">K</kbd><span class="visually-hidden">K</span>
</span>
```

Both patterns work; pick the one that's easier to author. The typography
skill doesn't enforce — the agent does.

## Selection-contract conformance

A `.vc-keycombo` or `<kbd>` is INLINE — not a typography atom. It
lives inside a parent atom (a `<p>`, a `<li>`, a `<th>`).

A whole keyboard-shortcut TABLE (a help cheatsheet) is a `<table>`
atom owned by the `tables` skill; the typography skill provides the
per-cell `<kbd>` rendering.

## When NOT to use `<kbd>`

- For a CLI command — use `<code>` (the user types this in a
  terminal, not by pressing keys: `<code>npm install</code>`).
- For text the user reads back (vs presses) — use `<code>` for
  "the env var DEBUG_LEVEL".
- For natural-language references — "press the Save button" uses
  `<button>` semantics, not `<kbd>` (the user is clicking, not
  typing a key).

The rule of thumb: `<kbd>` is for KEYS the user PHYSICALLY PRESSES.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with multiple combos: single key, two-key
   combo, multi-step chord, modifier glyphs, cross-platform.
2. Confirm each combo renders on one line (no wrapping).
3. Confirm the "+" separators are dimmed.
4. Confirm modifier glyphs render correctly (Unicode is present in
   the body face).
5. Test with a screen reader; confirm `aria-label` annotations are
   announced.
6. Confirm in light + dark themes; the `<kbd>` border uses
   `currentColor` (themed).

## Cross-references

- [code-and-mono.md](./code-and-mono.md) — the `<kbd>` element-level
  default this reference extends.
- [accessibility-and-screen-reader.md](./accessibility-and-screen-reader.md)
  — `aria-label` for opaque glyphs.
- [tabular-numerics.md](./tabular-numerics.md) — for keyboard
  shortcut tables (key columns may align tabularly).
- `interactive-controls` skill — owns button labels; `<kbd>` is the
  typography for keystrokes that *trigger* a button.
