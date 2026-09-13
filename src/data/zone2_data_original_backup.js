// Sauvegarde de l'ancien contenu de zone2_data.js (ZONE2_DATA), avant de le
// remplacer temporairement par level_data.json pour tester le rendu du sol
// en second plan dans une vraie zone jouable (retour utilisateur : "j'ai
// rajouté un level_data.json pour la mettre en 2eme zone pour tester").
// PAS chargé par index.html (aucune <script> ne pointe ici) -- fichier
// purement archival, pour pouvoir restaurer l'ancienne Zone2 telle quelle
// (recopier ce contenu dans zone2_data.js, renommer ZONE2_DATA_BACKUP en
// ZONE2_DATA) si le test ne mène nulle part.
//
// Données par défaut de Zone2Scene, migrées vers le format éditeur (voir
// zone1_data.js pour la méthode générale de conversion : décalage -28px pour
// tout ce qui était positionné relativement à l'ancien sol `height - 32`).
// Vide large (5 cases, ~320px) : trop grand pour un saut simple, nécessite
// le double-saut Aigle — cf. GDD. Le vide est une vraie fosse (le monde
// s'étend sous l'écran, cf. levelHeight ci-dessous) : y tomber renvoie vers
// SousGrotteScene plutôt qu'un échec, câblé à part dans Zone2Scene.js (pas
// un simple "exit" x, donc hors du schéma générique).
const ZONE2_SURFACE_Y_BACKUP = 448;

const ZONE2_DATA_BACKUP = {
  levelWidth: 2200,
  // Canvas = 540 ; +300 de fosse sous l'écran visible pour que le vide soit
  // une vraie chute (pas un rebord re-sautable), comme l'ancienne version.
  levelHeight: 840,
  groundCells: [
    ...groundRow(0, 8, [7, 8]),
    ...groundRow(13, 36, [7, 8]),
  ],
  avoidRanges: [[512, 832]],
  playerSpawn: { x: 80, y: 412 },
  enemies: [
    { type: 'loup', x: 1350, y: ZONE2_SURFACE_Y_BACKUP + 12, patrolMinX: 1000, patrolMaxX: 1750 },
  ],
  exit: { x: 2170, targetScene: 'Zone4Scene', data: {} },
  helpText: 'Vide large : necessite le double-saut (Aigle) — K/clic gauche : attaque',
};
