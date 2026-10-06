// Zone « grand_arbre_arene » : arène de Kainati, Roi des Simiens, dans les
// branches du grand arbre (cf. docs/production/PLAN_DEV.md, ligne 5 de la
// progression). Toute la logique du combat est dans src/story/boss_kainati.js
// (ZONE_SCRIPTS.kainati_arene) ; ce fichier ne décrit que le terrain.
//
// Plan (grille 64, surface du sol y=448) :
//   x 0-512     palier d'arrivée (depuis les racines) + feu de camp
//   x 512-1472  l'arène, exactement un écran : caméra figée pendant le combat,
//               rideaux de mousse aux deux bords (créés par le script)
//   x 1472-1920 au-delà du rideau de mousse droit (ouvert après la victoire) :
//               marche + branche haute avec le passage du totem du singe
//               (-> MondeSpirituelScene), puis la route des hauteurs
//               (-> ForetFlottante1Scene). Ces deux sorties ne sont créées
//               qu'après la victoire (cf. kainatiArena.exitsAfterVictory).
const GRAND_ARBRE_ARENE_SURFACE_Y = 448;

const GRAND_ARBRE_ARENE_DATA = {
  levelWidth: 1920,
  levelHeight: 540,
  zoneName: 'Grand arbre — la cime',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 30, [7, 8]), // grosse branche-plancher sur toute la largeur
    ...groundRow(9, 11, [5]),    // branche basse gauche de l'arène (x 576-704)
    ...groundRow(20, 22, [5]),   // branche basse droite de l'arène (x 1280-1408)
    ...groundRow(24, 25, [6]),   // marche vers le passage du totem (x 1536-1600)
    ...groundRow(26, 28, [4]),   // branche haute : passage du totem du singe (x 1664-1792)
  ],
  avoidRanges: [[512, 1472]],
  playerSpawn: { x: 110, y: 412 },
  campfires: [{ x: 300, y: GRAND_ARBRE_ARENE_SURFACE_Y }],
  // Lianes de l'arène (x, y = point d'attache en haut, length vers le bas).
  // Avant la forme singe ce sont des « lianes-tremplins » (rebond, cf.
  // boss_kainati.js) ; Kainati s'y suspend et saute de l'une à l'autre.
  vines: [
    { x: 752, y: -30, length: 280 },
    { x: 912, y: -30, length: 280 },
    { x: 1072, y: -30, length: 280 },
    { x: 1232, y: -30, length: 280 },
  ],
  script: 'kainati_arene',
  // Paramètres du combat lus par ZONE_SCRIPTS.kainati_arene.
  kainatiArena: {
    minX: 512,          // bords de l'arène (rideaux de mousse + caméra figée)
    maxX: 1472,
    // Haut de la HITBOX du sol (tuiles d'herbe aux 3/4 : 16 px sous le haut de
    // l'image), là où Agarica pose les pieds : Kainati, ses pierres et ses
    // ondes flottaient sinon 16 px au-dessus de l'herbe.
    floorY: GRAND_ARBRE_ARENE_SURFACE_Y + 16,
    lockX: 600,         // le combat démarre quand Agarica dépasse ce x
    startVine: 2,       // liane où Kainati attend
    calmX: 1390,        // position de Kainati apaisé (revisite)
    exitsAfterVictory: [
      {
        x: 1728, y: 200, height: 100,
        targetScene: 'MondeSpirituelScene',
        data: { enterId: 'from_arene' },
        portalId: 'portail_totem_singe',
      },
      { x: 1896, targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_arbre' } },
    ],
  },
  exits: [
    { x: 16, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_arene' } },
  ],
  entries: [
    { id: 'from_racines', x: 110, y: 380, height: 140 },
    // Retour du monde spirituel : même porte que la sortie (portalId), pas de rebond.
    { id: 'from_monde_spirituel', x: 1728, y: 200, height: 100, portalId: 'portail_totem_singe' },
    { id: 'from_foret_flottante', x: 1810, y: 380, height: 140 },
  ],
};
