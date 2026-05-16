# Smart quotation marks, em-dashes, ellipses — the punctuation polish

The difference between an amateur and a professional typographic page
is the *punctuation*: straight quotes (`'`, `"`) vs curly quotes
(`’`, `“ ”`); double hyphen (`--`) vs em-dash (`—`); three periods
(`...`) vs ellipsis (`…`). The typography skill ships the `<q>`
element default plus the editorial conventions for smart punctuation.

## What it is

Standard ASCII punctuation is the typewriter set:
- `'` (straight single quote, used for both opening and closing)
- `"` (straight double quote, used for both)
- `-` (hyphen-minus, used for word breaks and as a dash)
- `...` (three dots, used as ellipsis)

Smart typography uses the directional / typographic variants:
- `'` `’` (left and right single curly quotes, Unicode U+2018, U+2019)
- `"` `”` (left and right double curly quotes, U+201C, U+201D)
- `–` (en-dash, U+2013, for numeric ranges)
- `—` (em-dash, U+2014, for parenthetical breaks)
- `…` (ellipsis, U+2026, for omissions)

The typography skill ships:
1. The `<q>` element default — language-aware curly quotes.
2. The `.vc-smart-punctuation` utility — opt-in for converting at
   render time (rare; usually the agent uses the Unicode directly
   in markup).
3. Documentation of the editorial conventions for smart punctuation.

## The `<q>` element default

The `<q>` element renders inline quotations with language-appropriate
curly quotes:

```css
q {
  /* No specific styling — the browser uses the lang attribute
     to pick the right curly-quote glyphs. */
  quotes: '"' '"' "'" "'";    /* English convention by default */
}

q:lang(fr) {
  quotes: '« ' ' »' '‹ ' ' ›';   /* French uses angle quotes */
}

q:lang(de) {
  quotes: '„' '"' '‚' "'";     /* German uses bottom-open quotes */
}

q:lang(ja),
q:lang(zh) {
  quotes: '「' '」' '『' '』';   /* CJK corner brackets */
}
```

Usage:

```html
<p>She said <q>hello</q>.</p>
<p>She said <q lang="fr">bonjour</q>.</p>
<p>The artist said <q lang="ja">こんにちは</q>.</p>
```

The browser inserts the right open / close quote per language.
Nested `<q>` uses the alternate quote pair automatically.

## Editorial conventions — the four smart-punctuation rules

The typography skill expects the agent to follow these conventions
in MARKUP (the agent writes the right Unicode character; the typography
contract does not auto-convert).

### Rule 1: Curly quotes, not straight quotes

| Wrong | Right |
|---|---|
| `He said "hello".` | `He said “hello”.` |
| `It's a beautiful day.` | `It’s a beautiful day.` |
| `'twas the night before` | `’twas the night before` |

The `’` (right single curly) doubles as an apostrophe in contractions
("it's" → "it’s").

### Rule 2: Em-dash for parenthetical breaks

| Wrong | Right |
|---|---|
| `He had one regret - the deploy.` | `He had one regret — the deploy.` |
| `The team -- after much debate -- decided.` | `The team — after much debate — decided.` |

The em-dash (`—`) is the editorial dash. Hyphens (`-`) are for word
breaks ("re-enter") and compounds ("twenty-five").

### Rule 3: En-dash for numeric ranges

| Wrong | Right |
|---|---|
| `pages 47-52` | `pages 47–52` |
| `the 2024-2025 fiscal year` | `the 2024–2025 fiscal year` |
| `the New York-London flight` | `the New York–London flight` |

The en-dash (`–`) is wider than a hyphen, narrower than an em-dash.
Use it for ranges, scores, and compound modifiers where each side is
two-word ("New York–London flight").

### Rule 4: Ellipsis as a single character

| Wrong | Right |
|---|---|
| `She paused...then continued.` | `She paused…then continued.` |
| `The list went on . . .` | `The list went on…` |

The single Unicode ellipsis (`…`, U+2026) is a single character. Three
periods (`...`) is three separate characters that may break across
lines.

## Typing the Unicode characters

