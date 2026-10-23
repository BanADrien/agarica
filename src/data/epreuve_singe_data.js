// Zone « epreuve_singe » : l'épreuve du peuple de Kainati, une longue course
// de lianes dans les branches (acte 1, zone 7 de PLAN_DEV.md, optionnelle).
// On y entre par les lianes des racines (forme singe). Au sommet, tout au
// bout : le talisman du singe (compétence `pierre`). Logique :
// src/story/acte1_arbre.js (ZONE_SCRIPTS.epreuve_singe + CUTSCENES `epreuve_*`).
//
// « 5 fois plus longue, et dure » (demandes utilisateur) : ~13 000 px de
// parcours (avant : ~3 000 px, 7 lianes) dont ~900 px d'escalade, 27 lianes,
// 5 sections de difficulté croissante, une lanterne (point de reprise) au
// début de chaque section seulement. Règles du singe prises en compte :
// balancement limité (~55°), le lâcher (Espace) compte comme le 2e saut (rien
// après), Z/↑ - S/↓ pour monter/descendre le long d'une liane. Chaque liane
// pend sous un bloc (plus d'attache flottante). `tallLevel` : caméra de y=-400
// à 540 ; tout en bas, la mousse toxique (dessinée par le script) : y tomber =
// retour à la dernière lanterne.
//   S1 x 0-3584       « Les premières prises » : 9 lianes basses, 320 px
//   S2 x 3328-4544    « La montée » : pierres qui tombent EN RYTHME sur l'îlot
//                     R1 (deux couloirs, ombre d'abord), puis une liane de
//                     560 px à gravir avant de se balancer jusqu'à la corniche B
//   S3 x 4288-7552    « Les guetteurs » : 8 lianes courtes sous les branches,
//                     îlot de repos sous des pierres (ombre), singe corrompu
//   S4 x 7296-9344    « Au ras de la mousse » : on plonge, la mousse toxique
//                     submerge EN RYTHME le passage bas P (on attend qu'elle
//                     reflue), puis une liane de 700 px à gravir
//   S5 x 9088-11712   « Le passage final » : 6 lianes de plus en plus courtes,
//                     sans repos (sauf une plateforme qui s'effrite), le sommet
const EPREUVE_SINGE_SURFACE_Y = 448;

