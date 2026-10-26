// Zone « foret_flottante_2 » — les îles flottantes (étape 9 de PLAN_DEV.md).
// Logique (totem de poche, Amanite, révélation du plané, grand départ en vol
// plané) : ZONE_SCRIPTS.acte2_ff2 dans src/story/acte2.js.
//
// Plan (surface d'une rangée gy = 64*gy) :
//   I0-I3  x 0-1344     îlots reliés par des sauts simples, corbeau ; ruines
//                       d'un ancien gardien (I3) : totem de poche cassé
//   I4     x 1536-2176  grande île : Amanite (1re rencontre depuis le vol)
//   T1     x 2240-2496  totem de l'aigle, +3 rangées depuis I4 : atteignable
//                       au bond du singe (seule forme aérienne avant l'aigle ;
//                       saut simple 172 px < 192)
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
  // Au-dessus de la canopée, dans la continuité de la montée de la forêt
  // flottante 1 : plein jour (ciel déjà révélé), caméra qui suit l'aigle en
  // hauteur (zone morte), plus de forêt procédurale (on est au-dessus).
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  skyReveal: { start: -1, end: 0, leaves: false },
  largeTrees: false,
  // Brume du vide sous les îles (bande devant le fond, derrière le sol).
  liquidFloor: { y: 520, style: 'brume' },
  // Lointain peint (lot Codex n°8, clé `farLayers`) : l'horizon de la forêt
  // malade, assombri par la teinte, présage de la suite à l'est ; il se lève
  // en avançant vers l'est (fadeInX) et remplace l'horizon sombre dessiné que
  // le script n'affiche plus.
  // Îles lointaines (option H4, revue du lot 8 : image jamais affichée) : les
  // îles des anciens gardiens, en haut du ciel, plus loin que celles du fond
  // peint (parallaxe 0,15 / 0,2). Petites (0,4), translucides (0,5) et
  // bleuies par la teinte (l'image est d'un vert saturé ; une teinte ne peut
  // qu'assombrir, elle tire ici vers le lointain bleuté) : de la profondeur,
  // sans faire concurrence aux îles peintes.
  farLayers: [
    { id: 'couche_iles_lointaines', y: 0, scale: 0.4, alpha: 0.5, tint: 0xa8c4e8, scrollX: 0.15, scrollY: 0.2 },
    { id: 'couche_horizon_malade', y: 400, scale: 0.45, tint: 0x3c4e44, scrollX: 0.3, scrollY: 0.3, fill: true, fadeInX: [1400, 2400] },
  ],
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
  // Points de reprise : ruines (I3), île d'Amanite (I4), rampe d'envol (T3).
  checkpoints: [{ x: 1120, y: 320 }, { x: 1600, y: 384 }, { x: 3240, y: 192 }],
  // Décors des îles (`foret_flottante`) ; les ruines du gardien (I3) gardent
  // leurs pierres du bosquet.
  props: [
    { type: 'foret_flottante_fleurs_hautes', x: 250, y: 320, scale: 0.28 },
    { type: 'foret_flottante_pissenlit_geant', x: 870, y: 256, scale: 0.28 },
    { type: 'bosquet_standing_stone', x: 1120, y: 320, scale: 0.3 },
    { type: 'bosquet_mossy_rock', x: 1310, y: 320, scale: 0.3 },
    { type: 'bosquet_standing_stone', x: 1370, y: 320, scale: 0.22 },   // ruine du gardien
    { type: 'foret_flottante_arbre_jeune', x: 2090, y: 384, scale: 0.42 },
    { type: 'foret_flottante_fleurs_hautes', x: 1700, y: 384, scale: 0.26 },
    { type: 'foret_flottante_arbre_jeune', x: 3010, y: 192, scale: 0.36 },
    { type: 'bosquet_antler_totem', x: 3390, y: 192, scale: 0.28 },
  ],
  totems: [
    { x: 2400, y: 192, flag: 'hasEagleForm', message: "L'aigle t'a choisie.\nEspace en l'air : tu planes. S : piqué." },
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
