// Zone « epreuve_singe » : l'épreuve du peuple de Kainati, course VERTICALE
// de lianes dans les branches (acte 1, zone 7 de PLAN_DEV.md, optionnelle).
// On y entre par les lianes des racines (forme singe). Au sommet : le
// talisman du singe (compétence `pierre`). Logique : src/story/acte1_arbre.js
// (ZONE_SCRIPTS.epreuve_singe + CUTSCENES `epreuve_*`).
//
// `tallLevel` : caméra de y=-400 à 540. Trois « étages » de lianes, chacun
// dans sa bande de hauteur (les lianes ne se chevauchent pas) :
//   étage 1  sol de départ (x 0-448, y=448) → branche 1 (x 1216-1472, y=192)
//            lianes 1a-1c, de gauche à droite
//   étage 2  branche 1 → branche 2 (x 256-576, y=-64), lianes 2a-2c vers la gauche
//   étage 3  branche 2 → SOMMET (x 1600-1920, y=-256), lianes 3a-3e vers la droite
// Raccourcis : un grand balancement sur 1c attrape directement 2a (sans se
// poser sur la branche 1), et à l'étage 3 un bon élan saute une liane sur deux.
// Une chute ramène au dernier point de reprise allumé (lanternes).
const EPREUVE_SINGE_SURFACE_Y = 448;

const EPREUVE_SINGE_DATA = {
  levelWidth: 1920,
  levelHeight: 540,
  tallLevel: true,
  zoneName: 'Épreuve du singe',
  zoneSub: 'Ne touche pas le sol',
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  ambient: { tint: 0x0b1424, darkness: 0.12 },
  script: 'epreuve_singe',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 7, [7, 8]),     // sol de départ (x 0-448)
    ...groundRow(19, 23, [3]),      // branche 1 (x 1216-1472, y=192)
    ...groundRow(4, 9, [-1]),       // branche 2 (x 256-576, y=-64)
    ...groundRow(25, 30, [-4]),     // le sommet (x 1600-1920, y=-256)
  ],
  playerSpawn: { x: 120, y: 412 },
  vines: [
    // Étage 1 (attaches y 0-110, bas y 200-320)
    { x: 580, y: 110, length: 210 },  // 1a
    { x: 800, y: 50, length: 210 },   // 1b
    { x: 1030, y: 0, length: 200 },   // 1c
    // Étage 2 (attaches y -250..-190, bas y 10..-70)
    { x: 1110, y: -190, length: 200 }, // 2a (au-dessus du bord gauche de la branche 1)
    { x: 900, y: -230, length: 190 },  // 2b
    { x: 690, y: -250, length: 180 },  // 2c
    // Étage 3 (attaches y -420, bas y ~-250), intercalées avec l'étage 2
    { x: 600, y: -420, length: 170 },  // 3a (au-dessus du bord droit de la branche 2)
    { x: 810, y: -420, length: 175 },  // 3b
    { x: 1020, y: -420, length: 170 }, // 3c
    { x: 1230, y: -420, length: 175 }, // 3d
    { x: 1440, y: -420, length: 165 }, // 3e
  ],
  checkpoints: [
    { x: 400, y: EPREUVE_SINGE_SURFACE_Y },
    { x: 1400, y: 192 },
    { x: 330, y: -64 },
    { x: 1660, y: -256 },
  ],
  fall: { y: 520, mode: 'respawn' },
  campfires: [{ x: 230, y: EPREUVE_SINGE_SURFACE_Y }],
  pickups: [
    { item: 'talisman_singe', x: 1800, y: -300, cutscene: 'epreuve_talisman' },
  ],
  triggers: [
    { id: 'intro', x: 300, w: 40, y: 400, h: 140, requires: { hasMonkeyForm: true }, cutscene: 'epreuve_intro' },
    // Garde-fous (rejouables) : sans le singe, ou avec l'aigle équipé dans les airs.
    { id: 'sans_singe', x: 330, w: 40, y: 400, h: 140, once: false, forbids: { hasMonkeyForm: true }, cutscene: 'epreuve_sans_singe' },
    { id: 'forme_aigle', x: 360, w: 40, y: 400, h: 140, once: false, requires: { airForm: 'eagle' }, cutscene: 'epreuve_forme_aigle' },
  ],
  exits: [
    { x: 16, y: 380, height: 160, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } },
    // Au sommet : la descente rapide vers les racines.
    { x: 1904, y: -320, height: 128, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } },
  ],
  entries: [
    { id: 'from_racines', x: 120, y: 400, height: 100 },
  ],
};