const EPREUVE_SINGE_DATA = {
  levelWidth: 11712,
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
    ...groundRow(0, 7, [7, 8]),       // S1 : sol de départ (x 0-448, y=448)
    ...groundRow(52, 56, [5]),        // S1→S2 : corniche A (lanterne 2) (x 3328-3584, y=320)
    ...groundRow(58, 63, [5]),        // S2 : îlot des pierres (deux couloirs, en rythme) (x 3712-4032, y=320)
    ...groundRow(67, 71, [-1]),       // S2→S3 : corniche B (lanterne 3) (x 4288-4544, y=-64)
    ...groundRow(87, 89, [-1]),       // S3 : îlot de repos (pierres annoncées par une ombre) (x 5568-5696, y=-64)
    ...groundRow(98, 100, [0]),       // S3 : perchoir du singe corrompu (x 6272-6400, y=0)
    ...groundRow(114, 118, [-1]),     // S3→S4 : corniche C (lanterne 4) (x 7296-7552, y=-64)
    ...groundRow(129, 132, [5]),      // S4 : rebord sûr avant le passage bas (x 8256-8448, y=320)
    ...groundRow(133, 138, [6]),      // S4 : passage bas (marée de mousse toxique) (x 8512-8832, y=384)
    ...groundRow(142, 146, [-1]),     // S4→S5 : corniche D (lanterne 5) (x 9088-9344, y=-64)
    ...groundRow(176, 183, [-2]),     // le sommet (talisman) (x 11264-11712, y=-128)
    // Blocs d'accroche : chaque liane pend sous une case (plus d'attache flottante).
    ...groundRow(9, 10, [0]), ...groundRow(14, 15, [0]), ...groundRow(19, 20, [0]), ...groundRow(24, 25, [0]),
    ...groundRow(29, 30, [0]), ...groundRow(34, 35, [0]), ...groundRow(39, 40, [0]), ...groundRow(44, 45, [0]),
    ...groundRow(49, 50, [0]), ...groundRow(65, 66, [-6]), ...groundRow(73, 74, [-6]),
    ...groundRow(78, 79, [-6]), ...groundRow(83, 84, [-6]), ...groundRow(91, 92, [-6]),
    ...groundRow(96, 97, [-6]), ...groundRow(101, 102, [-6]), ...groundRow(106, 107, [-6]),
    ...groundRow(111, 112, [-6]), ...groundRow(120, 121, [-6]), ...groundRow(125, 126, [-5]),
    ...groundRow(140, 141, [-6]), ...groundRow(148, 149, [-6]), ...groundRow(153, 154, [-6]),
    ...groundRow(158, 159, [-6]), ...groundRow(163, 164, [-6]), ...groundRow(168, 169, [-6]),
    ...groundRow(173, 174, [-6]),
  ],
  playerSpawn: { x: 120, y: 412 },
  // Lianes (x, y = attache sous son bloc, length vers le bas). Écarts réglés
  // pour le balancement limité : ~320 px pour 190-240 px de liane.
  vines: [
    { x: 608, y: 64, length: 240 },   // S1 : basses, 320 px
    { x: 928, y: 64, length: 240 },
    { x: 1248, y: 64, length: 240 },
    { x: 1568, y: 64, length: 240 },
    { x: 1888, y: 64, length: 240 },
    { x: 2208, y: 64, length: 240 },
    { x: 2528, y: 64, length: 240 },
    { x: 2848, y: 64, length: 240 },
    { x: 3168, y: 64, length: 240 },
    { x: 4192, y: -320, length: 560 },   // S2 : liane à gravir (bas y 240)
    { x: 4704, y: -320, length: 200 },   // S3 : courtes, 320 px
    { x: 5024, y: -320, length: 200 },
    { x: 5344, y: -320, length: 200 },
    { x: 5856, y: -320, length: 200 },
    { x: 6176, y: -320, length: 200 },
    { x: 6496, y: -320, length: 200 },
    { x: 6816, y: -320, length: 200 },
    { x: 7136, y: -320, length: 200 },
    { x: 7712, y: -320, length: 440 },   // S4 : on plonge
    { x: 8032, y: -256, length: 480 },
    { x: 8992, y: -320, length: 700 },   // S4 : liane à gravir (bas y 380)
    { x: 9504, y: -320, length: 230 },   // S5 : de plus en plus courtes, 320 px, sans repos
    { x: 9824, y: -320, length: 220 },
    { x: 10144, y: -320, length: 210 },
    { x: 10464, y: -320, length: 200 },
    { x: 10784, y: -320, length: 190 },
    { x: 11104, y: -320, length: 190 },
  ],
  // Une lanterne au début de chaque section seulement, à ~100 px du bord
  // d'appel de sa corniche (on passe forcément devant en courant pour sauter).
  checkpoints: [
    { x: 400, y: EPREUVE_SINGE_SURFACE_Y },
    { x: 3484, y: 320 },
    { x: 4444, y: -64 },
    { x: 7452, y: -64 },
    { x: 9244, y: -64 },
  ],
  // Mousse toxique en contrebas (dessinée par le script) : chute = lanterne.
  fall: { y: 480, mode: 'respawn' },
  campfires: [{ x: 230, y: EPREUVE_SINGE_SURFACE_Y }],
  // Décors du grand arbre (`grand_arbre`), seulement sur les corniches (rien
  // ne doit masquer les lianes) et à l'écart des lanternes.
  props: [
    { type: 'grand_arbre_nid_singe', x: 3380, y: 320, scale: 0.22 },
    { type: 'grand_arbre_tas_pierres', x: 4330, y: -64, scale: 0.22 },
    { type: 'grand_arbre_champignon_etagere', x: 7340, y: -64, scale: 0.24 },
    { type: 'grand_arbre_morceaux_ecorce', x: 9140, y: -64, scale: 0.22 },
    { type: 'grand_arbre_statue_simien', x: 11330, y: -128, scale: 0.32 },
  ],
  // --- Pièges (lus par le script de zone) ---
  // Pierres EN RYTHME (S2, avant l'escalade) : tous les `period` ms, une pierre
  // tombe dans chaque couloir, annoncée par une ombre `telegraph` ms avant.
  rhythmRocks: [
    { lanes: [3780, 3880], surfaceY: 320 + GROUND_STAND_SINK, period: 2600, telegraph: 900, x1: 3600, x2: 4100 },
  ],
  // Marée de mousse toxique (S4, avant l'escalade) : elle monte sur le passage
  // bas P puis reflue, en boucle (bas, montée, haut, descente, en ms) ; la
  // toucher = retour à la lanterne.
  tides: [
    { x: 8496, w: 352, low: 500, high: 340, phases: [2600, 700, 1200, 700] },
  ],
  // Pierres qui tombent sur l'îlot de repos de S3 (ombre qui grandit d'abord).
  rockfalls: [
    { x1: 5584, x2: 5680, surfaceY: -64 + GROUND_STAND_SINK, every: 1500, telegraph: 900 },
  ],
  // Plateforme qui s'effrite (S5, entre deux lianes : un répit très bref).
  // x = centre, y = surface, w = largeur ; elle cède ~0,6 s après qu'on s'y pose.
  crumble: [
    { x: 10304, y: -40, w: 96 },
  ],
  enemies: [
    // Sur son perchoir, sous la course : il lance des pierres en cloche.
    { type: 'singe_corrompu', x: 6336, y: -40, patrolMinX: 6290, patrolMaxX: 6380, hp: 2 },
  ],
  pickups: [
    { item: 'talisman_singe', x: 11500, y: -172, cutscene: 'epreuve_talisman' },
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
