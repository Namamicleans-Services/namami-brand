#!/usr/bin/env node
// Brand assets: keeps an app's copied logos and icons byte-identical to the kit.
//   npx namami-assets check   fails if any listed file differs from the kit or is missing
//   npx namami-assets sync    copies the kit's files into place
// Reads brand-assets.json in the current folder:
//   {
//     "files": { "public/brand/favicon.ico": "03-web-icons/namamicleans/favicon.ico" },
//     "dirs":  { "android/app/src/main/res": "02-app-icons/namamicleans/android/res" }
//   }
// Sources are relative to the kit's dist folder. A "dirs" entry covers every file the kit
// has under that folder; the app's folder may hold other files the kit doesn't make.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', 'kit', 'dist');
const MANIFEST = 'brand-assets.json';

const listFiles = (dir) => readdirSync(dir).flatMap((entry) => {
  const path = join(dir, entry);
  return statSync(path).isDirectory() ? listFiles(path) : [path];
});

// Every [app path, kit path] pair the manifest covers.
const pairs = (manifest) => {
  const files = Object.entries(manifest.files ?? {}).map(([target, source]) => [target, join(KIT, source)]);
  const dirs = Object.entries(manifest.dirs ?? {}).flatMap(([target, source]) =>
    listFiles(join(KIT, source)).map((file) => [join(target, relative(join(KIT, source), file)), file]));
  return [...files, ...dirs];
};

const problem = (target, source) => {
  if (!existsSync(source)) return `not in the kit: ${relative(KIT, source)}`;
  if (!existsSync(target)) return 'missing';
  if (!readFileSync(target).equals(readFileSync(source))) return `differs from kit ${relative(KIT, source)}`;
  return null;
};

const check = (all) => {
  const failures = all.map(([target, source]) => [target, problem(target, source)]).filter(([, p]) => p);
  for (const [target, p] of failures) console.log(`${target}  ${p}`);
  console.log(`namami-assets: ${all.length} files, ${failures.length} out of date${failures.length ? ' (run `npx namami-assets sync`)' : ''}`);
  return failures.length ? 1 : 0;
};

const sync = (all) => {
  const stale = all.filter(([target, source]) => problem(target, source));
  for (const [target, source] of stale) {
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    console.log(`updated ${target}`);
  }
  console.log(`namami-assets: ${all.length} files, ${stale.length} updated`);
  return 0;
};

const COMMANDS = { check, sync };
const command = COMMANDS[process.argv[2]];
if (!command) {
  console.error('usage: namami-assets check|sync   (reads brand-assets.json)');
  process.exit(2);
}
if (!existsSync(MANIFEST)) {
  console.error(`namami-assets: no ${MANIFEST} in ${process.cwd()}`);
  process.exit(2);
}
process.exit(command(pairs(JSON.parse(readFileSync(MANIFEST, 'utf8')))));
