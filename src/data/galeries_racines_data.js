// Zone « galeries_racines » — Les galeries des racines (vague 3, lot A).
// SQUELETTE du pré-lot (2026-11-08) : sol plat, montée sous le trou des
// racines, passages DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu
// provisoire copié sur la voisine (racines du grand arbre). Le lot A construit
// la zone (§ 2.2) en gardant les ids des entrées / sorties et leurs bornes.
//
// Passages :
//   gauche, sol 448   -> / <- grotte de la lisière
//   haut x 3788-3916  -> / <- racines du grand arbre (trou entre les racines,
//                     x 1664-1792 là-haut). On tombe sur la corniche (surface
//                     128) ; de là, un saut simple repasse le bord haut.
const GALERIES_RACINES_DATA = {
  zoneName: 'Les galeries des racines',
  zoneSub: 'Sous le grand arbre',
  background: 'fond_trou_sombre',
  foregroundPlants: false,
  tileset: 'tuiles_ecorce',
  // Provisoire (copie des racines) : réglé par le lot A à la capture.
  ambient: { tint: 0x0b1424, darkness: 0.18, vignette: false },
  look: {
    profile: 'nuit',
    grade: { exposure: 1.05, contrast: 1.06, pivot: 0.2, mapAmt: 0.1, shadowAmt: 0.02 },
    back: { sat: 0.78, bright: 0.84, fog: 0x28183c, fogAmt: 0.1, mist: 0.14 },
  },
  levelWidth: 4000,
  levelHeight: 720,
  fall: { y: 620, mode: 'hurt' },
  groundCells: [
    ...groundRow(0, 63, [7, 8]),     // sol (le lot A y creuse le pont qui manque)
    // Sous le pied de l'arbre : marches de 2 rangées (saut simple) jusqu'à la
    // corniche sous le trou des racines (x 3712-3968, surface 128).
    ...groundRow(52, 54, [5]),       // marche (x 3328-3456, surface 320)
    ...groundRow(55, 57, [3]),       // marche (x 3520-3648, surface 192)
    ...groundRow(58, 62, [2]),       // corniche (x 3712-3968, surface 128)
  ],
  playerSpawn: { x: 110, y: 412 },
  entries: [
    { id: 'from_grotte', x: 110, y: 400, height: 128, edge: 'left', to: 448 },
    { id: 'from_racines', x: 3850, y: 100, height: 100, edge: 'top', from: 3788, to: 3916 },
  ],
  exits: [
    { edge: 'left', to: 448, targetScene: 'GrotteLisiereScene', data: { enterId: 'from_galeries' } },
    { edge: 'top', from: 3788, to: 3916, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_galeries' } },
  ],
};
