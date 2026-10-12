#!/usr/bin/env node
// Brand lint: rejects colours that bypass the tokens.
//   npx namami-lint src/app/(screens) src/components/captain
// Checks .ts/.tsx/.js/.jsx/.css files under the given paths for:
//   - raw hex colours (#0b4251)
//   - Tailwind palette classes (bg-teal-600, text-gray-500, border-white …)
//   - arbitrary colour values (bg-[#0b4251], text-[rgb(…)])
// Migrate an area, then add its path here in the repo's lint script, so it can never drift back.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const PALETTE = 'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white';
const UTIL = 'bg|text|border|border-[trblxy]|ring|ring-offset|outline|from|via|to|fill|stroke|divide|placeholder|shadow|decoration|accent|caret';
const RULES = [
  { name: 'tailwind palette class', re: new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*(?:${UTIL})-(?:${PALETTE})(?:-\\d{2,3})?(?:\\/\\d{1,3})?(?![\\w-])`, 'g') },
  { name: 'arbitrary colour value', re: /(?<![\w-])(?:[a-z0-9-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration)-\[(?:#|rgb|hsl|oklch)[^\]]*\]/g },
  { name: 'raw hex colour', re: /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g },
];
const IGNORE_LINE = /namami-lint-ignore/;

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const entry of readdirSync(p)) if (entry !== 'node_modules' && !entry.startsWith('.')) walk(join(p, entry));
  } else if (EXT.has(extname(p))) files.push(p);
};

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('usage: namami-lint <path> [path …]');
  process.exit(2);
}
for (const p of paths) walk(p);

let count = 0;
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (IGNORE_LINE.test(line)) return;
    for (const rule of RULES) {
      for (const m of line.matchAll(rule.re)) {
        count++;
        console.log(`${file}:${i + 1}  ${rule.name}: ${m[0]}`);
      }
    }
  });
}
console.log(`namami-lint: ${files.length} files, ${count} problem${count === 1 ? '' : 's'}`);
process.exit(count ? 1 : 0);
