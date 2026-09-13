// Données par défaut de ZoneAquatiqueScene, migrées vers le format éditeur
// (voir zone1_data.js pour la méthode de conversion). Même moule que les
// zones à fosse (Zone2/Zone4), mais la coupure centrale est un lac
// (addWaterZone, cf. buildLevelFromData) plutôt qu'un vide : sans la forme
// Pieuvre (sanctuaire de Zone4), l'eau profonde est un piège (cf. Player.js).
const ZONE_AQUATIQUE_DATA = {
  levelWidth: 2000,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 11, [7, 8]),
    ...groundRow(20, 33, [7, 8]),
  ],
  avoidRanges: [[704, 1280]],
  // Bords du lac calés exactement sur les limites de sol ci-dessus (gx11/gx20)
  // pour éviter tout interstice visible entre la terre et l'eau.
  water: [{ x: 704, y: 100, width: 576, height: 440 }],
  playerSpawn: { x: 80, y: 412 },
  exit: { x: 1970, targetScene: 'Zone5Scene', data: {} },
  helpText: 'Eau profonde : forme Pieuvre automatique pour nager — K/clic gauche : attaque',
};
