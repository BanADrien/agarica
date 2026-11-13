# Prompt Codex n°14b — propositions de design des ours (2026-11-13)

Demande de l'utilisateur : « fais-moi des propositions de design au lieu de faire les feuilles
d'animation direct ». On choisit d'abord le dessin de chaque ours sur une planche de variantes ;
les feuilles d'animation (prompt n°14) ne se font qu'ensuite, d'après la variante retenue.

**Méthode à garder pour tout nouvel animal** : une planche de 3 DESIGNS VRAIMENT DIFFÉRENTS (trois
idées : couleurs, motifs, tête, silhouette ; jamais trois fois le même dessin avec une autre carrure,
sauf si l'utilisateur a demandé de garder le dessin), une seule pose debout de profil, puis le choix de l'utilisateur (une variante, ou un mélange : « la tête de A, le corps de C »),
puis seulement les animations.

4 planches, une par ours encore en discussion. Le panda est validé (pas de planche).

| # | Image | Ours | Ce qui varie |
|---|---|---|---|
| 1 | `docs/production/controles/lot_14/propositions/ours_hibou_v2.png` | ours-hibou | TROIS DESIGNS différents (couleurs, plumage, tête, silhouette) ; la première planche, trois fois le même animal, a été refusée |
| 2 | `docs/production/controles/lot_14/propositions/grizzly.png` | grizzly | la carrure seulement (dessin et couleurs gardés) |
| 3 | `docs/production/controles/lot_14/propositions/ours_brun.png` | ours brun | la carrure seulement (dessin et couleurs gardés) |
| 4 | `docs/production/controles/lot_14/propositions/ours_polaire.png` | ours polaire | le dos et la silhouette |

Les variantes se lisent de gauche à droite : A, B, C. Les lettres sont ajoutées après coup par
`montage` (aucun texte dans les images générées).

## Prompt à coller dans Codex

```
Commande d'images pour « Legend of Agarica » (prompt n°14b) : 4 PLANCHES DE PROPOSITIONS DE DESIGN. Ce ne sont pas des feuilles d'animation : chaque planche montre TROIS VARIANTES du même animal, dans la même pose, pour que l'utilisateur choisisse.

RÈGLES
- N'écris que dans docs/production/controles/lot_14/propositions/ (crée le dossier). Ne touche à aucun fichier de assets/ ni de src/. Ne lance aucun import.
- Fond transparent (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune flèche, aucun cadre, aucune ligne de sol, aucune ombre portée.
- Chaque planche : 1536 x 1024 px, UNE rangée de 3 cases de 512 px de large. Dans chaque case, UN animal entier, debout sur ses quatre pattes, vu de profil strict, tourné vers la DROITE, pattes posées sur la même ligne dans les trois cases, au moins 40 px de vide entre deux animaux.
- Les trois variantes sont à la MÊME ÉCHELLE de dessin : si l'une est plus massive, elle doit paraître plus grosse sur la planche.
- Les trois variantes doivent être NETTEMENT différentes entre elles sur les points demandés (pas trois fois le même dessin), mais rester le même animal.
- Aucun vêtement, aucune cape, aucun accessoire. Seul rappel de la druidesse Agarica : le regard vert lunaire (#8fe3b8, sans pupille).
- MÊME STYLE GRAPHIQUE pour les quatre planches : celui de docs/production/controles/lot_14/ref_v2/grizzly.png (fourrure en mèches, contour sombre, paliers d'ombre nets, griffes, niveau de détail).

RÉFÉRENCES À JOINDRE
- Style : docs/production/controles/lot_14/ref_v2/grizzly.png.
- Dessins de la livraison précédente : docs/production/controles/lot_14/ref_v2/ours_fracas.png (ours brun), ours_hibou.png, ours_polaire.png, panda.png (validé, pour la cohérence de la famille).

BLOC COMMUN (remplace [STYLE] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Design proposal sheet for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines, flat saturated fills with 2-3 tone cel shading, fur drawn in tufts, visible chunky pixel texture, clean readable silhouettes, light from the upper left. Strict side view. Canvas 1536 x 1024 px, fully transparent background, exactly ONE horizontal row of THREE animals in three invisible cells of 512 px, each animal whole, standing on all fours, facing RIGHT, feet on the same baseline, at least 40 px of empty space between animals, all three at the same drawing scale. Glowing moonlit-green eyes (#8fe3b8, no pupil). No clothing, no cloak, no accessory. No text, no letters, no arrows, no frame, no ground line, no cast shadow.


1) docs/production/controles/lot_14/propositions/ours_hibou_v2.png (1536 x 1024, 3 designs)
L'ours-hibou, deuxième essai. La première planche (ours_hibou.png) est REFUSÉE : trois fois le même animal, et une tête de rapace. Ici, TROIS DESIGNS VRAIMENT DIFFÉRENTS : trois idées d'animal, avec des couleurs, des plumages, des têtes et des silhouettes différentes. Ne varie pas seulement la carrure.
Commun aux trois : c'est un OURS (corps, fourrure, quatre grosses pattes à griffes), le plus imposant de sa famille ; une vraie TÊTE D'OURS (crâne rond, joues, front, petits yeux d'ours) où seul le bout du museau est remplacé par un bec ; des aigrettes de hibou à la place des oreilles ; des plumes sur l'arrière des pattes avant, comme de petites ailes. Il ne vole pas.
Prompt :
[STYLE]
THREE COMPLETELY DIFFERENT DESIGNS OF AN OWLBEAR: three different creatures, not one creature drawn three times. They must differ in COLORS, in PLUMAGE PATTERN, in HEAD and in SILHOUETTE. Common to all three: a huge heavy BEAR covered in fur, four massive bear legs with big clawed paws, a short bear tail. THE HEAD IS A BEAR'S HEAD: a round furry bear skull with a bear's forehead, cheeks and small eyes set like a bear's (glowing green); it must NOT be a bird of prey head, NOT an eagle or griffin head. Only the tip of the bear's muzzle is replaced by a beak. Owl ear tufts instead of round ears. Feathers on the back edge of the front legs, like small wings attached to the arms. It does not fly.
Design A (left) - GREAT HORNED OWLBEAR: very dark umber and black-brown fur, mottled with small cream and rust speckles like bark. A short thick dark-grey beak on a broad bear muzzle. Two long horn-like ear tufts pointing up and outward. On the arms, broad rounded feathers barred black and rust, and the same feathers as a heavy cape over the shoulders. The widest and lowest of the three: a boulder of a bear.
Design B (middle) - BARN OWLBEAR: pale golden-buff fur on the back sprinkled with tiny grey dots, pure cream-white belly, chest and legs. A slim ivory beak on a long narrow bear muzzle. Two small soft ear tufts. On the arms, long narrow elegant feathers, golden with white tips, hanging like a folded wing, and a short fan of the same feathers at the tail. The tallest and longest-legged of the three: upright shoulders, a long neck.
Design C (right) - MOON OWLBEAR: night-violet and slate-blue fur (#3a3558, #56507a, shadows #221f38) with a pale crescent-moon mark on the forehead. A hooked silver beak on a heavy square bear muzzle. Two tall swept-back ear tufts. On the arms and along the spine, dark feathers whose tips GLOW moonlit green (#8fe3b8), like runes; a thick feathered ruff around the neck like a lion's mane. The most hunched of the three: shoulders higher than the head, a wild guardian spirit.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three owlbears in one row, clearly three different creatures.

2) docs/production/controles/lot_14/propositions/grizzly.png (1536 x 1024, 3 variantes)
Le grizzly : MÊME DESSIN ET MÊMES COULEURS que la référence ref_v2/grizzly.png (pelage charbon presque noir, crinière d'argent, museau gris cendre, cicatrice sur le museau, griffes claires). Seule la CARRURE change : il doit être imposant, fait pour percuter, bien plus massif que l'ours brun.
Prompt :
[STYLE]
THREE BUILD VARIANTS OF THE SAME SILVERTIP GRIZZLY (copy the design and colors of the reference grizzly.png: near-black charcoal coat #24222c / #34323f, bright silver mane #c3c7d6 / #8e92a6 over the shoulders and spine, ash-grey muzzle, a pale scar across the muzzle, pale bone claws). Only the body build differs. In all three the body mass dominates the silhouette: the mane sits on a huge body.
Variant A (left) - BISON: front-heavy, an enormous shoulder hump as the highest point, a thick neck, a low wedge head, smaller hindquarters, sloping back.
Variant B (middle) - WALL: a square, even block of muscle: very broad chest, flat powerful back, thick legs like pillars front and rear, short tidy mane.
Variant C (right) - CHARGER: taller, longer forelegs, a very deep chest, a lean waist, mane swept backward; built for speed and impact.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three grizzlies in one row.

3) docs/production/controles/lot_14/propositions/ours_brun.png (1536 x 1024, 3 variantes)
L'ours brun (le premier ours du jeu) : MÊME DESSIN ET MÊMES COULEURS que la référence ref_v2/ours_fracas.png (pelage châtaigne et miel #6b4226 / #8a5a34 / #b07a48, museau miel, tête ronde, oreilles rondes). Seule la CARRURE change : un ours MOYEN, nettement plus petit et moins massif que le grizzly. Les trois doivent paraître plus petits que les grizzlis de la planche n°2 (ils n'occupent qu'environ les deux tiers de la hauteur de leur case).
Prompt :
[STYLE]
THREE BUILD VARIANTS OF THE SAME FOREST BROWN BEAR (copy the design and colors of the reference ours_fracas.png: warm chestnut and honey brown fur, paler honey muzzle, big round head, round ears, dark claws). A MEDIUM-SIZED bear, clearly smaller and lighter than a grizzly: each one fills only about two thirds of its cell height. Only the body build differs.
Variant A (left) - ROUND: short and compact, a rounded back, a round belly, short legs.
Variant B (middle) - AGILE: leaner and a little longer-legged, a narrower chest, a lighter step, a younger look.
Variant C (right) - STOCKY: low and wide, very short thick legs, heavy rump, a short neck.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three brown bears in one row.

4) docs/production/controles/lot_14/propositions/ours_polaire.png (1536 x 1024, 3 variantes)
L'ours polaire : fourrure blanche et bleu glacier (#f2fbff, #cfe8ff, ombres #7fa8d8, #3f5f96), truffe et griffes noires. Sur la livraison précédente (ref_v2/ours_polaire.png), son DOS était bizarre : une plaque gris-bleu mouchetée, comme une bosse de givre. À corriger : dos en fourrure blanche, comme le reste. AUCUNE glace, aucun cristal, aucun givre.
Prompt :
[STYLE]
THREE DESIGN VARIANTS OF A POLAR BEAR: white and pale ice-blue fur, black nose and claws, long neck, small head. In all three the BACK is covered in the same plain white fur as the rest of the body: NO frost patch, NO grey-blue speckled area, NO different texture, NO hump of ice. No ice, no icicles, no crystals anywhere.
Variant A (left) - CLASSIC: a long smooth back line, a long neck stretched forward, the natural proportions of a real polar bear, short sleek fur.
Variant B (middle) - SHAGGY: the same proportions with longer, thicker fur in big clean tufts along the back, the neck and the legs, all white.
Variant C (right) - POWERFUL: heavier, a higher rump than the shoulders, a thick neck, massive forelegs, a slightly arched back, short fur.
Output: one PNG, 1536 x 1024 px, transparent background, exactly three polar bears in one row.

À LA FIN
- Ne fais ni commit ni push.
- Termine par un bilan court en français : pour chaque planche, le fichier écrit, sa taille en pixels, et si les trois variantes sont bien distinctes.
```

## Après la génération

`python tools/codex_prompt.py 14b` puis lancement de Codex (skill `codex-images`). Ensuite un montage
étiqueté A / B / C de chaque planche est envoyé à l'utilisateur. Sa réponse (« ours-hibou B avec la
crête de C »…) est reportée dans `PROMPT_CODEX_14.md` avant de lancer les feuilles d'animation, avec
la variante retenue jointe en référence.
