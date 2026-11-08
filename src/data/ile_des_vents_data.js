// Zone « ile_des_vents » — L'île des vents (vague 3, lot B).
// SQUELETTE du pré-lot (2026-11-08) : îlot d'arrivée I0 et courant C0,
// passages DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu
// provisoire copié sur la voisine (îles flottantes). Le lot B construit la
// zone (§ 2.5) en gardant les ids des entrées / sorties et leurs bornes.
//
// Passages :
//   bas x 340-460   on y monte en aigle par le courant des îles flottantes
//                   (sortie haute x 690-790 là-bas) ; le courant C0 prolonge
//                   le leur jusqu'à I0
//   tout le bas     une chute ramène SANS DÉGÂT au-dessus de l'îlot I1 des îles
const ILE_DES_VENTS_DATA = {
  zoneName: "L'île des vents",
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  foregroundPlants: false,
  tileset: 'tuiles_flottantes',
  // Provisoire (copie des îles flottantes) : réglé par le lot B à la capture.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.04, sat: 0.85, light: 1.03, contrast: 0.95 } } },
  },
  levelWidth: 2560,
  levelTop: -1200,
  levelHeight: 540,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  skyReveal: { start: -1, end: 0, leaves: false },
  largeTrees: false,
  liquidFloor: { y: 520, style: 'brume' },
  groundCells: [
    ...groundRow(8, 13, [2]),        // I0 (x 512-832, surface 128)
  ],
  // C0 : prolonge le courant d'I1-I2 des îles flottantes ; l'aigle monte, puis
  // plane jusqu'à I0.
  // 240 px de large (et non 80, valeur du plan) : le courant n'agit que si le
  // CENTRE d'Agarica est dedans ; étroit, l'aigle en sortait aussitôt.
  windCurrents: [{ x: 280, y: 0, w: 240, h: 540, force: 330 }],
  playerSpawn: { x: 600, y: 80 },
  entries: [
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_ff2', x: 600, y: 80, height: 100 },
  ],
  exits: [
    // Tout le bord bas : retour aux îles flottantes (au-dessus d'I1), sans dégât.
    { edge: 'bottom', targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_ile_des_vents' } },
  ],
};
