// Zone « grand_arbre_racines » : les racines et le tronc du grand arbre
// (acte 1, zone 4 de PLAN_DEV.md). Première zone VERTICALE (`tallLevel` :
// caméra de y=-576 à 540). Logique (pierres qui tombent, totem du singe,
// remarques de Xara) : src/story/acte1_arbre.js (ZONE_SCRIPTS.grand_arbre_racines).
//
// Plan (grille 64 ; surface d'une case gy = gy*64 ; sol y=448) :
//   x 0-256      pied de l'arbre : arrivée de la forêt sombre (bas-gauche)
//   x 256-1280   TUNNEL de racines (plafond gy 3-4) : créature de mousse ;
//                son toit (y=192) est un chemin de racines (singe corrompu)
//   x 1344-1600  butte de racine (y=320, marches y=384), marche vers le toit
//   x 1344-1728  BRANCHE DE LA FOURCHE (y=64) : feu de camp. Deux routes :
//     à gauche   branche d'élan (y=-128) → 2 LIANES au-dessus du vide → corniche
//                (x 0-320, y=-128) et fente de l'ÉPREUVE DU SINGE (optionnelle).
//     à droite   branche y=-64 → GRANDE BRANCHE HAUTE (y=-192, x 2176-2944) :
//                pierres qui tombent (ombres au sol), singe corrompu, puis au
//                bout le TOTEM DU SINGE (→ monde spirituel, forme singe).
//   x 2944-3584  le VIDE DE LA CIME : 2 LIANES (x 3040, 3488) pendues sous la
//                canopée (rangée -8) -- même gabarit que celles de l'épreuve
//                (bord → 96 px → liane → 448 px → liane → 96 px → appui).
//                Seule route vers la corniche de la cime : sans la forme
//                singe, l'arène est inaccessible. Dessous, un filet de branche
//                (y=128) et une marche (y=0) : on remonte sur la grande
//                branche au bond du singe (3 cases), sinon on redescend au sol.
//   x 3584-3840  CORNICHE DE LA CIME (y=-192) : sortie vers l'arène.
// Mesures : saut simple ~172 px (128 = 2 cases, facile), portée ~180 px, loup
// en sprint ~376 px ; le chemin jusqu'au totem se fait au saut simple. Le
// bond du singe (264 px, 192 = 3 cases) ouvre la branche d'élan et la marche
// du filet ; les lianes ouvrent l'épreuve et la cime.
const RACINES_SURFACE_Y = 448;

