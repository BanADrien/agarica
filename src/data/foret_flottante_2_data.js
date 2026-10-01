// Zone « foret_flottante_2 » — les îles flottantes (étape 9 de PLAN_DEV.md).
// Logique (totem de poche, Amanite, révélation du plané, grand départ en vol
// plané) : ZONE_SCRIPTS.acte2_ff2 dans src/story/acte2.js.
//
// Plan (surface d'une rangée gy = 64*gy) :
//   I0-I3  x 0-1344     îlots reliés par des sauts simples, corbeau ; ruines
//                       d'un ancien gardien (I3) : totem de poche cassé
//   I4     x 1536-2176  grande île : Amanite (1re rencontre depuis le vol)
//   T1     x 2240-2496  totem de l'aigle, +3 rangées depuis I4 : atteignable
//                       au double saut de base (ou singe) AVANT d'avoir l'aigle
//   T1→T2  x 2496-2880  6 cases de vide : impossible sans planer. Filet de
//                       sécurité N (gy 8) dessous + courant d'air qui remonte
//                       l'aigle au niveau de T2 ; marche S1 pour remonter à pied
//   T3     x 3200-3456  rampe d'envol ; 9 cases de vide puis la sortie (bord
//                       droit, toute hauteur) : long plané vers la clairière.
const FORET_FLOTTANTE_2_DATA = {
  zoneName: 'Les îles flottantes',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  tileset: 'tuiles_flottantes',
  levelWidth: 4096,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 6, [5, 6]),     // I0 arrivée (surface 320)
    ...groundRow(8, 11, [6]),       // I1 (surface 384)
    ...groundRow(12, 15, [4]),      // I2 (surface 256)
    ...groundRow(17, 22, [5, 6]),   // I3 ruines (surface 320)
    ...groundRow(24, 34, [6, 7]),   // I4 île d'Amanite (surface 384)
    ...groundRow(35, 39, [3]),      // T1 totem de l'aigle (surface 192)
    ...groundRow(39, 41, [5]),      // S1 marche de retour (surface 320)
    ...groundRow(37, 48, [8]),      // N filet de sécurité (surface 512)
    ...groundRow(45, 49, [3]),      // T2 (surface 192)
    ...groundRow(50, 54, [3]),      // T3 rampe d'envol (surface 192)
  ],
  avoidRanges: [[0, 4096]],
  playerSpawn: { x: 120, y: 280 },
  fall: { y: 600, mode: 'hurt' },
  props: [
    { type: 'bosquet_standing_stone', x: 1120, y: 320, scale: 0.3 },
    { type: 'bosquet_mossy_rock', x: 1310, y: 320, scale: 0.3 },
    { type: 'bosquet_antler_totem', x: 3390, y: 192, scale: 0.28 },
  ],
  totems: [
    { x: 2400, y: 192, flag: 'hasEagleForm', message: "L'aigle t'a choisie.\nDouble saut : tu planes. S : piqué." },
  ],
  pickups: [
    { item: 'totem_poche_casse', x: 1216, cutscene: 'ff2_totem_poche' },
  ],
  npcs: [
    { id: 'amanite', x: 1990, facing: 'left', forbids: { amaniteMet: true }, lookAtPlayer: false },
  ],
  triggers: [
    { id: 'intro', x: 260, w: 64, cutscene: 'ff2_intro' },
    { id: 'amanite', x: 1720, w: 64, cutscene: 'amanite_rencontre', forbids: { amaniteMet: true } },
    { id: 'envol', x: 3330, w: 64, cutscene: 'ff2_envol', requires: { hasEagleForm: true } },
  ],
  enemies: [
    { type: 'corbeau', x: 760, y: 90, patrolMinX: 560, patrolMaxX: 980, diveDepth: 220 },
    { type: 'mousse_creature', x: 1290, y: 260, patrolMinX: 1150, patrolMaxX: 1340 },
    { type: 'corbeau', x: 3150, y: 60, patrolMinX: 2950, patrolMaxX: 3350, diveDepth: 120 },
  ],
  windCurrents: [
    // Décor avant l'aigle (entre I1 et I2) : on voit le vent monter.
    { x: 720, y: 40, w: 40, h: 440, force: 300 },
    // Sur le filet N : ramène l'aigle au niveau de T2.
    { x: 2690, y: 90, w: 120, h: 422, force: 330 },
  ],
  entries: [
    { id: 'from_ff1', x: 110, y: 250, height: 120 },
    { id: 'from_clairiere', x: 3420, y: 150, height: 80 },
  ],
  exits: [
    { x: 16, y: 250, height: 140, targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_ff2' } },
    // Bord droit, toute la hauteur : on l'atteint en planant depuis T3.
    { x: 4080, y: 270, height: 640, targetScene: 'ClairierePlanteScene', data: { enterId: 'from_ff2' } },
  ],
  script: 'acte2_ff2',
};
