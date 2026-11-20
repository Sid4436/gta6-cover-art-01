// Vice Cover Studio — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository to /output (or
// $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from vendor/makefun-app.ts.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

/** Copy a directory tree of plain files, refusing symlinks, in sorted order. */
function copyTree(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  const entries = readdirSync(srcDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entry of entries) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    const st = statSync(src);
    if (st.isSymbolicLink()) throw new Error(`${src}: a symbolic link (app/ holds plain files only)`);
    if (entry.isDirectory()) {
      copyTree(src, dest);
    } else if (entry.isFile()) {
      cpSync(src, dest);
    } else {
      throw new Error(`${src}: not a plain file or directory`);
    }
  }
}

function main(): void {
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appDir)) throw new Error('app/: no such directory in this repository');
  if (!existsSync(join(appDir, 'index.html'))) throw new Error('app/index.html: no such file');
  if (!existsSync(shotsDir)) throw new Error('screenshots/: no such directory in this repository');

  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTree(appDir, join(OUTPUT_DIR, 'app'));
  copyTree(shotsDir, join(OUTPUT_DIR, 'screenshots'));

  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  const shotCount = readdirSync(join(OUTPUT_DIR, 'screenshots')).filter((n) => !n.startsWith('.')).length;
  console.log(`Wrote ${OUTPUT_DIR}: app/ + ${shotCount} screenshot(s) + dossier.json (${dossier.length} bytes)`);
}

main();
