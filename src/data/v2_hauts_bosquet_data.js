// Monde V2, Bosquet d'Émeraude : les hauts du bosquet (2 écrans x 2). Zone en blocs.
// Histoire : src/story/v2_bosquet.js. Conception : docs/production/PLAN_MONDE_V2.md § 7.
//
// Le monde va de y -576 à y 576 (`levelTop`). La montée, depuis le trou du bas :
//   1. le couloir bas (x 768-1088) : de la mousse toxique pend du plafond. Les deux
//      bosses (une case) se passent au PETIT saut ; un saut tenu touche la mousse ;
//   2. l'escalier de l'ouest (surfaces 320, 192), puis le niveau 1 (surface 64) ;
//   3. le puits (gx 19-20) se saute ; y tomber ramène au village, sans punition ;
//   4. l'escalier de l'est (-64, -192), puis le plateau du sanctuaire (-320).
// Les marches sont pleines jusqu'au sol : une plateforme fine à deux rangées au-dessus
// d'un appui fait cogner la tête contre son rebord et coupe le saut (mesuré).
const V2_HAUTS_BOSQUET_DATA = {
  levelWidth: 1920,
  levelHeight: 576,
  levelTop: -576,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  zoneName: 'Les hauts du bosquet',
  zoneSub: 'La nuit',
  background: 'fond_bosquet',
  foregroundPlants: false,
  ambient: { tint: 0x060a22, darkness: 0.42, vignette: false },
  xara: false,
  script: 'v2_hauts_bosquet',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 2, [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]), // paroi ouest
    ...groundRow(2, 19, [7, 8]),                // sol du bas (le trou : gx 19-20)
    ...groundRow(12, 14, [6]),                  // bosse de l'ouest
    ...groundRow(15, 17, [6]),                  // bosse de l'est
    ...groundRow(7, 10, [5, 6]),                // marche 1 (surface 320)
    ...groundRow(5, 7, [3, 4, 5, 6]),           // marche 2 (surface 192)
    ...groundRow(8, 19, [1]),                   // niveau 1 (surface 64), plafond du couloir
    ...groundRow(21, 30, [1, 2, 3, 4, 5, 6, 7, 8]), // masse de l'est (surface 64)
    ...groundRow(25, 27, [-1, 0]),              // marche 3 (surface -64)
    ...groundRow(27, 30, [-3, -2, -1, 0]),      // marche 4 (surface -192)
    ...groundRow(2, 26, [-5]),                  // plateau du sanctuaire (surface -320)
  ],
  // Mousse toxique du couloir bas : y bas 235, soit 130 px de saut au-dessus du sol.
  v2Mousses: [
    { x: 768, y: 128, w: 320, h: 107 },
  ],
  playerSpawn: { x: 1120, y: 440 },
  props: [
    { type: 'bosquet_statue_hooded', x: 400, y: -320, scale: 0.6 },
    { type: 'bosquet_antler_totem', x: 480, y: -320, scale: 0.55 },
    { type: 'bosquet_statue_hooded', x: 560, y: -320, scale: 0.6 },
    { type: 'bosquet_standing_stone', x: 760, y: -320, scale: 0.55 },
  ],
  lights: [
    { id: 'fx_rai_lumiere', x: 480, y: -320, w: 130, h: 380, tint: 0xd8ecff, alpha: 0.38, forbids: { idoleVolee: true } },
  ],
  triggers: [
    { id: 'tuto_petit_saut', x: 1110, w: 40, y: 400, h: 120, cutscene: 'v2_tuto_petit_saut' },
    { id: 'vol', x: 900, y: -376, w: 40, h: 160, requires: { v2Nuit: true }, forbids: { idoleVolee: true }, cutscene: 'v2_vol' },
  ],
  entries: [
    // Par le bas : un point posé à côté du trou, sans `edge` (cf. PLAN_DEV, vague 3).
    { id: 'from_village', x: 1120, y: 440, height: 128 },
  ],
  exits: [
    { edge: 'bottom', from: 1216, to: 1344, targetScene: 'V2VillageScene', data: { enterId: 'from_hauts' } },
  ],
};
