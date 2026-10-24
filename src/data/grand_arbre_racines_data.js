// Zone « grand_arbre_racines » : les racines et le tronc du grand arbre
// (acte 1, zone 4 de PLAN_DEV.md). Première zone VERTICALE (`tallLevel` :
// caméra de y=-400 à 540). Logique (pierres qui tombent, remarques de Xara,
// tronc dessiné) : src/story/acte1_arbre.js (ZONE_SCRIPTS.grand_arbre_racines).
//
// Plan (grille 64 ; surface d'une case gy = gy*64 ; sol y=448) :
//   x 0-256      pied de l'arbre : arrivée de la forêt sombre (bas-gauche)
//   x 256-1280   TUNNEL de racines (plafond gy 3-4) : créature de mousse ;
//                son toit (y=192) est un chemin de racines (singe corrompu)
//   x 1344-1600  butte de racine (y=320, marches y=384), marche vers le toit
//   x 1344-1728  BRANCHE DE LA FOURCHE (y=64) : feu de camp. Deux routes :
//     à gauche   branche d'élan (y=-128) → 2 LIANES au-dessus du vide → corniche
//                (x 0-320, y=-128) et fente de l'ÉPREUVE DU SINGE. Sans singe,
//                le vide (640 px) est infranchissable : on retombe sur le toit.
//     à droite   branche y=0 → GRANDE BRANCHE HAUTE (y=-192, x 2176-3200) :
//                pierres qui tombent (ombres au sol), singe corrompu, puis
//                montée vers la cime (arène de Kainati, bord droit).
// Mesures : saut simple 172 px (128 = 2 cases, facile), portée ~180 px, loup
// en sprint ~376 px ; le chemin jusqu'à la cime se fait au saut simple. Le
// bond du singe (264 px, 192 = 3 cases) n'ouvre que la branche d'élan et les
// lianes de l'épreuve.
const RACINES_SURFACE_Y = 448;

