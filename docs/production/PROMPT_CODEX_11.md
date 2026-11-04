# Prompt Codex n°11 — morsure du loup, branches du grand arbre, Agarica au repos (2026-11-04)

Trois besoins :
- un effet de morsure pour le loup, au niveau de finition de l'arc de l'épée (`vfx_slash`) ;
- de vraies branches reliées au tronc dans les zones du grand arbre (arène de Kainati en priorité, racines, épreuve du singe), à la place des rectangles de terre ;
- Agarica qui s'assoit près du feu de camp, puis reste assise et respire.

**6 images** à générer, **8 entrées** de manifeste, déjà ajoutées à `src/data/asset_manifest.js`. Tant qu'une image manque, le jeu n'en a pas la texture : l'intégrateur garde l'affichage actuel.

## Récapitulatif

| # | Image source | Taille | Découpe | Entrées du manifeste |
|---|---|---|---|---|
| 1 | `assets/vfx/vfx_croc.png` | 1536x1024 | 1 rangée x 5, grille | `vfx_croc` (`ASSET_MANIFEST`) |
| 2 | `assets/_codex_src/branches_milieu_fourche.png` | 1536x1024 | 2 bandes de 512 px | `branche_milieu`, `branche_fourche` (`ITEM_MANIFEST`) |
| 3 | `assets/_codex_src/branches_base_bout.png` | 1536x1024 | 2 bandes de 512 px | `branche_base`, `branche_bout` (`ITEM_MANIFEST`) |
| 4 | `assets/_codex_src/tronc_segment.png` | 1024x1536 | image unique | `tronc_segment` (`ITEM_MANIFEST`) |
| 5 | `assets/_codex_src/tronc_base.png` | 1536x1024 | image unique | `tronc_base` (`ITEM_MANIFEST`) |
| 6 | `assets/sprites/agarica_repos.png` | 1536x1024 | 2 rangées x 4, silhouettes | `agarica_repos` (`ASSET_MANIFEST`) |

Les images finales des pièces vont dans `assets/decors/elements/`.

## Feuilles animées : ce que le code attend (ne pas changer les noms ni les nombres de frames)

| Rangée (manifest) | Image | Anim | Frames | fps | Usage en jeu |
|---|---|---|---|---|---|
| 0 | `vfx_croc.png` | `bite` | 5 | 20, une fois | morsure devant la gueule du loup, vers la droite (`flipX` pour la gauche). Fermeture complète à la frame 2. Échelle 0,34, `align: center` |
| 0 | `agarica_repos.png` (rangée 1) | `sit` | 4 | 8, une fois | elle s'assoit. Frame 0 **debout neutre** (cale la feuille, voir plus bas), frame 3 = première frame de `sit_idle` |
| 1 | `agarica_repos.png` (rangée 2) | `sit_idle` | 4 | 4, en boucle | assise, calme, elle respire. Le bas du corps ne bouge pas |

Ce tableau numérote les frames à partir de 0, comme le code ; le prompt les compte à partir de 1.

**Échelle d'Agarica** : les planches d'`agarica_extra` ne sont pas toutes à la même échelle (mesuré : `talk` 283-290 px, `cast` 235-250 px, `receive_item` 329-337 px). Le jeu calibre chaque feuille sur l'idle. La référence de ce lot est `agarica_extra_p3.png` (`cast`) : **environ 250 px debout**, soit environ 180 px assise (même rapport que `sad` / `talk` sur `agarica_extra_p2.png`).

**Pourquoi la frame 0 de `sit` est debout** : `manifestSheetScale` calibre toute la feuille sur ses frames les plus hautes. Sans frame debout, la pose assise serait prise pour la hauteur debout, et Agarica assise s'afficherait aussi grande que debout.

## Branches et tronc : dimensions et ligne de marche

