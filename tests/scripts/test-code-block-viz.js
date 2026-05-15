// test-code-block-viz.js
//
// Dev-browser script — exercises the Phase-2 code-block syntax tokenizer
// (amvcp-code-highlight.js) and its --ve-code-* / .ve-tok-* CSS contract.
//
// The module is a STANDALONE unit: this suite loads the self-contained
// fixture code-highlight.html, which pulls in amvcp-designmd.js +
// amvcp-code-highlight.js + amvcp-code-highlight.css but NOT the runtime.
// The tokenizer is driven directly through window.amvcpCodeHighlight and
// the fixture's window.__veCodeFixture hook.
//
// The `-viz` filename suffix avoids any clash with the pre-existing
// tests/scripts/test-code-gutter.js (which tests the runtime gutter).
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/code-highlight.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name: name, status: status, desc: desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
}

// Decode a rendered HTML string back to plain text the way the module's
// integrity probe does — used to assert source fidelity from the test.
function decodeHtml(html) {
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// ── Tests ───────────────────────────────────────────────────────────

async function testKeywordHighlighted(page) {
  // A JS `const` / `function` / `return` keyword gets a ve-tok-keyword span.
  await setup(page);
  const html = await page.evaluate(() =>
    window.amvcpCodeHighlight.highlightLine('const x = 1; return x;', 'js'));
  const ok = html.indexOf('class="ve-tok-keyword">const') >= 0
    && html.indexOf('class="ve-tok-keyword">return') >= 0;
  record('code_viz_keyword', ok ? 'PASS' : 'FAIL',
    'JS keywords get ve-tok-keyword spans', html.slice(0, 120));
}

async function testStringNotReparsed(page) {
  // A JS keyword INSIDE a string keeps ve-tok-string — no nested keyword
  // span (stash precedence: the string is stashed before the keyword pass).
  await setup(page);
  const html = await page.evaluate(() =>
    window.amvcpCodeHighlight.highlightLine('var s = "for return loop";', 'js'));
  // Isolate the string span and assert it contains no keyword span.
  const si = html.indexOf('ve-tok-string');
  const inner = si >= 0 ? html.slice(si, html.indexOf('</span>', si)) : '';
  const ok = si >= 0 && inner.indexOf('ve-tok-keyword') < 0;
  record('code_viz_string_immune', ok ? 'PASS' : 'FAIL',
    'keyword inside a string is not re-tokenized', inner.slice(0, 120));
}

async function testCommentWholeLine(page) {
  // A `// …` line is one ve-tok-comment span; a `# …` Python line likewise.
  await setup(page);
  const res = await page.evaluate(() => {
    const H = window.amvcpCodeHighlight;
    return {
      js: H.highlightLine('// if x return y', 'js'),
      py: H.highlightLine('# def foo return', 'python')
    };
  });
  const ok = res.js.indexOf('ve-tok-comment') >= 0
    && res.js.indexOf('ve-tok-keyword') < 0
    && res.py.indexOf('ve-tok-comment') >= 0
    && res.py.indexOf('ve-tok-keyword') < 0;
  record('code_viz_comment', ok ? 'PASS' : 'FAIL',
    'a comment line is one comment span, no keywords inside',
    res.js.slice(0, 80));
}

async function testNumberAndOperator(page) {
  // 42 / 0xFF / 3.14e2 → ve-tok-number; => / && → ve-tok-operator.
  await setup(page);
  const html = await page.evaluate(() =>
    window.amvcpCodeHighlight.highlightLine('a => b && 0xFF + 3.14e2', 'js'));
  const ok = html.indexOf('ve-tok-number">0xFF') >= 0
    && html.indexOf('ve-tok-number">3.14e2') >= 0
    && html.indexOf('ve-tok-operator">=&gt;') >= 0
    && html.indexOf('ve-tok-operator">&amp;&amp;') >= 0;
  record('code_viz_number_operator', ok ? 'PASS' : 'FAIL',
    'numbers and operators get their token spans', html.slice(0, 140));
}

async function testPythonTripleString(page) {
  // A triple-quoted string spanning 3 lines stays one string across all 3
  // lines — highlightBlock threads the inside-triple-string carry state.
  await setup(page);
  const out = await page.evaluate(() => {
    const lines = [
      'text = """line one',
      'def not_a_keyword here',
      'done"""'
    ];
    return window.amvcpCodeHighlight.highlightBlock(lines, 'python');
  });
  // Middle line is wholly inside the triple string — `def` must NOT be a
  // keyword span; line 1 and line 3 both carry a string span.
  const ok = out.length === 3
    && out[1].indexOf('ve-tok-keyword') < 0
    && out[0].indexOf('ve-tok-string') >= 0
    && out[2].indexOf('ve-tok-string') >= 0;
  record('code_viz_triple_string', ok ? 'PASS' : 'FAIL',
    'a triple-quoted string spans 3 lines as one string',
    JSON.stringify(out).slice(0, 140));
}

async function testIntegrityProbeFallback(page) {
  // Feeding a deliberately broken language table (a regex whose capture
  // group is NOT a substring of match[0], so the offset math goes wrong)
  // must yield escapeHtml(src) byte-exact — no token spans, no lost chars.
  await setup(page);
  const res = await page.evaluate(() => {
    const H = window.amvcpCodeHighlight;
    // Register a broken table: punctuationRe captures "X" (never present)
    // so scanRegex computes a negative offset and corrupts the output —
    // the integrity probe must catch it and degrade to plain text.
    H.languages.__brokenviz = {
      id: '__brokenviz', aliases: [], lineComment: [], blockComment: null,
      tripleString: null, strings: [], keywords: [], builtinTypes: [],
      constants: [], numberRe: null, operatorRe: null,
      punctuationRe: /(X)?[0-9]/g
    };
    const src = 'abc 5 def 9 ghi';
    const out = H.highlightLine(src, '__brokenviz');
    delete H.languages.__brokenviz;
    return { src: src, out: out };
  });
  // Output must be byte-exact escapeHtml(src) and carry zero token spans.
  const ok = decodeHtml(res.out) === res.src
    && res.out.indexOf('ve-tok') < 0;
  record('code_viz_integrity_probe', ok ? 'PASS' : 'FAIL',
    'a broken language table degrades to byte-exact plain text',
    res.out.slice(0, 120));
}

async function testPlainWhenNoLang(page) {
  // The fixture's "plain" block has no data-ve-lang — zero ve-tok-* spans,
  // and its text is byte-exact (the < > & " characters survive).
  await setup(page);
  const res = await page.evaluate(() => {
    // The plain block is the .ve-code-block whose <pre> has no token spans.
    const blocks = document.querySelectorAll('.ve-code-block');
    let plain = null;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].getAttribute('data-ve-lang') === null
          && blocks[i].getAttribute('data-ve-code-diff') === null) {
        plain = blocks[i];
        break;
      }
    }
    if (!plain) return { found: false };
    return {
      found: true,
      hasTok: plain.querySelector('[class^="ve-tok-"]') !== null,
      // The fixture line 2 contains < > & " ' — verify they round-trip.
      text: plain.textContent.indexOf('< > &') >= 0
    };
  });
  const ok = res.found && !res.hasTok && res.text;
  record('code_viz_plain_no_lang', ok ? 'PASS' : 'FAIL',
    'a block with no language has no token spans, text byte-exact',
    JSON.stringify(res));
}

