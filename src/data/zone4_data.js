// Données par défaut de Zone4Scene, migrées vers le format éditeur (voir
// zone1_data.js pour la méthode de conversion). Vide plus large que celui de
// Zone2 (6 cases, ~384px), traversé en plané Aigle, en pleine zone de
// patrouille de deux Corbeaux (diveDepth calculé pour ne jamais plonger
// en dessous du sol local, cf. Corbeau.js). Contrairement à Zone2, tomber
// dans le vide ne change pas de scène ici : ça blesse juste le joueur — câblé
// à part dans Zone4Scene.js, comme le spawn variable (entrée normale ou par
// la boucle de la SousGrotte), tous deux hors du schéma générique.
const ZONE4_SURFACE_Y = 448;

const ZONE4_DATA = {
  levelWidth: 2200,
  levelHeight: 840,
  groundCells: [
    ...groundRow(0, 8, [7, 8]),
    ...groundRow(14, 37, [7, 8]),
  ],
  avoidRanges: [[512, 896]],
  playerSpawn: { x: 80, y: 412 },
  enemies: [
    { type: 'corbeau', x: 500, y: ZONE4_SURFACE_Y - 158, patrolMinX: 350, patrolMaxX: 950, diveDepth: 150 },
    { type: 'corbeau', x: 1300, y: ZONE4_SURFACE_Y - 138, patrolMinX: 1100, patrolMaxX: 1750, diveDepth: 130 },
  ],
  totems: [
    {
      x: 2050,
      y: ZONE4_SURFACE_Y,
      flag: 'hasOctopusForm',
      message: "Une fraîcheur nouvelle parcourt tes veines...\nDans l'eau : forme Pieuvre automatique",
    },
  ],
  exit: { x: 2170, targetScene: 'ZoneAquatiqueScene', data: {} },
  helpText: 'Vide large : plané Aigle — corbeaux : plongent si tu passes dessous — K/clic gauche : attaque',
};
