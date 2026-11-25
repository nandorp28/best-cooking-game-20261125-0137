// SIMMER & SERVE — hand-in program (Node 22, standard library only).
// The game lives in game/ as plain static files and its screenshots in
// screenshots/. This program copies both into the output directory and
// writes /output/dossier.json with the kit's vendored library, so the
// judge reads the same dossier the gate rebuilds byte for byte.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader: /output is the mount, so it is used as-is.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Only create directories and write files; never delete the output dir
// (in the grader it is a mount, and removing it fails the run). Verified
// locally as user 65534 via setpriv: the hand-in completes and the
// dossier is byte-identical to the one built as root.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps, so a hand-in that would fail is refused here first:
// at most 4 screenshots, each at most 256 KiB; game/ at most 993 entries
// and 48 MiB; no path under game/ over 1,000 bytes; dossier text capped.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('SIMMER & SERVE handed in to ' + out);
