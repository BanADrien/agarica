// Zone « clairiere_plante » — la clairière préservée (étape 10 de PLAN_DEV.md).
// La plante aperçue d'en bas dans la forêt sombre : un cercle d'herbe saine
// autour d'elle, la mousse partout ailleurs. On y arrive en planant depuis les
// îles flottantes (le script remet Agarica en aigle à l'arrivée).
// Logique (cercle propre, prélèvement de la fleur, papillons qui montrent la
// hutte de Morgat) : ZONE_SCRIPTS.acte2_clairiere dans src/story/acte2.js.
//
// Plan : x 0-112 courant d'air qui remonte vers les îles (sortie en haut à
// gauche) ; plante au centre (x 1200) ; sortie droite vers la hutte, ouverte
// par le script une fois la fleur prélevée.
const CLAIRIERE_PLANTE_DATA = {
  zoneName: 'La clairière préservée',
  zoneSub: 'Forêt flottante',
  background: 'fond_foret_flottante',
  levelWidth: 2240,
  levelHeight: 540,
  groundCells: [
    ...groundRow(0, 35, [7, 8]),
    ...groundRow(11, 13, [6]),    // petite butte avant le cercle
    ...groundRow(26, 29, [6]),    // racines après le cercle
  ],
  avoidRanges: [[960, 1440]],
  playerSpawn: { x: 260, y: 412 },
  props: [
    { type: 'bosquet_mossy_rock', x: 560, y: 448, scale: 0.3 },
    { type: 'bosquet_bush_flowering', x: 1080, y: 448, scale: 0.3 },
    { type: 'bosquet_bush_flowering', x: 1330, y: 448, scale: 0.28 },
    { type: 'bosquet_mossy_rock', x: 1900, y: 448, scale: 0.3 },
  ],
  enemies: [
    // Les bêtes malades rôdent autour du cercle sans jamais y entrer.
    // x 660 : en 700, son corps chevauchait le coin de la butte (x 704) et
    // elle restait perchée dessus, 64 px au-dessus du sol.
    { type: 'mousse_creature', x: 660, y: 400, patrolMinX: 520, patrolMaxX: 900 },
    { type: 'crapaud_corrompu', x: 1720, y: 400 },
  ],
  windCurrents: [{ x: 0, y: 40, w: 112, h: 410, force: 330 }],
  entries: [
    { id: 'from_ff2', x: 230, y: 110, height: 60 },
    { id: 'from_hutte', x: 2140, y: 400, height: 128 },
  ],
  exits: [
    // Haut du courant d'air, à gauche : retour vers les îles (T3).
    { x: 24, y: 90, height: 160, targetScene: 'ForetFlottante2Scene', data: { enterId: 'from_clairiere' } },
    // Retirée par le script tant que la fleur n'est pas prélevée.
    { x: 2224, y: 400, height: 128, targetScene: 'HutteMorgatScene', data: { enterId: 'from_clairiere' } },
  ],
  script: 'acte2_clairiere',
  // Paramètres lus par le script.
  plante: { x: 1200, radius: 230 },
};
