// Zone « marais_brumes » — Le marais des brumes (vague 3, lot C).
// SQUELETTE du pré-lot (2026-11-08) : sol plat, échelle sous le trou, passages
// DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié
// sur la voisine (clairière de la plante). Le lot C construit la zone (§ 2.7)
// en gardant les ids des entrées / sorties et leurs bornes.
//
// Passage : haut x 576-704 -> / <- clairière (bouchon de terre cassé à l'ours,
// x 1472-1600 là-haut). On tombe sur la marche 64 ; pour remonter : marches de
// 2 rangées (saut simple), 320 -> 192 -> 64, puis un saut repasse le bord haut.
const MARAIS_BRUMES_DATA = {
  zoneName: 'Le marais des brumes',
  zoneSub: 'Sous la clairière',
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
  levelWidth: 3840,
  levelHeight: 720,
  fall: { y: 600, mode: 'hurt' },
  // 2026-11-12 (retour utilisateur) : îles volantes et nuages de la forêt
  // flottante 2 (zone sans ciel qui se révèle : nuages en couche `clouds`).
  farLayers: [
    { id: 'couche_iles_lointaines', y: 0, scale: 0.4, alpha: 1, tint: 0xd2e0f2, scrollX: 0.15, scrollY: 0.2, floating: true, maxBottom: 300 },
    { id: 'nuages', clouds: 6, y: 20, maxBottom: 230, scrollX: 0.12, scrollY: 0.2 },
    { id: 'iles_proches', set: 'proches', only: [1, 2], every: 2, offsetX: 260, y: -30, scale: 0.7, alpha: 1,
      tint: 0xeef3fb, scrollX: 0.24, scrollY: 0.26, floating: true, maxBottom: 260 },
  ],
  groundCells: [
    ...groundRow(0, 60, [7, 8]),     // berge (le lot C y met l'eau et les nénuphars)
    ...groundRow(9, 11, [5]),        // marche (x 576-704, surface 320)
    ...groundRow(12, 14, [3]),       // marche (x 768-896, surface 192)
    ...groundRow(9, 11, [1]),        // marche sous le trou (x 576-704, surface 64)
  ],
  playerSpawn: { x: 900, y: 412 },
  entries: [
    // Point écrit sur la berge (x 640, y 400 du plan : dans la marche 320).
    { id: 'from_clairiere', x: 900, y: 400, height: 128, edge: 'top', from: 576, to: 704 },
  ],
  exits: [
    { edge: 'top', from: 576, to: 704, targetScene: 'ClairierePlanteScene', data: { enterId: 'from_marais' } },
  ],
};
