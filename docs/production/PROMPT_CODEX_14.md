# Prompt Codex n°14 — les quatre ours : grizzly, ours-hibou, panda, ours polaire (2026-11-12)

Premier test des familles d'animaux (conception : `docs/production/FAMILLES_DESIGN.md`). Quatre
nouveaux ursidés, tous des **transformations d'Agarica** :

- le **grizzly**, forme au sol : il court, prend de l'élan, puis charge. Charbon à crinière d'argent,
  bâti comme un bélier : il ne doit pas ressembler à l'ours brun du fracas ;
- l'**ours-hibou**, forme aérienne : 2e saut en l'air, puis il fracasse le sol en retombant. Un OURS
  d'abord (fourrure, oreilles rondes, pas d'ailes), avec une face de hibou, un bec et un col de plumes ;
- le **panda**, compétence : Agarica devient panda, s'assoit, mange une pousse et retrouve un cœur ;
- l'**ours polaire**, compétence : il se dresse, retombe, et des pics de glace percent le sol devant
  lui (les pics sont dessinés par le code, pas par ces feuilles).

**Retour sur la deuxième livraison (2026-11-13)** : l'ours-hibou est le plus imposant de tous les ours ; inverser les carrures du grizzly (le plus imposant,
il percute) et de l'ours brun (plus petit), sans changer leur dessin ni leurs couleurs ; l'ours-hibou
prend une tête d'ours avec un bec et des oreilles de hibou, et des plumes en petites ailes sur
l'arrière des pattes avant ; le dos de l'ours polaire est à refaire (plaque de givre bizarre). Le
panda est validé. Les feuilles de cette livraison servent de références : `controles/lot_14/ref_v2/`.

**Retour de l'utilisateur sur la première livraison (2026-11-12)** : pas de cape sur les ours ; le
grizzly ressemblait trop à l'ours de la première compétence ; l'ours-hibou n'avait rien d'un ours,
« juste un hibou à quatre pattes ». Le prompt ci-dessous est corrigé ; les trois feuilles déjà
livrées (`grizzly.png`, `grizzly_p2.png`, `ours_hibou.png`) sont à régénérer.

