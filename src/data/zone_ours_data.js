// Zone de test des FAMILLES D'ANIMAUX (2026-11-12, cf.
// docs/production/FAMILLES_DESIGN.md) : elle donne les quatre ours d'un coup
// (script `zone_ours`, src/story/zone_ours.js). Rien ici n'est du contenu du
// jeu. Accès : écran « Zones de test » du titre, ou `?zone=ZoneOursScene`.
// Sol à y 384 (gy 6). De gauche à droite :
//  x 160   départ ; x 420 feu de camp (pour composer son équipe) ;
//  x 700   mannequin (gros, 6 PV) : fracas, pics de glace ;
//  x 1024  tranchée (gx 16-17, une case de profondeur) : les pics de glace
//          s'arrêtent au vide ;
//  x 1300  deux loups et une créature de mousse : petits ennemis ;
//  x 1630  sol cassable à l'OURS (gx 25-26, une case de profondeur) : fracas de
//          l'ours ou atterrissage de l'ours-hibou ;
//  x 1900  2e feu de camp, au départ de la piste ;
//  gx 30 à 63 : longue ligne de plat pour charger avec le grizzly --
//  x 2700  trois petits ennemis sur la route (renversés en charge) ;
//  x 3296  pilier cassable à l'OURS (gx 51, gy 4-5) : la percussion le casse ;
//  x 3712  mannequin (gros) : il arrête la charge et perd 1 PV ;
//  x 4096  mur (gx 64-69, gy 2-5) : percussion, projection en arrière.
// Règle de niveaux : aucune case ne touche une autre par un seul coin (blocs
// pleins, pilier posé sur le sol). (groundRow : fin EXCLUE.)
const ZONE_OURS_DATA = {
  "levelWidth": 4480,
  "levelHeight": 540,
  "groundCells": [
    // Sol : la tranchée (gx 16-17) et le sol cassable (gx 25-26) n'ont pas de
    // case à gy 6 ici ; le sol cassable est rendu par `breakables`.
    ...groundRow(0, 16, [6]), ...groundRow(18, 25, [6]), ...groundRow(27, 70, [6]),
    ...groundRow(0, 70, [7, 8]),
    // Mur du bout de la piste.
    ...groundRow(64, 70, [2, 3, 4, 5]),
  ],
  "water": [],
  "webs": [],
  "totems": [],
  "enemies": [
    { "type": "mannequin", "x": 700, "y": 384, "hp": 6, "heavy": true, "eclats": 0 },
    { "type": "loup", "x": 1250, "y": 364, "patrolMinX": 1180, "patrolMaxX": 1340, "eclats": 0 },
    { "type": "loup", "x": 1420, "y": 364, "patrolMinX": 1360, "patrolMaxX": 1500, "eclats": 0 },
    { "type": "mousse_creature", "x": 1540, "y": 364, "patrolMinX": 1500, "patrolMaxX": 1590, "eclats": 0 },
    { "type": "loup", "x": 2650, "y": 364, "patrolMinX": 2600, "patrolMaxX": 2720, "eclats": 0 },
    { "type": "mousse_creature", "x": 2800, "y": 364, "patrolMinX": 2760, "patrolMaxX": 2860, "eclats": 0 },
    { "type": "loup", "x": 2950, "y": 364, "patrolMinX": 2900, "patrolMaxX": 3010, "eclats": 0 },
    { "type": "mannequin", "x": 3712, "y": 384, "hp": 6, "heavy": true, "eclats": 0 }
  ],
  "props": [],
  "campfires": [{ "x": 420, "y": 384 }, { "x": 1900, "y": 384 }],
  "playerSpawn": { "x": 160, "y": 364 },
  "exits": [],
  "entries": [],
  "breakables": [
    { "id": "sol_ours", "by": "bear", "hint": "fissure", "cells": [[25, 6], [26, 6]], "reward": { "eclats": 3 } },
    { "id": "pilier_ours", "by": "bear", "hint": "fissure", "cells": [[51, 4], [51, 5]] }
  ],
  "script": "zone_ours",
  "helpText": ""
};