| Pièce | Image finale (px source) | À l'échelle 0,25 (px écran) | Partie marchable | Ligne de marche (rangée depuis le haut de l'image) | Origine Phaser |
|---|---|---|---|---|---|
| `branche_milieu` | 1536 x 512, tuilable en largeur | 384 x 128 (6 cases) | toute la largeur | **256** | `(0, 0.5)` |
| `branche_fourche` | environ 1024 x 512 | 256 x 128 (4 cases) | toute la largeur (branche basse) ; le bras haut est un décor | **256** | `(0, 0.5)` |
| `branche_base` | environ 640 x 512 | 160 x 128 | les 384 px de droite ; les 256 px de gauche recouvrent le tronc | **256** | `(1, 0.5)` |
| `branche_bout` | environ 448 x 512 | 112 x 128 | les 320 px de gauche ; puis la pointe | **256** | `(0, 0.5)` |
| `tronc_segment` | environ 768 x 1536, tuilable en hauteur | 192 x 384 (3 x 6 cases) | aucune | sans objet | `(0.5, 0)` |
| `tronc_base` | environ 1400 x 1024 | 350 x 256 | aucune | ligne de sol : **960** | `(0.5, 0.9375)` |

- **Ligne de marche des 4 branches : rangée 256 sur 512, le milieu exact de l'image.** Le dessus de la mousse y est posé. Pour l'intégration : `setOrigin(x, 0.5)` et `y` = surface de la plateforme (haut de la hitbox, là où Agarica pose les pieds), quelle que soit l'échelle.
- Dessous de l'écorce : rangée 480, soit 224 px d'épaisseur (56 px à 0,25, pour une hitbox de 64 px). Rien sous la rangée 496.
- **Déclaration** : `norm: { mode: "height", value: <hauteur de la case>, trim_x: true }`. Vérifié sur des images de test avec `planche_cells` et `normalize` de l'importeur : pas de rognage vertical, pas de redimension, pixels identiques, ligne de marche inchangée. Le mode `fit` ou `trim` rognerait le haut à la touffe de mousse la plus haute, et la ligne de marche changerait d'une pièce à l'autre.

## Prompt à coller dans Codex

