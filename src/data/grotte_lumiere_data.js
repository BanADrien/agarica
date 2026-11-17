// Zone de TEST « grotte lumineuse » (2026-11-17, docs/production/GROTTE_LUMIERE.md) : voir ce
// que l'éclairage par sections (src/utils/LightKit.js) donne en jeu. Rien ici n'est du contenu
// du jeu. Accès : écran « Zones de test » du titre, ou `index.html?zone=GrotteLumiereScene`.
// Logique (lampes, lucioles, soleil) : ZONE_SCRIPTS.grotte_lumiere dans
// src/scenes/GrotteLumiereScene.js.
//
// Une seule zone en deux parties, pour juger le PASSAGE de l'obscurité au plein jour sans
// changement de scène (demande du 2026-11-17) :
//   x 0-1856     la grotte, toute noire : seules les lampes éclairent ;
//                x 64-448    couloir bas, on n'avance qu'à la lueur de Xara ;
//                x 576-1280  salle des champignons (bleu, vert, rose), contre-jour en x 905,
//                            une araignée sous la voûte, un crapaud corrompu ;
//                x 1280-1730 passage des lucioles, lanterne, feu de camp (x 1600) ;
//   x 1720-2000  l'entrée : l'ambiance passe doucement du noir au jour (dégradé en x) ;
//   x 1856-3392  dehors, au soleil (lampe lointaine qui éclaire en volume), un crapaud.
// Grille de 64, surface du sol y 448 (gy 7). Règle de niveaux : chaque colonne de voûte part
// du haut (gy 0), aucune case ne touche une autre par un seul coin. (groundRow : fin EXCLUE.)

// ------------------------------------------------------------------ RÉGLAGES DE LUMIÈRE
// Tout ce qui se règle en essayant. Couleurs 0xRRGGBB ; x, y en px du monde ; `portee` en px du
// monde ; `profondeur` : px devant le plan des sprites (négatif = DERRIÈRE : contre-jour) ;
// `intensite` : 1 = la couleur pleine. Au plus 10 lampes visibles à la fois (limite de Phaser).
const GROTTE_LUMIERE_REGLAGES = {
  // Rendu : paliers de lumière (pixel art) et force du contre-jour (cf. skill eclairage-sections).
  paliers: 4,
  contre: 2.0,
  // Paliers des surfaces à plat (sol, paroi, décors sans carte) : un peu plus que les sprites,
  // sinon chaque lampe dessine un disque à bord dur sur le sol.
  paliersPlat: 6,
  // Ambiance (lumière reçue partout, sans lampe) : la grotte presque noire, le jour dehors, et
  // un passage doux entre x0 et x1 (calculé par pixel : chaque chose prend l'ambiance de
  // l'endroit où elle est, Agarica comprise quand elle avance).
  ambiance: { grotte: 0x0d0b15, dehors: 0x74727f, x0: 1720, x1: 2000 },
  // Distance (px) derrière le plan des personnages : une lampe tout près d'Agarica (8-14 px
  // devant, le bon réglage pour les sprites) est plus loin devant la paroi du fond, et y fait
  // une flaque de lumière assez large. 0 : la paroi ne recevrait qu'une petite tache.
  plans: { paroi: 90, sol: 45, decors: 30 },
  // Teinte de la paroi du fond (sol de second plan ; le jeu l'assombrit à 0x404040 par défaut).
  teinteParoi: 0x8a8494,
  // Soleil : lampe très loin en haut à droite de la vue (comme le soleil peint du ciel) (il suit la caméra : même angle partout),
  // grande profondeur (devant) pour éclairer les volumes de biais. Il n'entre pas dans la
  // grotte : `masque` = de rien en x0 à plein en x1.
  soleil: { couleur: 0xfff0d2, intensite: 0.78, portee: 7000, dx: 700, y: -1100, profondeur: 1100, masque: [1800, 2000] },
  // Les yeux de Xara : une petite lampe faible qui la suit (décalage depuis ses pattes).
  xara: { couleur: 0xc8ffd8, intensite: 1.0, portee: 190, profondeur: 14, dx: 8, dy: -18 },
  // Feu de camp : lampe chaude qui vacille (contraste avec le froid des champignons).
  feu: { couleur: 0xffa04a, intensite: 1.15, portee: 330, profondeur: 14, dy: -26, vacille: 0.16 },
  // Champignons et mousses : une lampe par source, qui pulse doucement (`pulse` : amplitude,
  // `periode` en ms). `prop` : le décor posé (clé `props` plus bas, même x) qui la porte.
  sources: [
    { nom: 'bleu', prop: 'foret_sombre_champignons_lumineux', x: 620, y: 418, couleur: 0x7fc4ff, intensite: 1.3, portee: 260, profondeur: 12, pulse: 0.12, periode: 3200 },
    { nom: 'vert (voûte)', prop: 'decor_mousse_lumineuse_plafond', x: 790, y: 80, couleur: 0xa8ff86, intensite: 1.1, portee: 280, profondeur: 12, pulse: 0.1, periode: 4100 },
    // CONTRE-JOUR : touffe posée contre la paroi du fond, lampe DERRIÈRE le plan d'Agarica
    // (profondeur négative) : debout devant, elle est découpée par un liseré cyan.
    { nom: 'contre-jour', prop: 'foret_sombre_champignons_lumineux', x: 905, y: 372, couleur: 0x6ce8ff, intensite: 1.6, portee: 230, profondeur: -24, pulse: 0.08, periode: 2600 },
    { nom: 'vert (voûte 2)', prop: 'decor_mousse_lumineuse_plafond', x: 1120, y: 80, couleur: 0xa8ff86, intensite: 1.05, portee: 280, profondeur: 12, pulse: 0.1, periode: 3700 },
    { nom: 'rose', prop: 'grand_arbre_champignon_etagere', x: 1235, y: 410, couleur: 0xff9ad0, intensite: 1.25, portee: 250, profondeur: 12, pulse: 0.14, periode: 2900 },
    { nom: 'lanterne', prop: 'grand_arbre_lanterne_lucioles', x: 1385, y: 250, couleur: 0xe0ff8a, intensite: 0.8, portee: 200, profondeur: 12, pulse: 0.18, periode: 1700 },
  ],
  // Lucioles : `nombre` points lumineux qui dérivent dans la zone ; les `lampes` premières sont
  // de vraies lampes (les autres n'éclairent pas : limite de 10 lampes visibles).
  lucioles: { x0: 1290, x1: 1760, y0: 230, y1: 420, nombre: 9, lampes: 2, couleur: 0xe8ff9a, intensite: 0.85, portee: 120, profondeur: 10 },
};

