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
// Vague 3 (2026-11-08) : au carrefour, un sol creux cassable à l'ours (x 2688-
// 2816, sortie basse vers le nid des cocons) et, au-dessus de la branche haute,
// une sortie haute vers la canopée malade (x 2496-2624, second saut).
const FORET_CORROMPUE_1_DATA = {
  zoneName: 'La forêt corrompue',
  zoneSub: 'Cœur de la corruption',
  background: 'fond_foret_corrompue',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_corrompues',
  ambient: { tint: 0x1d3a12, darkness: 0.3 },
  // Rendu de cohésion (LookKit, cf. PLAN_DEV « Rendu de cohésion ») : la nuit
  // générique réglée pour la corruption (même réglage dans l'arène de Ghil't).
  // Plan de jeu : carte violet nuit -> vert lunaire un peu plus verte, saturation
  // gardée : la mousse toxique reste le signal de l'histoire. Fonds : moins
  // désaturés que la nuit (0,85 contre 0,62) et brume vert sombre au lieu du
  // violet, pour que le ciel toxique et la mousse du fond restent verts en reculant.
  look: {
    profile: 'nuit',
    grade: { sat: 1.02, map: [0x141026, 0x4a526a, 0xd9ffc8], mapAmt: 0.12 },
    back: { sat: 0.85, bright: 0.8, fog: 0x16221a, fogAmt: 0.1, mist: 0.16 },
  },
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
    ...groundRow(38, 41, [3]),          // carrefour : branche haute (arrivée de la canopée)
    ...groundRow(43, 46, [5]),          // carrefour : branche basse (singe corrompu)
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
    // Vague 3 : x 2600 (et non 2680) : elle cachait le sol creux du nid.
    { type: 'foret_corrompue_racine_tordue', x: 2600, y: 448, scale: 0.33 },
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
  // Vague 3 : le sol creux du nid des cocons (gx 42-43, peint aussi en sol
  // ci-dessus) : fracas de l'ours, puis on tombe dans le nid.
  breakables: [
    { id: 'sol_nid', by: 'bear', hint: 'fissure', cells: [[42, 7], [43, 7], [42, 8], [43, 8]] },
  ],
  enemies: [
    { type: 'mousse_creature', x: 1100, y: 400, patrolMinX: 900, patrolMaxX: 1300 },
    // Crapaud sauteur au sol, sous la branche basse (x 2112-2304, y 320) : ses
    // langues butent sur la branche, il se combat au sol ; bornes resserrées
    // pour ne pas déborder sous les branches du carrefour.
    { type: 'crapaud_sauteur', x: 2250, y: 400, patrolMinX: 2120, patrolMaxX: 2420 },
    // Singe corrompu sur la branche basse de DROITE (x 2752-2944, y 320).
    // Retour des joueuses (2026-11-09) : sur la branche haute (x 2440-2620), il
    // frappait aussitôt qui retombait de la canopée (arrivée x 2432-2624) ; il
    // y garde la branche haute à distance de jet, et il est calmé 2,5 s à cette
    // arrivée (acte2_fc1, ACTE2_FC1_ARRIVAL_CALM_MS).
    { type: 'singe_corrompu', x: 2870, y: 280, patrolMinX: 2790, patrolMaxX: 2930 },
    // Vague 3 : bornée à droite du sol creux (x 2688-2816), qui peut être ouvert.
    { type: 'mousse_creature', x: 2950, y: 400, patrolMinX: 2860, patrolMaxX: 3050 },
    { type: 'mousse_creature', x: 3450, y: 400, patrolMinX: 3300, patrolMaxX: 3600 },
  ],
  triggers: [
    { id: 'amas', x: 1700, w: 64, cutscene: 'fc1_amas' },
    { id: 'papillons', x: 2050, w: 64, cutscene: 'fc1_papillons' },
    { id: 'spirale', x: 2380, w: 64, cutscene: 'fc1_spirale' },
    { id: 'mur', x: 3080, w: 64, cutscene: 'fc1_mur' },
    { id: 'avant_arene', x: 3880, w: 64, cutscene: 'fc1_avant_arene' },
    // Vague 3 : bulles de Xara (sol creux, branche haute).
    { id: 'v3_sol', x: 2752, y: 400, w: 200, h: 120, forbids: { break_foret_corrompue_1_sol_nid: true }, cutscene: 'v3_fc1_sol' },
    { id: 'v3_haut', x: 2530, y: 150, w: 192, h: 100, cutscene: 'v3_fc1_haut' },
  ],
  entries: [
    { id: 'from_crash', x: 160, y: 400, height: 128 },
    { id: 'from_arene_ghilt', x: 4040, y: 400, height: 128, edge: 'right', to: 448 },
    // Vague 3 : retours du nid (par le trou) et de la canopée (sur la branche haute).
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_nid', x: 2640, y: 400, height: 128 },
    { id: 'from_canopee', x: 2530, y: 150, height: 100, edge: 'top', from: 2432, to: 2624 },
  ],
  exits: [
    { edge: 'right', to: 448, targetScene: 'AreneGhiltScene', data: { enterId: 'from_foret_corrompue' } },
    // Vague 3 : le sol creux (une fois cassé) et la trouée au-dessus de la branche haute.
    { edge: 'bottom', from: 2688, to: 2816, targetScene: 'NidCoconsScene', data: { enterId: 'from_foret_corrompue' } },
    { edge: 'top', from: 2496, to: 2624, targetScene: 'CanopeeMaladeScene', data: { enterId: 'from_foret_corrompue' } },
  ],
  script: 'acte2_fc1',
};
