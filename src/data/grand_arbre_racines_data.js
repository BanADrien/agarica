// Zone « grand_arbre_racines » : les racines et le tronc du grand arbre
// (acte 1, zone 4 de PLAN_DEV.md). Première zone VERTICALE (`tallLevel` :
// caméra de y=-576 à 540). Logique (pierres qui tombent, totem du singe,
// remarques de Xara) : src/story/acte1_arbre.js (ZONE_SCRIPTS.grand_arbre_racines).
//
// Plan (grille 64 ; surface d'une case gy = gy*64 ; sol y=448). Tronc en x 1752-2148 ;
// toutes les plateformes sont des clés `branches` (cf. BrancheKit.js) :
//   x 0-256      pied de l'arbre : arrivée de la forêt sombre (bas-gauche)
//   x 256-1280   TUNNEL de racines (plafond gy 3-4) : créature de mousse ;
//                son toit (y=192) est un chemin de racines (singe corrompu)
//   x 1344-1600  butte de racine (y=320, marches y=384), marche vers le toit
//   x 1344-1728  BRANCHE DE LA FOURCHE (y=64) : feu de camp. Deux routes :
//     à gauche   branche d'élan (y=-128) → 2 LIANES au-dessus du vide → corniche
//                (x 0-320, y=-128) et fente de l'ÉPREUVE DU SINGE (optionnelle).
//     à droite   branche y=-64 → GRANDE BRANCHE HAUTE (y=-192, x 2176-2944) :
//                pierres qui tombent (ombres au sol), singe corrompu, puis au
//                bout le TOTEM DU SINGE (E : il s'allume et donne la forme singe).
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
  // Pas de vignette (lot Codex n°8, décision H1) : elle est réservée aux
  // zones sombres (forêts sombres, forêt corrompue, arène de Ghil't, trou
  // sombre) ; ici l'arbre est encore sain, la mousse ne fait que monter.
  ambient: { tint: 0x0b1424, darkness: 0.18, vignette: false },
  script: 'grand_arbre_racines',
  // Le grand tronc : la fourche s'y raccorde à gauche, la grande branche à droite,
  // et la branche intermédiaire y fait une console. Juste derrière le plan de jeu.
  trunks: [
    { x: 1950, top: -640, bottom: RACINES_SURFACE_Y, scale: 0.5, base: true, tint: 0xa097aa },
  ],
  // Toutes les plateformes sont des branches ou des racines, avec EXACTEMENT les
  // cases de collision des anciennes tuiles (vérifié corps par corps) : `from`/`to`
  // plats = cases de la rangée sous la surface ; courbes = `cells` écrites à la
  // main, le reste de la courbe n'est qu'un décor. L'ordre = du fond vers l'avant.
  branches: [
    // --- Hauteurs : les deux grandes branches qui portent les lianes. Décor,
    // sauf la case d'accroche de chaque liane. Dessous (surface + 58) = attache.
    // Teinte d'arrière-plan franche (0x6e6878, comme à l'épreuve) : avec sa mousse
    // vive, la branche passait pour un sol, alors qu'on traverse tout sauf la case.
    {
      from: [1800, -560], via: [[1300, -480], [864, -442], [416, -442]], to: [372, -436],
      attach: 'right', thickness: 60, tint: 0x6e6878,
      cells: [...groundRow(13, 14, [-7]), ...groundRow(6, 7, [-7])],
    },
    {
      from: [2110, -566], via: [[2560, -530], [3040, -506], [3488, -506]], to: [3532, -500],
      attach: 'left', thickness: 60, tint: 0x6e6878,
      cells: [...groundRow(47, 48, [-8]), ...groundRow(54, 55, [-8])],
    },
    // --- La racine maîtresse (décor) : du pied du tronc jusque sous le toit du
    // tunnel. Marche et butte en sortent ; plus sombre, c'est le plan d'arrière.
    { from: [1150, 206], via: [[1330, 262], [1560, 356]], to: [1760, 430], attach: 'right', thickness: 104, scaleX: 0.36, tint: 0x7f7688 },
    // Marche d'une case au bout du toit (x 1280-1344, y=256), hors de l'aplomb
    // de la fourche : la butte est SOUS la fourche (dessous y≈112), qui
    // coupait le saut simple butte → toit (1 essai sur 12 à pied). Butte →
    // marche = +64 px, marche → toit = +64 px. Dessous : 144 px libres, comme
    // le tunnel. Plate (ses pentes ressemblaient à des rampes) ; traversable par
    // en dessous pour le loup coincé au pied de la butte (script de zone,
    // ARBRE_RACINES_ONE_WAY).
    { from: [1280, 256], to: [1344, 256], tip: 'both', thickness: 48 },
    // Toit de racines = plafond du tunnel (x 256-1280, y=192, 2 rangées).
    { from: [256, 192], to: [1280, 192], rows: 2, thickness: 112, scaleX: 0.36, tip: 'both' },
    // Butte de racine (x 1408-1536, y=320) avec une marche d'une case de chaque
    // côté (y=384) : jamais de mur de 2 cases au ras du sol (on s'y coince
    // contre l'angle intérieur des tuiles, cf. rapport Acte 1 – Arbre). Deux
    // arches qui sortent du sol ; la basse, dessinée après, couvre le pied de la
    // haute. Virages élargis (points intermédiaires) : les coudes serrés
    // cassaient l'écorce en éclats triangulaires.
    {
      from: [1384, 396], via: [[1396, 350], [1408, 320], [1536, 320], [1548, 350]], to: [1560, 396], thickness: 66, scaleX: 0.3,
      cells: groundRow(22, 24, [5]),
    },
    {
      from: [1318, 474], via: [[1332, 424], [1344, 384], [1600, 384], [1612, 424]], to: [1626, 474], thickness: 60, scaleX: 0.3,
      cells: groundRow(21, 25, [6]),
    },
    // Racine en travers du tunnel (petit saut) : une arche qui sort du sol.
    {
      from: [552, 474], via: [[566, 424], [576, 384], [704, 384], [716, 424]], to: [730, 474], thickness: 50, scaleX: 0.28,
      cells: groundRow(9, 11, [6]),
    },
    // Sol au pied de l'arbre, sur toute la largeur : la racine qui court au sol.
    { from: [0, RACINES_SURFACE_Y], to: [3840, RACINES_SURFACE_Y], rows: 2, thickness: 100, attach: 'none' },
    // --- La fourche et ses rameaux.
    // Branche d'élan vers les lianes (x 960-1216, y=-128) : un rameau de la
    // fourche, coupé en deux. Sa partie courbe (dessinée avant, sans case,
    // teinte d'arrière-plan) ne se lit plus comme une rampe : on la traversait
    // en tombant, sa mousse ressemblait au vrai sol.
    { from: [1190, -128], via: [[1240, -112], [1296, -76]], to: [1424, 56], attach: 'right', thickness: 48, tint: 0x6e6878, solid: false },
    { from: [960, -128], to: [1216, -128], tip: 'both', thickness: 48 },
    // Branche de la fourche (x 1344-1728, y=64) : feu de camp.
    { from: [1344, 64], to: [1728, 64], attach: 'right', thickness: 56 },
    // Corniche de l'épreuve du singe (x 0-320, y=-128) : sort de l'écran à gauche.
    { from: [0, -128], to: [320, -128], tip: 'right', thickness: 56 },
    // Branche intermédiaire (x 1856-2048, y=-64) : console sur le tronc.
    { from: [1856, -64], to: [2048, -64], tip: 'both', thickness: 56 },
    // Grande branche haute (x 2176-2944, y=-192) + totem au bout. Fourche : un
    // rameau (décor) au-dessus du passage des pierres.
    { from: [2176, -192], to: [2944, -192], attach: 'left', thickness: 56, forks: [{ at: 60 }] },
    // --- Vide de la cime. Filet (x 3008-3840, y=128) sous tout le vide et la
    // corniche : une chute des lianes y retombe ; 320 px sous la corniche, jamais
    // un raccourci. Il sort de l'écran à droite.
    // Marche (x 2944-3008, y=0) : filet +128, puis +192 = bond du singe. Un rameau
    // du filet (dessiné avant lui : le filet couvre son départ), coupé comme celui
    // de l'élan : marche plate, partie courbe en décor teinté (on la traversait).
    { from: [2990, 0], via: [[3070, 44]], to: [3190, 150], attach: 'right', thickness: 42, tint: 0x6e6878, solid: false },
    { from: [2944, 0], to: [3008, 0], tip: 'both', thickness: 42 },
    { from: [3008, 128], to: [3840, 128], tip: 'left', thickness: 56, forks: [{ at: 420 }] },
    // Corniche de la cime (x 3584-3840, y=-192) : sort de l'écran à droite.
    { from: [3584, -192], to: [3840, -192], tip: 'left', thickness: 56 },
  ],
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
  // Totem du singe, au bout de la grande branche (décision du 2026-10-25 :
  // comme le loup et l'aigle, il s'allume et donne DIRECTEMENT la forme
  // singe ; plus de monde spirituel). Même clé que les autres totems
  // (LevelKit addAbilityShrine) : art `totem_monkey_dim`, puis
  // `totem_monkey_lit` une fois la forme prise. Suite : bulle de Xara et
  // rappel des lianes (script de zone, `racines_singe_eveil`).
  totems: [
    { x: 2860, y: -192, flag: 'hasMonkeyForm', message: 'Forme du singe !' },
  ],
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
    // Bord gauche, deux passages séparés par la corniche : le pied de l'arbre…
    { edge: 'left', from: -64, to: 448, targetScene: 'ForetSombre2Scene', data: { enterId: 'from_racines' } },
    // … et la fente de l'épreuve, sur la corniche. Même côté à l'arrivée : l'épreuve
    // part de son bord gauche (cf. PLAN_DEV : passage à revoir, une porte conviendrait).
    { edge: 'left', from: -576, to: -128, targetScene: 'EpreuveSingeScene', data: { enterId: 'from_racines' } },
    // Au bout de la corniche de la cime : l'arène de Kainati.
    { edge: 'right', from: -576, to: -192, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_racines' } },
  ],
  entries: [
    { id: 'from_foret_sombre', x: 110, y: 400, height: 100, edge: 'left', from: -64, to: 448 },
    { id: 'from_epreuve', x: 150, y: -170, height: 80, edge: 'left', from: -576, to: -128 },
    { id: 'from_arene', x: 3700, y: -230, height: 80, edge: 'right', from: -576, to: -192 },
    // Devant le totem, côté branche : reprise d'une ancienne sauvegarde
    // arrêtée au monde spirituel (qui n'est plus sur le chemin de
    // l'histoire, cf. ZONE_SCRIPTS.monde_spirituel) et sorties de cette zone de test.
    { id: 'totem_singe', x: 2780, y: -230, height: 80 },
  ],
};
