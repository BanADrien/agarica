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
  tileset: 'tuiles_flottantes',
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
  // Brume du vide au-delà de la falaise (là où part le grand vol).
  liquidFloor: { y: 500, style: 'brume', x1: 2600 },
  // Lointain peint (lot Codex n°8, clé `farLayers`) : la forêt malade au
  // fond du vide, terrain du vol raté vers lequel on s'élance (assombrie par
  // la teinte). Elle se lève en approchant de la falaise (fadeInX) et
  // remplace l'ellipse sombre dessinée que le script n'affiche plus.
  farLayers: [
    { id: 'couche_horizon_malade', y: 395, scale: 0.45, tint: 0x3c4e44, scrollX: 0.3, scrollY: 1, fill: true, fadeInX: [1700, 2500] },
  ],
  campfires: [{ x: 1500, y: 448 }],
  // Décors (`hutte_morgat`) : la hutte elle-même (remplace l'ancien dessin du
  // script, cf. a2DrawHutte), le chaudron où mijote l'antidote, l'atelier.
  // Le panneau du sentier (x 420) reste celui du bosquet (interaction E).
  props: [
    { type: 'hutte_morgat_hutte_morgat', x: 1000, y: 448, scale: 0.6 },
    { type: 'bosquet_signpost', x: 420, y: 448, scale: 0.35 },
    { type: 'hutte_morgat_pot_fleurs', x: 640, y: 448, scale: 0.26 },
    { type: 'hutte_morgat_table_herbes', x: 770, y: 448, scale: 0.3 },
    { type: 'hutte_morgat_chaudron', x: 1290, y: 448, scale: 0.3 },
    { type: 'hutte_morgat_lanterne_papillons', x: 1400, y: 448, scale: 0.24 },
    { type: 'hutte_morgat_sechoir_plantes', x: 1660, y: 448, scale: 0.3 },
    { type: 'hutte_morgat_panier_plantes', x: 1800, y: 448, scale: 0.24 },
    { type: 'hutte_morgat_bocal_papillons', x: 2000, y: 384, scale: 0.22 },        // sur la 1re marche
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
    { id: 'from_clairiere', x: 110, y: 400, height: 128, edge: 'left', to: 448 },
    // Par le trou du vieux sentier (sortie basse de la forêt sombre) : elle tombe
    // du haut de l'écran, à côté du panneau.
    { id: 'from_foret_sombre', x: 420, y: 400, height: 128, edge: 'top', from: 370, to: 470 },
  ],
  exits: [
    { edge: 'left', to: 448, targetScene: 'ClairierePlanteScene', data: { enterId: 'from_hutte' } },
  ],
  script: 'acte2_hutte',
  hutte: { x: 1000, sentierX: 420, rampeX: 2688 },
};
