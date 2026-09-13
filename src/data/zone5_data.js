// Données par défaut de Zone5Scene (arène du boss), migrées vers le format
// éditeur (voir zone1_data.js pour la méthode de conversion). Salle plate,
// sans fosse, avec le même volet "Araignée" (toiles + Araignée fixe) que
// Zone3. Pas de sortie x classique : la fin de zone dépend de la défaite du
// Loup Alpha (LoupAlpha.js), câblée à part dans Zone5Scene.js (scene.enemies
// est un groupe générique, cf. buildLevelFromData — le boss y est retrouvé
// par `instanceof LoupAlpha`).
const ZONE5_SURFACE_Y = 448;
const ZONE5_WEB_CENTER_Y = ZONE5_SURFACE_Y - 11;

const ZONE5_DATA = {
  levelWidth: 1400,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 23, [7, 8]),
  ],
  playerSpawn: { x: 80, y: 412 },
  webs: [
    { x: 420, y: ZONE5_WEB_CENTER_Y },
    { x: 980, y: ZONE5_WEB_CENTER_Y },
  ],
  enemies: [
    { type: 'araignee', x: 700, y: ZONE5_SURFACE_Y - 44 },
    { type: 'loupAlpha', x: 700, y: ZONE5_SURFACE_Y - 100, patrolMinX: 250, patrolMaxX: 1150 },
  ],
  helpText: 'Le Loup Alpha veille... K/clic gauche : attaque',
};
