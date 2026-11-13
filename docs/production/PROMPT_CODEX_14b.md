# Prompt Codex n°14b — propositions de design des ours (2026-11-13)

Demande de l'utilisateur : « fais-moi des propositions de design au lieu de faire les feuilles
d'animation direct », puis « à chaque asset que je demande tu me montres 3 versions différentes ».
On choisit d'abord le dessin de chaque ours sur une planche ; les feuilles d'animation (prompt n°14)
ne se font qu'ensuite, d'après la proposition retenue.

**Méthode à garder pour tout asset** : une planche de 3 DESIGNS VRAIMENT DIFFÉRENTS (trois idées :
couleurs, motifs, tête, silhouette ; jamais trois fois le même dessin avec une autre carrure), une
seule pose debout de profil, puis le choix de l'utilisateur (une proposition, ou un mélange), puis
seulement l'asset final.

## Historique des planches

| Planche | Résultat |
|---|---|
| `propositions/ours_hibou.png` | refusée : trois fois le même animal, tête de rapace (« ressemble à rien ») |
| `propositions/ours_hibou_v2.png` | la proposition C (lunaire : violet nuit, plumes à pointes lumineuses, voûté) est RETENUE pour le corps ; mais « la tête est horrible » : à refaire en 3 têtes et 3 jeux de couleurs |
| `propositions/grizzly.png`, `ours_brun.png`, `ours_polaire.png` | à refaire : elles ne variaient que la carrure |

## Planches en cours (troisième série)

| # | Image | Ours | Ce qui varie |
|---|---|---|---|
| 1 | `docs/production/controles/lot_14/propositions/ours_hibou_v3.png` | ours-hibou | la TÊTE et les COULEURS, sur le corps de la proposition C |
| 2 | `docs/production/controles/lot_14/propositions/grizzly_v2.png` | grizzly | trois designs (A reste proche du dessin actuel) |
| 3 | `docs/production/controles/lot_14/propositions/ours_brun_v2.png` | ours brun | trois designs (A reste proche du dessin actuel) |
| 4 | `docs/production/controles/lot_14/propositions/ours_polaire_v2.png` | ours polaire | trois designs |

Les propositions se lisent de gauche à droite : A, B, C. Les lettres sont ajoutées après coup par
`python tools/planche_abc.py` (aucun texte dans les images générées).

## Prompt à coller dans Codex

