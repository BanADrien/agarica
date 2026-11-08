// Zone « cime_cachee » — La cime cachée (vague 3, lot B).
// SQUELETTE du pré-lot (2026-11-08) : palier plat, trou de passage, passages
// DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié
// sur la voisine (arène de Kainati). Le lot B construit la zone (§ 2.4) en
// gardant les ids des entrées / sorties et leurs bornes.
//
// Passage : bas x 2304-2432 -> / <- arène de Kainati (sortie haute x 1600-1728,
// ouverte après la victoire, au-dessus de la branche des traces du loup).
const CIME_CACHEE_DATA = {
  zoneName: 'La cime cachée',
  zoneSub: 'Le village du peuple de Kainati',
  background: 'fond_grand_arbre',
  foregroundPlants: false,
  tileset: 'tuiles_ecorce',
  largeTrees: false,
  // Provisoire (copie de l'arène de Kainati) : réglé par le lot B à la capture.
  look: {
    profile: 'nuit',
    grade: { exposure: 1.05, contrast: 1.06, pivot: 0.2, sat: 1.0, mapAmt: 0.04, shadowAmt: 0.02, highAmt: 0.1 },
    back: { sat: 0.78, bright: 0.84, fog: 0x28183c, fogAmt: 0.1, mist: 0.14 },
  },
  levelWidth: 2560,
  levelTop: -1100,
  levelHeight: 540,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  fall: { y: 600, mode: 'hurt' },
  groundCells: [
    // Le palier (le lot B le remplace par une branche-plancher), coupé par le trou.
    ...groundRow(0, 36, [7, 8]),
    ...groundRow(38, 40, [7, 8]),
  ],
  playerSpawn: { x: 2200, y: 412 },
  entries: [
    // Point écrit à côté du trou (x 2368 du plan : au-dessus du vide).
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_arene', x: 2240, y: 400, height: 128 },
  ],
  exits: [
    { edge: 'bottom', from: 2304, to: 2432, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_cime' } },
  ],
};
