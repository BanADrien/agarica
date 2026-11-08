// Zone « foret_sombre_2 » : les ravins de la forêt sombre (acte 1, zone 3 de
// PLAN_DEV.md). Logique (dialogues de Xara, mare aux trois poissons dessinée,
// plante résistante, grand arbre au loin, cœur secret) :
// ZONE_SCRIPTS.foret_sombre_2 + CUTSCENES/DIALOGUES `fs2_*` dans src/story/acte1.js.
//
// Plan (grille 64, surface du sol y=448 ; le monde descend à 720 sous l'écran
// pour que les chutes dans les ravins se déclenchent) — de gauche à droite :
//   x 0-1280     sentier de chasse (empreintes) ; butte du totem du loup
//                (gx 12-15, surface y=320) : accessible SANS le loup ; 3 cases
//                plates (x 1088-1280) d'élan avant le ravin
//   x 1280-1536  ravin de 4 cases : infranchissable sans le sprint du loup
//                (5 cases avant le 2026-11-08 : ~95 px de marge seulement pour
//                le tout premier saut du loup, retour des joueurs)
//   x 1536-2816  sous-bois du loup sanguinaire ; la piste du loup commence
//   x 2816-3392  ravin de 9 cases : deux plateformes cachées (révélées par
//                le loup) + pistes
//   x 3392-3968  clairière préservée : feu de camp (x 3430), mare aux trois poissons (pont de
//                bois), plante résistante sur une haute branche
//                (gx 55-57, y=64 : hors d'atteinte), crapaud-piège (x 3850)
//   x 3968-5248  surplomb (gx 65-81, gy 3, surface y=192) : le chemin passe DESSUS,
//                gardé par un crapaud sauteur (x 4700) ;
//                dessous, la poche fermée par le mur de mousse
//                `mur_repulsif_foret_sombre` (répulsif, acte 2) → cœur secret
//                + vieux sentier vers la hutte de Morgat
//   x 5248-5888  vue sur le grand arbre ; sortie → racines du grand arbre
// Vague 3 (2026-11-08) : au-dessus du surplomb, la TROUÉE x 4736-4864 (sortie
// haute vers le cercle de lune) : du surplomb (192), le saut simple n'y monte
// pas (pieds à 20), le second saut du singe ou de l'aigle la franchit.
const FORET_SOMBRE_2_SURFACE_Y = 448;