```
Commande d'images pour « Legend of Agarica » (prompt n°14b, troisième série) : 4 PLANCHES DE PROPOSITIONS DE DESIGN. Ce ne sont pas des feuilles d'animation : chaque planche montre TROIS PROPOSITIONS pour un même animal, dans la même pose, pour que l'utilisateur choisisse.

RÈGLES
- N'écris que dans docs/production/controles/lot_14/propositions/. Ne touche à aucun fichier de assets/ ni de src/. Ne remplace aucune planche existante de ce dossier. Ne lance aucun import.
- Fond transparent (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune flèche, aucun cadre, aucune ligne de sol, aucune ombre portée.
- Chaque planche : 1536 x 1024 px, UNE rangée de 3 cases de 512 px de large. Dans chaque case, UN animal entier, debout sur ses quatre pattes, vu de profil strict, tourné vers la DROITE, pattes posées sur la même ligne dans les trois cases, au moins 40 px de vide entre deux animaux, les trois à la même échelle de dessin.
- TROIS PROPOSITIONS VRAIMENT DIFFÉRENTES par planche : trois idées, pas un même dessin décliné. Elles doivent se distinguer au premier coup d'œil par les couleurs, les marques, la tête et la silhouette.
- Des animaux BEAUX et expressifs, qu'on a envie de jouer : têtes soignées, bien proportionnées, lisibles ; jamais un collage maladroit de deux animaux.
- Aucun vêtement, aucune cape, aucun accessoire. Seul rappel de la druidesse Agarica : le regard vert lunaire (#8fe3b8, sans pupille).
- MÊME STYLE GRAPHIQUE pour les quatre planches : celui de docs/production/controles/lot_14/ref_v2/grizzly.png (fourrure en mèches, contour sombre, paliers d'ombre nets, griffes, niveau de détail).

RÉFÉRENCES À JOINDRE
- Style : docs/production/controles/lot_14/ref_v2/grizzly.png.
- Ours-hibou retenu pour le corps : docs/production/controles/lot_14/propositions/ours_hibou_v2.png, l'animal de DROITE (violet nuit, plumes à pointes vert lunaire, croissant sur le front).
- Dessins actuels, pour la proposition A du grizzly et de l'ours brun : docs/production/controles/lot_14/ref_v2/grizzly.png et ref_v2/ours_fracas.png.
- Panda validé, pour la cohérence de la famille : docs/production/controles/lot_14/ref_v2/panda.png.

BLOC COMMUN (remplace [STYLE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Design proposal sheet for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines, flat saturated fills with 2-3 tone cel shading, fur drawn in tufts, visible chunky pixel texture, clean readable silhouettes, light from the upper left. Strict side view. Canvas 1536 x 1024 px, fully transparent background, exactly ONE horizontal row of THREE animals in three invisible cells of 512 px, each animal whole, standing on all fours, facing RIGHT, feet on the same baseline, at least 40 px of empty space between animals, all three at the same drawing scale. Appealing, well-proportioned, expressive heads. Glowing moonlit-green eyes (#8fe3b8, no pupil). No clothing, no cloak, no accessory. No text, no letters, no arrows, no frame, no ground line, no cast shadow.


1) docs/production/controles/lot_14/propositions/ours_hibou_v3.png (1536 x 1024, 3 propositions)
L'ours-hibou, troisième essai. L'utilisateur a RETENU le corps de la proposition C de la planche précédente (ours_hibou_v2.png, l'animal de droite) : un ours énorme et voûté, épaules plus hautes que la tête, manteau de plumes sombres à pointes lumineuses sur les épaules, les bras et le dos. Mais sa TÊTE était « horrible » (une tête d'ours avec un bec collé au bout). Ici : le MÊME CORPS dans les trois cases, avec TROIS TÊTES DIFFÉRENTES et TROIS JEUX DE COULEURS DIFFÉRENTS.
Obligatoire dans les trois, et absent de la planche précédente : (1) des OREILLES DE HIBOU, deux grandes aigrettes de plumes bien visibles, PAS d'oreilles rondes d'ours ; (2) des plumes sur l'ARRIÈRE des pattes avant, de l'épaule au poignet, qui pendent comme une petite AILE repliée.
Prompt :
[STYLE]
THREE PROPOSALS FOR AN OWLBEAR, the most imposing bear of its family. THE BODY IS THE SAME IN ALL THREE: copy the body of the rightmost creature of the reference ours_hibou_v2.png: a huge hunched bear, shoulders higher than the head, thick fur, four massive bear legs with big clawed paws, a mantle of dark layered feathers with glowing tips over the shoulders and back. In all three: TWO TALL OWL EAR TUFTS made of feathers (no round bear ears), and long feathers on the BACK EDGE of each front leg from shoulder to wrist, hanging like a small folded wing. It does not fly. WHAT CHANGES: the HEAD and the COLORS. Each head must be handsome, coherent and expressive, never a bear face with a beak glued on.
Proposal A (left) - NIGHT VIOLET, WISE HEAD: night-violet and slate-blue fur (#3a3558, #56507a), feather tips glowing moonlit green (#8fe3b8). HEAD: a broad noble bear head whose whole muzzle is one smooth, short, curved beak of dark horn that flows out of the fur of the cheeks (like a tortoise or parrot beak, upper and lower jaw), heavy feathered brows that sweep up into the two ear tufts, calm deep-set eyes.
Proposal B (middle) - MIDNIGHT BLUE, OWL-EYED HEAD: deep midnight-blue and teal fur (#1f2f4a, #2f5566), feather tips glowing pale silver-white (#e6f1ff). HEAD: a rounder bear head with a short snout, two large round expressive eyes ringed by a dark feather mask (around the eyes only, not a full owl disc), a small neat pale beak between them, tall pointed ear tufts; alert, almost gentle.
Proposal C (right) - CHARCOAL AND ROSE, MASKED HEAD: charcoal-black fur (#24222c, #3a3742), feather tips glowing rose pink (#ff9fc9). HEAD: a fierce bear head wearing a natural bone-white beak that covers the muzzle and rises between the eyes like a mask (part of the animal, not an object), narrow glowing eyes, long ragged ear tufts swept backward; a wild guardian spirit.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three owlbears in one row: same body, three different heads and color schemes.

2) docs/production/controles/lot_14/propositions/grizzly_v2.png (1536 x 1024, 3 propositions)
Le grizzly : la forme qui CHARGE et percute. Un colosse, bien plus massif que l'ours brun. Trois designs différents ; A reste proche du dessin actuel, B et C sont de nouvelles idées. Aucun ne doit ressembler à un ours brun ordinaire.
Prompt :
[STYLE]
THREE DIFFERENT DESIGNS FOR A GRIZZLY, a colossal bear built to charge and ram: a giant barrel chest, enormously broad shoulders, thick legs. Three different animals: different colors, markings, heads and silhouettes.
Proposal A (left) - SILVERTIP: the design of the reference ref_v2/grizzly.png on a heavier body: near-black charcoal coat (#24222c, #34323f), a bright silver mane over the shoulders and spine, an ash-grey muzzle, a pale scar across the muzzle, pale bone claws. Square and massive like a wall.
Proposal B (middle) - GOLDEN HUMP: a true wild grizzly: dark coffee-brown legs and belly (#3a2416), a huge shoulder hump and back frosted with pale gold-blond guard hairs (#d9b46a), a wide dished face with a pale blond muzzle, small round ears set far apart, very long ivory claws. Front-heavy like a bison, head carried low.
Proposal C (right) - IRONHEAD: slate-grey and steel-blue coat (#4a5360, #6b7684) with darker charcoal stripes across the shoulders, a massive head with a thick bony brow ridge and a broad flat forehead made for ramming, one torn ear, a short dark bristling crest along the neck (no long mane), heavy dark claws. The tallest at the shoulder, deep chest, lean waist.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three grizzlies in one row, clearly three different animals.

3) docs/production/controles/lot_14/propositions/ours_brun_v2.png (1536 x 1024, 3 propositions)
L'ours brun : le premier ours du jeu (talisman du chef), celui qui frappe le sol de sa patte. Un ours MOYEN, sympathique mais puissant, nettement plus petit et moins massif que le grizzly : chacun n'occupe qu'environ les deux tiers de la hauteur de sa case. Trois designs différents ; A reste proche du dessin actuel.
Prompt :
[STYLE]
THREE DIFFERENT DESIGNS FOR A FOREST BROWN BEAR, a MEDIUM-SIZED, friendly but strong bear, clearly smaller and lighter than a grizzly: each one fills only about two thirds of its cell height. Three different animals: different colors, markings, heads and silhouettes. No mane, no hump.
Proposal A (left) - CHESTNUT: the design of the reference ref_v2/ours_fracas.png, a little smaller: warm chestnut and honey fur (#6b4226, #8a5a34, #b07a48), a paler honey muzzle, a big round head, round ears, dark claws. Round and compact.
Proposal B (middle) - CINNAMON: light cinnamon and sandy-blond fur (#b9824a, #dcae72) with dark chocolate legs, ears and a dark mask around the eyes, a longer narrower muzzle, a leaner body with longer legs; young and agile.
Proposal C (right) - DARK HONEY-COLLAR: deep dark chocolate fur (#3c2616, #55381f) with a wide honey-gold crescent collar across the chest and throat and honey-gold paws, a short broad muzzle, small ears, a low stocky body with very thick forearms: a bear made to slam the ground.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three brown bears in one row, clearly three different animals.

4) docs/production/controles/lot_14/propositions/ours_polaire_v2.png (1536 x 1024, 3 propositions)
L'ours polaire : il se dresse sur ses pattes arrière puis retombe, et la glace jaillit du sol (la glace est dessinée par le jeu : AUCUNE glace, aucun cristal, aucun givre sur l'animal). Trois designs différents. Dos en fourrure propre dans les trois (pas de plaque mouchetée).
Prompt :
[STYLE]
THREE DIFFERENT DESIGNS FOR A POLAR BEAR, a big powerful bear of the cold. Three different animals: different colors, markings, heads and silhouettes. In all three the back is clean fur: no frost patch, no speckled area, no ice, no icicles, no crystals anywhere.
Proposal A (left) - PURE WHITE: snow-white fur with pale ice-blue shadows (#f2fbff, #cfe8ff, #7fa8d8), black nose and claws, a long neck and a small elegant head, a long smooth back, short sleek fur. The natural polar bear.
Proposal B (middle) - IVORY MANE: warm ivory and cream fur (#f4ead2, #d9c7a0) with a long shaggy mane on the neck, shoulders and forelegs, a broad heavy head with a darker grey-brown muzzle, grey paws. Massive, old and battle-worn.
Proposal C (right) - GLACIER: white fur that darkens toward the legs, the muzzle and the ears into deep glacier blue-grey (#f2fbff fading to #4f6f9a), like an arctic fox's gradient, a short thick neck, a high rump, very massive forelegs, short dense fur.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three polar bears in one row, clearly three different animals.

À LA FIN
- Ne fais ni commit ni push.
- Termine par un bilan court en français : pour chaque planche, le fichier écrit, sa taille en pixels, si les trois propositions sont bien distinctes, et pour l'ours-hibou si les aigrettes et les plumes des pattes avant sont présentes sur les trois.
```

## Après la génération

`python tools/codex_prompt.py 14b` puis lancement de Codex (skill `codex-images`). Chaque planche est
étiquetée (`python tools/planche_abc.py <planche> "Titre"`) et envoyée à l'utilisateur. Son choix
(« ours-hibou B avec les couleurs de A »…) est reporté dans `PROMPT_CODEX_14.md` avant de lancer les
feuilles d'animation, avec la proposition retenue jointe en référence.
