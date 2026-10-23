// Zone « epreuve_singe » : l'épreuve du peuple de Kainati, une longue course
// de lianes dans les branches (acte 1, zone 7 de PLAN_DEV.md, optionnelle).
// On y entre par les lianes des racines (forme singe). Au sommet, tout au
// bout : le talisman du singe (compétence `pierre`). Logique :
// src/story/acte1_arbre.js (ZONE_SCRIPTS.epreuve_singe + CUTSCENES `epreuve_*`).
//
// Refonte « 5 fois plus longue, et dure » (demande utilisateur) : ~13 000 px
// de parcours (avant : ~3 000 px, 7 lianes), 25 lianes espacées de 390 à
// 450 px (une sur deux, comme partout), 5 sections de difficulté croissante,
// une lanterne (point de reprise) au début de chaque section seulement.
// `tallLevel` : caméra de y=-400 à 540. Tout en bas, la mousse toxique
// (dessinée par le script) : y tomber = retour à la dernière lanterne.
//   S1 x 0-2752       « Les premières prises » : 5 lianes basses, régulières
//   S2 x 2496-4736    « La montée » : 4 lianes de plus en plus hautes, une
//                     plateforme qui s'effrite à mi-chemin (y=96)
//   S3 x 4480-7936    « Les guetteurs » : 6 lianes accrochées au plafond, un
//                     îlot de repos sous les pierres qui tombent (ombre au sol),
//                     un singe corrompu qui lance des pierres depuis son perchoir
//   S4 x 7680-10432   « Au ras de la mousse » : on plonge au ras de la mousse
//                     toxique (lianes longues), une plateforme qui s'effrite
//   S5 x 10176-13184  « Le passage final » : 5 lianes courtes à 450 px, sans
//                     aucun repos, jusqu'au sommet (talisman)
// Sauts du singe : 2e saut en l'air -500 ; une liane lâchée garde un 2e saut.
const EPREUVE_SINGE_SURFACE_Y = 448;

const EPREUVE_SINGE_DATA = {
  levelWidth: 13184,
  levelHeight: 540,
  tallLevel: true,
  zoneName: 'Épreuve du singe',
  zoneSub: 'Ne touche pas le sol',
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  ambient: { tint: 0x0b1424, darkness: 0.12 },
  script: 'epreuve_singe',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 7, [7, 8]),       // S1 : sol de départ (x 0-448)
    ...groundRow(39, 43, [5]),        // S2 : corniche A (x 2496-2752, y=320)
    ...groundRow(70, 74, [-3]),       // S3 : corniche B (x 4480-4736, y=-192)
    ...groundRow(90, 92, [-1]),       //      îlot de repos sous les pierres (x 5760-5888, y=-64)
    ...groundRow(106, 108, [0]),      //      perchoir du singe corrompu (x 6784-6912, y=0)
    ...groundRow(120, 124, [-1]),     // S4 : corniche C (x 7680-7936, y=-64)
    ...groundRow(159, 163, [2]),      // S5 : corniche D (x 10176-10432, y=128)
    ...groundRow(199, 206, [-3]),     //      le sommet (x 12736-13184, y=-192)
  ],
  playerSpawn: { x: 120, y: 412 },
  // Lianes (x, y = attache en haut, length vers le bas). Prise : mains à
  // < 30 px de la liane, entre 18 px sous l'attache et son bas (+8).
  vines: [
    // S1 — basses, 410 px
    { x: 620, y: 40, length: 280 },
    { x: 1030, y: 20, length: 290 },
    { x: 1440, y: 40, length: 280 },
    { x: 1850, y: 20, length: 290 },
    { x: 2260, y: 40, length: 280 },
    // S2 — chacune ~100 px plus haut que la précédente
    { x: 2930, y: -100, length: 250 },
    { x: 3320, y: -200, length: 240 },
    { x: 3930, y: -300, length: 230 },   // après la plateforme qui s'effrite
    { x: 4310, y: -380, length: 210 },
    // S3 — au plafond, 420 px
    { x: 4940, y: -400, length: 240 },
    { x: 5360, y: -400, length: 250 },
    { x: 6160, y: -400, length: 230 },   // après l'îlot aux pierres
    { x: 6580, y: -400, length: 250 },
    { x: 7000, y: -400, length: 260 },
    { x: 7420, y: -400, length: 260 },
    // S4 — longues, on plonge vers la mousse puis on remonte
    { x: 8120, y: -260, length: 330 },
    { x: 8520, y: -80, length: 340 },
    { x: 9150, y: -60, length: 330 },    // après la plateforme qui s'effrite
    { x: 9550, y: -180, length: 300 },
    { x: 9950, y: -260, length: 280 },
    // S5 — courtes, 450 px, sans repos
    { x: 10640, y: -160, length: 230 },
    { x: 11090, y: -260, length: 210 },
    { x: 11540, y: -340, length: 200 },
    { x: 11990, y: -400, length: 190 },
    { x: 12430, y: -400, length: 180 },
  ],
  // Une lanterne au début de chaque section seulement.
  checkpoints: [
    { x: 400, y: EPREUVE_SINGE_SURFACE_Y },
    { x: 2580, y: 320 },
    { x: 4560, y: -192 },
    { x: 7760, y: -64 },
    { x: 10260, y: 128 },
  ],
  // Mousse toxique en contrebas (dessinée par le script) : chute = lanterne.
  fall: { y: 480, mode: 'respawn' },
  campfires: [{ x: 230, y: EPREUVE_SINGE_SURFACE_Y }],
  // Plateformes qui s'effritent (lu par le script) : x = centre, y = surface,
  // w = largeur. Elles cèdent ~0,6 s après qu'on s'y pose, puis repoussent.
  crumble: [
    { x: 3616, y: 96, w: 128 },
    { x: 8832, y: 288, w: 128 },
  ],
  // Pierres qui tombent sur l'îlot de repos de S3 (ombre qui grandit d'abord).
  rockfalls: [
    { x1: 5776, x2: 5872, surfaceY: -64 + GROUND_STAND_SINK, every: 1500, telegraph: 900 },
  ],
  enemies: [
    // Sur son perchoir, sous la course : il lance des pierres en cloche.
    { type: 'singe_corrompu', x: 6848, y: -40, patrolMinX: 6800, patrolMaxX: 6896, hp: 2 },
  ],
  pickups: [
    { item: 'talisman_singe', x: 13000, y: -236, cutscene: 'epreuve_talisman' },
  ],
  triggers: [
    { id: 'intro', x: 300, w: 40, y: 400, h: 140, requires: { hasMonkeyForm: true }, cutscene: 'epreuve_intro' },
    // Garde-fous (rejouables) : sans le singe, ou avec l'aigle équipé dans les airs.
    { id: 'sans_singe', x: 330, w: 40, y: 400, h: 140, once: false, forbids: { hasMonkeyForm: true }, cutscene: 'epreuve_sans_singe' },
    { id: 'forme_aigle', x: 360, w: 40, y: 400, h: 140, once: false, requires: { airForm: 'eagle' }, cutscene: 'epreuve_forme_aigle' },
  ],
  exits: [
    { x: 16, y: 380, height: 160, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } },
    // (La fente du sommet, au bout du parcours, qui redescend vers les
    // racines, est ajoutée par le script une fois le talisman pris :
    // EPREUVE_SINGE_SORTIE_SOMMET.)
  ],
  entries: [
    { id: 'from_racines', x: 120, y: 400, height: 100 },
  ],
};
