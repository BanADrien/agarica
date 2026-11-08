// Zone « cercle_lune » — Le cercle de lune (vague 3, lot A).
// SQUELETTE du pré-lot (2026-11-08) : sol plat, trou de passage, passages
// DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié
// sur la voisine (forêt sombre 2). Le lot A construit la zone (§ 2.3) en
// gardant les ids des entrées / sorties et leurs bornes.
//
// Passage : bas x 2112-2240 -> / <- forêt sombre 2 (trouée au-dessus du
// surplomb, x 4736-4864 là-bas : on en surgit, on y redescend).
const CERCLE_LUNE_DATA = {
  zoneName: 'Le cercle de lune',
  zoneSub: 'Au-dessus de la forêt sombre',
  background: 'fond_monde_spirituel',
  foregroundPlants: false,
  // Provisoire (copie de la forêt sombre 2) : réglé par le lot A à la capture.
  ambient: { tint: 0x070b22, darkness: 0.28 },
  look: { profile: 'foret_sombre', tiles: { backBright: 0.4 } },
  levelWidth: 2560,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 33, [7, 8]),
    // gx 33-34 (x 2112-2240) : le trou de passage vers la forêt sombre 2.
    ...groundRow(35, 40, [7, 8]),
  ],
  playerSpawn: { x: 1900, y: 412 },
  entries: [
    // Point écrit (reprise, réapparition) à côté du trou, pas au-dessus
    // (x 2176 du plan : on retombait aussitôt dans la forêt sombre 2).
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_foret_sombre_2', x: 2300, y: 400, height: 128 },
  ],
  exits: [
    { edge: 'bottom', from: 2112, to: 2240, targetScene: 'ForetSombre2Scene', data: { enterId: 'from_cercle_lune' } },
  ],
};
