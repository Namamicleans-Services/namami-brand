// Fails (exit 1) if any declared text/background pair drops below its WCAG minimum,
// or if two status families get closer than 15 in CIELAB lightness, in either theme.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const byName = Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t.value]));
const themes = tokens.color.themes.map((t) => t.id);

const channel = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const lightness = (hex) => {
  const y = luminance(hex);
  return 116 * (y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116) - 16;
};

// [foreground, background, minimum]. Body text and prices: 7:1 (outdoor legibility).
const PAIRS = [
  ['ink', 'surface', 7], ['ink', 'surface-raised', 7], ['ink', 'surface-sunken', 7],
  ['ink-muted', 'surface', 4.5], ['ink-muted', 'surface-raised', 4.5], ['ink-muted', 'surface-sunken', 4.5],
  ['brand', 'surface', 7], ['brand', 'surface-raised', 7],
  ['on-brand', 'brand', 4.5], ['on-brand', 'brand-hover', 4.5], ['brand-soft-ink', 'brand-soft', 4.5],
  ['on-gold', 'gold', 4.5], ['gold-soft-ink', 'gold-soft', 4.5],
  ['focus', 'surface', 3], ['focus', 'surface-raised', 3], ['focus', 'surface-sunken', 3], ['focus-on-brand', 'brand', 3],
  ['control-border', 'surface', 3], ['control-border', 'surface-raised', 3],
  ['success', 'surface-raised', 4.5], ['warning', 'surface-raised', 4.5], ['danger', 'surface-raised', 4.5], ['info', 'surface-raised', 4.5],
  ['on-danger', 'danger', 4.5],
  ['success-ink', 'success-soft', 4.5], ['warning-ink', 'warning-soft', 4.5], ['danger-ink', 'danger-soft', 4.5], ['info-ink', 'info-soft', 4.5],
  ['status-upcoming-ink', 'status-upcoming-bg', 4.5], ['status-upcoming-border', 'surface-raised', 3],
  ['status-live-ink', 'status-live-bg', 4.5], ['status-done-ink', 'status-done-bg', 4.5], ['status-stopped-ink', 'status-stopped-bg', 4.5],
];
const FAMILIES = ['upcoming', 'live', 'done', 'stopped'];

const val = (name, theme) => {
  const v = byName[name];
  if (v === undefined) throw new Error(`unknown token ${name}`);
  return typeof v === 'string' ? v : v[theme] ?? v[themes[0]];
};

let failures = 0;
for (const theme of themes) {
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(val(fg, theme), val(bg, theme));
    if (r < min) { failures++; console.error(`FAIL ${theme}: ${fg} on ${bg} = ${r.toFixed(2)}:1 (needs ${min})`); }
  }
  for (let i = 0; i < FAMILIES.length; i++) {
    for (let j = i + 1; j < FAMILIES.length; j++) {
      const d = Math.abs(lightness(val(`status-${FAMILIES[i]}-bg`, theme)) - lightness(val(`status-${FAMILIES[j]}-bg`, theme)));
      if (d < 15) { failures++; console.error(`FAIL ${theme}: status ${FAMILIES[i]} vs ${FAMILIES[j]} ΔL* ${d.toFixed(1)} (needs 15)`); }
    }
  }
}
console.log(`${PAIRS.length * themes.length} contrast pairs and ${6 * themes.length} status-family pairs checked, ${failures} failures`);
process.exit(failures ? 1 : 0);
