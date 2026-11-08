// Zone « canopee_malade » — La canopée malade (vague 3, lot C).
// SQUELETTE du pré-lot (2026-11-08) : la première branche, passages
// DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié
// sur la voisine (forêt corrompue). Le lot C construit la zone (§ 2.10) en
// gardant les ids des entrées / sorties et leurs bornes.
//
// Passages :
//   bas x 896-1024  on y surgit depuis la branche haute du carrefour de la
//                   forêt corrompue (sortie haute x 2496-2624 là-bas, second saut)
//   tout le bas     une chute ramène SANS DÉGÂT sur cette branche haute
// Arrivée : point posé sur la première branche (entrée sans `edge`, cf.
// PLAN_DEV « Vague 3 »). L'appui de gauche n'est qu'un reste du squelette.
const CANOPEE_MALADE_DATA = {
  zoneName: 'La canopée malade',
  zoneSub: 'Au-dessus de la forêt corrompue',
  background: 'fond_arene_ghilt',
  foregroundPlants: false,
  tileset: 'tuiles_corrompues',
  // Provisoire (copie de la forêt corrompue) : réglé par le lot C à la capture.
  ambient: { tint: 0x1d3a12, darkness: 0.3 },
  look: {
    profile: 'nuit',
    grade: { sat: 1.02, map: [0x141026, 0x4a526a, 0xd9ffc8], mapAmt: 0.12 },
    back: { sat: 0.85, bright: 0.8, fog: 0x16221a, fogAmt: 0.1, mist: 0.16 },
  },
  levelWidth: 1920,
  levelTop: -600,
  levelHeight: 540,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  largeTrees: false,
  groundCells: [
    ...groundRow(11, 14, [7]),       // appui de gauche (x 704-896, surface 448)
    ...groundRow(16, 22, [7]),       // la première branche (x 1024-1408, surface 448)
  ],
  playerSpawn: { x: 1100, y: 412 },
  entries: [
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_foret_corrompue', x: 1100, y: 400, height: 128 },
  ],
  exits: [
    // Tout le bord bas : retour sur la branche haute du carrefour, sans dégât.
    { edge: 'bottom', targetScene: 'ForetCorrompue1Scene', data: { enterId: 'from_canopee' } },
  ],
};
