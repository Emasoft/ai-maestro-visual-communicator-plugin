// test-pierre-diff.js
//
// Dev-browser script (QuickJS sandbox) — exercises the vendored Pierre
// diff viewer (scripts/amvcp-pierre-diff.mjs).
//
// Each test function is named, has a one-line docstring, and prints
// exactly one line:
//
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>
//
// The Python orchestrator (run-tests.py) parses these lines into a
// Unicode-bordered table.
//
// Pre-conditions:
//   - HTTP server up on http://127.0.0.1:8767/ serving tests/fixtures/
//   - amvcp-pierre-diff.mjs siblinged with the fixture HTML (run-tests.py
//     handles the sync; tests soft-skip when the bundle is absent — run
//     `bun install && bun run build:bundle` from vendor/pierre-diffs/
//     to produce it).

const FIXTURE = "http://127.0.0.1:8767/pierre-diff-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  // Wait for the dynamic import in the fixture to settle.
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => Boolean(window.__result));
    if (ready) return { ok: true };
    await page.waitForTimeout(80);
  }
  return { ok: false, error: "window.__result never appeared (bundle missing or import failed?)" };
}

async function bundleMissingSkip(page) {
  // First-time setup: if the bundle isn't present in fixtures/, the
  // dynamic import throws and __result never appears. Soft-skip the
  // whole suite with one ERROR line so the runner shows a single row
  // instead of a wall of "Target page closed" cascades.
  const headRes = await page.evaluate(async () => {
    try {
      const r = await fetch("./amvcp-pierre-diff.mjs", { method: "HEAD" });
      return r.status;
    } catch (e) {
      return -1;
    }
  });
  if (headRes !== 200) {
    record('pierre_diff_bundle_present', 'ERROR',
      'amvcp-pierre-diff.mjs must be siblinged with the fixture',
      `HEAD status ${headRes} — run \`cd vendor/pierre-diffs && bun install && bun run build:bundle && cp dist-bundle/index.mjs ../../scripts/amvcp-pierre-diff.mjs\``);
    return true;
  }
  return false;
}

async function testElementRegistered(page) {
  // The bundle's side-effect entry registers customElements.define('diffs-container', ...)
  // — without that, no <diffs-container> in the page renders anything.
  const ok = await page.evaluate(() => window.__result && window.__result.elementRegistered === true);
  record('pierre_diff_element_registered', ok ? 'PASS' : 'FAIL',
    'customElements.get("diffs-container") returns a constructor',
    ok ? '' : JSON.stringify(await page.evaluate(() => window.__result)));
}

async function testExportSurface(page) {
  // The bundle re-exports Pierre's full vanilla-JS API. Without these
  // names, the renderer that mounts a FileDiff would throw.
  const r = await page.evaluate(() => window.__result);
  const ok = r && r.exports > 100 &&
    r.hasFileDiff && r.hasParseDiffFromFile && r.hasParsePatchFiles &&
    r.hasCodeToHtml && r.hasVirtualizedFileDiff;
  record('pierre_diff_export_surface', ok ? 'PASS' : 'FAIL',
    'index.mjs exports FileDiff / parseDiffFromFile / parsePatchFiles / codeToHtml / VirtualizedFileDiff',
    JSON.stringify(r));
}

async function testTagNameConstant(page) {
  // The bundle's DIFFS_TAG_NAME constant must agree with the registered
  // custom element name. Drift between the two would silently break
  // any host that relies on the constant to query its containers.
  const r = await page.evaluate(() => window.__result);
  const ok = r && r.diffsTagName === 'diffs-container';
  record('pierre_diff_tagname_constant', ok ? 'PASS' : 'FAIL',
    'DIFFS_TAG_NAME constant === custom element name',
    `tagName=${r && r.diffsTagName}`);
}

async function testInstantiateFileDiff(page) {
  // The most basic real use: construct a FileDiff over a tiny patch.
  // We don't render to a shadow root here — just verify the constructor
  // accepts the documented options shape without throwing.
  //
  // Real signature: parseDiffFromFile(oldFile: FileContents, newFile: FileContents, opts?, throwOnError?)
  // where FileContents = { name: string, contents: string, header?: string,
  // cacheKey?: string }. The patch the upstream renderer expects is the
  // FileDiffMetadata returned by this function — never a raw {oldText, newText}.
  const summary = await page.evaluate(async () => {
    try {
      const P = window.__pierre;
      const oldFile = { name: "test.txt", contents: "alpha\nbeta\ngamma\n" };
      const newFile = { name: "test.txt", contents: "alpha\nBETA\ngamma\ndelta\n" };
      const patch = P.parseDiffFromFile(oldFile, newFile);
      const keys = Object.keys(patch);
      return {
        ok: true,
        patchType: typeof patch,
        keys: keys.slice(0, 15),
        hasName: Boolean(patch.name || patch.newName || patch.oldName),
      };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e).slice(0, 200) };
    }
  });
  const ok = summary.ok === true;
  record('pierre_diff_parse_smoke', ok ? 'PASS' : 'FAIL',
    'parseDiffFromFile({name,contents}, {name,contents}) returns a patch object',
    JSON.stringify(summary).slice(0, 220));
}

const tests = [
  testElementRegistered,
  testExportSurface,
  testTagNameConstant,
  testInstantiateFileDiff,
];

const page = await browser.getPage("pierre-diff-tests");

try {
  // Soft-skip when the bundle isn't present — fail loud once instead
  // of cascading "Target page closed" errors through every test.
  await page.goto(FIXTURE + "?bundle-check=" + Date.now(), { waitUntil: "domcontentloaded" });
  const skipAll = await bundleMissingSkip(page);
  if (!skipAll) {
    const s = await setup(page);
    if (!s.ok) {
      record('pierre_diff_fixture_loads', 'ERROR',
        'fixture page reaches __result-set state', s.error);
    } else {
      for (const t of tests) {
        try {
          await t(page);
        } catch (e) {
          record(t.name || 'unnamed', 'ERROR', t.name || '',
            String(e && e.message || e).slice(0, 120));
        }
      }
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
