// Données par défaut de Zone3Scene, migrées vers le format éditeur (voir
// zone1_data.js pour la méthode de conversion). Sol plat continu, toiles
// d'araignée au sol (ralentissent hors forme Loup) + une Araignée fixe
// perchée juste au-dessus de l'une d'elles — inoffensive au contact (seule
// sa toile est un obstacle), cf. le flag `harmless` posé par
// buildLevelFromData pour ce type d'ennemi.
const ZONE3_SURFACE_Y = 448;
const ZONE3_WEB_CENTER_Y = ZONE3_SURFACE_Y - 11; // WEB_HEIGHT/2, cf. Web.js

const ZONE3_DATA = {
  levelWidth: 2200,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 36, [7, 8]),
  ],
  playerSpawn: { x: 80, y: 412 },
  webs: [
    { x: 600, y: ZONE3_WEB_CENTER_Y },
    { x: 1150, y: ZONE3_WEB_CENTER_Y },
    { x: 1700, y: ZONE3_WEB_CENTER_Y },
  ],
  enemies: [
    { type: 'araignee', x: 1150, y: ZONE3_SURFACE_Y - 44 },
  ],
  totems: [
    {
      x: 2050,
      y: ZONE3_SURFACE_Y,
      flag: 'hasEagleForm',
      message: "Tes bras se muent en ailes...\nEspace en l'air : double-saut (Aigle)\nK/clic gauche : tire une plume",
    },
  ],
  exit: { x: 2170, targetScene: 'Zone2Scene', data: {} },
  helpText: 'Toiles au sol : ralentissent sauf en sprint (Loup) — K/clic gauche : attaque',
};
