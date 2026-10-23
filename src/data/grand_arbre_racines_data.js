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
//     à gauche   branche d'élan (y=-128) → 3 LIANES au-dessus du vide → corniche
//                (x 0-320, y=-128) et fente de l'ÉPREUVE DU SINGE. Sans singe,
//                le vide (640 px) est infranchissable : on retombe sur le toit.
//     à droite   branche y=0 → GRANDE BRANCHE HAUTE (y=-192, x 2176-3200) :
//                pierres qui tombent (ombres au sol), singe corrompu, puis
//                montée vers la cime (arène de Kainati, bord droit).
// Mesures : saut simple 172 px (128 = 2 cases, facile), double saut 245 px
// (192 = 3 cases), portée ~175 px ; loup en sprint + double saut ~514 px.
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
  ],
  // Le tronc (x ~1540-2120) est dessiné par le script de zone, derrière les branches.
  playerSpawn: { x: 110, y: 412 },
  // Lianes de l'épreuve : décor sans la forme singe (Xara le remarque).
  // (x, y = attache en haut ; bas à ~110 px au-dessus de la branche d'élan.)
  vines: [
    { x: 850, y: -420, length: 180 },
    { x: 665, y: -420, length: 190 },
    { x: 480, y: -420, length: 180 },
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
  props: [
    { type: 'bosquet_mossy_rock', x: 200, y: RACINES_SURFACE_Y, scale: 0.45 },
    { type: 'bosquet_tree_stump', x: 1260, y: RACINES_SURFACE_Y, scale: 0.4 },
    { type: 'bosquet_mossy_rock', x: 1900, y: RACINES_SURFACE_Y, scale: 0.5 },
    { type: 'bosquet_mossy_rock', x: 2600, y: RACINES_SURFACE_Y, scale: 0.4 },
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