const GRAND_ARBRE_RACINES_DATA = {
  levelWidth: 3200,
  levelHeight: 540,
  tallLevel: true,
  zoneName: 'Racines du grand arbre',
  zoneSub: 'Là où la piste du loup s\'arrête',
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  ambient: { tint: 0x0b1424, darkness: 0.18 },
  script: 'grand_arbre_racines',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 50, [7, 8]),    // sol au pied de l'arbre, sur toute la largeur
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
    ...groundRow(29, 32, [-1]),     // branche intermédiaire (x 1856-2048, y=0)
    ...groundRow(34, 50, [-3]),     // grande branche haute (x 2176-3200, y=-192)
    ...groundRow(13, 14, [-7]), ...groundRow(6, 7, [-7]), // accroches des deux lianes
  ],
  // Le tronc (x ~1540-2120) est dessiné par le script de zone, derrière les branches.
  playerSpawn: { x: 110, y: 412 },
  // Lianes de l'épreuve : décor sans la forme singe (Xara le remarque).
  // (x, y = attache en haut ; bas à ~110 px au-dessus de la branche d'élan.)
  // Une sur deux retirée (celle du milieu), puis écart porté à 448 px pour le
  // lâcher puissant (2026-10-23) : fenêtre de lâcher ~630 ms vers la 2e liane,
  // ~850 ms vers la corniche ; la 1re seule n'atteint jamais la corniche (bot
  // de liane, cf. compte rendu Niveaux 2).
  // Chaque liane pend sous un bloc (rangée -7, au ras du haut du monde :
  // au-dessus de la tête d'Agarica quand elle saute depuis la branche d'élan).
  vines: [
    { x: 864, y: -384, length: 244 },
    { x: 416, y: -384, length: 244 },
  ],
  enemies: [
    // Dans le tunnel : la mousse qui remonte vers le tronc.
    { type: 'mousse_creature', x: 760, y: 420, patrolMinX: 560, patrolMaxX: 1080 },
    // Sur le toit de racines : il bombarde la montée (butte → toit → fourche).
    { type: 'singe_corrompu', x: 820, y: 150, patrolMinX: 600, patrolMaxX: 1150 },
    // Sur la grande branche haute, après les pierres.
    { type: 'singe_corrompu', x: 2960, y: -240, patrolMinX: 2820, patrolMaxX: 3110 },
  ],
  campfires: [{ x: 1600, y: 64 }],
  // Décors du grand arbre (`grand_arbre`) ; le tronc lui-même (x 1540-2120) est
  // monté par le script avec les morceaux `grand_arbre_tronc_*`. Petits décors
  // dans le tunnel (144 px libres).
  props: [
    { type: 'grand_arbre_racine_tunnel', x: 150, y: RACINES_SURFACE_Y, scale: 0.45 },  // le pied de l'arbre
    { type: 'grand_arbre_morceaux_ecorce', x: 440, y: RACINES_SURFACE_Y, scale: 0.28 },
    { type: 'grand_arbre_tas_pierres', x: 1000, y: RACINES_SURFACE_Y, scale: 0.26 },
    { type: 'grand_arbre_champignon_etagere', x: 1472, y: 320, scale: 0.28 },        // sur la butte
    { type: 'grand_arbre_nid_singe', x: 1440, y: 64, scale: 0.26 },                  // sur la fourche
    { type: 'grand_arbre_tas_pierres', x: 2520, y: -192, scale: 0.26 },
    { type: 'grand_arbre_statue_simien', x: 3060, y: -192, scale: 0.32 },             // avant la cime
    { type: 'grand_arbre_champignon_etagere', x: 2420, y: RACINES_SURFACE_Y, scale: 0.4 },
    { type: 'grand_arbre_trou_tronc', x: 2880, y: RACINES_SURFACE_Y, scale: 0.4 },
    { type: 'grand_arbre_nid_singe', x: 1090, y: -128, scale: 0.24 },                 // branche d'élan
    { type: 'grand_arbre_statue_simien', x: 230, y: -128, scale: 0.28 },              // corniche de l'épreuve
  ],
  // Pierres qui tombent des branches supérieures (lu par le script de zone) :
  // une ombre grandit sur la branche (télégraphe), puis la pierre tombe.
  // S'arrêtent une fois Kainati apaisé (ce sont ses guetteurs qui les lancent).
  // surfaceY = là où l'on marche sur la grande branche (gy -3, haut de case
  // -192 + GROUND_STAND_SINK, cf. LevelKit) : ombre et impact au ras des pieds.
  rockfall: { x1: 2260, x2: 2760, surfaceY: -192 + GROUND_STAND_SINK, every: 1700, telegraph: 1000 },
  triggers: [
    { id: 'intro', x: 200, w: 160, cutscene: 'racines_intro' },
    { id: 'tunnel', x: 330, w: 40, y: 400, h: 140, cutscene: 'racines_tunnel' },
    // Sur la fourche : les lianes de l'épreuve, visibles mais pas encore utilisables.
    { id: 'lianes', x: 1450, y: 20, w: 200, h: 100, forbids: { hasMonkeyForm: true }, cutscene: 'racines_lianes' },
    { id: 'lianes_singe', x: 1450, y: 20, w: 200, h: 100, requires: { hasMonkeyForm: true }, cutscene: 'racines_lianes_singe' },
    { id: 'pierres', x: 2230, y: -240, w: 60, h: 120, forbids: { kainatiDefeated: true }, cutscene: 'racines_pierres' },
    { id: 'cime', x: 3010, y: -240, w: 60, h: 120, forbids: { kainatiDefeated: true }, cutscene: 'racines_cime' },
  ],
  exits: [
    { x: 16, y: 380, height: 160, targetScene: 'ForetSombre2Scene', data: { enterId: 'from_racines' } },
    { x: 16, y: -190, height: 160, targetScene: 'EpreuveSingeScene', data: { enterId: 'from_racines' } },
    { x: 3184, y: -250, height: 160, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_racines' } },
  ],
  entries: [
    { id: 'from_foret_sombre', x: 110, y: 400, height: 100 },
    { id: 'from_epreuve', x: 150, y: -170, height: 80 },
    { id: 'from_arene', x: 3060, y: -230, height: 80 },
  ],
};
