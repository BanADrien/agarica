// Zone « foret_sombre_1 » : la lisière, juste après le bannissement (acte 1,
// zone 2 de PLAN_DEV.md). Logique (désespoir, rencontre de Xara, feu de camp,
// créature de mousse, réveil du talisman, amas) : ZONE_SCRIPTS.foret_sombre_1
// + CUTSCENES/DIALOGUES `fs1_*` dans src/story/acte1.js.
//
// Plan (grille 64, surface du sol y=448) — de gauche à droite :
//   x 0-900      sentier inconnu : arrivée depuis le bosquet, désespoir
//   x 900-1800   clairière de Xara (souche gx 20-21), feu de camp (x 1640)
//   x 1800-2600  sous-bois : branches basses, créature de mousse
//   x 2688-2816  mur de racines du plafond (gy 0-3) + amas de mousse coincé
//                dessous (y 256-448) : seul passage, fracas de l'ours
//   x 2816-3840  la forêt s'ouvre : la mousse est partout ; sortie → FS2
const FORET_SOMBRE_1_SURFACE_Y = 448;

const FORET_SOMBRE_1_DATA = {
  levelWidth: 3840,
  levelHeight: 540,
  zoneName: 'La forêt sombre',
  background: 'fond_foret_sombre',
  zoneSub: 'Au-delà de la lisière',
  // Pas encore de fond dédié au manifest : le ciel nocturne par défaut
  // (plan4) + un voile bleu nuit suffisent à l'ambiance.
  ambient: { tint: 0x070b22, darkness: 0.3 },
  script: 'foret_sombre_1',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 60, [7, 8]),     // sol continu
    ...groundRow(8, 10, [6]),        // tronc couché (petit saut)
    ...groundRow(20, 22, [6]),       // la souche de Xara (x 1280-1408)
    // Rocher du sous-bois en escalier : jamais de face de 2 cases qui part
    // du sol (le joueur pouvait rester coincé contre, cf. hitbox 3/4 des
    // tuiles d'herbe) ; idem dans foret_sombre_2.
    ...groundRow(30, 31, [6]),
    ...groundRow(31, 32, [5, 6]),
    ...groundRow(32, 33, [6]),
    ...groundRow(36, 38, [4]),       // branche haute (vue sur l'amas)
    ...groundRow(42, 44, [0, 1, 2, 3]), // mur de racines : du haut de l'écran jusqu'à l'amas
    ...groundRow(41, 42, [0, 1]),    // départ des racines (silhouette moins carrée)
    ...groundRow(44, 45, [0, 1]),
    ...groundRow(50, 52, [6]),       // rocher de l'autre côté
  ],
  playerSpawn: { x: 140, y: 412 },
  props: [
    { type: 'bosquet_fence', x: 60, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.5 },     // palissade du bosquet, derrière elle
    { type: 'bosquet_mossy_rock', x: 420, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.45 },
    { type: 'bosquet_tree_stump', x: 1344, y: 384, scale: 0.45 },
    { type: 'bosquet_bush_round', x: 1820, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.45 },
    { type: 'bosquet_mossy_rock', x: 2480, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.5 },
    { type: 'bosquet_mossy_rock', x: 3300, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.55 },
    { type: 'bosquet_log_pile', x: 3560, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.4 },
  ],
  campfires: [{ x: 1640, y: FORET_SOMBRE_1_SURFACE_Y }],
  npcs: [
    // Xara attend sur sa souche ; remplacée par le vrai compagnon ({xaraJoin}).
    { id: 'xara', sprite: 'xara_extra', x: 1344, anim: 'mysterious', facing: 'left', talk: 'fs1_rencontre', forbids: { xaraMet: true } },
  ],
  enemies: [
    // Première créature corrompue (2 PV) : elle rampe vers Agarica.
    { type: 'mousse_creature', x: 2250, y: 400, patrolMinX: 1980, patrolMaxX: 2560, hp: 2 },
  ],
  // L'amas, pile sous le mur de racines (aucun moyen de passer par-dessus).
  mossBlocks: [{ id: 'amas_racines', x: 2752, y: 352, w: 128, h: 192 }],
  triggers: [
    { id: 'desespoir', x: 160, w: 200, cutscene: 'fs1_desespoir' },
    { id: 'rencontre', x: 1130, w: 40, forbids: { xaraMet: true }, cutscene: 'fs1_rencontre' },
    { id: 'feu', x: 1580, w: 40, requires: { xaraMet: true }, cutscene: 'fs1_feu' },
    { id: 'creature', x: 1940, w: 40, cutscene: 'fs1_creature' },
    { id: 'talisman', x: 2540, w: 40, requires: { talismanOurs: true }, cutscene: 'fs1_talisman' },
    { id: 'mousse_partout', x: 3240, w: 40, cutscene: 'fs1_mousse_partout' },
  ],
  entries: [
    { id: 'from_bosquet', x: 140, y: 400, height: 128 },
    { id: 'from_foret_sombre_2', x: 3700, y: 400, height: 128 },
  ],
  exits: [
    { x: 3824, targetScene: 'ForetSombre2Scene', data: { enterId: 'from_foret_sombre_1' } },
  ],
};