```
Nouvelle commande d'images pour « Legend of Agarica » (prompt n°11) : 6 images, toutes déjà déclarées dans src/data/asset_manifest.js (vfx_croc, branche_milieu, branche_fourche, branche_base, branche_bout, tronc_segment, tronc_base, agarica_repos).

RÈGLES
- Ne modifie ni `src/` ni le manifeste `src/data/asset_manifest.js` : les entrées y sont déjà. N'édite pas non plus tools/import_codex_assets.py.
- Ne régénère et ne retouche aucune image existante.
- Fond transparent partout (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre.
- Feuilles animées : une rangée = une animation, nombre de frames EXACT, frames séparées d'au moins 40 px, rangées d'au moins 60 px. Tourné vers la DROITE (le code retourne l'image pour la gauche).
- agarica_repos : une silhouette connexe par frame, aucune particule détachée. Les particules ne sont autorisées que dans la feuille vfx_croc.
- Lueurs de vfx_croc : vrai dégradé d'alpha. Si tu ne sais pas produire un alpha doux, dessine sur fond NOIR PUR #000000 (jamais gris, blanc ou damier) et signale-le dans le rapport.
- Pièces de branches et de tronc : respecte les rangées et les largeurs indiquées, le jeu s'y cale sans autre réglage. La génération ne tombera pas juste au pixel : finition mécanique autorisée (translation, recadrage, mise à l'échelle uniforme, raccord par couture), jamais de dessin produit par code. Tu peux générer chaque pièce à part, la branche sortant du cadre du côté du raccord, puis assembler la planche par script, à condition de garder la même épaisseur partout. Fonctions réutilisables (à importer, sans modifier le fichier) : `seam_cut`, `join_seam`, `make_periodic` de tools/import_codex_assets.py ; `montage` de docs/production/lot_8.py pour la mesure des raccords.
- Commence par branche_milieu : elle sert ensuite de référence de matière et d'épaisseur pour les 3 autres pièces et pour le tronc.

RÉFÉRENCES À JOINDRE
- vfx_croc : assets/vfx/vfx_slash.png (finition, couleurs, lueur, petits éclats en feuille) ; assets/sprites/loup_frames/loup_row0_0.png (gabarit de la gueule : le loup n'est PAS dessiné).
- Branches et tronc : assets/decors/tuiles_ecorce_frames/dirt_c.png et dirt_t.png (écorce et mousse des sols voisins) ; assets/decors/fonds/fond_grand_arbre.png (allure des grosses branches noueuses, ambiance de nuit) ; assets/decors/elements/decor_pont_tronc.png (dessus plat et moussu).
- agarica_repos : assets/ui/portraits/agarica.png (couleurs) ; assets/sprites/agarica_extra_p3.png (rangée « cast » : ÉCHELLE, environ 250 px debout) ; assets/sprites/agarica_extra_p2.png (rangée « talk » : debout ; rangée « sad » : assise par terre, mais ici sans capuche et sereine).

BLOCS COMMUNS (remplace [STYLE], [ECORCE], [BANDES], [AGARICA] et [PERSO] par le bloc complet ci-dessous, dans chaque prompt)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).

[ECORCE] =
MATERIAL: the ancient gnarled bark of the Great Tree, matching the existing bark tiles: knobby, deep flowing grooves, a few knots. Colors: base #4a2c28 and #5a3028, lit planes #6b3d2a and #7a4a30, grooves #2a1818, near-black outline, and a cool violet-indigo shade (#2a2448) on the shadow side so it sits in the moonlit night. The bark stays DARK so characters read clearly in front of it. MOSS: a soft cushion of moss (#588828, #789818) with tiny moonlit-green highlights (#8fe3b8) and a few very small rose-pink lichen dots (#ff9fc9). No mushrooms, no large plants, no vines, no creatures.

[BANDES] =
BRANCH SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha). Two invisible horizontal bands of EXACTLY 512 px each: band 1 = rows 0 to 511, band 2 = rows 512 to 1023. ONE piece per band; nothing crosses into the other band. All pieces belong to the SAME branch, at the SAME scale, drawn with the trunk side on the LEFT and the tip side on the RIGHT. Rows below are counted from the TOP OF THE BAND:
- WALK LINE = row 256. The top of the moss lies on this line and is nearly FLAT: within 4 px above or below it on every walkable part. It must read clearly as a surface to walk on.
- Above the walk line, on walkable parts: only a few short moss tufts and tiny fern sprigs, at most 24 px tall, covering less than a quarter of the width.
- The moss cushion is 24 to 40 px thick, with short rounded drips over the bark, at most 80 px below the walk line.
- BARK UNDERSIDE = row 480, within 12 px (branch thickness 224 px). Below it: only short hanging moss or root wisps, ending above row 496.
- JUNCTION EDGE: a perfectly vertical cut with NO dark outline on that side. Bark, grain and moss run straight off the cut, with the top on row 256 and the underside on row 480. Within 40 px of a junction edge: no tuft, no drip, no wisp, no knot.
No cast shadow, no ground, no text, no grid lines, no borders.

[AGARICA] =
AGARICA (the heroine): a petite teenage female druid, chibi proportions (about 2.5 to 3 heads tall), pointed elf ears, big green eyes, short messy LIGHT AUBURN hair (warm light auburn / copper-chestnut, base colour #B5613A, NOT bright red), dark-green hooded cape embroidered with leaf and vine patterns and closed by a round silver clasp at the collar, sleeveless beige tunic, brown belt with a gold buckle, dark grey trousers, brown leather boots, black fingerless mittens, a pink-red spiral tattoo on her bare upper arm, a small silver dagger sheathed on her belt. Soft anime cel-shaded chibi look, same design as the existing game sprite.

[PERSO] =
SPRITE SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal rows; each row is ONE animation of 4 frames, read left to right. Each row is a band about 512 px tall; frame cells are 384 px wide; each pose is centered in its cell with the lowest point on the same baseline within a row. Leave at least 40 px of empty space between neighboring frames and at least 60 px between rows. Every frame is ONE single connected silhouette; NO detached particles, sparkles, dust, motion lines, NO cast shadow, NO ground line, NO campfire. Same character, same scale, same colors in every frame. The character faces RIGHT. No text, no grid lines, no borders.


1) assets/vfx/vfx_croc.png (1536 x 1024, 1 rangée de 5 frames, cases de 307 px)
Tailles : environ 230 px de large dans toutes les frames, environ 200 px de haut grande ouverte (80 x 70 px à l'écran, à l'échelle 0,34).
L'import rogne chaque frame à sa boîte visible, puis la centre : garde la boîte de chaque frame centrée sur le même point (le milieu de la ligne de morsure), avec les éclats répartis de part et d'autre, sinon l'effet sautille.
Prompt :
Magical VFX for 'Legend of Agarica', same finish as the reference vfx_slash.png: luminous white core, mint edges (#b0f0d0, #8fe3b8), emerald rim (#30b070), soft glow in real alpha, NO near-black outline.
EFFECT SHEET LAYOUT RULES: canvas 1536 x 1024 px, fully transparent background (alpha), NO dark backdrop. Exactly 1 horizontal row of 5 frames, vertically centered on the canvas, read left to right, in cells 307 px wide. Each frame is CENTERED in its cell and stays fully INSIDE it with at least 30 px of margin. Particles may be separate pieces, but every piece of a frame stays inside that frame's cell. Same scale and same palette in every frame. No wolf, no character, no ground, no scenery, no text, no grid lines.
SUBJECT: a magical BITE seen from the side, biting toward the RIGHT, as if an invisible wolf snapped its jaws just in front of its muzzle. Two rows of pale fangs (ivory white #f4fff6, shaded #bfead2): the upper row points down, the lower row points up. Each row is a thin crescent of light with 5 sharp fangs growing out of it, the biggest canine at the RIGHT end, the smallest at the LEFT end. The two rows are mirror images and keep the same width in every frame (about 230 px). A curved stroke of moonlit green (#8fe3b8, white core) accompanies the bite.
Frame 1: rows wide open, about 90 px between the fang tips, thin and about 60 percent opaque, faint glow, just appearing.
Frame 2: rows closing fast, about 40 px between the tips, fully opaque; a moonlit-green stroke hugs the outer edge of each row.
Frame 3: IMPACT. The fangs interlock on the horizontal mid-line, no gap, the brightest frame; a sharp moonlit-green stroke crosses along the bite line (at most 247 px long), a small burst of leaf-shaped green shards on both sides and one or two tiny rose-pink sparks (#ff9fc9).
Frame 4: rebound. The rows reopen slightly (about 16 px between the tips), about 75 percent opaque, thinner stroke, shards drifting apart.
Frame 5: fading. Ghost of both rows at about 35 percent opacity, a thin fading line, the last shards.
Output: one PNG, 1536 x 1024 px, transparent background, 1 row of 5 frames.
Puis : python tools/import_codex_assets.py --only vfx_croc

2) assets/_codex_src/branches_milieu_fourche.png (1536 x 1024, 2 bandes de 512 px)
Bande 1 : branche_milieu, tuilable en largeur. Bande 2 : branche_fourche.
Contrôle de raccord en LARGEUR de branche_milieu : colle deux copies côte à côte. En cas de couture : décale d'une demi-largeur (numpy.roll), raccorde la couture qui se trouve alors au milieu (seam_cut), remets en place.
Le bord gauche et le bord droit de branche_fourche reprennent exactement les colonnes de bord de branche_milieu (raccord par couture sur les 40 dernières colonnes).
Prompt :
[STYLE]
[ECORCE]
[BANDES]
Band 1 - BRANCH MIDDLE (TILEABLE): a straight, level section of a huge old branch, spanning the FULL canvas width, touching the left edge and the right edge, SEAMLESSLY TILEABLE HORIZONTALLY: the left and right edges match exactly in shape, height and colour, so copies placed side by side show no seam. Both side edges are JUNCTION EDGES, fully opaque in the bark and moss. Bark grain runs along the length, 3 or 4 irregular knots and bulges, walkable over its whole length.
Band 2 - BRANCH FORK: the same branch splitting in two, about 1024 px wide, centered in its band (transparent space on both sides). Left and right sides are JUNCTION EDGES: the lower limb runs straight and level from one to the other, walkable over its whole length, with the moss surface on the walk line uninterrupted. The upper limb grows from BEHIND the lower limb at about 40 percent of the width, slightly darker, rising toward the upper right at about 25 degrees, about 110 px thick at its start and tapering to a pointed tip with two or three small leaves touching it, with moss along its top. Its tip stays at least 20 px below the top of the band. A clear V-shaped crotch between the two limbs.
Output: one PNG, 1536 x 1024 px, transparent background, 2 bands.
Puis : python tools/import_codex_assets.py --only branche_milieu branche_fourche

3) assets/_codex_src/branches_base_bout.png (1536 x 1024, 2 bandes de 512 px)
Bande 1 : branche_base (sort du tronc). Bande 2 : branche_bout (pointe).
Le bord droit de branche_base et le bord gauche de branche_bout reprennent exactement les colonnes de bord de branche_milieu (raccord par couture sur les 40 dernières colonnes).
Prompt :
[STYLE]
[ECORCE]
[BANDES]
Band 1 - BRANCH ROOT, where the branch grows out of the trunk (the trunk is off to the LEFT and NOT drawn): about 640 px wide, centered in its band. The RIGHT side is a JUNCTION EDGE. The rightmost 384 px are walkable, flat on the walk line. Further left the branch flares out like a strong shoulder, widening upward and downward: at its left end it is about 420 px tall, rising up to about 190 px above the walk line and ending above row 496. The leftmost 256 px will be drawn ON TOP of the trunk: this left end has NO dark outline and breaks into irregular tongues of bark, with grooves that curve upward and downward as if merging into a vertical trunk.
Band 2 - BRANCH TIP: about 448 px wide, centered in its band. The LEFT side is a JUNCTION EDGE. The leftmost 320 px are walkable, flat on the walk line. Over the last 128 px the underside rises to meet the top and the top curves down by at most 24 px, ending in a pointed tip with two or three small leaves touching it and a little hanging moss.
Output: one PNG, 1536 x 1024 px, transparent background, 2 bands.
Puis : python tools/import_codex_assets.py --only branche_base branche_bout

4) assets/_codex_src/tronc_segment.png (1024 x 1536)
Segment TUILABLE en hauteur. Contrôle de raccord en HAUTEUR : colle deux copies l'une au-dessus de l'autre. Même correction que pour branche_milieu, sur l'axe vertical.
Prompt :
[STYLE]
[ECORCE]
A vertical section of the trunk of the Great Tree, perfectly vertical and running from the VERY TOP edge to the VERY BOTTOM edge of the canvas, SEAMLESSLY TILEABLE VERTICALLY: the top and bottom edges match exactly, so copies stack without a seam, and nothing is cut by these edges unless it continues on the other side. The trunk body is 768 px wide, centered on x = 512 (left side about x = 128, right side about x = 896); the sides may wobble by 16 px but return to the same x at the top and at the bottom. Thick near-black outline on the left and right sides only, no outline on the top and bottom. Rounded volume: darker toward both sides. Bark grain runs vertically: deep grooves, 2 or 3 knots, vertical patches and streaks of moss. No branches, no holes, nothing sticking out of the silhouette, at least 90 px of transparent space on both sides. Nothing else on the canvas.
Output: one PNG, 1024 x 1536 px, transparent background.
Puis : python tools/import_codex_assets.py --only tronc_segment

5) assets/_codex_src/tronc_base.png (1536 x 1024)
Le haut de la pièce reprend exactement le bas de tronc_segment (raccord par couture sur 40 rangées : transpose les images pour utiliser seam_cut).
L'import ne rogne qu'à gauche et à droite : garde les racines symétriques autour de l'axe du tronc en étendue (à 8 px près), pour que l'axe reste au milieu de l'image finale. Note l'axe mesuré dans le rapport.
Prompt :
[STYLE]
[ECORCE]
The FOOT of the same trunk. At the VERY TOP edge of the canvas the trunk body is exactly as in the trunk segment: 768 px wide, centered on x = 768, cut by a straight horizontal line with no outline on the top. Going down, the trunk flares out and splits into 5 to 7 big gnarled roots that spread to the left and to the right like fingers, thinning to points, reaching about x = 68 on the left and about x = 1468 on the right. The roots are not the same on both sides, but they reach equally far. GROUND LINE = row 960: the lower edge of the trunk and roots rests on this line; below it only blunt root ends sinking into the ground, ending above row 1005. Moss on top of the roots. No ground, no grass, no rocks, no shadow, no vines. Nothing else on the canvas.
Output: one PNG, 1536 x 1024 px, transparent background.
Puis : python tools/import_codex_assets.py --only tronc_base

6) assets/sprites/agarica_repos.png (1536 x 1024, 2 rangées de 4 frames, cases 384 x 512)
Mêmes échelle et rendu que agarica_extra_p3.png : environ 250 px debout, environ 180 px assise.
L'import rogne chaque frame à sa boîte visible et la centre : les bottes et le pan de cape au sol doivent être les mêmes dans les 4 frames de sit_idle, sinon elle tremble.
Prompt :
[STYLE] Characters are chibi-proportioned (about 2.5 to 3 heads tall) with anime-influenced faces.
[AGARICA]
[PERSO]
SEATED POSE (used in row 2, and in the last frame of row 1): she sits on the ground in profile, facing RIGHT toward a campfire that is NOT drawn: legs bent with knees up, boots flat on the ground in front of her on the right, hands resting on her knees, back slightly rounded, head up, hood DOWN, cape pooled on the ground behind her on the left, reaching as far to the left as the boots reach to the right, so that her hips stay in the middle of the cell. Soft half-closed eyes, gentle smile, at peace. About 180 px tall, about 220 px wide. Boots, hips and cape rest on the same baseline.
Row 1 - "sit" (she sits down, played once), 4 frames.
Frame 1: STANDING NEUTRAL, full height about 250 px, arms relaxed at her sides, no raised arm, no gesture, looking to the right, feet on the baseline.
Frame 2: knees bending, torso leaning slightly forward, one hand reaching down toward the ground, the cape starting to settle.
Frame 3: almost seated, one hand on the ground, knees up, the cape spreading on the ground behind her.
Frame 4: the SEATED POSE, exactly the same picture as row 2 frame 1.
Row 2 - "sit_idle" (seated, calm, breathing, looping), 4 frames, all in the SEATED POSE. Only the head, shoulders, chest and upper arms move. Boots, legs, hips and the cape on the ground are IDENTICAL in all 4 frames.
Frame 1: breath out, the base pose.
Frame 2: breathing in, shoulders and chest raised by about 3 px.
Frame 3: top of the breath, head and shoulders raised by about 5 px, eyes softly closed.
Frame 4: breathing out, shoulders raised by about 2 px, eyes half closed again.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows, 4 / 4 frames.
Puis : python tools/import_codex_assets.py --only agarica_repos

À LA FIN
Contrôles, sur les fichiers finaux après import (montages dans docs/production/controles/lot_11/) :
- raccord_branche_milieu.png (2 copies côte à côte) et raccord_tronc_segment.png (2 copies l'une au-dessus de l'autre) : aucune couture visible, `edge_rgba_max_difference` ≤ 3 (fonction `montage` de docs/production/lot_8.py).
- assemblage_branche.png : branche_base + branche_milieu + branche_fourche + branche_milieu + branche_bout mis bout à bout, sur fond violet nuit #15101f, avec une ligne rouge de 1 px sur la rangée 256, et assets/sprites/agarica_extra_frames/agarica_extra_row4_0.png posée dessus à 344 px de haut (86 px à l'écran, divisés par 0,25), pieds sur la ligne. Aucune encoche, aucun saut de hauteur ni de couleur aux raccords.
- assemblage_tronc.png : 2 x tronc_segment + tronc_base en dessous, avec une branche_base à droite du tronc, ses 256 px de gauche posés sur le tronc, et sa copie en miroir à gauche. L'écorce se fond dans le tronc, aucune découpe visible.
- Pour chaque branche, mesure la ligne de marche : médiane, sur la partie marchable, de la première rangée d'alpha > 128 par colonne (branche_base : 384 px de droite ; branche_bout : 320 px de gauche ; branche_fourche : hors colonnes du bras haut). Attendu : 256, à 4 px près. Mesure aussi le dessous de l'écorce (attendu : 480, à 12 px près).
- Images finales : branche_milieu fait exactement 1536 x 512 ; branche_fourche, branche_base et branche_bout font 512 de haut ; tronc_segment fait 1536 de haut ; tronc_base fait 1024 de haut.
- vfx_croc : EXACTEMENT 5 frames, aucune frame ne touche le bord de sa case (pas d'avertissement à l'import), la morsure ne saute pas d'une frame à l'autre.
- agarica_repos : EXACTEMENT 4 + 4 frames, connexes ; sit frame 1 mesure environ 250 px de haut et sit_idle environ 180 px ; sit frame 4 est identique à sit_idle frame 1 ; les bords gauche et droit des 4 frames de sit_idle sont identiques à 2 px près.
Puis :
- lance un python tools/import_codex_assets.py final (il régénère src/data/asset_present.js) ;
- ajoute une section « Lot n°11 » à docs/production/RAPPORT_CODEX.md : une ligne par image (statut, frames ou dimensions finales, raccords Δ, ligne de marche et dessous mesurés pièce par pièce, axe mesuré de tronc_base, lueurs éventuellement livrées sur fond noir) et le rapport du dernier import.
```

