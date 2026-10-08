/**
 * check-i18n.mjs — the guard that prevents the previous version's bugs.
 *
 * Three checks, run with `npm run check`:
 *   1. every translation entry has all four languages, non-empty
 *   2. every t('key') used anywhere in the UI actually exists
 *   3. no German-looking literal text is hardcoded in JSX
 *
 * Exits with code 1 on any failure, so it can gate a build or a commit.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'client', 'src');
const LANGS = ['de', 'en', 'fr', 'es'];

/** Recursively collect source files. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const stringsSource = fs.readFileSync(path.join(SRC, 'i18n', 'strings.js'), 'utf8');
const { STRINGS } = await import(path.join(SRC, 'i18n', 'strings.js'));

let failures = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures += 1; };

/* --- 1. completeness ----------------------------------------------------- */
console.log('1. Translation completeness');
let incomplete = 0;
for (const [key, entry] of Object.entries(STRINGS)) {
  for (const lang of LANGS) {
    if (!entry[lang] || !String(entry[lang]).trim()) { fail(`${key} is missing "${lang}"`); incomplete += 1; }
  }
}
console.log(incomplete === 0 ? `  ✓ ${Object.keys(STRINGS).length} keys × ${LANGS.length} languages complete` : '');

/* --- 2. every used key exists -------------------------------------------- */
console.log('2. Keys used in the interface');
const used = new Set();
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  for (const match of code.matchAll(/\bt\(\s*'([a-z0-9_]+)'/g)) used.add(match[1]);
}
let unknown = 0;
for (const key of used) if (!STRINGS[key]) { fail(`t('${key}') is used but not defined`); unknown += 1; }
console.log(unknown === 0 ? `  ✓ all ${used.size} used keys are defined` : '');

/* --- 3. no hardcoded German in the interface ----------------------------- */
console.log('3. Hardcoded text in components');
// Words that would reveal untranslated German leaking into the UI.
const GERMAN = /\b(und|oder|nicht|wird|werden|wurde|kein|keine|bitte|Störung|Meldung|Uhrzeit|Ortsteil|Kanäle|Freigabe|Entwurf|Zugangsdaten|Haushalte|veröffentlicht)\b/;
let leaks = 0;
for (const file of files) {
  if (file.includes(`${path.sep}i18n${path.sep}`)) continue;         // the dictionaries may contain German
  const code = fs.readFileSync(file, 'utf8');
  code.split('\n').forEach((line, index) => {
    const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');  // ignore comments
    if (/^\s*\*/.test(line) || /^\s*\/\//.test(line)) return;                  // ignore doc blocks
    // JSX text nodes and quoted literals that are not translation keys
    const candidates = [...stripped.matchAll(/>([^<>{}\n]{4,})</g)].map((m) => m[1]);
    for (const text of candidates) {
      if (GERMAN.test(text)) { fail(`${path.relative(ROOT, file)}:${index + 1} hardcoded: "${text.trim()}"`); leaks += 1; }
    }
  });
}
console.log(leaks === 0 ? '  ✓ no hardcoded German found in components' : '');

/* --- 4. every CSS class used in JSX exists in the stylesheet ------------- */
console.log('4. CSS classes used in components');
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const usedClasses = new Set();
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  // className="a b c" and cx('a', cond && 'b', …)
  for (const m of code.matchAll(/className=["']([^"'{}]+)["']/g)) m[1].split(/\s+/).forEach((c) => c && usedClasses.add(c));
  for (const m of code.matchAll(/cx\(([^)]*)\)/g)) {
    // Drop comparison operands first: size === 'sm' is a value, not a class.
    const args = m[1].replace(/[!=]==?\s*'[^']*'/g, '');
    for (const lit of args.matchAll(/'([a-zA-Z][\w-]*)'/g)) usedClasses.add(lit[1]);
  }
}
let missingCss = 0;
for (const cls of usedClasses) if (!defined.has(cls)) { fail(`CSS class ".${cls}" is used but not defined in styles.css`); missingCss += 1; }
console.log(missingCss === 0 ? `  ✓ all ${usedClasses.size} CSS classes are defined` : '');

console.log(failures === 0 ? '\n✅ all checks passed\n' : `\n❌ ${failures} problem(s) found\n`);
process.exit(failures === 0 ? 1 && 0 : 1);