const GRAND_ARBRE_RACINES_DATA = {
  levelWidth: 3840,
  levelHeight: 540,
  // Canopée des lianes de la cime (rangée -8, y -512..-448) visible en haut.
  levelTop: -576,
  tallLevel: true,
  zoneName: 'Racines du grand arbre',
  zoneSub: 'Là où la piste du loup s\'arrête',
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  ambient: { tint: 0x0b1424, darkness: 0.18 },
  script: 'grand_arbre_racines',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 60, [7, 8]),    // sol au pied de l'arbre, sur toute la largeur
    ...groundRow(4, 20, [3, 4]),    // plafond du tunnel = toit de racines (x 256-1280, y=192)
    // Marche d'une case au bout du toit (x 1280-1344, y=256), hors de l'aplomb
    // de la fourche : la butte est SOUS la fourche (dessous y≈112), qui
    // coupait le saut simple butte → toit (1 essai sur 12 à pied). Butte →
    // marche = +64 px, marche → toit = +64 px. Dessous : 144 px libres, comme
    // le tunnel.
    ...groundRow(20, 21, [4]),
    ...groundRow(9, 11, [6]),       // racine en travers du tunnel (petit saut)
    // Butte de racine (x 1408-1536, y=320) avec une marche d'une case de chaque
    // côté (y=384) : jamais de mur de 2 cases au ras du sol (on s'y coince
    // contre l'angle intérieur des tuiles, cf. rapport Acte 1 – Arbre).
    ...groundRow(21, 22, [6]),
    ...groundRow(22, 24, [5, 6]),
    ...groundRow(24, 25, [6]),
    ...groundRow(21, 27, [1]),      // branche de la fourche (x 1344-1728, y=64)
    ...groundRow(15, 19, [-2]),     // branche d'élan vers les lianes (x 960-1216, y=-128)
    ...groundRow(0, 5, [-2]),       // corniche de l'épreuve du singe (x 0-320, y=-128)
    ...groundRow(29, 32, [-1]),     // branche intermédiaire (x 1856-2048, y=-64)
    ...groundRow(34, 46, [-3]),     // grande branche haute (x 2176-2944, y=-192) + totem au bout
    ...groundRow(13, 14, [-7]), ...groundRow(6, 7, [-7]), // accroches des deux lianes de l'épreuve
    // Vide de la cime : accroches des 2 lianes (rangée -8), filet et marche
    // de retour (bond du singe), puis la corniche de la cime.
    ...groundRow(47, 48, [-8]), ...groundRow(54, 55, [-8]),
    // Filet (x 3008-3840, y=128) sous tout le vide et la corniche : une chute
    // des lianes y retombe ; 320 px sous la corniche, jamais un raccourci.
    ...groundRow(47, 60, [2]),
    ...groundRow(46, 47, [0]),      // marche (x 2944-3008, y=0) : filet +128, puis +192 = bond du singe
    ...groundRow(56, 60, [-3]),     // corniche de la cime (x 3584-3840, y=-192)
  ],
  // Le tronc (x ~1540-2120) est dessiné par le script de zone, derrière les branches.
  playerSpawn: { x: 110, y: 412 },
  // (x, y = attache en haut ; chaque liane pend sous un bloc.)
  // Épreuve (à gauche, depuis la branche d'élan) : écart 448 px pour le lâcher
  // puissant (2026-10-23) : fenêtre de lâcher ~630 ms vers la 2e liane, ~850 ms
  // vers la corniche (bot de liane, cf. compte rendu Niveaux 2).
  // Cime (à droite, depuis le bout de la grande branche) : le même gabarit en
  // miroir, 64 px plus haut (bas des lianes 12 px au-dessus de la branche).
  vines: [
    { x: 864, y: -384, length: 244 },
    { x: 416, y: -384, length: 244 },
    { x: 3040, y: -448, length: 244 },
    { x: 3488, y: -448, length: 244 },
  ],
  enemies: [
    // Dans le tunnel : la mousse qui remonte vers le tronc.
    { type: 'mousse_creature', x: 760, y: 420, patrolMinX: 560, patrolMaxX: 1080 },
    // Sur le toit de racines : il bombarde la montée (butte → toit → fourche).
    { type: 'singe_corrompu', x: 820, y: 150, patrolMinX: 600, patrolMaxX: 1150 },
    // Sur la grande branche haute, parmi les pierres (assez loin du bout de
    // la branche pour ne pas viser Agarica pendant le saut vers les lianes).
    { type: 'singe_corrompu', x: 2500, y: -240, patrolMinX: 2400, patrolMaxX: 2600 },
  ],
  campfires: [{ x: 1600, y: 64 }],
  // Décors du grand arbre (`grand_arbre`). Petits décors dans le tunnel (144 px libres).
  props: [
    { type: 'grand_arbre_racine_tunnel', x: 150, y: RACINES_SURFACE_Y, scale: 0.45 },  // le pied de l'arbre
    { type: 'grand_arbre_morceaux_ecorce', x: 440, y: RACINES_SURFACE_Y, scale: 0.28 },
    { type: 'grand_arbre_tas_pierres', x: 1000, y: RACINES_SURFACE_Y, scale: 0.26 },
    { type: 'grand_arbre_champignon_etagere', x: 1472, y: 320, scale: 0.28 },        // sur la butte
    { type: 'grand_arbre_nid_singe', x: 1440, y: 64, scale: 0.26 },                  // sur la fourche
    { type: 'grand_arbre_tas_pierres', x: 2400, y: -192, scale: 0.26 },
    { type: 'grand_arbre_statue_simien', x: 3700, y: -192, scale: 0.32 },             // corniche de la cime
    { type: 'grand_arbre_champignon_etagere', x: 2420, y: RACINES_SURFACE_Y, scale: 0.4 },
    { type: 'grand_arbre_trou_tronc', x: 2880, y: RACINES_SURFACE_Y, scale: 0.4 },
    { type: 'grand_arbre_nid_singe', x: 1090, y: -128, scale: 0.24 },                 // branche d'élan
    { type: 'grand_arbre_statue_simien', x: 230, y: -128, scale: 0.28 },              // corniche de l'épreuve
  ],
  // Totem du singe (lu par le script de zone) : art `totem_monkey_dim`, puis
  // `totem_monkey_lit` une fois éveillé (E) -- il ouvre le monde spirituel.
  totemSinge: { x: 2860, y: -192 },
  // Pierres qui tombent des branches supérieures (lu par le script de zone) :
  // une ombre grandit sur la branche (télégraphe), puis la pierre tombe.
  // S'arrêtent une fois Kainati apaisé (ce sont ses guetteurs qui les lancent).
  // surfaceY = là où l'on marche sur la grande branche (gy -3, haut de case
  // -192 + GROUND_STAND_SINK, cf. LevelKit) : ombre et impact au ras des pieds.
  // x2 avant le totem : on l'éveille sans pierre sur la tête.
  rockfall: { x1: 2260, x2: 2700, surfaceY: -192 + GROUND_STAND_SINK, every: 1700, telegraph: 1000 },
  triggers: [
    { id: 'intro', x: 200, w: 160, cutscene: 'racines_intro' },
    { id: 'tunnel', x: 330, w: 40, y: 400, h: 140, cutscene: 'racines_tunnel' },
    // Sur la fourche : les lianes de l'épreuve, visibles mais pas encore utilisables.
    { id: 'lianes', x: 1450, y: 20, w: 200, h: 100, forbids: { hasMonkeyForm: true }, cutscene: 'racines_lianes' },
    { id: 'lianes_singe', x: 1450, y: 20, w: 200, h: 100, requires: { hasMonkeyForm: true }, cutscene: 'racines_lianes_singe' },
    { id: 'pierres', x: 2230, y: -240, w: 60, h: 120, forbids: { kainatiDefeated: true }, cutscene: 'racines_pierres' },
    // Bout de la grande branche : le totem, et les lianes de la cime au-dessus du vide.
    { id: 'cime', x: 2760, y: -240, w: 60, h: 120, forbids: { hasMonkeyForm: true }, cutscene: 'racines_cime' },
    { id: 'cime_singe', x: 2900, y: -240, w: 60, h: 120, requires: { hasMonkeyForm: true }, forbids: { kainatiDefeated: true }, cutscene: 'racines_cime_singe' },
  ],
  exits: [
    { x: 16, y: 380, height: 160, targetScene: 'ForetSombre2Scene', data: { enterId: 'from_racines' } },
    { x: 16, y: -190, height: 160, targetScene: 'EpreuveSingeScene', data: { enterId: 'from_racines' } },
    // Au bout de la corniche de la cime : l'arène de Kainati.
    { x: 3824, y: -250, height: 160, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_racines' } },
  ],
  entries: [
    { id: 'from_foret_sombre', x: 110, y: 400, height: 100 },
    { id: 'from_epreuve', x: 150, y: -170, height: 80 },
    { id: 'from_arene', x: 3700, y: -230, height: 80 },
    // Retour du monde spirituel : devant le totem, côté branche.
    { id: 'from_monde_spirituel', x: 2780, y: -230, height: 80 },
  ],
};
