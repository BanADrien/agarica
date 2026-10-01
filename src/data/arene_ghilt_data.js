// Zone « arene_ghilt » (étapes 13 et 15 de PLAN_DEV.md) : arène du boss Ghil't,
// le Fléau de la Forêt. Toute la logique (combat, défaite imposée phase 1,
// soin phase 2, Amanite, Galter) est dans ZONE_SCRIPTS.ghilt_arene
// (src/story/boss_ghilt.js) ; ce fichier ne décrit que le terrain.
// Arène plate et fermée (21 cases) : Ghil't fait ~330 px de large, il lui faut
// de la place pour charger d'un bord à l'autre sans que l'écran défile trop.
const ARENE_GHILT_DATA = {
  zoneName: "Arène de Ghil't",
  // Décor/tuiles de l'acte 2 (repli sur le décor par défaut tant que l'art manque).
  background: 'fond_arene_ghilt',
  tileset: 'tuiles_corrompues',
  levelWidth: 1344,
  levelHeight: 540,
  // Voile verdâtre léger : on est au cœur de la corruption (géré par la Fondation).
  ambient: { tint: 0x1d3a12, darkness: 0.25 },
  groundCells: [...groundRow(0, 21, [7, 8])],
  playerSpawn: { x: 110, y: 412 },
  entries: [
    // Depuis la forêt corrompue (sortie droite de ForetCorrompue1Scene).
    { id: 'from_foret_corrompue', x: 110, y: 400, height: 128 },
    // Retour du trou sombre (phase 2) : les papillons la ramènent sur le bord gauche.
    { id: 'from_trou', x: 180, y: 400, height: 128 },
  ],
  // Le script retire ces sorties tant que Ghil't n'est pas guéri
  // (`ghiltHealed`) : pendant le combat l'arène est fermée par deux murs de mousse.
  exits: [
    { x: 24, y: 400, height: 128, targetScene: 'ForetCorrompue1Scene', data: { enterId: 'from_arene_ghilt' } },
    { x: 1320, y: 400, height: 128, targetScene: 'BosquetRetourScene', data: { enterId: 'from_arene' } },
  ],
  script: 'ghilt_arene',
};
