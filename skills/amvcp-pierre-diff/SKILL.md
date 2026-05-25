---
name: amvcp-pierre-diff
description: "High-fidelity code diff viewer (vendored Pierre @pierre/diffs) — Shiki syntax highlight, split/unified layout, line virtualizer, line comments, accept/reject UI, merge-conflict resolver, streaming code. Use when the user wants a full-featured visual diff that exceeds the lightweight amvcp-code-diff: PR review, huge files, merge conflicts, streaming code. Trigger with 'pierre diff', 'rich diff viewer', 'huge file diff', 'merge conflict viewer'."
license: Apache-2.0
compatibility: "Any modern browser supporting Custom Elements v1 + CSSStyleSheet.replaceSync (Chromium 79+, Safari 16.4+, Firefox 101+). Pure ESM, no npm runtime dependency — single bundled `amvcp-pierre-diff.mjs` (~10 MB raw / ~1.8 MB gzipped). Bundle weight is dominated by Shiki's TextMate grammars and themes; lazy-load the script tag only on pages that actually mount a `<diffs-container>`."
metadata:
  author: Emasoft
  upstream_source: "https://github.com/pierre-computer-company/diffs-js (packages/diffs)"
  upstream_license: "Apache-2.0"
  upstream_version: "1.2.1"
---

# Pierre Diff Viewer

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Lightweight alternative:** [`skills/amvcp-code-diff/SKILL.md`](../amvcp-code-diff/SKILL.md) — plain CSS twin-column diff (no Shiki, no virtualizer); pick that one for small inline diffs in a larger report.

## Overview

