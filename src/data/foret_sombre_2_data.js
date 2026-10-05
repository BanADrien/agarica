// Zone « foret_sombre_2 » : les ravins de la forêt sombre (acte 1, zone 3 de
// PLAN_DEV.md). Logique (dialogues de Xara, mare aux trois poissons dessinée,
// plante résistante, grand arbre au loin, cœur secret) :
// ZONE_SCRIPTS.foret_sombre_2 + CUTSCENES/DIALOGUES `fs2_*` dans src/story/acte1.js.
//
// Plan (grille 64, surface du sol y=448 ; le monde descend à 720 sous l'écran
// pour que les chutes dans les ravins se déclenchent) — de gauche à droite :
//   x 0-1152     sentier de chasse (empreintes) ; butte du totem du loup
//                (gx 12-15, surface y=320) : accessible SANS le loup
//   x 1152-1472  ravin de 5 cases : infranchissable sans le sprint du loup
//   x 1472-2816  sous-bois du loup sanguinaire ; la piste du loup commence
//   x 2816-3392  ravin de 9 cases : deux plateformes cachées (révélées par
//                le loup) + pistes
//   x 3392-3968  clairière préservée : feu de camp (x 3430), mare aux trois poissons (pont de
//                bois), plante résistante sur la branche d'un arbre mort
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
  // voir le grand arbre dessiné au loin par le script.
  avoidRanges: [[2000, 2600]],
  fall: { y: 620, mode: 'hurt' },
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 18, [7, 8]),     // sentier de chasse
    ...groundRow(5, 7, [6]),         // tronc couché
    ...groundRow(10, 12, [6]),       // marche de la butte
    ...groundRow(12, 16, [5, 6]),    // butte du totem (surface y=320)
    ...groundRow(16, 17, [6]),       // marche côté ravin (pas de face de 2 cases depuis le sol)
    // gx 18-22 : RAVIN DE 5 CASES
    ...groundRow(23, 44, [7, 8]),    // sous-bois
    ...groundRow(30, 31, [6]),       // rocher moussu, en escalier
    ...groundRow(31, 32, [5, 6]),
    ...groundRow(32, 33, [6]),
    ...groundRow(34, 37, [4]),       // branche haute (élan du loup)
    // gx 44-52 : RAVIN DE 9 CASES (plateformes cachées : hiddenPlatforms)
    ...groundRow(53, 92, [7, 8]),    // clairière, surplomb, sortie
    ...groundRow(55, 58, [1]),       // branche de l'arbre mort : la plante (hors d'atteinte)
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
    { x: 1500, y: FORET_SOMBRE_2_SURFACE_Y, w: 1300 }, // … puis file vers le grand ravin
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
  props: [
    { type: 'bosquet_mossy_rock', x: 520, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.4 },
    { type: 'bosquet_tree_stump', x: 1060, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.4 },
    { type: 'bosquet_mossy_rock', x: 1560, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.45 },
    { type: 'bosquet_bush_round', x: 2600, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.4 },
    { type: 'bosquet_bush_flowering', x: 3830, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.4 },
    { type: 'bosquet_mossy_rock', x: 5420, y: FORET_SOMBRE_2_SURFACE_Y, scale: 0.5 },
  ],
  enemies: [
    { type: 'loup', x: 2350, y: 400, patrolMinX: 2000, patrolMaxX: 2700 },
    // Fixe, langue vers la droite : on l'approche par derrière (venant de l'ouest).
    { type: 'crapaud_corrompu', x: 3880, y: 400 },
  ],
  // Mur de mousse vivante à l'entrée de la poche, sous le surplomb : s'ouvre
  // avec le répulsif de Morgat (acte 2). Id cité dans PLAN_DEV.md.
  mossWalls: [{ id: 'mur_repulsif_foret_sombre', x: 4384, y: 352, w: 64, h: 192 }],
  triggers: [
    { id: 'empreintes', x: 380, w: 40, cutscene: 'fs2_empreintes' },
    { id: 'ravin', x: 1088, y: 420, w: 128, h: 80, forbids: { hasWolfForm: true }, cutscene: 'fs2_ravin' },
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
