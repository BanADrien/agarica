// Labo d'éclairage (`index.html?zone=labo_lumiere&lumiere`) : zone fermée pour régler LightKit en
// conditions réelles, en trois parties de 1920 px (nuit, soleil, banc d'essai). Rien ici n'est du
// contenu du jeu : aucune sortie, aucun ennemi, aucun lien depuis les autres zones. Mannequins, lampes
// et panneau : src/scenes/LaboLumiereScene.js. Sol à y 448 (gy 7), murs aux deux bouts (gx 0-1 et
// 88-89). (groundRow : fin EXCLUE.)
const LABO_LUMIERE_DATA = {
  "levelWidth": 5760,
  "levelHeight": 540,
  "decor": false,
  "xara": false,
  "groundCells": [
    ...groundRow(0, 90, [7, 8]),
    ...groundRow(0, 2, [0, 1, 2, 3, 4, 5, 6]),
    ...groundRow(88, 90, [0, 1, 2, 3, 4, 5, 6]),
  ],
  "groundBackCells": [],
  "water": [],
  "webs": [],
  "totems": [],
  "enemies": [],
  // Champignons lumineux de la forêt sombre, sous leurs lampes (partie nuit)
  "props": [170, 590, 850, 1380, 1760].map((x) => ({ type: 'foret_sombre_champignons_lumineux', x, y: 448 })),
  "campfires": [],
  "playerSpawn": { "x": 240, "y": 380 },
  "exits": [],
  "entries": [],
};
