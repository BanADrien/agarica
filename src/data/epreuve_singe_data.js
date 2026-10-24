// Zone « epreuve_singe » : l'épreuve du peuple de Kainati, une longue course
// de lianes dans les branches (acte 1, zone 7 de PLAN_DEV.md, optionnelle).
// On y entre par les lianes des racines (forme singe). Au sommet, tout au
// bout : le talisman du singe (compétence `pierre`). Logique :
// src/story/acte1_arbre.js (ZONE_SCRIPTS.epreuve_singe + CUTSCENES `epreuve_*`).
//
// « 5 fois plus longue, et dure » (demande utilisateur) : 12 288 px de large
// (avant : 1 920), ~14 000 px de parcours (dont ~1 500 px de dénivelé et
// ~800 px d'escalade le long des lianes), 24 lianes (avant : 7), 5 sections de
// difficulté croissante, une lanterne (point de reprise) au début de chaque
// section seulement. Réglée et PROUVÉE au clavier simulé (bot de liane, gigue
// humaine de 80 ms) avec la physique du 2026-10-23 : lâcher = vitesse du
// balancement × 1,45 + 330 px/s vers le haut, vol plané, balancement plafonné
// à ~55°, le lâcher compte comme le 2e saut, Z/↑ - S/↓ pour monter/descendre
// le long d'une liane. Un lâcher plus puissant rendra l'épreuve plus facile,
// jamais impossible. Fenêtre de lâcher mesurée (amplitude maximale, meilleure
// prise) : S1 600-900 ms, S3 330-780 ms, S5 200-320 ms (le saut final : 630).
// Chaque liane pend sous un BLOC (attache = haut de la case + 64, x au
// centre de la case). `tallLevel` : caméra de y=-400 à 540 ; tout en bas, la
// mousse toxique (bande `liquidFloor`) : y tomber = retour à la lanterne.
//   S1 x 0-3520      « Les premières prises » : 8 lianes basses (320-384 px),
//                    sans repos, montées et descentes d'une case
//   S2 x 3264-4544   « La montée » : îlot R1 sous des pierres EN RYTHME (deux
//                    couloirs alternés, ombre d'abord) dont l'un longe la
//                    liane à gravir (520 px) : on attend la pierre, on saute,
//                    on grimpe hors de portée, puis on se balance jusqu'à B
//   S3 x 4224-7808   « Les guetteurs » : 7 lianes hautes (384-448 px, hauteurs
//                    variées), îlot de repos sous des pierres (ombre), singe
//                    corrompu sur son perchoir, en contrebas
//   S4 x 7552-9600   « Au ras de la mousse » : on plonge (2 longues lianes),
//                    rebord sûr, puis la mousse toxique submerge EN RYTHME le
//                    passage bas P et le pied de la liane à gravir (640 px) :
//                    on attend qu'elle reflue, on court, on grimpe vite
//   S5 x 9280-12288  « Le passage final » : 3 lianes courtes à grands écarts,
//                    une branche qui s'effrite en contrebas, la dernière liane
//                    à gravir, puis un dernier élan jusqu'au sommet
const EPREUVE_SINGE_SURFACE_Y = 448;

