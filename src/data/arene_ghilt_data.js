// Zone « arene_ghilt » (étapes 13 et 15 de PLAN_DEV.md) : arène du boss Ghil't,
// le Fléau de la Forêt. Toute la logique (combat, défaite imposée phase 1,
// soin phase 2, Amanite, Geralt) est dans ZONE_SCRIPTS.ghilt_arene
// (src/story/boss_ghilt.js) ; ce fichier ne décrit que le terrain.
// Arène plate et fermée (21 cases) : Ghil't fait ~330 px de large, il lui faut
// de la place pour charger d'un bord à l'autre sans que l'écran défile trop.
const ARENE_GHILT_DATA = {
  zoneName: "Arène de Ghil't",
  // Décor/tuiles de l'acte 2 (repli sur le décor par défaut tant que l'art manque).
  background: 'fond_arene_ghilt',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_corrompues',
  levelWidth: 1344,
  levelHeight: 540,
  // Voile verdâtre léger : on est au cœur de la corruption (géré par la Fondation).
  ambient: { tint: 0x1d3a12, darkness: 0.25 },
  // Rendu de cohésion (LookKit) : le réglage de la forêt corrompue (cf.
  // foret_corrompue_1_data.js : vert toxique gardé, fonds en brume vert sombre).
  // En plus : halos des papillons du soin à pleine force (`haloAlpha` 1 : pas de
  // feu de camp ici, c'est leur lumière qui raconte la guérison) et lumière du
  // rai de l'arène calme (teinté blanc chaud 0xfff6e0 par le script) à sa
  // couleur, au lieu du bleu lunaire par défaut.
  look: {
    profile: 'nuit',
    grade: { sat: 1.02, map: [0x141026, 0x4a526a, 0xd9ffc8], mapAmt: 0.12 },
    back: { sat: 0.85, bright: 0.8, fog: 0x16221a, fogAmt: 0.1, mist: 0.16 },
    lights: { haloAlpha: 1, rules: { rai: { color: 0xfff0d8, intensity: 0.25 } } },
  },
  groundCells: [...groundRow(0, 21, [7, 8])],
  // Ruines de l'arène (`foret_corrompue`), en fond : piliers sur les côtés,
  // arche au centre (Ghil't et Agarica passent devant). Pas devant les sorties.
  props: [
    { type: 'foret_corrompue_arche_arene', x: 672, y: 448, scale: 0.45 },
    { type: 'foret_corrompue_pilier_arene', x: 190, y: 448, scale: 0.38 },
    { type: 'foret_corrompue_pilier_arene', x: 1150, y: 448, scale: 0.38 },
  ],
  playerSpawn: { x: 110, y: 412 },
  entries: [
    // Depuis la forêt corrompue (sortie droite de ForetCorrompue1Scene).
    // `inset` : le mur de mousse du combat est posé juste après le bord (x 10-50).
    { id: 'from_foret_corrompue', x: 110, y: 400, height: 128, edge: 'left', to: 448, inset: 110 },
    // Retour du trou sombre (phase 2) : les papillons la ramènent sur le bord gauche.
    { id: 'from_trou', x: 180, y: 400, height: 128, edge: 'left', to: 448, inset: 180 },
  ],
  // Le script retire ces sorties tant que Ghil't n'est pas guéri
  // (`ghiltHealed`) : pendant le combat l'arène est fermée par deux murs de mousse.
  exits: [
    { edge: 'left', to: 448, targetScene: 'ForetCorrompue1Scene', data: { enterId: 'from_arene_ghilt' } },
    { edge: 'right', to: 448, targetScene: 'BosquetRetourScene', data: { enterId: 'from_arene' } },
  ],
  script: 'ghilt_arene',
};