| Character | macOS | Windows | Linux |
|---|---|---|---|
| `’` (right single) | Opt+Shift+] | Alt+0146 | Compose+>+' |
| `“` (left double) | Opt+[ | Alt+0147 | Compose+<+" |
| `”` (right double) | Opt+Shift+[ | Alt+0148 | Compose+>+" |
| `–` (en-dash) | Opt+- | Alt+0150 | Compose+- - . |
| `—` (em-dash) | Opt+Shift+- | Alt+0151 | Compose+- - - |
| `…` (ellipsis) | Opt+; | Alt+0133 | Compose+. . . |

Most modern editors (Markdown editors, Pages, Word) auto-convert
straight quotes to curly quotes — the agent gets smart punctuation for
free.

The runtime should auto-convert when ingesting Markdown:

```js
// In the runtime's Markdown pipeline:
text = text.replace(/(\w)'(\w)/g, '$1’$2'); // 'tis → ’tis
text = text.replace(/"([^"]+)"/g, '“$1”'); // "hi" → “hi”
text = text.replace(/(\d+) ?- ?(\d+)/g, '$1–$2'); // 47-52 → 47–52
text = text.replace(/-- ?/g, '— '); // -- → —
text = text.replace(/\.\.\./g, '…'); // ... → …
```

This is a RUNTIME concern; the typography skill ships the *expected
output* (smart punctuation), the runtime handles the conversion.

## Why the agent should use the Unicode characters directly

Putting the right Unicode character in markup:

1. Renders correctly in every browser (the Unicode is universal).
2. Renders correctly in every PDF export (the Unicode survives).
3. Copies correctly when the reader copies text.
4. Is searchable correctly (find-in-page finds the right text).
5. Is screen-reader correct (the screen reader reads the right
   character).

Putting ASCII straight quotes and hoping for CSS conversion:
1. Fails when the CSS doesn't apply (loading delay).
2. Fails when the page is exported to PDF / image.
3. Fails when copied (the user gets straight quotes).
4. Fails for search and screen readers.

ALWAYS use the right Unicode character.

## Tokens consumed / extended

- **Consumes:** nothing — punctuation is a markup decision.
- **Extends:** nothing.

## The `.vc-no-smart-quotes` utility

For *code-like* text where straight quotes are correct (programming
literals, regex patterns):

```css
.vc-no-smart-quotes {
  /* Prevent CSS auto-conversion from applying. */
  /* (The typography skill doesn't ship auto-conversion, so this is
     a no-op in the typography layer; the utility exists for the
     runtime's Markdown pipeline to respect.) */
}
```

Usage:

```html
<p>The bash command is <code class="vc-no-smart-quotes">echo "hello"</code></p>
```

The `<code>` already preserves straight quotes (code shouldn't be
smart-converted); the `.vc-no-smart-quotes` class is a marker for
the runtime's conversion pipeline.

## The hairspace and thinspace — the fine details

For *very* polished typography:

| Character | Use |
|---|---|
| Hair space ( ) | Tightest space — used between an em-dash and adjacent letters |
| Thin space ( ) | Slightly wider — used in unit suffixes (47 m, 99 %) |
| Non-breaking space ( ) | Prevents line break — used in "Mr. Smith" |
| Non-breaking hyphen (‑) | Like - but doesn't break |

The typography skill doesn't *enforce* hairspace use — it's editorial
polish for high-end deliverables. Reference here for the agent's
consideration.

## Light + dark — orthogonal

Punctuation rendering is theme-independent. No colour, no theme.

## Selection-contract conformance

Punctuation is INLINE — never a typography atom. The parent element
owns the decision-mini-pill.

## When to ignore the conventions

- **Code blocks** — preserve straight quotes (code's semantic).
- **Technical IDs** — port "5432", not "5432" (the curly version).
- **URLs** — `https://example.com/--with-flags` (preserve as-is).
- **User input echoed back** — what the user typed is correct; don't
  edit their punctuation.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with the four conventions applied.
2. Copy text from the page; paste into a plain-text editor; verify
   the copied text contains the Unicode characters (`’`, `—`, `…`,
   `"`, `"`).
3. Search for the Unicode characters in browser find (Cmd+F); verify
   find works.
4. Test screen reader: confirm `“` is read as "left quote" not as
   "quotation mark".
5. Print the page; confirm punctuation renders identically.

## Cross-references

- [language-and-locale.md](./language-and-locale.md) — `<q lang>`
  drives the per-language quote glyphs.
- [emphasis-and-strong.md](./emphasis-and-strong.md) — sibling
  inline-typography contracts.
- [pull-quote-and-blockquote.md](./pull-quote-and-blockquote.md) —
  blockquote uses the curly-quote convention.
- `prose-pages` skill — owns the Markdown-to-HTML pipeline that may
  auto-convert straight to curly.
