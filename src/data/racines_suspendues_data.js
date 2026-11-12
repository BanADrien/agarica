// Zone « racines_suspendues » — Les racines suspendues (vague 3, lot C).
// SQUELETTE du pré-lot (2026-11-08) : plafond, R1 à droite, R2-R4 à gauche,
// passages DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu
// provisoire copié sur la voisine (clairière de la plante). Le lot C construit
// la zone (§ 2.8) en gardant les ids des entrées / sorties et leurs bornes.
//
// Passages (deux trous dans le plafond, rangée gy -6) :
//   haut x 2240-2368  -> / <- clairière (trou au pied du courant, x 0-128 là-haut)
//   haut x 384-512    -> îles flottantes (on surgit à gauche du filet N)
// Là-haut, on arrive à un point posé à côté du trou (entrées sans `edge`) :
// le sens dans lequel on saute n'a pas d'importance.
// Les trous du plafond sont 64 px plus larges que les passages de chaque côté
// (x 320-576 et 2176-2432) : arrivée au bord du passage, le corps (50 px de
// large) mordait sur le plafond et le jeu le remontait… PAR-DESSUS le plafond.
const RACINES_SUSPENDUES_DATA = {
  zoneName: 'Les racines suspendues',
  zoneSub: 'Sous les îles',
  background: 'fond_foret_flottante',
  foregroundPlants: false,
  tileset: 'tuiles_flottantes',
  // Provisoire (copie de la clairière) : réglé par le lot C à la capture.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.04, sat: 0.85, light: 1.03, contrast: 0.95 } } },
  },
  levelWidth: 2560,
  levelTop: -400,
  levelHeight: 540,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  skyReveal: { start: -1, end: 0, leaves: false },
  largeTrees: false,
  liquidFloor: { y: 480, style: 'brume' },
  // 2026-11-12 (retour utilisateur) : îles volantes de la forêt flottante 2
  // (les nuages viennent du ciel qui se révèle).
  farLayers: [
    { id: 'couche_iles_lointaines', y: 0, scale: 0.4, alpha: 1, tint: 0xd2e0f2, scrollX: 0.15, scrollY: 0.2, floating: true, maxBottom: 300 },
    { id: 'iles_proches', set: 'proches', only: [1, 2], every: 2, offsetX: 260, y: -30, scale: 0.7, alpha: 1,
      tint: 0xeef3fb, scrollX: 0.24, scrollY: 0.26, floating: true, maxBottom: 260, aboveClouds: true },
  ],
  fall: { y: 600, mode: 'hurt' },
  groundCells: [
    // Plafond (le dessous du plateau), sauf les deux trous de sortie.
    ...groundRow(0, 5, [-6]),
    ...groundRow(9, 34, [-6]),
    ...groundRow(38, 40, [-6]),
    // R1 (x 2048-2560, surface -128), marche -192 puis bloc -256 sous le trou.
    ...groundRow(32, 40, [-2]),
    ...groundRow(33, 35, [-3]),      // marche (x 2112-2240, surface -192)
    ...groundRow(35, 37, [-4, -3]),  // la plus haute (x 2240-2368, surface -256)
    // R2 (nid des corbeaux, surface 0), R3 (-128) à gauche, R4 (-256) sous le trou.
    ...groundRow(5, 11, [0]),        // R2 (x 320-704)
    ...groundRow(2, 4, [-2]),        // R3 (x 128-256)
    ...groundRow(6, 8, [-4]),        // R4 (x 384-512)
  ],
  playerSpawn: { x: 2470, y: -165 },
  entries: [
    // Point écrit sur R1 (x 2300, y -180 du plan : dans le bloc sous le trou).
    { id: 'from_clairiere', x: 2470, y: -165, height: 100, edge: 'top', from: 2240, to: 2368 },
  ],
  exits: [
    { edge: 'top', from: 2240, to: 2368, targetScene: 'ClairierePlanteScene', data: { enterId: 'from_racines_suspendues' } },
    { edge: 'top', from: 384, to: 512, targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_racines_suspendues' } },
  ],
};
