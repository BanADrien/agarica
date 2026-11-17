// Zone de test des PIÈCES DU MONDE V2 (2026-11-16, cf.
// docs/production/MONDE_V2_PIECES.md) : chaque nouvelle pièce, une fois, de
// gauche à droite. Rien ici n'est du contenu du jeu. Accès : écran « Zones de
// test » du titre, ou `?zone=ZonePiecesScene`. Script `zone_pieces`
// (src/story/zone_pieces.js) : loup, singe, ours brun, pierre et papillon
// donnés à l'entrée ; grizzly, ours-hibou, panda et ours polaire se prennent
// ICI (totems, talismans).
// Sol à y 384 (gy 6). De gauche à droite :
//  x 160   départ ; x 352 feu de camp ;
//  x 576   totem du grizzly ; x 736 totem de l'ours-hibou ;
//  x 896   talisman du panda ; x 1024 talisman de l'ours polaire ;
//  gx 18-19  sol fissuré (`sol`) : fracas de l'ours brun [A], ou ours-hibou ;
//  gx 21-33  piste d'élan du grizzly ([Maj] tenue + flèche) ;
//  gx 34     mur fissuré (`mur`, gy 3-5 ; gy 0-2 plein) : la charge seule ;
//  gx 40-43  marches puis corniche (gy 3, 192 px au-dessus du sol) ;
//  gx 46-49  dalle épaisse (`dalle`) : l'ours-hibou qui tombe de la corniche
//            (son 2e saut le pousse de ~300 px en avant : la dalle est plus loin) ;
//  x 3328  bloc SECRET (félins) : on le touche, ou [E] ;
//  x 3616  cible suspendue (une pierre [F]) -> coffre x 3776 ;
//  x 4096  barrière corrompue : papillons [R] ;
//  x 4352  feu de camp (y mettre l'ours polaire) ;
//  gx 70-74  mare (eau) : pics de l'ours polaire -> glace.
// Règle de niveaux : aucune case ne touche une autre par un seul coin (marches
// pleines jusqu'au sol, bords de la mare sur deux rangées). (groundRow : fin EXCLUE.)
const ZONE_PIECES_DATA = {
  "levelWidth": 5440,
  "levelHeight": 540,
  "groundCells": [
    ...groundRow(0, 70, [6, 7]), ...groundRow(75, 85, [6, 7]),
    ...groundRow(0, 85, [8]),
    // Mur du grizzly : plein en haut (gy 0-2), cassable en bas (gy 3-5).
    ...groundRow(34, 35, [0, 1, 2, 3, 4, 5]),
    // Marches et corniche au-dessus de la dalle.
    ...groundRow(40, 41, [5]), ...groundRow(41, 42, [4, 5]), ...groundRow(42, 44, [3, 4, 5]),
  ],
  "water": [
    { "x": 4480, "y": 392, "width": 320, "height": 120 }
  ],
  // Sans la pieuvre, l'eau retire un cœur par seconde jusqu'à la mort : tomber
  // dans la mare ramène au bord (dernier appui sûr, jamais une plaque de glace).
  "fall": { "y": 470, "mode": "hurt" },
  "webs": [],
  "totems": [
    { "x": 576, "y": 384, "flag": "hasGrizzlyForm", "message": "Une nouvelle capacité s'éveille en toi." },
    { "x": 736, "y": 384, "flag": "hasOwlbearForm", "message": "Une nouvelle capacité s'éveille en toi." }
  ],
  "enemies": [],
  "props": [],
  "campfires": [{ "x": 352, "y": 384 }, { "x": 4352, "y": 384 }],
  "playerSpawn": { "x": 160, "y": 364 },
  "exits": [],
  "entries": [],
  "pickups": [
    { "item": "talisman_panda", "x": 896, "y": 330 },
    { "item": "talisman_ours_polaire", "x": 1024, "y": 330 }
  ],
  "breakables": [
    { "id": "sol_v2", "by": "sol", "hint": "fissure", "cells": [[18, 6], [19, 6]], "reward": { "eclats": 3 } },
    { "id": "mur_v2", "by": "mur", "hint": "fissure", "cells": [[34, 3], [34, 4], [34, 5]] },
    { "id": "dalle_v2", "by": "dalle", "hint": "fissure", "cells": [[46, 6], [47, 6], [48, 6], [49, 6]], "reward": { "eclats": 5 } }
  ],
  "secretBlocks": [
    { "id": "secret_felin", "x": 3328, "w": 128, "h": 128, "forme": "felin" }
  ],
  "targets": [
    { "id": "noix", "x": 3616, "y": 262, "fil": 90, "flag": "cible_noix_tombee" }
  ],
  "chests": [
    { "id": "coffre_cible", "x": 3776, "y": 384, "showIf": "cible_noix_tombee", "contents": { "eclats": 15 } }
  ],
  "corruptBarriers": [
    { "id": "ronces", "x": 4096, "w": 64, "h": 192 }
  ],
  "script": "zone_pieces",
  "helpText": ""
};
