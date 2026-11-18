// Monde V2, Bosquet d'Émeraude : la source (2 écrans x 2). Zone en blocs.
// Histoire : src/story/v2_bosquet.js. Conception : docs/production/PLAN_MONDE_V2.md § 7.
//
// Le monde va de y -576 à y 576 (`levelTop`). De l'entrée (est, en haut) au bouchon :
//   1. sol de l'est (surface -128), on se laisse tomber jusqu'au couloir (surface 320) :
//      à droite, la porte barrée des caves ; à gauche, une marche vers le replat (256) ;
//   2. trois piliers à travers le bassin (256, 192, 128), le coffre visible dès le replat ;
//   3. la corniche basse (0), puis le sol de l'ouest (-64) et son monstre de mousse ;
//   4. le sol fissuré (gx 13-14) : le fracas de l'ours libère l'eau. On retombe
//      dans une poche de deux cases, dont on ressort d'un saut.
// Retour : du bout est du sol de l'ouest, on se laisse tomber sur le replat, puis
// on remonte par les appuis (128, 0) jusqu'au sol de l'est.
// Le cœur (corniche à 192 px au-dessus du sol de l'ouest) demande un second saut.
// Les sauts du chemin : 128 px de vide au plus, jamais plus d'une rangée en montant sur 128 px.
const V2_SOURCE_DATA = {
  levelWidth: 1920,
  levelHeight: 576,
  levelTop: -576,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  zoneName: 'La source',
  zoneSub: "Bosquet d'Émeraude",
  background: 'fond_bosquet',
  foregroundPlants: false,
  ambient: { tint: 0x0a1030, darkness: 0.14, vignette: false },
  xara: false,
  script: 'v2_source',
  // Sans la pieuvre, l'eau ramène au dernier appui sûr (un cœur de moins).
  fall: { y: 344, mode: 'hurt', shade: false },
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 2, [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]), // paroi ouest
    ...groundRow(2, 30, [7, 8]),                // fond du bassin
    ...groundRow(9, 11, [-4]),                  // corniche du cœur (surface -256), au-dessus du sol de l'ouest
    ...groundRow(2, 5, [0]),                    // corniche basse (surface 0)
    ...groundRow(7, 13, [-1]),                  // sol de l'ouest (surface -64)
    ...groundRow(15, 18, [-1]),
    [12, 0, 'dirt'], [15, 0, 'dirt'],           // poche sous le bouchon
    ...groundRow(12, 16, [1]),
    ...groundRow(5, 8, [2, 3, 4, 5, 6]),        // pilier 3 (surface 128)
    ...groundRow(9, 12, [3, 4, 5, 6]),          // pilier 2 (surface 192)
    ...groundRow(13, 16, [4, 5, 6]),            // pilier 1 (surface 256)
    ...groundRow(16, 18, [6]),                  // butte du coffre
    ...groundRow(18, 20, [4, 5, 6]),            // replat (surface 256)
    ...groundRow(20, 30, [5, 6]),               // couloir de la porte (surface 320)
    ...groundRow(21, 24, [2]),                  // appui 1 (surface 128), au-dessus du couloir
    ...groundRow(25, 27, [0]),                  // appui 2 (surface 0)
    ...groundRow(28, 30, [-2]),                 // sol de l'est (surface -128)
    ...groundRow(29, 30, [-1, 0, 1, 2]),        // paroi au-dessus de la porte : on ne la saute pas
  ],
  breakables: [
    { id: 'bouchon', by: 'sol', hint: 'fissure', cells: [[13, -1], [14, -1]] },
  ],
  water: [
    { x: 128, y: 288, width: 1024, height: 160 },
  ],
  enemies: [
    { type: 'mousse_creature', x: 660, y: -112, patrolMinX: 520, patrolMaxX: 800, hp: 2 },
  ],
  chests: [
    { id: 'coffre_bassin', x: 1088, y: 384, contents: { eclats: 25 } },
  ],
  treasures: [
    { id: 'coeur_source', x: 640, y: -292, contents: { coeur: true } },
  ],
  v2Portes: [
    { id: 'porte_caves', x: 1888, y: 320, w: 32, h: 128, cote: 'dehors', flag: 'v2PorteCavesOuverte' },
  ],
  playerSpawn: { x: 1840, y: -136 },
  triggers: [
    { id: 'vu_porte', x: 1700, y: 200, w: 120, h: 160, cutscene: 'v2_vu_porte' },
    { id: 'vu_coffre', x: 1200, y: 200, w: 96, h: 160, cutscene: 'v2_vu_coffre' },
    { id: 'vu_coeur', x: 500, y: -130, w: 100, h: 140, cutscene: 'v2_vu_coeur' },
    { id: 'tuto_ours', x: 830, y: -130, w: 60, h: 140, forbids: { v2SourceLibree: true }, cutscene: 'v2_tuto_ours' },
    // Retour par les caves, après le bannissement : le village reste fermé.
    { id: 'village_barre', x: 1880, y: -190, w: 40, h: 140, once: false, requires: { banished: true }, cutscene: 'v2_village_barre' },
    // Fond du bassin (pieuvre) : la rivière souterraine n'est pas encore construite.
    { id: 'siphon', x: 256, y: 410, w: 128, h: 80, once: false, cutscene: 'v2_siphon' },
  ],
  entries: [
    { id: 'from_village', x: 1840, y: -136, height: 128, edge: 'right', from: -330, to: -128 },
    { id: 'from_caves', x: 1780, y: 312, height: 128, edge: 'right', from: 192, to: 320 },
  ],
  exits: [
    { edge: 'right', from: -330, to: -128, targetScene: 'V2VillageScene', data: { enterId: 'from_source' } },
    { edge: 'right', from: 192, to: 320, targetScene: 'V2CavesScene', data: { enterId: 'from_source' } },
  ],
};