async function testHtmlTagAware(page) {
  // HTML highlighting: a tag name → ve-tok-tag, an attribute name →
  // ve-tok-attribute, an attribute value (string) → ve-tok-string.
  await setup(page);
  const html = await page.evaluate(() =>
    window.amvcpCodeHighlight.highlightLine(
      '<article class="post" data-id="42">', 'html'));
  const ok = html.indexOf('ve-tok-tag">article') >= 0
    && html.indexOf('ve-tok-attribute">class') >= 0
    && html.indexOf('ve-tok-attribute">data-id') >= 0
    && html.indexOf('ve-tok-string') >= 0;
  record('code_viz_html_tagaware', ok ? 'PASS' : 'FAIL',
    'HTML tags / attributes / values get the right token spans',
    html.slice(0, 140));
}

async function testCssSelectorAware(page) {
  // CSS highlighting: a property name → ve-tok-attribute, a #hex / number
  // value → ve-tok-number, an at-rule / !important → ve-tok-keyword.
  await setup(page);
  const res = await page.evaluate(() => {
    const H = window.amvcpCodeHighlight;
    return {
      prop: H.highlightLine('  color: #f6f3ec;', 'css'),
      imp: H.highlightLine('  .x { padding: 8px !important; }', 'css')
    };
  });
  const ok = res.prop.indexOf('ve-tok-attribute">color') >= 0
    && res.prop.indexOf('ve-tok-number">#f6f3ec') >= 0
    && res.imp.indexOf('ve-tok-keyword') >= 0;
  record('code_viz_css_selectoraware', ok ? 'PASS' : 'FAIL',
    'CSS properties / values / at-rules get the right token spans',
    res.prop.slice(0, 120));
}