const GROTTE_LUMIERE_DATA = {
  zoneName: 'La grotte lumineuse',
  zoneSub: 'Essai de lumière',
  levelWidth: 3392,
  levelHeight: 540,
  // Ni fond générique, ni sous-bois, ni lucioles d'ambiance : le script pose son fond et ses
  // lumières (cf. GROTTE_LUMIERE_REGLAGES).
  decor: false,
  foregroundPlants: false,
  script: 'grotte_lumiere',
  groundCells: [
    ...groundRow(0, 53, [7, 8]),            // sol, grotte et dehors
    ...groundRow(0, 1, [0, 1, 2, 3, 4, 5, 6]), // fond de la grotte (mur gauche)
    // Voûte : couloir bas (gy 0-3), salle haute (gy 0), passage des lucioles (gy 0-2),
    // puis elle remonte en marches jusqu'à l'entrée (gx 29 : le ciel).
    ...groundRow(1, 7, [0, 1, 2, 3]),
    ...groundRow(7, 8, [0, 1, 2]),
    ...groundRow(8, 9, [0, 1]),
    ...groundRow(9, 20, [0]),
    ...groundRow(20, 21, [0, 1]),
    ...groundRow(21, 27, [0, 1, 2]),
    ...groundRow(27, 28, [0, 1]),
    ...groundRow(28, 29, [0]),
    // Dehors : prairie plate (une butte y montrait le cœur sombre des tuiles, lu comme un
    // trou), puis la falaise du bout.
    ...groundRow(52, 53, [3, 4, 5, 6]),
  ],
  // Paroi du fond de la grotte (second plan, sans collision) : toute la grotte, puis un bord
  // irrégulier à l'entrée, découpé sur le ciel.
  groundBackCells: [
    ...groundRow(1, 29, [0, 1, 2, 3, 4, 5, 6]),
    ...groundRow(29, 30, [2, 3, 4, 5, 6]),
    ...groundRow(30, 31, [4, 5, 6]),
  ],
  playerSpawn: { x: 160, y: 412 },
  props: [
    // Couloir : des pierres, à peine visibles à la lueur de Xara.
    { type: 'grand_arbre_tas_pierres', x: 330, y: 448, scale: 0.22 },
    // Salle des champignons (les sources de GROTTE_LUMIERE_REGLAGES.sources).
    { type: 'foret_sombre_champignons_lumineux', x: 620, y: 448, scale: 0.26 },
    { type: 'decor_mousse_lumineuse_plafond', x: 790, y: 64, scale: 0.3, hang: true },
    { type: 'foret_sombre_champignons_lumineux', x: 905, y: 448, scale: 0.34 },
    { type: 'foret_sombre_rocher_mousse', x: 1010, y: 448, scale: 0.24 },
    { type: 'decor_mousse_lumineuse_plafond', x: 1120, y: 64, scale: 0.3, hang: true },
    { type: 'grand_arbre_champignon_etagere', x: 1235, y: 448, scale: 0.26 },
    // Passage des lucioles : lanterne pendue à la voûte (bas de la voûte : y 192).
    { type: 'grand_arbre_lanterne_lucioles', x: 1385, y: 192, scale: 0.3, hang: true },
    { type: 'grand_arbre_tas_pierres', x: 1700, y: 448, scale: 0.2 },
    // Dehors, au soleil.
    { type: 'foret_flottante_arbre_jeune', x: 2330, y: 448, scale: 0.5 },
    { type: 'foret_flottante_fleurs_hautes', x: 2620, y: 448, scale: 0.3 },
    { type: 'foret_sombre_rocher_mousse', x: 3020, y: 448, scale: 0.28 },
    { type: 'foret_flottante_arbre_jeune', x: 3230, y: 448, scale: 0.42 },
  ],
  campfires: [{ x: 1600, y: 448 }],
  enemies: [
    // Araignée fixe sous la voûte de la salle (inoffensive au contact).
    { type: 'araignee', x: 1040, y: 130 },
    { type: 'crapaud_corrompu', x: 1150, y: 400, patrolMinX: 960, patrolMaxX: 1260 },
    // Dehors : le crapaud (déjà préparé en sections), au soleil.
    { type: 'crapaud', x: 2880, y: 400 },
  ],
  exits: [],
  entries: [],
  helpText: '',
};
