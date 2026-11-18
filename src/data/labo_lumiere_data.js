// Labo d'éclairage (`index.html?zone=labo_lumiere&lumiere`) : salle fermée pour régler LightKit en
// conditions réelles. Rien ici n'est du contenu du jeu : aucune sortie, aucun ennemi, aucun lien
// depuis les autres zones. Mannequins, lampes et panneau : src/scenes/LaboLumiereScene.js.
// Sol à y 448 (gy 7), murs aux deux bouts (gx 0-1 et 34-35). (groundRow : fin EXCLUE.)
const LABO_LUMIERE_DATA = {
  "levelWidth": 2304,
  "levelHeight": 540,
  "decor": false,
  "xara": false,
  "groundCells": [
    ...groundRow(0, 36, [7, 8]),
    ...groundRow(0, 2, [0, 1, 2, 3, 4, 5, 6]),
    ...groundRow(34, 36, [0, 1, 2, 3, 4, 5, 6]),
  ],
  "groundBackCells": [],
  "water": [],
  "webs": [],
  "totems": [],
  "enemies": [],
  "props": [],
  "campfires": [],
  "playerSpawn": { "x": 240, "y": 380 },
  "exits": [],
  "entries": [],
};
