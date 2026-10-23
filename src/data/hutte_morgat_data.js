// Zone « hutte_morgat » — la hutte de la guérisseuse aux papillons (étape 11
// de PLAN_DEV.md). Logique (hutte dessinée, fleur → répulsif, totem de poche
// remarqué, sentier vers la forêt sombre, rampe d'envol et cinématique du
// crash) : ZONE_SCRIPTS.acte2_hutte dans src/story/acte2.js.
//
// Plan :
//   x 0-1920     sol de la clairière de Morgat ; sentier descendant vers la
//                forêt sombre (panneau, x 420, actif avec le répulsif) ; hutte
//                (x 1000) noyée de papillons, Morgat devant
//   x 1920-2688  la falaise monte en trois marches jusqu'à la rampe d'envol
//   x 2688-4800  le vide au-dessus de la forêt malade : terrain du vol raté
const HUTTE_MORGAT_DATA = {
  zoneName: 'La hutte de Morgat',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  levelWidth: 4800,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 30, [7, 8]),
    ...groundRow(30, 34, [6, 7, 8]),        // marche 1 (surface 384)
    ...groundRow(34, 38, [5, 6, 7, 8]),     // marche 2 (surface 320)
    ...groundRow(38, 42, [4, 5, 6, 7, 8]),  // rampe d'envol (surface 256)
  ],
  avoidRanges: [[800, 1250]],
  playerSpawn: { x: 110, y: 412 },
  fall: { y: 600, mode: 'hurt' },
  campfires: [{ x: 1500, y: 448 }],
  props: [
    { type: 'bosquet_signpost', x: 420, y: 448, scale: 0.35 },
    { type: 'bosquet_bush_flowering', x: 640, y: 448, scale: 0.3 },
    { type: 'bosquet_barrels', x: 1290, y: 448, scale: 0.3 },
    { type: 'bosquet_bush_flowering', x: 1760, y: 448, scale: 0.3 },
  ],
  npcs: [
    {
      id: 'morgat', x: 1170, facing: 'left',
      talk: [
        { forbids: { item: 'repulsif' }, talk: 'morgat_rencontre' },
        { talk: 'morgat_apres' },
      ],
    },
  ],
  animals: [
    { type: 'papillons', x: 1000, y: 300, count: 10, w: 260 },
    { type: 'papillons', x: 700, y: 360, count: 4, w: 120 },
    { type: 'papillons', x: 1350, y: 330, count: 5, w: 140 },
    { type: 'papillons', x: 2300, y: 250, count: 3, w: 100 },
  ],
  triggers: [
    { id: 'arrivee', x: 520, w: 64, cutscene: 'hutte_arrivee' },
    // Rampe d'envol : avec le répulsif, c'est le grand départ ; sinon Xara retient Agarica.
    { id: 'crash', x: 2600, w: 80, cutscene: 'crash', requires: { item: 'repulsif' } },
    { id: 'pas_encore', x: 2560, w: 64, cutscene: 'hutte_pas_encore', once: false, forbids: { item: 'repulsif' } },
  ],
  entries: [
    { id: 'from_clairiere', x: 110, y: 400, height: 128 },
    { id: 'from_foret_sombre', x: 420, y: 400, height: 128 },
  ],
  exits: [
    { x: 16, y: 400, height: 128, targetScene: 'ClairierePlanteScene', data: { enterId: 'from_hutte' } },
  ],
  script: 'acte2_hutte',
  hutte: { x: 1000, sentierX: 420, rampeX: 2688 },
};