async function testSourceFidelityAllLanguages(page) {
  // For EVERY language sample in the fixture, highlightBlock output must
  // round-trip byte-exact to the source — the core fail-fast guarantee.
  await setup(page);
  const res = await page.evaluate(() => {
    const fx = window.__veCodeFixture;
    const H = fx.H;
    const bad = [];
    const langs = Object.keys(fx.samples);
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[i];
      const langArg = (lang === 'plain') ? null : lang;
      const lines = fx.samples[lang];
      const out = H.highlightBlock(lines, langArg);
      for (let j = 0; j < lines.length; j++) {
        const decoded = String(out[j])
          .replace(/<[^>]*>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        if (decoded !== lines[j]) {
          bad.push(lang + ':' + (j + 1));
        }
      }
    }
    return bad;
  });
  const ok = res.length === 0;
  record('code_viz_source_fidelity', ok ? 'PASS' : 'FAIL',
    'every language sample round-trips byte-exact',
    ok ? 'all languages clean' : 'mismatch: ' + res.join(','));
}

async function testThemeMirror(page) {
  // Toggling data-ve-theme light <-> dark changes the computed
  // --ve-code-keyword value — proving both themes are wired in the CSS.
  await setup(page);
  const res = await page.evaluate(() => {
    const root = document.documentElement;
    function kw() {
      return getComputedStyle(root)
        .getPropertyValue('--ve-code-keyword').trim();
    }
    root.setAttribute('data-ve-theme', 'light');
    const light = kw();
    root.setAttribute('data-ve-theme', 'dark');
    const dark = kw();
    return { light: light, dark: dark };
  });
  const ok = res.light.length > 0 && res.dark.length > 0
    && res.light !== res.dark;
  record('code_viz_theme_mirror', ok ? 'PASS' : 'FAIL',
    'light and dark each define a distinct --ve-code-keyword',
    'light=' + res.light + ' dark=' + res.dark);
}

async function testTokenClassColored(page) {
  // A rendered .ve-tok-keyword span in the live page has a non-empty,
  // resolved color — the .ve-tok-* CSS rules actually apply.
  await setup(page);
  const res = await page.evaluate(() => {
    const span = document.querySelector('.ve-tok-keyword');
    if (!span) return { found: false };
    const color = getComputedStyle(span).color;
    return { found: true, color: color };
  });
  const ok = res.found && res.color
    && res.color !== 'rgba(0, 0, 0, 0)';
  record('code_viz_token_colored', ok ? 'PASS' : 'FAIL',
    'a ve-tok-keyword span resolves to a real color',
    JSON.stringify(res));
}

