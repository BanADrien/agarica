// Zone « foret_flottante_2 » — les îles flottantes (étape 9 de PLAN_DEV.md).
// Logique (totem de poche, Amanite, révélation du plané, grand départ en vol
// plané) : ZONE_SCRIPTS.acte2_ff2 dans src/story/acte2.js.
//
// Plan (surface d'une rangée gy = 64*gy) :
//   I0-I3  x 0-1344     îlots reliés par des sauts simples, corbeau ; ruines
//                       d'un ancien gardien (I3) : totem de poche cassé
//   I4     x 1536-2176  grande île : Amanite (1re rencontre depuis le vol)
//   T1     x 2240-2496  totem de l'aigle, +3 rangées depuis I4 : atteignable
//                       au bond du singe (seule forme aérienne avant l'aigle ;
//                       saut simple 172 px < 192)
//   T1→T2  x 2496-3008  8 cases de vide, T2 une rangée plus haut (surface 128,
//                       x 3008-3200, collée à T3) : impossible sans planer.
//                       Filet de sécurité N (gy 8) dessous + courant d'air qui
//                       remonte l'aigle au-dessus de T2 ; marche S1 pour
//                       remonter à pied
//   T3     x 3200-3456  rampe d'envol ; 8 cases de vide jusqu'à l'île I5
//                       (x 3968), puis la sortie (bord droit, toute hauteur) :
//                       long plané vers la clairière.
// Retour des joueuses (2026-11-09) : les deux grands vides (6 cases) se
// passaient au saut du loup lancé (mesuré : le loup se posait jusqu'à 30 px
// AU-DELÀ du bord d'en face). T2 commence deux cases plus loin et une rangée
// plus haut, I5 deux cases plus loin : le loup retombe court (mesuré au
// pilote, même en sautant au tout dernier moment), l'aigle passe en planant.
const FORET_FLOTTANTE_2_DATA = {
  zoneName: 'Les îles flottantes',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  // Rendu de cohésion (LookKit.js, PLAN_DEV.md « Rendu de cohésion ») : plein
  // jour, à peine retouché (mêmes réglages que la clairière et la hutte, même
  // fond et mêmes tuiles). Profil `jour` allégé : seul, il voilait le fond
  // peint de bleu-gris (saturation 0,75, brume 8 %) ; ici le ciel garde ses
  // couleurs, avec juste un léger flou de profondeur. Terre un peu calmée sans
  // virer au mauve. Lumières très douces : en plein jour, une lanterne de
  // point de reprise à 0,6 verdissait Agarica et le rai de 0,5 brûlait la
  // fleur de la clairière ; halos et rais peints gardés tels quels.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.04, sat: 0.85, light: 1.03, contrast: 0.95 } } },
    lights: {
      raiAlpha: 1, haloAlpha: 1,
      rules: {
        feu: { radius: 160, intensity: 0.2, glow: 0.07 },
        lanterne: { radius: 130, intensity: 0.18, glow: 0.06 },
        rai: { radius: 180, intensity: 0.12, glow: 0.03 },
      },
    },
  },
  tileset: 'tuiles_flottantes',
  levelWidth: 4096,
  levelHeight: 540,
  // Vague 3 : écrit (c'était déjà la valeur par défaut d'une caméra verticale) :
  // le bord haut, celui de la sortie vers l'île des vents, est à -400.
  levelTop: -400,
  // Au-dessus de la canopée, dans la continuité de la montée de la forêt
  // flottante 1 : plein jour (ciel déjà révélé), caméra qui suit l'aigle en
  // hauteur (zone morte), plus de forêt procédurale (on est au-dessus).
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  skyReveal: { start: -1, end: 0, leaves: false },
  largeTrees: false,
  // Brume du vide sous les îles (bande devant le fond, derrière le sol).
  liquidFloor: { y: 520, style: 'brume' },
  // Lointain peint (lot Codex n°8, clé `farLayers`) : l'horizon de la forêt
  // malade, assombri par la teinte, présage de la suite à l'est ; il se lève
  // en avançant vers l'est (fadeInX) et remplace l'horizon sombre dessiné que
  // le script n'affiche plus.
  // Îles lointaines (option H4, revue du lot 8 : image jamais affichée) : les
  // îles des anciens gardiens, en haut du ciel, plus loin que celles du fond
  // peint (parallaxe 0,15 / 0,2). Petites (0,4), translucides (0,5) et
  // bleuies par la teinte (l'image est d'un vert saturé ; une teinte ne peut
  // qu'assombrir, elle tire ici vers le lointain bleuté) : de la profondeur,
  // sans faire concurrence aux îles peintes.
  farLayers: [
    // 2026-11-11 (retour utilisateur) : opaques (alpha 1, teinte de lointain plus
    // légère), et `floating` : chaque île flotte à son rythme, derrière les nuages.
    { id: 'couche_iles_lointaines', y: 0, scale: 0.4, alpha: 1, tint: 0xd2e0f2, scrollX: 0.15, scrollY: 0.2, floating: true,
      // Hauteurs variées, jamais plus bas que la ligne tracée par l'utilisateur (~73 % de l'écran).
      maxBottom: 372 },
    // Quelques îles PROCHES (2026-11-11) : deux fois plus grandes, refaites à cette
    // taille par pixel-fixer (même grain que les lointaines : on ne les étire pas).
    // Plus près = défilement un peu plus rapide, presque pas bleuies, devant les
    // lointaines, toujours derrière les nuages. Deux îles moyennes seulement, une
    // répétition sur deux, cantonnées au haut du ciel : elles ne font pas
    // concurrence aux îles où l'on joue.
    { id: 'iles_proches', set: 'proches', only: [1, 2], every: 2, offsetX: 260, y: -30, scale: 0.7, alpha: 1,
      tint: 0xeef3fb, scrollX: 0.24, scrollY: 0.26, floating: true, maxBottom: 300 },
    { id: 'couche_horizon_malade', y: 400, scale: 0.45, tint: 0x3c4e44, scrollX: 0.3, scrollY: 0.3, fill: true, fadeInX: [1400, 2400] },
  ],
  groundCells: [
    ...groundRow(0, 6, [5, 6]),     // I0 arrivée (surface 320)
    ...groundRow(8, 11, [6]),       // I1 (surface 384)
    ...groundRow(12, 15, [4]),      // I2 (surface 256)
    ...groundRow(17, 22, [5, 6]),   // I3 ruines (surface 320)
    ...groundRow(24, 34, [6, 7]),   // I4 île d'Amanite (surface 384)
    ...groundRow(35, 39, [3]),      // T1 totem de l'aigle (surface 192)
    ...groundRow(39, 41, [5]),      // S1 marche de retour (surface 320)
    ...groundRow(37, 48, [8]),      // N filet de sécurité (surface 512)
    ...groundRow(47, 50, [2]),      // T2 (surface 128), collée à T3 (marche de 64 px)
    ...groundRow(50, 54, [3]),      // T3 rampe d'envol (surface 192)
    // I5 : île du bord droit (surface 192), là où l'on atterrit en revenant de la
    // clairière : le bord droit donnait sinon sur 640 px de vide, et l'arrivée
    // par ce bord aurait été un trou mortel. Deux cases (x 3968-4096) : plus
    // large, le loup lancé depuis T3 l'atteignait.
    ...groundRow(62, 64, [3]),
  ],
  avoidRanges: [[0, 4096]],
  playerSpawn: { x: 120, y: 280 },
  fall: { y: 600, mode: 'hurt' },
  // Points de reprise : ruines (I3), île d'Amanite (I4), rampe d'envol (T3).
  checkpoints: [{ x: 1120, y: 320 }, { x: 1600, y: 384 }, { x: 3240, y: 192 }],
  // Décors des îles (`foret_flottante`) ; les ruines du gardien (I3) gardent
  // leurs pierres du bosquet.
  props: [
    { type: 'foret_flottante_fleurs_hautes', x: 250, y: 320, scale: 0.28 },
    { type: 'foret_flottante_pissenlit_geant', x: 870, y: 256, scale: 0.28 },
    { type: 'bosquet_standing_stone', x: 1120, y: 320, scale: 0.3 },
    { type: 'bosquet_mossy_rock', x: 1310, y: 320, scale: 0.3 },
    { type: 'bosquet_standing_stone', x: 1370, y: 320, scale: 0.22 },   // ruine du gardien
    { type: 'foret_flottante_arbre_jeune', x: 2090, y: 384, scale: 0.42 },
    { type: 'foret_flottante_fleurs_hautes', x: 1700, y: 384, scale: 0.26 },
    { type: 'foret_flottante_arbre_jeune', x: 3100, y: 128, scale: 0.36 },   // sur T2 (surface 128)
    { type: 'bosquet_antler_totem', x: 3390, y: 192, scale: 0.28 },
  ],
  totems: [
    { x: 2400, y: 192, flag: 'hasEagleForm', message: "Forme de l'aigle !" },
  ],
  pickups: [
    { item: 'totem_poche_casse', x: 1216, cutscene: 'ff2_totem_poche' },
  ],
  npcs: [
    { id: 'amanite', x: 1990, facing: 'left', forbids: { amaniteMet: true }, lookAtPlayer: false },
  ],
  triggers: [
    { id: 'intro', x: 260, w: 64, cutscene: 'ff2_intro' },
    { id: 'amanite', x: 1720, w: 64, cutscene: 'amanite_rencontre', forbids: { amaniteMet: true } },
    { id: 'envol', x: 3330, w: 64, cutscene: 'ff2_envol', requires: { hasEagleForm: true } },
    // Vague 3 : le vent du début, revu avec l'aigle (bulle de Xara, sur I1).
    { id: 'v3_vent', x: 610, y: 340, w: 180, h: 140, requires: { hasEagleForm: true }, cutscene: 'v3_ff2_vent' },
    // Retour des joueurs (2026-11-08) : le vide de 512 px entre la rampe T3 et
    // l'île I5 (x 3456-3968) ne se passe qu'en planant. Rappel court de Xara au
    // bord, des deux côtés, à chaque fois qu'on s'en approche.
    { id: 'v3_trou', x: 3420, y: 150, w: 72, h: 100, once: false, cutscene: 'v3_ff2_trou' },
    { id: 'v3_trou_retour', x: 4004, y: 150, w: 72, h: 100, once: false, cutscene: 'v3_ff2_trou' },
  ],
  // Corbeaux adoucis comme ceux de la forêt flottante 1 (revue du 2026-11-05) :
  // piqué sur une Agarica posée seulement, plus lent, plus rare, et patrouille
  // courte au-dessus du milieu d'une île, hors de l'arc des sauts qui y arrivent
  // ou en partent. Au-dessus du saut T2 → T3, le second frappait 16 sauts sur 16
  // en plein vide (coup + chute) ; le premier couvrait le saut I2 → I3.
  // Piqué jusqu'à hauteur de tête d'une Agarica debout, sans toucher le sol ; patrouille
  // assez haute pour qu'il mette ~0,5 s à l'atteindre : qui passe en marchant
  // l'évite, qui s'arrête dessous est touchée (à 40 px au-dessus de T2, il frappait
  // 16 passages sur 16, même en marchant).
  enemies: [
    // Vague 3 : passé d'I1 (x 608, y 90) à I0, même hauteur au-dessus de son île
    // (I0 est 64 px plus haut) : on retombe de l'île des vents au-dessus d'I1, il
    // était dans la colonne de chute.
    { type: 'corbeau', x: 250, y: 26, patrolMinX: 205, patrolMaxX: 295, diveDepth: 220, diveSpeed: 240, diveCooldown: 3600, diveGroundedOnly: true },
    // Crapaud-piège sur l'îlot I2 (x 768-960, y 256), au bord du saut : il faut
    // s'y poser pour aller de I1 à I3. Portée 160 : ni I1 ni le point de reprise
    // de I3 (x 1120) à portée (avec 220, il visait encore Agarica sur I3).
    { type: 'crapaud_piege', x: 915, y: 220, facing: 'left', reach: 160 },
    { type: 'mousse_creature', x: 1290, y: 260, patrolMinX: 1150, patrolMaxX: 1340 },
    // Côté gauche de T2 : un saut vers T3 pris sous son piqué (bord droit de la
    // patrouille à 3053) le prenait encore en plein vide, 1 fois sur 12.
    // 2026-11-09 : suit T2 (deux cases plus à droite, une rangée plus haut),
    // même hauteur au-dessus d'elle (222 px).
    { type: 'corbeau', x: 3100, y: -94, patrolMinX: 3060, patrolMaxX: 3140, diveDepth: 180, diveSpeed: 240, diveCooldown: 3600, diveGroundedOnly: true },
  ],
  windCurrents: [
    // Entre I1 et I2 : on voit le vent monter avant l'aigle. Vague 3 : prolongé
    // au-dessus du bord haut (-400) : l'aigle y monte vers l'île des vents.
    // x 688-792 (et non 712-768, valeur du plan), la largeur de la sortie haute :
    // le courant n'agit que si le CENTRE d'Agarica est dedans ; 56 px entre deux
    // îles, l'aigle le traversait sans monter. Il mord de 16 px sur I1 : on
    // s'envole d'un saut depuis son bord, sans élan.
    { x: 688, y: -560, w: 104, h: 1040, force: 330 },
    // Sur le filet N : ramène l'aigle au-dessus de T2 (surface 128 depuis le
    // 2026-11-09 : colonne plus haute et plus près d'elle).
    { x: 2850, y: 20, w: 120, h: 492, force: 330 },
  ],
  entries: [
    { id: 'from_ff1', x: 110, y: 250, height: 120, edge: 'left', from: -400, to: 320 },
    // Bas de plage (from) : posée sur I5 avant d'avoir plané au-delà de l'île.
    { id: 'from_clairiere', x: 4000, y: 150, height: 80, edge: 'right', from: 130, to: 192 },
    // Vague 3 : chute de l'île des vents (tout son bord bas) -> au-dessus d'I1 ;
    // le crapaud-piège d'I2 reste hors de portée.
    { id: 'from_ile_des_vents', x: 600, y: 330, height: 100, edge: 'top', from: 520, to: 700 },
    // Vague 3 : des racines suspendues, on arrive sur le filet N.
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_racines_suspendues', x: 2420, y: 470, height: 80 },
  ],
  exits: [
    // Sous l'île d'arrivée, le bord gauche reste un mur au-dessus du vide.
    { edge: 'left', from: -400, to: 320, targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_ff2' } },
    // Bord droit, toute la hauteur : on l'atteint en planant depuis T3.
    { edge: 'right', targetScene: 'ClairierePlanteScene', data: { enterId: 'from_ff2' } },
    // Vague 3 : en haut du vent d'I1-I2 -> l'île des vents (aigle).
    { edge: 'top', from: 690, to: 790, targetScene: 'IleDesVentsScene', data: { enterId: 'from_ff2' } },
  ],
  script: 'acte2_ff2',
};
