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
//   x 2816-3200  la forêt s'ouvre : la mousse est partout ; rocher en escalier
//   x 3200-4032  LE GOUFFRE AUX LIANES (vague 3, 2026-11-08) : un tronc
//                couché (x 3328-4032, surface 256) relié au rocher par un
//                bouchon de bois pourri (x 3200-3328) : la route est un
//                escalier continu, sans trou ni saut risqué. Dessous, 2 lianes ;
//                au fond, x 3200-3712 mortel (1 cœur), x 3712-4032 = sortie
//                basse vers la grotte de la lisière. On n'y descend qu'exprès :
//                avec le singe, le bouchon se casse à l'ours.
//   x 4032-4352  roche, marches, sol ; sortie → FS2
const FORET_SOMBRE_1_SURFACE_Y = 448;

const FORET_SOMBRE_1_DATA = {
  // Vague 3 : 512 px de plus pour le gouffre aux lianes ; le monde descend à
  // 720 sous l'écran pour que la chute dans le gouffre se déclenche (comme FS2).
  levelWidth: 4352,
  levelHeight: 720,
  fall: { y: 620, mode: 'hurt' },
  // Pas de touffes de premier plan (bas de l'écran) devant le gouffre : elles
  // faisaient croire à un sol et cachaient la lueur de la sortie basse.
  // Coordonnées de la couche des touffes (parallaxe 1,08) : x ≈ 1,08 x monde - 40
  // pour le gouffre x 3200-4032. Les arbres du fond (parallaxe 0,35) de cette
  // plage ne sont jamais à l'écran : rien d'autre ne change.
  avoidRanges: [[3430, 4300]],
  zoneName: 'La forêt sombre',
  background: 'fond_foret_sombre',
  zoneSub: 'Au-delà de la lisière',
  // Pas encore de fond dédié au manifest : le ciel nocturne par défaut
  // (plan4) + un voile bleu nuit suffisent à l'ambiance.
  ambient: { tint: 0x070b22, darkness: 0.3 },
  // Rendu de cohésion (LookKit.js, PLAN_DEV.md « Rendu de cohésion ») :
  // profil de référence, réglé sur cette zone (prototype, variante C).
  look: 'foret_sombre',
  // Un rai de lune sur la souche de la rencontre avec Xara (lot Codex n°8,
  // clé `lights`, H15) : bas posé sur le haut du bloc de la souche (y 384) ;
  // 420 px de haut pour que le haut net du rai sorte de l'écran.
  lights: [
    { id: 'fx_rai_lumiere', x: 1344, y: 384, w: 110, h: 420, tint: 0xbfe8ff, alpha: 0.3 },
  ],
  script: 'foret_sombre_1',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 50, [7, 8]),     // sol continu jusqu'au gouffre (x 3200)
    ...groundRow(8, 10, [6]),        // tronc couché (petit saut)
    ...groundRow(20, 22, [6]),       // la souche de Xara (x 1280-1408)
    // Rocher du sous-bois en escalier : jamais de face de 2 cases qui part
    // du sol (le joueur pouvait rester coincé contre, cf. hitbox 3/4 des
    // tuiles d'herbe) ; idem dans foret_sombre_2.
    ...groundRow(30, 31, [6]),
    ...groundRow(31, 32, [5, 6]),
    ...groundRow(32, 33, [6]),
    // Branche haute (vue sur l'amas), x 2176-2368 : à 2 cases du rocher
    // (+128 px), atteignable au saut simple (en gx 36-37, à 4 cases, il
    // fallait l'ancien double saut de base).
    ...groundRow(34, 37, [4]),
    ...groundRow(42, 44, [0, 1, 2, 3]), // mur de racines : du haut de l'écran jusqu'à l'amas
    ...groundRow(41, 42, [0, 1]),    // départ des racines (silhouette moins carrée)
    ...groundRow(44, 45, [0, 1]),
    // Rocher en escalier au bord du gouffre (marches d'une case : 384, 320),
    // puis le bouchon de bois pourri (gx 50-51, surface 256, une marche de
    // plus) qui relie le rocher au tronc : de 448 à 256, rien que des marches.
    ...groundRow(48, 49, [6]),
    ...groundRow(49, 50, [5, 6]),
    ...groundRow(50, 52, [4]),
    // Après le tronc : roche pleine (gx 63, du tronc au fond du monde : le
    // gouffre est fermé à droite), marches d'une case, puis le sol jusqu'au bord.
    ...groundRow(63, 64, [4, 5, 6, 7, 8]),
    ...groundRow(64, 65, [5, 6, 7, 8]),
    ...groundRow(65, 66, [6, 7, 8]),
    ...groundRow(66, 68, [7, 8]),
  ],
  // Le tronc couché (BrancheKit, cf. PLAN_DEV « Branches et troncs ») : une
  // seule rangée de collision (gx 52-62, gy 4). Son dessous (256 + 56 - 2) porte
  // les deux lianes ; pointe côté bouchon, bout pris dans la roche à droite.
  branches: [
    { from: [3328, 256], to: [4032, 256], attach: 'none', tip: 'left', thickness: 56 },
  ],
  // L'entrée du gouffre : le bouchon (peint aussi en sol ci-dessus), cassable à
  // l'ours (fracas sous les pieds), seulement une fois la forme singe obtenue
  // (`requires`, cf. src/story/vague3_commun.js) : avant, c'est un sol comme
  // un autre, impossible d'y tomber par erreur. Cassé, il ouvre x 3200-3328.
  breakables: [
    { id: 'bois_pourri', by: 'bear', hint: 'fissure', cells: [[50, 4], [51, 4]], requires: { hasMonkeyForm: true } },
  ],
  // Fond du gouffre, partie mortelle seulement (sol de second plan, sans
  // collision, assombri) : la brume noire des trous mortels passe devant. La
  // partie x 3712-4032 reste ouverte : c'est la sortie basse, sa lueur doit se lire.
  groundBackCells: [
    ...groundRow(50, 58, [7, 8]),
  ],
  // Lianes sous le tronc (attache = dessous du tronc, x dans le gouffre) :
  // chute par le bouchon cassé, saut humain, 2e saut (singe), liane 1,
  // liane 2, lâcher vers le trou de la grotte (x 3712-4032).
  // 160 px de long, 288 d'écart (et non 120 et 384, valeurs du plan) : sous le
  // tronc, le lâcher ne peut presque pas monter ; avec 120 px, le balancier
  // était trop court pour porter à 384 px avant de passer sous la liane suivante
  // (prise impossible au bot comme à la main). Bas des lianes à 470 ; de la 2e,
  // même le lâcher le plus mou (300 px/s) tombe dans le trou, la roche (x 4032)
  // arrête le plus fort.
  vines: [
    { x: 3392, y: 310, length: 160 },
    { x: 3680, y: 310, length: 160 },
  ],
  playerSpawn: { x: 140, y: 412 },
  // Décors de la forêt sombre (section `foret_sombre`), posés sur la surface de
  // marche ; jamais sur une marche/plateforme voisine, ni devant une sortie.
  props: [
    // (Pas de `foret_sombre_arbre_moussu` : retiré à la demande de l'utilisateur,
    // hors de la DA. Des éléments bas et discrets à la place.)
    { type: 'foret_sombre_fougere_sombre', x: 290, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.28 },
    { type: 'foret_sombre_souche_champignons', x: 3040, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.32 },
    { type: 'bosquet_fence', x: 60, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.5 },     // palissade du bosquet, derrière elle
    { type: 'foret_sombre_rocher_mousse', x: 450, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_fougere_sombre', x: 780, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_champignons_lumineux', x: 1060, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.28 },
    { type: 'bosquet_tree_stump', x: 1344, y: 384, scale: 0.45 },   // la souche de Xara (onProp)
    { type: 'foret_sombre_pierre_runique', x: 1500, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_buisson_epineux', x: 1810, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_souche_champignons', x: 2272, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 }, // sous la branche haute
    { type: 'foret_sombre_tronc_couche', x: 2470, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.35 },
    // (Vague 3 : les trois décors d'après le rocher, x 3264-3690, sont passés
    // de l'autre côté du gouffre : l'ancien sol est devenu le vide.)
    { type: 'foret_sombre_rocher_mousse', x: 4064, y: 256, scale: 0.26 },        // sur la roche, au bout du tronc
    { type: 'foret_sombre_toile_araignee', x: 4270, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_champignons_lumineux', x: 4330, y: FORET_SOMBRE_1_SURFACE_Y, scale: 0.24 },
  ],
  campfires: [{ x: 1640, y: FORET_SOMBRE_1_SURFACE_Y }],
  npcs: [
    // Xara attend sur sa souche ; remplacée par le vrai compagnon ({xaraJoin}).
    // `onProp` : pieds sur le haut VISIBLE de l'image de la souche (cf.
    // propTopYAt), recalculé à chaque visite -- un y écrit à la main ne suivait
    // pas quand les décors ont été redescendus sur la surface de marche.
    { id: 'xara', sprite: 'xara_extra', x: 1344, onProp: 'bosquet_tree_stump', anim: 'mysterious', facing: 'left', talk: 'fs1_rencontre', forbids: { xaraMet: true } },
  ],
  enemies: [
    // Première créature corrompue (2 PV) : elle rampe vers Agarica.
    { type: 'mousse_creature', x: 2250, y: 400, patrolMinX: 1980, patrolMaxX: 2560, hp: 2 },
    // Premier crapaud-piège du jeu (optionnel, à juger en jouant) : sur du plat
    // sans danger, juste après la cinématique « la mousse est partout » (x 2950) ;
    // il apprend qu'une bosse moussue peut mordre. Vague 3 : l'ancien sol de
    // x 3600 est devenu le gouffre ; x 3020, portée 180, au pied du rocher en
    // escalier : la langue n'atteint pas la sortie du passage de l'amas (x 2816).
    { type: 'crapaud_piege', x: 3020, y: 400, facing: 'left', reach: 180 },
  ],
  // L'amas, pile sous le mur de racines (aucun moyen de passer par-dessus).
  mossBlocks: [{ id: 'amas_racines', x: 2752, y: 352, w: 128, h: 192 }],
  triggers: [
    { id: 'desespoir', x: 160, w: 200, cutscene: 'fs1_desespoir' },
    { id: 'rencontre', x: 1130, w: 40, forbids: { xaraMet: true }, cutscene: 'fs1_rencontre' },
    { id: 'feu', x: 1580, w: 40, requires: { xaraMet: true }, cutscene: 'fs1_feu' },
    { id: 'creature', x: 1940, w: 40, cutscene: 'fs1_creature' },
    { id: 'talisman', x: 2540, w: 40, requires: { talismanOurs: true }, cutscene: 'fs1_talisman' },
    { id: 'mousse_partout', x: 2950, w: 40, cutscene: 'fs1_mousse_partout' },
    // Vague 3 : bulles de Xara (cf. src/story/vague3_commun.js) : sans le
    // singe, sur le tronc, on reviendra ; avec, sur le bouchon, le mode d'emploi.
    { id: 'v3_gouffre', x: 3584, y: 210, w: 160, h: 120, forbids: { hasMonkeyForm: true }, cutscene: 'v3_fs1_gouffre' },
    { id: 'v3_gouffre_singe', x: 3264, y: 210, w: 128, h: 120, requires: { hasMonkeyForm: true }, forbids: { break_foret_sombre_1_bois_pourri: true }, cutscene: 'v3_fs1_gouffre_singe' },
  ],
  entries: [
    { id: 'from_bosquet', x: 140, y: 400, height: 128 },
    // x 4290 (et non 4212, valeur du plan) : en 4212, le point écrit tombait
    // dans la marche gx 65 (reprise de sauvegarde coincée dans le sol).
    { id: 'from_foret_sombre_2', x: 4290, y: 400, height: 128, edge: 'right' },
  ],
  exits: [
    // Bord gauche : un mur (Agarica est bannie, pas de retour au bosquet).
    { edge: 'right', targetScene: 'ForetSombre2Scene', data: { enterId: 'from_foret_sombre_1' } },
    // Vague 3 : le fond du gouffre, sous le bout du tronc -> la grotte de la
    // lisière (on n'en remonte pas : la grotte ressort par les galeries).
    // x 3712 (et non 3840, valeur du plan) : l'aigle qui plane depuis le bouchon
    // cassé (accepté par l'utilisateur) porte jusqu'à x ≈ 3760-3780 avant le
    // fond ; la sortie commence sous la 2e liane.
    { edge: 'bottom', from: 3712, to: 4032, targetScene: 'GrotteLisiereScene', data: { enterId: 'from_foret_sombre_1' }, hint: 'lueur' },
  ],
};
