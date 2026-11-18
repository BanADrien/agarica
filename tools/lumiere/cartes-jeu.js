#!/usr/bin/env node
'use strict';
/*
 * Refait les cartes d'éclairage de tous les sprites préparés, À LA TAILLE VUE EN JEU :
 * `npm run lumiere:cartes`. L'échelle de chaque animation est celle du code du jeu (à reporter ici si
 * elle y change) : HUMAN_SCALE, AGARICA_ATTACK_SCALE, agaricaSheetScale (poses agarica_extra, slash, repos),
 * WOLF_SCALE (Player.js), CRAPAUD_SCALE (Crapaud.js),
 * `scale` du manifeste pour le grizzly et Kainati. Zoom de la caméra en jeu : 1.
 * Formes du labo : URSIDE_FRAME_K et URSIDE_TRANSFO_STEPS (Ursides.js), EAGLE_SCALE et TRANSFO_SCALE (Player.js).
 * `npm run lumiere:cartes -- grizzly aigle` : seulement les sprites dont le nom commence ainsi.
 */
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const suite = (modele, ...indices) => indices.map((i) => `assets/sprites/${modele.replace('#', i)}`);
// Rangée `transform` des ours : chaque image a sa propre échelle, d'Agarica (83 / 250) à l'animal
const transfoOurs = (nom, modele, echelle) => [0, 0.25, 0.7, 1].map((k, i) => ({
  nom: `${nom}_transform_${i}`, echelle: Number((83 / 250 + (echelle - 83 / 250) * k).toFixed(4)), fps: 20, images: suite(modele, i),
}));
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
  { nom: 'grizzly_charge', echelle: 0.4214, fps: 16, images: suite('grizzly_frames/grizzly_row1_#.png', 0, 1, 2, 3) },
  { nom: 'grizzly_jump', echelle: 0.4846, fps: 10, images: suite('grizzly_frames/grizzly_row2_#.png', 0, 1, 2) },
  ...transfoOurs('grizzly', 'grizzly_frames/grizzly_row3_#.png', 0.4214),
  { nom: 'aigle_vol', echelle: 0.28, fps: 8, images: suite('piaf_frames/piaf_row0_#.png', 0, 1, 2, 3) },
  { nom: 'aigle_plane', echelle: 0.28, fps: 8, images: suite('piaf_frames/piaf_row1_#.png', 0, 1, 2, 3) },
  { nom: 'aigle_pique', echelle: 0.28, fps: 7, images: suite('piaf_frames/piaf_row2_#.png', 0, 1, 2, 3, 4) },
  { nom: 'aigle_transfo', echelle: 0.3, fps: 13, images: ['row0_1', 'row1_1', 'row0_2'].map((c) => `assets/sprites/transformation/transfo_frames/transfo_${c}.png`) },
  { nom: 'ours_polaire_rear', echelle: 0.509, fps: 9, images: suite('ours_polaire_frames/ours_polaire_row0_#.png', 0, 1, 2, 3) },
  { nom: 'ours_polaire_slam', echelle: 0.509, fps: 9, images: suite('ours_polaire_frames/ours_polaire_row1_#.png', 0, 1, 2, 3) },
  ...transfoOurs('ours_polaire', 'ours_polaire_frames/ours_polaire_row2_#.png', 0.509),
  { nom: 'crapaud', echelle: 0.26, fps: 12, images: suite('crapaud_frames/crapaud_row0_#.png', 0, 1, 2, 3).concat('assets/sprites/crapaud_frames/crapaud_row1_0.png') },
  { nom: 'kainati_idle', echelle: 0.6, fps: 6, images: suite('kainati_frames/kainati_row0_#.png', 0, 1, 2, 3) },
  // Ennemis courants et Xara des zones de forêt (échelles : `scale` du manifeste, XARA_SCALE)
  ...[['idle', 0, 4, 8], ['attack', 1, 4, 10], ['death', 2, 5, 10]].map(([a, row, n, fps]) => ({ nom: `mousse_creature_${a}`, echelle: 0.26, fps, images: suite(`mousse_creature_frames/mousse_creature_row${row}_#.png`, ...Array(n).keys()) })),
  ...[['idle', 0, 4, 6], ['run', 1, 5, 12], ['throw', 2, 4, 10]].map(([a, row, n, fps]) => ({ nom: `singe_corrompu_${a}`, echelle: 0.28, fps, images: suite(`singe_corrompu_frames/singe_corrompu_row${row}_#.png`, ...Array(n).keys()) })),
  ...[['patrol', 0, 8], ['charge', 1, 14], ['bite', 2, 12]].map(([a, row, fps]) => ({ nom: `loup_sanguinaire_${a}`, echelle: 0.33, fps, images: suite(`loup_sanguinaire_frames/loup_sanguinaire_row${row}_#.png`, 0, 1, 2, 3) })),
  { nom: 'xara_walk', echelle: 0.15, fps: 10, images: suite('xara_frames/xara_walk_#.png', 0, 1, 2, 6, 7, 8) },
  { nom: 'xara_jump', echelle: 0.15, fps: 10, images: suite('xara_frames/xara_jump_#.png', 0, 1, 2, 3) },
  { nom: 'xara_switch', echelle: 0.15, fps: 10, images: suite('xara_frames/xara_switch_#.png', 1, 2, 3).concat('assets/sprites/xara_frames/xara_swing_0.png') },
];

const filtres = process.argv.slice(2);
for (const c of CARTES) {
  if (filtres.length && !filtres.some((f) => c.nom.startsWith(f))) continue;
  const args = ['tools/sections.js', '--animation', ...c.images, '--echelle-jeu', String(c.echelle), '--fps', String(c.fps), '--nom', c.nom];
  if (c.vitesse) args.push('--vitesse', String(c.vitesse));
  execFileSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${c.nom} : ${c.images.length} images, échelle ${c.echelle}`);
}
