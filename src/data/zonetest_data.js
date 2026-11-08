// Zone de test = BANC D'ESSAI de la vague 3 (secrets, récompenses, marchand,
// quêtes). Rien ici n'est du contenu du jeu ; la quête d'exemple est dans
// src/story/banc_essai.js. Sol à y 320 (gy 5) pour laisser voir une grotte
// sous le sol cassable à l'ours. De gauche à droite :
//  x 64    portail vers la zone 1 (comme avant) ;
//  x 420   feu de camp (invulnérable assise) ;
//  x 640   marchand (`shop`) ; x 840 druide de la quête d'exemple ;
//  x 1024  colline (gx 16-22, gy 2-4) : sa face gauche (gx 16, gy 3-4) est un
//          mur cassable à l'ÉPÉE ; derrière, une salle cachée (dans `cells`
//          aussi : tout tombe d'un coup) avec un coffre d'éclats ;
//  x 1650  coffre de baies, à découvert ;
//  x 1800+ loups (éclats), mousse corrompue (soin : aucun éclat), galet de la quête ;
//  x 2560  sol cassable à l'OURS (gx 40-42) au-dessus d'une grotte (gx 39-43,
//          gy 6-7, comprise dans le cassable) avec un cœur entier ; marche
//          gx 42 gy 7 pour en ressortir.
// Derrière la salle et la grotte : sol d'arrière-plan (`groundBackCells`),
// caché par les cassables tant qu'ils tiennent. (groundRow : fin EXCLUE.)
const ZONETEST_DATA = {
  "levelWidth": 3584,
  "levelHeight": 540,
  "groundCells": [
    ...groundRow(0, 56, [5, 6, 7, 8]),
    // Marche pour monter sur la colline, et marche pour en redescendre.
    [14, 4, "dirt"], [23, 4, "dirt"],
    // Colline : plafond (gy 2), salle et son mur (gy 3-4, cassables), mur droit.
    ...groundRow(16, 23, [2, 3, 4]),
  ],
  "groundBackCells": [
    ...groundRow(16, 22, [3, 4]),
    ...groundRow(39, 44, [6, 7]),
  ],
  "water": [],
  "webs": [],
  "totems": [],
  "enemies": [
    { "type": "loup", "x": 1850, "y": 300, "patrolMinX": 1760, "patrolMaxX": 1960 },
    { "type": "loup", "x": 2100, "y": 300, "patrolMinX": 2020, "patrolMaxX": 2180, "eclats": 3 },
    { "type": "mousse_creature", "x": 2380, "y": 300, "patrolMinX": 2300, "patrolMaxX": 2460 }
  ],
  "props": [],
  "campfires": [{ "x": 420, "y": 320 }],
  "playerSpawn": { "x": 160, "y": 300 },
  "exits": [
    {
      "x": 64, "y": 260, "height": 120,
      "targetScene": "Zone1Scene",
      "data": { "enterId": "entry_mtynumy9_34s8" },
      "portalId": "entry_mtzke73s_dgr3"
    }
  ],
  "entries": [
    { "id": "entry_mtzke73s_dgr3", "x": 64, "y": 260, "height": 120, "portalId": "entry_mtzke73s_dgr3" },
    { "id": "banc_grotte", "x": 2500, "y": 300 }
  ],
  "npcs": [
    { "id": "marchand", "x": 640, "facing": "right", "shop": "marchand_lune" },
    {
      "id": "habitant_druide", "key": "druide", "x": 840, "facing": "left",
      "talk": [
        { "requires": { "questDone": "banc_galet" }, "talk": "banc_druide_merci" },
        { "requires": { "quest": "banc_galet", "item": "galet_lune" }, "talk": "banc_quete_fin" },
        { "requires": { "quest": "banc_galet" }, "talk": "banc_druide_attente" },
        { "talk": "banc_quete_debut" }
      ]
    }
  ],
  "pickups": [
    { "item": "galet_lune", "x": 2240, "requires": { "quest": "banc_galet" }, "cutscene": "banc_galet_trouve" }
  ],
  "breakables": [
    {
      "id": "mur_epee", "by": "sword", "hint": "fissure",
      "cells": [[16, 3], [16, 4], [17, 3], [17, 4], [18, 3], [18, 4], [19, 3], [19, 4], [20, 3], [20, 4], [21, 3], [21, 4]]
    },
    {
      "id": "sol_ours", "by": "bear", "hint": "poussiere",
      "cells": [[40, 5], [41, 5], [42, 5], [39, 6], [40, 6], [41, 6], [42, 6], [43, 6], [39, 7], [40, 7], [41, 7], [43, 7]],
      "reward": { "eclats": 5 }
    }
  ],
  "chests": [
    { "id": "coffre_salle", "x": 1248, "y": 320, "contents": { "eclats": 25 } },
    { "id": "coffre_baies", "x": 1650, "y": 320, "contents": { "consommable": "baie_soin", "n": 2 } }
  ],
  "treasures": [
    { "id": "coeur_grotte", "x": 2592, "y": 470, "contents": { "coeur": true } }
  ],
  "helpText": ""
};
