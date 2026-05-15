/*!
 * ai-maestro-visual-communicator-plugin — dependency-free code tokenizer.
 *
 * Phase 2 (code-block Build #7): a standalone syntax-highlight engine for
 * the runtime's `.ve-code-block` system. Given the plain-text content of
 * ONE source line (or a whole block, line by line) plus a language id, it
 * returns an HTML string of inline `<span class="ve-tok-<role>">` token
 * spans — already HTML-escaped, safe to drop straight into the gutter
 * builder's per-line `.ve-code-content` element.
 *
 * Why this lives outside amvcp-runtime.js:
 *   The gutter builder (`initCodeGutter`) rebuilds each <pre><code> into
 *   per-line <span> elements ONLY when the <code> has no child elements.
 *   If a highlighter injects token <span>s as a separate post-pass, that
 *   guard turns false, the gutter is skipped, and soft-wrap + drag-paint
 *   selection break. So highlighting MUST happen INSIDE the gutter builder,
 *   operating on one plain-text line at a time and returning token-span
 *   HTML for that line. This module is exactly that — a clean, testable,
 *   Node-require-able unit the runtime calls per line. The build report
 *   for this module documents the precise `initCodeGutter` wiring
 *   contract the integration pass will apply.
 *
 * Dual export:
 *   - browser: `window.amvcpCodeHighlight = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-runtime.js and scripts/amvcp-designmd.js —
 * `var`, function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes, no build step, no npm deps.
 *
 * Fail-fast / source-fidelity contract (NON-NEGOTIABLE):
 *   Highlighting is decorative. Source fidelity is mandatory. Every
 *   highlighted line is run through an integrity probe: the token-span
 *   HTML's text content MUST byte-match the original source line. If it
 *   does not (a buggy language table, a regex edge case), the highlight is
 *   DISCARDED and `escapeHtml(originalLine)` — the plain but correct line —
 *   is returned. A broken language table can never corrupt or lose source.
 *
 * API:
 *   highlightLine(text, lang)   -> token-span HTML for ONE source line
 *   highlightBlock(lines, lang) -> array of per-line HTML (threads the
 *                                  inside-block-comment / inside-triple-
 *                                  string carry state line to line)
 *   detectLanguage(preEl)       -> resolves a language id for a <pre>
 *   normalizeLang(idOrAlias)    -> canonical language id or null
 *   languages                   -> the registered language descriptor map
 *   tokenRoles                   -> the list of `ve-tok-<role>` class names
 *   escapeHtml(text)             -> the module's own HTML escaper
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // Every token role the tokenizer can emit. Each becomes a CSS class
  // `ve-tok-<role>` whose color is a `--ve-code-<role>` custom property.
  // `variable` is in the list for completeness, but the tokenizer never
  // emits a `variable` span: bare identifiers stay as escaped plain text
  // and inherit the `.ve-code-content` color (which the runtime CSS binds
  // to `--ve-code-variable`). That keeps the tokenizer cheap — no pass has
  // to enumerate every identifier.
  var TOKEN_ROLES = [
    'keyword', 'string', 'number', 'comment', 'type', 'variable',
    'function', 'constant', 'operator', 'punctuation', 'tag', 'attribute'
  ];

  // The opaque placeholder the stash-and-restore tokenizer swaps a matched
  // chunk for. A later pass scanning the string can NEVER match inside an
  // already-rendered token because the rendered span is gone — only this
  // marker remains. The placeholder is `<SOH> <digits> <STX>` where SOH /
  // STX are the C0 control characters U+0001 / U+0002. No source code, no
  // language regex below, and no HTML output ever produces those bytes,
  // so a restore is unambiguous. The control chars are built from
  // char-code so this source file itself contains no literal control
  // bytes (which would be invisible / fragile to edit).
  var SOH = String.fromCharCode(1);   // placeholder start
  var STX = String.fromCharCode(2);   // placeholder end
  var STASH_OPEN = SOH + 'VCTOK';     // 6-char open marker
  var STASH_CLOSE = STX;              // 1-char close marker

  // ── escapeHtml ─────────────────────────────────────────────────────
  //
  // The module ships its OWN copy (it does not borrow the runtime's) so it
  // is fully self-contained and Node-testable. `&` must be replaced first
  // or the `&` of `&lt;` would be double-escaped.
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Regex helpers ──────────────────────────────────────────────────

  // Escape a literal string for safe insertion into a `new RegExp`.
  function reEscape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Build an alternation regex matching any whole word in `words`. The
  // bare word is ALWAYS in capture group 1, so the caller colours exactly
  // group 1 and never has to guess which leading boundary char (if any)
  // belongs to the token. The list is sorted longest-first so a longer
  // keyword is tried before a prefix of it.
  //
  //   - Plain identifier words (`for`, `return`) are `\b`-anchored.
  //   - Words with leading/embedded punctuation (`@media`, `!important`)
  //     cannot use `\b`; they are anchored on a preceding non-identifier
  //     char (or start-of-string) which is left OUTSIDE capture group 1,
  //     and a trailing `(?![\w-])` lookahead. The anchor char, when
  //     present, is `match[0]` minus `match[1]` and stays plain text.
  function wordRe(words) {
    if (!words || !words.length) return null;
    var sorted = words.slice().sort(function (a, b) {
      return b.length - a.length;
    });
    var alt = [];
    var i;
    for (i = 0; i < sorted.length; i++) {
      var w = sorted[i];
      if (/^[A-Za-z0-9_]+$/.test(w)) {
        // Plain identifier word — word-boundary anchored, captured.
        alt.push('\\b(' + reEscape(w) + ')\\b');
      } else {
        // Punctuated word — non-word anchor OUTSIDE the capture group.
        alt.push('(?:^|[^\\w-])(' + reEscape(w) + ')(?![\\w-])');
      }
    }
    return new RegExp('(?:' + alt.join('|') + ')', 'g');
  }

  // ── Language descriptors ───────────────────────────────────────────
  //
  // Each language is a small descriptor — a HIGHLIGHT table, NOT a full
  // grammar. The integrity probe catches any table that mishandles an
  // edge case by falling the line back to plain text. Fields:
  //
  //   id            canonical language id
  //   aliases       extra ids that resolve to this language
  //   lineComment   array of line-comment lead strings ('//' '#' …) or []
  //   blockComment  [open, close] for /* … */-style comments, or null
  //   tripleString  [open, close] for Python triple-quoted strings, or null
  //   strings       array of { q } string-quote descriptors
  //   keywords      array of keyword words
  //   builtinTypes  array of known type names
  //   constants     array of constant literal words
  //   numberRe      a regex (global) matching numeric literals
  //   operatorRe    a regex (global) matching operator runs
  //   punctuationRe a regex (global) matching punctuation chars
  //   tagAware      'html' | 'css' | undefined — enables a tag/attr sub-pass
  //   diffMode      true for the trivial whole-line `diff` mode
  //
  // The shared number / operator / punctuation regexes are defined once
  // below and reused where languages agree.

  // A pragmatic numeric literal: hex, binary, octal, scientific, float,
  // underscore digit separators. Deliberately permissive — over-matching
  // a number is harmless (it is still a number); the probe guards
  // correctness.
  var NUM_RE = new RegExp(
    '\\b(?:0[xX][0-9a-fA-F][0-9a-fA-F_]*' +
    '|0[bB][01][01_]*' +
    '|0[oO][0-7][0-7_]*' +
    '|[0-9][0-9_]*\\.?[0-9_]*(?:[eE][+-]?[0-9][0-9_]*)?' +
    '|\\.[0-9][0-9_]*(?:[eE][+-]?[0-9][0-9_]*)?)' +
    '[a-zA-Z]*\\b',
    'g'
  );

  // Operators common to C-family languages. Multi-char runs first so
  // `===` is one token, not `==` + `=`. The class is intentionally broad.
  var OP_RE = new RegExp(
    '(?:>>>=?|<<=|>>=|===|!==|\\?\\?=?|\\.\\.\\.|=>|->|\\|\\||&&|' +
    '\\*\\*=?|\\+\\+|--|<=|>=|==|!=|\\+=|-=|\\*=|/=|%=|&=|\\|=|\\^=|' +
    '<<|>>|::|[-+*/%=<>!&|^~?])',
    'g'
  );

  // Structural punctuation.
  var PUNCT_RE = /[{}()\[\];,.:]/g;

  var LANGUAGES = {};

  function registerLanguage(desc) {
    LANGUAGES[desc.id] = desc;
  }

  // JavaScript + TypeScript — one combined table (TS is a JS superset).
  registerLanguage({
    id: 'js',
    aliases: ['javascript', 'ts', 'typescript', 'jsx', 'tsx', 'mjs', 'cjs'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
    tripleString: null,
    strings: [{ q: '"' }, { q: "'" }, { q: '`' }],
    keywords: [
      'abstract', 'as', 'async', 'await', 'break', 'case', 'catch',
      'class', 'const', 'continue', 'debugger', 'declare', 'default',
      'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally',
      'for', 'from', 'function', 'get', 'if', 'implements', 'import',
      'in', 'instanceof', 'interface', 'is', 'keyof', 'let', 'namespace',
      'new', 'of', 'package', 'private', 'protected', 'public', 'readonly',
      'return', 'satisfies', 'set', 'static', 'super', 'switch', 'this',
      'throw', 'try', 'type', 'typeof', 'var', 'void', 'while', 'with',
      'yield'
    ],
    builtinTypes: [
      'any', 'bigint', 'boolean', 'never', 'number', 'object', 'string',
      'symbol', 'unknown', 'Array', 'Boolean', 'Date', 'Error', 'Function',
      'Map', 'Number', 'Object', 'Promise', 'RegExp', 'Set', 'String',
      'Symbol', 'WeakMap', 'WeakSet'
    ],
    constants: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
    numberRe: NUM_RE,
    operatorRe: OP_RE,
    punctuationRe: PUNCT_RE
  });

  // Python.
  registerLanguage({
    id: 'python',
    aliases: ['py', 'python3'],
    lineComment: ['#'],
    blockComment: null,
    tripleString: ['"""', '"""'],
    strings: [{ q: '"' }, { q: "'" }],
    keywords: [
      'and', 'as', 'assert', 'async', 'await', 'break', 'class',
      'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
      'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while',
      'with', 'yield', 'match', 'case'
    ],
    builtinTypes: [
      'bool', 'bytes', 'complex', 'dict', 'float', 'frozenset', 'int',
      'list', 'object', 'set', 'str', 'tuple', 'type'
    ],
    constants: [
      'True', 'False', 'None', 'NotImplemented', 'Ellipsis', 'self', 'cls'
    ],
    numberRe: NUM_RE,
    operatorRe: new RegExp(
      '(?:\\*\\*=?|//=?|>>=?|<<=?|->|:=|<=|>=|==|!=|\\+=|-=|\\*=|/=|%=|' +
      '&=|\\|=|\\^=|[-+*/%=<>!&|^~@])',
      'g'
    ),
    punctuationRe: PUNCT_RE
  });

  // JSON — no keywords; only strings, numbers, constants, punctuation.
  registerLanguage({
    id: 'json',
    aliases: ['json5', 'jsonc'],
    lineComment: ['//'],
    blockComment: ['/*', '*/'],
    tripleString: null,
    strings: [{ q: '"' }],
    keywords: [],
    builtinTypes: [],
    constants: ['true', 'false', 'null'],
    numberRe: NUM_RE,
    operatorRe: null,
    punctuationRe: /[{}()\[\]:,]/g
  });

  // shell / bash.
  registerLanguage({
    id: 'bash',
    aliases: ['sh', 'shell', 'zsh', 'console'],
    lineComment: ['#'],
    blockComment: null,
    tripleString: null,
    strings: [{ q: '"' }, { q: "'" }],
    keywords: [
      'if', 'then', 'elif', 'else', 'fi', 'for', 'while', 'until', 'do',
      'done', 'case', 'esac', 'function', 'in', 'select', 'time',
      'return', 'break', 'continue', 'local', 'export', 'declare',
      'readonly', 'set', 'unset', 'shift', 'source'
    ],
    builtinTypes: [
      'echo', 'printf', 'cd', 'pwd', 'read', 'test', 'eval', 'exec',
      'trap', 'exit', 'kill', 'wait'
    ],
    constants: ['true', 'false'],
    numberRe: /\b[0-9]+\b/g,
    operatorRe: /(?:&&|\|\||>>|<<|[|&;<>=])/g,
    punctuationRe: /[{}()\[\]]/g
  });

  // HTML — tag-aware. The generic passes do little; the tag sub-pass does
  // the work (see scanHtmlTags / renderHtmlTag below).
  registerLanguage({
    id: 'html',
    aliases: ['xml', 'svg', 'htm'],
    lineComment: [],
    blockComment: ['<!--', '-->'],
    tripleString: null,
    strings: [{ q: '"' }, { q: "'" }],
    keywords: [],
    builtinTypes: [],
    constants: [],
    numberRe: null,
    operatorRe: null,
    punctuationRe: null,
    tagAware: 'html'
  });

  // CSS — selector-aware. Properties → attribute, values → string/number.
  registerLanguage({
    id: 'css',
    aliases: ['scss', 'less'],
    lineComment: [],
    blockComment: ['/*', '*/'],
    tripleString: null,
    strings: [{ q: '"' }, { q: "'" }],
    keywords: [
      '!important', '@media', '@import', '@keyframes', '@font-face',
      '@supports', '@charset', 'and', 'not', 'only', 'from', 'to'
    ],
    builtinTypes: [],
    constants: [],
    numberRe: new RegExp(
      '(?:#[0-9a-fA-F]{3,8}\\b' +
      '|[-+]?[0-9]*\\.?[0-9]+(?:%|[a-zA-Z]+)?)',
      'g'
    ),
    operatorRe: /(?:[>~+*])/g,
    punctuationRe: /[{}();,]/g,
    tagAware: 'css'
  });

  // diff — a 7th trivial mode. A line beginning with +/-/@@ is given a
  // single whole-line token role. Used by the runtime's diff-block render.
  registerLanguage({
    id: 'diff',
    aliases: ['patch', 'udiff'],
    lineComment: [],
    blockComment: null,
    tripleString: null,
    strings: [],
    keywords: [],
    builtinTypes: [],
    constants: [],
    numberRe: null,
    operatorRe: null,
    punctuationRe: null,
    diffMode: true
  });

  // ── Language resolution ────────────────────────────────────────────

  // Map canonical id + every alias to the canonical id, built once.
  var ALIAS_MAP = {};
  (function buildAliasMap() {
    var id;
    for (id in LANGUAGES) {
      if (!LANGUAGES.hasOwnProperty(id)) continue;
      var desc = LANGUAGES[id];
      ALIAS_MAP[id.toLowerCase()] = id;
      var aliases = desc.aliases || [];
      var i;
      for (i = 0; i < aliases.length; i++) {
        ALIAS_MAP[String(aliases[i]).toLowerCase()] = id;
      }
    }
  })();

  // Resolve any id / alias to a canonical language id, or null if unknown.
  // null is a deliberate result — "no language declared" means no
  // highlighting (plain, byte-exact text). The tokenizer NEVER guesses a
  // language from content; an undeclared block stays plain.
  function normalizeLang(idOrAlias) {
    if (!idOrAlias) return null;
    var key = String(idOrAlias).trim().toLowerCase();
    return ALIAS_MAP.hasOwnProperty(key) ? ALIAS_MAP[key] : null;
  }

  // Extract a language id from a `language-xxx` / `lang-xxx` class token.
  function langFromClassName(className) {
    if (!className || typeof className !== 'string') return null;
    var classes = className.split(/\s+/);
    var i;
    for (i = 0; i < classes.length; i++) {
      var m = classes[i].match(/^(?:language|lang)-([\w+#.-]+)$/i);
      if (m) {
        var resolved = normalizeLang(m[1]);
        if (resolved) return resolved;
      }
    }
    return null;
  }

  // Resolve a language for a <pre> element. Resolution order:
  //   1. explicit  data-ve-lang="js" on the <pre> or its <code>
  //   2. class     language-js / lang-python on the <pre> or its <code>
  //      (the CommonMark / highlight.js de-facto convention)
  //   3. null      → no highlighting
  function detectLanguage(preEl) {
    if (!preEl || typeof preEl.getAttribute !== 'function') return null;
    var codeEl = (typeof preEl.querySelector === 'function')
      ? preEl.querySelector('code')
      : null;

    // (1) explicit data-ve-lang on <pre> then <code>.
    var explicit = preEl.getAttribute('data-ve-lang');
    if (!explicit && codeEl && typeof codeEl.getAttribute === 'function') {
      explicit = codeEl.getAttribute('data-ve-lang');
    }
    var resolved = normalizeLang(explicit);
    if (resolved) return resolved;

    // (2) language-* / lang-* class on <pre> then <code>.
    var fromClass = langFromClassName(preEl.className);
    if (!fromClass && codeEl) {
      fromClass = langFromClassName(codeEl.className);
    }
    return fromClass || null;
  }

  // ── The stash-and-restore tokenizer ────────────────────────────────
  //
  // A line is tokenized in a FIXED PRECEDENCE ORDER. Each match is
  // replaced by an opaque placeholder and the rendered token-span HTML is
  // pushed onto `stash[]`. Because the rendered span is gone from the
  // working string, a later pass can never match INSIDE it — the keyword
  // `for` inside a string "for loop" is immune once the string is
  // stashed. A final pass restores every placeholder.
  //
  // The working string is built up incrementally: at the start it is the
  // raw source line; after each pass the matched chunks are placeholders
  // and everything else is still raw (un-escaped) source. Only at the
  // very end is the leftover raw text HTML-escaped — placeholders are
  // left intact (they contain no HTML-significant chars), then expanded.

  function makeStasher() {
    var stash = [];
    return {
      // Render `rawText` as a `<span class="ve-tok-role">`, push it, and
      // return the placeholder that stands in for it.
      tok: function (role, rawText) {
        var idx = stash.length;
        stash.push(
          '<span class="ve-tok-' + role + '">' + escapeHtml(rawText) +
          '</span>'
        );
        return STASH_OPEN + idx + STASH_CLOSE;
      },
      // Push pre-rendered HTML verbatim (used by the tag-aware sub-pass,
      // which builds nested spans itself — that HTML may itself embed
      // placeholders for attribute-value strings stashed earlier).
      raw: function (html) {
        var idx = stash.length;
        stash.push(html);
        return STASH_OPEN + idx + STASH_CLOSE;
      },
      list: stash
    };
  }

  // Strip the placeholder control characters (defensive — only reached
  // if the expansion depth cap trips, which a correct stash never does).
  var CTRL_RE = new RegExp('[' + SOH + STX + ']', 'g');
  function stripControl(s) {
    return String(s).replace(CTRL_RE, '');
  }

  // Restore: walk the WORKING string left-to-right. A placeholder expands
  // to its stashed HTML; every other character is raw, un-escaped source
  // and is HTML-escaped here. This is the ONLY pass that escapes source —
  // stashed HTML is already valid and is never re-escaped.
  function restore(work, stash) {
    var out = '';
    var i = 0;
    var n = work.length;
    while (i < n) {
      if (work.charCodeAt(i) === 1 &&
          work.substring(i, i + STASH_OPEN.length) === STASH_OPEN) {
        var close = work.indexOf(STASH_CLOSE, i + STASH_OPEN.length);
        if (close !== -1) {
          var numStr = work.slice(i + STASH_OPEN.length, close);
          var idx = parseInt(numStr, 10);
          if (numStr.length && !isNaN(idx) && idx >= 0 &&
              idx < stash.length) {
            // A stash slot is ALREADY-valid HTML that may itself embed
            // placeholders — expand it without re-escaping its markup.
            out += expandSlot(stash[idx], stash, 0);
            i = close + STASH_CLOSE.length;
            continue;
          }
        }
      }
      // Raw source character — this is the ONLY place source is escaped.
      out += escapeHtml(work.charAt(i));
      i++;
    }
    return out;
  }

  // Expand placeholders embedded INSIDE an already-valid-HTML stash slot.
  // Unlike `restore`, the non-placeholder text here is finished markup
  // (`tok` already escaped its content; `renderHtmlTag` already escaped
  // its tag text), so it is copied through verbatim — NEVER re-escaped.
  // Recursion is bounded: a slot is created only AFTER the slots it
  // embeds, so an embedded placeholder always points at a strictly lower
  // index — depth can never exceed the stash length.
  function expandSlot(html, stash, depth) {
    if (depth > stash.length + 4) return stripControl(html);
    if (html.indexOf(STASH_OPEN) === -1) return html; // fast path: flat
    var out = '';
    var i = 0;
    var n = html.length;
    while (i < n) {
      if (html.charCodeAt(i) === 1 &&
          html.substring(i, i + STASH_OPEN.length) === STASH_OPEN) {
        var close = html.indexOf(STASH_CLOSE, i + STASH_OPEN.length);
        if (close !== -1) {
          var numStr = html.slice(i + STASH_OPEN.length, close);
          var idx = parseInt(numStr, 10);
          if (numStr.length && !isNaN(idx) && idx >= 0 &&
              idx < stash.length) {
            out += expandSlot(stash[idx], stash, depth + 1);
            i = close + STASH_CLOSE.length;
            continue;
          }
        }
      }
      out += html.charAt(i);
      i++;
    }
    return out;
  }

  // ── Per-pass scanners ──────────────────────────────────────────────
  //
  // Each scanner walks the working string character by character, copying
  // plain text through and replacing matched constructs with placeholders.
  // Working on raw (un-placeholdered, un-escaped) text is safe because the
  // placeholder bytes (U+0001 / U+0002) never occur in source code.

  // Is the character at index `i` the start of an existing placeholder?
  // Returns the index just past the placeholder, or -1. The scanners use
  // this so a later pass cannot split one.
  function placeholderAt(s, i) {
    if (s.charCodeAt(i) !== 1) return -1;
    if (s.substring(i, i + STASH_OPEN.length) !== STASH_OPEN) return -1;
    var close = s.indexOf(STASH_CLOSE, i + STASH_OPEN.length);
    if (close === -1) return -1;
    return close + STASH_CLOSE.length;
  }

  // Copy work[a..b) through unchanged.
  function copyRange(work, a, b) {
    return work.slice(a, b);
  }

  // Build a boolean array, one entry per character of `work`, true where
  // that character belongs to a placeholder run (`<SOH>VCTOK<n><STX>`).
  //
  // Why this is needed: the regex-based scanners (`scanRegex`,
  // `scanFunctionCalls`, `scanCssProps`) run `RegExp.exec` over the WHOLE
  // working string. A placeholder marker `<SOH>VCTOK7<STX>` contains the
  // ASCII letters `VCTOK` and a DIGIT — so a naive number / word regex
  // would happily match the `7` (or `VCTOK`) INSIDE a placeholder and
  // wrongly wrap it in a token span, corrupting the marker. Checking only
  // whether the matched token's own chars are U+0001 is not enough (the
  // digit `7` is not U+0001). The mask records the full extent of every
  // placeholder so a scanner can reject any match that touches one.
  function placeholderMask(work) {
    var mask = [];
    var n = work.length;
    var i;
    for (i = 0; i < n; i++) mask.push(false);
    i = 0;
    while (i < n) {
      var ph = placeholderAt(work, i);
      if (ph !== -1) {
        var k;
        for (k = i; k < ph; k++) mask[k] = true;
        i = ph;
        continue;
      }
      i++;
    }
    return mask;
  }

  // True if [start, end) overlaps any placeholder position in `mask`.
  function rangeHitsPlaceholder(mask, start, end) {
    var k;
    for (k = start; k < end; k++) {
      if (mask[k]) return true;
    }
    return false;
  }

  // Pass: comments. Block comments first (so a `//` inside `/* … */` is
  // not separately matched), then line comments. `carry.inBlock` lets a
  // block comment opened on a previous line continue. Returns the working
  // string; mutates `carry.inBlock`.
  function scanComments(work, lang, stash, carry) {
    var out = '';
    var i = 0;
    var n = work.length;
    var bc = lang.blockComment;       // [open, close] or null
    var lc = lang.lineComment || [];  // array of lead strings

    // If a block comment is still open from a previous line, the WHOLE of
    // this line up to a close (or its end) is comment.
    if (carry && carry.inBlock && bc) {
      var endIdx = work.indexOf(bc[1]);
      if (endIdx === -1) {
        return stash.tok('comment', work); // whole line, still open
      }
      var commentChunk = work.slice(0, endIdx + bc[1].length);
      carry.inBlock = false;
      out += stash.tok('comment', commentChunk);
      i = endIdx + bc[1].length;
    }

    while (i < n) {
      var ph = placeholderAt(work, i);
      if (ph !== -1) { out += work.slice(i, ph); i = ph; continue; }

      // Block comment open?
      if (bc && work.substring(i, i + bc[0].length) === bc[0]) {
        var close = work.indexOf(bc[1], i + bc[0].length);
        if (close === -1) {
          // Opens here, no close on this line — rest of line is comment,
          // carry the open state to the next line.
          out += stash.tok('comment', work.slice(i));
          if (carry) carry.inBlock = true;
          return out;
        }
        out += stash.tok('comment', work.slice(i, close + bc[1].length));
        i = close + bc[1].length;
        continue;
      }

      // Line comment? Match any of the lead strings.
      var j;
      var matched = false;
      for (j = 0; j < lc.length; j++) {
        if (lc[j] && work.substring(i, i + lc[j].length) === lc[j]) {
          out += stash.tok('comment', work.slice(i));
          matched = true;
          break;
        }
      }
      if (matched) return out; // rest of the line is comment

      out += work.charAt(i);
      i++;
    }
    return out;
  }

  // Pass: triple-quoted strings (Python). A triple string can open on one
  // line and close on a later one — `carry.inTriple` threads that state.
  function scanTripleStrings(work, lang, stash, carry) {
    var triple = lang.tripleString;
    if (!triple) return work;
    var open = triple[0];
    var close = triple[1];
    var out = '';
    var i = 0;
    var n = work.length;

    // Continue a triple string opened on a previous line.
    if (carry && carry.inTriple) {
      var endIdx = work.indexOf(close);
      if (endIdx === -1) {
        return stash.tok('string', work); // whole line, still open
      }
      carry.inTriple = false;
      out += stash.tok('string', work.slice(0, endIdx + close.length));
      i = endIdx + close.length;
    }

    while (i < n) {
      var ph = placeholderAt(work, i);
      if (ph !== -1) { out += work.slice(i, ph); i = ph; continue; }

      if (work.substring(i, i + open.length) === open) {
        var c = work.indexOf(close, i + open.length);
        if (c === -1) {
          out += stash.tok('string', work.slice(i));
          if (carry) carry.inTriple = true;
          return out;
        }
        out += stash.tok('string', work.slice(i, c + close.length));
        i = c + close.length;
        continue;
      }
      out += work.charAt(i);
      i++;
    }
    return out;
  }

  // Pass: single-line strings. Honours backslash escapes inside the
  // string. An unterminated string runs to end of line (lenient — the
  // probe still guarantees source fidelity).
  function scanStrings(work, lang, stash) {
    var quotes = lang.strings || [];
    if (!quotes.length) return work;
    var quoteSet = {};
    var i;
    for (i = 0; i < quotes.length; i++) quoteSet[quotes[i].q] = true;

    var out = '';
    i = 0;
    var n = work.length;
    while (i < n) {
      var ph = placeholderAt(work, i);
      if (ph !== -1) { out += work.slice(i, ph); i = ph; continue; }

      var ch = work.charAt(i);
      if (quoteSet[ch]) {
        // Walk to the matching close quote, respecting `\` escapes.
        var j = i + 1;
        var closed = false;
        while (j < n) {
          var cj = work.charAt(j);
          if (cj === '\\') { j += 2; continue; }
          if (cj === ch) { closed = true; j++; break; }
          j++;
        }
        if (!closed) j = n; // unterminated — to end of line
        out += stash.tok('string', work.slice(i, j));
        i = j;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
  }

  // Pass: apply a global regex, stashing each match as `role`. Skips any
  // match that overlaps a placeholder region.
  //
  // The regex may or may not define capture group 1:
  //   - `wordRe` regexes capture the bare word in group 1; the part of
  //     `match[0]` BEFORE group 1 is an anchor char that must stay plain
  //     text. We colour exactly group 1 at its true offset.
  //   - the number / operator / punctuation regexes have no group 1; the
  //     whole `match[0]` is the token.
  function scanRegex(work, re, role, stash) {
    if (!re) return work;
    var mask = placeholderMask(work);
    var out = '';
    var i = 0;
    var n = work.length;
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(work)) !== null) {
      // Zero-length match guard — advance to avoid an infinite loop.
      if (m[0].length === 0) { re.lastIndex++; continue; }
      var token, start;
      if (m[1] != null) {
        // Captured form: colour group 1, found at its real offset within
        // match[0] (the anchor char, if any, precedes it).
        token = m[1];
        start = m.index + m[0].indexOf(m[1]);
      } else {
        token = m[0];
        start = m.index;
      }
      if (token.length === 0) { re.lastIndex = m.index + 1; continue; }
      var end = start + token.length;
      // Reject any match that touches a placeholder run — a digit / word
      // INSIDE `<SOH>VCTOK<n><STX>` must never be re-tokenized.
      if (rangeHitsPlaceholder(mask, start, end)) continue;
      out += copyRange(work, i, start);
      out += stash.tok(role, token);
      i = end;
    }
    out += copyRange(work, i, n);
    return out;
  }

  // Pass: function call sites — an identifier immediately followed by
  // `(`. The `(` itself is NOT consumed (a later punctuation pass colours
  // it). Skips placeholders.
  function scanFunctionCalls(work, stash) {
    var re = /[A-Za-z_$][\w$]*(?=\s*\()/g;
    var mask = placeholderMask(work);
    var out = '';
    var i = 0;
    var n = work.length;
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(work)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      var start = m.index;
      var end = start + m[0].length;
      if (rangeHitsPlaceholder(mask, start, end)) continue;
      out += copyRange(work, i, start);
      out += stash.tok('function', m[0]);
      i = end;
    }
    out += copyRange(work, i, n);
    return out;
  }

  // ── HTML tag-aware sub-pass ────────────────────────────────────────
  //
  // After comments + strings are stashed, the leftover working string is
  // scanned for `<tagname …>` runs. The tag name → `ve-tok-tag`, each
  // attribute name → `ve-tok-attribute`. Attribute *values* were already
  // stashed by the string pass (they appear here as placeholders). The
  // `<`, `>`, `/` become punctuation.
  function scanHtmlTags(work, stash) {
    var out = '';
    var i = 0;
    var n = work.length;
    while (i < n) {
      var ph = placeholderAt(work, i);
      if (ph !== -1) { out += work.slice(i, ph); i = ph; continue; }

      var ch = work.charAt(i);
      if (ch === '<') {
        // Find the matching '>' (or end of line). Placeholders inside are
        // attribute values — they pass through into the rendered tag.
        var gt = -1;
        var j = i + 1;
        while (j < n) {
          if (work.charAt(j) === '>') { gt = j; break; }
          j++;
        }
        var tagEnd = (gt === -1) ? n : gt + 1;
        out += stash.raw(renderHtmlTag(work.slice(i, tagEnd)));
        i = tagEnd;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
  }

  // Render one `<…>` tag run into nested token spans. Any placeholder (a
  // stashed string attribute value) is emitted verbatim — `expandSlot`
  // resolves it during restore.
  function renderHtmlTag(tagText) {
    var html = '';
    var i = 0;
    var n = tagText.length;
    if (tagText.charAt(0) !== '<') return escapeHtml(tagText);
    html += '<span class="ve-tok-punctuation">&lt;</span>';
    i = 1;
    if (tagText.charAt(i) === '/') {
      html += '<span class="ve-tok-punctuation">/</span>';
      i++;
    }
    if (tagText.charAt(i) === '!') {
      html += '<span class="ve-tok-punctuation">!</span>';
      i++;
    }
    // Tag name.
    var nameStart = i;
    while (i < n && /[\w:-]/.test(tagText.charAt(i))) i++;
    if (i > nameStart) {
      html += '<span class="ve-tok-tag">' +
        escapeHtml(tagText.slice(nameStart, i)) + '</span>';
    }
    // Attributes / whitespace / placeholders until '>'.
    while (i < n) {
      var ch = tagText.charAt(i);
      if (ch === '>') break;
      var ph = placeholderAt(tagText, i);
      if (ph !== -1) { html += tagText.slice(i, ph); i = ph; continue; }
      if (ch === '/') {
        html += '<span class="ve-tok-punctuation">/</span>';
        i++;
        continue;
      }
      if (ch === '=') {
        html += '<span class="ve-tok-operator">=</span>';
        i++;
        continue;
      }
      if (/\s/.test(ch)) { html += escapeHtml(ch); i++; continue; }
      // Attribute name.
      var attrStart = i;
      while (i < n && /[\w:.-]/.test(tagText.charAt(i))) i++;
      if (i > attrStart) {
        html += '<span class="ve-tok-attribute">' +
          escapeHtml(tagText.slice(attrStart, i)) + '</span>';
      } else {
        // Unrecognised char — emit escaped, advance (never loop forever).
        html += escapeHtml(tagText.charAt(i));
        i++;
      }
    }
    if (i < n && tagText.charAt(i) === '>') {
      html += '<span class="ve-tok-punctuation">&gt;</span>';
      i++;
    }
    if (i < n) html += escapeHtml(tagText.slice(i));
    return html;
  }

  // ── CSS selector / property sub-pass ───────────────────────────────
  //
  // CSS lines look like `selector { prop: value; }`. We colour an
  // identifier followed by `:` as a property name (`ve-tok-attribute`).
  // Strings, comments, numbers/colors are already stashed by earlier
  // passes; selectors fall through as plain text.
  function scanCssProps(work, stash) {
    var mask = placeholderMask(work);
    var out = '';
    var i = 0;
    var n = work.length;
    var re = /[A-Za-z_-][\w-]*(?=\s*:)/g;
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(work)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      var start = m.index;
      var end = start + m[0].length;
      if (rangeHitsPlaceholder(mask, start, end)) continue;
      out += copyRange(work, i, start);
      out += stash.tok('attribute', m[0]);
      i = end;
    }
    out += copyRange(work, i, n);
    return out;
  }

  // ── Core: highlight ONE line ───────────────────────────────────────
  //
  // `carry` (optional) threads multi-line state (block comment / triple
  // string) between consecutive lines. When omitted, the line is treated
  // as self-contained.
  function highlightLineInternal(text, langDesc, carry) {
    // diff mode: one whole-line token role.
    if (langDesc.diffMode) return highlightDiffLine(text);

    var stash = makeStasher();
    var work = String(text);

    // Precedence order (highest first):
    //  1. comments      — keywords inside comments are immune
    //  2. triple-string — Python """…""" before single strings
    //  3. strings       — keywords inside strings are immune
    //  (HTML/CSS structural sub-pass)
    //  4. keywords  5. builtin types  6. constants
    //  7. function calls  8. numbers  9. operators  10. punctuation
    work = scanComments(work, langDesc, stash, carry);
    work = scanTripleStrings(work, langDesc, stash, carry);
    work = scanStrings(work, langDesc, stash);

    if (langDesc.tagAware === 'html') {
      work = scanHtmlTags(work, stash);
    } else if (langDesc.tagAware === 'css') {
      work = scanCssProps(work, stash);
    }

    if (langDesc.keywords && langDesc.keywords.length) {
      work = scanRegex(work, wordRe(langDesc.keywords), 'keyword', stash);
    }
    if (langDesc.builtinTypes && langDesc.builtinTypes.length) {
      work = scanRegex(work, wordRe(langDesc.builtinTypes), 'type', stash);
    }
    if (langDesc.constants && langDesc.constants.length) {
      work = scanRegex(work, wordRe(langDesc.constants), 'constant', stash);
    }
    // Function-call detection is skipped for tag-aware langs (HTML/CSS),
    // where `name(` is not a call site.
    if (!langDesc.tagAware) {
      work = scanFunctionCalls(work, stash);
    }
    work = scanRegex(work, langDesc.numberRe, 'number', stash);
    work = scanRegex(work, langDesc.operatorRe, 'operator', stash);
    work = scanRegex(work, langDesc.punctuationRe, 'punctuation', stash);

    // Restore: expand placeholders, escape leftover plain text.
    return restore(work, stash.list);
  }

  // diff line: whole-line role from the leading marker.
  function highlightDiffLine(text) {
    var s = String(text);
    var role = null;
    if (s.charAt(0) === '+') role = 'string';           // add → string hue
    else if (s.charAt(0) === '-') role = 'constant';    // del → constant hue
    else if (s.substring(0, 2) === '@@') role = 'comment'; // hunk header
    if (!role) return escapeHtml(s);
    return '<span class="ve-tok-' + role + '">' + escapeHtml(s) + '</span>';
  }

  // ── Integrity probe ────────────────────────────────────────────────
  //
  // Source fidelity is mandatory; highlighting is decorative. The probe
  // strips all HTML tags from the rendered string and decodes the entity
  // escapes, then asserts the result byte-matches the original line. A
  // DOM-based probe (set innerHTML on a detached node, read textContent)
  // is used in the browser; a pure-string fallback is used under Node
  // (the test harness) so the module needs no DOM to be require-able.
  var hasDocument = (typeof document !== 'undefined' && document &&
                     typeof document.createElement === 'function');

  function probeTextContent(html) {
    if (hasDocument) {
      var div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent;
    }
    // Node fallback: drop tags, decode the 3 entities escapeHtml produces.
    // Order matters — &amp; LAST so "&amp;lt;" decodes to "&lt;" not "<".
    return String(html)
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  // ── Public: highlightLine ──────────────────────────────────────────
  //
  // Returns token-span HTML for ONE source line. An unknown / falsy lang,
  // or an integrity-probe failure, returns escapeHtml(text) unchanged —
  // the plain but byte-correct line. NEVER throws, NEVER loses a char.
  function highlightLine(text, lang) {
    var src = (text == null) ? '' : String(text);
    var langId = normalizeLang(lang);
    if (!langId) return escapeHtml(src);
    var desc = LANGUAGES[langId];
    if (!desc) return escapeHtml(src);

    var rendered;
    try {
      rendered = highlightLineInternal(src, desc, null);
    } catch (e) {
      // A regex or table bug must never crash the page — degrade to plain.
      return escapeHtml(src);
    }
    // Integrity probe — the rendered text MUST byte-match the source.
    if (probeTextContent(rendered) !== src) {
      return escapeHtml(src);
    }
    return rendered;
  }

  // ── Public: highlightBlock ─────────────────────────────────────────
  //
  // `highlightLine` in a loop, threading the multi-line carry state
  // (inside-block-comment / inside-triple-string) from line N to N+1.
  // Returns an array of per-line HTML strings, one per input line — the
  // shape `initCodeGutter` consumes directly. Each line is still probed
  // individually; a failed line degrades to plain text on its own,
  // leaving every other line highlighted.
  function highlightBlock(lines, lang) {
    var arr = (lines && lines.length != null && typeof lines !== 'string')
      ? lines
      : String(lines == null ? '' : lines).split('\n');
    var langId = normalizeLang(lang);
    var out = [];
    var i;

    if (!langId || !LANGUAGES[langId]) {
      // No language — every line is plain escaped text.
      for (i = 0; i < arr.length; i++) {
        out.push(escapeHtml(arr[i] == null ? '' : String(arr[i])));
      }
      return out;
    }

    var desc = LANGUAGES[langId];
    // Carry state shared across the whole block. Each line mutates it;
    // the NEXT line reads it. A failed line still updates carry (the
    // tokenizer ran), so multi-line constructs stay consistent.
    var carry = { inBlock: false, inTriple: false };

    for (i = 0; i < arr.length; i++) {
      var src = (arr[i] == null) ? '' : String(arr[i]);
      var rendered;
      try {
        rendered = highlightLineInternal(src, desc, carry);
      } catch (e) {
        out.push(escapeHtml(src));
        continue;
      }
      if (probeTextContent(rendered) !== src) {
        out.push(escapeHtml(src));
        continue;
      }
      out.push(rendered);
    }
    return out;
  }

  // ── API surface ────────────────────────────────────────────────────
  var api = {
    highlightLine: highlightLine,
    highlightBlock: highlightBlock,
    detectLanguage: detectLanguage,
    normalizeLang: normalizeLang,
    languages: LANGUAGES,
    tokenRoles: TOKEN_ROLES,
    escapeHtml: escapeHtml
  };

  // Dual export — browser global + Node require. Same guard pattern as
  // amvcp-designmd.js.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.amvcpCodeHighlight = api;
  }
})();
