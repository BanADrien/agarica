// Zone « foret_flottante_1 » — le chemin des hauteurs (étape 8 de PLAN_DEV.md).
// Logique (rencontre de Galter, duel comique, carte, brume qui se déchire) :
// ZONE_SCRIPTS.acte2_ff1 dans src/story/acte2.js.
//
// Plan (grille 64, surface d'une rangée gy = 64*gy, pieds d'Agarica +16) :
//   x 0-1600     grosse branche d'arrivée depuis le grand arbre + camp de Galter
//                (feu de camp, duel entre x 640 et 1600)
//   x 1600-2176  fin de la branche ; corniche P1 (gy 4, +3 rangées) : il faut
//                le double saut — Galter, lui, n'y arrive pas
//   x 2240-3584  branches suspendues au-dessus du vide (chute = 1 cœur),
//                corbeaux, courant d'air encore inutilisable, belvédère P5
//                d'où l'on voit le jour, sortie vers les îles flottantes.
// Sauts : simple ≈ 172 px (2 rangées), double de base ≈ 240 px (3 rangées).
const FORET_FLOTTANTE_1_DATA = {
  zoneName: 'Le chemin des hauteurs',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  tileset: 'tuiles_ecorce',
  levelWidth: 3584,
  levelHeight: 540,
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 34, [7, 8]),   // branche maîtresse (x 0-2176)
    ...groundRow(30, 33, [4]),     // P1 : la corniche de Galter (x 1920-2112, surface 256)
    ...groundRow(35, 38, [3]),     // P2 (x 2240-2432, surface 192)
    ...groundRow(40, 42, [5]),     // P3 (x 2560-2688, surface 320)
    ...groundRow(43, 46, [3]),     // P4 (x 2752-2944, surface 192)
    ...groundRow(47, 56, [2]),     // P5 belvédère (x 3008-3584, surface 128)
  ],
  avoidRanges: [[2176, 3584]],
  playerSpawn: { x: 110, y: 412 },
  fall: { y: 600, mode: 'hurt' },
  campfires: [{ x: 820, y: 448 }],
  // Points de reprise (mort = retour ici, pas au tout début de la zone) :
  // sur la corniche de Galter et à l'entrée du belvédère, après les corbeaux.
  checkpoints: [{ x: 2050, y: 256 }, { x: 3060, y: 128 }],
  props: [
    { type: 'bosquet_signpost', x: 600, y: 448, scale: 0.35 },
    { type: 'bosquet_log_pile', x: 700, y: 448, scale: 0.35 },
    { type: 'bosquet_crates', x: 1000, y: 448, scale: 0.3 },
    { type: 'bosquet_tree_stump', x: 1500, y: 448, scale: 0.35 },
    { type: 'bosquet_standing_stone', x: 3400, y: 128, scale: 0.3 },
  ],
  npcs: [
    // Avant le duel, Galter n'a rien à dire (le script lance la rencontre).
    { id: 'galter', x: 1180, facing: 'left', talk: [{ requires: { galterMet: true }, talk: 'galter_camp' }] },
    { id: 'clak', x: 1240, facing: 'left', talk: [{ requires: { galterMet: true }, talk: 'clak_camp' }] },
  ],
  triggers: [
    { id: 'intro', x: 330, w: 64, cutscene: 'ff1_intro' },
    { id: 'vue', x: 3200, w: 64, cutscene: 'ff1_vue' },
  ],
  enemies: [
    { type: 'corbeau', x: 2620, y: 110, patrolMinX: 2450, patrolMaxX: 2800, diveDepth: 200 },
    { type: 'corbeau', x: 2900, y: 70, patrolMinX: 2760, patrolMaxX: 3050, diveDepth: 160 },
    { type: 'mousse_creature', x: 3330, y: 100, patrolMinX: 3180, patrolMaxX: 3450 },
  ],
  // Visible mais inutilisable sans l'aigle (il n'agit que sur le plané) : on le
  // remarque ici, on s'en sert dans les îles flottantes.
  windCurrents: [{ x: 2470, y: 60, w: 70, h: 480, force: 300 }],
  entries: [
    { id: 'from_arbre', x: 110, y: 400, height: 128 },
    { id: 'from_ff2', x: 3490, y: 70, height: 120 },
  ],
  exits: [
    { x: 16, y: 400, height: 128, targetScene: 'GrandArbreAreneScene', data: { enterId: 'from_foret_flottante' } },
    { x: 3568, y: 70, height: 140, targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_ff1' } },
  ],
  script: 'acte2_ff1',
};
