// Monde V2, Bosquet d'Émeraude : les caves (4 écrans x 1, facultatif). Zone en blocs.
// Histoire : src/story/v2_bosquet.js. Conception : docs/production/PLAN_MONDE_V2.md § 7.
//
// Sous le village, retour en cachette. Plan (on marche à y 448), d'est en ouest :
//   x 3008-3712  arrivée des champignonnières (pas encore construites) : piste d'élan
//   x 2944-3008  mur fissuré : la charge du grizzly
//   x 2112-2496  papillon 12, sur l'estrade (marche 320, estrade 256)
//   x 1792-1920  le puits (eau) : la rivière, pour la pieuvre (pas encore construite)
//   x 768-1024   l'autel des guérisseurs : le talisman du panda
//   x 740        sous la place du village : on entend le père à travers le plancher
//   x 64-128     la porte de la source, qu'on débarre de l'intérieur
const V2_CAVES_DATA = {
  levelWidth: 3840,
  levelHeight: 576,
  zoneName: 'Les caves du bosquet',
  zoneSub: 'Sous le village',
  background: 'fond_trou_sombre',
  foregroundPlants: false,
  ambient: { tint: 0x05060f, darkness: 0.34, vignette: false },
  xara: false,
  script: 'v2_caves',
  // Sans la pieuvre, l'eau du puits ramène au bord.
  fall: { y: 520, mode: 'hurt', shade: false },
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 60, [0]),                   // plafond
    ...groundRow(0, 2, [1, 2, 3, 4]),           // paroi au-dessus de la porte
    ...groundRow(0, 28, [7, 8]),                // sol, jusqu'au puits (gx 28-29)
    ...groundRow(30, 60, [7, 8]),
    ...groundRow(12, 16, [6]),                  // autel
    ...groundRow(20, 23, [1]),                  // concrétions
    ...groundRow(41, 44, [1]),
    ...groundRow(33, 35, [5, 6]),               // marche vers l'estrade (surface 320)
    ...groundRow(36, 39, [4]),                  // estrade du papillon (surface 256)
    ...groundRow(46, 47, [1, 2, 3]),            // haut du mur de l'est (plein)
    ...groundRow(58, 60, [1, 2, 3, 4, 5, 6]),   // fond de la galerie, fermé pour l'instant
  ],
  breakables: [
    { id: 'mur_est', by: 'mur', hint: 'fissure', cells: [[46, 4], [46, 5], [46, 6]] },
  ],
  water: [
    { x: 1792, y: 470, width: 128, height: 106 },
  ],
  pickups: [
    { item: 'talisman_panda', x: 896, y: 340 },
  ],
  butterflies: [
    { id: 'papillon_12', x: 2400, y: 190, prison: 'toile' },
  ],
  v2Portes: [
    { id: 'porte_caves', x: 96, y: 448, w: 32, h: 128, cote: 'dedans', flag: 'v2PorteCavesOuverte' },
  ],
  playerSpawn: { x: 3600, y: 440 },
  triggers: [
    { id: 'pere_plancher', x: 740, w: 60, cutscene: 'v2_caves_pere' },
    { id: 'puits', x: 1856, y: 500, w: 128, h: 120, once: false, cutscene: 'v2_siphon' },
    { id: 'fin_est', x: 3680, w: 40, once: false, cutscene: 'v2_caves_fin_est' },
  ],
  entries: [
    { id: 'from_source', x: 180, y: 440, height: 128, edge: 'left', from: 320, to: 448 },
    { id: 'from_champignonnieres', x: 3600, y: 440, height: 128 },
  ],
  exits: [
    { edge: 'left', from: 320, to: 448, targetScene: 'V2SourceScene', data: { enterId: 'from_caves' } },
  ],
};
