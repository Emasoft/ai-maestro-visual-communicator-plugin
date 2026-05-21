// Single-file bundler for the vendored Pierre diff viewer.
//
// Input:  a synthetic entry that re-exports everything from src/index.ts AND
//         executes the side-effect from src/components/web-components.ts
//         (which registers the <diffs-container> custom element).
//
// Output: dist-bundle/amvcp-pierre-diff.mjs — single self-contained ESM
//         that the plugin's renderer references via
//         <script type="module" src="amvcp-pierre-diff.mjs"></script>.
//
// Build deps (declared in this folder's package.json):
//   esbuild  — JS/TS bundling, ESM output, browser platform
//
// Run with: bun run build:bundle  (after `bun install` in this folder).

import { build } from 'esbuild';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const OUTDIR = resolve(ROOT, 'dist-bundle');

if (existsSync(OUTDIR)) {
  rmSync(OUTDIR, { recursive: true });
}
mkdirSync(OUTDIR, { recursive: true });

// Synthetic entry — combines the named-export surface (src/index.ts) with
// the side-effect that registers the custom element. Esbuild's bundler
// follows both, so the single output file does both jobs.
const ENTRY = resolve(OUTDIR, 'entry.ts');
writeFileSync(
  ENTRY,
  [
    "// AUTO-GENERATED — written by scripts/bundle.mjs, NOT vendored upstream.",
    "import '../src/components/web-components.ts';",
    "export * from '../src/index.ts';",
    '',
  ].join('\n'),
  'utf8',
);

await build({
  entryPoints: [ENTRY],
  bundle: true,
  format: 'esm',
  target: ['es2022'],
  platform: 'browser',
  outfile: resolve(OUTDIR, 'index.mjs'),
  loader: {
    '.css': 'text', // CSS imports return the raw text (Pierre's runtime uses CSSStyleSheet)
  },
  sourcemap: false,
  minify: true,
  legalComments: 'none',
});

// Clean up the synthetic entry; the bundle is self-contained.
rmSync(ENTRY);

console.log('[bundle] built →', resolve(OUTDIR, 'index.mjs'));
