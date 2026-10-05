// Zone « epreuve_singe » : l'épreuve du peuple de Kainati, course VERTICALE
// de lianes dans les branches (acte 1, zone 7 de PLAN_DEV.md, optionnelle).
// On y entre par les lianes des racines (forme singe). Au sommet : le
// talisman du singe (compétence `pierre`). Logique : src/story/acte1_arbre.js
// (ZONE_SCRIPTS.epreuve_singe + CUTSCENES `epreuve_*`).
//
// `tallLevel` : caméra de y=-400 à 540. Deux étages de GRANDES lianes :
//   étage 1  sol de départ (x 0-448, y=448) → branche du milieu (x 1280-1664, y=192)
//            lianes 1a-1c vers la droite
//   étage 2  branche du milieu → SOMMET (x 0-256, y=-192), lianes 2a-2d vers
//            la gauche, chacune plus haute que la précédente
// Les lianes des deux étages sont intercalées (≥ 100 px d'écart) pour ne pas
// se saisir par erreur. Une prise en pleine montée fait grimper les mains
// (Liane.js) et raccourcit le balancier : les bas de lianes sont donc placés
// là où le saut arrive presque à son sommet.
// Raccourci : un grand balancement sur 1b ou 1c attrape directement 2b/2c,
// sans se poser sur la branche du milieu.
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
    ...groundRow(20, 26, [3]),      // branche du milieu (x 1280-1664, y=192)
    ...groundRow(0, 4, [-3]),       // le sommet (x 0-256, y=-192)
  ],
  playerSpawn: { x: 120, y: 412 },
  vines: [
    // Étage 1 (attaches y 20..-80, sous la trajectoire de l'étage 2 ; bas y 320..170)
    { x: 560, y: 20, length: 300 },   // 1a (proche du bord : prise facile)
    { x: 820, y: -80, length: 340 },  // 1b
    { x: 1080, y: -60, length: 230 }, // 1c (bas à hauteur de la branche)
    // Étage 2 (attaches y -420, bas y -20..-180), intercalées avec l'étage 1
    { x: 1300, y: -420, length: 400 }, // 2a (au-dessus du bord gauche de la branche : on peut s'y laisser tomber, S)
    { x: 950, y: -420, length: 330 },  // 2b
    { x: 690, y: -420, length: 280 },  // 2c
    { x: 430, y: -420, length: 240 },  // 2d
  ],
  checkpoints: [
    { x: 400, y: EPREUVE_SINGE_SURFACE_Y },
    { x: 1500, y: 192 },
    { x: 200, y: -192 },
  ],
  fall: { y: 520, mode: 'respawn' },
  campfires: [{ x: 230, y: EPREUVE_SINGE_SURFACE_Y }],
  pickups: [
    { item: 'talisman_singe', x: 110, y: -236, cutscene: 'epreuve_talisman' },
  ],
  triggers: [
    { id: 'intro', x: 300, w: 40, y: 400, h: 140, requires: { hasMonkeyForm: true }, cutscene: 'epreuve_intro' },
    // Garde-fous (rejouables) : sans le singe, ou avec l'aigle équipé dans les airs.
    { id: 'sans_singe', x: 330, w: 40, y: 400, h: 140, once: false, forbids: { hasMonkeyForm: true }, cutscene: 'epreuve_sans_singe' },
    { id: 'forme_aigle', x: 360, w: 40, y: 400, h: 140, once: false, requires: { airForm: 'eagle' }, cutscene: 'epreuve_forme_aigle' },
  ],
  exits: [
    { x: 16, y: 380, height: 160, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } },
    // (La fente du sommet, qui redescend vers les racines, est ajoutée par le
    // script une fois le talisman pris : EPREUVE_SINGE_SORTIE_SOMMET.)
  ],
  entries: [
    { id: 'from_racines', x: 120, y: 400, height: 100 },
  ],
};