**10 images** à générer : 7 feuilles animées (4 entrées d'`ASSET_MANIFEST`), 1 planche de 4 icônes
(4 entrées d'`ITEM_MANIFEST`) et l'ours brun refait (images n°9 et 10, voir plus bas). **Les entrées
des 8 premières sont déjà dans `src/data/asset_manifest.js`** ; ce
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
| 9 | `assets/sprites/ours_fracas.png` | 2172x724 | 2 rangées x 3, silhouettes | aucune pour l'instant : l'ours brun du chef (compétence fracas), recréé (intégration à part) |
| 10 | `assets/sprites/ours_fracas_p2.png` | 1536x512 | 1 rangée de 4, silhouettes | aucune pour l'instant : sa transformation, sans cape |

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
| `grizzly` | environ 340 de long, 270 de haut | ≈ 170 x 135 (échelle à passer à 0,5) | le plus imposant de la famille |
| `ours_hibou` | environ 340 de long, 290 de haut (bond : jusqu'à 360 de long) | ≈ 190 x 160 (échelle à passer à 0,55) | le plus imposant de tous |
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

## L'ours brun, recréé (images n°9 et 10)

L'ours brun est le premier ours du jeu : celui du talisman donné par le chef, la compétence
« fracas ». Demandes de l'utilisateur du 2026-11-12 :

- il entre dans la liste de création, **dans le même style graphique que les autres ours** (la
  référence est le grizzly validé), mais avec son propre dessin : aucun ours n'est la copie d'un
  autre avec d'autres couleurs ;
- **sans ses effets** : aujourd'hui la poussière, les pierres et la traînée du coup de patte sont
  peintes dans l'image, impossible de les régler. La nouvelle feuille ne montre que l'ours ; les
  effets seront refaits à part avec pixelfx (`tools/pixelfx/`), modifiables en une ligne ;
- **un corps moins long** : environ 400 x 300 px sur la feuille (136 x 103 px à l'écran), contre
  520 x 300 aujourd'hui.

Mêmes six poses, dans le même ordre : le rythme de l'attaque ne change pas. L'image n°10 est sa
transformation, refaite elle aussi : l'actuelle se termine sur une ourse qui porte la cape.
Les deux feuilles arrivent sous de NOUVEAUX noms et ne sont pas importées par Codex : l'ours actuel
reste en jeu jusqu'à l'intégration (découpe, échelle, hitbox, effets pixelfx, pixel-fixer).

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°14) : 10 images. Les 8 premières sont déjà déclarées dans src/data/asset_manifest.js (grizzly, ours_hibou, panda, ours_polaire, skill_icone_panda, skill_icone_ours_polaire, form_icone_grizzly, form_icone_ours_hibou).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` : les entrées y sont déjà. N'édite pas non plus tools/import_codex_assets.py.
- Ne régénère et ne retouche aucune image existante en dehors de ce lot (en particulier assets/sprites/compétence/ours.png, assets/sprites/ours_frames/ et assets/sprites/transformation/transfo_ours.png : le jeu s'en sert, et s'en sert comme repli). Les images n°9 et 10 sont de NOUVELLES feuilles (ours_fracas.png, ours_fracas_p2.png) : elles ne remplacent aucun fichier.
- Fond transparent partout (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre.
- Feuilles animées : une rangée = une animation, nombre de frames EXACT, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Animaux tournés vers la DROITE (le code retourne l'image pour la gauche).
- Une silhouette connexe par frame, aucune particule détachée : la poussière, la terre et la neige des impacts restent collées au corps, en nuage continu au ras des pattes. Aucun éclat qui vole à part.
- AUCUNE GLACE, aucun pic, aucun cristal dans les feuilles de l'ours polaire : la glace est dessinée par le code.
- Ce sont des transformations d'AGARICA : le SEUL rappel d'elle est le regard vert lunaire (voir [AGARICA]). AUCUNE CAPE, aucun tissu, aucun vêtement, aucun accessoire sur les animaux : ce sont de vrais animaux, nus.
- CORRECTION DU 2026-11-13 (deuxième livraison, retours de l'utilisateur ; les feuilles de cette livraison sont gardées comme références dans docs/production/controles/lot_14/ref_v2/) :
  * ORDRE DES CARRURES, du plus imposant au plus petit : OURS-HIBOU (le plus imposant de tous), puis GRIZZLY (énorme, il percute), puis ours polaire, puis ours brun, puis panda.
  * GRIZZLY et OURS BRUN : leurs CARRURES sont à inverser. Le grizzly doit être bien plus massif que l'ours brun ; l'ours brun, plus petit et moins massif. NE CHANGE NI LEUR DESSIN NI LEURS COULEURS : mêmes têtes, mêmes pelages, mêmes marques que ref_v2/grizzly.png et ref_v2/ours_fracas.png.
  * OURS-HIBOU : une TÊTE D'OURS (plus de face de hibou, plus de disque clair), avec un bec et des OREILLES DE HIBOU (aigrettes de plumes à la place des oreilles rondes) ; et des plumes en forme de petites AILES sur l'ARRIÈRE des pattes avant.
  * OURS POLAIRE : son dos était bizarre (une plaque de givre gris-bleu, mouchetée, comme une bosse). Dos lisse, en fourrure blanche comme le reste, aucune plaque.
  * PANDA : validé, ne pas le régénérer.
- CORRECTION DU 2026-11-12 : les feuilles grizzly.png, grizzly_p2.png et ours_hibou.png déjà livrées sont REFUSÉES (cape verte sur le dos ; grizzly identique à l'ours brun existant ; ours-hibou qui est un hibou à quatre pattes avec des ailes). Régénère-les d'après les descriptions ci-dessous et remplace les fichiers ; réimporte avec --force.
- Finition mécanique autorisée (recadrage, translation, mise à l'échelle uniforme), jamais de dessin produit par code.
- MÊME STYLE GRAPHIQUE POUR TOUS LES OURS, DESSINS DIFFÉRENTS. La référence de style est docs/production/controles/lot_14/ref_v2/grizzly.png (validée) : même rendu de la fourrure en mèches, même contour sombre, mêmes paliers d'ombre, même regard vert, mêmes griffes, même niveau de détail, même échelle de dessin. Mais chaque ours est un ANIMAL DIFFÉRENT : sa propre silhouette, ses propres proportions, sa propre tête, ses propres marques. JAMAIS le même dessin recoloré : si on met deux ours en silhouette noire côte à côte, on doit les distinguer.
- L'ancien ours brun (assets/sprites/compétence/ours.png) n'est PLUS la référence de style : il est remplacé par l'image n°9. Ne copie ni son rendu ni ses poses trait pour trait.

RÉFÉRENCES À JOINDRE
- RÉFÉRENCE DE STYLE de tous les ours : docs/production/controles/lot_14/ref_v2/grizzly.png (le grizzly validé : rendu de la fourrure, contour, ombres, regard, griffes).
- Dessins et couleurs À GARDER (livraison précédente) : docs/production/controles/lot_14/ref_v2/grizzly.png, ours_fracas.png, ours_hibou.png (couleurs et corps seulement, la tête change), ours_polaire.png (tout sauf le dos), panda.png (validé).
- L'ancien ours brun, pour ses POSES seulement (à quatre pattes, patte levée, impact) : assets/sprites/ours_frames/ours_row0_0.png, ours_row0_1.png, ours_row0_2.png. Pas pour son style.
- La transformation actuelle : assets/sprites/transformation/transfo_ours.png (Agarica, puis mi-femme mi-ourse, puis l'ourse). Ne reprends pas la cape sur le dos de l'animal.
- Agarica : assets/sprites/agarica_frames/agarica_row0_0.png (cheveux roux, cape verte, tunique claire, bottes brunes).
- Autres formes d'Agarica (même finition, même échelle de dessin) : assets/sprites/singe.png, assets/sprites/transfo_singe.png, assets/sprites/loup_frames/ (une frame de course).
- L'aspect provisoire en jeu (l'intention, en mieux) : docs/production/controles/familles_2026-11-12/grizzly_charge.png, hibou_saut.png, hibou_fracas.png, panda_repas.png, polaire_dresse.png, polaire_pics.png.
- Icônes : assets/items/skill_icone/ours.png, assets/items/skill_icone/papillon.png, assets/items/form_icone/loup.png, assets/items/form_icone/singe.png.

BLOCS COMMUNS (remplace [STYLE], [AGARICA], [OURS2] et [PLANCHE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[AGARICA] =
THIS ANIMAL IS THE DRUID AGARICA, SHAPE-SHIFTED INTO A REAL ANIMAL. ONE FAMILY, ONE STYLE: same finish as the reference ref_v2/grizzly.png (fur drawn in tufts, dark outline, same shading steps, same claws, same level of detail, same drawing scale), but a DIFFERENT ANIMAL with its own silhouette, proportions, head and markings: never the same drawing in other colors. The ONLY reminder of her, in every frame: glowing moonlit-green eyes (#8fe3b8, no pupil). ABSOLUTELY NO CLOAK, no cape, no cloth, no clothing, no collar, no jewelry, no accessory of any kind on the animal: bare fur (or feathers) only. Powerful, a little wild, never gory, never cute-cartoon.

[OURS2] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal rows; each row is ONE animation, read left to right. Each row is a band about 512 px tall; frame cells are 384 px wide; each pose is centered in its cell with the lowest point on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line. Same animal, same scale, same colors in every frame. The animal faces RIGHT. No text, no grid lines, no borders.

[PLANCHE] =
SHEET OF SINGLE IMAGES: fully transparent background (alpha). The canvas is divided into invisible equal cells (given below); ONE subject per cell, centered, fully inside its cell with at least 32 px of margin; nothing crosses into a neighboring cell. Same lighting and finish for all subjects. No text, no grid lines, no borders, no ground, no cast shadow.


1) assets/sprites/grizzly.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : un colosse, bien plus gros que l'ours brun (seul l'ours-hibou est plus imposant). Il remplit sa case : environ 340 px de long et 270 px de haut (le jeu l'affichera plus grand que les autres) ; même échelle de dessin dans les deux rangées.
MÊME DESSIN ET MÊMES COULEURS que docs/production/controles/lot_14/ref_v2/grizzly.png (charbon, crinière d'argent, museau gris cendre, cicatrice, griffes claires) : seule la carrure change.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A SILVERTIP GRIZZLY, built like a battering ram, A GIANT AMONG BEARS (only the owlbear is bigger): a colossal, deep barrel chest, enormously broad shoulders, a thick neck, massive tree-trunk legs and wide heavy paws; a wall of muscle that nothing stops. Much bulkier and taller than the brown bear. The body mass must dominate the silhouette (the mane sits on a huge body, it does not replace it). It must NOT look like the brown bear of this lot (image 9): different colors AND a different silhouette. SILHOUETTE: front-heavy like a bison: an enormous shoulder hump that is the highest point of the body, a very thick neck ruff, a broad wedge-shaped head carried LOW below the line of the back, small hindquarters, a sloping back, long forelegs made for running, long pale claws. COLORS: coat in near-black charcoal with a cold blue-violet cast (#24222c, #34323f, shadows #15131b); a bright SILVER mane of long frosted hairs over the hump, the neck ruff and along the spine (#c3c7d6, #8e92a6); an ash-grey muzzle (#9a9aa8); pale bone-colored claws (#d8d2c0). DETAILS: a notched left ear and one old pale scar across the muzzle. No brown anywhere.
Row 1 - "run" (a heavy gallop, looping), 4 frames: 1 gathered: all four paws under the body, back arched, head low (this frame is also the standing pose, it must read well alone); 2 push-off: hind legs extended backward, front legs reaching forward; 3 fully stretched, front paws about to land; 4 landing on the front paws, hind legs swinging forward. The body stays at the same height; the shoulder hump rolls.
Row 2 - "charge" (the same gallop at full speed, looping), 4 frames: the SAME four phases, but lower and more compact: head tucked down between the shoulders like a ram, ears flat, jaws clenched, the silver mane of the hump bristling and swept backward by the speed. It must read at a glance as "this bear will not stop".
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --force --only grizzly

2) assets/sprites/grizzly_p2.png (1536 x 1024, 2 rangées : 3 / 4 frames, cases 384 x 512)
Même grizzly (colossal), même échelle et mêmes couleurs que la feuille n°1.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
THE SAME GRIZZLY as the previous sheet.
Row 1 - "jump", 3 frames: 1 RISING: body angled up about 25 degrees, front paws reaching up and forward, hind legs extended; 2 FALLING: body angled down about 20 degrees, front paws reaching toward the ground, hind legs tucked; 3 LANDING: all four paws on the baseline, body squashed low, head down.
Row 2 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (a small chibi druid about 250 px tall: short red-brown hair, green cloak, pale tunic, brown boots - copy the reference agarica_row0_0.png); 2 she hunches forward, her arms thicken and grow charcoal fur, her cloak and clothes dissolving into the fur; 3 half woman, half bear, dropping on all fours, bear head forming, the silver mane rising on the shoulders, no clothing left; 4 the full grizzly, exactly frame 1 of "run", with no cloak.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 3 / 4 frames.
Puis : python tools/import_codex_assets.py --force --only grizzly

3) assets/sprites/ours_hibou.png (1536 x 1024, 2 rangées : 4 / 3 frames, cases 384 x 512)
Taille : LE PLUS IMPOSANT DE TOUS LES OURS. Il remplit sa case : environ 340 px de long et 290 px de haut ; bras écartés jusqu'à 360 px (le jeu l'affichera plus grand que tous les autres).
Prompt :
[STYLE]
[AGARICA]
[OURS2]
AN OWLBEAR THAT IS A BEAR FIRST: in pure black silhouette it must read as a BEAR, not as a bird. IT IS THE MOST IMPOSING BEAR OF THE WHOLE FAMILY, bigger and heavier than the grizzly: a towering monster with a gigantic barrel chest, a huge hunched back, enormously thick forelegs and oversized clawed paws; heavy, slow to turn, crushing when it lands. Same tawny colors and same body as the reference ref_v2/ours_hibou.png; the HEAD changes and the forelegs gain feathers. BODY: the full heavy body of a bear, covered in thick FUR: barrel chest, four thick bear legs with big clawed bear paws, a short bear tail. No bird legs, no talons, no tail feathers. HEAD: A BEAR'S HEAD, furry, with a bear's skull, cheeks and brow, and small bear eyes glowing green. NO owl face: NO pale facial disc, NO huge round owl eyes. Only two owl features on this bear head: (1) a short hooked amber BEAK (#e89a2a) in place of the bear's nose and mouth; (2) OWL EARS: two tall pointed feather tufts standing where a bear's round ears would be (no round ears). FORELEG FEATHERS: along the BACK EDGE of each front leg, from the shoulder down past the elbow, a fringe of long layered barred feathers hanging backward like a small folded WING attached to the arm (dark brown #3d2f24 with cream bars #d9c6a0). The front legs stay thick bear legs with paws and claws; the feathers are only on their rear edge, they are not real wings and it does not fly. Also a short collar of the same barred feathers over the neck and shoulders. COLORS: fur in warm tawny ochre and russet (#a06a30, #c4904a, shadows #5a3a1c), paler cream on the chest (#e0c898). It LEAPS like a bear.
Row 1 - "jump" (the leap of the double jump, looping), 4 frames: a bear leaping upward, body angled up about 30 degrees, both front paws reaching up and forward with claws open, hind legs tucked under the belly; the foreleg feathers fan out behind the raised arms like small spread wings; the four frames differ only by these feathers and the fur rippling in the wind and the front paws opening and closing slightly; the head and body stay in place. No flapping flight.
Row 2 - "fall" (plunging down, looping), 3 frames: body angled DOWN about 40 degrees, both front paws thrust forward and down with claws wide open, the foreleg feathers, the feather collar and the ear tufts blown upward, the fur of the back streaming up; the three frames only differ by the fur and feathers fluttering.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 3 frames.
Puis : python tools/import_codex_assets.py --force --only ours_hibou

4) assets/sprites/ours_hibou_p2.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Même ours-hibou (le plus imposant de la famille), même échelle et mêmes couleurs que la feuille n°3.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
THE SAME OWLBEAR as the previous sheet.
Row 1 - "slam" (it crashes down on the ground), 4 frames, hind paws at the same place: 1 IMPACT: both front paws smashing the ground, body compressed, head down, a low continuous burst of dust and earth hugging the paws on both sides (attached to the body, no flying chunks); 2 the dust cloud at its widest, still attached, the feather mantle ruffled; 3 the cloud thinning, the owlbear starting to rise; 4 standing on all fours like a bear, shaking its fur.
Row 2 - "transform", 4 frames, centered on the body (this happens in mid-air): 1 AGARICA in a jump pose, facing right (small chibi druid about 250 px tall, red-brown hair, green cloak - copy the reference agarica_row0_0.png); 2 tawny fur spreading along her arms and legs, a collar of feathers bursting around her neck, her cloak and clothes dissolving; 3 half woman, half owlbear: heavy furry bear limbs with feathers growing behind the arms, a bear head with a beak and feather ear tufts forming, no clothing left; 4 the full owlbear, exactly frame 1 of "jump", with no cloak and no wings.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --force --only ours_hibou

5) assets/sprites/panda.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : assis, environ 230 px de large et 220 px de haut.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A GIANT PANDA: round and heavy, cream-white fur (#f0ece0, shadows #b8b4c4) with black legs, black shoulder band, black round ears and black eye patches (#1e1a26); a calm, content face. It holds a fresh BAMBOO SHOOT with two leaves (#7fd06a, #4f9a48).
Row 1 - "eat" (it sits and eats, played once), 4 frames, the rump at the same place: 1 sitting down heavily on its rump, facing right, hind legs forward, the bamboo shoot in both front paws at chest height; 2 the shoot raised to the mouth, first bite; 3 chewing, cheeks full, eyes half closed, the shoot shorter; 4 chewing, eyes closed with pleasure, the shoot almost gone.
Row 2 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (small chibi druid about 250 px tall - copy the reference agarica_row0_0.png); 2 she rounds up, her arms and legs turning black and furry; 3 half woman, half panda, white fur spreading on the body, round ears, her cloak and clothes gone; 4 the full panda standing on all fours, about to sit, with no cloak.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only panda

6) assets/sprites/ours_polaire.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Taille : à quatre pattes, environ 400 px de long et 250 px de haut ; dressé, environ 260 px de large et 400 px de haut. Les pattes arrière restent au même endroit dans les 8 frames.
Prompt :
[STYLE]
[AGARICA]
[OURS2]
A POLAR BEAR: huge, long neck, small head, thick fur in white and pale ice blue (#f2fbff, #cfe8ff, shadows #7fa8d8, deepest shadows #3f5f96), black nose and claws. THE BACK is a smooth, clean line covered in the same plain white fur as the rest of the body: NO frost patch, no grey-blue speckled area, no different texture, no hump on the back. Same design as the reference ref_v2/ours_polaire.png except for the back. NO ICE, no icicles, no crystals anywhere.
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
Row 1 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (small chibi druid about 250 px tall - copy the reference agarica_row0_0.png); 2 she hunches, frost and white fur spreading up her arms, her breath a small attached puff; 3 half woman, half polar bear, dropping on all fours, her cloak and clothes gone; 4 the full polar bear on all fours, exactly frame 1 of "rear", with no cloak.
Output: one PNG, 1536 x 512 px, transparent background, exactly 1 row, 4 frames.
Puis : python tools/import_codex_assets.py --only ours_polaire

8) assets/_codex_src/icones_ours.png (1448 x 1448, grille 2 x 2, cellules de 724)
Prompt :
[STYLE]
[PLANCHE]
Canvas 1448 x 1448 px, 2 columns x 2 rows of 724 px cells. Four round MEDALLION ICONS, the SAME carved-wood and ivy medallion as the references assets/items/skill_icone/ours.png and assets/items/form_icone/loup.png (dark wood ring, a few ivy leaves, deep violet background inside), each about 640 px across, each showing the HEAD of one animal in profile, facing right, with glowing moonlit-green eyes:
Cell 1 (top left): a GIANT PANDA head, white with black ears and eye patch, a bamboo leaf in the mouth.
Cell 2 (top right): a POLAR BEAR head, white and ice blue, roaring, one small pale-blue ice shard behind it inside the medallion.
Cell 3 (bottom left): a SILVERTIP GRIZZLY head, charcoal black with a bright silver mane and an ash-grey muzzle, a scar across the muzzle, head low, charging.
Cell 4 (bottom right): an OWLBEAR head: a broad tawny furry BEAR head (no owl facial disc), two tall pointed feather ear tufts instead of round ears, a hooked amber beak instead of the nose and mouth, a collar of barred feathers on the neck.
Output: one PNG, 1448 x 1448 px, transparent background, 4 medallions.
Puis : python tools/import_codex_assets.py --only skill_icone_panda skill_icone_ours_polaire form_icone_grizzly form_icone_ours_hibou

9) assets/sprites/ours_fracas.png (2172 x 724, 2 rangées de 3 frames, cases 724 x 362)
L'OURS BRUN d'Agarica, le premier de la famille (talisman du chef, compétence « fracas »), RECRÉÉ dans le style de la famille : même rendu que grizzly.png, mais son propre dessin. Aucun effet, corps court.
Taille : nettement PLUS PETIT et moins massif que le grizzly : environ 330 px de long et 230 px de haut à quatre pattes.
MÊME DESSIN ET MÊMES COULEURS que docs/production/controles/lot_14/ref_v2/ours_fracas.png (tête ronde, pelage châtaigne et miel, regard vert) : seule la carrure change.
Prompt :
[STYLE]
[AGARICA]
SPRITE SHEET LAYOUT RULES: canvas 2172 x 724 px, fully transparent background. Exactly 2 horizontal rows of exactly 3 frames each, read left to right, then top row to bottom row; frame cells are 724 px wide and 362 px tall; each pose is centered in its cell, hind paws on the same baseline in all six frames. Leave at least 60 px of empty space between neighboring frames and between rows. Every frame is ONE single connected silhouette: the bear and NOTHING ELSE. The bear faces RIGHT. No text, no grid lines, no borders, no cast shadow, no ground line.
A FOREST BROWN BEAR, the classic bear of the family: a MEDIUM-SIZED, compact, agile bear, clearly SMALLER AND LIGHTER than the grizzly: a shorter body, a narrower chest, slimmer legs, a rounder and friendlier outline. SILHOUETTE: a short, stocky, barrel-shaped body with a ROUNDED back (no shoulder hump, no mane), a big round head carried level with the back, a short broad muzzle, round ears set wide apart, thick short legs, a heavy rump. It must not be mistaken for the grizzly (bison build, huge silver mane, low wedge head) even in black silhouette. COLORS: warm chestnut and honey brown fur (#6b4226, #8a5a34, highlights #b07a48, shadows #3a2414), a paler honey muzzle (#c69a64), dark brown claws. ABSOLUTELY NO EFFECTS IN ANY FRAME: no dust, no dirt cloud, no rocks, no debris, no cracks, no impact burst, no motion trail, no swipe arc, no speed lines, no sparks. Only the bear's body. The effects are added by the game.
Row 1, 3 frames: 1 standing on all fours, alert, facing right; 2 WIND-UP: rearing on its hind legs, the right front paw raised high above the head, claws spread, jaws open in a roar; 3 IMPACT: the raised paw slammed down on the ground in front of it, body compressed forward, head low.
Row 2, 3 frames: 4 impact held: both front paws planted, shoulders at their lowest, fur bristling; 5 recovering: the body pushing back up, head rising; 6 back on all fours, like frame 1, looking forward and down.
Output: one PNG, 2172 x 724 px, transparent background, exactly 2 rows of 3 frames, six bears and nothing else.
N'importe pas cette feuille et ne touche pas à assets/sprites/ours_frames/ : son intégration est faite à part.

10) assets/sprites/ours_fracas_p2.png (1536 x 512, 1 rangée de 4 frames, cases 384 x 512)
Même ours brun, même échelle et mêmes couleurs que la feuille n°9.
Prompt :
[STYLE]
[AGARICA]
SPRITE SHEET LAYOUT RULES: canvas 1536 x 512 px, fully transparent background. Exactly 1 horizontal row of 4 frames, read left to right; frame cells are 384 px wide; each pose is centered in its cell, feet on the same baseline. At least 40 px of empty space between neighboring frames. Every frame is ONE single connected silhouette; NO detached particles, NO cast shadow, NO ground line. The character faces RIGHT. No text, no grid lines, no borders.
THE SAME FOREST BROWN BEAR as the previous sheet.
Row 1 - "transform", 4 frames, the feet stay at the same place: 1 AGARICA standing, neutral, facing right (small chibi druid about 250 px tall - copy the reference agarica_row0_0.png); 2 she hunches forward, her arms thicken and grow chestnut fur, her cloak and clothes dissolving into the fur; 3 half woman, half bear, dropping on all fours, a round bear head forming, no clothing left; 4 the full brown bear on all fours, exactly frame 1 of the previous sheet, with no cloak.
Output: one PNG, 1536 x 512 px, transparent background, exactly 1 row, 4 frames.
N'importe pas cette feuille et ne touche pas à assets/sprites/transformation/ : son intégration est faite à part.

À LA FIN
Contrôles, sur les fichiers finaux après import (montages dans docs/production/controles/lot_14/) :
- Frames : EXACTEMENT 4 / 4 / 3 / 4 (grizzly), 4 / 3 / 4 / 4 (ours_hibou), 4 / 4 (panda), 4 / 4 / 4 (ours_polaire), connexes, aucun avertissement à l'import.
- Alignement : apercu_<id>.png, toutes les frames d'une rangée au sol superposées en transparence : les pattes arrière ne glissent pas, à 3 px près (run, charge, slam, eat, rear).
- Échelle : grizzly environ 200 px de haut ; ours-hibou environ 210 ; panda assis environ 220 ; ours polaire environ 250 à quatre pattes et 400 dressé ; Agarica de la frame 1 des rangées transform environ 250.
- Rappel d'Agarica : yeux vert lunaire dans toutes les frames. AUCUNE cape ni tissu sur aucun animal (seule la frame 1 des rangées transform montre Agarica habillée).
- Grizzly : charbon et argent, bosse d'épaules plus haute que la tête ; posé à côté de assets/sprites/ours_frames/ours_row0_0.png, on ne les confond pas, même en silhouette noire.
- Ours-hibou : en silhouette noire, c'est un ours (quatre grosses pattes) ; tête d'ours sans disque facial, bec, aigrettes de plumes à la place des oreilles ; plumes en petites ailes sur l'arrière des pattes avant, dans toutes les frames.
- Carrures : dans le montage famille.png, l'ours-hibou est le plus imposant, puis le grizzly ; l'ours brun est nettement plus petit que les deux.
- Ours polaire : dos lisse et blanc, sans plaque de givre ni mouchetures.
- Aucune glace dans ours_polaire ; aucun éclat détaché dans les rangées slam.
- ours_fracas.png : six ours bruns, AUCUN effet (ni poussière, ni pierre, ni traînée) ; corps d'environ 330 px de long pour 230 de haut, visiblement moins massif que le grizzly ; pattes arrière au même endroit dans les six frames. ours_fracas_p2.png : 4 frames, l'ours final sans cape.
- FAMILLE : un montage des cinq ours côte à côte (grizzly, ours brun, ours-hibou, panda, ours polaire, première frame de chacun, même échelle) dans docs/production/controles/lot_14/famille.png : même rendu de fourrure, même contour, même niveau de détail ; cinq silhouettes différentes.
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
HUD.

**Ensuite, obligatoire** (demande de l'utilisateur du 2026-11-12) : passer les nouvelles images dans
pixel-fixer, au grain des autres formes d'Agarica : `bash tools/pixelfix_ours.sh` (regarder d'abord
un aperçu avec `--preview`, voir l'en-tête du script).

**Échelle** : `scale: 0.4` au manifeste suppose les tailles du tableau ci-dessus. Si les feuilles
livrées sont plus grandes ou plus petites, corriger `scale` dans le manifeste (seule valeur à ajuster).
