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
  // Spores toxiques qui dérivent dans l'air (lot Codex n°8,
  // `ambientLife.spores`) : le cœur de la corruption. Les lucioles gardent
  // leur nombre par défaut. (Pas de spores d'ambiance dans l'arène de
  // Ghil't : la spore y annonce une attaque.)
  ambientLife: { spores: 14 },
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
  // Décors de la corruption (`foret_corrompue`) ; le campement abandonné de
  // Geralt garde ses caisses et sa bûche. Rien sous la voûte basse ni contre
  // l'amas, le tronc tombé ou le mur de mousse.
  props: [
    { type: 'foret_corrompue_arbre_malade', x: 600, y: 448, scale: 0.5 },
    { type: 'foret_corrompue_os_creature', x: 1080, y: 448, scale: 0.28 },        // sous la voûte (208 px libres)
    // Mousse lumineuse pendue sous la voûte de la galerie (lot Codex n°8,
    // option H12) : `hang` = haut de l'image accroché en y 239, juste sous le
    // dessous visible des tuiles (rangée 3) ; deux plaques seulement, la
    // voûte a déjà ses coulures. Décor seul, aucune collision.
    { type: 'decor_mousse_lumineuse_plafond', x: 980, y: 239, hang: true },
    { type: 'decor_mousse_lumineuse_plafond', x: 1190, y: 239, hang: true, flipX: true },
    // Campement abandonné de Geralt (objets du lot 8, section `objet`) : un
    // collet laissé près du feu, une flèche plantée devant ses caisses
    // (`angle` : pointe enfoncée, empennage en l'air ; `y` = milieu du fût,
    // 6 px au-dessus du sol, comme les tirs d'entraînement de la forêt
    // flottante 1). « Si tu lis ceci, c'est que je suis passé par là. »
    // Collet à 0,164 (42 px de large, comme ceux du duel, cf. GeraltDuel
    // trapW) : à 0,13 (33 px), un fil brun d'un pixel, invisible sur l'herbe.
    { type: 'objet_collet', x: 1470, y: 448, scale: 0.164 },
    { type: 'objet_fleche', x: 1525, y: 442, angle: 70 },
    { type: 'bosquet_crates', x: 1560, y: 448, scale: 0.28 },
    { type: 'bosquet_log_pile', x: 1690, y: 448, scale: 0.3 },   // à côté de la note (x 1600), pas devant
    { type: 'foret_corrompue_champignon_toxique', x: 2020, y: 448, scale: 0.3 },
    { type: 'foret_corrompue_arbre_malade', x: 2470, y: 448, scale: 0.5 },     // l'arbre à la spirale (gravée par le script)
    { type: 'foret_corrompue_racine_tordue', x: 2680, y: 448, scale: 0.33 },
    { type: 'foret_corrompue_rocher_fissure', x: 2960, y: 448, scale: 0.3 },
    { type: 'foret_corrompue_pustule_mousse', x: 3060, y: 448, scale: 0.26 },
    { type: 'foret_corrompue_souche_corrompue', x: 3500, y: 448, scale: 0.34 },
    { type: 'foret_corrompue_pierre_symbole', x: 3960, y: 448, scale: 0.33 },     // à l'entrée de l'arène
  ],
  pickups: [
    { item: 'note_geralt', x: 1600, cutscene: 'fc1_note_geralt' },
  ],
  // Amas dense : fracas de l'ours. Monte jusqu'au tronc tombé (gy 3).
  mossBlocks: [{ id: 'amas_galerie', x: 1824, y: 320, w: 128, h: 256 }],
  // Mur vivant pleine hauteur : répulsif de Morgat.
  // Jusqu'au haut de la hitbox du sol (448 + GROUND_STAND_SINK : 464 avec le
  // jeu 'floor', 448 avec 'tuiles') et 128 px de large : cf. le mur de
  // foret_sombre_2 (traversée en passant humain → loup contre le mur).
  mossWalls: [{ id: 'mur_coeur', x: 3200, y: (448 + GROUND_STAND_SINK) / 2, w: 128, h: 448 + GROUND_STAND_SINK }],
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
    { id: 'from_arene_ghilt', x: 4040, y: 400, height: 128, edge: 'right', to: 448 },
  ],
  exits: [
    { edge: 'right', to: 448, targetScene: 'AreneGhiltScene', data: { enterId: 'from_foret_corrompue' } },
  ],
  script: 'acte2_fc1',
};