Vendored copy of [Pierre Computer Company's diff viewer](https://github.com/pierre-computer-company/diffs-js) (`@pierre/diffs` 1.2.1, Apache-2.0) bundled as a single browser ESM. Provides:

- Syntax-highlighted diff rendering via Shiki (every TextMate grammar Shiki ships — TS, JS, Python, Rust, Go, Swift, Kotlin, C, C++, Java, Markdown, HTML, CSS, SQL, etc.)
- **Split** (side-by-side) or **stacked** (unified) layout
- Line **virtualizer** for huge files — only the visible viewport's rows mount
- Inline annotation / comment / accept-reject UI (the agent injects line markers, the user clicks)
- Streaming code support (FileStream) — show code as it's being generated
- Merge conflict viewer (UnresolvedFile) — three-way merge with resolve regions
- Light + dark theme (Pierre's own themes, registered alongside any Shiki theme)

**What this skill owns.** The `<diffs-container>` web component scaffold, the Pierre instance lifecycle (`new FileDiff(...)`, `instance.render(...)`, `instance.dispose()`), the wrapping decisions (unified vs split, wrap-lines, virtualizer-or-not), the theme handoff (Pierre's `pierre-dark` / `pierre-light` mapped onto our DESIGN.md `--vc-theme`), the per-line annotation contract for comments + suggested-changes.

**What this skill does NOT own.** Lightweight CSS-only diff blocks (→ [`amvcp-code-diff`](../amvcp-code-diff/SKILL.md)). The patch parser when you already have hunks (Pierre's `parseDiffFromFile` does that internally). The PR-review page chrome (header bar, reviewer avatars, etc.) — that's still [`amvcp-code-diff`'s pr-review-page reference](../amvcp-code-diff/references/pr-review-page.md); Pierre slots INTO that chrome as the per-file diff body.

For the full PR-review chrome TOC the agent must discover via the
linked file:

- [pr-review-page](../amvcp-code-diff/references/pr-review-page.md)
 > E3.1 The shape · E3.2 The header · E3.3 The risk-map chips · E3.4 The per-file diff card · E3.5 The comment bubble — `::before` rotated-square trick · E3.6 Anchoring comments to line numbers · E3.7 Collapsed safe files · E3.8 The next-steps checklist · E3.9 Cross-references · E3.10 Light + dark verification · E3.11 Tokens consumed · E3.12 Mined source attribution

**When to pick this over amvcp-code-diff.**

| Pick `amvcp-pierre-diff` when… | Pick `amvcp-code-diff` when… |
|---|---|
| File is ≥ ~500 lines and you need the virtualizer | Inline diff is small (≤ 100 lines) |
| You want Shiki-quality syntax highlighting | The page already uses `amvcp-code-syntax` and you want a single highlighting stack |
| You need merge-conflict resolution (`<<<<<<<`, `=======`, `>>>>>>>`) | A simple add/del/ctx tint is enough |
| You're rendering a streaming-code preview | The diff is static and finished |
| Bundle weight is not a concern (~1.8 MB gz) | Lighter weight matters more than features |

## Prerequisites

- `<script type="module" src="amvcp-pierre-diff.mjs"></script>` injected into the page **before** the first `<diffs-container>` element. The script side-effect-registers the `<diffs-container>` custom element via `customElements.define`.
- `amvcp-runtime.js` injected (for the selection-atom contract — Pierre's per-line markers are wrapped with `data-ve-id` / `data-ve-type` / `data-ve-label` so they participate in the same multi-select payload as every other AMVCP visual).
- `:root { --ve-accent: <colour>; }` set per the base contract (Pierre reads it for the selection-highlight colour).
- DESIGN.md must expose `--vc-theme: light|dark` — the renderer flips Pierre's theme to match.

## Instructions

1. For each file you want to diff, emit a `<diffs-container data-ve-id="diff-<n>"></diffs-container>` wrapper.
2. After the runtime mounts, run the per-instance JS inside an inline `<script type="module">`:

   ```html
   <diffs-container data-ve-id="diff-1"></diffs-container>
   <script type="module">
     import { FileDiff, parseDiffFromFile } from './amvcp-pierre-diff.mjs';

     const oldContent = `…the pre-image…`;
     const newContent = `…the post-image…`;
     const patch = parseDiffFromFile(oldContent, newContent, 'src/foo.ts');

     const instance = new FileDiff({
       container: document.querySelector('[data-ve-id="diff-1"]'),
       patch,
       options: {
         layout: 'split',          // or 'stacked' (unified)
         wrap: false,               // turn ON for prose-heavy diffs
         theme: { dark: 'pierre-dark', light: 'pierre-light' },
         lang: 'typescript',
       },
     });
     await instance.render();
   </script>
   ```

3. To annotate (line comments, accept/reject UI, etc.), pass `lineAnnotations` into the options — see [annotation-contract](./references/annotation-contract.md) for the schema.
4. Open with `scripts/amvcp-select.py <file.html>` — never `open` / `xdg-open` directly. The runner picks a free localhost port, launches Chromium in `--app=URL`, waits for the user's Submit click, captures the selection payload.
5. On Submit, read the multi-select payload; each clicked line lands as `{kind:"pierre-diff-line", file, lineOld?, lineNew?, content, side: 'add' | 'del' | 'ctx'}`.

## Output

Per-line entry pushed into `selections[]`:

```json
{
  "kind": "pierre-diff-line",
  "diffId": "diff-1",
  "file": "src/foo.ts",
  "side": "add",
  "lineOld": null,
  "lineNew": 42,
  "content": "  return value + 1;",
  "annotation": null
}
```

When the user adds an inline comment via the Pierre annotation UI, the entry's `annotation` field carries the typed text.

## Error Handling

- **Bundle not loaded:** `customElements.get('diffs-container') == null` → throw a loud error before mounting any container; the renderer must check this and inject the `<script type="module">` if missing.
- **Bad patch input:** Pierre's `parseDiffFromFile` throws on malformed unified-diff input; catch and degrade to plain text inside the container.
- **Shiki language not bundled:** the requested language isn't in Shiki's default bundle — the highlighter falls back to plain text, no exception.

## Examples

**Input:** "Render this PR with Pierre — it's a 2000-line refactor of the authentication module."

**Output:** one HTML file with `<diffs-container>` per changed file, each wired up via inline `<script type="module">` calling `new FileDiff(...)`. The virtualizer keeps the page responsive even on huge diffs. The user clicks individual lines or comment bubbles → multi-select payload returned.

## Resources

- [annotation-contract](./references/annotation-contract.md) — schema for `lineAnnotations` / `diffLineAnnotations`
 > Schema · Anchoring rules · Discriminator field — what the agent emits, what the user clicks · Wiring annotations into the page · Selection payload shape · Author / theme integration · Cross-references
- [layout-choice](./references/layout-choice.md) — split vs stacked decision tree
 > Decision table · Inheriting the page's design tokens · Tradeoffs vs amvcp-code-diff
- [streaming-codeview](./references/streaming-codeview.md) — `FileStream` for live-generated code
 > When to pick FileStream over FileDiff · Minimal example · Append semantics · Performance — when to virtualize · Cursor & input · Stream + annotations · Selection payload · Cross-references
- [merge-conflict](./references/merge-conflict.md) — `UnresolvedFile` for `<<<<<<<` resolution
 > When to use · Minimal example · Resolution UI · Three-way (diff3) conflict markers · Selection / Submit payload · Streaming resolution to the agent · Performance · Cross-references
- [virtualizer-tradeoffs](./references/virtualizer-tradeoffs.md) — when to enable `VirtualizedFileDiff`
 > Quick decision · Feature parity matrix · When to opt OUT of virtualizer · When to opt IN to virtualizer · Composition with the no-nested-scrollbars rule · Overscan tuning · Selection contract · Cross-references

## Upstream attribution

This skill ships a vendored copy of Pierre Computer Company's
`@pierre/diffs` 1.2.1 under the Apache 2.0 licence. See
[`vendor/pierre-diffs/LICENSE.md`](../../vendor/pierre-diffs/LICENSE.md)
for the full licence text and
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md#pierre-diffs)
for the attribution entry.

Local modifications to the vendored source are limited to (all
paths below are RELATIVE to `vendor/pierre-diffs/` — not to the
plugin root):

1. `vendor/pierre-diffs/package.json` — replaced workspace `catalog:` refs with explicit version pins; dropped the React / SSR / Worker entry points; dropped jsdom / arethetypeswrong / react devDeps (we only build the vanilla-JS bundle).
2. The Shiki shared-highlighter module — mapped `@pierre/theme/pierre-{dark,light}-soft` (1.x-only) to `pierre-{dark,light}-vibrant` (the 0.0.29 equivalent we pin against bun's minimum-release-age policy).
3. `vendor/pierre-diffs/tsconfig.json` — removed the `extends: '../../tsconfig.options.json'` reference (monorepo parent doesn't ship with the vendored copy).
4. `vendor/pierre-diffs/scripts/bundle.mjs` — NEW (not from upstream). Single-file esbuild bundler that produces the browser-direct `index.mjs` bundle under `vendor/pierre-diffs/dist-bundle/`. Released under the project's own MIT licence.

The upstream `dist/` build artefacts are NOT vendored — we produce our own browser bundle from the upstream source via the steps above.