const EPREUVE_SINGE_DATA = {
  levelWidth: 12288,
  levelHeight: 540,
  tallLevel: true,
  zoneName: 'Épreuve du singe',
  zoneSub: 'Ne touche pas le sol',
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  ambient: { tint: 0x0b1424, darkness: 0.12 },
  script: 'epreuve_singe',
  groundCells: [
    // (groundRow : borne de fin exclue ; une case = 64 px)
    ...groundRow(0, 7, [7, 8]),       // S1 : sol de départ (x 0-448, y=448)
    ...groundRow(51, 55, [5]),        // S1→S2 : corniche A (lanterne 2) (x 3264-3520, y=320)
    ...groundRow(57, 64, [5]),        // S2 : îlot R1, pierres en rythme (x 3648-4096, y=320)
    ...groundRow(66, 71, [-1]),       // S2→S3 : corniche B (lanterne 3) (x 4224-4544, y=-64)
    ...groundRow(89, 91, [-1]),       // S3 : îlot de repos, pierres (x 5696-5824, y=-64)
    ...groundRow(102, 105, [1]),      // S3 : perchoir du singe corrompu (x 6528-6720, y=64)
    ...groundRow(118, 122, [-1]),     // S3→S4 : corniche C (lanterne 4) (x 7552-7808, y=-64)
    ...groundRow(135, 138, [4]),      // S4 : rebord sûr, au-dessus de la marée (x 8640-8832, y=256)
    ...groundRow(138, 144, [6]),      // S4 : passage bas P, marée de mousse (x 8832-9216, y=384)
    ...groundRow(145, 150, [-1]),     // S4→S5 : corniche D (lanterne 5) (x 9280-9600, y=-64)
    ...groundRow(185, 192, [-2]),     // le sommet (talisman) (x 11840-12288, y=-128)
    // Blocs d'accroche : une case par liane, la liane pend sous elle
    // (rangée 0 → attache y=64, 1 → 128, -5 → -256, -6 → -320).
    ...groundRow(9, 10, [0]), ...groundRow(14, 15, [0]), ...groundRow(19, 20, [1]), ...groundRow(24, 25, [0]),
    ...groundRow(30, 31, [0]), ...groundRow(36, 37, [1]), ...groundRow(42, 43, [0]), ...groundRow(48, 49, [0]),
    ...groundRow(62, 63, [-6]),
    ...groundRow(74, 75, [-6]), ...groundRow(80, 81, [-5]), ...groundRow(86, 87, [-6]), ...groundRow(94, 95, [-6]),
    ...groundRow(101, 102, [-5]), ...groundRow(107, 108, [-6]), ...groundRow(113, 114, [-6]),
    ...groundRow(126, 127, [-6]), ...groundRow(132, 133, [-5]), ...groundRow(141, 142, [-6]),
    ...groundRow(153, 154, [-6]), ...groundRow(161, 162, [-5]), ...groundRow(167, 168, [-6]),
    ...groundRow(174, 175, [-6]), ...groundRow(181, 182, [-6]),
  ],
  playerSpawn: { x: 120, y: 412 },
  // Lianes : (x, y) = attache sous son bloc (centre de la case, haut + 64),
  // length vers le bas. Indices utilisés par les tests (bot de liane).
  vines: [
    // S1 (0-7) : basses, 320 puis 384 px, sans repos.
    { x: 608, y: 64, length: 240 },
    { x: 928, y: 64, length: 240 },
    { x: 1248, y: 128, length: 240 },
    { x: 1568, y: 64, length: 240 },
    { x: 1952, y: 64, length: 240 },
    { x: 2336, y: 128, length: 240 },
    { x: 2720, y: 64, length: 240 },
    { x: 3104, y: 64, length: 240 },
    // S2 (8) : la liane à gravir, au-dessus de l'îlot R1 (bas y=200).
    { x: 4000, y: -320, length: 520 },
    // S3 (9-15) : hautes, 384-448 px, hauteurs variées.
    { x: 4768, y: -320, length: 200 },
    { x: 5152, y: -256, length: 200 },
    { x: 5536, y: -320, length: 220 },
    { x: 6048, y: -320, length: 200 },
    { x: 6496, y: -256, length: 240 },
    { x: 6880, y: -320, length: 200 },
    { x: 7264, y: -320, length: 220 },
    // S4 (16-18) : on plonge, puis la liane à gravir au-dessus de P (bas y=320).
    { x: 8096, y: -320, length: 440 },
    { x: 8480, y: -256, length: 480 },
    { x: 9056, y: -320, length: 640 },
    // S5 (19-23) : courtes à grands écarts, la dernière à gravir, le saut final.
    { x: 9824, y: -320, length: 200 },
    { x: 10336, y: -256, length: 220 },
    { x: 10720, y: -320, length: 180 },
    { x: 11168, y: -320, length: 520 },
    { x: 11616, y: -320, length: 140 },
  ],
  // Une lanterne au début de chaque section seulement, à ~100 px du bord
  // d'appel de sa corniche (on passe forcément devant en courant pour sauter).
  checkpoints: [
    { x: 400, y: EPREUVE_SINGE_SURFACE_Y },
    { x: 3420, y: 320 },
    { x: 4444, y: -64 },
    { x: 7708, y: -64 },
    { x: 9500, y: -64 },
  ],
  // Mousse toxique en contrebas : bande de liquide (LevelKit) qui cache le
  // pied des arbres du fond, posés sur la même ligne de base. Chute = lanterne.
  backgroundBaseline: 492,
  liquidFloor: { y: 476, style: 'mousse' },
  fall: { y: 480, mode: 'respawn' },
  campfires: [{ x: 230, y: EPREUVE_SINGE_SURFACE_Y }],
  // Décors du grand arbre (`grand_arbre`), seulement sur les corniches (rien
  // ne doit masquer les lianes) et à l'écart des lanternes et des bords d'appel.
  props: [
    { type: 'grand_arbre_nid_singe', x: 3310, y: 320, scale: 0.2 },
    { type: 'grand_arbre_tas_pierres', x: 4290, y: -64, scale: 0.2 },
    { type: 'grand_arbre_champignon_etagere', x: 7600, y: -64, scale: 0.22 },
    { type: 'grand_arbre_morceaux_ecorce', x: 9340, y: -64, scale: 0.2 },
    { type: 'grand_arbre_statue_simien', x: 11918, y: -128, scale: 0.3 },
    { type: 'grand_arbre_autel_singe', x: 12088, y: -128, scale: 0.26 },
  ],
  // --- Pièges (lus par le script de zone) ---
  // Pierres EN RYTHME (S2) : tous les `period` ms, une pierre par couloir,
  // annoncée par une ombre `telegraph` ms avant. Couloir A (x 3880) sur la
  // course d'élan ; couloir B, une demi-période plus tard, LE LONG de la liane
  // à gravir (chute depuis y=-80 : toute sa partie basse) : on attend que la
  // pierre B tombe, on saute, on grimpe au-dessus de y≈-90 avant la suivante
  // (~2,2 s). Entre les deux couloirs (x≈3940), on est à l'abri.
  rhythmRocks: [
    {
      lanes: [{ x: 3880 }, { x: 4000, top: -80, offset: 1300 }],
      surfaceY: 320 + GROUND_STAND_SINK, period: 2600, telegraph: 900, x1: 3264, x2: 4160,
    },
  ],
  // Marée de mousse toxique (S4) : elle monte sur le passage bas P (et le pied
  // de la liane à gravir, jusqu'à 14 px sous le rebord sûr) puis reflue, en
  // boucle (bas, montée, haut, descente, en ms) ; la toucher = retour à la
  // lanterne. P reste découvert ~3,7 s par cycle ; il en faut ~2,4 pour
  // descendre, courir, sauter à la liane et grimper au-dessus de y≈220.
  tides: [
    { x: 8832, w: 384, low: 500, high: 270, phases: [3000, 700, 1200, 700] },
  ],
  // Pierres qui tombent sur l'îlot de repos de S3 (ombre qui grandit d'abord).
  rockfalls: [
    { x1: 5712, x2: 5808, surfaceY: -64 + GROUND_STAND_SINK, every: 1500, telegraph: 900 },
  ],
  // Branche qui s'effrite (S5, en contrebas entre la 3e liane et la liane à
  // gravir : un appui d'une demi-seconde, le seul « repos » de S5). x = centre,
  // y = surface, w = largeur ; elle cède ~0,6 s après qu'on s'y pose.
  crumble: [
    { x: 10944, y: 96, w: 128 },
  ],
  enemies: [
    // Sur son perchoir, sous la course : il lance des pierres en cloche.
    { type: 'singe_corrompu', x: 6624, y: 40, patrolMinX: 6560, patrolMaxX: 6690, hp: 2 },
  ],
  pickups: [
    { item: 'talisman_singe', x: 12088, y: -212, cutscene: 'epreuve_talisman' },
  ],
  triggers: [
    { id: 'intro', x: 300, w: 40, y: 400, h: 140, requires: { hasMonkeyForm: true }, cutscene: 'epreuve_intro' },
    // Garde-fous (rejouables) : sans le singe, ou avec l'aigle équipé dans les airs.
    { id: 'sans_singe', x: 330, w: 40, y: 400, h: 140, once: false, forbids: { hasMonkeyForm: true }, cutscene: 'epreuve_sans_singe' },
    { id: 'forme_aigle', x: 360, w: 40, y: 400, h: 140, once: false, requires: { airForm: 'eagle' }, cutscene: 'epreuve_forme_aigle' },
    // Remarques d'ambiance au début de chaque passage (bulles, ne gèlent
    // rien) : hautes colonnes au-dessus de la corniche de la lanterne (on y
    // arrive en vol, à une hauteur qui varie), qui s'arrêtent avant la
    // liane précédente (sinon elles parleraient trop tôt).
    { id: 's2', x: 3400, w: 200, y: 230, h: 340, cutscene: 'epreuve_s2' },
    { id: 's3', x: 4400, w: 240, y: -170, h: 460, cutscene: 'epreuve_s3' },
    { id: 's4', x: 7680, w: 200, y: -170, h: 460, cutscene: 'epreuve_s4' },
    { id: 's5', x: 9440, w: 240, y: -170, h: 460, cutscene: 'epreuve_s5' },
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
