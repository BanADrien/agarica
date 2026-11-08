// Zone « grand_arbre_arene » : arène de Kainati, Roi des Simiens, dans les
// branches du grand arbre (cf. docs/production/PLAN_DEV.md, progression).
// Toute la logique du combat est dans src/story/boss_kainati.js
// (ZONE_SCRIPTS.kainati_arene) ; ce fichier ne décrit que le terrain.
// On n'y arrive QUE par les lianes de la cime (racines, forme singe).
//
// Plan (grille 64, surface du sol y=448) :
//   x 0-512     palier d'arrivée (depuis les racines) + feu de camp
//   x 512-1472  l'arène, exactement un écran : caméra figée pendant le combat,
//               rideaux de mousse aux deux bords (créés par le script) ;
//               grand tronc au milieu, juste derrière le combat, d'où partent les
//               2 branches hautes (rangée 0) qui portent les 2 lianes. Plus de
//               branches basses : sous les grandes attaques, seul abri = une liane.
//   x 1472-1920 au-delà du rideau droit (ouvert après la victoire) : la
//               route des hauteurs (-> ForetFlottante1Scene, créée après la victoire).
//               Vague 3 : des traces du loup y montent vers une plateforme
//               cachée, puis une branche plate (x 1600-1792, surface 128) sous
//               la sortie haute vers la cime cachée (loup qui révèle + second saut).
const GRAND_ARBRE_ARENE_SURFACE_Y = 448;

