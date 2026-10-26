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
//               canopée (rangée 0) d'où pendent 2 lianes. Plus de branches
//               basses : sous les grandes attaques, seul abri = une liane.
//   x 1472-1920 au-delà du rideau droit (ouvert après la victoire) : la
//               route des hauteurs (-> ForetFlottante1Scene, créée après la victoire).
const GRAND_ARBRE_ARENE_SURFACE_Y = 448;

const GRAND_ARBRE_ARENE_DATA = {
  levelWidth: 1920,
  levelHeight: 540,
  zoneName: 'Grand arbre — la cime',
  // Même écorce et même fond que les racines : on est dans les branches du grand arbre.
  background: 'fond_grand_arbre',
  tileset: 'tuiles_ecorce',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 30, [7, 8]), // grosse branche-plancher sur toute la largeur
    // Canopée au-dessus de l'arène (x 512-1472, y 0-64) : les lianes pendent dessous.
    ...groundRow(8, 23, [0]),
  ],
  avoidRanges: [[512, 1472]],
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
  // Lianes d'Agarica (x, y = attache sous la canopée, length vers le bas) :
  // bas à y=234 -- un saut simple les attrape (mains à ~218 au sommet) ;
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
      { x: 1896, targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_arbre' } },
    ],
  },
  // Filet (ancienne sauvegarde sans la forme singe, démarrage de test) : la
  // route des hauteurs l'exige -- Xara renvoie vers le totem des racines.
  triggers: [
    { id: 'sans_singe', x: 1850, w: 40, once: false, requires: { kainatiDefeated: true }, forbids: { hasMonkeyForm: true }, cutscene: 'arene_sans_singe' },
  ],
  exits: [
    { x: 16, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_arene' } },
  ],
  entries: [
    { id: 'from_racines', x: 110, y: 380, height: 140 },
    { id: 'from_foret_flottante', x: 1810, y: 380, height: 140 },
    // Ancien passage du totem (sauvegardes d'avant la refonte) : au palier.
    { id: 'from_monde_spirituel', x: 110, y: 380, height: 140 },
  ],
};
