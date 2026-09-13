// Données par défaut de Zone1Scene, migrées vers le format éditeur (voir
// EditorScene.js pour le schéma, buildLevelFromData dans LevelKit.js pour la
// construction). Reproduit la même silhouette que l'ancienne version codée
// à la main (fillGroundTiles/addPlatformTiles) : ligne de sol avec 2 vides,
// une plateforme flottante et une marche surélevée, migrée sur la grille
// 9-slice de l'éditeur (GROUND_TILE_SIZE=64).
//
// Décalage vertical : l'ancien sol (fillGroundTiles) plaçait le centre de
// tuile à `height - 32 = 508` (pas aligné sur la grille éditeur, dont les
// centres tombent sur 32/96/160/...) — la rangée de grille la plus proche
// est gy=7 (centre 480, surface 448), soit un décalage de -28px repris
// uniformément pour tout ce qui était positionné relativement au sol
// (spawn, totem) : ZONE1_SURFACE_Y = 448.
const ZONE1_SURFACE_Y = 448;

const ZONE1_DATA = {
  levelWidth: 2400,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 11, [7, 8]),
    ...groundRow(12, 17, [7, 8]),
    ...groundRow(13, 17, [5]), // plateforme flottante (4 cases, au-dessus du tronçon 12-17)
    ...groundRow(19, 27, [7, 8]),
    ...groundRow(27, 29, [6, 7, 8]), // petite marche surélevée, bloc plein
    ...groundRow(29, 38, [7, 8]),
  ],
  avoidRanges: [[704, 768], [1088, 1216]],
  playerSpawn: { x: 80, y: 412 },
  // Anciennement planté à la main dans Zone1Scene.js (addCampfire) --
  // migré ici pour être une vraie donnée de niveau, éditable/déplaçable
  // depuis l'éditeur comme n'importe quel autre feu de camp (cf. outil
  // "Feu de camp"). Même x/y qu'avant (280, sol réel sous ce x).
  campfires: [{ x: 280, y: ZONE1_SURFACE_Y }],
  totems: [
    {
      x: 2250,
      y: ZONE1_SURFACE_Y,
      flag: 'hasWolfForm',
      message: "Tu sens la force du Loup s'éveiller en toi.\nShift ou double-tap : sprint",
    },
  ],
  exit: { x: 2370, targetScene: 'Zone3Scene', data: {} },
  helpText: 'Fleches/QSD : deplacement — Espace : sauter',
};
