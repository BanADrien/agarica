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
//   x 1280-1600  ravin de 5 cases : infranchissable sans le sprint du loup
//   x 1600-2816  sous-bois du loup sanguinaire ; la piste du loup commence
//   x 2816-3392  ravin de 9 cases : deux plateformes cachées (révélées par
//                le loup) + pistes
//   x 3392-3968  clairière préservée : feu de camp (x 3430), mare aux trois poissons (pont de
//                bois), plante résistante sur une haute branche
//                (gx 55-57, y=64 : hors d'atteinte), crapaud corrompu
//   x 3968-5248  surplomb (gx 65-81, gy 3, surface y=192) : le chemin passe DESSUS ;
//                dessous, la poche fermée par le mur de mousse
//                `mur_repulsif_foret_sombre` (répulsif, acte 2) → cœur secret
//                + vieux sentier vers la hutte de Morgat
//   x 5248-5888  vue sur le grand arbre ; sortie → racines du grand arbre
const FORET_SOMBRE_2_SURFACE_Y = 448;

const FORET_SOMBRE_2_DATA = {
  levelWidth: 5888,
  levelHeight: 720,
  zoneName: 'La forêt sombre',
  background: 'fond_foret_sombre',
  zoneSub: 'Le sentier des ravins',
  ambient: { tint: 0x070b22, darkness: 0.28 },
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
    // gx 20-24 : RAVIN DE 5 CASES (x 1280-1600)
    ...groundRow(25, 44, [7, 8]),    // sous-bois
    ...groundRow(30, 31, [6]),       // rocher moussu, en escalier
    ...groundRow(31, 32, [5, 6]),
    ...groundRow(32, 33, [6]),
    ...groundRow(34, 37, [4]),       // branche haute (élan du loup)
    // gx 44-52 : RAVIN DE 9 CASES (plateformes cachées : hiddenPlatforms)
    ...groundRow(53, 92, [7, 8]),    // clairière, surplomb, sortie
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
    { type: 'foret_sombre_racine_arche', x: 5050, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.34 },   // le vieux sentier de la hutte
    { type: 'foret_sombre_racine_arche', x: 5580, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.45 }, // vers les racines
  ],
  enemies: [
    { type: 'loup', x: 2350, y: 400, patrolMinX: 2000, patrolMaxX: 2700 },
    // Fixe, langue vers la droite : on l'approche par derrière (venant de l'ouest).
    // x 3850 : en 3880, l'avant de son corps (±35 px) mordait sur le marchepied
    // (x 3904) et le crapaud restait perché sur son coin, 64 px au-dessus du sol.
    { type: 'crapaud_corrompu', x: 3850, y: 400 },
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
  ],
  entries: [
    { id: 'from_foret_sombre_1', x: 110, y: 400, height: 128 },
    { id: 'from_racines', x: 5760, y: 400, height: 128 },
    // Par le vieux sentier de la hutte de Morgat : on arrive DANS la poche.
    { id: 'from_hutte_morgat', x: 4960, y: 400, height: 128 },
  ],
  exits: [
    { x: 16, targetScene: 'ForetSombre1Scene', data: { enterId: 'from_foret_sombre_2' } },
    { x: 5872, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_foret_sombre' } },
    // Fond de la poche (derrière le mur de répulsif) : le sentier vers la hutte.
    { x: 5080, y: 352, height: 192, targetScene: 'HutteMorgatScene', data: { enterId: 'from_foret_sombre' } },
  ],
};
