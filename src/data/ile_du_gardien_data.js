// Zone « ile_du_gardien » — L'île du gardien (vague 3, lot B).
// SQUELETTE du pré-lot (2026-11-08) : île d'arrivée et courant C0, passages
// DÉFINITIFS (docs/production/VAGUE3_DESIGN.md § 1.3), rendu provisoire copié
// sur la voisine (chemin des hauteurs). Le lot B construit la zone (§ 2.6) en
// gardant les ids des entrées / sorties et leurs bornes.
//
// Passages :
//   bas x 1740-1860  on y monte en aigle par le courant du belvédère du chemin
//                    des hauteurs (sortie haute x 3390-3510 là-bas)
//   tout le bas      une chute ramène SANS DÉGÂT sur le belvédère
// L'île d'arrivée laisse une fente au droit du passage (x 1728-1856) : pleine,
// elle arrêtait l'aigle qui monte (à revoir par le lot B).
const ILE_DU_GARDIEN_DATA = {
  zoneName: "L'île du gardien",
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  foregroundPlants: false,
  tileset: 'tuiles_flottantes',
  // Provisoire (copie du chemin des hauteurs) : réglé par le lot B à la capture.
  look: {
    profile: 'jour',
    grade: { sat: 1.0, contrast: 1.05, mapAmt: 0.05, highAmt: 0.12 },
    back: { blur: 0.8, bright: 1.0, sat: 0.95, contrast: 1.0, fog: 0x9fc4e8, fogAmt: 0.03, mist: 0.06, mistBand: [0.55, 1.0] },
    tiles: { grade: { warm: { hueAmt: 0.1, sat: 0.8, light: 1.0, contrast: 0.92 } } },
  },
  levelWidth: 2240,
  levelTop: -400,
  levelHeight: 540,
  camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 },
  skyReveal: { start: -1, end: 0, leaves: false },
  largeTrees: false,
  liquidFloor: { y: 520, style: 'brume' },
  groundCells: [
    ...groundRow(25, 27, [3]),       // île d'arrivée, partie gauche (x 1600-1728, surface 192)
    ...groundRow(29, 35, [3]),       // île d'arrivée, partie droite (x 1856-2240)
  ],
  // C0 : 240 px de large (et non 60, valeur du plan) : le courant n'agit que si
  // le CENTRE d'Agarica est dedans ; à 60 px, l'aigle en sortait aussitôt.
  windCurrents: [{ x: 1680, y: 0, w: 240, h: 540, force: 330 }],
  playerSpawn: { x: 1950, y: 150 },
  entries: [
    // Point écrit sur l'île (x 1800 du plan : au-dessus de la fente du courant).
    // Entrée par le bas = point posé à côté du trou (sans `edge`) : mesuré le
    // 2026-11-08, l'arrivée « on surgit du trou » ne pousse pas vers la lèvre si
    // aucune touche n'est tenue, Agarica retombait dans le trou (aller-retour).
    { id: 'from_ff1', x: 1950, y: 150, height: 100 },
  ],
  exits: [
    // Tout le bord bas : retour au belvédère du chemin des hauteurs, sans dégât.
    { edge: 'bottom', targetScene: 'ForetFlottante1Scene', data: { enterId: 'from_ile_du_gardien' } },
  ],
};
