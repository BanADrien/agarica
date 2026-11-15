# Prompt Codex n°17 — la gaine de feu du grizzly en charge (2026-11-15)

Demande de l'utilisateur : quand le passif des ursidés de palier 5 est actif, le grizzly charge enveloppé
d'un effet « rentrée dans l'atmosphère » (ses images de référence : une capsule spatiale, coiffe de plasma
à l'avant, flammèches qui filent vers l'arrière ; « un truc simple et propre »). Les essais faits par code
(carrés, puis pixelfx) n'étaient « pas beaux » : « refais avec un meilleur moyen ».

**1 image**, une NOUVELLE feuille : `assets/vfx/grizzly_feu_codex.png`. Elle ne remplace aucun fichier ;
le découpage, la mise au grain du jeu et le branchement sont faits à part (tools/import_grizzly_feu_codex.py).

## Prompt à coller dans Codex

```
Nouvelle commande d'image pour « Legend of Agarica » (prompt n°17) : 1 image, la gaine de feu du grizzly qui charge.

RÈGLES
- Ne modifie ni `src/` ni `src/data/asset_manifest.js`, ni aucun outil de `tools/`. Ne lance AUCUN import : tu écris seulement le fichier image demandé.
- Ne régénère et ne retouche aucune image existante : `assets/vfx/grizzly_feu_codex.png` est un NOUVEAU fichier.
- Fond transparent (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre, aucun sol, aucune ombre.
- AUCUN ours, AUCUN animal, AUCUN personnage, AUCUN objet : seulement l'effet de feu. L'intérieur de l'effet (là où sera l'ours, ajouté par le jeu) reste VIDE et transparent.
- C'est un EFFET DE LUMIÈRE : PAS de contour noir ni sombre. Formes pleines, nettes, simples, lisibles en petit (l'effet sera affiché à environ 300 px de large).
- Ne commite rien et ne pousse rien.

RÉFÉRENCES À JOINDRE
- Le grizzly qui charge, que l'effet devra envelopper (pour sa FORME et ses PROPORTIONS seulement ; NE PAS le dessiner) : assets/sprites/grizzly_frames/grizzly_row1_1.png. Il court vers la droite, tête basse en avant.
- Pour le style des effets du jeu (couleurs franches, pixel art net, aucun contour sombre) : assets/vfx/vfx_slash_frames/vfx_slash_row0_1.png.

BLOCS COMMUNS (remplace [STYLE] par le bloc complet ci-dessous)

[STYLE] =
Game VFX sprite sheet for "Legend of Agarica", a 2D side-scrolling dark-fantasy druid platformer. Art style: clean chunky pixel-art visual effect made of fire and light: solid white-hot core (#ffffff), pale yellow (#fff3b0), warm yellow (#ffd45a), orange (#ff9a2a), red-orange (#ff5a1a) and a deep red rim (#c8280c) only on the outermost edge. Hard-edged flat color steps like hand-made pixel art, NO black outline, NO dark outline, NO smooth gradients, NO blur, NO smoke, NO soft glow halo. Fully transparent background. Strict side view.


1) assets/vfx/grizzly_feu_codex.png (1536 x 1024, 6 images : 2 colonnes x 3 rangées, cases 768 x 341)
Prompt :
[STYLE]
SUBJECT: an ATMOSPHERIC RE-ENTRY FIRE SHEATH, the plasma shock that wraps the front of a space capsule falling back to Earth, here wrapping a big bear that charges toward the RIGHT. Simple and clean. Drawn WITHOUT the bear: only the fire.
SHAPE (the effect faces RIGHT): 
1. THE BOW SHOCK at the front (right side): one bold, smooth, glowing crescent, like a thick letter "D" outline opened to the left, a rounded cap that would hug the bear's lowered head and chest. It is thickest at its front tip and gets thinner toward its top and bottom ends. Colors from the inside outward: white-hot inner edge, pale yellow, yellow, orange, thin red rim. Its outer edge has a few small pointed flame tongues bending backward.
2. TWO FLAME TRAILS: from the top end and from the bottom end of the crescent, two long tapered flames stream straight BACK toward the left, horizontal and parallel to each other (like the flames that slide along the sides of a re-entering capsule). Each one is thick where it leaves the crescent and narrows to a fine point at its left end; yellow near the crescent, then orange, then red at the tip, with 3 or 4 wispy pointed tongues along its outer edge.
3. THE INSIDE of this "C" shape (a zone about 330 px wide and 210 px tall, where the bear will be) is completely EMPTY and transparent: no fire, no sparks, no haze there.
Overall silhouette: a horizontal bullet / comet shape pointing right, about 640 px wide and 280 px tall, hollow.
SPRITE SHEET LAYOUT: canvas 1536 x 1024 px, fully transparent. 6 frames in a grid of 2 columns x 3 rows; each cell is 768 px wide x 341 px tall; frames read left to right, top to bottom. In EVERY cell the effect has exactly the SAME size and the SAME position: the front tip of the crescent sits about 50 px from the right edge of the cell, and the effect is vertically centered in the cell. At least 25 px of empty margin around it.
THE 6 FRAMES: one looping flicker animation of the SAME shape. The crescent stays in place and keeps the same size; only its small outer flame tongues slide backward a little from frame to frame, and the two trails ripple gently (their tongues travel toward the left, their tips lengthen and shorten slightly). Frame 6 flows back into frame 1. No big change between frames: it must read as one steady, burning sheath.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 6 frames (2 columns x 3 rows).

À LA FIN
Contrôles sur le fichier final :
- EXACTEMENT 6 images (2 colonnes x 3 rangées), fond transparent réel, rien d'autre dans l'image.
- Aucun ours, aucun contour noir ou sombre, aucune fumée, l'intérieur de la forme vide.
- L'effet pointe vers la DROITE, même taille et même place dans les 6 cases.
N'importe rien, ne modifie aucun autre fichier. Écris un bilan de trois lignes.
```

## Côté code (après la livraison)

`python tools/import_grizzly_feu_codex.py` : découpe les 6 cases, les ramène au grain du jeu (alpha net,
petite palette commune), les aligne sur l'avant de la coiffe et écrit `assets/vfx/ursides_feu/grizzly_feu_<i>.png`
et `src/data/grizzly_feu_fx.js` (lus par BootScene et `ursideGrizzlyFire`, src/entities/Ursides.js).
