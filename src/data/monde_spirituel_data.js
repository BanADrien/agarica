// Zone « monde_spirituel » : l'arbre d'avant, le monde spirituel du peuple
// singe (acte 1, PLAN_DEV.md). HORS DU CHEMIN DE L'HISTOIRE depuis la
// décision du 2026-10-25 (« pas de phase avec singe ancestral, allume juste
// le totem ») : le totem des racines donne directement la forme singe. Zone
// gardée telle quelle (réversible), ouverte seulement depuis « Zones de
// test » : l'esprit simien ancestral y éprouve Agarica (question), lui donne
// la forme singe, puis la GUIDE de liane en liane au-dessus du vide. Une
// arrivée avec un point d'entrée (ancienne sauvegarde) retombe devant le
// totem des racines. Les deux sorties y ramènent aussi. Logique :
// src/story/acte1_arbre.js (ZONE_SCRIPTS.monde_spirituel + CUTSCENES `esprit_*`).
//
// Plan (grille 64, surface du sol y=448) :
//   x 0-640      clairière d'arrivée (l'esprit attend au bord du vide)
//   x 640-1344   1er vide : 3 lianes (A, B, C)
//   x 1344-1600  îlot (y=384) : point de reprise
//   x 1600-2240  2e vide : 3 lianes (D, E, F)
//   x 2240-2880  l'arbre spirituel ; passage de retour vers le totem (bord droit)
// Une chute dans le vide ramène au dernier point de reprise, sans dégât.
const MONDE_SPIRITUEL_SURFACE_Y = 448;

const MONDE_SPIRITUEL_DATA = {
  levelWidth: 2880,
  levelHeight: 540,
  zoneName: 'Monde spirituel',
  zoneSub: "L'arbre d'avant la mousse",
  background: 'fond_monde_spirituel',
  // Premier plan (touffes du bas, lianes suspendues) réservé à la forêt sombre.
  foregroundPlants: false,
  tileset: 'tuiles_ecorce',
  // Voile éthéré bleu-vert (lumière d'esprit, à l'opposé du violet de la nuit).
  // Pas de vignette (lot Codex n°8, décision H1) : réservée aux zones
  // sombres ; le monde spirituel est lumineux.
  ambient: { tint: 0x6fe3d0, darkness: 0.12, vignette: false },
  // Rendu de cohésion (LookKit, réglé à la capture le 2026-11-08) : sobre et
  // éthéré, à l'opposé de la nuit. Base `jour` : à peine de contraste, carte de
  // couleurs bleu-vert d'esprit (10 %), hautes lumières vers le blanc-cyan ;
  // fond flouté et éclairci dans une brume cyan (celle du voile) au lieu d'être
  // assombri. Lumières discrètes (lanterne, lucioles), ombre de contact légère.
  look: {
    profile: 'jour',
    grade: {
      exposure: 1.04, contrast: 1.0, pivot: 0.3, sat: 1.0,
      map: [0x0c2630, 0x4a8a92, 0xeafffa], mapAmt: 0.1,
      shadowTint: 0x1c3a5a, shadowAmt: 0.02,
      highTint: [0.96, 1.03, 1.03], highAmt: 0.2, ambient: [0.98, 1.0, 1.02],
    },
    overlay: 0.85,
    back: { blur: 1.0, bright: 1.0, sat: 0.95, contrast: 0.95, fog: 0x6fe3d0, fogAmt: 0.07, mist: 0.16, mistBand: [0.5, 0.95] },
    lights: {
      glow: 0.14, propMul: 0.4, raiAlpha: 0.9, haloAlpha: 0.9,
      rules: { lanterne: { intensity: 0.45, glow: 0.15 } },
      fly: { intensity: 0.08, radius: 50, glow: 0.04 },
      self: { intensity: 0.06, radius: 140, color: 0xd8fff6 },
    },
    shadow: { alpha: 0.45 },
  },
  // Agarica y entre seule : Xara attend dans le monde réel.
  xara: false,
  script: 'monde_spirituel',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 10, [7, 8]),    // clairière d'arrivée (x 0-640)
    ...groundRow(21, 25, [6, 7, 8]), // îlot au milieu du vide (x 1344-1600, y=384)
    ...groundRow(35, 45, [7, 8]),   // pied de l'arbre spirituel (x 2240-2880)
    // Blocs d'accroche des lianes (branches de lumière).
    ...groundRow(12, 13, [0]), ...groundRow(18, 19, [0]), ...groundRow(27, 28, [0]), ...groundRow(32, 34, [0]),
  ],
  playerSpawn: { x: 200, y: 412 },
  // Lianes (x, y = attache en haut) : bas à ~130-150 px au-dessus du sol de
  // départ. Une sur deux retirée (demande utilisateur : écart doublé, ~390 px,
  // il faut lâcher avec l'élan) : A et C au-dessus du 1er vide, D et F au-dessus
  // du 2e (B et E retirées). Le guidage de l'esprit suit la même liste.
  // Chaque liane pend sous un bloc (rangée 0, haut de l'écran) : plus
  // d'attache flottante. Écarts réglés pour le balancement limité (~55°) et le
  // lâcher qui compte comme le 2e saut.
  vines: [
    { x: 800, y: 64, length: 246 },  // A (bloc gx 12)
    { x: 1184, y: 64, length: 246 }, // C (bloc gx 18)
    { x: 1760, y: 64, length: 226 }, // D (bloc gx 27)
    { x: 2112, y: 64, length: 226 }, // F (bloc gx 32/33)
  ],
  checkpoints: [
    { x: 420, y: MONDE_SPIRITUEL_SURFACE_Y },
    { x: 1470, y: 384 },
    { x: 2400, y: MONDE_SPIRITUEL_SURFACE_Y }, // là où l'on marche après l'atterrissage
  ],
  // Décors sobres du grand arbre (section `grand_arbre`), loin des lianes et
  // des lanternes : lucioles à l'arrivée, champignons sur l'îlot, autel du
  // peuple singe au pied de l'arbre spirituel.
  props: [
    { type: 'grand_arbre_lanterne_lucioles', x: 120, y: MONDE_SPIRITUEL_SURFACE_Y, scale: 0.26 },
    { type: 'grand_arbre_champignon_etagere', x: 1390, y: 384, scale: 0.24 },
    { type: 'grand_arbre_autel_singe', x: 2700, y: MONDE_SPIRITUEL_SURFACE_Y, scale: 0.3 },
  ],
  fall: { y: 520, mode: 'respawn' },
  // Brume d'esprit au fond des vides : cache le pied des arbres du fond, posés
  // sur la même ligne (LevelKit, clés liquidFloor / backgroundBaseline).
  backgroundBaseline: 500,
  liquidFloor: { y: 486, style: 'brume', color: 0x1d4a5a },
  triggers: [
    { id: 'fin', x: 2420, w: 60, cutscene: 'esprit_fin' },
  ],
  exits: [
    // Le passage derrière l'arbre spirituel : retour au totem des racines.
    { edge: 'right', targetScene: 'GrandArbreRacinesScene', data: { enterId: 'totem_singe' } },
    // Retour possible à tout moment par où l'on est venue (le totem).
    { edge: 'left', targetScene: 'GrandArbreRacinesScene', data: { enterId: 'totem_singe' } },
  ],
  entries: [
    { id: 'from_racines', x: 200, y: 400, height: 100 },
    // Ancien passage depuis l'arène (sauvegardes d'avant la refonte).
    { id: 'from_arene', x: 200, y: 400, height: 100 },
  ],
};
