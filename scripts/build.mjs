// Builds every distributable from tokens.json. No dependencies: `node scripts/build.mjs`.
// Outputs (dist/):
//   tokens.css          CSS variables (hex + "-hsl" triplets), light on :root, dark under [data-theme="dark"]
//   shadcn-v3.css       shadcn variables as HSL triplets, for apps whose tailwind config uses hsl(var(--x))
//   theme-v4.css        Tailwind v4 @theme block + shadcn variables, for admin
//   tailwind-preset.cjs Tailwind v3 preset (colours, radii, fonts, type scale, control sizes)
//   status.js / .d.ts   BOOKING_STATUS map shared by every product
//   design-system.tokens.css  the Design System artifact's tokens.css format (keep the artifact in sync)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = (name, text) => {
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist', name), text);
};
const header = `/* @namami/tokens ${pkg.version} — generated from tokens.json by scripts/build.mjs. Do not edit. */\n`;

const [light, dark] = tokens.color.themes.map((t) => t.id);
const colors = tokens.color.tokens;
const valueIn = (t, theme) => (typeof t.value === 'string' ? t.value : t.value[theme] ?? t.value[light]);
const shadows = tokens.shadow?.tokens ?? [];
const scalars = ['spacing', 'radius', 'size'].flatMap((k) => tokens[k]?.tokens ?? []);
const cssName = (n) => n.replace(/\./g, '\\.');

function hexToHslTriplet(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hue = 0, sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue *= 60;
  }
  const f = (n) => Number(n.toFixed(1));
  return `${f(hue)} ${f(sat * 100)}% ${f(l * 100)}%`;
}

// Fonts: apps load faces with next/font (variable --font-poppins / --font-mukta) or @fontsource;
// the stacks fall back to the family names so plain CSS works too.
const FONT_STACKS = {
  display: 'var(--font-poppins, "Poppins"), var(--font-mukta, "Mukta"), system-ui, sans-serif',
  text: 'var(--font-mukta, "Mukta"), system-ui, sans-serif',
  mono: tokens.type.families.mono,
};

// ── tokens.css ──────────────────────────────────────────────────────────────
function colorBlock(theme, withUsage) {
  return colors.map((t) => {
    const v = valueIn(t, theme);
    const usage = withUsage && t.usage ? ` /* ${t.usage.replace(/\*\//g, '* /')} */` : '';
    return `  --${t.name}: ${v};${usage}\n  --${t.name}-hsl: ${hexToHslTriplet(v)};`;
  }).join('\n') + '\n' + shadows.map((t) => `  --${t.name}: ${valueIn(t, theme)};`).join('\n');
}
const typeStyles = tokens.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: s.family ?? g.family })));
out('tokens.css', header +
  `:root, [data-theme="${light}"] {\n${colorBlock(light, true)}\n}\n` +
  `/* Dark values exist but dark mode is not shipped in v1.1. */\n[data-theme="${dark}"] {\n${colorBlock(dark, false)}\n}\n` +
  `:root {\n${scalars.map((t) => `  --${cssName(t.name)}: ${t.value};`).join('\n')}\n` +
  Object.entries(FONT_STACKS).map(([k, v]) => `  --font-${k}: ${v};`).join('\n') + '\n}\n');

// ── shadcn mapping ──────────────────────────────────────────────────────────
const SHADCN = {
  background: 'surface', foreground: 'ink',
  card: 'surface-raised', 'card-foreground': 'ink',
  popover: 'surface-raised', 'popover-foreground': 'ink',
  primary: 'brand', 'primary-foreground': 'on-brand',
  secondary: 'brand-soft', 'secondary-foreground': 'brand-soft-ink',
  muted: 'surface-sunken', 'muted-foreground': 'ink-muted',
  accent: 'brand-soft', 'accent-foreground': 'brand-soft-ink', // shadcn uses accent for every hover: never gold
  destructive: 'danger', 'destructive-foreground': 'on-danger',
  border: 'line', input: 'control-border', ring: 'focus',
};
const radiusMap = '  --radius: var(--radius-md);\n';
out('shadcn-v3.css', header + '/* For Tailwind v3 apps whose config reads colours as hsl(var(--x)). Import after tokens.css. */\n:root {\n' +
  Object.entries(SHADCN).map(([k, v]) => `  --${k}: var(--${v}-hsl);`).join('\n') + '\n' + radiusMap + '}\n');