const GRAND_ARBRE_ARENE_DATA = {
  levelWidth: 1920,
  levelHeight: 540,
  zoneName: 'Grand arbre — la cime',
  // Même écorce et même fond que les racines : on est dans les branches du grand arbre.
  background: 'fond_grand_arbre',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_ecorce',
  // Rendu de cohésion (LookKit, réglé à la capture le 2026-11-08) : celui des
  // racines (même arbre : tronc et branches au contraste adouci, fond reculé),
  // mais la carte de couleurs presque coupée (4 % au lieu de 10 %), saturation
  // pleine : les bandes d'alerte de Kainati (orange = fracas, vert = rugissement,
  // beige = balayage), la vague de mousse et les rochers gardent leur couleur
  // d'origine (saturation de la bande orange 0,29 contre 0,31 sans le rendu).
  // Pas de voile `ambient` dans l'arène : `overlay` est sans effet ici.
  look: {
    profile: 'nuit',
    grade: { exposure: 1.05, contrast: 1.06, pivot: 0.2, sat: 1.0, mapAmt: 0.04, shadowAmt: 0.02, highAmt: 0.1 },
    back: { sat: 0.78, bright: 0.84, fog: 0x28183c, fogAmt: 0.1, mist: 0.14 },
  },
  // Pas de grands arbres du fond : dans le tronc, leur feuillage brouille le
  // combat, et le fond montre déjà la masse de l'arbre.
  largeTrees: false,
  // Le grand tronc, au milieu de l'arène et juste derrière le combat : un peu
  // assombri pour que Kainati et ses bandes d'alerte restent lisibles devant.
  trunks: [
    { x: 992, top: -120, bottom: GRAND_ARBRE_ARENE_SURFACE_Y, scale: 0.36, base: true, tint: 0x94899f },
  ],
  // Mêmes cases de collision qu'avec les anciennes tuiles (rangées 7-8 sur toute
  // la largeur, rangée 0 de x 512 à 1472) : seul le dessin change. Les deux
  // branches hautes partent du tronc ; leur dessous passe PAR l'attache des
  // lianes (y=64, x 792 et 1192), à 2 px près : ni vide, ni liane sur l'écorce.
  branches: [
    {
      from: [858, -24], via: [[792, -2]], to: [508, 30], attach: 'right', thickness: 66, taper: [0.8, 1],
      cells: groundRow(8, 15, [0]),
    },
    {
      from: [1126, -24], via: [[1192, -2]], to: [1476, 30], attach: 'left', thickness: 66, taper: [1, 0.8],
      cells: groundRow(15, 23, [0]),
    },
    // L'énorme branche-plancher, qui sort de l'écran des deux côtés. Sa fourche
    // (décor, sans collision), passé le rideau droit : le combat reste dégagé.
    { from: [0, GRAND_ARBRE_ARENE_SURFACE_Y], to: [1920, GRAND_ARBRE_ARENE_SURFACE_Y], rows: 2, thickness: 100, attach: 'none', forks: [{ at: 1480 }] },
    // Vague 3 : branche plate sous la sortie haute vers la cime cachée
    // (x 1600-1792, surface 128) ; on y monte depuis la plateforme cachée.
    { from: [1600, 128], to: [1792, 128], tip: 'both', thickness: 56 },
  ],
  // Vague 3 : plateforme cachée révélée par le loup (pistes ci-dessous), puis
  // second saut (+192) ; de là, un saut simple jusqu'à la branche (+128) et un
  // autre passe le bord haut. gy 4 et gx 23-24 (et non gy 5, gx 24 du plan) :
  // à gy 5, révélée, elle laissait 64 px sous elle sur la route de la forêt
  // flottante (Agarica en fait 83 : elle butait dedans) ; en gx 24-25, la
  // branche, 64 px au-dessus, cognait la tête. Le rideau droit est à x 1472 :
  // rien à révéler pendant le combat.
  hiddenPlatforms: [
    { gx: 23, gy: 4, w: 2 },
  ],
  tracks: [
    { x: 1490, y: GRAND_ARBRE_ARENE_SURFACE_Y, w: 190 },
  ],
  avoidRanges: [[512, 1472]],
  // Pas de sous-bois au sol de l'arène : ses plantes se confondaient avec les
  // éclats de l'onde de choc et des rochers (LevelKit, addUndergrowth).
  undergrowthAvoid: [[512, 1472]],
  playerSpawn: { x: 110, y: 412 },
  campfires: [{ x: 300, y: GRAND_ARBRE_ARENE_SURFACE_Y }],
  // Décors (`grand_arbre`) hors de l'arène seulement : le combat (bandes
  // d'alerte, ondes, mousse, rochers) doit rester lisible entre x 512 et 1472.
  props: [
    { type: 'grand_arbre_statue_simien', x: 150, y: GRAND_ARBRE_ARENE_SURFACE_Y, scale: 0.36 },
    { type: 'grand_arbre_tas_pierres', x: 430, y: GRAND_ARBRE_ARENE_SURFACE_Y, scale: 0.26 },
    { type: 'grand_arbre_champignon_etagere', x: 1560, y: GRAND_ARBRE_ARENE_SURFACE_Y, scale: 0.28 },
    { type: 'grand_arbre_nid_singe', x: 1760, y: GRAND_ARBRE_ARENE_SURFACE_Y, scale: 0.26 },
  ],
  // Lianes d'Agarica (x, y = attache sous les branches hautes, length vers le bas) :
  // bas à y=234, à portée du double saut qui donne la forme singe ;
  // suspendue, ses pieds restent ≥ 156 px au-dessus du sol : au-dessus de la
  // charge et de la bande où blessent les grandes attaques (onde, mousse,
  // rochers -- ceux qui tombent de la canopée ne blessent qu'une fois au ras
  // du sol). Seules les pierres (lancées, ou tombées sur sa liane en phase 2)
  // l'atteignent là-haut. Son contact ne monte pas à plus de 140 px du sol
  // (KAINATI_CONTACT_MAX_H) : il n'atteint jamais une Agarica suspendue.
  // 2 lianes seulement (demande utilisateur du 2026-10-25), symétriques
  // (milieu x 992) : 792 et 1192 laissent au plus ~200 px à parcourir à pied
  // depuis n'importe quel point de l'arène (rideaux, pied de Kainati, milieu)
  // -- les télégraphes de Kainati.js (KAINATI_TIMINGS) en dépendent. Loin de
  // ses postes (617 et 1367, d'où partent ses attaques et où tombent les
  // pierres de l'éboulement) ; sonné après une charge, il rebondit à 817 ou
  // 1167, juste sous une liane : on s'y laisse tomber pour frapper.
  vines: [
    { x: 792, y: 64, length: 170 },
    { x: 1192, y: 64, length: 170 },
  ],
  script: 'kainati_arene',
  // Paramètres du combat lus par ZONE_SCRIPTS.kainati_arene.
  kainatiArena: {
    minX: 512,          // bords de l'arène (rideaux de mousse + caméra figée)
    maxX: 1472,
    // Haut de la HITBOX du sol, là où Agarica pose les pieds (cf.
    // GROUND_STAND_SINK) : Kainati et ses dangers au ras de l'herbe.
    floorY: GRAND_ARBRE_ARENE_SURFACE_Y + GROUND_STAND_SINK,
    ceilingY: 0,        // haut de la canopée (pierres et cailloux qui en tombent à y+66)
    lockX: 600,         // le combat démarre quand Agarica dépasse ce x
    spotInset: 105,     // postes de Kainati : minX+105 et maxX-105 (il charge de l'un à l'autre)
    recoil: 200,        // rebond après le fracas contre le rideau : sonné à 817 / 1167, sous les lianes, puis retour au poste
    calmX: 1300,        // Kainati apaisé (revisite, si sa place n'a pas été mémorisée)
    exitsAfterVictory: [
      { edge: 'right', to: 448, targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_arbre' } },
      // Vague 3 : au-dessus de la branche des traces -> la cime cachée.
      { edge: 'top', from: 1600, to: 1728, targetScene: 'CimeCacheeScene', data: { enterId: 'from_arene' } },
    ],
  },
  // Filet (ancienne sauvegarde sans la forme singe, démarrage de test) : la
  // route des hauteurs l'exige -- Xara renvoie vers le totem des racines.
  triggers: [
    { id: 'sans_singe', x: 1850, w: 40, once: false, requires: { kainatiDefeated: true }, forbids: { hasMonkeyForm: true }, cutscene: 'arene_sans_singe' },
    // Vague 3 : les traces qui montent (bulle de Xara, après la victoire).
    { id: 'v3_traces', x: 1540, y: 400, w: 60, h: 120, requires: { kainatiDefeated: true }, cutscene: 'v3_arene_traces' },
  ],
  exits: [
    { edge: 'left', to: 448, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_arene' } },
  ],
  entries: [
    { id: 'from_racines', x: 110, y: 380, height: 140, edge: 'left', to: 448 },
    { id: 'from_foret_flottante', x: 1810, y: 380, height: 140, edge: 'right', to: 448 },
    // Ancien passage du totem (sauvegardes d'avant la refonte) : au palier.
    { id: 'from_monde_spirituel', x: 110, y: 380, height: 140 },
    // Vague 3 : retour de la cime cachée, sur la branche des traces.
    { id: 'from_cime', x: 1664, y: 64, height: 100, edge: 'top', from: 1600, to: 1728 },
  ],
};
