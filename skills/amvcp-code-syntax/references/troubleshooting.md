# Error Handling — code-syntax symptom → fix table

## Table of Contents

- [Symptom → fix table](#symptom--fix-table)

## Symptom → fix table

| Symptom | Fix |
|---|---|
| Tokens render as a single color | `class="language-<id>"` or `data-ve-lang="<id>"` missing — runtime cannot guess, undeclared blocks stay plain by design |
| Source byte-altered (a character lost) | A custom hand-wrap defeated the integrity probe. NEVER hand-author `<span class="ve-tok-*">`; let the tokenizer do it |
| Gutter or copy button absent | `initCodeGutter` skips a `<pre>` whose `<code>` already has child elements. Plain text only at author time |
| Horizontal scrollbar on a `<pre>` | A CSS rule set `overflow-x:auto` — remove it. The page expands; wide code wraps. See [wrap-and-no-inner-scroll](wrap-and-no-inner-scroll.md) |
| Colors wrong on light theme | `:root[data-ve-theme="light"]` mirror is missing for one or more `--ve-code-*` tokens. See [light-dark-mirror-discipline](light-dark-mirror-discipline.md) |
| `_block` selection markers don't yield to token color | Confirm `data-ve-code-sel` / `data-ve-pressed="1"` rules from `scripts/amvcp-code-highlight.css` are loaded — they set `color: inherit` on every `.ve-tok-*` span |
