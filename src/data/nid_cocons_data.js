// Zone « nid_cocons » — Le nid des cocons (vague 3, lot C).
// SQUELETTE du pré-lot (2026-11-08) : sol plat, corniche d'arrivée, marches
// sous le trou, passages DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3),
// rendu provisoire copié sur la voisine (forêt corrompue). Le lot C construit
// la zone (§ 2.9) en gardant les ids des entrées / sorties et leurs bornes.
//
// Passage : haut x 2176-2304 -> / <- forêt corrompue (sol fissuré cassé à
// l'ours, x 2688-2816 là-haut). On tombe sur la marche 64 ; pour remonter :
// corniche 320 -> marche 192 -> marche 64 (saut simple), puis le bord haut.
const NID_COCONS_DATA = {
  zoneName: 'Le nid des cocons',
  zoneSub: 'Sous la forêt corrompue',
  background: 'fond_trou_sombre',
  foregroundPlants: false,
  tileset: 'tuiles_corrompues',
  // Provisoire (copie de la forêt corrompue) : réglé par le lot C à la capture.
  ambient: { tint: 0x1d3a12, darkness: 0.3 },
  look: {
    profile: 'nuit',
    grade: { sat: 1.02, map: [0x141026, 0x4a526a, 0xd9ffc8], mapAmt: 0.12 },
    back: { sat: 0.85, bright: 0.8, fog: 0x16221a, fogAmt: 0.1, mist: 0.16 },
  },
  levelWidth: 2560,
  levelHeight: 720,
  fall: { y: 620, mode: 'hurt' },
  groundCells: [
    ...groundRow(0, 40, [7, 8]),
    ...groundRow(32, 38, [5]),       // corniche d'arrivée (x 2048-2432, surface 320)
    ...groundRow(38, 40, [3]),       // marche (x 2432-2560, surface 192)
    ...groundRow(34, 36, [1]),       // marche sous le trou (x 2176-2304, surface 64)
  ],
  playerSpawn: { x: 2240, y: 250 },
  entries: [
    { id: 'from_foret_corrompue', x: 2240, y: 250, height: 100, edge: 'top', from: 2176, to: 2304 },
  ],
  exits: [
    { edge: 'top', from: 2176, to: 2304, targetScene: 'ForetCorrompue1Scene', data: { enterId: 'from_nid' } },
  ],
};