const themeColors = colors.map((t) => `  --color-${t.name}: var(--${t.name});`).join('\n');
out('theme-v4.css', header + '/* Tailwind v4 (admin). Import after tokens.css. */\n:root {\n' +
  Object.entries(SHADCN).map(([k, v]) => `  --${k}: var(--${v});`).join('\n') + '\n' + radiusMap + '}\n' +
  '@theme inline {\n' + themeColors + '\n' +
  Object.keys(SHADCN).map((k) => `  --color-${k}: var(--${k});`).join('\n') + '\n' +
  (tokens.radius.tokens).map((t) => `  --${t.name}: ${t.value};`).join('\n') + '\n' +
  `  --font-display: ${FONT_STACKS.display};\n  --font-sans: ${FONT_STACKS.text};\n` +
  typeStyles.map((s) => `  --text-${s.name}: ${s.fontSize};\n  --text-${s.name}--line-height: ${s.lineHeight};\n  --text-${s.name}--font-weight: ${s.fontWeight};`).join('\n') +
  '\n}\n');

// ── Tailwind v3 preset ──────────────────────────────────────────────────────
const twColors = Object.fromEntries(colors.map((t) => [t.name, `hsl(var(--${t.name}-hsl) / <alpha-value>)`]));
const preset = {
  theme: {
    extend: {
      colors: twColors,
      borderRadius: { xs: 'var(--radius-xs)', sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)', full: 'var(--radius-full)' },
      fontFamily: { display: ['var(--font-display)'], sans: ['var(--font-text)'], text: ['var(--font-text)'] },
      fontSize: Object.fromEntries(typeStyles.map((s) => [s.name, [s.fontSize, { lineHeight: s.lineHeight, fontWeight: String(s.fontWeight), ...(s.letterSpacing ? { letterSpacing: s.letterSpacing } : {}) }]])),
      height: { 'control-sm': 'var(--control-sm)', 'control-md': 'var(--control-md)', 'control-lg': 'var(--control-lg)', 'control-xl': 'var(--control-xl)' },
      minHeight: { 'control-sm': 'var(--control-sm)', 'control-md': 'var(--control-md)', 'control-lg': 'var(--control-lg)', 'control-xl': 'var(--control-xl)' },
      width: { 'control-sm': 'var(--control-sm)', 'control-md': 'var(--control-md)', 'control-lg': 'var(--control-lg)', 'control-xl': 'var(--control-xl)' },
      minWidth: { 'control-sm': 'var(--control-sm)', 'control-md': 'var(--control-md)', 'control-lg': 'var(--control-lg)', 'control-xl': 'var(--control-xl)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
      maxWidth: { content: 'var(--content-max)', reading: 'var(--reading-max)' },
    },
  },
};
out('tailwind-preset.cjs', `/* @namami/tokens ${pkg.version} — generated. Do not edit. */\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`);

// ── tailwind-merge config ───────────────────────────────────────────────────
// cn()/twMerge assumes an unknown `text-*` is a colour, so `text-field-strong`
// silently removed a button's `text-primary-foreground`. Declare the brand type
// styles as font sizes and the control sizes as heights/widths.
const controls = ['control-sm', 'control-md', 'control-lg', 'control-xl'];
const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: typeStyles.map((s) => s.name) }],
      h: [{ h: controls }],
      'min-h': [{ 'min-h': controls }],
      w: [{ w: controls }],
      'min-w': [{ 'min-w': controls }],
    },
  },
};
out('tailwind-merge.js', `/* @namami/tokens ${pkg.version} — generated. Do not edit. */\n` +
  `/** Pass to extendTailwindMerge() (tailwind-merge v2 or v3) so cn() understands brand utilities. */\n` +
  `export const namamiTwMergeConfig = ${JSON.stringify(twMergeConfig, null, 2)};\n`);
out('tailwind-merge.d.ts', `export declare const namamiTwMergeConfig: {\n  extend: { classGroups: Record<string, Array<Record<string, string[]>>> };\n};\n`);

