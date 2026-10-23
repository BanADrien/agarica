// Zone « monde_spirituel » : l'arbre d'avant, le monde spirituel de Kainati
// (acte 1, zone 6 de PLAN_DEV.md). On y arrive par le passage du totem du
// singe, dans l'arène, après la victoire. L'esprit de Kainati donne la forme
// singe dès l'arrivée, puis GUIDE Agarica de liane en liane au-dessus du vide
// (« suis mes mouvements »). Logique : src/story/acte1_arbre.js
// (ZONE_SCRIPTS.monde_spirituel + CUTSCENES `esprit_*`).
//
// Plan (grille 64, surface du sol y=448) :
//   x 0-640      clairière d'arrivée (l'esprit attend au bord du vide)
//   x 640-1344   1er vide : 3 lianes (A, B, C)
//   x 1344-1600  îlot (y=384) : point de reprise
//   x 1600-2240  2e vide : 3 lianes (D, E, F)
//   x 2240-2880  l'arbre spirituel ; passage de retour vers l'arène (bord droit)
// Une chute dans le vide ramène au dernier point de reprise, sans dégât.
const MONDE_SPIRITUEL_SURFACE_Y = 448;

const MONDE_SPIRITUEL_DATA = {
  levelWidth: 2880,
  levelHeight: 540,
  zoneName: 'Monde spirituel',
  zoneSub: "L'arbre d'avant la mousse",
  background: 'fond_monde_spirituel',
  tileset: 'tuiles_ecorce',
  // Voile éthéré bleu-vert (lumière d'esprit, à l'opposé du violet de la nuit).
  ambient: { tint: 0x6fe3d0, darkness: 0.12 },
  // Agarica y entre seule : Xara attend dans le monde réel.
  xara: false,
  script: 'monde_spirituel',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 10, [7, 8]),    // clairière d'arrivée (x 0-640)
    ...groundRow(21, 25, [6, 7, 8]), // îlot au milieu du vide (x 1344-1600, y=384)
    ...groundRow(35, 45, [7, 8]),   // pied de l'arbre spirituel (x 2240-2880)
  ],
  playerSpawn: { x: 200, y: 412 },
  // Lianes (x, y = attache en haut) : bas à ~130-150 px au-dessus du sol de
  // départ, ~70-100 px les unes des autres en hauteur pour garder l'élan.
  vines: [
    { x: 770, y: 40, length: 270 },  // A
    { x: 965, y: 20, length: 280 },  // B
    { x: 1160, y: 40, length: 270 }, // C
    { x: 1730, y: 10, length: 270 }, // D
    { x: 1925, y: 0, length: 280 },  // E
    { x: 2115, y: 20, length: 270 }, // F
  ],
  checkpoints: [
    { x: 420, y: MONDE_SPIRITUEL_SURFACE_Y },
    { x: 1470, y: 384 },
    { x: 2400, y: MONDE_SPIRITUEL_SURFACE_Y }, // là où l'on marche après l'atterrissage
  ],
  fall: { y: 520, mode: 'respawn' },
  triggers: [
    { id: 'fin', x: 2420, w: 60, cutscene: 'esprit_fin' },
  ],
  exits: [
    // Le passage derrière l'arbre spirituel : retour à la cime (porte du totem).
    { x: 2864, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_monde_spirituel' } },
    // Retour possible à tout moment par où l'on est venue.
    { x: 16, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_monde_spirituel' } },
  ],
  entries: [
    { id: 'from_arene', x: 200, y: 400, height: 100 },
  ],
};
