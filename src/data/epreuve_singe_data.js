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
// Chaque liane pend sous sa case d'accroche, dans une grande branche (attache =
// haut de la case + 64, x au centre de la case). `tallLevel` : caméra de y=-400
// à 540 ; tout en bas, la mousse toxique (bande `liquidFloor`) : y tomber = retour
// à la lanterne.
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
const EPREUVE_TRONC_TINT = 0x9d94a6;
// Grandes branches des lianes : décor sauf la case d'accroche. Teinte franche
// d'arrière-plan (0xb9b0c0 avant, -27 % seulement) : avec leur mousse vive elles
// se lisaient comme des sols, on s'y posait puis on tombait au travers. Sert
// aussi aux parties courbes (décor) des rameaux.
const EPREUVE_BRANCHE_TINT = 0x6e6878;

const EPREUVE_SINGE_DATA = {
  levelWidth: 12288,
  levelHeight: 540,
  tallLevel: true,
  zoneName: 'Épreuve du singe',
  zoneSub: 'Ne touche pas le sol',
  background: 'fond_grand_arbre',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_ecorce',
  // Pas de vignette (lot Codex n°8, décision H1) : réservée aux zones
  // sombres ; l'épreuve se joue dans la cime, à la lumière.
  ambient: { tint: 0x0b1424, darkness: 0.12, vignette: false },
  // Rendu de cohésion (LookKit, réglé à la capture le 2026-11-08) : celui des
  // racines (même arbre : troncs et branches au contraste adouci, jamais en
  // aplat), un cran plus clair -- on est dans la cime, à la lumière : voile
  // gardé à 60 %, fond un peu plus lumineux. Feu du départ adouci : collé au
  // premier tronc, il le teintait de rouge sur toute sa hauteur. Saturation
  // pleine et carte de couleurs à 8 % : la mousse toxique du bas et sa marée
  // (S4) gardent leur vert vif de danger.
  look: {
    profile: 'nuit',
    grade: { exposure: 1.05, contrast: 1.06, pivot: 0.2, sat: 1.0, mapAmt: 0.08, shadowAmt: 0.02 },
    overlay: 0.6,
    back: { sat: 0.82, bright: 0.88, fog: 0x28183c, fogAmt: 0.1, mist: 0.14 },
    lights: { rules: { feu: { radius: 180, intensity: 0.55, glow: 0.18 } } },
  },
  script: 'epreuve_singe',
  // Troncs juste derrière le plan de jeu : au départ, puis aux corniches. Ils
  // descendent sous la mousse toxique (seul le premier a un pied, sur le sol).
  trunks: [
    { x: 150, top: -460, bottom: EPREUVE_SINGE_SURFACE_Y, scale: 0.3, base: true, tint: EPREUVE_TRONC_TINT },
    { x: 3584, top: -460, bottom: 560, tint: EPREUVE_TRONC_TINT },
    { x: 4160, top: -460, bottom: 560, tint: EPREUVE_TRONC_TINT },
    { x: 7488, top: -460, bottom: 560, tint: EPREUVE_TRONC_TINT },
    { x: 9248, top: -460, bottom: 560, tint: EPREUVE_TRONC_TINT },
    { x: 11750, top: -460, bottom: 560, tint: EPREUVE_TRONC_TINT },
  ],
  // LA GÉOMÉTRIE DE COLLISION N'A PAS BOUGÉ (vérifié corps par corps) : mêmes cases
  // que les anciennes tuiles, le parcours est réglé au millimètre. Seul le dessin
  // change, le reste des courbes n'est qu'un décor, en arrière-plan.
  // Chaque liane pend sous sa case d'accroche (rangée 0 → attache y=64, 1 → 128,
  // -5 → -256, -6 → -320) : la grande branche de chaque section passe par ces
  // cases, son dessous (surface + 56 - 2) à l'attache de la liane.
  branches: [
    // S1 : du tronc de départ au tronc de la corniche A.
    {
      from: [256, -40],
      via: [[608, 10], [928, 10], [1248, 74], [1568, 10], [1952, 10], [2336, 74], [2720, 10], [3104, 10]],
      to: [3500, -30], attach: 'both', tint: EPREUVE_BRANCHE_TINT,
      cells: [
        ...groundRow(9, 10, [0]), ...groundRow(14, 15, [0]), ...groundRow(19, 20, [1]), ...groundRow(24, 25, [0]),
        ...groundRow(30, 31, [0]), ...groundRow(36, 37, [1]), ...groundRow(42, 43, [0]), ...groundRow(48, 49, [0]),
      ],
    },
    // S2 : la liane à gravir pend d'un moignon du tronc de la corniche B.
    { from: [3930, -376], via: [[4000, -374]], to: [4080, -410], attach: 'right', tint: EPREUVE_BRANCHE_TINT, cells: groundRow(62, 63, [-6]) },
    // S3 : du tronc de la corniche B au tronc de la corniche C.
    {
      from: [4240, -410],
      via: [[4768, -374], [5152, -310], [5536, -374], [6048, -374], [6496, -310], [6880, -374], [7264, -374]],
      to: [7410, -410], attach: 'both', tint: EPREUVE_BRANCHE_TINT,
      cells: [
        ...groundRow(74, 75, [-6]), ...groundRow(80, 81, [-5]), ...groundRow(86, 87, [-6]), ...groundRow(94, 95, [-6]),
        ...groundRow(101, 102, [-5]), ...groundRow(107, 108, [-6]), ...groundRow(113, 114, [-6]),
      ],
    },
    // S4 : du tronc de C au tronc de D.
    {
      from: [7570, -410], via: [[8096, -374], [8480, -310], [9056, -374]], to: [9170, -410],
      attach: 'both', tint: EPREUVE_BRANCHE_TINT,
      cells: [...groundRow(126, 127, [-6]), ...groundRow(132, 133, [-5]), ...groundRow(141, 142, [-6])],
    },
    // S5 : du tronc de D au tronc du sommet.
    {
      from: [9330, -410],
      via: [[9824, -374], [10336, -310], [10720, -374], [11168, -374], [11616, -374]],
      to: [11670, -410], attach: 'both', tint: EPREUVE_BRANCHE_TINT,
      cells: [
        ...groundRow(153, 154, [-6]), ...groundRow(161, 162, [-5]), ...groundRow(167, 168, [-6]),
        ...groundRow(174, 175, [-6]), ...groundRow(181, 182, [-6]),
      ],
    },
    // --- Plateformes, là où l'on pose les pieds.
    { from: [0, EPREUVE_SINGE_SURFACE_Y], to: [448, EPREUVE_SINGE_SURFACE_Y], rows: 2, thickness: 100, tip: 'right' }, // S1 : sol de départ (y=448)
    { from: [3264, 320], to: [3520, 320], attach: 'right' },  // S1→S2 : corniche A (lanterne 2)
    { from: [3648, 320], to: [4096, 320], attach: 'both' },   // S2 : îlot R1, pierres en rythme
    { from: [4224, -64], to: [4544, -64], attach: 'left' },   // S2→S3 : corniche B (lanterne 3)
    // Rameaux coupés en deux (revue du 2026-11-05) : la partie courbe, dessinée
    // avant, est un décor teinté sans case ; seule la partie plate, claire, porte.
    // D'un seul tenant, la pente moussue se lisait comme une rampe praticable.
    // S3 : îlot de repos, pierres (x 5696-5824, y=-64) : un rameau qui descend de la
    // grande branche.
    { from: [5570, -340], via: [[5640, -190]], to: [5722, -64], attach: 'left', tint: EPREUVE_BRANCHE_TINT, solid: false },
    { from: [5696, -64], to: [5824, -64], tip: 'both' },
    // S3 : perchoir du singe corrompu (x 6528-6720, y=64) : monte d'en bas, hors de l'écran.
    { from: [6400, 580], via: [[6476, 300]], to: [6554, 64], tint: EPREUVE_BRANCHE_TINT, solid: false },
    { from: [6528, 64], to: [6720, 64], tip: 'both' },
    { from: [7552, -64], to: [7808, -64], attach: 'left', forks: [{ at: 0 }] },   // S3→S4 : corniche C (lanterne 4)
    // S4 : rebord sûr, au-dessus de la marée (x 8640-8832, y=256) : monte d'en bas.
    { from: [8520, 580], via: [[8596, 420]], to: [8666, 256], tint: EPREUVE_BRANCHE_TINT, solid: false },
    { from: [8640, 256], to: [8832, 256], tip: 'both' },
    { from: [8832, 384], to: [9216, 384], attach: 'right' },  // S4 : passage bas P, marée de mousse
    { from: [9280, -64], to: [9600, -64], attach: 'left' },   // S4→S5 : corniche D (lanterne 5)
    { from: [11840, -128], to: [12288, -128], attach: 'left', tip: 'none' }, // le sommet (talisman), sort de l'écran
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
    { edge: 'left', to: 448, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } },
    // (La fente du sommet, bord droit du parcours, qui redescend vers les
    // racines, est ajoutée par le script une fois le talisman pris :
    // EPREUVE_SINGE_SORTIE_SOMMET.)
  ],
  entries: [
    // Arrivée par le bord gauche, le même côté qu'à la sortie des racines : elle
    // repart vers l'intérieur (cf. applyEdgeArrivalState, PLAN_DEV : passage à revoir).
    { id: 'from_racines', x: 120, y: 400, height: 100, edge: 'left', to: 448 },
  ],
};
