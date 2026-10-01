// Zone « bosquet_retour » — retour au bosquet d'Émeraude, fin de la démo
// (étape 16 de PLAN_DEV.md). Toute la scène (Galter et le chef, Amanite qui
// part avec un fragment de l'idole, le silence de Xara, les trois bébés
// cochons) est la cinématique `bosquet_retour` de src/story/acte2.js
// (ZONE_SCRIPTS.acte2_bosquet_retour), qui pose `demoFinished` → EndScreenScene.
//
// Plan : Agarica arrive par la gauche (chemin de la forêt) ; habitants au
// centre ; le chef et Amanite devant l'autel de l'idole (x ~1560).
const BOSQUET_RETOUR_DATA = {
  zoneName: "Bosquet d'Émeraude",
  zoneSub: 'Le retour',
  background: 'fond_bosquet',
  levelWidth: 1920,
  levelHeight: 540,
  groundCells: [...groundRow(0, 30, [7, 8])],
  avoidRanges: [[1450, 1680]],
  playerSpawn: { x: 110, y: 412 },
  props: [
    { type: 'bosquet_lamp_post', x: 300, y: 448, scale: 0.35 },
    { type: 'bosquet_fence', x: 470, y: 448, scale: 0.3 },
    { type: 'bosquet_well', x: 760, y: 448, scale: 0.35 },
    { type: 'bosquet_banner_tree', x: 1010, y: 448, scale: 0.4 },
    { type: 'bosquet_bench', x: 1180, y: 448, scale: 0.3 },
    { type: 'bosquet_standing_stone', x: 1560, y: 448, scale: 0.35 },
    { type: 'bosquet_lamp_post', x: 1760, y: 448, scale: 0.35 },
  ],
  npcs: [
    { id: 'habitant_garde', x: 690, facing: 'left', talk: 'bosquet_retour_garde' },
    { id: 'habitant_porteur', x: 880, facing: 'left', talk: 'bosquet_retour_porteur' },
    { id: 'habitant_druide', x: 1080, facing: 'left', talk: 'bosquet_retour_druide' },
    { id: 'pere_chef', x: 1300, facing: 'left', talk: 'bosquet_retour_chef' },
    { id: 'amanite', x: 1460, facing: 'left', lookAtPlayer: false, forbids: { demoFinished: true } },
  ],
  animals: [{ type: 'cochons', x: 520, y: 448, w: 200 }],
  triggers: [
    // Revisite après la fin : le bord droit relance l'écran de fin.
    { id: 'fin', x: 1880, w: 64, cutscene: 'bosquet_retour_revoir_fin', once: false, requires: { demoFinished: true } },
  ],
  entries: [
    { id: 'from_arene', x: 110, y: 400, height: 128 },
  ],
  exits: [],
  script: 'acte2_bosquet_retour',
};
