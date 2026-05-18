# 20 — Layout: `code-focus` (heading + one centred code block)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — snippet selection](#authoring-rules--snippet-selection)
- [Visual verification](#visual-verification)
- [Languages tested on `lang` field](#languages-tested-on-lang-field)
- [Diff-style snippets](#diff-style-snippets)
- [Source provenance](#source-provenance)

The code-focus slide gives ONE code snippet the centre of attention. A
heading at the top names the snippet's role; a code block (delegated to
`amvcp-codeblock.js`) fills the rest of the stage with line-numbered
syntax-highlighted source. No bullets, no second code block, no chart.

The slide is "look at this code" — the snippet should be ≤ 10 lines,
should be self-contained (no `…` skip markers), and should be the LITERAL
hot path the talk is discussing. Pseudocode loses the impact; show the
real source the team committed.

## What this is

`layout: "code-focus"` builds a slide with:

- One required `heading` block (the snippet's role).
- One required `code` block (delegated to `window.amvcpCodeBlock`).
- One optional `callout` block below (a one-line "look at the X" note).

The renderer applies `vsd-layout-code-focus` to the section; the layout
CSS centres the code block on the stage with a max-width that keeps
lines readable at projection scale.

A `code` block has:

```jsonc
{ "type": "code",
  "lang": "rust",        // optional — for syntax highlighting
  "source": "fn handle(req: Request) -> Response {\n    cache.get(req.key).unwrap_or_else(|| { … })\n}"
}
```

The renderer delegates to `window.amvcpCodeBlock.renderInto(host,
{lang, source})`; if the sibling module is missing, the renderer
THROWS with a clear message — never a blank placeholder.

## Scaffold to emit

Basic:

```jsonc
{ "layout": "code-focus",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "The hot-path rewrite." },
    { "type": "code",
      "lang": "rust",
      "source": "fn handle(req: Request) -> Response {\n    let key = req.derive_key();\n    cache.get_or_insert(key, || db.fetch(req))\n}" }
  ]
}
```

With a callout annotation:

```jsonc
{ "layout": "code-focus",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Per-key TTL is one line." },
    { "type": "code",
      "lang": "rust",
      "source": "cache.set(key, value, ttl_for(&key));" },
    { "type": "callout", "variant": "tip",
      "text": "ttl_for() reads the per-key config; defaults to 60s." }
  ]
}
```

Bigger snippet (still ≤ 10 lines):

```jsonc
{ "layout": "code-focus",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Eviction now prefers stale-while-revalidate." },
    { "type": "code",
      "lang": "rust",
      "source": "match cache.get(key) {\n    Hit(value) => Response::ok(value),\n    Stale(value) => {\n        tokio::spawn(refresh(key));\n        Response::ok(value)\n    }\n    Miss => Response::from(db.fetch(key).await?),\n}" }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — for the `code` block, delegates.
- `renderDelegated(doc, block, "code")` — calls
  `window.amvcpCodeBlock.renderInto(host, {lang, source})`. Throws
  with `"amvcp-slide: block type \"code\" needs the code-block
  (amvcp-codeblock.js) renderer module, but
  window.amvcpCodeBlock.renderInto is not available"` if the sibling
  module is missing.

## DESIGN.md tokens used

The code block themes off `amvcp-codeblock.js`'s own token contract
(see the `amvcp-code-highlight` skill for that layer). The slide
layer contributes:

| Token | Default | What it themes on code-focus |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Slide heading. |
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background (behind the code block's own card). |
| `--vc-color-callout-tip-bg` | `#f0f7f0` / `#1a2e1a` | Optional annotation callout. |
| `--vc-font-mono` | `ui-monospace, monospace` | Code typeface (the code block reads this directly). |
| `--vc-text-code` | `18 px` | Code text size at presentation scale. |
| `--vc-space-5` | `32 px` | Heading-to-code gap. |

## Selection / comment / decision-mini contract notes

The code-focus slide is one selectable atom. The code block inside
is rendered by `amvcp-codeblock.js`; that module may stamp its own
`data-ve-id` on its container — that's the code-block layer's
concern. The slide-level selection ring paints around the whole
slide.

## When to use this reference

Open this ref when:

- The talk's argument hinges on ONE specific snippet of source.
- A function signature deserves a moment ("look at the new
  signature").
- A 3-line config change is the entire feature ("we added one line
  here").

## Don'ts

- Don't put more than 10 lines of code on a code-focus slide. At
  18 px on the stage, 10 lines fits comfortably; 12+ lines starts
  to require eye-darting. Split into two code-focus slides if the
  snippet is genuinely long.
- Don't use `…` or `// …` skip markers. The point of code-focus is
  showing the LITERAL source; a snippet with redactions reads as
  "I don't trust the audience to read this".
- Don't put two code blocks on one slide. Two code blocks = two
  arguments = two slides. The 1-code-block-per-slide rule is the
  whole point of the layout.
- Don't use code-focus for shell commands / one-liners — those are
  `content` slide bullets, not code-focus.

## Authoring rules — snippet selection

The strongest code-focus snippets are:

1. Real source committed to the repo (not pseudocode).
2. ≤ 10 lines, self-contained (no `…` / `/* ... */` redactions).
3. The actual hot path the talk references (not a representative
   example).
4. Syntax-highlightable (`lang` field set, even if the lang is
   `plaintext` — the renderer can theme plain text uniformly).

If the snippet needs more context to make sense, the slide is wrong
for the content — the audience won't read 30 lines of setup code
during a 60-second slide.

## Visual verification

After authoring a code-focus slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top (~15% of the stage); the code block
   fills the bottom 75%.
2. The code block is centred horizontally with a max-width that
   keeps lines readable (~900 px on the stage).
3. Syntax highlighting is visible (function names, keywords,
   strings in distinct colours).
4. Line numbers are visible (the code-block renderer's standard
   output).
5. Console reports zero "amvcp-codeblock.js not loaded" errors.

## Languages tested on `lang` field

The `lang` field is passed through to `amvcp-codeblock.js` for
syntax highlighting. The code-block module accepts:

| Lang | What it highlights |
|---|---|
| `javascript` / `js` | JavaScript / TypeScript-ish. |
| `typescript` / `ts` | TypeScript-specific (interfaces, generics). |
| `rust` | Rust. |
| `python` / `py` | Python. |
| `go` | Go. |
| `c` / `cpp` / `c++` | C / C++. |
| `java` | Java. |
| `kotlin` | Kotlin. |
| `swift` | Swift. |
| `ruby` | Ruby. |
| `php` | PHP. |
| `bash` / `sh` | Shell. |
| `sql` | SQL. |
| `json` | JSON. |
| `yaml` / `yml` | YAML. |
| `xml` / `html` | XML / HTML. |
| `css` | CSS. |
| `markdown` / `md` | Markdown. |
| `plaintext` / `text` | No highlighting; uniform mono. |

For a language not in the list, pass `lang: "plaintext"` — the code
renders in mono without colour, which is preferable to no highlight
at all.

## Diff-style snippets

For BEFORE/AFTER code, use the `comparison` layout with two
`code-focus` slides one after another, OR (in the future) a `diff`
block type. The current contract has NO `diff` block; until it
exists, the two-slide approach is the canonical pattern:

```jsonc
{ "layout": "code-focus",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Before — global TTL." },
    { "type": "code", "lang": "rust",
      "source": "cache.set(key, value, GLOBAL_TTL);" }
  ]
},
{ "layout": "code-focus",
  "blocks": [
    { "type": "heading", "level": 2, "text": "After — per-key TTL." },
    { "type": "code", "lang": "rust",
      "source": "cache.set(key, value, ttl_for(&key));" }
  ]
}
```

Two consecutive `code-focus` slides with parallel headings let the
audience compare the snippets via `←` / `→` navigation.

## Source provenance

- SL-04 — Folio "Code Focus" pattern (one snippet, centre stage).
- `slide-patterns.md` lines 911-966 spec the canonical code slide:
  18 px mono on recessed background, max-width 900 px, floating
  filename label.
- The delegate-to-sibling-module convention is the slide-spec's
  fail-fast rule (`renderDelegated` throws naming the missing
  module — never a blank placeholder).
- The "≤ 10 lines" rule is from the density table at lines 1206-1217
  of `slide-patterns.md`.
