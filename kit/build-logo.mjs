// Builds every Namamicleans logo file from two masters: the drop (src/drop.svg)
// and the wordmark, set in Poppins SemiBold and converted to outlines here so
// it can never be retyped. Run with `npm run kit` (Docker: node:22).
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const KIT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(KIT, 'dist/01-logo');

export const COLOURS = {
  teal: '#0B4251', // Namami Teal: logo, icons, brand moments
  gold: '#EFC663', // logo accent
  white: '#FFFFFF',
  black: '#000000',
};

// One drop master, recoloured per colourway: its body is teal, its accent gold.
const DROP_SRC = fs.readFileSync(path.join(KIT, 'src/drop.svg'), 'utf8');
const DROP_BOX = { w: 2072, h: 2704 };
const dropInner = DROP_SRC.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** body/accent: the drop's two colours. word/wordAccent: "Namami" and "cleans". */
export const COLOURWAYS = {
  primary: { body: COLOURS.teal, accent: COLOURS.gold, word: COLOURS.teal, wordAccent: COLOURS.teal, ground: COLOURS.white },
  reversed: { body: COLOURS.white, accent: COLOURS.gold, word: COLOURS.white, wordAccent: COLOURS.gold, ground: COLOURS.teal },
  teal: { body: COLOURS.teal, accent: COLOURS.teal, word: COLOURS.teal, wordAccent: COLOURS.teal, ground: COLOURS.white },
  white: { body: COLOURS.white, accent: COLOURS.white, word: COLOURS.white, wordAccent: COLOURS.white, ground: '#1F2933' },
  black: { body: COLOURS.black, accent: COLOURS.black, word: COLOURS.black, wordAccent: COLOURS.black, ground: COLOURS.white },
};

export function dropSvg(colourway, x, y, height) {
  const width = (height * DROP_BOX.w) / DROP_BOX.h;
  const art = dropInner
    .replaceAll(`fill="${COLOURS.teal}"`, `fill="${colourway.body}"`)
    .replaceAll(`fill="${COLOURS.gold}"`, `fill="${colourway.accent}"`);
  return { width, svg: `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${DROP_BOX.w} ${DROP_BOX.h}">${art}</svg>` };
}

// Wordmark: "Namami" + "cleans", Poppins 600, tracking -0.01em.
const FONT = opentype.loadSync(path.join(KIT, 'src/fonts/poppins-latin-600-normal.woff'));
const NAME = 'Namamicleans';
const SPLIT = 'Namami'.length;
const TRACKING = -0.01;

function wordmarkGlyphs(fontSize) {
  const paths = FONT.getPaths(NAME, 0, 0, fontSize, { letterSpacing: TRACKING });
  const bbox = (list) => {
    const boxes = list.map((p) => p.getBoundingBox());
    return {
      x1: Math.min(...boxes.map((b) => b.x1)), y1: Math.min(...boxes.map((b) => b.y1)),
      x2: Math.max(...boxes.map((b) => b.x2)), y2: Math.max(...boxes.map((b) => b.y2)),
    };
  };
  return { head: paths.slice(0, SPLIT), tail: paths.slice(SPLIT), box: bbox(paths) };
}

function wordmarkSvg(colourway, x, y, fontSize) {
  const { head, tail, box } = wordmarkGlyphs(fontSize);
  const d = (list) => list.map((p) => p.toPathData(3)).join('');
  // Shift so the ink box's top-left lands on (x, y).
  const tx = x - box.x1;
  const ty = y - box.y1;
  return {
    width: box.x2 - box.x1,
    height: box.y2 - box.y1,
    svg: `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)})"><path fill="${colourway.word}" d="${d(head)}"/><path fill="${colourway.wordAccent}" d="${d(tail)}"/></g>`,
  };
}