// ── Booking status map ──────────────────────────────────────────────────────
const STATUS = {
  received: { family: 'upcoming', icon: 'inbox', en: 'Received', hi: 'नई' },
  scheduled: { family: 'upcoming', icon: 'calendar', en: 'Scheduled', hi: 'तय' },
  rescheduled: { family: 'upcoming', icon: 'refresh-ccw', en: 'Rescheduled', hi: 'नया समय' },
  ongoing: { family: 'live', icon: 'circle-dot', en: 'Ongoing', hi: 'चालू' },
  completed: { family: 'done', icon: 'check', en: 'Completed', hi: 'पूरी' },
  cancelled: { family: 'stopped', icon: 'x', en: 'Cancelled', hi: 'रद्द' },
  expired: { family: 'stopped', icon: 'clock', en: 'Expired', hi: 'ख़त्म' },
  lapsed: { family: 'stopped', icon: 'clock', en: 'Lapsed', hi: 'छूट गई' },
};
out('status.js', `/* @namami/tokens ${pkg.version} — generated. Do not edit. */\n` +
  `export const BOOKING_STATUS = Object.freeze(${JSON.stringify(STATUS, null, 2)});\n` +
  `export const STATUS_FAMILIES = Object.freeze(["upcoming", "live", "done", "stopped"]);\n` +
  `/** Tailwind classes for a status pill, by family. */\nexport const STATUS_FAMILY_CLASSES = Object.freeze({\n` +
  `  upcoming: "bg-status-upcoming-bg text-status-upcoming-ink border-status-upcoming-border",\n` +
  `  live: "bg-status-live-bg text-status-live-ink border-transparent",\n` +
  `  done: "bg-status-done-bg text-status-done-ink border-transparent",\n` +
  `  stopped: "bg-status-stopped-bg text-status-stopped-ink border-transparent",\n});\n` +
  `export function bookingStatus(status) {\n  return BOOKING_STATUS[status] ?? null;\n}\n`);
out('status.d.ts', `export type BookingStatus = ${Object.keys(STATUS).map((s) => `'${s}'`).join(' | ')};\n` +
  `export type StatusFamily = 'upcoming' | 'live' | 'done' | 'stopped';\n` +
  `export interface BookingStatusInfo { family: StatusFamily; icon: string; en: string; hi: string }\n` +
  `export declare const BOOKING_STATUS: Readonly<Record<BookingStatus, BookingStatusInfo>>;\n` +
  `export declare const STATUS_FAMILIES: readonly StatusFamily[];\n` +
  `export declare const STATUS_FAMILY_CLASSES: Readonly<Record<StatusFamily, string>>;\n` +
  `export declare function bookingStatus(status: string): BookingStatusInfo | null;\n`);

// ── Design System artifact format ───────────────────────────────────────────
const fmtType = (s) => `${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${s.family})`;
out('design-system.tokens.css', `/* ${tokens.name} — generated from tokens.json */\n` +
  `:root, [data-theme="${light}"] {\n` +
  colors.map((t) => `  --${t.name}: ${valueIn(t, light)}; /* ${t.usage} */`).join('\n') + '\n' +
  shadows.map((t) => `  --${t.name}: ${valueIn(t, light)}; /* ${t.usage} */`).join('\n') + '\n}\n' +
  `[data-theme="${dark}"] {\n` + colors.map((t) => `  --${t.name}: ${valueIn(t, dark)};`).join('\n') + '\n' +
  shadows.map((t) => `  --${t.name}: ${valueIn(t, dark)};`).join('\n') + '\n}\n' +
  `:root {\n` + scalars.map((t) => `  --${cssName(t.name)}: ${t.value}; /* ${t.usage} */`).join('\n') + '\n' +
  Object.entries(tokens.type.families).map(([k, v]) => `  --font-${k}: ${v};`).join('\n') + '\n' +
  typeStyles.map((s) => `  --text-${s.name}: ${fmtType(s)}; /* ${s.usage} */`).join('\n') + '\n}\n' +
  typeStyles.map((s) => `.${s.name} {\n  font-family: var(--font-${s.family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n  letter-spacing: ${s.letterSpacing ?? 0};\n}`).join('\n') + '\n');

console.log(`built @namami/tokens ${pkg.version}: ${colors.length} colours, ${typeStyles.length} type styles`);
