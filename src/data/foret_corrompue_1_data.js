// Zone « foret_corrompue_1 » — le cœur de la corruption, juste après le crash
// (étape 12 de PLAN_DEV.md). Logique (réveil, mousse qui se referme derrière
// Agarica, touffes qui se tendent vers elle, papillons de Morgat, symbole que
// Xara reconnaît) : ZONE_SCRIPTS.acte2_fc1 dans src/story/acte2.js.
//
// Plan :
//   x 0-832      lisière malade, cratère du crash ; la mousse se referme
//                derrière Agarica (x ~420) une fois qu'elle avance
//   x 832-1664   galerie de mousse (voûte basse), créature ; refuge : feu de
//                camp (énergie pleine) + campement abandonné de Geralt (note)
//   x 1728-1920  amas de mousse sous un tronc tombé : compétence de l'ours
//   x 1920-3072  carrefour vivant : plateformes, créatures corrompues, arbre
//                marqué d'une spirale
//   x 3168-3232  mur de mousse vivante pleine hauteur : répulsif (E)
//   x 3232-4160  chemin de préparation, 2e feu de camp, entrée de l'arène
const FORET_CORROMPUE_1_DATA = {
  zoneName: 'La forêt corrompue',
  zoneSub: 'Cœur de la corruption',
  background: 'fond_foret_corrompue',
  tileset: 'tuiles_corrompues',
  ambient: { tint: 0x1d3a12, darkness: 0.3 },
  levelWidth: 4160,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 65, [7, 8]),
    ...groundRow(14, 20, [3]),          // voûte de la galerie de mousse
    ...groundRow(27, 30, [0, 1, 2, 3]), // tronc tombé au-dessus de l'amas (on ne saute pas par-dessus)
    ...groundRow(33, 36, [5]),          // carrefour : branche basse
    ...groundRow(38, 41, [3]),          // carrefour : branche haute (singe corrompu)
    ...groundRow(43, 46, [5]),          // carrefour : branche basse
  ],
  playerSpawn: { x: 160, y: 412 },
  campfires: [
    { x: 1400, y: 448 },
    { x: 3700, y: 448 },
  ],
  props: [
    { type: 'bosquet_crates', x: 1560, y: 448, scale: 0.28 },
    { type: 'bosquet_log_pile', x: 1640, y: 448, scale: 0.3 },
    { type: 'bosquet_mossy_rock', x: 2950, y: 448, scale: 0.35 },
    { type: 'bosquet_mossy_rock', x: 3500, y: 448, scale: 0.3 },
  ],
  pickups: [
    { item: 'note_geralt', x: 1600, cutscene: 'fc1_note_geralt' },
  ],
  // Amas dense : fracas de l'ours. Monte jusqu'au tronc tombé (gy 3).
  mossBlocks: [{ id: 'amas_galerie', x: 1824, y: 320, w: 128, h: 256 }],
  // Mur vivant pleine hauteur : répulsif de Morgat.
  // Jusqu'au haut de la hitbox du sol (464) et 128 px de large : cf. le mur
  // de foret_sombre_2 (traversée en passant humain → loup contre le mur).
  mossWalls: [{ id: 'mur_coeur', x: 3200, y: 232, w: 128, h: 464 }],
  enemies: [
    { type: 'mousse_creature', x: 1100, y: 400, patrolMinX: 900, patrolMaxX: 1300 },
    { type: 'crapaud_corrompu', x: 2250, y: 400 },
    { type: 'singe_corrompu', x: 2560, y: 150, patrolMinX: 2440, patrolMaxX: 2620 },
    { type: 'mousse_creature', x: 2800, y: 400, patrolMinX: 2650, patrolMaxX: 3050 },
    { type: 'mousse_creature', x: 3450, y: 400, patrolMinX: 3300, patrolMaxX: 3600 },
  ],
  triggers: [
    { id: 'amas', x: 1700, w: 64, cutscene: 'fc1_amas' },
    { id: 'papillons', x: 2050, w: 64, cutscene: 'fc1_papillons' },
    { id: 'spirale', x: 2380, w: 64, cutscene: 'fc1_spirale' },
    { id: 'mur', x: 3080, w: 64, cutscene: 'fc1_mur' },
    { id: 'avant_arene', x: 3880, w: 64, cutscene: 'fc1_avant_arene' },
  ],
  entries: [
    { id: 'from_crash', x: 160, y: 400, height: 128 },
    { id: 'from_arene_ghilt', x: 4040, y: 400, height: 128 },
  ],
  exits: [
    { x: 4144, y: 400, height: 128, targetScene: 'AreneGhiltScene', data: { enterId: 'from_foret_corrompue' } },
  ],
  script: 'acte2_fc1',
};