// Proportions, all in units of the wordmark's ink height (H, ~the cap height).
// Horizontal: drop is 1.62H tall, 0.46H from the name, centred on it.
// Stacked: drop is 3.1H tall, 0.62H above the name, centred over it.
// Clear space: one H on every side (H = the height of the "N").
const UNIT = 100; // H in SVG units
const FONT_SIZE = UNIT / ((FONT.tables.os2.sCapHeight || 0.7 * FONT.unitsPerEm) / FONT.unitsPerEm);

function layout(kind, colourway, withClearSpace) {
  const word = wordmarkGlyphs(FONT_SIZE);
  const wordH = word.box.y2 - word.box.y1;
  const pad = withClearSpace ? UNIT : 0;
  let parts;
  let w;
  let h;
  if (kind === 'horizontal') {
    const dropH = 1.62 * UNIT;
    const drop = dropSvg(colourway, pad, pad, dropH);
    const gap = 0.46 * UNIT;
    const wm = wordmarkSvg(colourway, pad + drop.width + gap, pad + (dropH - wordH) / 2, FONT_SIZE);
    w = drop.width + gap + wm.width + 2 * pad;
    h = dropH + 2 * pad;
    parts = [drop.svg, wm.svg];
  } else if (kind === 'stacked') {
    const dropH = 3.1 * UNIT;
    const wmProbe = wordmarkSvg(colourway, 0, 0, FONT_SIZE);
    const inner = Math.max(wmProbe.width, (dropH * DROP_BOX.w) / DROP_BOX.h);
    const drop = dropSvg(colourway, 0, pad, dropH);
    const dropX = pad + (inner - drop.width) / 2;
    const wm = wordmarkSvg(colourway, pad + (inner - wmProbe.width) / 2, pad + dropH + 0.62 * UNIT, FONT_SIZE);
    w = inner + 2 * pad;
    h = dropH + 0.62 * UNIT + wordH + 2 * pad;
    parts = [drop.svg.replace(`x="0"`, `x="${dropX}"`), wm.svg];
  } else if (kind === 'symbol') {
    const dropH = 4 * UNIT;
    const drop = dropSvg(colourway, pad, pad, dropH);
    w = drop.width + 2 * pad;
    h = dropH + 2 * pad;
    parts = [drop.svg];
  } else {
    const wm = wordmarkSvg(colourway, pad, pad, FONT_SIZE);
    w = wm.width + 2 * pad;
    h = wordH + 2 * pad;
    parts = [wm.svg];
  }
  const ground = withClearSpace ? `<rect width="100%" height="100%" fill="${colourway.ground}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">${ground}${parts.join('')}</svg>`;
}

export function logoSvg(kind, colourwayName, withClearSpace = false) {
  return layout(kind, COLOURWAYS[colourwayName], withClearSpace);
}

export function png(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

const KINDS = ['horizontal', 'stacked', 'symbol', 'wordmark'];
const PNG_WIDTHS = [600, 1200, 2400];

function main() {
  for (const dir of ['svg', 'svg/with-clear-space', 'png', 'png/with-clear-space']) fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  let count = 0;
  for (const kind of KINDS) {
    for (const cw of Object.keys(COLOURWAYS)) {
      const name = `namamicleans-${kind}-${cw}`;
      const svg = logoSvg(kind, cw);
      fs.writeFileSync(path.join(OUT, 'svg', `${name}.svg`), svg);
      for (const width of PNG_WIDTHS) fs.writeFileSync(path.join(OUT, 'png', `${name}@${width}w.png`), png(svg, width));
      const spaced = logoSvg(kind, cw, true);
      fs.writeFileSync(path.join(OUT, 'svg/with-clear-space', `${name}.svg`), spaced);
      fs.writeFileSync(path.join(OUT, 'png/with-clear-space', `${name}@2400w.png`), png(spaced, 2400));
      count += 2;
    }
  }
  console.log(`logo: ${count} SVG masters, ${count / 2 * (PNG_WIDTHS.length + 1)} PNGs`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) main();
