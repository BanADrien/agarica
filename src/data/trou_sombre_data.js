// Zone « trou_sombre » (étape 14 de PLAN_DEV.md) : Agarica tombe sous l'arène
// après l'attaque imparable de Ghil't. Noir presque total, papillons lumineux,
// bocal d'antidote → totem de poche activé → compétence papillon.
// Logique dans ZONE_SCRIPTS.trou_sombre (src/story/boss_ghilt.js), qui ajoute
// aussi les halos de lumière autour d'Agarica et des papillons.
const TROU_SOMBRE_DATA = {
  zoneName: 'Le trou sombre',
  background: 'fond_trou_sombre',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_corrompues',
  levelWidth: 1344,
  levelHeight: 540,
  // Très sombre (géré par la Fondation) ; les halos du script percent le noir.
  ambient: { tint: 0x05040c, darkness: 0.85 },
  // Rendu de cohésion (LookKit) : le noir reste (médiane de l'image 10 -> 12 sur
  // 255), seul le plan de jeu y gagne un peu. Voile gardé à 90 % (la nuit le
  // réduit à 70 % : le trou devenait gris) ; les fonds compensent (`bright`
  // 0,66 ≈ 0,15 / 0,235 : aussi sombres qu'avant), le sol et les corniches
  // ressortent d'un cran. Contraste léger autour d'un pivot bas (0,1) : celui de
  // la nuit (0,3) écrasait le sol dans le noir. Aucun refroidissement (`highAmt`
  // 0, `ambient` neutre) : le halo chaud d'Agarica (script, ADD) garde sa
  // couleur, à pleine force comme ceux des papillons (`haloAlpha` 1) ; la
  // lumière d'Agarica prend la teinte de son halo et éclaire un peu le sol sous
  // elle. Rai de la chute : à peine retouché (alpha × 0,9, lumière faible).
  look: {
    profile: 'nuit',
    overlay: 0.9,
    grade: { exposure: 1, contrast: 1.08, pivot: 0.1, sat: 1, mapAmt: 0.08, highAmt: 0, ambient: [1, 1, 1] },
    back: { bright: 0.66, sat: 0.7, fogAmt: 0.06, mist: 0.1 },
    lights: {
      haloAlpha: 1, raiAlpha: 0.9,
      rules: { rai: { intensity: 0.15, glow: 0.04 } },
      self: { intensity: 0.2, radius: 180, color: 0xffe2b4 },
    },
  },
  // Filet de lumière qui tombe du sol effondré de l'arène, là où Agarica a
  // chuté (lot Codex n°8, clé `lights`, H15). `aboveAmbient` : au-dessus du
  // voile (0,85), sinon il serait éteint ; alpha bas pour ne pas lever le
  // noir, que les halos du script doivent percer.
  lights: [
    { id: 'fx_rai_lumiere', x: 200, y: 448, w: 150, h: 470, tint: 0xcfd8ff, alpha: 0.16, layer: 'aboveAmbient' },
  ],
  groundCells: [
    ...groundRow(0, 21, [7, 8]),
    // Remontée vers l'arène : trois corniches que les papillons éclairent
    // une à une (chaque marche = 2 cases, un saut simple suffit).
    ...groundRow(7, 10, [5]),
    ...groundRow(11, 14, [3]),
    ...groundRow(16, 21, [1]),
  ],
  playerSpawn: { x: 200, y: 412 },
  // Décors (`foret_corrompue`), à peine visibles dans le noir : ossements au
  // fond du trou, champignons toxiques sous les corniches.
  props: [
    { type: 'foret_corrompue_os_creature', x: 330, y: 448, scale: 0.3 },
    { type: 'foret_corrompue_champignon_toxique', x: 1130, y: 448, scale: 0.3 },
    { type: 'foret_corrompue_souche_corrompue', x: 1190, y: 64, scale: 0.24 },
  ],
  entries: [
    { id: 'from_arene', x: 200, y: 400, height: 128 },
  ],
  // Sortie en haut à droite, retirée par le script tant que le totem de
  // poche n'est pas activé (`trouSombreFait`).
  exits: [
    // `hint: false` : les papillons du script montrent déjà le chemin.
    { edge: 'right', to: 64, hint: false, targetScene: 'AreneGhiltScene', data: { enterId: 'from_trou' } },
  ],
  script: 'trou_sombre',
};
