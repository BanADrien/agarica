// Zone « foret_flottante_1 » — le chemin des hauteurs (étape 8 de PLAN_DEV.md).
// Logique (rencontre de Geralt, duel, carte, vue sur le ciel) :
// ZONE_SCRIPTS.acte2_ff1 dans src/story/acte2.js ; mécanique du duel dans
// src/entities/GeraltDuel.js.
//
// VRAIE MONTÉE vers le ciel (2026-10-23, demande utilisateur) : la caméra
// suit la montée (`camera.vertical`, zone morte), le ciel se révèle au-dessus
// des cimes (`skyReveal`, forêt du fond posée en bas du monde), puis les îles
// flottantes (sortie en HAUT à droite).
// Plan (grille 64, surface d'une rangée gy = 64*gy) :
//   x 0-2176     grosse branche d'arrivée depuis le grand arbre + camp de
//                Geralt (feu de camp x 820 ; arène du duel entre les murs
//                x 880 et 1840 = un écran, feu dehors : GERALT_ARENA, acte2.js)
//   P1 x 1920-2112 (gy 4, +3 rangées) : la corniche de Geralt, il faut le
//                bond du singe (2e saut en l'air) — Geralt, lui, n'y arrive pas
//   P2-P9        l'ascension en zigzag au-dessus du vide (chute = 1 cœur et
//                retour au dernier appui), de 256 à -896 (1 150 px) :
//                marches de 2 rangées (saut simple) et 2 marches de 3 rangées
//                (2e saut du singe ou de l'aigle), écarts
//                horizontaux de 128 px ; deux corbeaux qui ne piquent que sur
//                une Agarica posée ; P9 = belvédère au-dessus des cimes, en
//                plein jour (vue, créature), sortie vers les îles à droite.
// Sauts : simple ≈ 172 px (2 rangées) ; singe ≈ 264 px, aigle ≈ 284 px
// (3 rangées). Pas de liane ici : le chemin reste faisable avec n'importe
// quelle forme aérienne (retours depuis les îles avec l'aigle).
const FORET_FLOTTANTE_1_DATA = {
  zoneName: 'Le chemin des hauteurs',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  // Rendu de cohésion (LookKit.js, PLAN_DEV.md « Rendu de cohésion ») : jour
  // sous la canopée puis plein ciel. Profil `jour` allégé comme les îles (cf.
  // foret_flottante_2_data.js) : fond peint, ciel et nuages gardent leurs
  // couleurs (léger flou de profondeur seulement). Écorce du sol entre le
  // réglage du jeu `tuiles_ecorce` (saturation 0,6, trop terne en plein jour)
  // et l'image d'origine. Lumières très douces : la lanterne du point de
  // reprise de la corniche (0,6 par défaut) verdissait Agarica, le feu du camp
  // posait une flaque orange et un halo en étoile.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.1, sat: 0.8, light: 1.0, contrast: 0.92 } } },
    lights: {
      raiAlpha: 1, haloAlpha: 1,
      rules: {
        feu: { radius: 160, intensity: 0.2, glow: 0.07 },
        lanterne: { radius: 130, intensity: 0.18, glow: 0.06 },
        rai: { radius: 180, intensity: 0.12, glow: 0.03 },
      },
    },
  },
  tileset: 'tuiles_ecorce',
  levelWidth: 3584,
  levelHeight: 540,
  // Monde et caméra jusqu'à y -1200 : le belvédère (-896) garde du ciel au-dessus.
  levelTop: -1200,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  // Le ciel se découvre entre 10 % et 85 % de la course verticale de la caméra.
  skyReveal: { start: 0.1, end: 0.85 },
  // Forêt du fond posée sous la grosse branche (bas du monde), voilée de brume
  // au-dessus du vide.
  backgroundBaseline: 540,
  liquidFloor: { y: 500, style: 'brume' },
  // Lointain peint (lot Codex n°8, clé `farLayers`) : l'horizon de la forêt
  // malade, à l'est, que la cinématique `ff1_vue` montre du belvédère (« cette
  // forêt presque noire ») et que le fond peint ne montre pas. Image actuelle
  // ASSOMBRIE par la teinte (pas de version peinte réimportable). Il n'existe
  // que tout en haut : il suit le ciel qui se révèle (withSky) et n'apparaît
  // qu'en arrivant à l'est (fadeInX). Pas d'îles lointaines ici : le fond
  // peint les montre déjà. y 125 (et non 95, valeur du plan) : vue du
  // belvédère (caméra en haut, scrollY -1200), les cimes noires commencent
  // vers y 425 à l'écran, SOUS le pied des îles peintes, qui restent entières.
  farLayers: [
    { id: 'couche_horizon_malade', y: 125, scale: 0.45, tint: 0x3c4e44, scrollX: 0.12, scrollY: 0.25, fill: true, fadeInX: [2300, 2900], withSky: true },
  ],
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 34, [7, 8]),   // branche maîtresse (x 0-2176)
    ...groundRow(30, 33, [4]),     // P1 : la corniche de Geralt (x 1920-2112, surface 256)
    ...groundRow(35, 38, [2]),     // P2 (x 2240-2432, surface 128)
    ...groundRow(40, 43, [-1]),    // P3 (x 2560-2752, surface -64) : 3 rangées
    ...groundRow(45, 48, [-3]),    // P4 (x 2880-3072, surface -192)
    ...groundRow(40, 43, [-5]),    // P5 (x 2560-2752, surface -320) : demi-tour, point de reprise
    ...groundRow(35, 38, [-7]),    // P6 (x 2240-2432, surface -448)
    ...groundRow(40, 43, [-10]),   // P7 (x 2560-2752, surface -640) : 3 rangées
    ...groundRow(45, 48, [-12]),   // P8 (x 2880-3072, surface -768)
    ...groundRow(50, 56, [-14]),   // P9 belvédère au-dessus des cimes (x 3200-3584, surface -896)
  ],
  avoidRanges: [[2176, 3584]],
  playerSpawn: { x: 110, y: 412 },
  fall: { y: 600, mode: 'hurt' },
  campfires: [{ x: 820, y: 448 }],
  // Points de reprise (mort = retour ici, pas au tout début de la zone) :
  // corniche de Geralt, demi-tour P5, belvédère.
  checkpoints: [{ x: 2050, y: 256 }, { x: 2600, y: -320 }, { x: 3260, y: -896 }],
  // Décors de la forêt flottante (`foret_flottante`) : le camp de Geralt (sa
  // tente, son panneau couvert de notes, ses caisses et sa bûche), puis des
  // fleurs en montant vers la lumière.
  props: [
    { type: 'foret_flottante_arbre_jeune', x: 300, y: 448, scale: 0.45 },
    { type: 'foret_flottante_panneau_geralt', x: 600, y: 448, scale: 0.36 },
    // Tirs d'entraînement de Geralt, plantés à gauche de son panneau (objets
    // du lot 8, section `objet`) : `angle` = flèche penchée, pointe enfoncée
    // vers la droite, empennage en l'air ; `y` = milieu du fût (point de
    // rotation), 6 px au-dessus du sol pour que l'empennage dépasse de l'herbe.
    { type: 'objet_fleche', x: 510, y: 442, angle: 65 },
    { type: 'objet_fleche', x: 530, y: 442, angle: 75 },
    { type: 'bosquet_log_pile', x: 700, y: 448, scale: 0.35 },
    { type: 'foret_flottante_tente_geralt', x: 1040, y: 448, scale: 0.42 },
    { type: 'bosquet_crates', x: 1160, y: 448, scale: 0.3 },
    { type: 'bosquet_tree_stump', x: 1500, y: 448, scale: 0.35 },
    { type: 'foret_flottante_fleurs_hautes', x: 1700, y: 448, scale: 0.3 },
    { type: 'foret_flottante_pissenlit_geant', x: 1840, y: 448, scale: 0.32 },
    { type: 'foret_flottante_fleurs_hautes', x: 3010, y: -192, scale: 0.24 },     // P4
    { type: 'foret_flottante_pissenlit_geant', x: 2290, y: -448, scale: 0.26 },   // P6
    { type: 'foret_flottante_fleurs_hautes', x: 3540, y: -896, scale: 0.28 },     // le belvédère
    // Ruines d'anciens totems animaux sur le belvédère.
    { type: 'bosquet_standing_stone', x: 3340, y: -896, scale: 0.34 },
    { type: 'bosquet_standing_stone', x: 3396, y: -896, scale: 0.24 },
  ],
  npcs: [
    // Avant le duel, Geralt n'a rien à dire (le script lance la rencontre).
    { id: 'geralt', x: 1180, facing: 'left', talk: [{ requires: { geraltMet: true }, talk: 'geralt_camp' }] },
    // Clak n'apparaît qu'à l'invocation, au milieu du duel (GeraltDuel.js) :
    // présent dès la donnée seulement une fois Geralt rencontré.
    { id: 'clak', x: 1240, facing: 'left', requires: { geraltMet: true }, talk: [{ requires: { geraltMet: true }, talk: 'clak_camp' }] },
  ],
  triggers: [
    { id: 'intro', x: 330, w: 64, cutscene: 'ff1_intro' },
    // Sur le belvédère, juste après son point de reprise et hors de portée de
    // la créature de mousse : le ciel en plein jour.
    { id: 'vue', x: 3290, y: -940, w: 64, h: 160, cutscene: 'ff1_vue' },
  ],
  enemies: [
    // Corbeaux adoucis : ils ne piquent que sur Agarica posée
    // (diveGroundedOnly, cf. Corbeau.js) -- un coup en plein saut au-dessus
    // du vide coûtait 2 cœurs (coup + chute) ; patrouilles au-dessus du milieu
    // de P4 et de P6, hors de l'arc des sauts qui y arrivent ou en partent
    // (bot : au-dessus de P7, un corbeau heurtait le double saut P6 → P7 ; au-
    // dessus de P8, il frappait au moment du saut vers le belvédère).
    { type: 'corbeau', x: 2980, y: -420, patrolMinX: 2935, patrolMaxX: 3025, diveDepth: 150, diveSpeed: 240, diveCooldown: 3600, diveGroundedOnly: true },
    { type: 'corbeau', x: 2330, y: -650, patrolMinX: 2285, patrolMaxX: 2375, diveDepth: 160, diveSpeed: 240, diveCooldown: 3600, diveGroundedOnly: true },
    // Patrouille écartée du bord droit : on arrive des îles juste après lui (x 3540)
    // et l'élan du sprint porte Agarica jusqu'à x ≈ 3360 (à pied ≈ 3430) ; au-delà de
    // 3280, la créature l'y attendait (3 retours sur 6 touchés, dont une mort). À
    // gauche, 3216 : son corps (30 px) reste sur le belvédère (bord x 3200). Côté
    // montée, inchangé : on se pose à x ≈ 3200-3260, elle se tasse puis bondit.
    { type: 'mousse_creature', x: 3280, y: -940, patrolMinX: 3216, patrolMaxX: 3280 },
  ],
  // Visible mais inutilisable sans l'aigle (il n'agit que sur le plané) : on le
  // remarque ici, on s'en sert dans les îles flottantes (au retour, il remonte
  // l'aigle le long de l'ascension).
  windCurrents: [{ x: 3120, y: -760, w: 60, h: 1240, force: 300 }],
  entries: [
    { id: 'from_arbre', x: 110, y: 400, height: 128, edge: 'left', to: 448 },
    { id: 'from_ff2', x: 3490, y: -950, height: 120, edge: 'right', from: -1200, to: -896 },
  ],
  exits: [
    { edge: 'left', to: 448, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_foret_flottante' } },
    // En haut à droite, au bout du belvédère : les îles flottantes.
    { edge: 'right', from: -1200, to: -896, targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_ff1' } },
  ],
  script: 'acte2_ff1',
};
