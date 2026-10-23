// Zone « trou_sombre » (étape 14 de PLAN_DEV.md) : Agarica tombe sous l'arène
// après l'attaque imparable de Ghil't. Noir presque total, papillons lumineux,
// bocal d'antidote → totem de poche activé → compétence papillon.
// Logique dans ZONE_SCRIPTS.trou_sombre (src/story/boss_ghilt.js), qui ajoute
// aussi les halos de lumière autour d'Agarica et des papillons.
const TROU_SOMBRE_DATA = {
  zoneName: 'Le trou sombre',
  background: 'fond_trou_sombre',
  tileset: 'tuiles_corrompues',
  levelWidth: 1344,
  levelHeight: 540,
  // Très sombre (géré par la Fondation) ; les halos du script percent le noir.
  ambient: { tint: 0x05040c, darkness: 0.85 },
  groundCells: [
    ...groundRow(0, 21, [7, 8]),
    // Remontée vers l'arène : trois corniches que les papillons éclairent
    // une à une (chaque marche = 2 cases, un saut simple suffit).
    ...groundRow(7, 10, [5]),
    ...groundRow(11, 14, [3]),
    ...groundRow(16, 21, [1]),
  ],
  playerSpawn: { x: 200, y: 412 },
  entries: [
    { id: 'from_arene', x: 200, y: 400, height: 128 },
  ],
  // Sortie en haut à droite, retirée par le script tant que le totem de
  // poche n'est pas activé (`trouSombreFait`).
  exits: [
    { x: 1320, y: 0, height: 128, targetScene: 'AreneGhiltScene', data: { enterId: 'from_trou' } },
  ],
  script: 'trou_sombre',
};
