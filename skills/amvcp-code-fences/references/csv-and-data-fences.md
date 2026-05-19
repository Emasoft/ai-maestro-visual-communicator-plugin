# Sub-technique H3 — CSV / TSV / JSON data fences (when a `<pre>` is data, not code)

## Table of Contents

- [H3.1 The "is this code or data?" question](#h31-the-is-this-code-or-data-question)
- [H3.2 JSON (data, but typically declared as `language-json`)](#h32-json-data-but-typically-declared-as-language-json)
- [H3.3 YAML (data, often declared as `language-yaml`)](#h33-yaml-data-often-declared-as-language-yaml)
- [H3.4 CSV / TSV](#h34-csv--tsv)
- [H3.5 TOML / INI](#h35-toml--ini)
- [H3.6 Diff data](#h36-diff-data)
- [H3.7 The "is this fence DATA-WITH-PROVENANCE?" check](#h37-the-is-this-fence-data-with-provenance-check)
- [H3.8 The "is this fence SAMPLE OUTPUT?" check](#h38-the-is-this-fence-sample-output-check)
- [H3.9 The "raw data dump" fallback](#h39-the-raw-data-dump-fallback)
- [H3.10 The selection model](#h310-the-selection-model)
- [H3.11 The runtime's class-language separation](#h311-the-runtimes-class-language-separation)
- [H3.12 Author rules](#h312-author-rules)
- [H3.13 No tokens consumed (this reference)](#h313-no-tokens-consumed-this-reference)
- [H3.14 Cross-references](#h314-cross-references)

When a `<pre>` contains DATA — CSV rows, TSV cells, JSON-as-text,
YAML config — not source code, the author still uses `<pre><code>`
but with specific language tags + the right authoring attitude. This
reference clarifies the boundary.

## H3.1 The "is this code or data?" question

| Sign it's CODE | Sign it's DATA |
|---|---|
| File extension is `.py`, `.ts`, `.js`, `.sql`, `.sh` | File extension is `.csv`, `.tsv`, `.json`, `.yaml`, `.toml` |
| Reader's intent: read the LOGIC | Reader's intent: read the VALUES |
| Lines contain control flow, function calls, declarations | Lines contain key/value pairs, comma-separated values, tabular data |
| The user is expected to MODIFY it | The user is expected to PASTE it elsewhere |
| Syntax color helps READABILITY | Syntax color helps TYPE DISCRIMINATION (string vs number vs bool) |

Both are valid for `<pre><code>`. The difference is which language tag
and how to author the content.

## H3.2 JSON (data, but typically declared as `language-json`)

The most common data fence:

```html
<pre><code class="language-json">{
  "feature_x": true,
  "rollout_pct": 20,
  "buckets": {
    "free":  { "rpm": 60,  "burst": 10 },
    "pro":   { "rpm": 600, "burst": 100 }
  }
}</code></pre>
```

The tokenizer's `json` mode colours:
- `string` (the key names and string values, in olive)
- `number` (the numeric values, in warm gold)
- `constant` (`true`, `false`, `null`, in purple — same as keywords)
- `punctuation` (`{`, `}`, `[`, `]`, `,`, `:`)

NO keywords, NO function calls, NO types — JSON has none. The result
is clean colour discrimination: strings vs numbers vs booleans vs
structure.

## H3.3 YAML (data, often declared as `language-yaml`)

YAML is NOT one of the 7 registered languages in the tokenizer. The
runtime's options:

1. **Declare `language-yaml`** → tokenizer returns null → block
   renders plain. Gutter / copy / selection all work. Acceptable
   degradation.

2. **Use no language declaration** → same result, slightly clearer
   intent (the author signals "I don't expect syntax color").

3. **Use `language-json` for YAML** → wrong language; integrity probe
   would reject every line that has YAML-specific syntax. DON'T DO
   THIS.

Future runtime versions may add YAML as a registered language. Until
then, plain rendering is the correct path.

## H3.4 CSV / TSV

Same as YAML — not a registered language. Declare `language-csv` and
get plain rendering, OR omit the language tag.

For CSV specifically, a richer rendering exists: the
`amvcp-tables` skill's `data-ve-table` mode parses CSV-like text into
an actual `<table>` with sortable columns. If the data is genuinely
tabular AND the reader should INTERACT with it, use a table.

For "raw CSV that should be copied verbatim", a `<pre><code>` is correct.

## H3.5 TOML / INI

Same pattern. Not registered, plain render. The runtime's chrome
(gutter, copy, selection) still works.

## H3.6 Diff data

A `language-diff` block IS code-with-data — the markers (`+`, `-`,
`@@`) are syntax, the lines themselves are data. The tokenizer's
`diff` mode colours the markers; the diff-block CSS adds row tints. See
[diff-blocks-unified.md](../../amvcp-code-diff/references/diff-blocks-unified.md).

## H3.7 The "is this fence DATA-WITH-PROVENANCE?" check

Even when a `<pre>` is data, it might still benefit from the file-path
label pattern (see [code-block-with-file-path.md](../../amvcp-code-syntax/references/code-block-with-file-path.md)) — e.g. "here's the `limits.yaml` content from
production":

```html
<div class="ve-code-block ve-code-panel-slate">
  <div class="ve-code-path">
    <span class="ve-code-path__name">infra/config/limits.yaml</span>
  </div>
  <pre><code class="language-yaml">…</code></pre>
</div>
```

The file-path label tells the reader "this is the actual content of
the file" — high-value provenance, regardless of whether the content
is code or data.

## H3.8 The "is this fence SAMPLE OUTPUT?" check

If the `<pre>` contains output from running a command / API call (e.g.
a `curl` response, a test log line), it's neither code nor data —
it's SAMPLE OUTPUT, and the semantically correct element is `<samp>`,
not `<code>`:

```html
<pre><samp>$ curl -X POST https://api.example.com/users -d '{"name":"sarah"}'
{"id": 12345, "name": "sarah", "created_at": "2026-04-21T18:30:12Z"}
HTTP/1.1 201 Created</samp></pre>
```

The runtime's `initCodeGutter` looks for a `<code>` element inside
the `<pre>` — finding `<samp>` instead, it falls through and uses the
`<pre>` directly. Gutter / copy still work. No tokenizer (since
there's no `language-*` to detect).

## H3.9 The "raw data dump" fallback

For arbitrary blob data (e.g. a base64-encoded binary, a really long
URL), `<pre>` works but `data-ve-no-gutter` is a good signal that this
is OPAQUE data the reader shouldn't try to syntax-parse:

```html
<pre data-ve-no-gutter><code>iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAA…</code></pre>
```

No gutter, no copy button. Reader can still drag-select if they need
to copy.

## H3.10 The selection model

Whether the fence is code or data, the runtime's selection model
(per-line atoms, drag-paint, copy) works identically. The reader can
select lines in a CSV, comment "this row shows the bug", and the
agent receiving the comment knows the line + content + (where present)
the file-path label.

This is critical for data fences in postmortems and PR reviews —
the comment-on-data UX is the same as comment-on-code UX.

## H3.11 The runtime's class-language separation

The tokenizer's `langFromClassName` accepts any `language-<id>` /
`lang-<id>` class — including unregistered languages. Unregistered
returns `null`, the block renders plain.

This means: you CAN write `class="language-rust"` even though Rust
isn't registered. The class is honoured for FUTURE registration —
when Rust is added, your fixture automatically gets syntax color.
No fixture rewrite needed.

## H3.12 Author rules

| Rule | Why |
|---|---|
| Use `language-json` for JSON | Registered; tokenizer colors strings/numbers/booleans/structure |
| Use `language-yaml` / `language-toml` / `language-csv` even though they're not registered | Future-proof; visible intent |
| Use `language-diff` for unified diffs | Registered; gets row tints automatically |
| Use `<samp>` (NOT `<code>`) for sample output | Semantic correctness |
| Use `data-ve-no-gutter` for opaque blobs | Signals "don't try to read this" |
| Pair data fences with file-path label when the data IS the file's content | Provenance |
| If the data is genuinely tabular AND interactive → use `amvcp-tables` instead | The right tool for the job |

## H3.13 No tokens consumed (this reference)

Data fences consume whatever language palette the runtime provides
based on their language declaration — no new tokens here.

## H3.14 Cross-references

- [language-resolution.md](../../amvcp-code-syntax/references/language-resolution.md) — registered
  language ids and aliases
- [code-block-with-file-path.md](../../amvcp-code-syntax/references/code-block-with-file-path.md) —
  file-path label for provenance
- [opting-out-pre.md](./opting-out-pre.md) — when to fully opt out
- `amvcp-tables` `data` mode — when CSV should be a real table