## Côté code (après l'import)

Rien n'est branché. Les images sont disponibles sous `item-<id>` ; pour les branches, tester `scene.textures.exists('item-branche_milieu')` et garder les tuiles d'écorce tant qu'elles manquent.

```js
// surfaceY = haut de la hitbox, là où Agarica pose les pieds (cf. GROUND_STAND_SINK).
const k = 0.25;
scene.add.tileSprite(x0, surfaceY, w, 512 * k, 'item-branche_milieu').setOrigin(0, 0.5).setTileScale(k, k);
scene.add.image(x0, surfaceY, 'item-branche_base').setOrigin(1, 0.5).setScale(k);      // raccord à droite, en x0
scene.add.image(x0 + w, surfaceY, 'item-branche_bout').setOrigin(0, 0.5).setScale(k);  // raccord à gauche, en x0 + w
```

- **Sens** : pièces dessinées tronc à gauche, pointe à droite. `setFlipX(true)` et origine X inversée pour une branche qui part vers la gauche.
- **Tuilage** : le raccord est exact quand la largeur du milieu est un multiple de `1536 * k`. Sinon, la silhouette reste continue (dessus et dessous constants sur toute la longueur) et seul le veinage se rompt : recouvrir la jonction de quelques pixels avec la pièce suivante.
- **Tronc** : `branche_base` au-dessus du tronc en profondeur, ses 256 px de gauche (64 px à 0,25) posés sur le fût. Tronc en `tileSprite` à `(0.5, 0)`, avec `setTileScale(k, k)`, et `tronc_base` sous lui, centré sur le même axe (décalage éventuel : voir l'axe mesuré dans `RAPPORT_CODEX.md`).
- **Plancher de l'arène de Kainati** (surface y=448, 92 px visibles) : `k ≈ 0,45`, le dessous de la branche tombe hors écran (448 + 224 x 0,45 ≈ 549 px).
- **Petites plateformes** : deux `branche_bout` dos à dos pour 3 cases (raccord au milieu, chaque pointe dépasse de 16 px à `k = 0,25`). Pour 2 cases, réduire à `k ≈ 0,165`.
- **`branche_fourche`** : le bras haut est un décor, sans collision.
- **`vfx_croc`** : `setOrigin(0.5, 0.5)`, `flipX` pour la gauche. L'animation dure 250 ms, à faire tenir dans la morsure du loup (400 ms, `ANIM_WOLF_ATTACK_KEY`).
- **`agarica_repos`** : `agaricaSheetPoseConfig(scene, 'agarica_repos', 'sit')` donne l'échelle de toute la feuille. Vérifier que `manifestSheetScale` répond `method: 'height'`, et qu'en jeu Agarica assise fait environ 72 % de sa hauteur debout.
