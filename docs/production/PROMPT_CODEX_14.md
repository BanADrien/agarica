# Prompt Codex n°14 — les quatre ours : grizzly, ours-hibou, panda, ours polaire (2026-11-12)

Premier test des familles d'animaux (conception : `docs/production/FAMILLES_DESIGN.md`). Quatre
nouveaux ursidés, tous des **transformations d'Agarica** :

- le **grizzly**, forme au sol : il court, prend de l'élan, puis charge ;
- l'**ours-hibou**, forme aérienne : 2e saut en l'air, puis il fracasse le sol en retombant ;
- le **panda**, compétence : Agarica devient panda, s'assoit, mange une pousse et retrouve un cœur ;
- l'**ours polaire**, compétence : il se dresse, retombe, et des pics de glace percent le sol devant
  lui (les pics sont dessinés par le code, pas par ces feuilles).

**8 images** à générer : 7 feuilles animées (4 entrées d'`ASSET_MANIFEST`) et 1 planche de 4 icônes
(4 entrées d'`ITEM_MANIFEST`). **Les entrées sont déjà dans `src/data/asset_manifest.js`** ; ce
document ne le modifie pas. Tant qu'une feuille manque, le jeu montre l'ours actuel recoloré par le
code (`src/entities/Ursides.js`) : l'aspect provisoire est visible dans
`docs/production/controles/familles_2026-11-12/` — c'est l'intention, en mieux.

## Récapitulatif

| # | Image source | Taille | Découpe | Entrée du manifeste |
|---|---|---|---|---|
| 1 | `assets/sprites/grizzly.png` | 1536x1024 | 2 rangées x 4, silhouettes | `grizzly`, rangées 0-1 |
| 2 | `assets/sprites/grizzly_p2.png` | 1536x1024 | 2 rangées (3, 4), silhouettes | `grizzly`, rangées 2-3 |
| 3 | `assets/sprites/ours_hibou.png` | 1536x1024 | 2 rangées (4, 3), silhouettes | `ours_hibou`, rangées 0-1 |
| 4 | `assets/sprites/ours_hibou_p2.png` | 1536x1024 | 2 rangées x 4, silhouettes | `ours_hibou`, rangées 2-3 |
| 5 | `assets/sprites/panda.png` | 1536x1024 | 2 rangées x 4, silhouettes | `panda`, rangées 0-1 |
| 6 | `assets/sprites/ours_polaire.png` | 1536x1024 | 2 rangées x 4, silhouettes | `ours_polaire`, rangées 0-1 |
| 7 | `assets/sprites/ours_polaire_p2.png` | 1536x512 | 1 rangée de 4, silhouettes | `ours_polaire`, rangée 2 |
| 8 | `assets/_codex_src/icones_ours.png` | 1448x1448 | grille 2 x 2 | `skill_icone_panda`, `skill_icone_ours_polaire`, `form_icone_grizzly`, `form_icone_ours_hibou` |

Les frames finales vont dans `assets/sprites/grizzly_frames/`, `ours_hibou_frames/`, `panda_frames/`,
`ours_polaire_frames/` ; les icônes dans `assets/items/skill_icone/` et `assets/items/form_icone/`.

## Feuilles animées : ce que le code attend (ne pas changer les noms ni les nombres de frames)

| Rangée (manifest) | Image | Anim | Frames | fps | Usage en jeu |
|---|---|---|---|---|---|
| 0 | `grizzly.png` (rangée 1) | `run` | 4 | 12, boucle | course ([Maj] tenue) ; la frame 0 sert aussi de pose à l'arrêt |
| 1 | `grizzly.png` (rangée 2) | `charge` | 4 | 16, boucle | au-delà de 400 px/s : charge, tête basse, plus ramassé |
| 2 | `grizzly_p2.png` (rangée 1) | `jump` | 3 | pose par pose | 0 montée, 1 chute, 2 réception (réservée) |
| 3 | `grizzly_p2.png` (rangée 2) | `transform` | 4 | 0,2 s en tout | Agarica devient grizzly ; jouée à l'envers au retour |
| 0 | `ours_hibou.png` (rangée 1) | `jump` | 4 | 12, boucle | 2e saut, tant qu'il monte |
| 1 | `ours_hibou.png` (rangée 2) | `fall` | 3 | 10, boucle | chute, griffes vers le sol |
| 2 | `ours_hibou_p2.png` (rangée 1) | `slam` | 4 | 0,4 s en tout | fracas à l'atterrissage (l'impact est à la frame 0) |
| 3 | `ours_hibou_p2.png` (rangée 2) | `transform` | 4 | 0,2 s en tout | Agarica devient ours-hibou, en l'air |
| 0 | `panda.png` (rangée 1) | `eat` | 4 | 0,7 s en tout | il s'assoit (0), porte la pousse à la bouche (1), mâche (2, 3) |
| 1 | `panda.png` (rangée 2) | `transform` | 4 | 0,2 s en tout | Agarica devient panda ; jouée à l'envers au retour |
| 0 | `ours_polaire.png` (rangée 1) | `rear` | 4 | 0,45 s en tout | il se dresse sur ses pattes arrière (signal de l'attaque) |
| 1 | `ours_polaire.png` (rangée 2) | `slam` | 4 | 0,45 s en tout | il retombe : l'impact est à la frame 0, la glace part à cet instant |
| 2 | `ours_polaire_p2.png` | `transform` | 4 | 0,2 s en tout | Agarica devient ours polaire ; jouée à l'envers au retour |

Ce tableau numérote les frames à partir de 0, comme le code ; le prompt les compte à partir de 1.

## Échelles et alignements

Toutes les feuilles sont jouées à **0,4** (`scale` du manifeste). Agarica debout fait 83 px à l'écran.

| Id | Taille de la pose (px source) | À l'écran | Repère |
|---|---|---|---|
| `grizzly` | environ 340 de long, 200 de haut | ≈ 136 x 80 | plus gros que le loup d'Agarica (≈ 107 x 68) |
| `ours_hibou` | environ 320 de long, 210 de haut (bond : jusqu'à 360 de long) | ≈ 128 x 84 | même gabarit que le grizzly |
| `panda` | assis : environ 230 de large, 220 de haut | ≈ 92 x 88 | rond, plus petit que le grizzly |
| `ours_polaire` | à quatre pattes : environ 400 x 250 ; dressé : environ 260 x 400 | ≈ 160 x 100, dressé ≈ 104 x 160 | le plus grand des quatre, comme l'ours actuel (≈ 177 x 103) |
| icônes | médaillon dans une cellule de 724 | 72 (menu), 40 (HUD) | mêmes médaillons de bois et de lierre que `assets/items/skill_icone/ours.png` |

**Rangée `transform`** : la frame 1 est **Agarica debout, neutre**, à sa taille normale (environ 250 px
de haut à cette échelle de dessin, comme dans `transfo_ours.png`) ; la frame 4 est l'animal, à la
taille de ses autres rangées. Les pieds restent au même endroit.

**Alignement** : l'import rogne chaque frame à sa boîte visible, puis la centre en bas
(`align: bottom`). Dans chaque rangée au sol : pattes arrière au même endroit d'une frame à l'autre,
rien qui dépasse plus d'un côté que de l'autre. L'ours polaire dressé garde ses pattes arrière là où
elles étaient à quatre pattes. Les rangées en l'air (`jump` et `fall` de l'ours-hibou, `jump` du
grizzly) sont centrées sur le corps.

**Une silhouette connexe par frame** (`cut: "blob"`) : la poussière, la terre ou la neige des
impacts (`slam`) restent **collées** au corps, en nuage continu au ras des pattes. Aucun éclat
détaché (c'est ce qui avait cassé le découpage de la feuille de l'ours actuel). **Aucune glace**
dans les feuilles de l'ours polaire : les pics sont dessinés par le code.

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°14) : 8 images, toutes déjà déclarées dans src/data/asset_manifest.js (grizzly, ours_hibou, panda, ours_polaire, skill_icone_panda, skill_icone_ours_polaire, form_icone_grizzly, form_icone_ours_hibou).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` : les entrées y sont déjà. N'édite pas non plus tools/import_codex_assets.py.
- Ne régénère et ne retouche aucune image existante (en particulier assets/sprites/compétence/ours.png, assets/sprites/ours_frames/ et assets/sprites/transformation/transfo_ours.png : le jeu s'en sert, et s'en sert comme repli).
- Fond transparent partout (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre.
- Feuilles animées : une rangée = une animation, nombre de frames EXACT, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Animaux tournés vers la DROITE (le code retourne l'image pour la gauche).
- Une silhouette connexe par frame, aucune particule détachée : la poussière, la terre et la neige des impacts restent collées au corps, en nuage continu au ras des pattes. Aucun éclat qui vole à part.
- AUCUNE GLACE, aucun pic, aucun cristal dans les feuilles de l'ours polaire : la glace est dessinée par le code.
- Ce sont des transformations d'AGARICA : chaque animal garde un rappel d'elle, toujours le même et toujours au même endroit (voir [AGARICA]).
- Finition mécanique autorisée (recadrage, translation, mise à l'échelle uniforme), jamais de dessin produit par code.
- Commence par grizzly.png : avec l'ours actuel, il fixe la finition, l'échelle et la palette des quatre ours.

RÉFÉRENCES À JOINDRE
- L'ours actuel d'Agarica (finition, grain de pixel, œil vert, proportions) : assets/sprites/compétence/ours.png et assets/sprites/ours_frames/ours_row0_0.png (à quatre pattes), ours_row0_1.png (patte levée), ours_row0_2.png (impact).
- La transformation actuelle : assets/sprites/transformation/transfo_ours.png (Agarica, puis mi-femme mi-ourse, puis l'ourse avec la cape verte sur le dos).
- Agarica : assets/sprites/agarica_frames/agarica_row0_0.png (cheveux roux, cape verte, tunique claire, bottes brunes).
- Autres formes d'Agarica (même finition, même échelle de dessin) : assets/sprites/singe.png, assets/sprites/transfo_singe.png, assets/sprites/loup_frames/ (une frame de course).
- L'aspect provisoire en jeu (l'intention, en mieux) : docs/production/controles/familles_2026-11-12/grizzly_charge.png, hibou_saut.png, hibou_fracas.png, panda_repas.png, polaire_dresse.png, polaire_pics.png.
- Icônes : assets/items/skill_icone/ours.png, assets/items/skill_icone/papillon.png, assets/items/form_icone/loup.png, assets/items/form_icone/singe.png.

BLOCS COMMUNS (remplace [STYLE], [AGARICA], [OURS2] et [PLANCHE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[AGARICA] =
THIS ANIMAL IS THE DRUID AGARICA, SHAPE-SHIFTED. Same finish and same drawing scale as her current bear form (reference ours.png). It keeps two reminders of her in EVERY frame, always at the same place: glowing moonlit-green eyes (#8fe3b8, no pupil) and a scrap of her GREEN CLOAK (#3f7d3a, darker folds #2c5a2a) lying on the shoulders and upper back like a short torn cape, attached to the body. Powerful, a little wild, never gory, never cute-cartoon.

[OURS2] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal rows; each row is ONE animation, read left to right. Each row is a band about 512 px tall; frame cells are 384 px wide; each pose is centered in its cell with the lowest point on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same animal, same scale, same colors in every frame. The animal faces RIGHT. No text, no grid lines, no borders.

[PLANCHE] =
SHEET OF SINGLE IMAGES: fully transparent background (alpha). The canvas is divided into invisible equal cells (given below); ONE subject per cell, centered, fully inside its cell with at least 32 px of margin; nothing crosses into a neighboring cell. Same lighting and finish for all subjects. No text, no grid lines, no borders, no ground, no cast shadow.


1) assets/sprites/grizzly.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : environ 340 px de long et 200 px de haut ; même échelle de dessin dans les deux rangées.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A GRIZZLY BEAR: massive, heavy shoulders with a pronounced hump, a broad head carried low, short round ears, long dark claws. Fur in dark umber brown (#4a2f1c, #6b4428, shadows #2a1a10) with GRIZZLED silver-tipped hairs along the hump and the back (#9a8a78), a paler muzzle (#8a6a48).
Row 1 - "run" (a heavy gallop, looping), 4 frames: 1 gathered: all four paws under the body, back arched, head low (this frame is also the standing pose, it must read well alone); 2 push-off: hind legs extended backward, front legs reaching forward; 3 fully stretched, front paws about to land; 4 landing on the front paws, hind legs swinging forward. The body stays at the same height; the shoulder hump rolls.
Row 2 - "charge" (the same gallop at full speed, looping), 4 frames: the SAME four phases, but lower and more compact: head tucked down between the shoulders like a ram, ears flat, jaws clenched, fur on the hump bristling backward, the scrap of cloak streaming straight back (attached). It must read at a glance as "this bear will not stop".
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only grizzly

2) assets/sprites/grizzly_p2.png (1536 x 1024, 2 rangées : 3 / 4 frames, cases 384 x 512)
Même grizzly, même échelle et mêmes couleurs que la feuille n°1.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
THE SAME GRIZZLY as the previous sheet.
Row 1 - "jump", 3 frames: 1 RISING: body angled up about 25 degrees, front paws reaching up and forward, hind legs extended; 2 FALLING: body angled down about 20 degrees, front paws reaching toward the ground, hind legs tucked; 3 LANDING: all four paws on the baseline, body squashed low, head down.
Row 2 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (a small chibi druid about 250 px tall: short red-brown hair, green cloak, pale tunic, brown boots - copy the reference agarica_row0_0.png); 2 she hunches forward, her arms thicken and grow dark fur, the cloak rides up on her shoulders; 3 half woman, half bear, dropping on all fours, bear head forming, the cloak on the back; 4 the full grizzly, exactly frame 1 of "run".
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 3 / 4 frames.
Puis : python tools/import_codex_assets.py --only grizzly

3) assets/sprites/ours_hibou.png (1536 x 1024, 2 rangées : 4 / 3 frames, cases 384 x 512)
Taille : environ 320 px de long et 210 px de haut ; bras écartés jusqu'à 360 px.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
AN OWLBEAR: the heavy body and four clawed paws of a bear, covered in layered FEATHERS instead of fur, with the HEAD OF A GREAT OWL: a pale heart-shaped facial disc (#e8dcc0, rim #b89a6a), two feathered ear tufts, a short hooked amber beak (#e89a2a), very large round eyes glowing moonlit green. Plumage in grey-brown and night violet (#5a4a5e, #7a6a78, shadows #2e2434) with barred lighter feather tips (#a89a9a); longer feathers on the forearms, like stubby wings (it does NOT fly, it leaps).
Row 1 - "jump" (the leap of the double jump, looping), 4 frames: the owlbear springing upward, body angled up about 30 degrees, forearms spread wide with the long feathers fanned out, hind legs tucked; the four frames are one beat of the feathered forearms (up, half down, down, half up), the head and body staying in place.
Row 2 - "fall" (plunging down, looping), 3 frames: body angled DOWN about 40 degrees, both front paws thrust forward and down with claws wide open, ear tufts and forearm feathers streaming upward; the three frames only differ by the feathers fluttering.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 3 frames.
Puis : python tools/import_codex_assets.py --only ours_hibou

4) assets/sprites/ours_hibou_p2.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Même ours-hibou, même échelle et mêmes couleurs que la feuille n°3.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
THE SAME OWLBEAR as the previous sheet.
Row 1 - "slam" (it crashes down on the ground), 4 frames, hind paws at the same place: 1 IMPACT: both front paws smashing the ground, body compressed, head down, a low continuous burst of dust and earth hugging the paws on both sides (attached to the body, no flying chunks); 2 the dust cloud at its widest, still attached, feathers ruffled; 3 the cloud thinning, the owlbear starting to rise; 4 standing on all fours, shaking its feathers.
Row 2 - "transform", 4 frames, centered on the body (this happens in mid-air): 1 AGARICA in a jump pose, facing right (small chibi druid about 250 px tall, red-brown hair, green cloak - copy the reference agarica_row0_0.png); 2 feathers bursting along her arms, her cloak spreading like wings; 3 half woman, half owlbear, owl face forming, arms becoming feathered forepaws; 4 the full owlbear, exactly frame 1 of "jump".
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only ours_hibou

5) assets/sprites/panda.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : assis, environ 230 px de large et 220 px de haut.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A GIANT PANDA: round and heavy, cream-white fur (#f0ece0, shadows #b8b4c4) with black legs, black shoulder band, black round ears and black eye patches (#1e1a26); a calm, content face. It holds a fresh BAMBOO SHOOT with two leaves (#7fd06a, #4f9a48).
Row 1 - "eat" (it sits and eats, played once), 4 frames, the rump at the same place: 1 sitting down heavily on its rump, facing right, hind legs forward, the bamboo shoot in both front paws at chest height; 2 the shoot raised to the mouth, first bite; 3 chewing, cheeks full, eyes half closed, the shoot shorter; 4 chewing, eyes closed with pleasure, the shoot almost gone.
Row 2 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (small chibi druid about 250 px tall - copy the reference agarica_row0_0.png); 2 she rounds up, her arms and legs turning black and furry; 3 half woman, half panda, white fur spreading on the body, round ears, the cloak on the back; 4 the full panda standing on all fours, about to sit.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only panda

6) assets/sprites/ours_polaire.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : à quatre pattes, environ 400 px de long et 250 px de haut ; dressé, environ 260 px de large et 400 px de haut. Les pattes arrière restent au même endroit dans les 8 frames.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A POLAR BEAR: huge, long neck, small head, thick fur in white and pale ice blue (#f2fbff, #cfe8ff, shadows #7fa8d8, deepest shadows #3f5f96), black nose and claws. A faint frost on the fur of the back. NO ICE, no icicles, no crystals anywhere.
Row 1 - "rear" (it stands up on its hind legs: the warning before the attack), 4 frames: 1 on all fours, weight shifting back; 2 front paws leaving the ground, body at 45 degrees; 3 almost upright, front paws raised; 4 FULLY UPRIGHT, towering, both front paws high above the head, claws spread, jaws open in a roar.
Row 2 - "slam" (it drops back down), 4 frames: 1 IMPACT: both front paws slamming the ground in front of it, body compressed, head down, a low continuous spray of snow and frost hugging the paws (attached to the body, no flying chunks); 2 the snow spray at its widest, still attached; 3 the spray settling, the bear pushing back up; 4 on all fours, head up, breathing out.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only ours_polaire

7) assets/sprites/ours_polaire_p2.png (1536 x 512, 1 rangée de 4 frames, cases 384 x 512)
Même ours polaire, même échelle et mêmes couleurs que la feuille n°6.
Prompt :
[STYLE]
[AGARICA]
SPRITE SHEET LAYOUT RULES: canvas 1536 x 512 px, fully transparent background. Exactly 1 horizontal row of 4 frames, read left to right; frame cells are 384 px wide; each pose is centered in its cell, feet on the same baseline. At least 40 px of empty space between neighboring frames. Every frame is ONE single connected silhouette; NO detached particles, NO cast shadow, NO ground line. The character faces RIGHT. No text, no grid lines, no borders.
THE SAME POLAR BEAR as the previous sheet.
Row 1 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (small chibi druid about 250 px tall - copy the reference agarica_row0_0.png); 2 she hunches, frost and white fur spreading up her arms, her breath a small attached puff; 3 half woman, half polar bear, dropping on all fours, the cloak on the back; 4 the full polar bear on all fours, exactly frame 1 of "rear".
Output: one PNG, 1536 x 512 px, transparent background, exactly 1 row, 4 frames.
Puis : python tools/import_codex_assets.py --only ours_polaire

8) assets/_codex_src/icones_ours.png (1448 x 1448, grille 2 x 2, cellules de 724)
Prompt :
[STYLE]
[PLANCHE]
Canvas 1448 x 1448 px, 2 columns x 2 rows of 724 px cells. Four round MEDALLION ICONS, the SAME carved-wood and ivy medallion as the references ours.png and loup.png (dark wood ring, a few ivy leaves, deep violet background inside), each about 640 px across, each showing the HEAD of one animal in profile, facing right, with glowing moonlit-green eyes:
Cell 1 (top left): a GIANT PANDA head, white with black ears and eye patch, a bamboo leaf in the mouth.
Cell 2 (top right): a POLAR BEAR head, white and ice blue, roaring, one small pale-blue ice shard behind it inside the medallion.
Cell 3 (bottom left): a GRIZZLY head, dark brown with silver-tipped fur, head low, charging.
Cell 4 (bottom right): an OWLBEAR head, owl face with a pale facial disc, ear tufts and an amber beak, on a feathered bear neck.
Output: one PNG, 1448 x 1448 px, transparent background, 4 medallions.
Puis : python tools/import_codex_assets.py --only skill_icone_panda skill_icone_ours_polaire form_icone_grizzly form_icone_ours_hibou

À LA FIN
Contrôles, sur les fichiers finaux après import (montages dans docs/production/controles/lot_14/) :
- Frames : EXACTEMENT 4 / 4 / 3 / 4 (grizzly), 4 / 3 / 4 / 4 (ours_hibou), 4 / 4 (panda), 4 / 4 / 4 (ours_polaire), connexes, aucun avertissement à l'import.
- Alignement : apercu_<id>.png, toutes les frames d'une rangée au sol superposées en transparence : les pattes arrière ne glissent pas, à 3 px près (run, charge, slam, eat, rear).
- Échelle : grizzly environ 200 px de haut ; ours-hibou environ 210 ; panda assis environ 220 ; ours polaire environ 250 à quatre pattes et 400 dressé ; Agarica de la frame 1 des rangées transform environ 250.
- Rappels d'Agarica : yeux vert lunaire et morceau de cape verte présents dans toutes les frames des quatre animaux.
- Aucune glace dans ours_polaire ; aucun éclat détaché dans les rangées slam.
Puis :
- lance un python tools/import_codex_assets.py final (il régénère src/data/asset_present.js) ;
- ajoute une section « Lot n°14 » à docs/production/RAPPORT_CODEX.md : une ligne par image (statut, frames ou dimensions finales), puis le rapport du dernier import.
```

## Côté code (après l'import)

Rien d'autre à brancher : `src/entities/Ursides.js` prend chaque feuille dès que sa première frame
existe (`hasManifestArt`), rangée par rangée :

- `grizzly` : `run`, `charge`, `jump`, et la transformation `transform` (aller et retour) ;
- `ours_hibou` : `jump`, `fall`, `slam`, `transform` ;
- `panda` : `eat` (recalée sur 0,7 s) et `transform` ;
- `ours_polaire` : `rear` puis `slam` (0,45 s chacune, la glace part à la 1re frame de `slam`) et
  `transform`.

Les icônes sont prises par le menu du feu (`item-skill_icone_<id>`, `item-form_icone_<id>`) et par le
HUD. Ensuite, comme pour les autres formes : `bash tools/pixelfix_formes.sh` (à compléter avec ces
quatre ids) pour les mettre au grain des formes d'Agarica — avec l'accord de l'utilisateur.

**Échelle** : `scale: 0.4` au manifeste suppose les tailles du tableau ci-dessus. Si les feuilles
livrées sont plus grandes ou plus petites, corriger `scale` dans le manifeste (seule valeur à ajuster).