const FORET_SOMBRE_2_DATA = {
  levelWidth: 5888,
  levelHeight: 720,
  zoneName: 'La forêt sombre',
  background: 'fond_foret_sombre',
  zoneSub: 'Le sentier des ravins',
  ambient: { tint: 0x070b22, darkness: 0.28 },
  // Rendu de cohésion (LookKit.js, PLAN_DEV.md « Rendu de cohésion ») : même
  // profil que la forêt sombre 1 (zone de référence, même forêt, même fond),
  // pour que le passage de l'une à l'autre ne se voie pas. Seul écart : le sol
  // de second plan des ravins (groundBackCells) plus sombre que par défaut
  // (0,55) : il cache le pied des arbres du fond sans se lire comme un sol où
  // l'on pourrait atterrir.
  look: { profile: 'foret_sombre', tiles: { backBright: 0.4 } },
  script: 'foret_sombre_2',
  // Trouée dans la forêt d'arrière-plan (coordonnées de la couche d'arbres,
  // parallaxe 0.35) : elle s'ouvre à l'écran près de la sortie, pour laisser
  // voir le grand arbre peint à l'horizon du fond `fond_foret_sombre` (l'ancienne
  // silhouette dessinée par code a été retirée : elle faisait placeholder).
  avoidRanges: [[2000, 2600]],
  fall: { y: 620, mode: 'hurt' },
  groundCells: [
    // (groundRow : borne de fin exclue)
    // Sentier de chasse. Il continue 3 cases après la marche gx16 : piste
    // d'appel plate pour le saut du loup lancé (avec une seule case, l'appel
    // ne se faisait qu'entre x 1060 et 1152 : on tombait de la marche).
    ...groundRow(0, 20, [7, 8]),
    ...groundRow(5, 7, [6]),         // tronc couché
    ...groundRow(10, 12, [6]),       // marche de la butte
    ...groundRow(12, 16, [5, 6]),    // butte du totem (surface y=320)
    ...groundRow(16, 17, [6]),       // marche côté ravin (pas de face de 2 cases depuis le sol)
    // gx 20-23 : RAVIN DE 4 CASES (x 1280-1536)
    ...groundRow(24, 44, [7, 8]),    // sous-bois
    ...groundRow(30, 31, [6]),       // rocher moussu, en escalier
    ...groundRow(31, 32, [5, 6]),
    ...groundRow(32, 33, [6]),
    ...groundRow(34, 37, [4]),       // branche haute (élan du loup)
    // gx 44-52 : RAVIN DE 9 CASES (plateformes cachées : hiddenPlatforms)
    ...groundRow(53, 78, [7, 8]),    // clairière, surplomb, sortie
    // gx 78-79 : le trou du vieux sentier, au fond de la poche (sortie basse
    // vers la hutte de Morgat) : il n'y a pas d'autre bord à portée de la poche.
    ...groundRow(80, 92, [7, 8]),
    ...groundRow(55, 58, [1]),       // haute branche : la plante (hors d'atteinte)
    ...groundRow(61, 62, [6]),       // marchepied vers la corniche
    ...groundRow(62, 65, [4]),       // corniche vers le surplomb ; on passe dessous
    ...groundRow(65, 82, [3]),       // le surplomb (chemin principal, surface y=192)
    ...groundRow(80, 82, [4, 5, 6]), // fond de la poche secrète
    // Escalier de retour (venant des racines) vers le surplomb : marches d'une
    // case, sans fente où rester coincé contre le fond de la poche.
    ...groundRow(82, 83, [4, 5, 6]),
    ...groundRow(83, 84, [5, 6]),
    ...groundRow(84, 85, [6]),
  ],
  // Sol de second plan (sans collision, assombri, derrière le sol de jeu) au
  // fond des deux ravins : au-dessus du vide, on voyait le bas coupé net des
  // arbres du fond (images arrêtées vers y 470). Haut à la hauteur du sol
  // voisin (gy 7, y 448) -- une rangée plus bas, la coupure restait visible --
  // jusqu'au bas du sol de jeu (gy 8). La brume sombre des trous mortels
  // (addEdgeHints) passe DEVANT ce sol : le fond des ravins s'enfonce toujours
  // dans le noir. Le trou du vieux sentier (gx 78-79, sortie basse vers la
  // hutte de Morgat) reste ouvert : c'est un passage, sa lueur chaude et son
  // panneau doivent se lire comme une ouverture.
  groundBackCells: [
    ...groundRow(20, 24, [7, 8]),    // ravin de 4 cases (x 1280-1536)
    ...groundRow(44, 53, [7, 8]),    // ravin de 9 cases (x 2816-3392), sous les plateformes cachées
  ],
  playerSpawn: { x: 110, y: 412 },
  hiddenPlatforms: [
    { gx: 46, gy: 6, w: 3 },   // x 2944-3136 (2 cases de vide avant)
    { gx: 51, gy: 6, w: 2 },   // x 3264-3392 (2 cases de vide avant), puis la rive
  ],
  tracks: [
    { x: 260, y: FORET_SOMBRE_2_SURFACE_Y, w: 800 },   // la bête est passée par le sentier
    { x: 1620, y: FORET_SOMBRE_2_SURFACE_Y, w: 1180 }, // … puis file vers le grand ravin
    { x: 2944, y: 384, w: 192 },
    { x: 3264, y: 384, w: 128 },
    { x: 3400, y: FORET_SOMBRE_2_SURFACE_Y, w: 240 },
  ],
  // Feu de camp à la sortie du grand ravin : soin et sauvegarde après les chutes.
  campfires: [{ x: 3430, y: FORET_SOMBRE_2_SURFACE_Y }],
  totems: [
    { x: 896, y: 320, flag: 'hasWolfForm', message: 'Forme du loup !' },
  ],
  // La mare (x 3520-3776) est DESSINÉE par le script (pas de clé `water`,
  // qui blesserait Agarica sans la pieuvre) ; les poissons nagent dedans.
  animals: [
    { type: 'poissons', x: 3536, y: 466, w: 224, h: 56 },
    { type: 'papillons', x: 3700, y: 150, count: 5, w: 120 },
  ],
  // Décors de la forêt sombre (section `foret_sombre`) : jamais sur la butte du
  // totem (le totem est dessiné derrière les décors) ni devant les sorties.
  props: [
    // (Pas de `foret_sombre_arbre_moussu` : hors de la DA, retiré.)
    { type: 'foret_sombre_champignons_lumineux', x: 210, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.26 },
    { type: 'foret_sombre_rocher_mousse', x: 520, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_fougere_sombre', x: 1180, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.28 }, // piste d'appel
    { type: 'foret_sombre_racine_arche', x: 1760, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.4 },
    { type: 'foret_sombre_souche_champignons', x: 2272, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.3 }, // sous la branche haute
    { type: 'foret_sombre_buisson_epineux', x: 2560, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.3 },
    { type: 'foret_sombre_champignons_lumineux', x: 2740, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.26 },
    { type: 'foret_sombre_fougere_sombre', x: 3830, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.26 },
    { type: 'foret_sombre_rocher_mousse', x: 4500, y: 192, scale: 0.28 },       // sur le surplomb
    { type: 'foret_sombre_fougere_sombre', x: 4980, y: 192, scale: 0.26 },
    { type: 'foret_sombre_pierre_runique', x: 4620, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.32 }, // la poche secrète
    { type: 'foret_sombre_champignons_lumineux', x: 4900, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.26 },
    { type: 'foret_sombre_racine_arche', x: 4820, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.34 },   // le vieux sentier de la hutte, avant son trou
    { type: 'foret_sombre_racine_arche', x: 5580, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.45 }, // vers les racines
  ],
  enemies: [
    { type: 'loup', x: 2350, y: 400, patrolMinX: 2000, patrolMaxX: 2700 },
    // Crapaud-piège, gardien du passage entre la mare (x 3520-3776) et la
    // montée vers le surplomb (marchepied x 3904) : un sauteur y serait à
    // l'étroit (128 px de plat) et se poserait sur la mare dessinée. Le feu de
    // camp (x 3430) est à 390 px de sa bouche, hors de portée (220).
    // x 3850 : en 3880, l'avant de son corps mordait sur le marchepied.
    { type: 'crapaud_piege', x: 3850, y: 400, facing: 'left' },
    // Duel sur le surplomb (x 4160-5248, surface y 192), le chemin principal :
    // réveillé (380 px) après le dialogue du mur (x 4250), à plus de 380 px de
    // la cinématique du grand arbre (x 5320) ; bornes dans le surplomb.
    { type: 'crapaud_sauteur', x: 4700, y: 150, patrolMinX: 4350, patrolMaxX: 5150 },
  ],
  // Mur de mousse vivante à l'entrée de la poche, sous le surplomb : s'ouvre
  // avec le répulsif de Morgat (acte 2). Id cité dans PLAN_DEV.md.
  // 128 px de large et jusqu'au haut de la HITBOX du sol (448 +
  // GROUND_STAND_SINK : 464 avec le jeu 'floor', 448 avec 'tuiles') : à 64 px,
  // le passage humain → loup (corps plus long) en plein contact faisait
  // traverser le mur (poche et hutte atteintes sans répulsif). Haut à y 256.
  mossWalls: [{ id: 'mur_repulsif_foret_sombre', x: 4384, y: 256 + (192 + GROUND_STAND_SINK) / 2, w: 128, h: 192 + GROUND_STAND_SINK }],
  triggers: [
    { id: 'empreintes', x: 380, w: 40, cutscene: 'fs2_empreintes' },
    { id: 'ravin', x: 1216, y: 420, w: 128, h: 80, forbids: { hasWolfForm: true }, cutscene: 'fs2_ravin' },
    { id: 'ravin_large', x: 2700, w: 40, cutscene: 'fs2_ravin_large' },
    { id: 'plante', x: 3470, w: 40, cutscene: 'fs2_plante' },
    { id: 'mur', x: 4250, w: 40, cutscene: 'fs2_mur' },
    { id: 'grand_arbre', x: 5320, w: 40, cutscene: 'fs2_grand_arbre' },
    // Vague 3 : bulles de Xara sous la trouée (cf. src/story/vague3_commun.js) ;
    // `airForm` posé = une forme aérienne (singe ou aigle) donne le second saut.
    { id: 'v3_trouee', x: 4800, y: 150, w: 128, h: 100, forbids: { airForm: true }, cutscene: 'v3_fs2_trouee' },
    { id: 'v3_trouee_saut', x: 4800, y: 150, w: 128, h: 100, requires: { airForm: true }, cutscene: 'v3_fs2_trouee_saut' },
  ],
  entries: [
    { id: 'from_foret_sombre_1', x: 110, y: 400, height: 128, edge: 'left' },
    { id: 'from_racines', x: 5760, y: 400, height: 128, edge: 'right' },
    // Par le vieux sentier de la hutte de Morgat : on arrive DANS la poche.
    { id: 'from_hutte_morgat', x: 4960, y: 400, height: 128 },
    // Vague 3 : retour du cercle de lune, par la trouée (on retombe sur le surplomb).
    { id: 'from_cercle_lune', x: 4800, y: 150, height: 100, edge: 'top', from: 4736, to: 4864 },
  ],
  exits: [
    { edge: 'left', targetScene: 'ForetSombre1Scene', data: { enterId: 'from_foret_sombre_2' } },
    { edge: 'right', targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_foret_sombre' } },
    // Fond de la poche (derrière le mur de répulsif) : le trou du sentier vers la hutte.
    { edge: 'bottom', from: 4992, to: 5120, targetScene: 'HutteMorgatScene', data: { enterId: 'from_foret_sombre' } },
    // Vague 3 : la trouée au-dessus du surplomb -> le cercle de lune.
    { edge: 'top', from: 4736, to: 4864, targetScene: 'CercleLuneScene', data: { enterId: 'from_foret_sombre_2' } },
  ],
};
