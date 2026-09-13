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
  exits: [
    { x: 2370, targetScene: 'Zone3Scene', data: {} },
    // Retour utilisateur : "la connexion de zone1 a zonetest ne se fais
    // pas" -- ce portail avait été posé à x=2378.6 dans l'éditeur, à 8.6px
    // seulement de la sortie Zone3 ci-dessus (x=2370). Comme cette dernière
    // n'a pas de `height` (déclencheur pleine hauteur, cf. getExitTriggerRect
    // dans LevelKit.js) et que les deux rectangles de déclenchement
    // (largeur EXIT_TRIGGER_WIDTH=64) se chevauchaient largement, la boucle
    // `for (const exit of scene.__exits)` (LevelKit.js) tombait TOUJOURS sur
    // la sortie Zone3 en premier : ce portail-ci ne pouvait jamais se
    // déclencher, quel que soit son propre paramétrage. Décalé à x=2100
    // (>64px des deux voisins : sortie Zone3 à 2370, totem à 2250) pour ne
    // plus jamais partager son rectangle de déclenchement avec un autre --
    // reste sur le même sol plat (gy=7/8, surface 448) que le reste de la
    // fin de zone, ajustable à la main dans l'éditeur si besoin.
    {
      x: 2100,
      y: 283.302752293578,
      height: 307.08256880733944,
      targetScene: 'ZonetestScene',
      data: { enterId: 'entry_mtzke73s_dgr3' },
      portalId: 'entry_mtynumy9_34s8',
    },
  ],
  entries: [
    {
      id: 'entry_mtynumy9_34s8',
      x: 2100,
      y: 283.302752293578,
      height: 307.08256880733944,
      portalId: 'entry_mtynumy9_34s8',
    },
  ],
  helpText: 'Fleches/QSD : deplacement — Espace : sauter',
};
