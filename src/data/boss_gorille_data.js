// Arène du boss Gorille (cf. BossGorilleScene.js / BossGorille.js) : une
// salle plate et large, sans fosse ni toile, pour que le combat se lise
// uniquement dans les patterns du boss (charge / frappe au sol / saut-fracas)
// et pas dans le terrain. Même format que les autres zones (cf.
// zone1_data.js), donc ré-éditable depuis l'éditeur comme n'importe quelle
// autre.
//
// Rien ne relie encore cette arène au reste du jeu : elle sert d'abord à
// tester le boss, accessible directement par `index.html?zone=boss_gorille`
// (cf. BootScene.js). Pour l'intégrer au parcours, poser un portail depuis
// une autre zone dans l'éditeur (écran "Zones").
const BOSS_GORILLE_SURFACE_Y = 448;
// 28 cases de 64px = 1792px de large : le boss (~140px à l'écran) a la place
// de charger sur toute la longueur sans que le joueur soit acculé d'emblée.
const BOSS_GORILLE_WIDTH = 28 * GROUND_TILE_SIZE;

const BOSS_GORILLE_DATA = {
  levelWidth: BOSS_GORILLE_WIDTH,
  levelHeight: 540,
  groundCells: [
    // Deux rangées pleines (surface + remplissage), aucun trou : cf.
    // groundRow dans LevelKit.js.
    ...groundRow(0, 28, [7, 8]),
  ],
  playerSpawn: { x: 110, y: BOSS_GORILLE_SURFACE_Y - 40 },
  enemies: [
    {
      type: 'gorille',
      // Spawn NETTEMENT au-dessus du sol : le corps physique du boss tombe
      // sur la surface au premier update (même précaution que pour les
      // autres sprites à grand canvas partagé -- posé pile sur la ligne de
      // sol, un corps peut se retrouver coincé DANS la tuile).
      x: 1400,
      y: BOSS_GORILLE_SURFACE_Y - 60,
      // Murs d'arène et non patrouille (cf. BossGorille.js) : toute la salle,
      // moins une marge d'une case de chaque côté.
      patrolMinX: 120,
      patrolMaxX: BOSS_GORILLE_WIDTH - 120,
    },
  ],
  webs: [],
  water: [],
  totems: [],
  props: [],
  campfires: [],
  exits: [],
  helpText: 'Le Gorille de pierre garde le passage... K/clic gauche : attaque',
};
