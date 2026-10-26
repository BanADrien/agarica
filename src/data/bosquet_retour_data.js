// Zone « bosquet_retour » — retour au bosquet d'Émeraude, fin de la démo
// (étape 16 de PLAN_DEV.md). Toute la scène (Geralt et le chef, Amanite qui
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
  // L'aube sur l'autel (lot Codex n°8, clé `lights`, H15) : écho du clair de
  // lune de l'ouverture (bosquet_data.js), même rai, teinte chaude. Bas posé
  // sur le sol (y 448), derrière les personnages.
  lights: [
    { id: 'fx_rai_lumiere', x: 1560, y: 448, w: 130, h: 380, tint: 0xfff2d8, alpha: 0.32 },
  ],
  // Bâtiments du village d'abord (derrière les autres décors et les
  // habitants), aux mêmes échelles que dans le bosquet de l'acte 1.
  props: [
    { type: 'bosquet_hutte_mousse', x: 200, y: 448, scale: 0.7 },
    { type: 'bosquet_hutte_paille', x: 610, y: 448, scale: 0.62 },
    { type: 'bosquet_tente', x: 1100, y: 448, scale: 0.55 },
    { type: 'bosquet_cottage', x: 1330, y: 448, scale: 0.8 },
    { type: 'bosquet_lamp_post', x: 300, y: 448, scale: 0.5 },
    { type: 'bosquet_fence', x: 470, y: 448, scale: 0.45 },
    { type: 'bosquet_well', x: 760, y: 448, scale: 0.55 },
    { type: 'bosquet_banner_tree', x: 1010, y: 448, scale: 0.55 },
    { type: 'bosquet_bench', x: 1180, y: 448, scale: 0.5 },
    // L'autel de l'idole, le même qu'au sanctuaire du bosquet (l'idole est posée
    // sur son haut par le script, cf. a2DrawIdol) ; la pierre levée pointue
    // d'avant laissait l'idole flotter 50 px au-dessus de sa pointe.
    { type: 'bosquet_antler_totem', x: 1560, y: 448, scale: 0.55 },
    { type: 'bosquet_lamp_post', x: 1760, y: 448, scale: 0.5 },
    // La mousse au retour (lot Codex n°8, H12), posée au sol : une plaque
    // grattée (« vous grattiez la mousse ») entre le lampadaire et la
    // palissade, et une plaque qui repousse (« elle reviendra ») entre
    // l'autel et le lampadaire.
    { type: 'decor_mousse_plaque_grattee', x: 375, y: 448 },
    { type: 'decor_mousse_plaque_repoussee', x: 1668, y: 448 },
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
