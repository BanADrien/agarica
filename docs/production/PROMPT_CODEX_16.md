# Prompt Codex n°16 — les effets d'attaque du loup (2026-11-15)

Demande de l'utilisateur : « refais les fx du loup avec codex ». Les essais faits par code (pixelfx) n'ont
pas convaincu pour le croc. Modèle donné par l'utilisateur pour le croc : deux rangées de grosses dents
pleines (haut et bas), sans mâchoire dessinée, « de côté et avec des dents de loup ».

**2 images**, deux NOUVELLES feuilles : `assets/vfx/loup_croc_codex.png` (le croc, attaque de base) et
`assets/vfx/loup_griffes_codex.png` (le coup de patte vers le bas). Elles ne remplacent aucun fichier ;
le découpage, le pixel-fixer et le branchement dans le jeu sont faits à part (pas par Codex).

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°16) : 2 images, les effets d'attaque de la forme Loup.

RÈGLES
- Ne modifie ni `src/` ni `src/data/asset_manifest.js`, ni aucun outil de `tools/`. Ne lance AUCUN import : tu écris seulement les fichiers image demandés.
- Ne régénère et ne retouche aucune image existante : les deux fichiers demandés sont NOUVEAUX.
- Fond transparent (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre, aucun sol, aucune ombre, AUCUN personnage, AUCUN loup, aucune tête, aucun museau, aucun œil : seulement l'effet lumineux.
- Ce sont des EFFETS DE LUMIÈRE, pas des objets : PAS de contour noir ni sombre. Formes pleines, nettes, lisibles en tout petit (elles seront affichées à environ 70 px de large).
- Ne commite rien et ne pousse rien.

RÉFÉRENCES À JOINDRE
- L'effet de coup de dague du jeu, À IMITER pour le style, les couleurs et la finition (croissant blanc pur, bord vert clair, petites feuilles vertes arrachées, aucun contour sombre) : assets/vfx/vfx_slash_frames/vfx_slash_row0_0.png, assets/vfx/vfx_slash_frames/vfx_slash_row0_1.png, assets/vfx/vfx_slash_frames/vfx_slash_row0_2.png.
- Le loup qui porte ces attaques (pour l'échelle et l'ambiance seulement, NE PAS le dessiner) : assets/sprites/loup_attaque_frames/loupattaque_row0_1.png.

BLOCS COMMUNS (remplace [STYLE] par le bloc complet ci-dessous)

[STYLE] =
Game VFX sprite sheet for "Legend of Agarica", a 2D side-scrolling dark-fantasy druid platformer. Art style: clean chunky pixel-art visual effect made of light, exactly like the reference dagger-slash effect: solid pure white core shapes (#f2fff7), a thin pale mint inner shade (#c4ffe0), a luminous moonlit green rim (#7dedb0 then #3fc47c, darkest #1f7a4c only on the very edge), hard-edged flat color steps, NO black outline, NO dark outline, NO gradients, NO soft glow, NO blur. A few tiny torn green leaves as secondary particles, like in the reference. Fully transparent background. Strict side view.


1) assets/vfx/loup_croc_codex.png (1536 x 1024, 5 images : 3 en haut, 2 en bas, cases 512 x 512)
Prompt :
[STYLE]
SUBJECT: the spectral BITE of a wolf, shown ONLY as its teeth made of light: an UPPER ROW and a LOWER ROW of big solid wolf teeth, seen from the SIDE (profile of a wolf mouth). No skull, no jaw bone, no lips, no head: just the two rows of teeth, each row joined by a thin green gum line. The mouth OPENS TOWARD THE LEFT: the hinge (back of the mouth, where the two rows meet) is on the RIGHT side of the cell, the front of the mouth with the long canines is on the LEFT.
WOLF DENTITION, from the front (left) to the back (right), on each row: one very LONG, thick, curved CANINE fang (clearly the biggest tooth, about twice as long as the others, curving backward), then a small gap, then three pointed triangular premolars growing slightly bigger, then one large broad carnassial tooth, then a small molar. The lower canine sits just IN FRONT of the upper canine. Teeth are chunky solid white shapes with a mint-green shaded edge, sharp tips, thick bases touching each other.
SPRITE SHEET LAYOUT: canvas 1536 x 1024 px, fully transparent. Top row: 3 cells of 512 x 512 (frames 1, 2, 3). Bottom row: 2 cells of 512 x 512 on the left (frames 4, 5); the bottom-right cell stays EMPTY. Each frame is centered in its cell with at least 50 px of empty margin. The hinge point stays at the SAME place in every cell (about 110 px from the right edge of the cell, vertically centered). Same tooth design and same size in every frame.
THE 5 FRAMES (one fast bite, read left to right, top then bottom):
Frame 1 - WIND-UP: the mouth is WIDE OPEN: the two rows of teeth spread about 60 degrees apart, upper row angled up-left, lower row angled down-left, all teeth clearly visible, canines prominent. Bright white.
Frame 2 - SNAP: the two rows have just slammed shut, horizontal, teeth INTERLOCKING like a zipper (lower teeth fitting between upper teeth, long canines crossing past each other). Everything is at its whitest; a small sharp 4-point white impact star where the canines cross on the left; 3 or 4 thin curved green motion streaks above and below showing the closing movement; a few small green leaves bursting out.
Frame 3 - HOLD: mouth closed, teeth interlocked, same position as frame 2 but calmer: white teeth with their green shading and green gum lines fully visible, no star, 6 to 8 small leaves flying outward up and down.
Frame 4 - FADE 1: same closed bite, but the teeth are thinner and shorter, mostly pale green, gum lines broken into dashes; leaves farther away.
Frame 5 - FADE 2: only short green remnants of the teeth tips and a few dashes and leaves, almost gone.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 5 frames (3 on top, 2 below).

2) assets/vfx/loup_griffes_codex.png (1536 x 1024, 5 images : 3 en haut, 2 en bas, cases 512 x 512)
Prompt :
[STYLE]
SUBJECT: a wolf CLAW SWIPE raking DOWNWARD, shown only as three claw marks made of light. THREE parallel curved slash marks side by side (the three claws), each one thick in the middle and tapering to a sharp point at both ends, raking from the TOP of the cell down to the bottom, leaning slightly toward the RIGHT at the bottom (the wolf attacks downward and forward to the right). The middle mark is the longest. Pure white core, mint and moonlit green rim, no dark outline.
SPRITE SHEET LAYOUT: canvas 1536 x 1024 px, fully transparent. Top row: 3 cells of 512 x 512 (frames 1, 2, 3). Bottom row: 2 cells of 512 x 512 on the left (frames 4, 5); the bottom-right cell stays EMPTY. Each frame centered horizontally in its cell; the TOP of the claw marks starts at the same place in every cell (about 60 px below the top edge of the cell, horizontally centered); at least 40 px of empty margin.
THE 5 FRAMES (one fast swipe):
Frame 1 - START: the three marks have just started: only the top third of each mark is drawn, short and thin, with a bright white pointed tip moving down.
Frame 2 - FULL SWIPE: the three marks at full length and full thickness, brightest white, sharp tips at the bottom, a few small white-green shards and leaves bursting from the bottom tips.
Frame 3 - HOLD: full length, slightly thinner, white core with clear green rim, shards and leaves a little farther.
Frame 4 - FADE 1: the marks thin out into narrow pale green lines, closing from both ends.
Frame 5 - FADE 2: only three short dotted green traces remain, almost gone.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 5 frames (3 on top, 2 below).

À LA FIN
Contrôles sur les fichiers finaux :
- EXACTEMENT 5 images par feuille (3 en haut, 2 en bas à gauche), fond transparent réel, rien d'autre dans l'image.
- Aucun contour noir ou sombre, aucun loup, aucune tête.
- Croc : la gueule s'ouvre vers la GAUCHE, charnière à droite, au même endroit dans les 5 cases ; les canines sont nettement les plus longues dents.
- Griffes : trois marques qui partent du haut de la case et descendent.
N'importe rien, ne modifie aucun autre fichier. Écris un bilan de trois lignes.
```

## Côté code (après la livraison)

Découpe des 5 cases de chaque feuille, réduction au grain du jeu (pixel-perfect, sans lissage), vers
`assets/vfx/vfx_croc_frames/vfx_croc_row0_<0..4>.png` et `assets/vfx/loup_frames/griffes_<0..4>.png`,
puis recalage de `SLASH_ARCS.bite` et de `LOUP_FX.griffes` (Player.js, src/data/loup_fx.js).
