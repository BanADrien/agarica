// Zone « clairiere_plante » — la clairière préservée (étape 10 de PLAN_DEV.md).
// La plante aperçue d'en bas dans la forêt sombre : un cercle d'herbe saine
// autour d'elle, la mousse partout ailleurs. On y arrive en planant depuis les
// îles flottantes (le script remet Agarica en aigle à l'arrivée).
// Logique (cercle propre, prélèvement de la fleur, papillons qui montrent la
// hutte de Morgat) : ZONE_SCRIPTS.acte2_clairiere dans src/story/acte2.js.
//
// Plan : x 0-112 courant d'air qui remonte vers les îles (sortie en haut à
// gauche) ; plante au centre (x 1200) ; sortie droite vers la hutte, ouverte
// par le script une fois la fleur prélevée.
// Vague 3 (2026-11-08) : deux trous, deux sorties basses. Sous le courant
// (x 0-128), le bord effondré -> les racines suspendues : qui rate son plané
// vers les îles y tombe au lieu de perdre un cœur. À droite du cercle sain
// (x 1472-1600), un bouchon de terre cassable à l'ours -> le marais des brumes.
const CLAIRIERE_PLANTE_DATA = {
  zoneName: 'La clairière préservée',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  // Rendu de cohésion (LookKit.js) : plein jour, mêmes réglages que la forêt
  // flottante 2 (raisons détaillées là-bas). Rai sur la plante à 0,12 : à 0,5
  // (défaut), sa lumière multipliait le halo additif et brûlait la fleur.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.04, sat: 0.85, light: 1.03, contrast: 0.95 } } },
    lights: {
      raiAlpha: 1, haloAlpha: 1,
      rules: {
        feu: { radius: 160, intensity: 0.2, glow: 0.07 },
        lanterne: { radius: 130, intensity: 0.18, glow: 0.06 },
        rai: { radius: 180, intensity: 0.12, glow: 0.03 },
      },
    },
  },
  tileset: 'tuiles_flottantes',
  levelWidth: 2240,
  levelHeight: 540,
  groundCells: [
    // gx 0-1 : le bord effondré sous le courant (sortie basse, racines suspendues).
    ...groundRow(2, 35, [7, 8]),
    ...groundRow(11, 13, [6]),    // petite butte avant le cercle
    ...groundRow(26, 29, [6]),    // racines après le cercle
  ],
  avoidRanges: [[960, 1440]],
  playerSpawn: { x: 260, y: 412 },
  // Décors (`foret_flottante`) : fleurs hautes dans le cercle sain autour de la
  // plante, arbres et pissenlits en bordure.
  props: [
    { type: 'foret_flottante_arbre_jeune', x: 330, y: 448, scale: 0.45 },
    { type: 'bosquet_mossy_rock', x: 560, y: 448, scale: 0.3 },
    { type: 'foret_flottante_fleurs_hautes', x: 1060, y: 448, scale: 0.26 },
    { type: 'foret_flottante_fleurs_hautes', x: 1350, y: 448, scale: 0.24 },
    { type: 'foret_flottante_pissenlit_geant', x: 1960, y: 448, scale: 0.3 },
    { type: 'foret_flottante_arbre_jeune', x: 2110, y: 448, scale: 0.4 },
  ],
  enemies: [
    // Les bêtes malades rôdent autour du cercle sans jamais y entrer.
    // x 660 : en 700, son corps chevauchait le coin de la butte (x 704) et
    // elle restait perchée dessus, 64 px au-dessus du sol.
    { type: 'mousse_creature', x: 660, y: 400, patrolMinX: 520, patrolMaxX: 900 },
    // Crapaud sauteur, roi de la butte de racines (x 1664-1856, y 384) : il
    // bondit dessus sans en tomber (bornes + sol sondé) et vise Agarica en
    // contrebas, entre le cercle et la sortie vers la hutte.
    { type: 'crapaud_sauteur', x: 1760, y: 340, patrolMinX: 1680, patrolMaxX: 1840 },
  ],
  windCurrents: [{ x: 0, y: 40, w: 112, h: 410, force: 330 }],
  // Vague 3 : le bouchon de terre du marais (gx 23-24, peint aussi en sol
  // ci-dessus : l'éditeur et la carte le montrent plein). Fracas de l'ours.
  breakables: [
    { id: 'bouchon_marais', by: 'bear', hint: 'fissure', cells: [[23, 7], [24, 7], [23, 8], [24, 8]] },
  ],
  triggers: [
    // Vague 3 : bulles de Xara. Le bord, une fois la fleur prélevée (on repart
    // vers le courant) : à l'arrivée, la cinématique de la plante passe d'abord.
    { id: 'v3_bouchon', x: 1536, y: 400, w: 220, h: 120, forbids: { break_clairiere_plante_bouchon_marais: true }, cutscene: 'v3_clairiere_bouchon' },
    { id: 'v3_bord', x: 260, y: 400, w: 80, h: 120, requires: { fleurPrelevee: true }, cutscene: 'v3_clairiere_bord' },
  ],
  entries: [
    // Arrivée en plané depuis les îles : `inset` 140, hors du courant d'air
    // (x 0-112). À 44 px (défaut), l'aigle y naissait et, touches lâchées,
    // flottait sans fin : il ne se posait jamais, la cinématique d'arrivée
    // attendait. Le courant reste pour le retour vers la forêt flottante 2.
    { id: 'from_ff2', x: 230, y: 110, height: 60, edge: 'left', from: 90, to: 170, inset: 140 },
    { id: 'from_hutte', x: 2140, y: 400, height: 128, edge: 'right', to: 448 },
    // Vague 3 : on remonte des racines suspendues et du marais par leurs trous.
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_racines_suspendues', x: 200, y: 400, height: 128 },
    { id: 'from_marais', x: 1420, y: 400, height: 128 },
  ],
  exits: [
    // Haut du courant d'air, à gauche : retour vers les îles (T3).
    { edge: 'left', from: 0, to: 170, targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_clairiere' } },
    // Retirée par le script tant que la fleur n'est pas prélevée.
    { edge: 'right', to: 448, targetScene: 'HutteMorgatScene', data: { enterId: 'from_clairiere' } },
    // Vague 3 : les deux trous du sol.
    { edge: 'bottom', from: 0, to: 128, targetScene: 'RacinesSuspenduesScene', data: { enterId: 'from_clairiere' } },
    { edge: 'bottom', from: 1472, to: 1600, targetScene: 'MaraisBrumesScene', data: { enterId: 'from_clairiere' } },
  ],
  script: 'acte2_clairiere',
  // Paramètres lus par le script.
  plante: { x: 1200, radius: 230 },
};
