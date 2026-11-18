#!/usr/bin/env node
'use strict';
/*
 * Refait les cartes d'éclairage de tous les sprites préparés, À LA TAILLE VUE EN JEU :
 * `npm run lumiere:cartes`. L'échelle de chaque animation est celle du code du jeu (à reporter ici si
 * elle y change) : HUMAN_SCALE, AGARICA_ATTACK_SCALE, agaricaSheetScale (poses agarica_extra, slash, repos),
 * WOLF_SCALE (Player.js), CRAPAUD_SCALE (Crapaud.js),
 * `scale` du manifeste pour le grizzly et Kainati. Zoom de la caméra en jeu : 1.
 */
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const suite = (modele, ...indices) => indices.map((i) => `assets/sprites/${modele.replace('#', i)}`);
const CARTES = [
  { nom: 'agarica_walk', echelle: 0.24, fps: 12, vitesse: 190, images: suite('agarica_walk_frames/agarica_walk_#.png', 0, 1, 2, 3, 4, 5, 6, 7) },
  { nom: 'agarica_idle', echelle: 0.24, fps: 8, images: suite('agarica_frames/agarica_row0_#.png', 0, 1, 2, 3, 4, 5) },
  { nom: 'agarica_run', echelle: 0.24, fps: 12, images: suite('agarica_frames/agarica_row2_#.png', 0, 1, 2, 3, 4, 5) },
  { nom: 'agarica_attack', echelle: 0.204, fps: 14, images: suite('agarica_attack_frames/agarica_attack_#.png', 0, 1, 2, 3) },
  ...[['jump_rise', 0, 3, 0.3165, 10], ['jump_fall', 1, 3, 0.3165, 10], ['hurt', 2, 3, 0.3165, 12], ['death', 3, 4, 0.2939, 8], ['talk', 4, 4, 0.2939, 8],
    ['sad', 5, 4, 0.2939, 5], ['liane_hang', 6, 3, 0.3534, 6], ['liane_swing', 7, 4, 0.3534, 8], ['cast', 8, 5, 0.3534, 10], ['receive_item', 9, 4, 0.2497, 8]]
    .map(([a, row, n, echelle, fps]) => ({ nom: `agarica_${a}`, echelle, fps, images: suite(`agarica_extra_frames/agarica_extra_row${row}_#.png`, ...Array(n).keys()) })),
  ...[['side', 0], ['up', 1], ['down', 2]].map(([a, row]) => ({ nom: `agarica_slash_${a}`, echelle: 0.2742, fps: 18, images: suite(`agarica_slash_frames/agarica_slash_row${row}_#.png`, 0, 1, 2, 3) })),
  ...[['sit', 0, 8], ['sit_idle', 1, 4]].map(([a, row, fps]) => ({ nom: `agarica_${a}`, echelle: 0.3348, fps, images: suite(`agarica_repos_frames/agarica_repos_row${row}_#.png`, 0, 1, 2, 3) })),
  { nom: 'loup_run', echelle: 0.4, fps: 12, images: suite('loup_frames/loup_row0_#.png', 0, 1, 2, 3, 4, 5) },
  { nom: 'grizzly_run', echelle: 0.4214, fps: 12, images: suite('grizzly_frames/grizzly_row0_#.png', 0, 1, 2, 3) },
  { nom: 'crapaud', echelle: 0.26, fps: 12, images: suite('crapaud_frames/crapaud_row0_#.png', 0, 1, 2, 3).concat('assets/sprites/crapaud_frames/crapaud_row1_0.png') },
  { nom: 'kainati_idle', echelle: 0.6, fps: 6, images: suite('kainati_frames/kainati_row0_#.png', 0, 1, 2, 3) },
];

for (const c of CARTES) {
  const args = ['tools/sections.js', '--animation', ...c.images, '--echelle-jeu', String(c.echelle), '--fps', String(c.fps), '--nom', c.nom];
  if (c.vitesse) args.push('--vitesse', String(c.vitesse));
  execFileSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${c.nom} : ${c.images.length} images, échelle ${c.echelle}`);
}