async function testDiffTints(page) {
  // The fixture's diff block: add/del/ctx lines carry data-ve-diff and the
  // add/del rows get a non-transparent --ve-code-diff-* background; the
  // +/- sign is a ::before pseudo, NOT part of the text content.
  await setup(page);
  const res = await page.evaluate(() => {
    const diff = document.querySelector('[data-ve-code-diff]');
    if (!diff) return { found: false };
    const add = diff.querySelector('.ve-diff-line[data-ve-diff="add"]');
    const del = diff.querySelector('.ve-diff-line[data-ve-diff="del"]');
    const ctx = diff.querySelector('.ve-diff-line[data-ve-diff="ctx"]');
    if (!add || !del || !ctx) return { found: false };
    const addBg = getComputedStyle(add).backgroundColor;
    const delBg = getComputedStyle(del).backgroundColor;
    // The +/- marker is ::before — the text node must NOT start with it.
    const addText = add.querySelector('.ve-code-content').textContent;
    return {
      found: true,
      addTinted: addBg !== 'rgba(0, 0, 0, 0)' && addBg !== 'transparent',
      delTinted: delBg !== 'rgba(0, 0, 0, 0)' && delBg !== 'transparent',
      markerNotInText: addText.charAt(0) !== '+'
    };
  });
  const ok = res.found && res.addTinted && res.delTinted
    && res.markerNotInText;
  record('code_viz_diff_tints', ok ? 'PASS' : 'FAIL',
    'diff add/del lines are tinted; +/- marker is a ::before pseudo',
    JSON.stringify(res));
}

async function testDiffSyntaxComposed(page) {
  // A diff line's code text is ALSO syntax-highlighted — the diff token
  // mode and the language highlighter compose. The fixture highlights the
  // diff bodies as JS, so an `add` line containing `const` carries a
  // ve-tok-keyword span.
  await setup(page);
  const res = await page.evaluate(() => {
    const diff = document.querySelector('[data-ve-code-diff]');
    if (!diff) return { found: false };
    const adds = diff.querySelectorAll('.ve-diff-line[data-ve-diff="add"]');
    let hasKw = false;
    for (let i = 0; i < adds.length; i++) {
      if (adds[i].innerHTML.indexOf('ve-tok-keyword') >= 0) hasKw = true;
    }
    return { found: true, hasKw: hasKw };
  });
  const ok = res.found && res.hasKw;
  record('code_viz_diff_syntax_composed', ok ? 'PASS' : 'FAIL',
    'diff line bodies are also syntax-highlighted',
    JSON.stringify(res));
}

async function testNoInnerScrollbar(page) {
  // No-nested-scrollbars: no .ve-code-block (or any descendant) may have
  // overflow:auto / scroll — wide code extends the page instead.
  await setup(page);
  const res = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.ve-code-block');
    const offenders = [];
    for (let i = 0; i < blocks.length; i++) {
      const all = blocks[i].querySelectorAll('*');
      const list = [blocks[i]];
      for (let j = 0; j < all.length; j++) list.push(all[j]);
      for (let k = 0; k < list.length; k++) {
        const cs = getComputedStyle(list[k]);
        const ox = cs.overflowX, oy = cs.overflowY;
        if (ox === 'auto' || ox === 'scroll'
            || oy === 'auto' || oy === 'scroll') {
          offenders.push(list[k].className || list[k].tagName);
        }
      }
    }
    return offenders;
  });
  const ok = res.length === 0;
  record('code_viz_no_inner_scrollbar', ok ? 'PASS' : 'FAIL',
    'no code block has an inner overflow:auto/scroll viewport',
    ok ? 'clean' : 'offenders: ' + res.join(','));
}

