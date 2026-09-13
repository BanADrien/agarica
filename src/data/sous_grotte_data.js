// Données par défaut de SousGrotteScene, migrées vers le format éditeur (voir
// zone1_data.js pour la méthode générale). Petite salle de passage : sol bas
// (gy=6) + un "plafond" troué (gy=4, cf. le docstring de buildLevelFromData —
// les plafonds sont juste des cellules de la même grille, pas un système à
// part) qui ne laisse passer qu'un plané Aigle par l'ouverture centrale.
// `decor:false` : cette salle a son propre fond (dégradé sombre + silhouette
// d'arbre unique, cf. SousGrotteScene.js) plutôt que la forêt/lune générique.
// Pas de sortie x classique : on ressort par le plafond (condition sur
// player.y), câblée à part dans SousGrotteScene.js.
const SOUS_GROTTE_CEILING_CENTER_Y = 288; // cf. SousGrotteScene.js pour le seuil de sortie
const SOUS_GROTTE_GROUND_BOTTOM_Y = 448; // bord bas de la rangée de sol (gy=6), pour le décor de fond

const SOUS_GROTTE_DATA = {
  levelWidth: 900,
  levelHeight: 540,
  decor: false,
  groundCells: [
    ...groundRow(0, 15, [6]),
    ...groundRow(0, 6, [4]),
    ...groundRow(9, 15, [4]),
  ],
  // Arrivée en chute libre depuis la fosse de Zone2, juste sous l'ouverture
  // du plafond (gx6-9, centre x=480).
  playerSpawn: { x: 480, y: SOUS_GROTTE_CEILING_CENTER_Y + 40 },
  helpText: 'Une ouverture dans le plafond... x2 Espace (Aigle) pour remonter',
};
