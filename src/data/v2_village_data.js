// Monde V2, Bosquet d'Émeraude : le village (4 écrans x 1). Zone en blocs.
// Histoire : src/story/v2_bosquet.js. Conception : docs/production/PLAN_MONDE_V2.md § 7.
//
// Plan (grille 64, on marche à y 448), d'est en ouest, le sens du prologue :
//   x 3650-3840  porte de l'Est (fermée la nuit, ouverte au bannissement)
//   x 2944-3648  la place : départ d'Agarica, jugement (cf. bosquet_bannissement)
//   x 2560-2944  murets du tutoriel de saut (1 puis 2 cases)
//   x 2432-2496  haie de ronces (la dague)
//   x 1472-2112  le chêne : souche, branche basse, branche haute, sortie vers les hauts
//   x 1280-1344  deuxième haie de ronces
//   x 450-1100   le père, le feu de camp
//   x 0-330      sortie vers la source
// La haie va jusqu'à y 128 : ni le sol, ni les murets ne permettent de la sauter.
const V2_VILLAGE_DATA = {
  levelWidth: 3840,
  levelHeight: 576,
  zoneName: 'Le village',
  zoneSub: "Bosquet d'Émeraude",
  background: 'fond_bosquet',
  foregroundPlants: false,
  ambient: { tint: 0x0a1030, darkness: 0.1, vignette: false },
  xara: false,
  script: 'v2_village',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 60, [7, 8]),
    ...groundRow(23, 25, [6]),                  // souche : la marche vers la branche basse
    ...groundRow(26, 29, [4]),                  // branche basse (surface 256)
    ...groundRow(30, 33, [2]),                  // branche haute (surface 128) : on saute vers les hauts
    ...groundRow(40, 42, [6]),                  // muret d'une case
    ...groundRow(42, 44, [5, 6]),               // muret de deux cases
    ...groundRow(44, 46, [6]),
  ],
  breakables: [
    { id: 'ronces_est', by: 'sword', hits: 2, hint: 'mousse', ronces: true, cells: [[38, 2], [38, 3], [38, 4], [38, 5], [38, 6]] },
    { id: 'ronces_ouest', by: 'sword', hits: 2, hint: 'mousse', ronces: true, cells: [[20, 3], [20, 4], [20, 5], [20, 6]] },
  ],
  playerSpawn: { x: 3300, y: 440 },
  campfires: [{ x: 928, y: 448 }],
  props: [
    { type: 'bosquet_cabane_arbre', x: 3390, y: 448, scale: 0.8 },
    { type: 'bosquet_signpost', x: 3040, y: 448, scale: 0.5 },
    { type: 'bosquet_lamp_post', x: 2640, y: 448, scale: 0.55 },
    { type: 'bosquet_grand_arbre', x: 1990, y: 448, scale: 1.1 },
    { type: 'bosquet_well', x: 1180, y: 448, scale: 0.6 },
    { type: 'bosquet_cottage', x: 560, y: 448, scale: 0.8 },
    { type: 'bosquet_signpost', x: 180, y: 448, scale: 0.5 },
    { type: 'bosquet_muraille_tour', x: 3700, y: 448, scale: 0.6 },
    { type: 'bosquet_muraille_porte', x: 3790, y: 448, scale: 0.6 },
  ],
  npcs: [
    {
      id: 'pere_chef', x: 760,
      talk: [
        { requires: { v2Nuit: true }, talk: 'v2_pere_nuit' },
        { requires: { v2SourceLibree: true }, talk: 'v2_nuit' },
        { requires: { talismanOurs: true }, talk: 'v2_pere_attente' },
        { talk: 'v2_talisman' },
      ],
      forbids: { idoleVolee: true },
    },
    { id: 'habitant_porteur', key: 'porteur', x: 1240, anim: 'idle', talk: 'bosquet_porteur', forbids: { idoleVolee: true } },
    { id: 'habitant_druide', key: 'druide_feu', x: 1040, anim: 'burn', lookAtPlayer: false, talk: 'bosquet_druide_feu', forbids: { idoleVolee: true } },
    { id: 'habitant_garde', key: 'garde_porte', x: 3720, talk: 'bosquet_garde_porte', forbids: { idoleVolee: true } },
    // Après le jugement (ils restent à leur place si la partie est rechargée).
    { id: 'pere_chef', key: 'pere', x: 3110, talk: 'bosquet_pere_adieu', requires: { banished: true } },
    { id: 'habitant_druide', key: 'orme_juge', x: 2990, talk: 'bosquet_orme_adieu', requires: { banished: true } },
    { id: 'habitant_garde', key: 'garde_barre', x: 2900, talk: 'v2_garde_barre', requires: { banished: true } },
  ],
  triggers: [
    { id: 'intro', x: 3300, w: 200, cutscene: 'v2_village_intro' },
    { id: 'tuto_saut', x: 2980, w: 40, cutscene: 'bosquet_tuto_saut' },
    { id: 'tuto_dague', x: 2640, w: 40, cutscene: 'v2_tuto_dague' },
    // Barrières douces (rejouables) : on ne saute pas une étape de l'histoire.
    { id: 'barriere_pere', x: 330, w: 30, once: false, forbids: { talismanOurs: true }, cutscene: 'v2_barriere_pere' },
    { id: 'barriere_bannie', x: 2850, w: 30, once: false, requires: { banished: true }, cutscene: 'v2_barriere_bannie' },
    { id: 'sanctuaire_ferme', x: 2016, y: 70, w: 192, h: 120, once: false, forbids: { v2Nuit: true }, cutscene: 'v2_sanctuaire_ferme' },
    { id: 'porte', x: 3790, w: 40, once: false, cutscene: 'v2_porte_est' },
  ],
  entries: [
    { id: 'from_source', x: 90, y: 440, height: 128, edge: 'left', from: 300, to: 448 },
    { id: 'from_hauts', x: 2016, y: 100, edge: 'top', from: 1920, to: 2112 },
    { id: 'jugement', x: 3200, y: 440, height: 128 },
  ],
  exits: [
    { edge: 'left', from: 300, to: 448, targetScene: 'V2SourceScene', data: { enterId: 'from_village' } },
    // Le script retire cette sortie tant que la nuit n'est pas tombée.
    { edge: 'top', from: 1920, to: 2112, targetScene: 'V2HautsBosquetScene', data: { enterId: 'from_village' } },
  ],
};
