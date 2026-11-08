// Zone « grotte_lisiere » — La grotte de la lisière (vague 3, lot A).
// SQUELETTE du pré-lot (2026-11-08) : sol plat, voûte, passages DÉFINITIFS
// (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié sur la
// voisine (forêt sombre 1). Le lot A construit la zone (§ 2.1) en gardant les
// ids des entrées / sorties et leurs bornes (`from` / `to`).
//
// Passages :
//   haut x 200-400   on y TOMBE depuis le gouffre aux lianes de la forêt sombre 1
//                    (sortie basse x 3840-4032 de FS1, même proportion) ; pas de
//                    retour par là : on ressort par les galeries
//   droite, sol 448  -> / <- galeries des racines
const GROTTE_LISIERE_DATA = {
  zoneName: 'La grotte de la lisière',
  zoneSub: 'Sous la forêt sombre',
  background: 'fond_trou_sombre',
  // Premier plan (touffes, lianes du haut) réservé à la forêt sombre 1-2.
  foregroundPlants: false,
  // Provisoire (copie de la forêt sombre 1) : réglé par le lot A à la capture.
  ambient: { tint: 0x070b22, darkness: 0.3 },
  look: 'foret_sombre',
  levelWidth: 4480,
  levelHeight: 720,
  fall: { y: 620, mode: 'hurt' },
  groundCells: [
    ...groundRow(0, 70, [7, 8]),     // sol (le lot A y creuse ruisseau et galerie des lianes)
    // Voûte pleine (gy 0), sauf le puits d'arrivée x 128-448 sous la sortie de FS1.
    ...groundRow(0, 2, [0]),
    ...groundRow(7, 70, [0]),
  ],
  playerSpawn: { x: 300, y: 412 },
  entries: [
    { id: 'from_foret_sombre_1', x: 300, y: 400, height: 128, edge: 'top', from: 200, to: 400 },
    { id: 'from_galeries', x: 4380, y: 400, height: 128, edge: 'right', to: 448 },
  ],
  exits: [
    { edge: 'right', to: 448, targetScene: 'GaleriesRacinesScene', data: { enterId: 'from_grotte' } },
  ],
};