async function testGutterArchitectureIntact(page) {
  // The fixture builds the per-line-span architecture (.ve-code-line >
  // .ve-code-linenum + .ve-code-content) with the tokenizer's HTML INSIDE
  // .ve-code-content — the integration shape initCodeGutter will produce.
  // Verify: every line is a .ve-code-line, the content span holds the
  // token spans, and the line text still round-trips.
  await setup(page);
  const res = await page.evaluate(() => {
    const fx = window.__veCodeFixture;
    // The JS block is the first .ve-code-block with data-ve-lang="js".
    const block = document.querySelector('.ve-code-block[data-ve-lang="js"]');
    if (!block) return { found: false };
    const lines = block.querySelectorAll('.ve-code-line');
    const src = fx.samples.js;
    if (lines.length !== src.length) {
      return { found: true, lineCountOk: false,
        got: lines.length, want: src.length };
    }
    let allOk = true;
    for (let i = 0; i < lines.length; i++) {
      const content = lines[i].querySelector('.ve-code-content');
      const num = lines[i].querySelector('.ve-code-linenum');
      if (!content || !num) { allOk = false; break; }
      // The visible code text of the line (content span only) must equal
      // the source line — the gutter number lives in a separate span.
      if (content.textContent !== src[i]) { allOk = false; break; }
    }
    // At least one content span carries a token span (highlight is live).
    const hasTokens = block.querySelector(
      '.ve-code-content [class^="ve-tok-"]') !== null;
    return { found: true, lineCountOk: true, allOk: allOk,
      hasTokens: hasTokens };
  });
  const ok = res.found && res.lineCountOk && res.allOk && res.hasTokens;
  record('code_viz_gutter_architecture', ok ? 'PASS' : 'FAIL',
    'per-line spans intact; token HTML lives inside .ve-code-content',
    JSON.stringify(res));
}

async function testDetectLanguage(page) {
  // detectLanguage resolves data-ve-lang and language-*/lang-* classes,
  // honours aliases, and returns null for an undeclared / unknown <pre>.
  await setup(page);
  const res = await page.evaluate(() => {
    const H = window.amvcpCodeHighlight;
    function pre(html) {
      const d = document.createElement('div');
      d.innerHTML = html;
      return d.firstChild;
    }
    return {
      attr: H.detectLanguage(pre('<pre data-ve-lang="python"><code></code></pre>')),
      cls: H.detectLanguage(pre('<pre><code class="language-js"></code></pre>')),
      langCls: H.detectLanguage(pre('<pre class="lang-css"><code></code></pre>')),
      alias: H.detectLanguage(pre('<pre data-ve-lang="typescript"><code></code></pre>')),
      unknown: H.detectLanguage(pre('<pre data-ve-lang="klingon"><code></code></pre>')),
      none: H.detectLanguage(pre('<pre><code></code></pre>'))
    };
  });
  const ok = res.attr === 'python' && res.cls === 'js'
    && res.langCls === 'css' && res.alias === 'js'
    && res.unknown === null && res.none === null;
  record('code_viz_detect_language', ok ? 'PASS' : 'FAIL',
    'detectLanguage resolves attr/class/alias and fails to null',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testKeywordHighlighted,
  testStringNotReparsed,
  testCommentWholeLine,
  testNumberAndOperator,
  testPythonTripleString,
  testIntegrityProbeFallback,
  testPlainWhenNoLang,
  testHtmlTagAware,
  testCssSelectorAware,
  testSourceFidelityAllLanguages,
  testThemeMirror,
  testTokenClassColored,
  testDiffTints,
  testDiffSyntaxComposed,
  testNoInnerScrollbar,
  testGutterArchitectureIntact,
  testDetectLanguage
];

const page = await browser.getPage("code-block-viz-tests");

for (const t of tests) {
  try {
    await t(page);
  } catch (e) {
    record(t.name || 'unnamed', 'ERROR', t.name || '',
      String(e && e.message || e).slice(0, 120));
  }
}

for (const r of results) {
  console.log('TEST | ' + r.name + ' | ' + r.status + ' | ' + r.desc
    + ' | ' + r.detail.replace(/\|/g, '/'));
}
